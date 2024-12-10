const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");
const http = require('http');
const { Server } = require('socket.io');
const { authenticateUser } = require('./middleware/authMiddleware');
const mongoose = require("mongoose");

// Load environment variables
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mongoose Schema for Messages
const messageSchema = new mongoose.Schema({
  community: String,
  message: String,
  name: String,
  userId: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('User connected');

  // Handle user joining a community
  socket.on("join-room", async ({ community, token }) => {
    try {
      const user = await authenticateUser(token);

      if (!user) {
        console.log("Authentication failed during join-room");
        socket.emit("error", { message: "Authentication failed" });
        return socket.disconnect();
      }

      socket.join(community);

      // Fetch message history for the specific room from MongoDB
      const messages = await Message.find({ community }).lean();
      console.log(`Fetching message history for ${community}`);
      socket.emit("load-messages", messages);
    } catch (error) {
      console.error("Join-room error:", error);
      socket.emit("error", { message: "Unable to join the room" });
    }
  });

  // Handle sending a message
  socket.on("message", async ({ community, message, token }) => {
    try {
      const user = await authenticateUser(token);

      if (!user) {
        console.log("Authentication failed during message send");
        socket.emit("error", { message: "Authentication failed" });
        return;
      }

      // Save message to MongoDB
      const newMessage = await Message.create({
        community,
        message,
        name: user.name,
        userId: user._id,
      });

      console.log(`Saving new message to MongoDB in community: ${community}`);
      // Emit the new message to all clients in the same community
      io.to(community).emit("new-message", {
        message: newMessage.message,
        name: newMessage.name,
        userId: newMessage.userId,
      });
    } catch (error) {
      console.error("Message error:", error);
      socket.emit("error", { message: "Unable to send the message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});