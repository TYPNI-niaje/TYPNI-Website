import { useState, useEffect } from 'react';
import type { FC } from 'react';
import Card from '../components/Card/Card';
import { UserIcon, EnvelopeIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AdminProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  phone_number?: string | null;
  country?: string | null;
  organization?: string | null;
  pwd_status?: string | null;
}

const AdminProfile: FC = () => {
  const { profile, user } = useAuth();
  const [adminData, setAdminData] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Get admin user data from auth_users view
        const { data: authUser, error: authError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (authError) throw authError;
        
        // Get additional profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        setAdminData({
          id: authUser.id,
          full_name: authUser.full_name,
          email: authUser.email,
          role: authUser.role || 'Admin',
          avatar_url: profileData.avatar_url,
          created_at: profileData.created_at,
          phone_number: profileData.phone_number,
          country: profileData.country,
          organization: profileData.organization,
          pwd_status: profileData.pwd_status
        });
      } catch (err: any) {
        console.error('Error fetching admin profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
        <p className="text-red-700">Error loading profile: {error}</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
        <p className="text-yellow-700">Profile data not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden">
              {adminData.avatar_url ? (
                <img 
                  src={adminData.avatar_url} 
                  alt={adminData.full_name || 'Avatar'} 
                  className="w-24 h-24 object-cover rounded-full" 
                />
              ) : (
                adminData.full_name?.charAt(0) || adminData.email?.charAt(0) || 'A'
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {adminData.full_name || 'Admin User'}
            </h2>
            <div className="flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-5 h-5 text-primary mr-2" />
              <span className="text-sm bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full font-medium">
                {adminData.role}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Member since {formatDate(adminData.created_at)}
            </p>
          </div>
        </Card>

        {/* Profile Details Card */}
        <Card className="lg:col-span-2" title="Profile Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-gray-900">{adminData.full_name || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{adminData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Joined</p>
                  <p className="text-gray-900">{formatDate(adminData.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {adminData.phone_number && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone Number</p>
                  <p className="text-gray-900">{adminData.phone_number}</p>
                </div>
              )}
              
              {adminData.country && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Country</p>
                  <p className="text-gray-900">{adminData.country}</p>
                </div>
              )}
              
              {adminData.organization && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Organization</p>
                  <p className="text-gray-900">{adminData.organization}</p>
                </div>
              )}
              
              {adminData.pwd_status && (
                <div>
                  <p className="text-sm font-medium text-gray-700">PWD Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    adminData.pwd_status === 'yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {adminData.pwd_status === 'yes' ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Privileges Card */}
      <Card title="Admin Privileges" className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-white" />
            <h3 className="font-semibold mb-1">User Management</h3>
            <p className="text-sm opacity-90">View and manage all users</p>
          </div>
          <div className="text-center p-4">
            <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-white" />
            <h3 className="font-semibold mb-1">Content Control</h3>
            <p className="text-sm opacity-90">Manage blogs and events</p>
          </div>
          <div className="text-center p-4">
            <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-white" />
            <h3 className="font-semibold mb-1">System Access</h3>
            <p className="text-sm opacity-90">Full administrative access</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminProfile;