import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEventById, getEventRegistrations, updateRegistrationStatus } from '../lib/eventService';
import type { Event, EventRegistration } from '../lib/eventService';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card/Card';
import Modal from '../components/Modal/Modal';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const EventDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [newStatus, setNewStatus] = useState<EventRegistration['status']>('registered');

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const eventData = await getEventById(id);
        setEvent(eventData);
        
        const registrationsData = await getEventRegistrations(id);
        setRegistrations(registrationsData);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleStatusChange = (registration: EventRegistration) => {
    setSelectedRegistration(registration);
    setNewStatus(registration.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRegistration || !user) return;
    
    try {
      await updateRegistrationStatus(selectedRegistration.id, newStatus, user.id);
      
      // Update local state
      setRegistrations(registrations.map(reg => 
        reg.id === selectedRegistration.id 
          ? { ...reg, status: newStatus } 
          : reg
      ));
      
      toast.success('Registration status updated');
      setShowStatusModal(false);
    } catch (err) {
      console.error('Failed to update registration status:', err);
      toast.error('Failed to update status');
    }
  };

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

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusClass = (status: string) => {
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

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-3 text-gray-500">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || 'Event not found'}</p>
        <button 
          className="mt-4 btn-secondary" 
          onClick={() => navigate('/admin/events')}
        >
          Return to Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin/events" className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventStatusClass(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventTypeClass(event.type)}`}>
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
              </div>
              <h2 className="text-xl font-bold">{event.title}</h2>
            </div>
            <Link 
              to={`/admin/events/${event.id}/edit`} 
              className="inline-flex items-center text-primary hover:text-primary-dark text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit Event
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <ClockIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm">Start: {formatDate(event.start_date)}</div>
                      <div className="text-sm">End: {formatDate(event.end_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                  
                  {event.capacity && (
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Capacity: {event.capacity}</span>
                    </div>
                  )}

                  {event.registration_deadline && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Registration deadline: {formatDate(event.registration_deadline)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Registration Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-primary">{registrations.length}</div>
                  <div className="text-sm text-gray-500">Total Registrations</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {registrations.filter(reg => reg.status === 'attended').length}
                  </div>
                  <div className="text-sm text-gray-500">Attended</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-yellow-600">
                    {registrations.filter(reg => reg.status === 'no-show').length}
                  </div>
                  <div className="text-sm text-gray-500">No Shows</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-red-600">
                    {registrations.filter(reg => reg.status === 'canceled').length}
                  </div>
                  <div className="text-sm text-gray-500">Canceled</div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Registrations</h3>
            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendee
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{registration.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{registration.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(registration.registration_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(registration.status)}`}>
                            {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {registration.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleStatusChange(registration)}
                            className="text-primary hover:text-primary-dark"
                          >
                            Change Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No registrations yet for this event.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Update Registration Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Registration Status"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendee
            </label>
            <div className="text-base">
              {selectedRegistration?.full_name || 'N/A'}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input-field w-full"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EventRegistration['status'])}
            >
              <option value="registered">Registered</option>
              <option value="attended">Attended</option>
              <option value="no-show">No Show</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              className="btn-secondary"
              onClick={() => setShowStatusModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleUpdateStatus}
            >
              Update Status
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventDetail; 