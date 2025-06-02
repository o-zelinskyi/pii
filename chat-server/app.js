const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost",
      "http://localhost:80",
      "http://localhost/newpiiwithmvc",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost",
      "http://localhost:80",
      "http://localhost/newpiiwithmvc",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    console.log("Please check your MongoDB Atlas credentials in .env file");
  });

// MongoDB Models
const userSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Made email unique as it usually is
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    socketId: { type: String, default: null },
  },
  { timestamps: true }
);

const userStatusSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true, unique: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    currentChatId: { type: String, default: null },
    socketId: { type: String, default: null },
    status: {
      type: String,
      enum: ["online", "away", "busy", "offline"],
      default: "offline",
    },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    chat_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender_id: { type: Number, required: true }, // References MariaDB users.id
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "voice"],
      default: "text",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        user_id: { type: Number, required: true },
        emoji: { type: String, required: true },
      },
    ],
    readBy: [
      {
        user_id: { type: Number, required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    isGroup: { type: Boolean, default: false },
    participants: [
      {
        user_id: { type: Number, required: true },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date, default: null },
      },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastActivity: { type: Date, default: Date.now },
    avatar: { type: String, default: null },
    description: { type: String, default: null },
    settings: {
      muteNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema); // Create User model
const Message = mongoose.model("Message", messageSchema);
const Chat = mongoose.model("Chat", chatSchema); // Create Chat model
const UserStatus = mongoose.model("UserStatus", userStatusSchema);

// Store active socket connections
const activeUsers = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User authentication and join
  socket.on("join", async (userData) => {
    try {
      const { user_id, email, firstname, lastname } = userData;

      // Update or create user in MongoDB
      let user = await User.findOneAndUpdate(
        { user_id: user_id },
        {
          user_id,
          email,
          firstname,
          lastname,
          isOnline: true,
          lastSeen: new Date(),
          socketId: socket.id,
        },
        { upsert: true, new: true }
      );

      activeUsers.set(socket.id, {
        user_id,
        email,
        firstname,
        lastname,
        socketId: socket.id,
      });

      // Join user to their chat rooms
      const userChats = await Chat.find({
        "participants.user_id": user_id,
        "participants.leftAt": null,
      });

      userChats.forEach((chat) => {
        socket.join(chat._id.toString());
      });

      // Notify user is online to all their chats
      userChats.forEach((chat) => {
        socket.to(chat._id.toString()).emit("userOnline", {
          user_id,
          firstname,
          lastname,
        });
      }); // Send user's chats list with participant details
      const chatsRaw = await Chat.find({
        "participants.user_id": user_id,
        "participants.leftAt": null,
      })
        .populate("lastMessage")
        .sort({ lastActivity: -1 })
        .lean();

      // Process chats to include participant details and proper names
      const chatsWithDetails = await Promise.all(
        chatsRaw.map(async (chat) => {
          // Populate participant details with user information
          const participantsWithDetails = await Promise.all(
            chat.participants.map(async (participant) => {
              const participantUser = await User.findOne({
                user_id: participant.user_id,
              });
              return {
                // ...participant, // Spread participant to retain joinedAt, leftAt if needed by client
                user_id: participant.user_id, // Ensure user_id is directly available
                firstname: participantUser?.firstname || "Unknown",
                lastname: participantUser?.lastname || "User",
                photo: participantUser?.photo || "/img/avatar.webp",
                isOnline: participantUser?.isOnline || false,
                // Add other fields from participant if necessary, e.g., joinedAt
                joinedAt: participant.joinedAt,
                leftAt: participant.leftAt,
              };
            })
          );

          // Generate proper chat name for 1-on-1 chats
          let chatName = chat.name;
          if (!chat.isGroup && participantsWithDetails.length === 2) {
            const otherParticipant = participantsWithDetails.find(
              (p) => p.user_id !== user_id && !p.leftAt // user_id is from the outer scope (current user)
            );
            if (otherParticipant) {
              // No need to fetch User again, details are in otherParticipant
              chatName = `${otherParticipant.firstname} ${otherParticipant.lastname}`;
            }
          }

          return {
            ...chat,
            name: chatName,
            participants: participantsWithDetails,
          };
        })
      );

      socket.emit("chatsLoaded", chatsWithDetails);

      console.log(
        `User ${firstname} ${lastname} joined with socket ${socket.id}`
      );
    } catch (error) {
      console.error("Error in join event:", error);
      socket.emit("error", { message: "Failed to join chat" });
    }
  });

  // Enhanced socket event for user status
  socket.on("updateStatus", async (data) => {
    const { status, chatId } = data;
    const user = activeUsers.get(socket.id);

    if (user) {
      await User.findOneAndUpdate(
        { user_id: user.user_id },
        {
          status: status,
          currentChatId: chatId,
          lastSeen: new Date(),
        }
      );

      // Notify all user's chats about status change
      const userChats = await Chat.find({
        "participants.user_id": user.user_id,
        "participants.leftAt": null,
      });

      userChats.forEach((chat) => {
        socket.to(chat._id.toString()).emit("userStatusChanged", {
          user_id: user.user_id,
          status: status,
          chatId: chatId,
        });
      });
    }
  });

  // Load chat messages
  socket.on("loadMessages", async (data) => {
    try {
      const { chatId, page = 1, limit = 50 } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Check if user is participant of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        "participants.user_id": user.user_id,
        "participants.leftAt": null,
      });

      if (!chat) {
        socket.emit("error", { message: "Chat not found or access denied" });
        return;
      }
      const messages = await Message.find({ chat_id: chatId })
        .populate("replyTo")
        .sort({ createdAt: -1 })
        .limit(limit * page)
        .skip((page - 1) * limit);

      // Populate sender information for each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await User.findOne({ user_id: message.sender_id });
          return {
            ...message.toObject(),
            senderName: sender ? sender.firstname : "Unknown",
            senderLastname: sender ? sender.lastname : "User",
          };
        })
      );

      // Mark messages as read
      await Message.updateMany(
        {
          chat_id: chatId,
          sender_id: { $ne: user.user_id },
          "readBy.user_id": { $ne: user.user_id },
        },
        {
          $push: {
            readBy: {
              user_id: user.user_id,
              readAt: new Date(),
            },
          },
        }
      );

      socket.emit("messagesLoaded", {
        chatId,
        messages: messagesWithSenders.reverse(),
        hasMore: messagesWithSenders.length === limit,
      });
    } catch (error) {
      console.error("Error loading messages:", error);
      socket.emit("error", { message: "Failed to load messages" });
    }
  });

  // Send message
  socket.on("sendMessage", async (data) => {
    try {
      const { chatId, content, messageType = "text", replyTo = null } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Validate chat access
      const chat = await Chat.findOne({
        _id: chatId,
        "participants.user_id": user.user_id,
        "participants.leftAt": null,
      });

      if (!chat) {
        socket.emit("error", { message: "Chat not found or access denied" });
        return;
      }

      // Create message
      const message = new Message({
        chat_id: chatId,
        sender_id: user.user_id,
        content,
        messageType,
        replyTo,
      });

      await message.save();

      // Update chat's last message and activity
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastActivity: new Date(),
      });

      // Get populated message
      const populatedMessage = await Message.findById(message._id).populate(
        "replyTo"
      );

      // Emit to all chat participants
      io.to(chatId).emit("newMessage", {
        message: populatedMessage,
        sender: {
          user_id: user.user_id,
          firstname: user.firstname,
          lastname: user.lastname,
        },
      });

      // Send push notification to offline users
      const offlineParticipants = await User.find({
        user_id: { $in: chat.participants.map((p) => p.user_id) },
        isOnline: false,
      });

      // Notify offline users (for bell notification system)
      offlineParticipants.forEach((offlineUser) => {
        // This would integrate with your notification system
        console.log(`Notification for offline user: ${offlineUser.user_id}`);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Create new chat
  socket.on("createChat", async (data) => {
    try {
      const { participants, name, isGroup = false } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      const creatorIdNum = user.user_id;

      const clientParticipantsNum = (
        Array.isArray(participants) ? participants : []
      )
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id) && id !== null);

      let finalParticipantIds = [...clientParticipantsNum];
      if (!clientParticipantsNum.includes(creatorIdNum)) {
        finalParticipantIds.push(creatorIdNum);
      }

      const uniqueParticipantUserIds = [...new Set(finalParticipantIds)];
      const actualIsGroup = uniqueParticipantUserIds.length > 2;

      // Determine chat name: if not a group and has 2 participants, generate name from the other user
      let determinedChatName = name; // Use provided name by default or for groups
      if (!actualIsGroup && uniqueParticipantUserIds.length === 2) {
        const otherUserId = uniqueParticipantUserIds.find(
          (id) => id !== creatorIdNum
        );
        if (otherUserId) {
          const otherUser = await User.findOne({ user_id: otherUserId });
          if (otherUser) {
            determinedChatName = `${otherUser.firstname} ${otherUser.lastname}`;
          } else {
            // Fallback if other user not found, though this should ideally not happen
            determinedChatName = `Chat with User ${otherUserId}`;
          }
        } else {
          // Fallback for 1-on-1 if other user ID isn't found (should not happen with correct logic)
          determinedChatName = `Private Chat ${Date.now()}`;
        }
      } else if (actualIsGroup && !name) {
        // Fallback for group chat if no name provided
        determinedChatName = `Group Chat ${Date.now()}`;
      }

      const chat = new Chat({
        name: determinedChatName,
        isGroup: actualIsGroup,
        participants: uniqueParticipantUserIds.map((userId) => ({
          // Ensures no roles are assigned
          user_id: userId, // userId is already a unique number
        })),
      });
      await chat.save();

      // Populate participant details for the response
      const participantsWithDetails = await Promise.all(
        chat.participants.map(async (participant) => {
          const participantUser = await User.findOne({
            user_id: participant.user_id,
          });
          return {
            user_id: participant.user_id,
            firstname: participantUser?.firstname || "Unknown",
            lastname: participantUser?.lastname || "User",
            photo: participantUser?.photo || "/img/avatar.webp",
            isOnline: participantUser?.isOnline || false,
            joinedAt: participant.joinedAt,
            leftAt: participant.leftAt,
          };
        })
      );

      // Generate proper chat name for 1-on-1 chats
      let chatName = chat.name; // Use the name from the chat document first
      if (!actualIsGroup && uniqueParticipantUserIds.length === 2) {
        const otherParticipantId = uniqueParticipantUserIds.find(
          (userId) => userId !== creatorIdNum
        );
        if (otherParticipantId) {
          // Find the details from participantsWithDetails to avoid another DB call
          const otherUserDetails = participantsWithDetails.find(
            (p) => p.user_id === otherParticipantId
          );
          if (otherUserDetails) {
            chatName = `${otherUserDetails.firstname} ${otherUserDetails.lastname}`;
          }
          // If otherUserDetails is not found (should not happen), chatName remains as from DB
        }
      } else if (actualIsGroup && !chat.name) {
        // Ensure group chats have a name
        chatName = `Group Chat`; // Default if somehow name was empty
      }

      const chatResponse = {
        ...chat.toObject(),
        name: chatName,
        participants: participantsWithDetails,
      };

      // Join all participants to the chat room
      const participantSockets = Array.from(activeUsers.entries())
        .filter(([, userData]) =>
          uniqueParticipantUserIds.includes(userData.user_id)
        ) // Corrected: uniqueParticipantUserIds
        .map(([socketId]) => socketId);

      participantSockets.forEach((socketId) => {
        io.sockets.sockets.get(socketId)?.join(chat._id.toString());
      });

      // Notify all participants
      io.to(chat._id.toString()).emit("chatCreated", {
        chat: chatResponse,
        creator: {
          user_id: user.user_id,
          firstname: user.firstname,
          lastname: user.lastname,
        },
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      socket.emit("error", { message: "Failed to create chat" });
    }
  });
  // Update chat name
  socket.on("updateChatName", async (data) => {
    try {
      const { chatId, newName } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      console.log(
        `updateChatName: User ${user.user_id} attempting to update chat ${chatId} to "${newName}"`
      );

      // First, find the chat to see what we're working with
      const chatForDebug = await Chat.findById(chatId);
      if (chatForDebug) {
        console.log(
          `updateChatName: Chat found - isGroup: ${chatForDebug.isGroup}, participants:`,
          chatForDebug.participants
        );
      } else {
        console.log(`updateChatName: Chat ${chatId} not found`);
        socket.emit("error", { message: "Chat not found" });
        return;
      }

      // Find the chat and verify user is a participant (removed admin check)
      const chat = await Chat.findOne({
        _id: chatId,
        isGroup: true, // Only group chats can have their names edited by default (can be adjusted)
        participants: {
          $elemMatch: {
            user_id: user.user_id,
            leftAt: null, // User must still be in the chat
          },
        },
      });

      if (!chat) {
        // More specific error message
        if (!chatForDebug.isGroup) {
          socket.emit("error", {
            message:
              "Cannot rename 1-on-1 chats. Only group chats can be renamed.",
          });
        } else {
          const userParticipant = chatForDebug.participants.find(
            (p) => p.user_id === user.user_id && !p.leftAt
          );
          if (!userParticipant) {
            socket.emit("error", {
              message: "You are not a participant in this chat.",
            });
          } else {
            socket.emit("error", {
              message: "Chat not found or not a group chat.", // Simplified error after removing admin check
            });
          }
        }
        return;
      }

      // Update the chat name
      chat.name = newName;
      await chat.save();

      // Broadcast the name change to all participants in the chat room
      io.to(chatId).emit("chatNameUpdated", { chatId, newName });

      console.log(
        `Chat name updated for chat ${chatId} to "${newName}" by user ${user.user_id}`
      );
    } catch (error) {
      console.error("Error updating chat name:", error);
      socket.emit("error", { message: "Failed to update chat name" });
    }
  });

  // Add user to chat
  socket.on("addUserToChat", async (data) => {
    try {
      const { chatId, userId } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Check if user is admin of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: {
          $elemMatch: {
            user_id: user.user_id,
            leftAt: null,
          },
        },
      });

      if (!chat) {
        socket.emit("error", { message: "Only chat admins can add users" });
        return;
      }

      // Check if user is a participant of the chat (removed admin check)
      if (!chat) {
        socket.emit("error", {
          message:
            "You are not a participant in this chat or chat does not exist.",
        }); // Simplified error
        return;
      }

      // Add user to chat
      await Chat.findByIdAndUpdate(chatId, {
        $push: {
          participants: {
            // Ensures no role is assigned when adding a user
            user_id: userId,
            joinedAt: new Date(),
          },
        },
      });

      // Join user to chat room if online
      const targetUserSocket = Array.from(activeUsers.entries()).find(
        ([, userData]) => userData.user_id === userId
      );

      if (targetUserSocket) {
        io.sockets.sockets.get(targetUserSocket[0])?.join(chatId);
      }

      // Notify chat participants
      io.to(chatId).emit("userAddedToChat", {
        chatId,
        userId,
        addedBy: user.user_id,
      });
    } catch (error) {
      console.error("Error adding user to chat:", error);
      socket.emit("error", { message: "Failed to add user to chat" });
    }
  });

  // Get user chats (explicit request)
  socket.on("getUserChats", async () => {
    try {
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      const currentUserSystemId = user.user_id; // Renamed for clarity

      // Get user's chats with last message details
      const chats = await Chat.find({
        "participants.user_id": currentUserSystemId,
        "participants.leftAt": null,
      })
        .populate({
          path: "lastMessage",
          select: "content sender_id createdAt messageType",
        })
        .sort({ lastActivity: -1 })
        .lean(); // Add unread count and format chat data
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          // Count unread messages
          const unreadCount = await Message.countDocuments({
            chat_id: chat._id,
            sender_id: { $ne: user.user_id },
            "readBy.user_id": { $ne: user.user_id },
          });

          // Get other participants (for 1-on-1 chats)
          const otherParticipants = chat.participants.filter(
            (p) => p.user_id !== user.user_id && !p.leftAt
          );

          // Populate participant details with user information
          const participantsWithDetails = await Promise.all(
            chat.participants.map(async (participant) => {
              const participantUser = await User.findOne({
                user_id: participant.user_id,
              });
              return {
                // ...participant, // Spread participant to retain joinedAt, leftAt
                user_id: participant.user_id,
                firstname: participantUser?.firstname || "Unknown",
                lastname: participantUser?.lastname || "User",
                photo: participantUser?.photo || "/img/avatar.webp",
                isOnline: participantUser?.isOnline || false,
                joinedAt: participant.joinedAt, // Explicitly include
                leftAt: participant.leftAt, // Explicitly include
              };
            })
          );

          // Generate chat name
          let finalChatName = chat.name;
          if (!chat.isGroup && participantsWithDetails.length === 2) {
            const otherParticipant = participantsWithDetails.find(
              (p) => p.user_id !== currentUserSystemId && !p.leftAt
            );
            if (otherParticipant) {
              finalChatName = `${otherParticipant.firstname} ${otherParticipant.lastname}`;
            }
          } else if (chat.isGroup && !chat.name) {
            finalChatName = "Group Chat"; // Fallback for group chats without a name
          }

          return {
            ...chat,
            name: finalChatName,
            unreadCount,
            participants: participantsWithDetails,
            participantCount: otherParticipants.length,
          };
        })
      );

      socket.emit("chatsLoaded", chatsWithDetails);
    } catch (error) {
      console.error("Error getting user chats:", error);
      socket.emit("error", { message: "Failed to load chats" });
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { chatId, isTyping } = data;
    const user = activeUsers.get(socket.id);

    if (user) {
      socket.to(chatId).emit("userTyping", {
        user_id: user.user_id,
        firstname: user.firstname,
        lastname: user.lastname,
        isTyping,
      });
    }
  });

  // Message reactions
  socket.on("addReaction", async (data) => {
    try {
      const { messageId, emoji } = data;
      const user = activeUsers.get(socket.id);

      if (!user) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        (r) => r.user_id === user.user_id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(
          (r) => !(r.user_id === user.user_id && r.emoji === emoji)
        );
      } else {
        // Add reaction
        message.reactions.push({
          user_id: user.user_id,
          emoji,
        });
      }

      await message.save();

      // Notify chat participants
      io.to(message.chat_id.toString()).emit("reactionUpdated", {
        messageId,
        reactions: message.reactions,
      });
    } catch (error) {
      console.error("Error handling reaction:", error);
      socket.emit("error", { message: "Failed to update reaction" });
    }
  });

  // User disconnection
  socket.on("disconnect", async () => {
    try {
      const user = activeUsers.get(socket.id);

      if (user) {
        // Update user status to offline
        await User.findOneAndUpdate(
          { user_id: user.user_id },
          {
            isOnline: false,
            lastSeen: new Date(),
            socketId: null,
          }
        );

        // Notify user is offline to all their chats
        const userChats = await Chat.find({
          "participants.user_id": user.user_id,
          "participants.leftAt": null,
        });

        userChats.forEach((chat) => {
          socket.to(chat._id.toString()).emit("userOffline", {
            user_id: user.user_id,
            firstname: user.firstname,
            lastname: user.lastname,
          });
        });

        activeUsers.delete(socket.id);
        console.log(`User ${user.firstname} ${user.lastname} disconnected`);
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Chat server is running",
    timestamp: new Date().toISOString(),
  });
});

