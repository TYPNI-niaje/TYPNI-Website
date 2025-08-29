import { useState, useEffect } from 'react';
import type { FC } from 'react';
import Card from '../components/Card/Card';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { getBlogImages } from '../lib/blogService';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  status: 'published' | 'draft' | 'scheduled';
  thumbnail_url?: string;
  publish_date?: string;
  created_at: string;
  updated_at: string;
}

const BlogManagement: FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{name: string, url: string}>>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category: '',
    status: 'draft' as const,
    thumbnail_url: '',
    publish_date: ''
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err: any) {
      console.error('Error fetching blogs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBlog) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(formData)
          .eq('id', editingBlog.id);
          
        if (error) throw error;
      } else {
        // Create new blog
        const { error } = await supabase
          .from('blogs')
          .insert([formData]);
          
        if (error) throw error;
      }
      
      // Reset form and refresh blogs
      resetForm();
      await fetchBlogs();
    } catch (err: any) {
      console.error('Error saving blog:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      await fetchBlogs();
    } catch (err: any) {
      console.error('Error deleting blog:', err);
      setError(err.message);
    }
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      author: blog.author,
      category: blog.category,
      status: blog.status as 'published' | 'draft' | 'scheduled',
      thumbnail_url: blog.thumbnail_url || '',
      publish_date: blog.publish_date || ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      author: '',
      category: '',
      status: 'draft',
      thumbnail_url: '',
      publish_date: ''
    });
    setEditingBlog(null);
    setShowCreateModal(false);
    setShowPreview(false);
    setShowGallery(false);
  };

  // Gallery functions
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
    setFormData(prev => ({ ...prev, thumbnail_url: imageUrl }));
    setShowGallery(false);
  };

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

  // Filter blogs based on search and status
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || blog.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Blog Post</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Blog List */}
      <Card>
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No blog posts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlogs.map((blog) => (
                  <motion.tr
                    key={blog.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {blog.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {blog.excerpt}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{blog.author}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{blog.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(blog.status)}`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => window.open(`/blog.html?id=${blog.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(blog)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Publish Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.publish_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail Image
                    </label>
                    
                    {/* Gallery button and URL input */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleGalleryToggle}
                        className="w-full px-4 py-2 border border-blue-300 rounded-md text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Choose from Gallery
                      </button>
                      
                      <div className="text-center text-sm text-gray-500">or</div>
                      
                      <input
                        type="url"
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Preview selected image */}
                    {formData.thumbnail_url && (
                      <div className="mt-2">
                        <img
                          src={formData.thumbnail_url}
                          alt="Thumbnail preview"
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excerpt *
                    </label>
                    <textarea
                      required
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="Brief description of the blog post..."
                    />
                  </div>
                  
                  <div>
                    {/* Content Editor with Preview Toggle */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content * 
                        <span className="text-xs text-gray-500 block mt-1">
                          (Supports Markdown: # Heading, **bold**, *italic*, [link](url), &gt; quote, - list)
                        </span>
                      </label>
                      
                      {/* Preview Toggle Buttons - Always Visible */}
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
{!showPreview ? (
                      <textarea
                        required
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
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
                      />
                    ) : (
                      <div className="w-full min-h-[300px] border border-gray-300 rounded-md bg-white">
                        <div className="p-6 bg-gray-50 border-b border-gray-200 rounded-t-md">
                          <h3 className="text-lg font-semibold text-gray-900">Blog Preview</h3>
                          <p className="text-sm text-gray-600">How your blog post will appear on the website</p>
                        </div>
                        <div className="p-6">
                          {formData.title && (
                            <div className="mb-6 pb-4 border-b border-gray-200">
                              <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title}</h1>
                              <div className="text-sm text-gray-500 space-x-4">
                                <span>By {formData.author || 'Author'}</span>
                                <span>•</span>
                                <span>{formData.category || 'Category'}</span>
                              </div>
                            </div>
                          )}
                          {formData.content ? (
                            <div 
                              className="formatted-content"
                              dangerouslySetInnerHTML={{ 
                                __html: formatBlogContent(formData.content) 
                              }}
                            />
                          ) : (
                            <p className="text-gray-500 italic">Start writing your content to see the preview...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                      {editingBlog ? 'Update Blog Post' : 'Create Blog Post'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Gallery Modal */}
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Choose from Gallery</h3>
                <button
                  onClick={() => setShowGallery(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                {loadingGallery ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : galleryImages.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No images in gallery yet.</p>
                    <p className="text-sm text-gray-400">Upload some images first to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => handleGalleryImageSelect(image.url)}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 transition-all flex items-center justify-center">
                          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            Select
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogManagement;