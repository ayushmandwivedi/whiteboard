import { createContext } from "react";

const boardContext = createContext({
  activeToolItem: "",
  toolActionType: "",
  elements: [],
  history: [[]],
  index: 0,
  canvases: [],
  canvasesLoading: false,
  canvasesError: "",
  canvasCreating: false,
  canvasCreateError: "",
  canvasLoading: false,
  canvasError: "",
  canvasSaveStatus: "saved",
  canvasSocketReady: false,
  fetchCanvases: async () => {},
  createCanvas: async () => null,
  renameCanvas: async () => {},
  shareCanvas: async () => null,
  revokeCanvasShare: async () => {},
  deleteCanvas: async () => {},
  loadCanvas: async () => {},
  boardMouseDownHandler: () => {},
  changeToolHandler: () => {},
  boardMouseMoveHandler: () => {},
  boardMouseUpHandler: () => {},
  textAreaBlurHandler: () => {},
  boardUndoHandler: () => {},
  boardRedoHandler: () => {},
});

export default boardContext;
