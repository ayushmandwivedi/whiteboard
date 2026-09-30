const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Canvas = require("./models/canvasModel");
const User = require("./models/userModel");
const { canAccessCanvas } = require("./utils/canvasAccess");

const reply = (callback, payload) => {
  if (typeof callback === "function") callback(payload);
};

const configureSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 5 * 1024 * 1024,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const user = await User.findById(decoded.userId).select("name");
      if (!user) return next(new Error("User not found"));

      socket.data.userId = decoded.userId;
      socket.data.userName = user.name;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("canvas:join", async (canvasId, callback) => {
      try {
        if (!mongoose.isValidObjectId(canvasId)) {
          return reply(callback, { ok: false, error: "Invalid canvas ID" });
        }

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
          return reply(callback, { ok: false, error: "Canvas not found" });
        }
        if (!canAccessCanvas(canvas, socket.data.userId)) {
          return reply(callback, {
            ok: false,
            error: "Unauthorized to access this canvas",
          });
        }

        await socket.join(canvasId);
        const roomSockets = await io.in(canvasId).fetchSockets();
        roomSockets.forEach((roomSocket) => {
          const cursor = roomSocket.data.cursor;
          if (roomSocket.id !== socket.id && cursor?.canvasId === canvasId) {
            socket.emit("canvas:cursor-moved", {
              socketId: roomSocket.id,
              name: roomSocket.data.userName,
              x: cursor.x,
              y: cursor.y,
            });
          }
        });
        return reply(callback, { ok: true, elements: canvas.elements || [] });
      } catch (error) {
        return reply(callback, { ok: false, error: "Failed to join canvas" });
      }
    });

    socket.on("canvas:sync", async (payload, callback) => {
      try {
        const { canvasId, elements } = payload || {};
        if (!mongoose.isValidObjectId(canvasId) || !Array.isArray(elements)) {
          return reply(callback, { ok: false, error: "Invalid canvas update" });
        }
        if (!socket.rooms.has(canvasId)) {
          return reply(callback, {
            ok: false,
            error: "Join the canvas before updating it",
          });
        }

        socket.to(canvasId).emit("canvas:updated", {
          canvasId,
          elements,
          updatedBy: socket.data.userId,
        });
        return reply(callback, {
          ok: true,
          broadcast: true,
          persisted: false,
        });
      } catch (error) {
        return reply(callback, { ok: false, error: "Failed to update canvas" });
      }
    });

    socket.on("canvas:cursor", (payload) => {
      const { canvasId, x, y } = payload || {};
      if (
        !mongoose.isValidObjectId(canvasId) ||
        !socket.rooms.has(canvasId) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        y < 0 ||
        x > 10000 ||
        y > 10000
      ) {
        return;
      }

      const now = Date.now();
      if (now - (socket.data.lastCursorAt || 0) < 30) return;
      socket.data.lastCursorAt = now;
      socket.data.cursor = { canvasId, x, y };

      socket.to(canvasId).volatile.emit("canvas:cursor-moved", {
        socketId: socket.id,
        name: socket.data.userName,
        x,
        y,
      });
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("canvas:cursor-left", { socketId: socket.id });
        }
      }
    });
  });

  return io;
};

module.exports = configureSocket;
