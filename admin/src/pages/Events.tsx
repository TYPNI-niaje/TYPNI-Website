import { useState, useEffect } from 'react';
import type { FC } from 'react';
import Card from '../components/Card/Card';
import { MagnifyingGlassIcon, CalendarIcon, PlusIcon, MapPinIcon, UserGroupIcon, ClockIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getEvents, cancelEvent } from '../lib/eventService';
import type { Event as EventType } from '../lib/eventService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal/Modal';
import { toast } from 'react-hot-toast';

const EventCard: FC<{ event: EventType; onCancel: (id: string) => void }> = ({ event, onCancel }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getEventTypeClass = (type: string) => {
    switch(type) {
      case 'in-person':
        return 'bg-purple-100 text-purple-800';
      case 'online':
        return 'bg-teal-100 text-teal-800';
      case 'hybrid':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventTypeClass(event.type)}`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{event.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <ClockIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <div>{formatDate(event.start_date)}</div>
                  <div>to {formatDate(event.end_date)}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <MapPinIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span>{event.location}</span>
              </div>
              
              {event.capacity && (
              <div className="flex items-center gap-2 text-sm">
                <UserGroupIcon className="w-5 h-5 text-gray-400" />
                  <span>Capacity: {event.capacity}</span>
                </div>
              )}

              {event.registration_deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <span>Registration deadline: {formatDate(event.registration_deadline)}</span>
              </div>
              )}
            </div>
          </div>
          
          <div className="text-center bg-primary bg-opacity-10 rounded-lg p-4 hidden md:block">
            <span className="block text-2xl font-bold text-primary">{event.start_date.getDate()}</span>
            <span className="text-sm font-medium text-primary">{formatDateShort(event.start_date).split(' ')[0]}</span>
            <span className="block text-xs text-primary mt-1">{event.start_date.getFullYear()}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
        <Link 
          to={`/admin/events/${event.id}/edit`} 
          className="inline-flex items-center text-primary hover:text-primary-dark text-sm font-medium"
        >
          <PencilIcon className="w-4 h-4 mr-1" />
          Edit
        </Link>
        {event.status !== 'canceled' && (
          <button 
            onClick={() => onCancel(event.id)} 
            className="inline-flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Cancel
          </button>
        )}
        <Link 
          to={`/admin/events/${event.id}`} 
          className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          <EyeIcon className="w-4 h-4 mr-1" />
          Details
        </Link>
      </div>
    </div>
  );
};

const Events: FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<string | null>(null);

  const { user } = useAuth();
  
  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await getEvents();
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCancelClick = (id: string) => {
    setEventToCancel(id);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!eventToCancel || !user) return;
    
    try {
      await cancelEvent(eventToCancel, user.id);
      // Update the events list after successful cancellation
      setEvents(events.map(event => 
        event.id === eventToCancel 
          ? { ...event, status: 'canceled' } 
          : event
      ));
      toast.success('Event cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel event:', err);
      toast.error('Failed to cancel event');
    } finally {
      setShowCancelModal(false);
      setEventToCancel(null);
    }
  };
  
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filter === 'all' || event.status === filter;
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        
        <Link to="/admin/events/new" className="btn-primary flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Event
        </Link>
      </div>
      
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search events..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'upcoming' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'ongoing' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              onClick={() => setFilter('ongoing')}
            >
              Ongoing
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'past' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              onClick={() => setFilter('past')}
            >
              Past
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'canceled' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              onClick={() => setFilter('canceled')}
            >
              Canceled
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-gray-500">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button 
              className="mt-4 btn-secondary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-6">
          {filteredEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onCancel={handleCancelClick}
                />
          ))}
        </div>
        
        {filteredEvents.length === 0 && (
          <div className="text-center py-6">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No events found matching your search criteria.</p>
          </div>
            )}
          </>
        )}
      </Card>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Event"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to cancel this event? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className="btn-secondary"
              onClick={() => setShowCancelModal(false)}
            >
              No, Keep Event
            </button>
            <button
              className="btn-danger"
              onClick={handleCancelConfirm}
            >
              Yes, Cancel Event
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Events; 