// REST API Endpoints

// Create chat endpoint
app.post("/api/create-chat", async (req, res) => {
  try {
    const { participants, chatType, createdBy, name: clientName } = req.body; // Added clientName

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Participants are required" });
    }

    if (!createdBy) {
      return res
        .status(400)
        .json({ success: false, message: "Creator ID is required" });
    }
    const creatorIdNum = parseInt(createdBy, 10);
    if (isNaN(creatorIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Creator ID" });
    }

    const participantIdsNum = participants
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    // Add creator to participants if not included and ensure uniqueness
    const allParticipantIds = [
      ...new Set([...participantIdsNum, creatorIdNum]),
    ];

    // Determine if it's a group chat
    const isGroup = chatType === "group" || allParticipantIds.length > 2;

    // Generate chat name
    let chatName;
    if (isGroup) {
      chatName = clientName || `Group Chat ${Date.now()}`;
    } else if (allParticipantIds.length === 2) {
      const otherUserId = allParticipantIds.find((id) => id !== creatorIdNum);
      if (otherUserId) {
        const otherUser = await User.findOne({ user_id: otherUserId });
        if (otherUser) {
          chatName = `${otherUser.firstname} ${otherUser.lastname}`;
        } else {
          chatName = `Private Chat ${Date.now()}`; // Fallback
        }
      } else {
        chatName = `Private Chat ${Date.now()}`; // Fallback
      }
    } else {
      // Fallback for chats that are not group and not 2 participants (e.g. self-chat if allowed)
      chatName = clientName || `Chat ${Date.now()}`;
    }

    // Create chat
    const chat = new Chat({
      name: chatName,
      isGroup,
      participants: allParticipantIds.map((userId) => ({
        // Use allParticipantIds
        user_id: userId, // userId is already a number
      })),
    });

    await chat.save();

    res.json({
      success: true,
      message: "Chat created successfully",
      chatId: chat._id.toString(),
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create chat",
      error: error.message,
    });
  }
});

