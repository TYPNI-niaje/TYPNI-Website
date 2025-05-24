import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  center?: boolean;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'medium', 
  center = true,
  text = 'Loading...'
}) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-4'
  };
  
  const content = (
    <div className="flex items-center">
      <div className={`
        animate-spin rounded-full border-t-transparent border-primary
        ${sizeClasses[size]}
      `}></div>
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  );
  
  if (center) {
    return (
      <div className="flex justify-center items-center p-6">
        {content}
      </div>
    );
  }
  
  return content;
};

export default Loading; 