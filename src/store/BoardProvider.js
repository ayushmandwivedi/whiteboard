import React, { useReducer } from "react";
import boardContext from "./board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import { createRoughElement } from "../utils/element";

const boardReducer = (state, action) => {
  switch (action.type) {
    case "CHANGE_TOOL": {
      return {
        ...state,
        activeToolItem: action.payload.tool,
      };
    }
    case "DRAW_DOWN": {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createRoughElement(
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
        toolActionType: TOOL_ACTION_TYPES.DRAWING,
      };
    }
    case "DRAW_MOVE": {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const { x1, y1, stroke, fill, size } = newElements[index];

      const newElement = createRoughElement(index, x1, y1, clientX, clientY, {
        type: state.activeToolItem,
        stroke: stroke,
        fill: fill,
        size: size,
      });
      newElements[index] = newElement;
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.DRAWING,
        elements: newElements,
      };
    }

    case "DRAW_UP": {
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
      };
    }
    default:
      return state;
  }
};
const initialBoardState = {
  activeToolItem: TOOL_ITEMS.LINE,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
};
const BoardProvider = ({ children }) => {
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState,
  );

  const changeToolHandler = (tool) => {
    dispatchBoardAction({ type: "CHANGE_TOOL", payload: { tool } });
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    const { clientX, clientY } = event;
    dispatchBoardAction({
      type: "DRAW_DOWN",
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
    dispatchBoardAction({ type: "DRAW_MOVE", payload: { clientX, clientY } });
  };

  const boardMouseUpHandler = () => {
    dispatchBoardAction({ type: "DRAW_UP" });
  };

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
