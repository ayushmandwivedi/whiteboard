const Canvas = require("../models/canvasModel");

const getUserCanvases = async (req, res) => {
  try {
    const userId = req.user.userId;

    const canvases = await Canvas.find({
      $or: [{ owner: userId }, { shared: userId }],
    }).sort({ createdAt: -1 });

    res.json(canvases);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch canvases", details: error.message });
  }
};

module.exports = { getUserCanvases };
