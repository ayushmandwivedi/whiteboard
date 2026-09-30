const isCanvasOwner = (canvas, userId) =>
  canvas.owner.toString() === userId.toString();

const canAccessCanvas = (canvas, userId) =>
  isCanvasOwner(canvas, userId) ||
  canvas.shared.some((sharedUserId) => sharedUserId.toString() === userId.toString());

module.exports = { canAccessCanvas, isCanvasOwner };