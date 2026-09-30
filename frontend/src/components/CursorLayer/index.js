import { FaMousePointer } from "react-icons/fa";
import styles from "./index.module.css";

const cursorColors = ["#be123c", "#0369a1", "#15803d", "#7e22ce", "#b45309"];

const getCursorColor = (socketId) => {
  const hash = Array.from(socketId).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return cursorColors[hash % cursorColors.length];
};

function CursorLayer({ cursors }) {
  return (
    <div className={styles.layer} aria-hidden="true">
      {Object.values(cursors).map((cursor) => (
        <div
          className={styles.cursor}
          key={cursor.socketId}
          style={{
            left: cursor.x,
            top: cursor.y,
            "--cursor-color": getCursorColor(cursor.socketId),
          }}
        >
          <FaMousePointer className={styles.pointer} />
          <span className={styles.label}>{cursor.name || "Collaborator"}</span>
        </div>
      ))}
    </div>
  );
}

export default CursorLayer;
