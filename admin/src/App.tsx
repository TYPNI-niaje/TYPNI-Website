import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import BlogPosts from './pages/BlogPosts';
import Events from './pages/Events';
import Login from './pages/Login';
import Memberships from './pages/Memberships';
import AdminTracking from './pages/AdminTracking';
import EventDetail from './pages/EventDetail';
import EventForm from './pages/EventForm';
import { supabase, getCurrentUser, getCurrentUserProfile, logAdminAction } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BlogEditor from './pages/BlogEditor';
import BlogView from './pages/BlogView';
import Analytics from './pages/Analytics';
import AuthLoadingScreen from './components/Loading/AuthLoadingScreen';
import SignOutAnimation from './components/SignOut/SignOutAnimation';
import ConfirmSignOut from './components/SignOut/ConfirmSignOut';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry failed queries once
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  }
});

// Last authentication check timestamp
const AUTH_CHECK_INTERVAL = 30000; // 30 seconds
let lastAuthCheck = 0;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { isSigningOut, signOut, showConfirmSignOut, setShowConfirmSignOut } = useAuth();

  // Check if we should perform auth check based on time interval
  const shouldCheckAuth = () => {
    const now = Date.now();
    if (now - lastAuthCheck > AUTH_CHECK_INTERVAL) {
      lastAuthCheck = now;
      return true;
    }
    return false;
  };

  // Handle sign out button click
  const handleSignOutClick = () => {
    setShowConfirmSignOut(true);
  };
  
  // Handle confirmation dialog responses
  const handleConfirmSignOut = () => {
    setShowConfirmSignOut(false);
    signOut();
  };
  
  const handleCancelSignOut = () => {
    setShowConfirmSignOut(false);
  };

  // Load persisted state on initial render
  useEffect(() => {
    try {
      const persistedState = localStorage.getItem('admin_auth_state');
      if (persistedState) {
        const { user, profile, isAdmin } = JSON.parse(persistedState);
        if (user && profile) {
          setUser(user);
          setProfile(profile);
          setIsAdmin(isAdmin);
          setIsLoading(false); // If we have persisted state, we can show content immediately
          return;
        }
      }
    } catch (err) {
      console.error('Error loading persisted state:', err);
      localStorage.removeItem('admin_auth_state');
    }
    setIsLoading(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      // Don't run multiple auth checks in rapid succession
      if (!shouldCheckAuth() && user) {
        setIsLoading(false);
        return;
      }

      try {
        setAuthError(null);
        console.log("Checking user authentication...");
        const currentUser = await getCurrentUser();
        console.log("Current user:", currentUser);
        
        if (!currentUser) {
          // No user is logged in
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
          localStorage.removeItem('admin_auth_state');
          console.log("No authenticated user found");
          setIsLoading(false);
          return;
        }
        
        setUser(currentUser);
        
        try {
          // Get profile data for user
          const profileData = await getCurrentUserProfile(currentUser.id);
          console.log("Profile data:", profileData);
          
          if (profileData) {
            setProfile(profileData);
            setIsAdmin(profileData.role === 'Admin');
            
            // Only persist state if user is an admin
            if (profileData.role === 'Admin') {
              localStorage.setItem('admin_auth_state', JSON.stringify({
                user: currentUser,
                profile: profileData,
                isAdmin: true
              }));
            } else {
              // Non-admin user somehow got here, sign them out
              await supabase.auth.signOut();
              setUser(null);
              setIsAdmin(false);
              setProfile(null);
              localStorage.removeItem('admin_auth_state');
            }
          }
        } catch (profileError) {
          console.error("Error fetching profile data:", profileError);
          // Handle error gracefully without showing access denied
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
          localStorage.removeItem('admin_auth_state');
        }
      } catch (error) {
        console.error('Error in checkUser function:', error);
        setAuthError("Authentication error. Please try again.");
        setUser(null);
        setIsAdmin(false);
        setProfile(null);
        localStorage.removeItem('admin_auth_state');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call the checkUser function
    checkUser();
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached - forcing state update");
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      // Track session expiration
      if (event === 'SIGNED_OUT' && user && !session) {
        // This likely means the session expired
        logAdminAction(
          user.id,
          'session_expired',
          {
            email: user.email,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            location: window.location.pathname,
            last_activity: lastAuthCheck ? new Date(lastAuthCheck).toISOString() : null
          }
        ).catch(err => console.error('Error logging session expiration:', err));
      }
      
      // Only respond to significant auth events - avoid responding to token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        checkUser();
      }
    });

    return () => {
      clearTimeout(timeoutId);
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [user]);

  // Show loading screen while checking auth
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Show sign out animation when signing out
  if (isSigningOut) {
    return <SignOutAnimation isVisible={true} />;
  }

  return (
    <Router>
      {/* Sign out confirmation dialog */}
      <ConfirmSignOut
        isOpen={showConfirmSignOut}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
      
      {!user ? (
        <Routes>
          <Route path="*" element={<Login error={authError} />} />
        </Routes>
      ) : !isAdmin ? (
        <Navigate to="/admin/login" replace />
      ) : (
        <div className="flex h-screen overflow-hidden bg-gray-100">
          <Sidebar onClose={() => setSidebarOpen(false)} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} profile={profile} />
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  <Routes>
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/blog-posts" element={<BlogPosts />} />
                    <Route path="/admin/blog-posts/new" element={<BlogEditor />} />
                    <Route path="/admin/blog-posts/:id" element={<BlogView />} />
                    <Route path="/admin/blog-posts/edit/:id" element={<BlogEditor />} />
                    <Route path="/admin/events" element={<Events />} />
                    <Route path="/admin/events/new" element={<EventForm />} />
                    <Route path="/admin/events/:id" element={<EventDetail />} />
                    <Route path="/admin/events/edit/:id" element={<EventForm />} />
                    <Route path="/admin/memberships" element={<Memberships />} />
                    <Route path="/admin/tracking" element={<AdminTracking />} />
                    <Route path="/admin/analytics" element={<Analytics />} />
                    <Route path="/admin/settings" element={
                      <div className="p-4">
                        <h2 className="text-xl font-bold mb-4">Settings</h2>
                        <button 
                          onClick={handleSignOutClick} 
                          className="btn-secondary"
                        >
                          Sign Out
                        </button>
                      </div>
                    } />
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
