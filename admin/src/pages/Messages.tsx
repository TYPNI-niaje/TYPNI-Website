import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
}

const Messages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'unread' | 'read' | 'archived') => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));

      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (err: any) {
      console.error('Error updating message status:', err);
    }
  };

  const filteredMessages = messages.filter(message => {
    const searchLower = searchTerm.toLowerCase();
    return (
      message.name.toLowerCase().includes(searchLower) ||
      message.email.toLowerCase().includes(searchLower) ||
      message.message.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search messages..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700">Error loading messages: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <tr 
                      key={message.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${message.status === 'unread' ? 'font-semibold' : ''}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (message.status === 'unread') {
                          updateMessageStatus(message.id, 'read');
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${message.status === 'unread' ? 'bg-blue-100 text-blue-800' : 
                            message.status === 'read' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {message.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{message.name}</div>
                          <div className="text-sm text-gray-500">{message.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {message.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No messages found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" 
              onClick={() => setSelectedMessage(null)}
            >
              &times;
            </button>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedMessage.name}</h2>
                  <p className="text-gray-600">{selectedMessage.email}</p>
                  {selectedMessage.phone && (
                    <p className="text-gray-600">{selectedMessage.phone}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedMessage.status === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => updateMessageStatus(selectedMessage.id, 'unread')}
                  >
                    Mark Unread
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedMessage.status === 'archived' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                  >
                    {selectedMessage.status === 'archived' ? 'Archived' : 'Archive'}
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Received on {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages; 