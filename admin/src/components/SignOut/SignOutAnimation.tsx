import type { FC } from 'react';
import { motion } from 'framer-motion';
import typniLogo from '../../assets/images/TYPNI-11.jpg';

interface SignOutAnimationProps {
  isVisible: boolean;
}

const SignOutAnimation: FC<SignOutAnimationProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <motion.div 
      className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative mb-6 w-24 h-24 flex items-center justify-center"
      >
        <motion.div
          animate={{ 
            rotate: 360,
          }}
          transition={{ 
            duration: 1.5, 
            repeat: 1, 
            ease: "easeInOut"
          }}
          className="w-24 h-24 rounded-full border-4 border-primary border-opacity-30 absolute"
        />
        
        <img 
          src={typniLogo} 
          alt="TYPNI Logo" 
          className="w-16 h-16 object-cover rounded-full"
        />
      </motion.div>
      
      <motion.h2 
        className="text-xl font-bold text-gray-800 mb-2"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Signing Out
      </motion.h2>
      
      <motion.p
        className="text-gray-600 mb-8"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Thank you for using TYPNI Admin Portal
      </motion.p>
      
      <motion.div 
        className="flex justify-center space-x-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: dot * 0.2,
              ease: "easeInOut"
            }}
            className="w-3 h-3 bg-primary rounded-full"
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SignOutAnimation; 