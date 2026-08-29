import BoardProvider from "./store/BoardProvider";
import Board from "./components/Board";
import ToolBar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";
import ToolboxProvider from "./store/ToolboxProvider";

function App() {
  return (
    <BoardProvider>
      <ToolboxProvider>
        <div className="board-overlay">
          <div className="board-overlay-control">
            <ToolBar />
          </div>
          <div className="board-overlay-control">
            <Toolbox />
          </div>
        </div>

        <Board />
      </ToolboxProvider>
    </BoardProvider>
  );
}

export default App;
