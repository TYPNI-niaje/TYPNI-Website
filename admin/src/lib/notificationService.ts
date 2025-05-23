import { supabase } from './supabase';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  data?: any;
  notificationType: 'profile' | 'action' | 'blog' | 'event';
  sourceId: string;
}

/**
 * Fetches notifications for display in the notification bell
 * Combines user registrations, security events, and other system alerts
 */
export const fetchNotifications = async (adminId?: string): Promise<NotificationItem[]> => {
  try {
    // Get recent user registrations (new members)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (profilesError) throw profilesError;
    
    // Get recent admin actions that might need attention
    const { data: actions, error: actionsError } = await supabase
      .from('admin_actions')
      .select('id, action, details, created_at')
      .in('action', ['failed_login', 'access_denied', 'session_expired'])
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (actionsError) throw actionsError;
    
    // Get new blog posts for notification
    const { data: blogPosts, error: blogsError } = await supabase
      .from('blogs')
      .select('id, title, created_at')
      .eq('status', 'published')  
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (blogsError) throw blogsError;
    
    // Get new event registrations
    const { data: eventRegs, error: eventRegsError } = await supabase
      .from('event_registrations') 
      .select('id, event_id, registration_date, events(title)')
      .order('registration_date', { ascending: false })
      .limit(5);
      
    if (eventRegsError) throw eventRegsError;
    
    // Get read notification records if admin ID is provided
    const readMap: Record<string, boolean> = {};
    
    if (adminId) {
      const { data: reads, error: readsError } = await supabase
        .from('admin_notification_reads')
        .select('notification_type, source_id')
        .eq('admin_id', adminId);
        
      if (!readsError && reads) {
        reads.forEach(read => {
          const key = `${read.notification_type}:${read.source_id}`;
          readMap[key] = true;
        });
      }
    }
    
    // Helper function to check if notification is read
    const isRead = (type: string, id: string): boolean => {
      return readMap[`${type}:${id}`] || false;
    };
    
    // Convert to notification items
    const notificationItems: NotificationItem[] = [
      // New member registrations
      ...(profiles || []).map(profile => ({
        id: `profile-${profile.id}`,
        title: 'New Member',
        message: `${profile.full_name || 'A new user'} has joined.`,
        timestamp: profile.created_at,
        isRead: isRead('profile', profile.id),
        type: 'success' as const,
        link: '/admin/users',
        data: { profileId: profile.id },
        notificationType: 'profile' as const,
        sourceId: profile.id
      })),
      
      // Security-related admin actions
      ...(actions || []).map(action => {
        let title = 'System Alert';
        let type: 'info' | 'warning' | 'error' = 'info';
        let message = 'System activity detected.';
        
        if (action.action === 'failed_login') {
          title = 'Failed Login Attempt';
          type = 'error';
          message = `Failed login for ${action.details?.email || 'unknown user'}.`;
        } else if (action.action === 'access_denied') {
          title = 'Unauthorized Access Attempt';
          type = 'warning';
          message = `Access denied for ${action.details?.email || 'unknown user'}.`;
        } else if (action.action === 'session_expired') {
          title = 'Session Expired';
          type = 'info';
          message = 'An admin session has expired.';
        }
        
        return {
          id: `action-${action.id}`,
          title,
          message,
          timestamp: action.created_at,
          isRead: isRead('action', action.id),
          type,
          link: '/admin/tracking',
          data: action.details,
          notificationType: 'action' as const,
          sourceId: action.id
        };
      }),
      
      // New blog posts
      ...(blogPosts || []).map(post => ({
        id: `blog-${post.id}`,
        title: 'New Blog Post',
        message: `New post published: "${post.title}"`,
        timestamp: post.created_at,
        isRead: isRead('blog', post.id),
        type: 'info' as const,
        link: `/admin/blog-view/${post.id}`,
        data: { postId: post.id },
        notificationType: 'blog' as const,
        sourceId: post.id
      })),
      
      // Event registrations
      ...(eventRegs || []).map(reg => ({
        id: `event-reg-${reg.id}`,
        title: 'New Event Registration',
        message: `New registration for event: "${reg.events?.title || 'Unknown event'}"`,
        timestamp: reg.registration_date,
        isRead: isRead('event', reg.id),
        type: 'info' as const,
        link: `/admin/events/${reg.event_id}`,
        data: { eventId: reg.event_id },
        notificationType: 'event' as const,
        sourceId: reg.id
      }))
    ];
    
    // Sort by timestamp (most recent first)
    notificationItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return notificationItems;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Gets the notification count for the badge
 */
export const getUnreadCount = (notifications: NotificationItem[]): number => {
  return notifications.filter(item => !item.isRead).length;
};

/**
 * Marks a notification as read in local state
 * If adminId is provided, also updates the database
 */
export const markAsRead = async (
  notifications: NotificationItem[],
  notificationId: string,
  adminId?: string
): Promise<NotificationItem[]> => {
  // Find the notification
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return notifications;
  }
  
  // Update the database if admin ID is provided
  if (adminId) {
    try {
      await supabase.rpc('mark_notification_read', {
        p_admin_id: adminId,
        p_notification_type: notification.notificationType,
        p_source_id: notification.sourceId
      });
    } catch (error) {
      console.error('Error marking notification read:', error);
      // Continue anyway to update local state
    }
  }
  
  // Update local state
  return notifications.map(notification =>
    notification.id === notificationId ? { ...notification, isRead: true } : notification
  );
};

/**
 * Marks all notifications as read
 * If adminId is provided, also updates the database
 */
export const markAllAsRead = async (
  notifications: NotificationItem[],
  adminId?: string
): Promise<NotificationItem[]> => {
  // Update the database if admin ID is provided
  if (adminId) {
    try {
      // Loop through unread notifications and mark them as read
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      // Use Promise.all to perform all inserts in parallel
      await Promise.all(
        unreadNotifications.map(notification => 
          supabase.rpc('mark_notification_read', {
            p_admin_id: adminId,
            p_notification_type: notification.notificationType,
            p_source_id: notification.sourceId
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      // Continue anyway to update local state
    }
  }
  
  return notifications.map(notification => ({ ...notification, isRead: true }));
}; 