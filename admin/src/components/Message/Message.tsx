import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MessageProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

const Message: React.FC<MessageProps> = ({ type, message, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
    }
  };
  
  const currentStyle = styles[type];
  
  return (
    <div className={`flex items-center justify-between p-4 mb-4 rounded-lg border ${currentStyle.bg} ${currentStyle.border}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {currentStyle.icon}
        </div>
        <div className={`ml-3 ${currentStyle.text}`}>
          {message}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ${currentStyle.text} hover:${currentStyle.bg}`}
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Message; 