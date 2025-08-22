// utils/authGuard.js

// Immediately hide auth pages to prevent flickering
const authPages = ['login.html', 'registration.html'];
const currentPage = window.location.pathname.split('/').pop();
if (authPages.includes(currentPage)) {
  document.body.style.visibility = 'hidden';
}

// Auth guard to protect routes and handle authentication
async function checkUser() {
  try {
    // Get the initialized Supabase client from UMD global
    const supabase = window.supabaseClient;
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    // If no active session, redirect to login page (except on login/registration pages)
    if (!session && !window.location.pathname.includes('login') && !window.location.pathname.includes('registration')) {
      window.location.href = 'login.html';
      return null;
    }
    
    return session?.user || null;
  } catch (error) {
    console.error('Error checking user session:', error);
    return null;
  }
}

// Initialize the auth state when the page loads
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Wait for UMD Supabase to be available and initialize client
    let attempts = 0;
    const maxAttempts = 50;
    
    // Initialize Supabase using UMD global
    while (!window.supabase && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabase) {
      throw new Error('Supabase UMD library not loaded');
    }

    // Initialize client if not already done
    if (!window.supabaseClient) {
      const supabaseUrl = 'https://lkgqmfqtxpbvwrsguwka.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3FtZnF0eHBidndyc2d1d2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODk1MjYsImV4cCI6MjA2MzE2NTUyNn0.bMKMVLW-dwVDfhXFIBr-dxbB9yFZ-isNb5v2VrjoqQA';
      
      window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storageKey: 'typni_auth',
          storage: window.localStorage,
          flowType: 'pkce'
        }
      });
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        // User has signed in
        console.log('User signed in', session.user.email);
        // Don't redirect here - let the login handler do it
      } else if (event === 'SIGNED_OUT') {
        // User has signed out
        console.log('User signed out');
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('registration')) {
          window.location.href = 'login.html';
        }
      }
    });

    // Initial check for current user
    const user = await checkUser();
    
    // If we're on a protected page and no user, redirect to login
    const protectedPages = ['profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!user && protectedPages.includes(currentPage)) {
      console.log('No user found, redirecting to login');
      window.location.href = 'login.html';
      return;
    }

    // If we get here, show the page
    document.body.style.visibility = 'visible';
  } catch (error) {
    console.error('Auth guard error:', error);
    // Show the page even if auth check fails
    document.body.style.visibility = 'visible';
  }
}); 