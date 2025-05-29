const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// MongoDB Models
const userSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true, unique: true }, // References MariaDB users.id
    email: { type: String, required: true },
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
        role: { type: String, enum: ["admin", "member"], default: "member" },
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

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);
const Chat = mongoose.model("Chat", chatSchema);

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
      });

      // Send user's chats list
      const chatsWithDetails = await Chat.find({
        "participants.user_id": user_id,
        "participants.leftAt": null,
      })
        .populate("lastMessage")
        .sort({ lastActivity: -1 });

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
        messages: messages.reverse(),
        hasMore: messages.length === limit,
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

      // Add creator to participants if not included
      const allParticipants = participants.includes(user.user_id)
        ? participants
        : [...participants, user.user_id];

      // Create chat
      const chat = new Chat({
        name: isGroup ? name : `Chat ${Date.now()}`,
        isGroup,
        participants: allParticipants.map((userId) => ({
          user_id: userId,
          role: userId === user.user_id ? "admin" : "member",
        })),
      });

      await chat.save();

      // Join all participants to the chat room
      const participantSockets = Array.from(activeUsers.entries())
        .filter(([, userData]) => allParticipants.includes(userData.user_id))
        .map(([socketId]) => socketId);

      participantSockets.forEach((socketId) => {
        io.sockets.sockets.get(socketId)?.join(chat._id.toString());
      });

      // Notify all participants
      io.to(chat._id.toString()).emit("chatCreated", {
        chat,
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
            role: "admin",
            leftAt: null,
          },
        },
      });

      if (!chat) {
        socket.emit("error", { message: "Only chat admins can add users" });
        return;
      }

      // Add user to chat
      await Chat.findByIdAndUpdate(chatId, {
        $push: {
          participants: {
            user_id: userId,
            role: "member",
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

// REST API Endpoints

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

// Get students for chat creation (from MariaDB simulation)
app.get("/api/students", async (req, res) => {
  try {
    // This would typically query your MariaDB database
    // For now, we'll return a mock response
    const students = [
      { id: 1, firstname: "John", lastname: "Doe", email: "john@example.com" },
      {
        id: 2,
        firstname: "Jane",
        lastname: "Smith",
        email: "jane@example.com",
      },
      {
        id: 3,
        firstname: "Michael",
        lastname: "Brown",
        email: "michael@example.com",
      },
      {
        id: 4,
        firstname: "Sarah",
        lastname: "Davis",
        email: "sarah@example.com",
      },
      { id: 5, firstname: "Tom", lastname: "Wilson", email: "tom@example.com" },
    ];

    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch students" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
