import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginData, password) => {
    const userData = await mockApi.login(loginData, password);
    const userWithRole = { 
      ...userData, 
      role: userData.role || (userData.name === 'Администратор' ? 'ADMIN' : 'USER') 
    };
    setUser(userWithRole);
    localStorage.setItem('currentUser', JSON.stringify(userWithRole));
    return userWithRole;
  };

  const register = async (userData) => {
    const newUser = await mockApi.register(userData);
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const users = await mockApi.getUsers();
      const updatedUser = users.find(u => u.id === user.id);
      if (updatedUser) {
        const { password: _, ...userWithoutPassword } = updatedUser;
        const userWithRole = {
          ...userWithoutPassword,
          role: user.role
        };
        setUser(userWithRole);
        localStorage.setItem('currentUser', JSON.stringify(userWithRole));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const updatedUser = await mockApi.updateUser(userId, userData);
      const { password: _, ...userWithoutPassword } = updatedUser;
      const userWithRole = {
        ...userWithoutPassword,
        role: user?.role || updatedUser.role
      };
      setUser(userWithRole);
      localStorage.setItem('currentUser', JSON.stringify(userWithRole));
      return userWithRole;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isUser = () => {
    return user?.role === 'USER';
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    isAdmin,
    isUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
