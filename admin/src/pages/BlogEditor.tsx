import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './BlogEditor.css';
import Card from '../components/Card/Card';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createBlogPost, getBlogPostById, updateBlogPost, uploadBlogThumbnail } from '../lib/blogService';
import Loading from '../components/Loading/Loading';
import Message from '../components/Message/Message';

// You can customize these or allow free input
const CATEGORIES = [
  'Youth Empowerment',
  'Community Initiatives',
  'Education',
  'Technology',
  'Leadership',
  'Entrepreneurship', 
  'Health & Wellness',
  'Events',
  'Success Stories',
  'News',
  'Other'
];

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, user, profile, isAdmin } = useAuth();
  const userId = user?.id || session?.user?.id || '';
  
  useEffect(() => {
    // Log auth info for debugging
    console.log('Auth state:', { 
      user: user ? { id: user.id } : null,
      session: session ? { userId: session.user?.id } : null,
      hasUserId: !!userId,
      profile: profile ? { role: profile.role } : null,
      isAdmin
    });
  }, [user, session, userId, profile, isAdmin]);
  
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [excerpt, setExcerpt] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('draft');
  const [publishDate, setPublishDate] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is logged in
  useEffect(() => {
    if (!userId) {
      console.log('No user ID found, redirecting to login');
      navigate('/admin/login');
    }
  }, [userId, navigate]);
  
  useEffect(() => {
    // If id exists, fetch the blog post data
    if (id) {
      setLoading(true);
      getBlogPostById(id)
        .then(post => {
          setTitle(post.title);
          setContent(post.content);
          setExcerpt(post.excerpt);
          setAuthor(post.author);
          
          // Handle category (either from predefined list or custom)
          if (CATEGORIES.includes(post.category)) {
          setCategory(post.category);
          } else {
            setCategory('Other');
            setCustomCategory(post.category);
          }
          
          setStatus(post.status);
          if (post.publish_date) {
            const date = new Date(post.publish_date);
            // Format date to YYYY-MM-DDThh:mm
            const formattedDate = date.toISOString().substring(0, 16);
            setPublishDate(formattedDate);
          }
          if (post.thumbnail_url) {
            setThumbnailPreview(post.thumbnail_url);
            setThumbnailUrl(post.thumbnail_url);
          }
        })
        .catch(err => {
          setError('Failed to load blog post: ' + err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);
  
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  };
  
  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      // Check if user is logged in
      if (!userId) {
        throw new Error('You must be logged in to create or edit blog posts');
      }
      
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!content.trim()) {
        throw new Error('Content is required');
      }
      
      if (!excerpt.trim()) {
        throw new Error('Excerpt is required');
      }
      
      if (!author.trim()) {
        throw new Error('Author name is required');
      }
      
      let finalThumbnailUrl = thumbnailUrl;
      
      // Upload thumbnail if a new file was selected
      if (thumbnailFile) {
        try {
          finalThumbnailUrl = await uploadBlogThumbnail(thumbnailFile, id || 'temp');
          console.log('Thumbnail uploaded successfully:', finalThumbnailUrl);
        } catch (uploadError: any) {
          console.error('Thumbnail upload error:', uploadError);
          setError('Failed to upload thumbnail: ' + (uploadError.message || 'Unknown error'));
          setSaving(false);
          return;
        }
      }
      
      // Determine the final category (use custom if "Other" is selected)
      const finalCategory = category === 'Other' && customCategory 
        ? customCategory 
        : category;
      
      // Format dates properly for Supabase
      let publishDateFormatted = null;
      if (status === 'scheduled' && publishDate) {
        publishDateFormatted = new Date(publishDate);
      } else if (status === 'published') {
        publishDateFormatted = new Date();
      }
      
      const blogData = {
        title,
        content,
        excerpt,
        author,
        category: finalCategory,
        status,
        publish_date: publishDateFormatted,
        thumbnail_url: finalThumbnailUrl as string | undefined
      };
      
      console.log('Preparing blog data:', JSON.stringify(blogData, null, 2));
      
      if (id) {
        // Update existing blog post
        await updateBlogPost(id, blogData, userId);
        setMessage('Blog post updated successfully!');
        
        // Reset after a short delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        try {
        // Create new blog post
          console.log('Creating new blog post...');
        const newPost = await createBlogPost(blogData, userId);
          console.log('Blog post created successfully:', newPost);
        
        // If we uploaded with a temp ID, we need to move the file
          if (thumbnailFile && finalThumbnailUrl && !id && newPost && newPost.id) {
            try {
              console.log('Updating thumbnail with correct ID...');
              const updatedThumbnailUrl = await uploadBlogThumbnail(thumbnailFile, newPost.id);
              await updateBlogPost(newPost.id, { thumbnail_url: updatedThumbnailUrl }, userId);
              console.log('Thumbnail updated successfully');
            } catch (thumbnailError: any) {
              console.error('Error updating thumbnail:', thumbnailError);
              // Don't block navigation if only the thumbnail update fails
            }
        }
        
        // Navigate to blog posts list
          navigate('/admin/blog');
        } catch (createError: any) {
          console.error('Failed to create blog post:', createError);
          setError('Failed to create blog post: ' + (createError.message || 'Unknown error'));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit excerpt to 200 characters
    if (value.length <= 200) {
      setExcerpt(value);
    }
  };
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="space-y-6 p-4 blog-editor-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/admin/blog')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
        </div>
      </div>
      
      {message && (
        <Message type="success" message={message} onClose={() => setMessage('')} />
      )}
      
      {error && (
        <Message type="error" message={error} onClose={() => setError('')} />
      )}
      
      <Card className="shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6 blog-editor-form">
          <div className="space-y-4">
            {/* Thumbnail Image */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                  Thumbnail Image
                </label>
                {thumbnailPreview && (
                  <button
                    type="button"
                    onClick={handleThumbnailRemove}
                    className="text-red-500 hover:text-red-700 text-xs flex items-center"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Remove
                  </button>
                )}
              </div>
              
              {thumbnailPreview ? (
                <div className="mt-2 relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                >
                  <PhotoIcon className="w-10 h-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Click to upload thumbnail image</p>
                  <p className="text-xs text-gray-400">JPG, PNG or GIF up to 5MB</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                id="thumbnail"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </div>
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                Author <span className="text-red-500">*</span>
                </label>
              <input
                type="text"
                id="author"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>
            
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              
              {/* Custom Category */}
              {category === 'Other' && (
                <div className="mt-2">
                  <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700">
                    Custom Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customCategory"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="blog-form-group">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="blog-editor-wrapper">
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md"
                  placeholder="Enter blog content here..."
                  required
                ></textarea>
              </div>
            </div>
            
            {/* Excerpt */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                  Excerpt <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-500">{excerpt.length}/200</span>
              </div>
              <textarea
                id="excerpt"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={excerpt}
                onChange={handleExcerptChange}
                placeholder="Write a brief summary of the blog post (max 200 characters)"
                required
              />
            </div>
            
            {/* Publishing Options */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Publishing Options</h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    id="draft"
                    name="status"
                    type="radio"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="draft" className="block text-sm font-medium text-gray-700">
                    Save as Draft
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    id="published"
                    name="status"
                    type="radio"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="published" className="block text-sm font-medium text-gray-700">
                    Publish Now
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    id="scheduled"
                    name="status"
                    type="radio"
                    checked={status === 'scheduled'}
                    onChange={() => setStatus('scheduled')}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                />
                  <div>
                    <label htmlFor="scheduled" className="block text-sm font-medium text-gray-700">
                      Schedule for Later
                    </label>
                    
                    {status === 'scheduled' && (
                      <input
                        type="datetime-local"
                        id="publishDate"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        required={status === 'scheduled'}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/blog')}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={saving}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BlogEditor; 