import { useState, useEffect } from 'react';
import type { FC } from 'react';
import Card from '../components/Card/Card';
import { MagnifyingGlassIcon, FunnelIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { supabase, logAdminAction, getCurrentUser } from '../lib/supabase';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
  avatar_url?: string | null;
  pwd_status?: string;
  organization?: string;
}

const Users: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Fetch users from auth_users view
        const { data: authUsers, error: fetchError } = await supabase
          .from('auth_users')
          .select('*')
          .order('id', { ascending: false });
        if (fetchError) throw fetchError;
        // Fetch avatar_url, pwd_status, and organization from profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, avatar_url, created_at, pwd_status, organization');
        if (profileError) throw profileError;
        // Merge avatar_url and created_at into users and get pwd_status and organization from profiles
        const formattedUsers: User[] = authUsers.map((user) => {
          const profile: any = profiles.find((p) => p.id === user.id) || {};
          return {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role || 'Member',
            status: 'active',
            created_at: profile.created_at || '',
            avatar_url: profile.avatar_url || null,
            pwd_status: profile.pwd_status || 'no',
            organization: profile.organization || 'None',
          };
        });
        setUsers(formattedUsers);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (user.email || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
    const matchesFilter = filter ? user.status === filter : true;
    
    return matchesSearch && matchesFilter;
  });
  
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };
  
  const getStatusClass = (status: string | undefined) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Add user deletion logic with admin tracking
  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.full_name || user.email}?`)) return;
    const admin = await getCurrentUser();
    if (!admin) {
      alert('You must be logged in as an admin to perform this action.');
      return;
    }
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) {
      alert('Failed to delete user: ' + error.message);
      return;
    }
    // Log the admin action
    await logAdminAction(admin.id, 'delete_user', { userId: user.id, email: user.email, full_name: user.full_name });
    // Refresh users
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  };
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
        <p className="text-red-700">Error loading users: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              className="input-field"
              value={filter || ''}
              onChange={(e) => setFilter(e.target.value || null)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button className="btn-primary">
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filter
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PWD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr key={user.id}>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role || 'Member'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.pwd_status === 'yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.pwd_status === 'yes' ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={user.organization}>
                          {user.organization && user.organization !== 'None' ? 
                            (user.organization.length > 20 ? user.organization.substring(0, 20) + '...' : user.organization) : 
                            'None'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary hover:text-primary-dark">Edit</button>
                          <span className="mx-2 text-gray-300">|</span>
                          <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(user)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 rounded border border-gray-300"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded border border-gray-300"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default Users; 