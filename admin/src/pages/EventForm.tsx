import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, getEventById, updateEvent, uploadEventBanner } from '../lib/eventService';
import Card from '../components/Card/Card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Event {
  id?: string;
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
  banner?: File;
  created_at?: string;
  updated_at?: string;
}

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  // Form state with default values
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    location: '',
    start_date: new Date(),
    end_date: new Date(),
    capacity: undefined,
    registration_deadline: undefined,
    type: 'in-person',
    status: 'upcoming',
    banner_url: undefined
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
            start_date: startDate,
            end_date: endDate,
            capacity: eventData.capacity,
            registration_deadline: eventData.registration_deadline ? new Date(eventData.registration_deadline) : undefined,
            type: eventData.type,
            status: eventData.status,
            banner_url: eventData.banner_url
          });
          
          if (eventData.banner_url) {
            setImagePreview(eventData.banner_url);
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
    
    // Handle date inputs
    if (name === 'start_date' || name === 'end_date' || name === 'registration_deadline') {
      setFormData(prev => ({ ...prev, [name]: value ? new Date(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      if (!formData.title || !formData.location || !formData.start_date || !formData.end_date || !formData.type) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Construct date objects
      const startDateTime = new Date(formData.start_date);
      const endDateTime = new Date(formData.end_date);
      
      // Validate dates
      if (endDateTime <= startDateTime) {
        setError('End date must be after start date');
        setSubmitting(false);
        return;
      }
      
      // Optional registration deadline
      let registrationDeadline: Date | undefined = undefined;
      if (formData.registration_deadline) {
        registrationDeadline = new Date(formData.registration_deadline);
      }
      
      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: startDateTime,
        end_date: endDateTime,
        capacity: formData.capacity,
        registration_deadline: registrationDeadline,
        type: formData.type as 'in-person' | 'online' | 'hybrid',
        status: formData.status as 'upcoming' | 'ongoing' | 'past' | 'canceled',
        banner_url: formData.banner_url
      };
      
      let resultEvent;
      
      // Create or update event
      if (isEditMode && id) {
        resultEvent = await updateEvent(id, eventData, user.id);
      } else {
        resultEvent = await createEvent(eventData, user.id);
      }
      
      // Handle banner upload if there's a file
      if (formData.banner) {
        const bannerUrl = await uploadEventBanner(formData.banner, resultEvent.id);
        // Update event with banner URL
        await updateEvent(resultEvent.id, { banner_url: bannerUrl }, user.id);
      }
      
      toast.success(`Event ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate(`/admin/events/${resultEvent.id}`);
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
        <Link to="/admin/events" className="text-gray-500 hover:text-gray-700">
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
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline Date
                  </label>
                  <input
                    type="date"
                    id="registration_deadline"
                    name="registration_deadline"
                    value={formData.registration_deadline ? formData.registration_deadline.toISOString().split('T')[0] : ''}
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
                
                {(imagePreview || formData.banner_url) && (
                  <div className="mt-2 relative">
                    <img 
                      src={imagePreview || formData.banner_url || ''} 
                      alt="Banner preview" 
                      className="max-h-40 rounded-lg border border-gray-200"
                    />
                    {!imagePreview && formData.banner_url && (
                      <p className="text-xs text-gray-500 mt-1">Current banner (upload new to replace)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t flex justify-end gap-3">
            <Link 
              to="/admin/events"
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