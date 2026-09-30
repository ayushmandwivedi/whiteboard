const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Canvas = require("./models/canvasModel");

const reply = (callback, payload) => {
  if (typeof callback === "function") callback(payload);
};

const canAccessCanvas = (canvas, userId) =>
  canvas.owner.toString() === userId ||
  canvas.shared.some((sharedUserId) => sharedUserId.toString() === userId);

const configureSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 5 * 1024 * 1024,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      socket.data.userId = decoded.userId;
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

        const canvas = await Canvas.findById(canvasId);
        if (!canvas || !canAccessCanvas(canvas, socket.data.userId)) {
          await socket.leave(canvasId);
          return reply(callback, {
            ok: false,
            error: "Unauthorized to update this canvas",
          });
        }

        socket.to(canvasId).emit("canvas:updated", {
          canvasId,
          elements,
          updatedBy: socket.data.userId,
        });
        return reply(callback, { ok: true });
      } catch (error) {
        return reply(callback, { ok: false, error: "Failed to update canvas" });
      }
    });
  });

  return io;
};

module.exports = configureSocket;
