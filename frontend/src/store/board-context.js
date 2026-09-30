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
  fetchCanvases: async () => {},
  createCanvas: async () => null,
  renameCanvas: async () => {},
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
