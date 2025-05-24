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

// Make the initialized client available globally and export it
window.supabaseClient = supabase
export { supabase }

// Auth helper functions
export async function signUp(userData) {
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

export async function signIn(email, password) {
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

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { data: { user }, error: null }
  } catch (error) {
    return { data: { user: null }, error }
  }
}

export async function updateProfile(userId, profileData) {
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

export async function getUserProfile(userId) {
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

export async function getUserInterests(userId) {
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

export async function updateUserInterests(userId, interestIds) {
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

export async function uploadAvatar(userId, file) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadAvatar:', error)
    throw error
  }
}

export async function updateAvatarUrl(userId, avatarUrl) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function removeAvatar(userId, avatarUrl) {
  try {
    if (!avatarUrl) return

    // Extract filename from URL
    const fileName = avatarUrl.split('/').pop()

    // Remove file from storage
    const { error: storageError } = await supabase.storage
      .from('avatars')
      .remove([fileName])

    if (storageError) throw storageError

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (profileError) throw profileError

    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getPublishedBlogPosts() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        categories (
          name
        ),
        author:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getBlogPostById(id) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        categories (
          name
        ),
        author:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getPostsByCategory(category) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        categories (
          name
        ),
        author:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('category_id', category)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getBlogCategories() {
  try {
    // First get all published blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('category_id')
      .eq('status', 'published')

    if (postsError) throw postsError

    // Get unique category IDs
    const categoryIds = [...new Set(posts.map(post => post.category_id))]

    // Get categories with those IDs
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds)
      .order('name')

    if (categoriesError) throw categoriesError

    // Count posts for each category
    const categoriesWithCount = categories.map(category => ({
      ...category,
      post_count: posts.filter(post => post.category_id === category.id).length
    }))

    return { data: categoriesWithCount, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getRecentBlogPosts(limit = 3) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        categories (
          name
        ),
        author:profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
} 