// Get user's chats
app.get("/api/chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserIdNum = parseInt(userId, 10);
    if (isNaN(currentUserIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID" });
    }

    const rawChats = await Chat.find({
      "participants.user_id": currentUserIdNum,
      "participants.leftAt": null,
    })
      .populate("lastMessage")
      .sort({ lastActivity: -1 })
      .lean(); // Use lean for better performance if only reading data

    const chatsWithCorrectNames = await Promise.all(
      rawChats.map(async (chat) => {
        let finalName = chat.name;
        if (!chat.isGroup && chat.participants.length === 2) {
          const otherParticipantEntry = chat.participants.find(
            (p) => p.user_id !== currentUserIdNum && !p.leftAt
          );
          if (otherParticipantEntry) {
            const otherUser = await User.findOne({
              user_id: otherParticipantEntry.user_id,
            }).lean();
            if (otherUser) {
              finalName = `${otherUser.firstname} ${otherUser.lastname}`;
            }
          }
        }
        // Populate full participant details for client
        const participantsWithDetails = await Promise.all(
          chat.participants.map(async (p) => {
            const userDoc = await User.findOne({ user_id: p.user_id }).lean();
            return {
              user_id: p.user_id,
              firstname: userDoc?.firstname || "Unknown",
              lastname: userDoc?.lastname || "User",
              photo: userDoc?.photo || "/img/avatar.webp",
              isOnline: userDoc?.isOnline || false,
              joinedAt: p.joinedAt,
              leftAt: p.leftAt,
            };
          })
        );
        return {
          ...chat,
          name: finalName,
          participants: participantsWithDetails,
        };
      })
    );

    res.json({ success: true, chats: chatsWithCorrectNames });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
});

