import type { FC } from 'react';
import { motion } from 'framer-motion';

interface ConfirmSignOutProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmSignOut: FC<ConfirmSignOutProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white max-w-md w-full rounded-lg shadow-xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
          
          <motion.h3
            className="text-xl font-bold text-center mb-1"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Sign Out Confirmation
          </motion.h3>
          
          <motion.p
            className="text-gray-600 text-center mb-6"
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Are you sure you want to sign out of the TYPNI Admin Portal?
          </motion.p>
          
          <div className="flex justify-center space-x-3">
            <motion.button
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-medium text-gray-700 transition-colors"
              onClick={onCancel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Cancel
            </motion.button>
            
            <motion.button
              className="px-5 py-2 bg-primary hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
              onClick={onConfirm}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Yes, Sign Out
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmSignOut; 