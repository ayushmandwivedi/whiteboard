const Canvas = require("../models/canvasModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUserCanvases = async (req, res) => {
  try {
    const userId = req.user.userId;

    const canvases = await Canvas.find({
      $or: [{ owner: userId }, { shared: userId }],
    }).sort({ createdAt: -1 });

    res.json(
      canvases.map((canvas) => ({
        ...canvas.toObject(),
        isOwner: canvas.owner.toString() === userId,
      })),
    );
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch canvases", details: error.message });
  }
};

const createCanvas = async (req, res) => {
  try {
    const userId = req.user.userId;
    const newCanvas = new Canvas({
      owner: userId,
      shared: [],
      elements: [],
    });

    await newCanvas.save();
    return res.status(201).json({
      message: "Canvas created successfully",
      canvasId: newCanvas._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to create canvas", details: error.message });
  }
};

const loadCanvas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const canvas = await Canvas.findById(id);
    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    const userId = req.user.userId;
    const isOwner = canvas.owner.toString() === userId;
    const isSharedWithUser = canvas.shared.some(
      (sharedUserId) => sharedUserId.toString() === userId,
    );
    if (!isOwner && !isSharedWithUser) {
      return res
        .status(403)
        .json({ error: "Unauthorized to access this canvas" });
    }

    return res.json(canvas);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to load canvas", details: error.message });
  }
};

const updateCanvas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const canvas = await Canvas.findById(id);
    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    const userId = req.user.userId;
    const isOwner = canvas.owner.toString() === userId;
    const isSharedWithUser = canvas.shared.some(
      (sharedUserId) => sharedUserId.toString() === userId,
    );
    if (!isOwner && !isSharedWithUser) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this canvas" });
    }

    if (Object.hasOwn(req.body, "name")) {
      const name =
        typeof req.body.name === "string" ? req.body.name.trim() : "";
      if (!name || name.length > 100) {
        return res
          .status(400)
          .json({ error: "Canvas name must be between 1 and 100 characters" });
      }
      if (!isOwner) {
        return res
          .status(403)
          .json({ error: "Only the owner can rename this canvas" });
      }
      canvas.name = name;
    }

    if (Object.hasOwn(req.body, "elements")) {
      if (!Array.isArray(req.body.elements)) {
        return res
          .status(400)
          .json({ error: "Canvas elements must be an array" });
      }
      canvas.elements = req.body.elements;
    }

    await canvas.save();
    return res.json({ message: "Canvas updated successfully", canvas });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to update canvas", details: error.message });
  }
};

const deleteCanvas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const canvas = await Canvas.findById(id);
    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    if (canvas.owner.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete this canvas" });
    }

    await Canvas.findByIdAndDelete(id);
    return res.json({ message: "Canvas deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to delete canvas", details: error.message });
  }
};

const shareCanvas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid canvas ID" });
    }

    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";
    if (!email) {
      return res.status(400).json({ error: "A user email is required" });
    }

    const canvas = await Canvas.findById(id);
    if (!canvas) {
      return res.status(404).json({ error: "Canvas not found" });
    }
    if (canvas.owner.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Only the owner can share this canvas" });
    }

    const userToShare = await User.findOne({
      email: new RegExp(`^${escapeRegExp(email)}$`, "i"),
    }).select("name email");
    if (!userToShare) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    const sharedUserId = userToShare._id;
    if (sharedUserId.toString() === canvas.owner.toString()) {
      return res
        .status(400)
        .json({ error: "Owner cannot be added to shared list" });
    }
    if (
      canvas.shared.some(
        (userId) => userId.toString() === sharedUserId.toString(),
      )
    ) {
      return res.status(409).json({ error: "Already shared with user" });
    }

    canvas.shared.addToSet(sharedUserId);
    await canvas.save();
    return res.status(200).json({
      message: "Canvas shared successfully",
      sharedUser: {
        id: sharedUserId,
        name: userToShare.name,
        email: userToShare.email,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to share canvas", details: error.message });
  }
};

module.exports = {
  getUserCanvases,
  loadCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
  shareCanvas,
};
