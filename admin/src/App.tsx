import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Events from './pages/Events';
import EventForm from './pages/EventForm';
import EventDetail from './pages/EventDetail';
import BlogPosts from './pages/BlogPosts';
import BlogEditor from './pages/BlogEditor';
import BlogView from './pages/BlogView';
import Memberships from './pages/Memberships';
import Analytics from './pages/Analytics';
import AdminTracking from './pages/AdminTracking';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AuthLoadingScreen from './components/Loading/AuthLoadingScreen';

const queryClient = new QueryClient();

function AppContent({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  const { isAdmin, isLoading, profile } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin/login';

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Render login page without admin layout
  if (isLoginPage) {
  return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/admin/login" element={<Login />} />
        </Routes>
      </div>
    );
  }

  // Render admin layout for all other pages
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onClose={() => setSidebarOpen(false)} isOpen={sidebarOpen} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} profile={profile} />
        <main className="flex-1 overflow-y-auto pt-16 pb-6">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12">
                  <Routes>
              <Route path="/admin" element={<Dashboard />} />
              {isAdmin && (
                <>
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/events" element={<Events />} />
                    <Route path="/admin/events/new" element={<EventForm />} />
                    <Route path="/admin/events/:id" element={<EventDetail />} />
                  <Route path="/admin/events/:id/edit" element={<EventForm />} />
                  <Route path="/admin/blog" element={<BlogPosts />} />
                  <Route path="/admin/blog/new" element={<BlogEditor />} />
                  <Route path="/admin/blog/:id" element={<BlogView />} />
                  <Route path="/admin/blog/:id/edit" element={<BlogEditor />} />
                    <Route path="/admin/memberships" element={<Memberships />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                    <Route path="/admin/tracking" element={<AdminTracking />} />
                  <Route path="/admin/settings" element={<Settings />} />
                </>
              )}
              <Route path="*" element={<Navigate to="/admin" />} />
                  </Routes>
              </div>
            </main>
          </div>
        </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <Toaster position="top-right" />
            <AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
