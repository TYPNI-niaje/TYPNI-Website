import { useEffect, useState } from 'react';
import type { FC } from 'react';
import Card from '../components/Card/Card';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AdminGreeting from '../components/Greeting/AdminGreeting';

interface AdminActivity {
  id: string;
  action: string;
  admin_id: string | null;
  created_at: string;
  details: any;
}

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalEvents: number;
  recentActivity: AdminActivity[];
  newPosts: number;
  comments: number;
}

const Dashboard: FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalEvents: 0,
    recentActivity: [],
    newPosts: 0,
    comments: 0
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  // Get admin's first name
  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get total users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total blog posts count
        const { count: postsCount } = await supabase
          .from('blogs')
          .select('*', { count: 'exact', head: true });

        // Get total events count
        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });

        // Get recent admin actions (for activity)
        const { data: recentActivity } = await supabase
          .from('admin_actions')
          .select('id, action, admin_id, created_at, details')
          .order('created_at', { ascending: false })
          .limit(3);

        // Get new posts count (posts created in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: newPostsCount } = await supabase
          .from('blogs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Get total contact messages count
        const { count: messagesCount } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          totalPosts: postsCount || 0,
          totalEvents: eventsCount || 0,
          recentActivity: recentActivity as AdminActivity[] || [],
          newPosts: newPostsCount || 0,
          comments: messagesCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Greeting */}
      <AdminGreeting firstName={firstName} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary bg-opacity-10">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Total Users</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent bg-opacity-10">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Total Posts</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPosts.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary bg-opacity-10">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Events</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEvents.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Messages</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats.comments.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <p className="text-sm text-gray-500">Latest admin actions</p>
                  </div>
                </div>
                <motion.div 
                  className="w-2 h-2 rounded-full bg-green-500"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
            
            <div className="px-6 pb-6">
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {stats.recentActivity.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      className="group relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 100
                      }}
                    >
                      <div className="flex items-center p-4 rounded-xl hover:bg-gray-50/70 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activity.action === 'login' ? 'bg-green-100 text-green-600' :
                              activity.action === 'logout' ? 'bg-orange-100 text-orange-600' :
                              activity.action.includes('delete') ? 'bg-red-100 text-red-600' :
                              activity.action.includes('create') ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {activity.action === 'login' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                              ) : activity.action === 'logout' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                              ) : activity.action.includes('delete') ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              ) : activity.action.includes('create') ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              )}
                            </div>
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                              Date.now() - new Date(activity.created_at).getTime() < 300000 ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {activity.action.replace(/_/g, ' ')}
                              </p>
                              <span className="text-xs text-gray-400 font-mono">
                                {new Date(activity.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(activity.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <motion.div 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      </div>
                      
                      {index < stats.recentActivity.length - 1 && (
                        <div className="ml-8 border-l-2 border-gray-100 h-2" />
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No recent activity</h4>
                  <p className="text-xs text-gray-500 text-center">Admin actions will appear here when performed</p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full"
        >
          <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6 pb-0">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                  <p className="text-sm text-gray-500">Platform overview</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <div className="space-y-3">
                <motion.div 
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Users</p>
                        <p className="text-xs text-gray-500">Registered members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.p 
                        className="text-xl font-bold text-gray-900"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {stats.totalUsers.toLocaleString()}
                      </motion.p>
                      <div className="flex items-center text-xs text-emerald-600">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Active
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">New Posts</p>
                        <p className="text-xs text-gray-500">Last 7 days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.p 
                        className="text-xl font-bold text-gray-900"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      >
                        {stats.newPosts.toLocaleString()}
                      </motion.p>
                      <div className="flex items-center text-xs text-purple-600">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recent
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Messages</p>
                        <p className="text-xs text-gray-500">Contact inquiries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.p 
                        className="text-xl font-bold text-gray-900"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      >
                        {stats.comments.toLocaleString()}
                      </motion.p>
                      <div className="flex items-center text-xs text-emerald-600">
                        <motion.div 
                          className="w-2 h-2 bg-emerald-500 rounded-full mr-1"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        Live
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 