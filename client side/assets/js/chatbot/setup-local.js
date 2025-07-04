/**
 * TYPNI Chatbot Local Setup
 * This file helps with local testing of the chatbot
 * DO NOT USE IN PRODUCTION - DO NOT COMMIT TO VERSION CONTROL
 */

// Mock Supabase for local testing
window.supabase = {
  auth: {
    user: function() {
      return { id: 'test-user-id' };
    }
  },
  from: function(table) {
    return {
      insert: function(data) {
        console.log(`Mock insert into ${table}:`, data);
        return { data: data, error: null };
      }
    };
  }
};

// Log when chatbot actions occur
(function() {
  // Override console methods for chatbot debugging
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  console.log = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('chatbot')) {
      args[0] = `%c${args[0]}`;
      args.splice(1, 0, 'color: #bf3654; font-weight: bold;');
    }
    originalConsoleLog.apply(console, args);
  };
  
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('chatbot')) {
      args[0] = `%c${args[0]}`;
      args.splice(1, 0, 'color: #ff0000; font-weight: bold;');
    }
    originalConsoleError.apply(console, args);
  };
  
  // Log when chat is saved
  const originalSaveChatToSupabase = window.saveChatToSupabase;
  if (originalSaveChatToSupabase) {
    window.saveChatToSupabase = function(message, response) {
      console.log('Chatbot: Saving chat to Supabase', { message, response });
      return originalSaveChatToSupabase(message, response);
    };
  }
  
  console.log('Chatbot: Local testing setup initialized');
})(); 