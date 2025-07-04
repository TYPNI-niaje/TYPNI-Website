import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase, type User, type Session } from '../lib/supabase';

// Authentication refresh interval (30 seconds)
const AUTH_CHECK_INTERVAL = 30000;
// Sign out timeout (5 seconds)
const SIGN_OUT_TIMEOUT = 5000;

type AuthContextType = {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  session: Session | null;
  isSigningOut: boolean;
  showConfirmSignOut: boolean;
  setShowConfirmSignOut: (show: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  session: null,
  isSigningOut: false,
  showConfirmSignOut: false,
  setShowConfirmSignOut: () => {},
  signIn: () => Promise.resolve({ error: null }),
  signOut: () => Promise.resolve(),
  refreshUser: () => Promise.resolve(),
});

// Helper function to safely fetch user profile
const safeGetUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Clear all auth-related storage
const clearAuthStorage = () => {
  try {
    localStorage.removeItem('admin_auth_state');
    sessionStorage.removeItem('typni_auth');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);

  // Use refs to keep track of states that shouldn't trigger re-renders
  const lastAuthCheckRef = useRef<number>(0);
  const isSigningOutRef = useRef(false);
  const signOutTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Check for existing session when the app loads
    const checkSession = async () => {
      try {
        setIsLoading(true);
        
        // First, check for cached session data
        const sessionFromStorage = sessionStorage.getItem('typni_auth');
        let sessionData: Session | null = null;
        
        if (sessionFromStorage) {
          try {
            sessionData = JSON.parse(sessionFromStorage) as Session;
            // Basic validation: check if the object has a user property
            if (!sessionData?.user) {
              console.log('Invalid session data in storage, clearing...');
              sessionData = null;
              sessionStorage.removeItem('typni_auth');
            }
          } catch (e) {
            console.error('Error parsing stored session:', e);
            sessionStorage.removeItem('typni_auth');
          }
        }
        
        // If there's no valid cached session, get from Supabase
        if (!sessionData) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session:', error);
            setIsLoading(false);
      return;
    }

          sessionData = data.session;
          
          // Cache the valid session data
          if (sessionData) {
            sessionStorage.setItem('typni_auth', JSON.stringify(sessionData));
          }
        }
        
        setSession(sessionData);
        
        // If no session, we're done
        if (!sessionData) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        const currentUser = sessionData.user;
      setUser(currentUser);

        // Get additional profile data
      if (currentUser) {
          lastAuthCheckRef.current = Date.now(); // Record this check time
          
        const userProfile = await safeGetUserProfile(currentUser.id);
          if (userProfile) {
        setProfile(userProfile);
            setIsAdmin(userProfile.role === 'Admin');
          }
      }
    } catch (error) {
        console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      // Track auth state changes
      if (user?.id) {
        try {
          switch (event) {
            case 'SIGNED_OUT':
              // This could be either manual sign out or session expiration
              if (!session) {
                await supabase.from('admin_actions').insert({
                  admin_id: user.id,
                  action: 'session_expired',
                  details: {
                    email: user.email,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    location: window.location.pathname,
                    last_activity: lastAuthCheckRef.current ? new Date(lastAuthCheckRef.current).toISOString() : null
                  }
                });
              }
              break;
              
            case 'TOKEN_REFRESHED':
              // Log token refresh for security tracking
              await supabase.from('admin_actions').insert({
                admin_id: user.id,
                action: 'token_refresh',
                details: {
                  email: user.email,
                  timestamp: new Date().toISOString(),
                  user_agent: navigator.userAgent,
                  location: window.location.pathname
                }
              });
              break;
          }
        } catch (error) {
          console.error('Error logging auth state change:', error);
        }
      }
      
      // Only respond to significant auth events - avoid responding to token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        checkSession();
      }
    });

    // Clean up the subscription and any pending timeouts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      
      // Clear any pending sign out timeout
      if (signOutTimeoutRef.current !== null) {
        window.clearTimeout(signOutTimeoutRef.current);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        try {
          await supabase.from('admin_actions').insert({
            admin_id: null,
            action: 'failed_login',
            details: {
              email,
              reason: error.message,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              location: window.location.pathname
            }
          });
        } catch (logError) {
          console.error('Error logging failed login:', logError);
        }
        throw error;
      }

      if (data?.session) {
        sessionStorage.setItem('typni_auth', JSON.stringify(data.session));
      setSession(data.session);
      }
      
      if (data?.user) {
        setUser(data.user);
        const userProfile = await safeGetUserProfile(data.user.id);
        setProfile(userProfile);
        setIsAdmin(userProfile?.role === 'Admin');

        // Log successful login
        try {
          await supabase.from('admin_actions').insert({
            admin_id: data.user.id,
            action: 'login',
            details: {
              email: data.user.email,
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              location: window.location.pathname
            }
          });
        } catch (logError) {
          console.error('Error logging successful login:', logError);
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign-in error:', error);
      return { error };
    }
  };

  const finalizeSignOut = () => {
    // Before clearing state, remember current path
    const currentPath = window.location.pathname;
    
    // Clear state completely
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setSession(null);
    setIsSigningOut(false);
    isSigningOutRef.current = false;
    
    // Store the last path to redirect back after sign-in
    localStorage.setItem('admin_last_path', '/admin/dashboard');
    
    // Force a redirect if needed
    if (currentPath !== '/admin/login') {
      // Always redirect to login page
      window.location.href = '/admin/login';
    }
  };

  const signOut = async () => {
    // Prevent multiple signout attempts
    if (isSigningOutRef.current) {
      console.log('Sign out already in progress');
      return;
    }
    
    try {
      isSigningOutRef.current = true;
      setIsSigningOut(true);
      
      // Log the action first to ensure it's recorded
      if (user?.id) {
        try {
          await supabase.from('admin_actions').insert([{
            admin_id: user.id,
            action: 'logout',
            details: {
              email: user.email,
              method: 'manual_signout',
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
              location: window.location.pathname
            }
          }]);
        } catch (logError) {
          console.error('Error logging sign out action:', logError);
          // Continue with sign out even if logging fails
        }
      }
      
      // Clear auth storage immediately
      clearAuthStorage();
      
      // Set a safety timeout to ensure we complete sign out even if there are errors
      if (signOutTimeoutRef.current !== null) {
        window.clearTimeout(signOutTimeoutRef.current);
      }
      
      signOutTimeoutRef.current = window.setTimeout(() => {
        console.log('Sign out safety timeout triggered');
        finalizeSignOut();
      }, SIGN_OUT_TIMEOUT);
      
      // Perform sign out with Supabase
      await supabase.auth.signOut();
      
      // Show sign out animation for a moment before clearing state
      setTimeout(() => {
        finalizeSignOut();
      }, 2000);
      
    } catch (error) {
      console.error('Error signing out:', error);
      
      // Still clear user data even if there was an error
      clearAuthStorage();
      finalizeSignOut();
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    // Prevent frequent refresh calls
    const now = Date.now();
    if (now - lastAuthCheckRef.current < AUTH_CHECK_INTERVAL) {
      console.log('User refresh too soon, skipping');
      return;
    }
    
    try {
      lastAuthCheckRef.current = now;
      const userProfile = await safeGetUserProfile(user.id);
      setProfile(userProfile);
      setIsAdmin(userProfile?.role === 'Admin');
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const value = {
    user,
    profile,
    isAdmin,
    isLoading,
    session,
    isSigningOut,
    showConfirmSignOut,
    setShowConfirmSignOut,
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 