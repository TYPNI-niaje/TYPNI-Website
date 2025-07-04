import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
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

  // Notification item component
  const NotificationItem = ({ notification }: { notification: NotificationItem }) => {
    const typeColors = {
      info: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-yellow-100 text-yellow-600',
      error: 'bg-red-100 text-red-600'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-3 border-b border-gray-100 ${!notification.isRead ? 'bg-blue-50' : ''}`}
      >
        <Link 
          to={notification.link || '#'} 
          className="block"
          onClick={() => handleMarkAsRead(notification.id)}
        >
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-3 ${notification.isRead ? 'bg-gray-300' : 'bg-primary'}`}></div>
            <div className="flex-1">
              <div className="font-medium">{notification.title}</div>
              <p className="text-sm text-gray-600">{notification.message}</p>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </div>
            </div>
            <div className={`ml-3 px-2 py-1 rounded-full text-xs ${typeColors[notification.type]}`}>
              {notification.type}
            </div>
          </div>
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
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <BellIcon className="w-6 h-6" />
        
        {/* Notification count badge with pulse animation */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              boxShadow: unreadCount > 0 ? ['0 0 0 0 rgba(220, 38, 38, 0.4)', '0 0 0 6px rgba(220, 38, 38, 0)'] : 'none'
            }}
            transition={{ 
              scale: { type: 'spring', stiffness: 500, damping: 15 },
              boxShadow: { 
                repeat: Infinity, 
                duration: 1.5,
                repeatType: 'loop'
              }
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-primary hover:text-primary-dark"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">No notifications</div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100">
              <Link 
                to="/admin/tracking"
                className="text-xs text-primary hover:text-primary-dark block text-center"
              >
                View all activity
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell; 