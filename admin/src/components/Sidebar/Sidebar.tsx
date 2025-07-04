import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  CogIcon,
  XMarkIcon,
  UserIcon,
  TagIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import typniLogo from '../../assets/images/TYPNI-11.jpg';

interface SidebarProps {
  onClose?: () => void;
  isOpen?: boolean;
}

interface SidebarItem {
  name: string;
  path: string;
  icon: typeof HomeIcon;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/admin', icon: HomeIcon },
  { name: 'Analytics', path: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Users', path: '/admin/users', icon: UserGroupIcon },
  { name: 'Memberships', path: '/admin/memberships', icon: TagIcon },
  { name: 'Messages', path: '/admin/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Blog Posts', path: '/admin/blog', icon: DocumentTextIcon },
  { name: 'Events', path: '/admin/events', icon: CalendarIcon },
  { name: 'Admin Tracking', path: '/admin/tracking', icon: UserIcon },
  { name: 'Settings', path: '/admin/settings', icon: CogIcon },
];

const Sidebar: FC<SidebarProps> = ({ onClose, isOpen = false }) => {
  const location = useLocation();

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:inset-0 lg:translate-x-0`}>
      {/* Logo section */}
      <div className="p-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center">
          <img 
            src={typniLogo} 
            alt="Young People's Network" 
            className="w-16 h-16 object-cover rounded-md shadow-sm" 
          />
          <div className="ml-2">
            <h1 className="text-sm font-bold text-primary leading-tight">The Young People's Network International</h1>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Navigation links */}
      <nav className="mt-6 flex-1 overflow-y-auto scrollbar-custom">
        <div className="px-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            // Check if current path starts with the item path for more flexibility
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <div className="text-xs text-center text-gray-500">
          <p>© {new Date().getFullYear()} TYPNI</p>
          <p className="mt-1">Admin Version 1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 