// Get students for chat creation (from MariaDB)
app.get("/api/students", async (req, res) => {
  try {
    // Fetch real students from MariaDB via direct PHP endpoint
    const response = await axios.get(
      "http://localhost/newPiiWithMvc/public/api/students.php"
    );

    if (response.data.success) {
      res.json({
        success: true,
        students: response.data.students,
      });
    } else {
      throw new Error(
        response.data.message || "Failed to fetch students from MariaDB"
      );
    }
  } catch (error) {
    console.error("Error fetching students from MariaDB:", error.message);

    // Return error instead of mock data to ensure real data is always used
    res.status(503).json({
      success: false,
      message: "Database connection failed - unable to fetch real student data",
      error: error.message,
      note: "Chat creation requires real database connection",
    });
  }
});

// Sync user data from MariaDB to MongoDB
app.post("/api/sync-user", async (req, res) => {
  try {
    const userData = req.body;
    console.log("Received user data for sync:", userData);

    if (!userData || !userData.user_id || !userData.email) {
      return res.status(400).json({
        success: false,
        message: "Missing required user data (user_id, email)",
      });
    }

    // Use user_id as the primary key for finding and updating
    // userData might come from different PHP sources, ensure consistency
    const updateData = {
      email: userData.email,
      firstname: userData.firstname,
      lastname: userData.lastname,
      // isOnline and lastSeen could be managed by socket connections primarily
      // but can be initialized or updated here if provided
    };

    if (userData.isOnline !== undefined) {
      updateData.isOnline = userData.isOnline;
    }
    if (userData.lastSeen !== undefined) {
      updateData.lastSeen = userData.lastSeen;
    }

    const user = await User.findOneAndUpdate(
      { user_id: userData.user_id },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("User synced/updated in MongoDB:", user);
    res.json({ success: true, message: "User synced successfully", user });
  } catch (error) {
    console.error("Error syncing user to MongoDB:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during user sync",
      error: error.message,
    });
  }
});

app.get("/api/user-status/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Potentially merge with UserStatus model if more detailed status is needed
    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        // Add other status fields if UserStatus model is merged or queried here
      },
    });
  } catch (error) {
    console.error("Error fetching user status from MongoDB:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Socket.IO connection handling
// ...existing code...

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});

module.exports = { app, server, io };
