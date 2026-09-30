import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import BoardProvider from "./store/BoardProvider";
import BoardPage from "./components/BoardPage";
import CanvasList from "./components/CanvasList";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <BoardProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/canvases" element={<CanvasList />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/:id" element={<BoardPage />} />
        </Routes>
      </Router>
    </BoardProvider>
  );
}

export default App;
