import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    return {
      isOpen: false,
      setIsOpen: () => {},
      unreadCount: 0
    };
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, unreadCount, setUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

