import { useState, useEffect } from 'react';
import Card from '../components/Card/Card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  avatar_url?: string | null;
  pwd_status?: string;
  organization?: string;
  [key: string]: any;
}

interface Interest {
  name: string;
}

interface UserInterestResponse {
  interest_id: string;
  interests: {
    name: string;
  };
}

const Memberships = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userInterests, setUserInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Fetch users from auth_users view
        const { data: authUsers, error: fetchError } = await supabase
          .from('auth_users')
          .select('*');
        if (fetchError) throw fetchError;
        
        // Fetch avatar_url and other profile data
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*');
        if (profileError) throw profileError;
        
        // Merge data from both sources
        const mergedUsers = authUsers.map((user) => {
          const profile: any = profiles.find((p) => p.id === user.id) || {};
          return {
            ...profile,
            email: user.email,
            full_name: user.full_name || profile.full_name,
            role: user.role || profile.role || 'Member',
            pwd_status: profile.pwd_status || 'no',
            organization: profile.organization || 'None',
          };
        });
        
        setUsers(mergedUsers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch user interests when a user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchUserInterests(selectedUser.id);
    } else {
      setUserInterests([]);
    }
  }, [selectedUser]);

  const fetchUserInterests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select(`
          interest_id,
          interests (
            name
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Add defensive checks and logging
          if (!data) {
      console.log('No interests data found for user:', userId);
      setUserInterests([]);
      return;
    }
    
    // Transform the data into the expected format, with null checks
    const interests: Interest[] = (data as unknown as UserInterestResponse[]).reduce((acc: Interest[], item) => {
      if (item?.interests?.name) {
        acc.push({ name: item.interests.name });
      } else {
        console.log('Invalid interest data structure:', item);
      }
      return acc;
    }, []);
      
      setUserInterests(interests);
    } catch (err) {
      console.error('Error fetching user interests:', err);
      setUserInterests([]);
    }
  };

  const filteredUsers = users.filter(user => {
    return (
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Memberships</h1>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search members..."
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
            <p className="text-red-700">Error loading members: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name || user.email || ''} className="h-10 w-10 object-cover rounded-full" />
                            ) : (
                              user.full_name?.charAt(0) || user.email?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Unnamed User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role || 'Member'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No members found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSelectedUser(null)}>&times;</button>
            <div className="flex flex-col items-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl mb-2 overflow-hidden">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name || selectedUser.email || ''} className="h-16 w-16 object-cover rounded-full" />
                ) : (
                  selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0) || '?'
                )}
              </div>
              <h2 className="text-xl font-bold mb-1">{selectedUser.full_name || 'Unnamed User'}</h2>
              <p className="text-gray-500 mb-2">{selectedUser.email}</p>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{selectedUser.role || 'Member'}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">PWD Status:</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedUser.pwd_status === 'yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedUser.pwd_status === 'yes' ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Organization:</span>
                <span className="text-gray-900">{selectedUser.organization && selectedUser.organization !== 'None' ? selectedUser.organization : 'None'}</span>
              </div>
              {Object.entries(selectedUser).map(([key, value]) => (
                key !== 'id' && key !== 'full_name' && key !== 'email' && key !== 'role' && key !== 'created_at' && key !== 'avatar_url' && key !== 'pwd_status' && key !== 'organization' ? (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ) : null
              ))}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Joined:</span>
                <span className="text-gray-900">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : ''}</span>
              </div>
              
              {/* Display user interests */}
              <div className="mt-4">
                <span className="font-medium text-gray-700 block mb-2">Interests:</span>
                {userInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userInterests.map((interest, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {interest.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No interests selected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memberships; 