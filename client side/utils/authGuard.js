// utils/authGuard.js

// Immediately hide auth pages to prevent flickering
const authPages = ['login.html', 'registration.html'];
const currentPage = window.location.pathname.split('/').pop();
if (authPages.includes(currentPage)) {
  document.body.style.visibility = 'hidden';
}

// Auth guard to protect routes and handle authentication
async function checkUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // If no active session, redirect to login page (except on login/registration pages)
  if (!session && !window.location.pathname.includes('login') && !window.location.pathname.includes('registration')) {
    window.location.href = 'login.html';
    return null;
  }
  
  return session?.user || null;
}

// Initialize the auth state when the page loads
document.addEventListener('DOMContentLoaded', async function() {
  try {
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

    // If we get here, show the page (it's either an auth page for non-logged-in users
    // or a public page)
    document.body.style.visibility = 'visible';
  } catch (error) {
    console.error('Auth guard error:', error);
    // Show the page even if auth check fails
    document.body.style.visibility = 'visible';
  }
}); 