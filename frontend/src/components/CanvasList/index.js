import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheck,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import boardContext from "../../store/board-context";
import styles from "./index.module.css";

function CanvasList() {
  const navigate = useNavigate();
  const {
    canvases,
    canvasesLoading,
    canvasesError,
    canvasCreating,
    canvasCreateError,
    fetchCanvases,
    createCanvas,
    renameCanvas,
    deleteCanvas,
  } = useContext(boardContext);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [canvasNameDraft, setCanvasNameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingCanvasId, setDeletingCanvasId] = useState(null);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  const handleCreateCanvas = async () => {
    const canvasId = await createCanvas();
    if (canvasId) navigate(`/board/${canvasId}`);
  };

  const beginRename = (canvas) => {
    setEditingCanvasId(canvas._id);
    setCanvasNameDraft(canvas.name || "Untitled canvas");
    setRenameError("");
  };

  const handleRename = async (event, canvasId) => {
    event.preventDefault();
    try {
      await renameCanvas(canvasId, canvasNameDraft);
      setEditingCanvasId(null);
      setRenameError("");
    } catch (error) {
      setRenameError(error.message);
    }
  };

  const handleDelete = async (canvas) => {
    const canvasName = canvas.name || "Untitled canvas";
    if (!window.confirm(`Delete "${canvasName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingCanvasId(canvas._id);
    setDeleteError("");
    try {
      await deleteCanvas(canvas._id);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeletingCanvasId(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Workspace</p>
            <h1 className={styles.title}>Your canvases</h1>
            <p className={styles.subtitle}>
              Pick up an idea or start a new board.
            </p>
          </div>
          <button
            className={styles.createButton}
            type="button"
            onClick={handleCreateCanvas}
            disabled={canvasCreating || !localStorage.getItem("token")}
          >
            <FiPlus aria-hidden="true" />
            {canvasCreating ? "Creating..." : "New canvas"}
          </button>
        </header>

        {canvasCreateError && (
          <p className={styles.error} role="alert">
            {canvasCreateError}
          </p>
        )}
        {renameError && (
          <p className={styles.error} role="alert">
            {renameError}
          </p>
        )}
        {deleteError && (
          <p className={styles.error} role="alert">
            {deleteError}
          </p>
        )}
        {canvasesLoading && (
          <p className={styles.message} role="status">
            Loading canvases...
          </p>
        )}
        {canvasesError && (
          <p className={styles.error} role="alert">
            {canvasesError}
          </p>
        )}
        {!canvasesLoading && !canvasesError && canvases.length === 0 && (
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <FiFileText />
            </span>
            <h2>No canvases yet</h2>
            <p>Your new boards will appear here.</p>
            <button
              className={styles.emptyButton}
              type="button"
              onClick={handleCreateCanvas}
              disabled={canvasCreating || !localStorage.getItem("token")}
            >
              <FiPlus aria-hidden="true" />
              Create your first canvas
            </button>
          </section>
        )}
        <ul className={styles.canvasList}>
          {canvases.map((canvas) => (
            <li className={styles.canvasItem} key={canvas._id}>
              {editingCanvasId === canvas._id ? (
                <form
                  className={styles.renameForm}
                  onSubmit={(event) => handleRename(event, canvas._id)}
                >
                  <input
                    aria-label="Canvas name"
                    className={styles.renameInput}
                    maxLength={100}
                    onChange={(event) => setCanvasNameDraft(event.target.value)}
                    value={canvasNameDraft}
                    autoFocus
                  />
                  <button
                    className={styles.iconButton}
                    type="submit"
                    aria-label="Save canvas name"
                    title="Save name"
                  >
                    <FiCheck aria-hidden="true" />
                  </button>
                  <button
                    className={styles.iconButton}
                    type="button"
                    aria-label="Cancel renaming"
                    title="Cancel"
                    onClick={() => setEditingCanvasId(null)}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    className={styles.canvasLink}
                    to={`/board/${canvas._id}`}
                  >
                    <span className={styles.canvasIcon} aria-hidden="true">
                      <FiFileText />
                    </span>
                    <span className={styles.canvasDetails}>
                      <span className={styles.canvasName}>
                        {canvas.name || "Untitled canvas"}
                      </span>
                      <span className={styles.canvasMeta}>
                        <span>ID {canvas._id.slice(-6)}</span>
                        {canvas.createdAt && (
                          <time dateTime={canvas.createdAt}>
                            <FiCalendar aria-hidden="true" />
                            {new Date(canvas.createdAt).toLocaleDateString()}
                          </time>
                        )}
                      </span>
                    </span>
                  </Link>
                  <button
                    className={styles.renameButton}
                    type="button"
                    onClick={() => beginRename(canvas)}
                    aria-label={`Rename ${canvas.name || "canvas"}`}
                    title="Rename canvas"
                  >
                    <FiEdit2 aria-hidden="true" />
                    <span>Rename</span>
                  </button>
                  {canvas.isOwner && (
                    <button
                      className={styles.deleteButton}
                      type="button"
                      onClick={() => handleDelete(canvas)}
                      disabled={deletingCanvasId === canvas._id}
                      aria-label={`Delete ${canvas.name || "canvas"}`}
                      title="Delete canvas"
                    >
                      <FiTrash2 aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default CanvasList;
