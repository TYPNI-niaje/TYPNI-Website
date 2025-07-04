import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AdminGreetingProps {
  firstName: string;
  className?: string;
}

const AdminGreeting: FC<AdminGreetingProps> = ({ firstName, className = '' }) => {
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  // Get greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const greeting = getGreeting();
  const fullText = `${greeting}, ${firstName}!`;
  
  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    setDisplayText('');
    setIsTypingComplete(false);
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 100); // Adjust typing speed
    
    return () => clearInterval(typingInterval);
  }, [fullText]);
  
  return (
    <div className={`mb-6 ${className}`}>
      <motion.div 
        className="flex items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 relative">
          {displayText}
          {!isTypingComplete && (
            <motion.span
              className="absolute ml-1 h-5 w-1 bg-primary"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </h2>
        
        {isTypingComplete && (
          <motion.div 
            className="ml-3 flex items-center space-x-1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.span
              className="w-2 h-2 rounded-full bg-accent"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, delay: 0.3, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.span
              className="w-2 h-2 rounded-full bg-secondary"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, delay: 0.6, repeat: Infinity, repeatType: "reverse" }}
            />
          </motion.div>
        )}
      </motion.div>
      
      {/* Subtle highlight line */}
      {isTypingComplete && (
        <motion.div 
          className="h-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded mt-1"
          initial={{ width: 0 }}
          animate={{ width: "50%" }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      )}
    </div>
  );
};

export default AdminGreeting; 