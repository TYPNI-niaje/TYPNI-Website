import { createClient } from '@supabase/supabase-js';

// Supabase configuration with actual credentials
const supabaseUrl = 'https://lkgqmfqtxpbvwrsguwka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3FtZnF0eHBidndyc2d1d2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODk1MjYsImV4cCI6MjA2MzE2NTUyNn0.bMKMVLW-dwVDfhXFIBr-dxbB9yFZ-isNb5v2VrjoqQA';

// Initialize the Supabase client with session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'typni_admin_auth',
    storage: window.localStorage,
    flowType: 'pkce'
  }
});

// Utility function to check if a user is logged in
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }
    return user;
  } catch (err) {
    console.error("Unexpected error in getCurrentUser:", err);
    return null;
  }
};

// Utility function to get session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return session;
  } catch (err) {
    console.error("Unexpected error in getSession:", err);
    return null;
  }
};

// Utility function to check if a user has admin role
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) {
      console.log("No userId provided to isUserAdmin");
      return false;
    }
    
    // Use a direct SQL query via RPC to avoid policy recursion issues
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error("Error checking admin status via RPC:", error);
      
      // Fallback to direct query if RPC fails
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error("Error in fallback admin check:", profileError);
        return false;
      }
      
      return profileData?.role === 'Admin';
    }
    
    return !!data;
  } catch (err) {
    console.error("Unexpected error in isUserAdmin:", err);
    return false;
  }
};

// Utility function to fetch the current user's profile (id, full_name, avatar_url, role)
export const getCurrentUserProfile = async (userId: string) => {
  if (!userId) {
    console.error('getCurrentUserProfile called with no userId');
    return null;
  }
  
  try {
    console.log(`Fetching profile for user: ${userId}`);
    
    // Use timeout to prevent hanging requests - increased to 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout after 15 seconds')), 15000);
    });
    
    // Try to fetch profile without the single() option first
    const fetchPromise = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', userId);
      
    // Race between fetch and timeout
    const result = await Promise.race([
      fetchPromise,
      timeoutPromise.then(() => {
        throw new Error('Fetch timeout');
      })
    ]) as any;
    
    // Check for errors in the result
    if (result.error) {
      console.error('Error fetching user profile:', result.error);
      // Return default minimal profile on error
      return { id: userId, role: 'Member' };
    }
    
    // Check if we got data
    if (!result.data || result.data.length === 0) {
      console.log('No profile found for user, creating minimal profile');
      return { id: userId, role: 'Member' };
    }
    
    // Return the first profile found
    return result.data[0];
    
  } catch (err) {
    console.error('Exception in getCurrentUserProfile:', err);
    // Return minimal profile on error to prevent login loops
    return { id: userId, role: 'Member' };
  }
};

// Log an admin action to the admin_actions table
export const logAdminAction = async (
  admin_id: string | null,
  action: string,
  details: Record<string, any> = {}
) => {
  try {
  const { error } = await supabase.from('admin_actions').insert([
    {
      admin_id,
      action,
      details
    }
  ]);
  if (error) {
    console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    console.error('Exception in logAdminAction:', err);
    // Don't throw the error to prevent breaking main functionality
  }
};

// Type definitions
export type User = Awaited<ReturnType<typeof getCurrentUser>>;
export type Session = Awaited<ReturnType<typeof getSession>>; 