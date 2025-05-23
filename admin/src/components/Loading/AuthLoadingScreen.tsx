import { FC } from 'react';
import { motion } from 'framer-motion';
import typniLogo from '../../assets/images/TYPNI-11.jpg';

const AuthLoadingScreen: FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center"
      >
        <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
          {/* Outer spinning circle */}
          <motion.div
            animate={{ 
              rotate: 360,
              boxShadow: [
                "0 0 10px rgba(79, 70, 229, 0.3)",
                "0 0 20px rgba(79, 70, 229, 0.5)",
                "0 0 10px rgba(79, 70, 229, 0.3)"
              ]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 rounded-full border-t-4 border-l-4 border-r-4 border-transparent border-t-primary absolute"
          />
          
          {/* Middle spinning ring */}
          <motion.div
            animate={{ 
              rotate: -180,
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 rounded-full border-b-4 border-r-4 border-accent border-opacity-80 absolute"
          />

          {/* Image container with clean border */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-full p-1 shadow-xl z-10 w-20 h-20 flex items-center justify-center"
          >
            <img 
              src={typniLogo} 
              alt="TYPNI Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold text-primary mb-3">Authorizing</h2>
          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3].map((dot) => (
              <motion.div
                key={dot}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: dot * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLoadingScreen; 