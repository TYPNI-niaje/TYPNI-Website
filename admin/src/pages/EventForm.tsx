import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, createEvent, updateEvent, uploadEventBanner } from '../lib/eventService';
import type { Event } from '../lib/eventService';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card/Card';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

// Function to get tomorrow's date in YYYY-MM-DD format
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Function to get a date 5 days from now in YYYY-MM-DD format
const getFiveDaysFromNow = () => {
  const fiveDays = new Date();
  fiveDays.setDate(fiveDays.getDate() + 5);
  return fiveDays.toISOString().split('T')[0];
};

// Function to get a date 4 days from now in YYYY-MM-DD format
const getFourDaysFromNow = () => {
  const fourDays = new Date();
  fourDays.setDate(fourDays.getDate() + 4);
  return fourDays.toISOString().split('T')[0];
};

const EventForm: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  // Form state with default values for faster testing
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    capacity: string;
    registrationDeadlineDate: string;
    registrationDeadlineTime: string;
    type: 'in-person' | 'online' | 'hybrid';
    status: 'upcoming' | 'ongoing' | 'past' | 'canceled';
    banner: File | null;
  }>({
    title: 'Graduation',
    description: 'Let\'s go',
    location: 'Nairobi',
    startDate: getTomorrowDate(),
    startTime: '11:00',
    endDate: getFiveDaysFromNow(),
    endTime: '10:00',
    capacity: '100',
    registrationDeadlineDate: getFourDaysFromNow(),
    registrationDeadlineTime: '12:00',
    type: 'in-person',
    status: 'upcoming',
    banner: null
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);

  // Fetch event data if in edit mode
  useEffect(() => {
    const fetchEvent = async () => {
      if (isEditMode && id) {
        try {
          setLoading(true);
          const eventData = await getEventById(id);
          
          // Format dates for form inputs
          const startDate = new Date(eventData.start_date);
          const endDate = new Date(eventData.end_date);
          
          setFormData({
            title: eventData.title,
            description: eventData.description || '',
            location: eventData.location,
            startDate: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endDate: endDate.toISOString().split('T')[0],
            endTime: endDate.toTimeString().slice(0, 5),
            capacity: eventData.capacity ? String(eventData.capacity) : '',
            registrationDeadlineDate: eventData.registration_deadline 
              ? new Date(eventData.registration_deadline).toISOString().split('T')[0] 
              : '',
            registrationDeadlineTime: eventData.registration_deadline
              ? new Date(eventData.registration_deadline).toTimeString().slice(0, 5)
              : '',
            type: eventData.type,
            status: eventData.status,
            banner: null
          });
          
          if (eventData.banner_url) {
            setExistingBannerUrl(eventData.banner_url);
          }
        } catch (err) {
          console.error('Error fetching event:', err);
          setError('Failed to load event data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEvent();
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, banner: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You need to be logged in to perform this action');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!formData.title || !formData.location || !formData.startDate || !formData.startTime 
          || !formData.endDate || !formData.endTime || !formData.type) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Construct date objects
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Validate dates
      if (endDateTime <= startDateTime) {
        setError('End date must be after start date');
        setSubmitting(false);
        return;
      }
      
      // Optional registration deadline
      let registrationDeadline: Date | null = null;
      if (formData.registrationDeadlineDate && formData.registrationDeadlineTime) {
        registrationDeadline = new Date(`${formData.registrationDeadlineDate}T${formData.registrationDeadlineTime}`);
      }
      
      // Prepare event data
      const eventData: Partial<Event> = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: startDateTime,
        end_date: endDateTime,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
        registration_deadline: registrationDeadline || undefined,
        type: formData.type,
        status: formData.status,
        // Banner will be handled separately
        banner_url: existingBannerUrl || undefined
      };
      
      let resultEvent;
      
      // Create or update event
      if (isEditMode && id) {
        resultEvent = await updateEvent(id, eventData, user.id);
      } else {
        resultEvent = await createEvent(eventData as Omit<Event, 'id' | 'created_at' | 'updated_at'>, user.id);
      }
      
      // Handle banner upload if there's a file
      if (formData.banner) {
        const bannerUrl = await uploadEventBanner(formData.banner, resultEvent.id);
        // Update event with banner URL
        await updateEvent(resultEvent.id, { banner_url: bannerUrl }, user.id);
      }
      
      toast.success(`Event ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate(`/events/${resultEvent.id}`);
    } catch (err) {
      console.error('Error submitting event:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} event. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-3 text-gray-500">Loading event data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={isEditMode ? `/events/${id}` : "/events"} className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="font-medium text-lg border-b pb-2">Basic Information</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field w-full"
                  placeholder="Enter event description"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder="Enter event location"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                >
                  <option value="in-person">In Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  className="input-field w-full"
                  placeholder="Number of participants"
                />
              </div>
            </div>
            
            {/* Dates and Times */}
            <div className="space-y-4">
              <h2 className="font-medium text-lg border-b pb-2">Dates and Times</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="registrationDeadlineDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline Date
                  </label>
                  <input
                    type="date"
                    id="registrationDeadlineDate"
                    name="registrationDeadlineDate"
                    value={formData.registrationDeadlineDate}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="registrationDeadlineTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline Time
                  </label>
                  <input
                    type="time"
                    id="registrationDeadlineTime"
                    name="registrationDeadlineTime"
                    value={formData.registrationDeadlineTime}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  />
                </div>
              </div>
              
              {isEditMode && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input-field w-full"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="past">Past</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Status is normally updated automatically based on event dates
                  </p>
                </div>
              )}
              
              <div>
                <label htmlFor="banner" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Banner Image
                </label>
                <input
                  type="file"
                  id="banner"
                  name="banner"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input-field w-full"
                />
                
                {(imagePreview || existingBannerUrl) && (
                  <div className="mt-2 relative">
                    <img 
                      src={imagePreview || existingBannerUrl || ''} 
                      alt="Banner preview" 
                      className="max-h-40 rounded-lg border border-gray-200"
                    />
                    {!imagePreview && existingBannerUrl && (
                      <p className="text-xs text-gray-500 mt-1">Current banner (upload new to replace)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t flex justify-end gap-3">
            <Link 
              to={isEditMode ? `/events/${id}` : "/events"} 
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EventForm; 