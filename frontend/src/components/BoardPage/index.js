import { useContext, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Board from "../Board";
import ToolBar from "../Toolbar";
import Toolbox from "../Toolbox";
import ToolboxProvider from "../../store/ToolboxProvider";
import boardContext from "../../store/board-context";
import styles from "./index.module.css";

function BoardPage() {
  const { id } = useParams();
  const { loadCanvas, canvasLoading, canvasError, canvasSaveStatus } =
    useContext(boardContext);

  useEffect(() => {
    if (id) loadCanvas(id);
  }, [id, loadCanvas]);

  if (id && canvasLoading) return <main role="status">Loading canvas...</main>;
  if (id && canvasError) {
    return (
      <main>
        <p role="alert">{canvasError}</p>
        <Link to="/canvases">Back to canvases</Link>
      </main>
    );
  }

  return (
    <ToolboxProvider>
      <div className="board-overlay">
        {id && (
          <div className={styles.saveStatus} role="status">
            {canvasSaveStatus === "saving"
              ? "Saving..."
              : canvasSaveStatus === "error"
                ? "Save failed"
                : "All changes saved"}
          </div>
        )}
        <div className="board-overlay-control">
          <ToolBar />
        </div>
        <div className="board-overlay-control">
          <Toolbox />
        </div>
      </div>

      <Board id={id} />
    </ToolboxProvider>
  );
}

export default BoardPage;