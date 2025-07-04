import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlogPostById } from '../lib/blogService';
import Card from '../components/Card/Card';
import { ArrowLeftIcon, ClockIcon, UserCircleIcon, TagIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const BlogView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const blogData = await getBlogPostById(id);
        setPost(blogData);
      } catch (err: any) {
        setError(err.message || 'Error fetching blog post');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogPost();
  }, [id]);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <motion.div 
          className="w-16 h-16 border-4 rounded-full border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-gray-600">Loading blog post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center">
        <h2 className="text-red-800 text-lg font-medium mb-2">Error Loading Blog Post</h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate('/admin/blog')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Back to Posts
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg text-center">
        <h2 className="text-yellow-800 text-lg font-medium mb-2">Blog Post Not Found</h2>
        <p className="text-yellow-600">The requested blog post could not be found.</p>
        <button
          onClick={() => navigate('/admin/blog')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Back to Posts
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/blog')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          <span>Back to Posts</span>
        </button>
        
        <button
          onClick={() => navigate(`/admin/blog/${post.id}/edit`)}
          className="flex items-center btn-primary"
        >
          <PencilSquareIcon className="w-5 h-5 mr-1" />
          <span>Edit Post</span>
        </button>
      </div>
      
      <Card className="overflow-hidden">
        {post.thumbnail_url && (
          <div className="w-full h-64 overflow-hidden">
            <img 
              src={post.thumbnail_url} 
              alt={post.title} 
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-1" />
              {post.author}
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 mr-1" />
              {formatDate(post.publish_date || post.created_at)}
            </div>
            <div className="flex items-center">
              <TagIcon className="w-5 h-5 mr-1" />
              {post.category}
            </div>
          </div>
          
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default BlogView; 