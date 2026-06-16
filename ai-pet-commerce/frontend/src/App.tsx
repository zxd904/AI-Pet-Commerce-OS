import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './services/api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SelectionPage from './pages/SelectionPage';
import GeneratePage from './pages/GeneratePage';
import UploadPage from './pages/UploadPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BillingPage from './pages/BillingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = !!getToken();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showNavbar, setShowNavbar] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login' || path === '/register') {
      setShowNavbar(false);
    } else {
      setShowNavbar(true);
      const menuMap: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/selection': 'selection',
        '/generate': 'generate',
        '/upload': 'upload',
        '/analytics': 'analytics',
        '/billing': 'billing',
      };
      setActiveMenu(menuMap[path] || 'dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen">
      {showNavbar && <Navbar activeMenu={activeMenu} onMenuChange={setActiveMenu} />}
      <main className={`pt-${showNavbar ? '20' : '0'}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/selection" element={
            <ProtectedRoute><SelectionPage /></ProtectedRoute>
          } />
          <Route path="/generate" element={
            <ProtectedRoute><GeneratePage /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute><UploadPage /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute><BillingPage /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;