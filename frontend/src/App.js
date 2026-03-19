import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Lenis as ReactLenis } from 'lenis/react';

// Pages
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProgramView from "./pages/ProgramView";
import SubjectView from "./pages/SubjectView";
import VideoPlayer from "./pages/VideoPlayer";
import ExploreCourses from "./pages/ExploreCourses";
import QuizView from "./pages/QuizView";
import CertificateView from "./pages/CertificateView";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Scroll to top
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function App() {
  return (
    <ReactLenis root>
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Auth type="login" />} />
                <Route path="/register" element={<Auth type="register" />} />

                {/* Protected LMS Routes */}
                <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="explore" element={<ExploreCourses />} />
                    <Route path="program/:programId" element={<ProgramView />} />
                    <Route path="subject/:subjectId" element={<SubjectView />} />
                    <Route path="unit/:unitId/video/:videoId" element={<VideoPlayer />} />
                    <Route path="unit/:unitId/quiz" element={<QuizView />} />
                    <Route path="certificate/:programId" element={<CertificateView />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </ReactLenis>
  );
}

export default App;
