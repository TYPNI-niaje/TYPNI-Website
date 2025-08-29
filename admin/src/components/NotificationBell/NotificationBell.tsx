import { useState, useEffect, useRef } from 'react';
import { BellIcon, UserPlusIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchNotifications, markAsRead, markAllAsRead, type NotificationItem } from '../../lib/notificationService';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch notifications
  useEffect(() => {
    const getNotifications = async () => {
      setLoading(true);
      try {
        const notificationItems = await fetchNotifications(user?.id);
        
        setNotifications(notificationItems);
        setUnreadCount(notificationItems.filter(item => !item.isRead).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch notifications if user is authenticated
    if (user) {
      // Fetch immediately
      getNotifications();
      
      // Set up interval to periodically check for new notifications
      const interval = setInterval(getNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const updatedNotifications = await markAsRead(notifications, id, user?.id);
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(item => !item.isRead).length);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const updatedNotifications = await markAllAsRead(notifications, user?.id);
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon based on type and title
  const getNotificationIcon = (notification: NotificationItem) => {
    const iconClass = "w-5 h-5";
    
    if (notification.title.toLowerCase().includes('member') || notification.title.toLowerCase().includes('user')) {
      return <UserPlusIcon className={`${iconClass} text-blue-600`} />;
    }
    
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-emerald-600`} />;
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-amber-600`} />;
      case 'error':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-600`} />;
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClass} text-blue-600`} />;
    }
  };

  // Get relative time string
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Notification item component
  const NotificationItem = ({ notification }: { notification: NotificationItem }) => {
    const typeStyles = {
      info: 'from-blue-50 to-indigo-50 border-blue-100',
      success: 'from-emerald-50 to-teal-50 border-emerald-100',
      warning: 'from-amber-50 to-yellow-50 border-amber-100',
      error: 'from-red-50 to-rose-50 border-red-100'
    };

    const statusStyles = {
      info: 'bg-blue-100 text-blue-700 border-blue-200',
      success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      error: 'bg-red-100 text-red-700 border-red-200'
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
        className="relative"
      >
        <Link 
          to={notification.link || '#'} 
          className="block"
          onClick={() => handleMarkAsRead(notification.id)}
        >
          <motion.div
            className={`mx-2 sm:mx-3 mb-2 sm:mb-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${typeStyles[notification.type]} border transition-all duration-200 hover:shadow-md group ${!notification.isRead ? 'ring-2 ring-primary/20' : ''}`}
            whileHover={{ scale: 1.01, y: -1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              {/* Icon */}
              <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm group-hover:shadow-md transition-all duration-200 flex-shrink-0`}>
                {getNotificationIcon(notification)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate pr-2 leading-tight">
                    {notification.title}
                  </h4>
                  {!notification.isRead && (
                    <motion.div 
                      className="w-2 h-2 bg-primary rounded-full shadow-sm flex-shrink-0 mt-0.5"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between flex-wrap gap-1 sm:gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {getRelativeTime(notification.timestamp)}
                  </span>
                  
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusStyles[notification.type]} flex-shrink-0`}>
                    {notification.type}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </motion.div>
        </Link>
      </motion.div>
    );
  };

  // Don't render anything if no user
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
        >
          <BellIcon className="w-6 h-6" />
        </motion.div>
        
        {/* Enhanced notification count badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <motion.span
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold shadow-lg"
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(239, 68, 68, 0.4)',
                    '0 0 0 8px rgba(239, 68, 68, 0)',
                  ]
                }}
                transition={{ 
                  boxShadow: { 
                    repeat: Infinity, 
                    duration: 1.5,
                    repeatType: 'loop'
                  }
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Enhanced Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed sm:absolute top-16 sm:top-auto right-4 left-4 sm:right-0 sm:left-auto mt-0 sm:mt-3 w-auto sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 z-50 overflow-hidden"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/5 to-purple-500/5 border-b border-gray-100/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <BellIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">
                      {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                  </div>
                </div>
                
                {unreadCount > 0 && (
                  <motion.button 
                    className="text-xs text-primary hover:text-primary-dark font-medium bg-primary/10 hover:bg-primary/20 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200"
                    onClick={handleMarkAllAsRead}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="hidden sm:inline">Mark all as read</span>
                    <span className="sm:hidden">Mark all</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary border-t-transparent mb-3 sm:mb-4"></div>
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="py-1 sm:py-2">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NotificationItem notification={notification} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center py-8 sm:py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                    <BellIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No notifications</h4>
                  <p className="text-xs text-gray-500 text-center max-w-48 px-4">You're all caught up! New notifications will appear here.</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50/80 border-t border-gray-100/50">
                <Link 
                  to="/admin/tracking"
                  className="text-sm text-primary hover:text-primary-dark font-medium flex items-center justify-center space-x-2 hover:bg-primary/5 rounded-xl py-2 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <span>View all activity</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell; 