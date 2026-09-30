import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import CursorLayer from "../CursorLayer";
import classes from "./index.module.css";

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const [canvasSize, setCanvasSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const {
    elements,
    toolActionType,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    boardCursorMoveHandler,
    remoteCursors,
    textAreaBlurHandler,
    boardUndoHandler,
    boardRedoHandler,
  } = useContext(boardContext);
  useLayoutEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setCanvasSize({ width: canvas.width, height: canvas.height });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const { toolboxState } = useContext(toolboxContext);

  useEffect(() => {
    window.addEventListener("pointermove", boardCursorMoveHandler);
    return () =>
      window.removeEventListener("pointermove", boardCursorMoveHandler);
  }, [boardCursorMoveHandler]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === "z") {
        boardUndoHandler();
      } else if (event.ctrlKey && event.key === "y") {
        boardRedoHandler();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [boardUndoHandler, boardRedoHandler]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);
    let cancelled = false;

    const drawElements = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      elements.forEach((element) => {
        if (
          element.type === TOOL_ITEMS.ARROW &&
          element.x1 === element.x2 &&
          element.y1 === element.y2
        ) {
          return;
        }

        switch (element.type) {
          case TOOL_ITEMS.LINE:
          case TOOL_ITEMS.RECTANGLE:
          case TOOL_ITEMS.CIRCLE:
          case TOOL_ITEMS.ARROW:
            roughCanvas.draw(element.roughEle);
            break;
          case TOOL_ITEMS.BRUSH:
            context.fillStyle = element.stroke;
            context.fill(element.path);
            context.restore();
            break;
          case TOOL_ITEMS.TEXT:
            context.textBaseline = "top";
            context.font = `${element.size}px "Caveat"`;
            context.fillStyle = element.stroke;
            context.fillText(element.text, element.x1, element.y1);
            context.restore();
            break;
          default:
            throw new Error("Type not recognized");
        }
      });
    };

    const textFonts = [
      ...new Set(
        elements
          .filter((element) => element.type === TOOL_ITEMS.TEXT)
          .map((element) => `${element.size}px "Caveat"`),
      ),
    ];

    Promise.all(textFonts.map((font) => document.fonts.load(font))).then(() => {
      if (!cancelled) drawElements();
    });

    return () => {
      cancelled = true;
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [canvasSize, elements]);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => {
        textarea.focus();
      }, 0);
    }
  }, [toolActionType]);

  const handleMouseDown = (event) => {
    boardMouseDownHandler(event, toolboxState);
  };

  const handleMouseMove = (event) => {
    boardMouseMoveHandler(event);
  };

  const handleMouseUp = () => {
    boardMouseUpHandler();
  };

  const currentTextElement = elements[elements.length - 1];

  return (
    <>
      <CursorLayer cursors={remoteCursors} />
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: currentTextElement?.y1,
            left: currentTextElement?.x1,
            fontSize: `${currentTextElement?.size}px`,
            color: currentTextElement?.stroke,
          }}
          onBlur={(event) =>
            textAreaBlurHandler(event.target.value, toolboxState)
          }
        />
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}

export default Board;
