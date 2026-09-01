import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import BoardProvider from "./store/BoardProvider";
import Board from "./components/Board";
import ToolBar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";
import ToolboxProvider from "./store/ToolboxProvider";
import Login from "./components/Login";
import Register from "./components/Register";

function HomePage() {
  const { id } = useParams();
  return (
    <ToolboxProvider>
      <div className="board-overlay">
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

function App() {
  return (
    <BoardProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/board" element={<HomePage />} />
          <Route path="/board/:id" element={<HomePage />} />
        </Routes>
      </Router>
    </BoardProvider>
  );
}

export default App;
