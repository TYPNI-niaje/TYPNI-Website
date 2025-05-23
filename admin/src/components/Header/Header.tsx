import type { FC } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import typniLogo from '../../assets/images/TYPNI-11.jpg';
import { useLocation } from 'react-router-dom';
import NotificationBell from '../NotificationBell/NotificationBell';

interface HeaderProps {
  onMenuClick?: () => void;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

const Header: FC<HeaderProps> = ({ onMenuClick, profile }) => {
  const location = useLocation();
  
  // Get current page title based on path
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path || path === 'admin') return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
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
          
          <div className="flex items-center space-x-3">
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 