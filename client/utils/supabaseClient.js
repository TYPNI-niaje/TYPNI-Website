// Create Supabase client
const supabaseUrl = 'https://lkgqmfqtxpbvwrsguwka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3FtZnF0eHBidndyc2d1d2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODk1MjYsImV4cCI6MjA2MzE2NTUyNn0.bMKMVLW-dwVDfhXFIBr-dxbB9yFZ-isNb5v2VrjoqQA'

// Initialize the Supabase client with session handling
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'typni_auth',
    storage: window.localStorage,
    flowType: 'pkce'
  }
})

// Auth helper functions
async function signUp(userData) {
  try {
    // Sign up the user with metadata
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.name,
          phone_number: userData.phone_number,
          id_number: userData.idNumber,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender,
          country: userData.country,
          is_employed: userData.is_employed,
          education_level: userData.education_level,
          interests: userData.interests,
          interest_ids: userData.interest_ids
        }
      }
    })

    if (error) {
      console.error('Signup error:', error)
      throw error
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Signup error:', error)
    return { data: null, error }
  }
}

async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { data: { user }, error: null }
  } catch (error) {
    return { data: { user: null }, error }
  }
}

async function updateProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

async function getUserInterests(userId) {
  try {
    const { data, error } = await supabase
      .from('user_interests')
      .select(`
        interest_id,
        interests (
          name
        )
      `)
      .eq('user_id', userId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

async function updateUserInterests(userId, interestIds) {
  try {
    // First delete existing interests
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)
    if (deleteError) throw deleteError

    // Then insert new interests
    const newInterests = interestIds.map(interestId => ({
      user_id: userId,
      interest_id: interestId
    }))

    const { data, error } = await supabase
      .from('user_interests')
      .insert(newInterests)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Upload avatar to Supabase Storage
async function uploadAvatar(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    // Generate a unique filename using UUID pattern
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    // Upload the file
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update the profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      // If profile update fails, try to remove the uploaded file
      await supabase.storage.from('avatars').remove([fileName]);
      throw updateError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    throw error;
  }
}

// Update avatar_url in profile
async function updateAvatarUrl(userId, avatarUrl) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating avatar URL:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in updateAvatarUrl:', error);
    return { data: null, error };
  }
}

// Remove avatar from Supabase Storage
async function removeAvatar(userId, avatarUrl) {
  try {
    if (!avatarUrl) return;
    // Extract file name from URL
    const fileName = avatarUrl.split('/').pop();
    const { error } = await supabase.storage.from('avatars').remove([fileName]);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error in removeAvatar:', error);
    throw error;
  }
} 

// Blog functions
async function getPublishedBlogPosts() {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .order('publish_date', { ascending: false });
      
    if (error) throw error;
    
    // Convert timestamps to Date objects
    return { 
      data: data.map(post => {
        return {
          ...post,
          publish_date: post.publish_date ? new Date(post.publish_date) : null,
          created_at: new Date(post.created_at),
          updated_at: new Date(post.updated_at)
        };
      }), 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    return { data: null, error };
  }
}

async function getBlogPostById(id) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return { 
      data: {
        ...data,
        publish_date: data.publish_date ? new Date(data.publish_date) : null,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      }, 
      error: null 
    };
  } catch (error) {
    console.error(`Error fetching blog post with ID ${id}:`, error);
    return { data: null, error };
  }
}

async function getPostsByCategory(category) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .order('publish_date', { ascending: false });
      
    if (error) throw error;
    
    return { 
      data: data.map(post => {
        return {
          ...post,
          publish_date: post.publish_date ? new Date(post.publish_date) : null,
          created_at: new Date(post.created_at),
          updated_at: new Date(post.updated_at)
        };
      }), 
      error: null 
    };
  } catch (error) {
    console.error(`Error fetching posts for category ${category}:`, error);
    return { data: null, error };
  }
}

// Get blog categories with post counts
async function getBlogCategories() {
  try {
    // First get all published blog posts
    const { data, error } = await supabase
      .from('blogs')
      .select('category')
      .eq('status', 'published');
      
    if (error) throw error;
    
    // Count posts by category
    const categories = {};
    data.forEach(post => {
      if (post.category) {
        if (!categories[post.category]) {
          categories[post.category] = 0;
        }
        categories[post.category]++;
      }
    });
    
    // Convert to array of category objects
    const categoryArray = Object.keys(categories).map(name => ({
      name,
      count: categories[name]
    }));
    
    // Sort by post count (descending)
    categoryArray.sort((a, b) => b.count - a.count);
    
    return { data: categoryArray, error: null };
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return { data: null, error };
  }
}

// Get recent blog posts (limited to 3 by default)
async function getRecentBlogPosts(limit = 3) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, thumbnail_url, author, publish_date, created_at')
      .eq('status', 'published')
      .order('publish_date', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    // Convert timestamps to Date objects
    return { 
      data: data.map(post => {
        return {
          ...post,
          publish_date: post.publish_date ? new Date(post.publish_date) : null,
          created_at: new Date(post.created_at)
        };
      }), 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching recent blog posts:', error);
    return { data: null, error };
  }
}

// Export all functions
export {
  supabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  updateProfile,
  getUserProfile,
  getUserInterests,
  updateUserInterests,
  uploadAvatar,
  updateAvatarUrl,
  removeAvatar,
  // Blog functions
  getPublishedBlogPosts,
  getBlogPostById,
  getPostsByCategory,
  getBlogCategories,
  getRecentBlogPosts
} 