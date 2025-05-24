import type { FC, ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

const Card: FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-w-0 w-full ${className}`}>
      {title && (
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-medium text-gray-900 overflow-wrap-anywhere">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      <div className="px-4 sm:px-6 lg:px-8 py-4 min-w-0">{children}</div>
    </div>
  );
};

export default Card; 