import React, { useReducer } from "react";
import toolboxContext from "./toolbox-context";
import { COLORS, TOOL_ITEMS } from "../constants";

function toolBoxReducer(state, action) {
  switch (action.type) {
    case "CHANGE_STROKE": {
      const new_state = { ...state };
      new_state[action.payload.tool].stroke = action.payload.stroke;
      return new_state;
    }
    case "CHANGE_FILL": {
      const new_state = { ...state };
      new_state[action.payload.tool].fill = action.payload.fill;
      return new_state;
    }
    case "CHANGE_SIZE": {
      const new_state = { ...state };
      new_state[action.payload.tool].size = action.payload.size;
      return new_state;
    }
    default:
      break;
  }
}

const initialToolBoxState = {
  [TOOL_ITEMS.LINE]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
  [TOOL_ITEMS.RECTANGLE]: {
    stroke: COLORS.BLACK,
    fill: null,
    size: 1,
  },
  [TOOL_ITEMS.CIRCLE]: {
    stroke: COLORS.BLACK,
    fill: null,
    size: 1,
  },
  [TOOL_ITEMS.ARROW]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
};
const ToolboxProvider = ({ children }) => {
  const [toolboxState, dispatchToolBoxAction] = useReducer(
    toolBoxReducer,
    initialToolBoxState,
  );

  const changeStroke = (tool, stroke) => {
    dispatchToolBoxAction({
      type: "CHANGE_STROKE",
      payload: {
        tool,
        stroke,
      },
    });
  };

  const changeFill = (tool, fill) => {
    dispatchToolBoxAction({
      type: "CHANGE_FILL",
      payload: {
        tool,
        fill,
      },
    });
  };

  const changeSize = (tool, size) => {
    dispatchToolBoxAction({
      type: "CHANGE_SIZE",
      payload: {
        tool,
        size,
      },
    });
  };

  const toolboxContextValue = {
    toolboxState,
    changeStroke,
    changeFill,
    changeSize,
  };
  return (
    <toolboxContext.Provider value={toolboxContextValue}>
      {children}
    </toolboxContext.Provider>
  );
};

export default ToolboxProvider;
