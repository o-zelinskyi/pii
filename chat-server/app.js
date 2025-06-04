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
      "http://localhost/github",
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
      "http://localhost/github",
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

// Notification schema for persistent notifications
const notificationSchema = new mongoose.Schema(
  {
    recipient_id: { type: Number, required: true }, // Who should receive this notification
    sender_id: { type: Number, required: true }, // Who sent the message that triggered notification
    chat_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "chat_created", "user_added", "chat_renamed"],
      default: "message",
    },
    content: { type: String, required: true }, // Preview of the message or notification text
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null }, // When notification was delivered to user
  },
  { timestamps: true }
);

// Add indexes for better performance
notificationSchema.index({ recipient_id: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ chat_id: 1 });
notificationSchema.index({ message_id: 1 });

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
      onlyAdminsCanMessage: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema); // Create User model
const Message = mongoose.model("Message", messageSchema);
const Chat = mongoose.model("Chat", chatSchema); // Create Chat model
const UserStatus = mongoose.model("UserStatus", userStatusSchema);
const Notification = mongoose.model("Notification", notificationSchema); // Create Notification model for persistent notifications

// Store active socket connections and online users
const activeUsers = new Map(); // socketId -> userData
const userSessions = new Map(); // user_id -> Set of socketIds
const onlineUsers = new Set(); // Simple array to track online user IDs

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  // User authentication and join
  socket.on("join", async (userData) => {
    try {
      const { user_id, email, firstname, lastname } = userData;

      // Update user's last seen in MongoDB
      await User.findOneAndUpdate(
        { user_id: user_id },
        {
          user_id,
          email,
          firstname,
          lastname,
          lastSeen: new Date(),
          socketId: socket.id,
        },
        { upsert: true, new: true }
      ); // Add to active users and online array
      activeUsers.set(socket.id, {
        user_id,
        email,
        firstname,
        lastname,
        socketId: socket.id,
      });

      // Track multiple sessions per user
      if (!userSessions.has(user_id)) {
        userSessions.set(user_id, new Set());
      }
      userSessions.get(user_id).add(socket.id);

      // Add to online users (Set prevents duplicates)
      onlineUsers.add(user_id);

      // Join user to their chat rooms
      const userChats = await Chat.find({
        "participants.user_id": user_id,
        "participants.leftAt": null,
      });

      userChats.forEach((chat) => {
        socket.join(chat._id.toString());
      }); // Notify user is online to all their chats
      userChats.forEach((chat) => {
        console.log(
          `Notifying chat ${chat._id} that user ${user_id} (${firstname} ${lastname}) is online`
        );
        socket.to(chat._id.toString()).emit("userOnline", {
          user_id,
          firstname,
          lastname,
          isOnline: true,
          lastSeen: new Date(),
        });
      }); // Send user's chats list with participant details
      const chatsRaw = await Chat.find({
        "participants.user_id": user_id,
        "participants.leftAt": null,
      })
        .populate("lastMessage")
        .sort({ lastActivity: -1 })
        .lean(); // Process chats to include participant details and proper names
      const chatsWithDetails = await Promise.all(
        chatsRaw.map(async (chat) => {
          // Populate participant details with user information including real-time status
          const participantsWithDetails = await Promise.all(
            chat.participants.map(async (participant) => {
              const isOnline = onlineUsers.has(participant.user_id);
              let participantData = {
                ...participant,
                isOnline: isOnline,
              };

              if (isOnline) {
                // Get basic info from activeUsers or use cached data
                const activeUserData = Array.from(activeUsers.values()).find(
                  (u) => u.user_id === participant.user_id
                );
                participantData.firstname =
                  activeUserData?.firstname || "Unknown";
                participantData.lastname = activeUserData?.lastname || "User";
                participantData.lastSeen = new Date(); // Online now
              } else {
                // Get full info from MongoDB for offline users
                const participantUser = await User.findOne({
                  user_id: participant.user_id,
                });
                participantData.firstname =
                  participantUser?.firstname || "Unknown";
                participantData.lastname = participantUser?.lastname || "User";
                participantData.lastSeen =
                  participantUser?.lastSeen || new Date();
              }

              participantData.photo = "/img/avatar.webp";
              return participantData;
            })
          );

          // Generate proper chat name for 1-on-1 chats
          let chatName = chat.name;
          if (!chat.isGroup && chat.participants.length === 2) {
            const otherParticipant = chat.participants.find(
              (p) => p.user_id !== user_id && !p.leftAt
            );
            if (otherParticipant) {
              const otherUser = await User.findOne({
                user_id: otherParticipant.user_id,
              });
              if (otherUser) {
                chatName = `${otherUser.firstname} ${otherUser.lastname}`;
              }
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

      // Send unread notifications to user when they connect
      try {
        const unreadNotifications = await Notification.find({
          recipient_id: user_id,
          isRead: false,
        })
          .populate({
            path: "message_id",
            select: "content createdAt messageType",
          })
          .populate({
            path: "chat_id",
            select: "name isGroup",
          })
          .sort({ createdAt: -1 })
          .limit(20); // Send only recent 20 notifications

        if (unreadNotifications.length > 0) {
          // Get sender information for each notification
          const notificationsWithSenders = await Promise.all(
            unreadNotifications.map(async (notification) => {
              const sender = await User.findOne({
                user_id: notification.sender_id,
              });
              return {
                ...notification.toObject(),
                sender: {
                  user_id: notification.sender_id,
                  firstname: sender?.firstname || "Unknown",
                  lastname: sender?.lastname || "User",
                },
              };
            })
          );

          // Send notifications to the user
          socket.emit("unreadNotifications", {
            notifications: notificationsWithSenders,
            count: notificationsWithSenders.length,
          });

          console.log(
            `Sent ${notificationsWithSenders.length} unread notifications to user ${user_id}`
          );
        }
      } catch (notificationError) {
        console.error(
          "Error fetching unread notifications:",
          notificationError
        );
      }

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
      }); // Create persistent notifications for offline users
      const offlineParticipants = chat.participants.filter(
        (p) => p.user_id !== user.user_id && !onlineUsers.has(p.user_id)
      );

      // Create notifications for offline users
      const notificationPromises = offlineParticipants.map(
        async (participant) => {
          try {
            const notification = new Notification({
              recipient_id: participant.user_id,
              sender_id: user.user_id,
              chat_id: chatId,
              message_id: message._id,
              type: "message",
              content:
                content.length > 100
                  ? content.substring(0, 97) + "..."
                  : content,
            });

            await notification.save();
            console.log(
              `Created notification for offline user: ${participant.user_id}`
            );
          } catch (notificationError) {
            console.error(
              `Failed to create notification for user ${participant.user_id}:`,
              notificationError
            );
          }
        }
      );

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);
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
      } // Ensure all participants are numbers to prevent type mismatch
      const normalizedParticipants = participants.map((p) => parseInt(p));
      const creatorId = parseInt(user.user_id);

      // Create a Set to prevent duplicates, then convert back to array
      const participantSet = new Set(normalizedParticipants);

      // Always add creator (Set will prevent duplicates)
      participantSet.add(creatorId);

      const allParticipants = Array.from(participantSet);

      console.log("Original participants:", participants);
      console.log("Normalized participants:", normalizedParticipants);
      console.log("Creator user_id:", user.user_id, "normalized:", creatorId);
      console.log("Final participants (no duplicates):", allParticipants);

      // Determine if it's a group chat based on actual participant count
      const actualIsGroup = allParticipants.length > 2;

      // For 1-on-1 chats, check if a chat already exists between these users
      if (!actualIsGroup) {
        const existingChat = await Chat.findOne({
          isGroup: false,
          "participants.user_id": { $all: allParticipants },
          $expr: { $eq: [{ $size: "$participants" }, allParticipants.length] },
        });

        if (existingChat) {
          console.log(
            "1-on-1 chat already exists between these users:",
            allParticipants
          );
          socket.emit("error", {
            message: "Chat already exists between these users",
            existingChatId: existingChat._id,
          });
          return;
        }
      }

      // Create chat without role system - just participants
      const chat = new Chat({
        name: actualIsGroup
          ? name || `Group Chat ${Date.now()}`
          : `Chat ${Date.now()}`,
        isGroup: actualIsGroup,
        participants: allParticipants.map((userId) => ({
          user_id: userId,
          joinedAt: new Date(),
        })),
      });
      await chat.save(); // Populate participant details for the response
      const participantsWithDetails = await Promise.all(
        chat.participants.map(async (participant) => {
          const isOnline = onlineUsers.has(participant.user_id);
          let participantData = {
            ...participant,
            isOnline: isOnline,
          };

          if (isOnline) {
            // Get basic info from activeUsers
            const activeUserData = Array.from(activeUsers.values()).find(
              (u) => u.user_id === participant.user_id
            );
            participantData.firstname = activeUserData?.firstname || "Unknown";
            participantData.lastname = activeUserData?.lastname || "User";
          } else {
            // Get full info from MongoDB for offline users
            const participantUser = await User.findOne({
              user_id: participant.user_id,
            });
            participantData.firstname = participantUser?.firstname || "Unknown";
            participantData.lastname = participantUser?.lastname || "User";
          }

          participantData.photo = "/img/avatar.webp";
          return participantData;
        })
      ); // Generate proper chat name for 1-on-1 chats
      let chatName = chat.name;
      if (!actualIsGroup && allParticipants.length === 2) {
        const otherParticipant = allParticipants.find(
          (userId) => userId !== user.user_id
        );
        if (otherParticipant) {
          const otherUser = await User.findOne({
            user_id: otherParticipant,
          });
          if (otherUser) {
            chatName = `${otherUser.firstname} ${otherUser.lastname}`;
          }
        }
      }

      const chatResponse = {
        ...chat.toObject(),
        name: chatName,
        participants: participantsWithDetails,
      };

      // Join all participants to the chat room
      const participantSockets = Array.from(activeUsers.entries())
        .filter(([, userData]) => allParticipants.includes(userData.user_id))
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
  }); // Update chat name
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

      // Find the chat and verify user is a participant
      const chat = await Chat.findOne({
        _id: chatId,
        isGroup: true, // Only group chats can have their names edited
        participants: {
          $elemMatch: {
            user_id: user.user_id,
            leftAt: null, // User must still be in the chat
          },
        },
      });

      if (!chat) {
        const chatForDebug = await Chat.findById(chatId);
        if (chatForDebug && !chatForDebug.isGroup) {
          socket.emit("error", {
            message:
              "Cannot rename 1-on-1 chats. Only group chats can be renamed.",
          });
        } else {
          socket.emit("error", {
            message: "Chat not found or you are not a participant.",
          });
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

      // Check if user is participant of the chat and chat is a group
      const chat = await Chat.findOne({
        _id: chatId,
        isGroup: true, // Only allow adding users to group chats
        participants: {
          $elemMatch: {
            user_id: user.user_id,
            leftAt: null,
          },
        },
      });

      if (!chat) {
        socket.emit("error", {
          message: "Only group chat participants can add users",
        });
        return;
      }

      // Check if user is already in the chat
      const existingParticipant = chat.participants.find(
        (p) => p.user_id === userId && !p.leftAt
      );

      if (existingParticipant) {
        socket.emit("error", { message: "User is already in this chat" });
        return;
      }

      // Add user to chat
      await Chat.findByIdAndUpdate(chatId, {
        $push: {
          participants: {
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

      // Get user's chats with last message details
      const chats = await Chat.find({
        "participants.user_id": user.user_id,
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
          }); // Get other participants (for 1-on-1 chats)
          const otherParticipants = chat.participants.filter(
            (p) => p.user_id !== user.user_id && !p.leftAt
          );

          // Populate participant details with user information including real-time status
          const participantsWithDetails = await Promise.all(
            chat.participants.map(async (participant) => {
              const isOnline = onlineUsers.has(participant.user_id);
              let participantData = {
                ...participant,
                isOnline: isOnline,
              };

              if (isOnline) {
                // Get basic info from activeUsers or use cached data
                const activeUserData = Array.from(activeUsers.values()).find(
                  (u) => u.user_id === participant.user_id
                );
                participantData.firstname =
                  activeUserData?.firstname || "Unknown";
                participantData.lastname = activeUserData?.lastname || "User";
                participantData.lastSeen = new Date(); // Online now
              } else {
                // Get full info from MongoDB for offline users
                const participantUser = await User.findOne({
                  user_id: participant.user_id,
                });
                participantData.firstname =
                  participantUser?.firstname || "Unknown";
                participantData.lastname = participantUser?.lastname || "User";
                participantData.lastSeen =
                  participantUser?.lastSeen || new Date();
              }

              participantData.photo = "/img/avatar.webp";
              return participantData;
            })
          );

          // Generate chat name if not set
          let chatName = chat.name;
          if (!chat.isGroup && otherParticipants.length > 0) {
            // For 1-on-1 chats, try to get the other user's name
            const otherUser = await User.findOne({
              user_id: otherParticipants[0].user_id,
            });
            if (otherUser) {
              chatName = `${otherUser.firstname} ${otherUser.lastname}`;
            }
          }

          return {
            ...chat,
            name: chatName,
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
        // Remove this socket from user's sessions
        if (userSessions.has(user.user_id)) {
          userSessions.get(user.user_id).delete(socket.id);

          // Only mark user as offline if they have no more active sessions
          if (userSessions.get(user.user_id).size === 0) {
            // Remove from online users array
            onlineUsers.delete(user.user_id);
            userSessions.delete(user.user_id);

            // Update user's last seen in MongoDB
            await User.findOneAndUpdate(
              { user_id: user.user_id },
              {
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
                lastSeen: new Date(),
                isOnline: false,
              });
            });

            console.log(
              `User ${user.firstname} ${user.lastname} went offline (all sessions disconnected)`
            );
          } else {
            console.log(
              `User ${user.firstname} ${
                user.lastname
              } disconnected from one session, but still has ${
                userSessions.get(user.user_id).size
              } active session(s)`
            );
          }
        }

        activeUsers.delete(socket.id);
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

// Get online users list (for debugging/monitoring)
app.get("/api/online-users", (req, res) => {
  res.json({
    success: true,
    onlineUsers: Array.from(onlineUsers),
    onlineCount: onlineUsers.size,
    userSessions: Object.fromEntries(
      Array.from(userSessions.entries()).map(([userId, socketIds]) => [
        userId,
        Array.from(socketIds),
      ])
    ),
    activeSessionsCount: activeUsers.size,
    timestamp: new Date().toISOString(),
  });
});

// REST API Endpoints

// Create chat endpoint
app.post("/api/create-chat", async (req, res) => {
  try {
    const { participants, chatType, createdBy } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Participants array is required",
      });
    }

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: "Creator ID is required",
      });
    }

    // Add creator to participants if not included
    const allParticipants = participants.includes(createdBy)
      ? participants
      : [...participants, createdBy];

    // Determine if it's a group chat
    const isGroup = chatType === "group" || allParticipants.length > 2;

    // Generate chat name
    let chatName;
    if (isGroup) {
      chatName = `Group Chat ${Date.now()}`;
    } else {
      // For 1-on-1 chats, we'll set the name based on participants later
      chatName = `Chat ${Date.now()}`;
    }

    // Create chat
    const chat = new Chat({
      name: chatName,
      isGroup,
      participants: allParticipants.map((userId) => ({
        user_id: parseInt(userId),
        role: parseInt(userId) === parseInt(createdBy) ? "admin" : "member",
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

    const chats = await Chat.find({
      "participants.user_id": parseInt(userId),
      "participants.leftAt": null,
    })
      .populate("lastMessage")
      .sort({ lastActivity: -1 });

    res.json({ success: true, chats });
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
      "http://localhost/github/public/api/students.php"
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

    const isOnline = onlineUsers.has(userId);
    let userData = {
      user_id: userId,
      isOnline: isOnline,
    };

    if (isOnline) {
      // User is online, last seen is now
      userData.lastSeen = new Date();
    } else {
      // Get last seen from MongoDB
      const user = await User.findOne({ user_id: userId });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      userData.lastSeen = user.lastSeen;
    }
    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get unread notifications for a user
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Get unread notifications for the user
    const notifications = await Notification.find({
      recipient_id: userId,
      isRead: false,
    })
      .populate({
        path: "message_id",
        select: "content createdAt messageType",
      })
      .populate({
        path: "chat_id",
        select: "name isGroup",
      })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent notifications

    // Get sender information for each notification
    const notificationsWithSenders = await Promise.all(
      notifications.map(async (notification) => {
        const sender = await User.findOne({ user_id: notification.sender_id });
        return {
          ...notification.toObject(),
          sender: {
            user_id: notification.sender_id,
            firstname: sender?.firstname || "Unknown",
            lastname: sender?.lastname || "User",
          },
        };
      })
    );

    res.json({
      success: true,
      notifications: notificationsWithSenders,
      count: notificationsWithSenders.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// Mark notifications as read
app.post("/api/notifications/:userId/mark-read", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { notificationIds, markAll = false } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    let updateQuery = { recipient_id: userId, isRead: false };

    if (!markAll && notificationIds && Array.isArray(notificationIds)) {
      updateQuery._id = { $in: notificationIds };
    }

    const result = await Notification.updateMany(updateQuery, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
});

// Get notification count for a user
app.get("/api/notifications/:userId/count", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const count = await Notification.countDocuments({
      recipient_id: userId,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification count",
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
