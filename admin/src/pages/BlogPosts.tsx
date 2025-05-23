import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card/Card';
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getBlogPosts, deleteBlogPost } from '../lib/blogService';
import type { BlogPost } from '../lib/blogService';

const BlogPosts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || '';
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  useEffect(() => {
    fetchBlogPosts();
  }, []);
  
  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const data = await getBlogPosts();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching blog posts');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      await deleteBlogPost(id, userId);
      setPosts(posts.filter(post => post.id !== id));
      setSuccess('Blog post deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error deleting blog post');
    }
  };
  
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = categoryFilter ? post.category === categoryFilter : true;
    const matchesStatus = statusFilter ? post.status === statusFilter : true;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const uniqueCategories = Array.from(new Set(posts.map(post => post.category)));
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
        
        <button 
          className="btn-primary flex items-center"
          onClick={() => navigate('/admin/blog-editor')}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Post
        </button>
      </div>
      
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-md">{success}</div>}
      
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search posts..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select 
              className="input-field w-full sm:w-auto"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select 
              className="input-field w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View (hidden on small screens) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/6">Title</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Author</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Date</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900 truncate">{post.title}</div>
                      <div className="text-xs text-gray-500 truncate">{post.excerpt}</div>
                    </td>
                    <td className="px-3 py-3 truncate text-gray-500">{post.author}</td>
                    <td className="px-3 py-3 truncate text-gray-500">{post.category}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusClass(post.status)}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 truncate text-xs text-gray-500">
                      {post.status === 'draft' ? '-' : post.publish_date ? formatDate(post.publish_date) : formatDate(post.created_at)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => navigate(`/admin/blog-view/${post.id}`)}
                          title="View blog post"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => navigate(`/admin/blog-editor/${post.id}`)}
                          title="Edit blog post"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(post.id)}
                          title="Delete blog post"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    {searchTerm || categoryFilter || statusFilter ? 
                      'No matching blog posts found. Try adjusting your filters.' : 
                      'No blog posts yet. Create your first post!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (shown only on small screens) */}
        <div className="sm:hidden space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-md font-medium text-gray-900 pr-2">{post.title}</h3>
                  <span className={`px-2 py-1 text-xs leading-4 font-semibold rounded-full ${getStatusClass(post.status)}`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{post.excerpt}</p>
                
                <div className="text-xs text-gray-600 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Author:</span>
                    <span className="font-medium">{post.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{post.category}</span>
                  </div>
                  {post.status !== 'draft' && (
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">
                        {post.publish_date ? formatDate(post.publish_date) : formatDate(post.created_at)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end border-t border-gray-100 pt-3 gap-4">
                  <button 
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => navigate(`/admin/blog-view/${post.id}`)}
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button 
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => navigate(`/admin/blog-editor/${post.id}`)}
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDelete(post.id)}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              {searchTerm || categoryFilter || statusFilter ? 
                'No matching blog posts found. Try adjusting your filters.' : 
                'No blog posts yet. Create your first post!'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BlogPosts; 