import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import RankingsPage from './pages/RankingsPage';
import ContentGeneratorPage from './pages/ContentGeneratorPage';
import AgentConsolePage from './pages/AgentConsolePage';
import BillingPage from './pages/BillingPage';
import { UserProvider, useUser } from './context/UserContext';

function AppContent() {
  const { user, refreshUser } = useUser();

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="ml-64 min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/generator" element={<ContentGeneratorPage />} />
            <Route path="/agent" element={<AgentConsolePage />} />
            <Route path="/billing" element={<BillingPage />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
