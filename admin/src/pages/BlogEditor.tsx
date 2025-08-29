import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './BlogEditor.css';
import Card from '../components/Card/Card';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createBlogPost, getBlogPostById, updateBlogPost, uploadBlogThumbnail, getBlogImages } from '../lib/blogService';
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
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [galleryImages, setGalleryImages] = useState<Array<{name: string, url: string}>>([]);
  const [loadingGallery, setLoadingGallery] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Format blog content for preview (same as client-side function)
  const formatBlogContent = (content: string) => {
    if (!content) return '';
    
    // Convert line breaks to paragraphs
    let formattedContent = content
      .split('\n\n')
      .filter(paragraph => paragraph.trim().length > 0)
      .map(paragraph => {
        const trimmed = paragraph.trim();
        
        // Check if it's a heading
        if (trimmed.startsWith('# ')) {
          return `<h2 class="blog-heading">${trimmed.substring(2)}</h2>`;
        } else if (trimmed.startsWith('## ')) {
          return `<h3 class="blog-subheading">${trimmed.substring(3)}</h3>`;
        } else if (trimmed.startsWith('### ')) {
          return `<h4 class="blog-subheading-small">${trimmed.substring(4)}</h4>`;
        }
        
        // Check if it's a list item
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<li class="blog-list-item">${trimmed.substring(2)}</li>`;
        }
        
        // Check if it's a numbered list item
        else if (/^\d+\.\s/.test(trimmed)) {
          return `<li class="blog-list-item">${trimmed.replace(/^\d+\.\s/, '')}</li>`;
        }
        
        // Check if it's a quote
        else if (trimmed.startsWith('> ')) {
          return `<blockquote class="blog-quote">${trimmed.substring(2)}</blockquote>`;
        }
        
        // Regular paragraph
        else {
          return `<p class="blog-paragraph">${trimmed}</p>`;
        }
      })
      .join('\n');
    
    // Wrap consecutive list items in ul tags
    formattedContent = formattedContent.replace(/(<li class="blog-list-item">.*?<\/li>\n?)+/gs, (match) => {
      return `<ul class="blog-list">${match}</ul>`;
    });
    
    // Apply inline formatting
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedContent = formattedContent.replace(/__(.*?)__/g, '<strong>$1</strong>');
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedContent = formattedContent.replace(/_(.*?)_/g, '<em>$1</em>');
    formattedContent = formattedContent.replace(/`(.*?)`/g, '<code class="blog-code">$1</code>');
    formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link" target="_blank">$1</a>');
    
    return formattedContent;
  };
  
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
    setThumbnailUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadGalleryImages = async () => {
    try {
      setLoadingGallery(true);
      const images = await getBlogImages();
      setGalleryImages(images);
    } catch (err: any) {
      console.error('Error loading gallery images:', err);
      setError('Failed to load gallery images: ' + err.message);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleGalleryToggle = () => {
    setShowGallery(!showGallery);
    if (!showGallery && galleryImages.length === 0) {
      loadGalleryImages();
    }
  };

  const handleGalleryImageSelect = (imageUrl: string) => {
    setThumbnailPreview(imageUrl);
    setThumbnailUrl(imageUrl);
    setThumbnailFile(null); // Clear file upload since we're using a gallery image
    setShowGallery(false);
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
                <div className="mt-2 space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                  >
                    <PhotoIcon className="w-10 h-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Click to upload new image</p>
                    <p className="text-xs text-gray-400">JPG, PNG or GIF up to 5MB</p>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-500">or</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGalleryToggle}
                    className="w-full px-4 py-3 border border-blue-300 rounded-md text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                  >
                    <PhotoIcon className="w-5 h-5 mr-2" />
                    Choose from Gallery
                  </button>
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
              
              {/* Gallery Modal */}
              {showGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Choose from Image Gallery</h3>
                      <button
                        onClick={() => setShowGallery(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="p-4">
                      {loadingGallery ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                      ) : galleryImages.length === 0 ? (
                        <div className="text-center py-8">
                          <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No images in gallery yet.</p>
                          <p className="text-sm text-gray-400">Upload some images first to see them here.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {galleryImages.map((image, index) => (
                            <div
                              key={index}
                              onClick={() => handleGalleryImageSelect(image.url)}
                              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                            >
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-end">
                                <div className="p-2 text-xs text-white bg-black bg-opacity-75 w-full truncate">
                                  {image.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 block mt-1">
                    (Supports Markdown: # Heading, **bold**, *italic*, [link](url), &gt; quote, - list)
                  </span>
                </label>
                
                {/* Preview Toggle Buttons */}
                <div className="flex space-x-3 mb-3 p-3 bg-gray-50 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className={`flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
                      !showPreview 
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-lg">📝</span>
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={`flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
                      showPreview 
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-lg">👁️</span>
                    <span>Preview</span>
                  </button>
                  <div className="flex items-center text-sm text-gray-500 ml-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {showPreview ? 'Preview Mode' : 'Edit Mode'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="blog-editor-wrapper">
                {!showPreview ? (
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[400px] p-3 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="Write your blog content here using Markdown formatting...

# Main Heading
Write your introduction paragraph here.

## Subheading
More content here with **bold text** and *italic text*.

- First list item
- Second list item
- Third list item

> This is a quote block

[This is a link](https://example.com)"
                    required
                  />
                ) : (
                  <div className="w-full min-h-[400px] border border-gray-300 rounded-md bg-white">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-md">
                      <h3 className="text-lg font-semibold text-gray-900">Blog Preview</h3>
                      <p className="text-sm text-gray-600">How your blog post will appear on the website</p>
                    </div>
                    <div className="p-6">
                      {title && (
                        <div className="mb-6 pb-4 border-b border-gray-200">
                          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                          <div className="text-sm text-gray-500 space-x-4">
                            <span>By {author || 'Author'}</span>
                            <span>•</span>
                            <span>{category === 'Other' && customCategory ? customCategory : category}</span>
                          </div>
                        </div>
                      )}
                      {content ? (
                        <div 
                          className="formatted-content"
                          dangerouslySetInnerHTML={{ 
                            __html: formatBlogContent(content) 
                          }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">Start writing your content to see the preview...</p>
                      )}
                    </div>
                  </div>
                )}
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