require("dotenv").config();
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const appEvents = require("./events/appEvents");
const authRoutes = require("./routes/authRoutes");
const notesRoutes = require("./routes/notesRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Secure Connect & Communication Platform running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return next(new Error("Invalid socket token"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const defaultRoom = "general";
  socket.join(defaultRoom);
  socket.data.room = defaultRoom;
  socket.data.username = socket.user?.username || socket.id;
  console.log(`${socket.id} joined room ${defaultRoom}`);

  socket.on("join_room", ({ room, username } = {}) => {
    const targetRoom = (room || "general").trim();
    if (username) socket.data.username = username.trim();
    if (socket.data.room && socket.data.room !== targetRoom) {
      socket.leave(socket.data.room);
    }
    socket.join(targetRoom);
    socket.data.room = targetRoom;
    console.log(`${socket.id} joined room ${targetRoom}`);
    io.to(targetRoom).emit("system_message", {
      room: targetRoom,
      message: `${socket.data.username} joined ${targetRoom}`
    });
  });

  socket.on("chat_message", (payload) => {
    const room = (payload?.room || socket.data.room || "general").trim();
    const sender = (payload?.sender || socket.data.username || socket.id).trim();
    const message = payload?.message;
    if (!message) return;

    appEvents.emit("chat:message", { room, sender, message });

    io.to(room).emit("chat_message", {
      room,
      sender,
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
});