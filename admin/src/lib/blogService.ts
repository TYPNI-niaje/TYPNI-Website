import { supabase } from './supabase';
import { logAdminAction } from './supabase';

// Types
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  status: 'published' | 'draft' | 'scheduled';
  publish_date: Date | null;
  thumbnail_url?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  // Join with profiles
  user_name?: string;
  user_avatar?: string;
}

// Helper function to convert timestamps in an object to Date objects
const convertTimestampsToDate = (obj: any) => {
  const dateFields = ['publish_date', 'created_at', 'updated_at'];
  const result = { ...obj };
  
  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field]);
    }
  }
  
  return result;
};

// Get all blog posts
export const getBlogPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Convert timestamps to Date objects
    return data.map(post => convertTimestampsToDate(post)) as BlogPost[];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
};

// Get published blog posts
export const getPublishedBlogPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .order('publish_date', { ascending: false });
      
    if (error) throw error;
    
    // Convert timestamps to Date objects
    return data.map(post => convertTimestampsToDate(post)) as BlogPost[];
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    throw error;
  }
};

// Get a single blog post by ID
export const getBlogPostById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return convertTimestampsToDate(data) as BlogPost;
  } catch (error) {
    console.error(`Error fetching blog post with ID ${id}:`, error);
    throw error;
  }
};

// Create a new blog post
export const createBlogPost = async (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>, userId: string) => {
  try {
    // Handle empty user ID with a default value
    // This prevents database errors but should only be used as a fallback
    const safeUserId = userId || '00000000-0000-0000-0000-000000000000'; // Default UUID as fallback
    
    // Add created_by if not provided
    const postData = {
      ...post,
      created_by: safeUserId,
      // Format publish_date as ISO string if it's a Date object
      publish_date: post.publish_date instanceof Date ? post.publish_date.toISOString() : post.publish_date
    };
    
    // Check that required fields are present
    if (!postData.title) throw new Error('Blog post title is required');
    if (!postData.content) throw new Error('Blog post content is required');
    if (!postData.excerpt) throw new Error('Blog post excerpt is required');
    if (!postData.author) throw new Error('Blog post author is required');
    
    console.log('Creating blog post with data:', JSON.stringify(postData, null, 2));
    
    const { data, error } = await supabase
      .from('blogs')
      .insert([postData])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating blog post:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Blog post was not created');
    }
    
    try {
      // Log the admin action
      await logAdminAction(userId, 'create_blog_post', { post_id: data.id, title: data.title });
    } catch (logError) {
      console.error('Error logging admin action:', logError);
      // Continue with post creation even if logging fails
    }
    
    return convertTimestampsToDate(data) as BlogPost;
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    // Include detailed error in the message
    if (error.message) {
      throw new Error(`Error creating blog post: ${error.message}`);
    } else if (error.error_description) {
      throw new Error(`Error creating blog post: ${error.error_description}`);
    } else {
      throw error;
    }
  }
};

// Update a blog post
export const updateBlogPost = async (id: string, postData: Partial<BlogPost>, userId: string) => {
  try {
    // Format publish_date if it's a Date object
    const formattedData = {
      ...postData,
      publish_date: postData.publish_date instanceof Date ? 
        postData.publish_date.toISOString() : 
        postData.publish_date
    };
    
    console.log('Updating blog post with data:', JSON.stringify(formattedData, null, 2));
    
    const { data, error } = await supabase
      .from('blogs')
      .update(formattedData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction(userId, 'update_blog_post', { post_id: id, title: data.title });
    
    return convertTimestampsToDate(data) as BlogPost;
  } catch (error) {
    console.error(`Error updating blog post with ID ${id}:`, error);
    throw error;
  }
};

// Delete a blog post
export const deleteBlogPost = async (id: string, userId: string) => {
  try {
    // First, get the blog post details for logging
    const { data: postData } = await supabase
      .from('blogs')
      .select('title')
      .eq('id', id)
      .single();
      
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction(userId, 'delete_blog_post', { post_id: id, title: postData?.title || 'Unknown' });
    
    return true;
  } catch (error) {
    console.error(`Error deleting blog post with ID ${id}:`, error);
    throw error;
  }
};

// Upload a thumbnail image for a blog post
export const uploadBlogThumbnail = async (file: File, postId: string): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${postId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    console.log(`Uploading thumbnail for post ${postId} to path: ${filePath}`);
    
    // Upload the file to storage
    // Make sure we're authenticated first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authentication session found - must be logged in to upload');
    }
    
    console.log('Session found, proceeding with upload...');
    
    const { error: uploadError } = await supabase
      .storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('Thumbnail uploaded successfully, getting public URL');
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('blog-images')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded thumbnail');
    }
    
    console.log('Public URL obtained:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading blog post thumbnail:', error);
    throw error;
  }
};

// Get comments for a blog post
export const getCommentsForBlogPost = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // Convert timestamps to Date objects
    return data.map(comment => ({
      ...convertTimestampsToDate(comment),
      user_name: comment.profiles?.full_name,
      user_avatar: comment.profiles?.avatar_url,
    })) as Comment[];
  } catch (error) {
    console.error(`Error fetching comments for blog post with ID ${postId}:`, error);
    throw error;
  }
};

// Add a comment to a blog post
export const addComment = async (postId: string, userId: string, content: string) => {
  try {
    // Check that required fields are present
    if (!content.trim()) throw new Error('Comment content is required');
    
    const { data, error } = await supabase
      .from('blog_comments')
      .insert([{
        post_id: postId,
        user_id: userId,
        content
      }])
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      throw new Error('Comment was not created');
    }
    
    return {
      ...convertTimestampsToDate(data),
      user_name: data.profiles?.full_name,
      user_avatar: data.profiles?.avatar_url,
    } as Comment;
  } catch (error: any) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (id: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', id)
      .or(`user_id.eq.${userId},admin_role.eq.true`); // User can delete their own comments or admin can delete any
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting comment with ID ${id}:`, error);
    throw error;
  }
};

// Get all images from the blog-images storage bucket for gallery selection
export const getBlogImages = async (): Promise<Array<{name: string, url: string}>> => {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authentication session found');
    }

    // List all files in the blog-images bucket
    const { data: files, error } = await supabase
      .storage
      .from('blog-images')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('Error listing blog images:', error);
      throw error;
    }

    if (!files) {
      return [];
    }

    // Get public URLs for all files
    const imagesWithUrls = files
      .filter(file => file.name && file.name !== '.emptyFolderPlaceholder')
      .map(file => {
        const { data: urlData } = supabase
          .storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
        return {
          name: file.name,
          url: urlData.publicUrl
        };
      });

    return imagesWithUrls;
  } catch (error) {
    console.error('Error getting blog images for gallery:', error);
    throw error;
  }
}; 