import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, ChevronDownIcon, UserIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import typniLogo from '../../assets/images/TYPNI-11.jpg';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../NotificationBell/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

const Header: FC<HeaderProps> = ({ onMenuClick, profile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get current page title based on path
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path || path === 'admin') return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 z-20">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button 
            onClick={onMenuClick} 
            className="lg:hidden mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          {/* Mobile logo - only visible on small screens */}
          <div className="flex lg:hidden items-center">
            <img 
              src={typniLogo} 
              alt="Young People's Network" 
              className="w-10 h-10 object-cover rounded-md mr-2" 
            />
          </div>
        </div>
        
        {/* Centered page title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="page-title">
            {getPageTitle()}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationBell />
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-md transition-colors duration-200"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
              )}
              <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
                {profile?.full_name?.split(' ')[0] || 'Admin'}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/admin/profile');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Admin Profile
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 