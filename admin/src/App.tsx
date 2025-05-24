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

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

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
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/admin/events/new" element={
                <ProtectedRoute>
                  <EventForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/events/:id" element={
                <ProtectedRoute>
                  <EventDetail />
                </ProtectedRoute>
              } />
              <Route path="/admin/events/:id/edit" element={
                <ProtectedRoute>
                  <EventForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/blog" element={
                <ProtectedRoute>
                  <BlogPosts />
                </ProtectedRoute>
              } />
              <Route path="/admin/blog/new" element={
                <ProtectedRoute>
                  <BlogEditor />
                </ProtectedRoute>
              } />
              <Route path="/admin/blog/:id" element={
                <ProtectedRoute>
                  <BlogView />
                </ProtectedRoute>
              } />
              <Route path="/admin/blog/:id/edit" element={
                <ProtectedRoute>
                  <BlogEditor />
                </ProtectedRoute>
              } />
              <Route path="/admin/memberships" element={
                <ProtectedRoute>
                  <Memberships />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/tracking" element={
                <ProtectedRoute>
                  <AdminTracking />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/admin" replace />} />
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
