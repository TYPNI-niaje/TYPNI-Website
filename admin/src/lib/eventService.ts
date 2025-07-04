import { supabase } from './supabase';
import { logAdminAction } from './supabase';

// Types
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  capacity?: number;
  registration_deadline?: Date;
  type: 'in-person' | 'online' | 'hybrid';
  status: 'upcoming' | 'ongoing' | 'past' | 'canceled';
  banner_url?: string;
  organizer_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: Date;
  status: 'registered' | 'attended' | 'canceled' | 'no-show';
  notes?: string;
  // Join with profiles
  full_name?: string;
  email?: string;
  phone_number?: string;
}

// Helper function to convert timestamps in an object to Date objects
const convertTimestampsToDate = (obj: any) => {
  const dateFields = ['start_date', 'end_date', 'registration_deadline', 'created_at', 'updated_at', 'registration_date'];
  const result = { ...obj };
  
  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field]);
    }
  }
  
  return result;
};

// Get all events
export const getEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
      
    if (error) throw error;
    
    // Convert timestamps to Date objects
    return data.map(event => convertTimestampsToDate(event)) as Event[];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Get a single event by ID
export const getEventById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return convertTimestampsToDate(data) as Event;
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw error;
  }
};

// Create a new event
export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>, userId: string) => {
  try {
    // Add organizer_id if not provided
    const eventData = {
      ...event,
      organizer_id: event.organizer_id || userId
    };
    
    console.log('Creating event with data:', JSON.stringify(eventData));
    
    // Check that required fields are present
    if (!eventData.title) throw new Error('Event title is required');
    if (!eventData.start_date) throw new Error('Event start date is required');
    if (!eventData.end_date) throw new Error('Event end date is required');
    
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating event:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Event was not created');
    }
    
    try {
      // Log the admin action
      await logAdminAction(userId, 'create_event', { event_id: data.id, title: data.title });
    } catch (logError) {
      console.error('Error logging admin action:', logError);
      // Continue with event creation even if logging fails
    }
    
    return convertTimestampsToDate(data) as Event;
  } catch (error: any) {
    console.error('Error creating event:', error);
    // Include detailed error in the message
    if (error.message) {
      throw new Error(`Error creating event: ${error.message}`);
    } else if (error.error_description) {
      throw new Error(`Error creating event: ${error.error_description}`);
    } else {
      throw error;
    }
  }
};

// Update an event
export const updateEvent = async (id: string, eventData: Partial<Event>, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction(userId, 'update_event', { event_id: id, title: data.title });
    
    return convertTimestampsToDate(data) as Event;
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    throw error;
  }
};

// Cancel an event
export const cancelEvent = async (id: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'canceled' })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction(userId, 'cancel_event', { event_id: id, title: data.title });
    
    return convertTimestampsToDate(data) as Event;
  } catch (error) {
    console.error(`Error canceling event with ID ${id}:`, error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (id: string, userId: string) => {
  try {
    // First, get the event details for logging
    const { data: eventData } = await supabase
      .from('events')
      .select('title')
      .eq('id', id)
      .single();
      
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction(userId, 'delete_event', { event_id: id, title: eventData?.title || 'Unknown' });
    
    return true;
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    throw error;
  }
};

// Upload event banner
export const uploadEventBanner = async (file: File, eventId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('events')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    const { data } = supabase
      .storage
      .from('events')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading event banner:', error);
    throw error;
  }
};

// Get event registrations
export const getEventRegistrations = async (eventId: string) => {
  try {
    // Modified the query to use the auth_users view
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        profiles:user_id (full_name, id)
      `)
      .eq('event_id', eventId);
      
    if (error) {
      console.error(`Error in query for event ${eventId}:`, error);
      throw error;
    }

    // Once we have registrations, fetch the user emails from auth_users view
    const userIds = data.map(reg => reg.user_id);
    
    // Only fetch emails if there are registrations
    let emailsMap: {[key: string]: string} = {};
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('id, email')
        .in('id', userIds);
        
      if (userError) {
        console.error(`Error fetching user emails for registrations: `, userError);
      } else if (userData) {
        // Create a map of user_id -> email
        emailsMap = userData.reduce((acc: {[key: string]: string}, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {});
      }
    }
    
    // Format the data and convert timestamps
    return data.map(registration => {
      const formattedReg = {
        ...registration,
        full_name: registration.profiles?.full_name,
        email: emailsMap[registration.user_id] || null
      };
      return convertTimestampsToDate(formattedReg);
    }) as EventRegistration[];
  } catch (error) {
    console.error(`Error fetching registrations for event ${eventId}:`, error);
    throw error;
  }
};

// Register user for an event
export const registerForEvent = async (eventId: string, userId: string, notes?: string) => {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert([{
        event_id: eventId,
        user_id: userId,
        notes
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return convertTimestampsToDate(data) as EventRegistration;
  } catch (error) {
    console.error(`Error registering for event ${eventId}:`, error);
    throw error;
  }
};

// Update registration status
export const updateRegistrationStatus = async (
  registrationId: string, 
  status: EventRegistration['status'],
  userId: string
) => {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .update({ status })
      .eq('id', registrationId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction(userId, 'update_registration_status', {
      registration_id: registrationId,
      event_id: data.event_id,
      new_status: status
    });
    
    return convertTimestampsToDate(data) as EventRegistration;
  } catch (error) {
    console.error(`Error updating registration status for ID ${registrationId}:`, error);
    throw error;
  }
};

// Check if user is registered for an event
export const isUserRegisteredForEvent = async (eventId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 means no rows returned, which means user is not registered
        return { registered: false };
      }
      throw error;
    }
    
    return { 
      registered: true,
      status: data.status,
      registrationId: data.id
    };
  } catch (error) {
    console.error(`Error checking registration for event ${eventId} and user ${userId}:`, error);
    throw error;
  }
};

// Get upcoming events
export const getUpcomingEvents = async (limit: number = 6) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'upcoming')
      .order('start_date', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    return data.map(event => convertTimestampsToDate(event)) as Event[];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
}; 