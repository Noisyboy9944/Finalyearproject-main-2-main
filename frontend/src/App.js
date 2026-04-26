import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Lenis as ReactLenis } from 'lenis/react';
import { Analytics } from '@vercel/analytics/react';

// Lazy-loaded Pages (code splitting for faster initial load)
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProgramView = lazy(() => import("./pages/ProgramView"));
const VideoPlayer = lazy(() => import("./pages/VideoPlayer"));
const ExploreCourses = lazy(() => import("./pages/ExploreCourses"));
const QuizView = lazy(() => import("./pages/QuizView"));
const CertificateView = lazy(() => import("./pages/CertificateView"));
const Profile = lazy(() => import("./pages/Profile"));
const Layout = lazy(() => import("./components/Layout"));


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
            <Suspense fallback={<div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'#f8f9fa'}}><div style={{width:40,height:40,border:'3px solid #e5e7eb',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
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
                    <Route path="program/:programId/video/:videoId" element={<VideoPlayer />} />
                    <Route path="program/:programId/quiz" element={<QuizView />} />
                    <Route path="certificate/:programId" element={<CertificateView />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
            </Suspense>
            <Analytics />
        </BrowserRouter>
    </ReactLenis>
  );
}

export default App;
