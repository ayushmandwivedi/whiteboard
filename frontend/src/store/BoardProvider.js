import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import {
  createElement,
  getSvgPathFromStroke,
  isPointNearElement,
} from "../utils/element";
import getStroke from "perfect-freehand";

const serializeElements = (elements) =>
  elements.map(({ path, roughEle, ...element }) => element);

const restoreElements = (elements) =>
  elements.map((element, index) => {
    if (element.type === TOOL_ITEMS.BRUSH) {
      const points = element.points || [];
      return {
        ...element,
        id: element.id ?? index,
        points,
        path: new Path2D(getSvgPathFromStroke(getStroke(points))),
      };
    }

    const restoredElement = createElement(
      element.id ?? index,
      element.x1,
      element.y1,
      element.x2,
      element.y2,
      {
        type: element.type,
        fill: element.fill,
        stroke: element.stroke,
        size: element.size,
      },
    );
    return {
      ...element,
      ...restoredElement,
      ...(element.type === TOOL_ITEMS.TEXT ? { text: element.text || "" } : {}),
    };
  });

const boardReducer = (state, action) => {
  switch (action.type) {
    case "LOAD_CANVAS": {
      return {
        ...state,
        canvasId: action.payload.canvasId,
        elements: action.payload.elements,
        history: [action.payload.elements],
        index: 0,
        toolActionType: TOOL_ACTION_TYPES.NONE,
      };
    }
    case "SYNC_CANVAS": {
      const history = [
        ...state.history.slice(0, state.index),
        action.payload.elements,
      ];
      return {
        ...state,
        elements: action.payload.elements,
        history,
        index: history.length - 1,
      };
    }
    case BOARD_ACTIONS.CHANGE_TOOL: {
      return {
        ...state,
        activeToolItem: action.payload.tool,
      };
    }
    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return {
        ...state,
        toolActionType: action.payload.actionType,
      };
    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createElement(
        state.elements.length,
        clientX,
        clientY,
        clientX,
        clientY,
        { type: state.activeToolItem, stroke, fill, size },
      );
      const prevEle = state.elements;
      return {
        ...state,
        elements: [...prevEle, newElement],
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const { type } = newElements[index];
      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW: {
          const { x1, y1, stroke, fill, size } = newElements[index];
          const newElement = createElement(index, x1, y1, clientX, clientY, {
            type: state.activeToolItem,
            stroke,
            fill,
            size,
          });
          newElements[index] = newElement;
          return {
            ...state,
            elements: newElements,
          };
        }
        case TOOL_ITEMS.BRUSH:
          newElements[index].points = [
            ...newElements[index].points,
            { x: clientX, y: clientY },
          ];
          newElements[index].path = new Path2D(
            getSvgPathFromStroke(getStroke(newElements[index].points)),
          );
          return {
            ...state,
            elements: newElements,
          };
        default:
          throw new Error("Type not recognized");
      }
    }
    case BOARD_ACTIONS.DRAW_UP: {
      const elements = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elements);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements];
      newElements = newElements.filter((element) => {
        return !isPointNearElement(element, clientX, clientY);
      });
      return {
        ...state,
        elements: newElements,
      };
    }
    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };
    }
    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };
    }
    default:
      return state;
  }
};
const initialBoardState = {
  canvasId: null,
  activeToolItem: TOOL_ITEMS.BRUSH,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  history: [[]],
  index: 0,
};
const BoardProvider = ({ children }) => {
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState,
  );
  const [canvases, setCanvases] = useState([]);
  const [canvasesLoading, setCanvasesLoading] = useState(false);
  const [canvasesError, setCanvasesError] = useState("");
  const [canvasCreating, setCanvasCreating] = useState(false);
  const [canvasCreateError, setCanvasCreateError] = useState("");
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [canvasError, setCanvasError] = useState("");
  const [canvasSaveStatus, setCanvasSaveStatus] = useState("saved");
  const [canvasSocketReady, setCanvasSocketReady] = useState(false);
  const socketRef = useRef(null);
  const suppressNextBroadcastRef = useRef(false);
  const pendingCanvasSyncRef = useRef(null);

  const fetchCanvases = useCallback(async () => {
    setCanvasesLoading(true);
    setCanvasesError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in to view your canvases.");

      const response = await fetch("http://localhost:3030/api/canvas/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch canvases.");
      setCanvases(data);
    } catch (error) {
      setCanvasesError(error.message);
    } finally {
      setCanvasesLoading(false);
    }
  }, []);

  const createCanvas = useCallback(async () => {
    setCanvasCreating(true);
    setCanvasCreateError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in to create a canvas.");

      const response = await fetch("http://localhost:3030/api/canvas/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create canvas.");
      if (!data.canvasId)
        throw new Error("The server did not return a canvas ID.");

      return data.canvasId;
    } catch (error) {
      setCanvasCreateError(error.message);
      return null;
    } finally {
      setCanvasCreating(false);
    }
  }, []);

  const renameCanvas = useCallback(async (id, name) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please log in to rename this canvas.");

    const response = await fetch(`http://localhost:3030/api/canvas/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to rename canvas.");

    setCanvases((currentCanvases) =>
      currentCanvases.map((canvas) =>
        canvas._id === id ? { ...canvas, ...data.canvas } : canvas,
      ),
    );
  }, []);

  const shareCanvas = useCallback(async (id, email) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please log in to share this canvas.");

    const response = await fetch(
      `http://localhost:3030/api/canvas/share/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to share canvas.");

    setCanvases((currentCanvases) =>
      currentCanvases.map((canvas) =>
        canvas._id === id
          ? {
              ...canvas,
              shared: [...(canvas.shared || []), data.sharedUser.id],
            }
          : canvas,
      ),
    );
    return data.sharedUser;
  }, []);

  const deleteCanvas = useCallback(async (id) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please log in to delete this canvas.");

    const response = await fetch(`http://localhost:3030/api/canvas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to delete canvas.");

    setCanvases((currentCanvases) =>
      currentCanvases.filter((canvas) => canvas._id !== id),
    );
  }, []);

  const saveCanvas = useCallback(async (id, elements) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCanvasSaveStatus("error");
      return;
    }

    setCanvasSaveStatus("saving");
    try {
      const response = await fetch(`http://localhost:3030/api/canvas/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ elements: serializeElements(elements) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save canvas.");
      setCanvasSaveStatus("saved");
    } catch (error) {
      console.error("Canvas autosave failed:", error);
      setCanvasSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    const canvasId = boardState.canvasId;
    if (!canvasId) {
      setCanvasSocketReady(false);
      return undefined;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setCanvasSocketReady(false);
      return undefined;
    }

    const socket = io("http://localhost:3030", { auth: { token } });
    socketRef.current = socket;
    setCanvasSocketReady(false);

    socket.on("connect", () => {
      socket.emit("canvas:join", canvasId, (result) => {
        if (!result?.ok || socketRef.current !== socket) {
          if (result?.error)
            console.error("Canvas socket join failed:", result.error);
          return;
        }

        setCanvasSocketReady(true);
        if (Array.isArray(result.elements)) {
          pendingCanvasSyncRef.current = null;
          suppressNextBroadcastRef.current = true;
          dispatchBoardAction({
            type: "SYNC_CANVAS",
            payload: { elements: restoreElements(result.elements) },
          });
        }
      });
    });

    socket.on("canvas:updated", (update) => {
      if (update.canvasId !== canvasId) return;
      pendingCanvasSyncRef.current = null;
      suppressNextBroadcastRef.current = true;
      dispatchBoardAction({
        type: "SYNC_CANVAS",
        payload: { elements: restoreElements(update.elements || []) },
      });
    });

    socket.on("disconnect", () => setCanvasSocketReady(false));
    socket.on("connect_error", (error) => {
      console.error("Canvas socket connection failed:", error.message);
      setCanvasSocketReady(false);
    });

    return () => {
      setCanvasSocketReady(false);
      pendingCanvasSyncRef.current = null;
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [boardState.canvasId]);

  useEffect(() => {
    if (!boardState.canvasId || !canvasSocketReady) return undefined;
    if (suppressNextBroadcastRef.current) {
      suppressNextBroadcastRef.current = false;
      pendingCanvasSyncRef.current = null;
      return undefined;
    }

    pendingCanvasSyncRef.current = {
      canvasId: boardState.canvasId,
      elements: serializeElements(boardState.elements),
    };
  }, [boardState.canvasId, boardState.elements, canvasSocketReady]);

  useEffect(() => {
    if (!boardState.canvasId || !canvasSocketReady) return undefined;

    const intervalId = window.setInterval(() => {
      const pendingSync = pendingCanvasSyncRef.current;
      const socket = socketRef.current;
      if (!pendingSync || !socket?.connected) return;

      pendingCanvasSyncRef.current = null;
      socket.emit("canvas:sync", pendingSync, (result) => {
        if (!result?.ok) {
          console.error("Canvas sync failed:", result?.error);
        }
      });
    }, 80);

    return () => window.clearInterval(intervalId);
  }, [boardState.canvasId, canvasSocketReady]);

  useEffect(() => {
    if (!boardState.canvasId) return undefined;

    const timeoutId = window.setTimeout(() => {
      saveCanvas(boardState.canvasId, boardState.elements);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [boardState.canvasId, boardState.elements, saveCanvas]);

  const loadCanvas = useCallback(async (id) => {
    setCanvasLoading(true);
    setCanvasError("");
    setCanvasSaveStatus("saved");
    dispatchBoardAction({
      type: "LOAD_CANVAS",
      payload: { canvasId: null, elements: [] },
    });
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in to open this canvas.");

      const response = await fetch(`http://localhost:3030/api/canvas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load canvas.");

      dispatchBoardAction({
        type: "LOAD_CANVAS",
        payload: {
          canvasId: id,
          elements: restoreElements(data.elements || []),
        },
      });
    } catch (error) {
      setCanvasError(error.message);
    } finally {
      setCanvasLoading(false);
    }
  }, []);

  const changeToolHandler = (tool) => {
    dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (event) => {
    const { clientX, clientY } = event;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: { clientX, clientY },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: { clientX, clientY },
      });
    }
  };

  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    if (
      boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING ||
      boardState.toolActionType === TOOL_ACTION_TYPES.ERASING
    ) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  const textAreaBlurHandler = (text) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text,
      },
    });
  };

  const boardUndoHandler = useCallback(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  }, []);

  const boardRedoHandler = useCallback(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  }, []);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    canvases,
    canvasesLoading,
    canvasesError,
    canvasCreating,
    canvasCreateError,
    canvasLoading,
    canvasError,
    canvasSaveStatus,
    canvasSocketReady,
    fetchCanvases,
    createCanvas,
    renameCanvas,
    shareCanvas,
    deleteCanvas,
    loadCanvas,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    boardUndoHandler,
    boardRedoHandler,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
