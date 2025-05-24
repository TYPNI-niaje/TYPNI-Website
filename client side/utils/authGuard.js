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
    // Get the initialized Supabase client
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
    // Wait for the initialized Supabase client
    let attempts = 0;
    const maxAttempts = 50;
    
    // Initialize Supabase if not already initialized
    if (!window.supabaseClient && window.supabase) {
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
    
    while (!window.supabaseClient && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User has signed in, update UI or redirect if needed
        console.log('User signed in', session.user);
      } else if (event === 'SIGNED_OUT') {
        // User has signed out, update UI or redirect if needed
        console.log('User signed out');
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('registration')) {
          window.location.href = 'login.html';
        }
      }
    });

    // Initial check for current user
    const user = await checkUser();
    
    // If we're on a protected page, verify user is logged in
    if (!user && !window.location.pathname.includes('login') && !window.location.pathname.includes('registration')) {
      window.location.href = 'login.html';
    }

    // If we get here, show the page
    document.body.style.visibility = 'visible';
  } catch (error) {
    console.error('Auth guard error:', error);
    // Show the page even if auth check fails
    document.body.style.visibility = 'visible';
  }
}); 