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
  analytics: string;
  recentActivity: AdminActivity[];
  newPosts: number;
  comments: number;
}

const Dashboard: FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalEvents: 0,
    analytics: '+0%',
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

        // Calculate growth rate (simplified example - could be enhanced with real analytics data)
        const previousPeriodEnd = new Date();
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 14);
        const previousPeriodStart = new Date();
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 28);
        
        const { count: previousPeriodUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', previousPeriodEnd.toISOString())
          .gt('created_at', previousPeriodStart.toISOString());
        
        const { count: currentPeriodUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previousPeriodEnd.toISOString());
        
        let growthRate = 0;
        if (previousPeriodUsers && previousPeriodUsers > 0) {
          growthRate = ((currentPeriodUsers || 0) - previousPeriodUsers) / previousPeriodUsers * 100;
        }

        setStats({
          totalUsers: usersCount || 0,
          totalPosts: postsCount || 0,
          totalEvents: eventsCount || 0,
          analytics: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
          recentActivity: recentActivity as AdminActivity[] || [],
          newPosts: newPostsCount || 0,
          comments: 0 // Comments functionality not implemented yet
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
            <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-600">Analytics</h2>
              <p className="text-2xl font-semibold text-gray-900">{stats.analytics}</p>
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
          <Card 
            title={
              <motion.div 
                className="flex items-center"
                animate={{ color: ["#4f46e5", "#6366f1", "#4f46e5"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-lg font-medium">Recent Activity</span>
                <motion.div 
                  className="ml-2 w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            }
            className="bg-white hover:shadow-md transition-shadow duration-300"
          >
          <div className="space-y-4">
              {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity, index) => (
                <motion.div 
                  key={activity.id} 
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.5
                  }}
                  whileHover={{ 
                    backgroundColor: "rgba(79, 70, 229, 0.05)",
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.div 
                    className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center"
                    animate={{ 
                      boxShadow: [
                        "0 0 0 rgba(79, 70, 229, 0.1)",
                        "0 0 10px rgba(79, 70, 229, 0.3)",
                        "0 0 0 rgba(79, 70, 229, 0.1)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 1 }}
                  >
                    <motion.div className="w-6 h-6 rounded-full bg-primary bg-opacity-30" />
                  </motion.div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
                </motion.div>
              )) : (
                <div className="text-sm text-gray-500 text-center py-4">No recent activity</div>
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
          <Card 
            title={
              <motion.div 
                className="flex items-center"
                animate={{ color: ["#4f46e5", "#6366f1", "#4f46e5"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-lg font-medium">Quick Stats</span>
                <motion.div 
                  className="ml-2 w-1.5 h-1.5 rounded-full bg-accent"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            }
            className="bg-white hover:shadow-md transition-shadow duration-300"
          >
          <div className="space-y-4">
              <motion.div 
                className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ 
                  backgroundColor: "rgba(79, 70, 229, 0.05)",
                  x: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <span className="text-sm text-gray-600 flex items-center">
                  <motion.span 
                    className="inline-block w-2 h-2 rounded-full bg-primary mr-2"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Active Users
                </span>
                <motion.span 
                  className="text-sm font-medium text-gray-900"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  {stats.totalUsers.toLocaleString()}
                </motion.span>
              </motion.div>
              <motion.div 
                className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ 
                  backgroundColor: "rgba(236, 72, 153, 0.05)",
                  x: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <span className="text-sm text-gray-600 flex items-center">
                  <motion.span 
                    className="inline-block w-2 h-2 rounded-full bg-accent mr-2"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5] 
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  New Posts
                </span>
                <motion.span 
                  className="text-sm font-medium text-gray-900"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                >
                  {stats.newPosts.toLocaleString()}
                </motion.span>
              </motion.div>
              <motion.div 
                className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ 
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                  x: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <span className="text-sm text-gray-600 flex items-center">
                  <motion.span 
                    className="inline-block w-2 h-2 rounded-full bg-secondary mr-2"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5] 
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                  Comments
                </span>
                <motion.span 
                  className="text-sm font-medium text-gray-900"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                  {stats.comments.toLocaleString()}
                </motion.span>
              </motion.div>
          </div>
        </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 