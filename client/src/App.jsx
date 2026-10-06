import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import YouTubeHub from "./pages/YouTubeHub";
import Prephub from "./pages/Prephub";
import Settings from "./pages/Settings";
import PlaylistDetails from "./pages/PlaylistDetails";
import PlaylistPlayer from "./pages/PlaylistPlayer";
import ProtectedRoute from "./components/common/ProtectedRoute";

const PROTECTED_ROUTES = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/practice",
    element: <Practice />,
  },
  {
    path: "/youtube",
    element: <YouTubeHub />,
  },
  {
    path: "/library",
    element: <YouTubeHub />,
  },
  {
    path: "/prephub",
    element: <Prephub />,
  },
  {
    path: "/profile",
    element: <Navigate to="/settings" replace />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/playlist/:id",
    element: <PlaylistDetails />,
  },
  {
    path: "/playlist/:playlistId/video/:videoId",
    element: <PlaylistPlayer />,
  },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {PROTECTED_ROUTES.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ProtectedRoute>{element}</ProtectedRoute>}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
