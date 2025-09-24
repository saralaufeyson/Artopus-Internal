// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import type { User, AuthContextType } from '../types/auth'; // Import your types
 // Import your types

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [loading, setLoading] = useState<boolean>(true);

  // Set Axios defaults with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    }
    // setLoading(false); // No need to set here, loadUser will handle it
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post<{ token: string; user: User }>('http://localhost:5000/api/users/login', { email, password });
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) { // Use 'any' for error for now, or define a more specific error type
      console.error('Login failed:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const loadUser = async () => {
    if (token && !user) { // Only load if token exists and user is not set
      try {
        const res = await axios.get<User>('http://localhost:5000/api/users/profile');
        setUser(res.data);
        setIsAuthenticated(true); // Ensure isAuthenticated is true if user data is loaded
      } catch (error) {
        console.error('Failed to load user profile:', error);
        logout(); // Logout if token is invalid or profile fetch fails
      }
    }
    setLoading(false); // Done with initial check and user loading
  };

  useEffect(() => {
    loadUser();
  }, [token]); // Run once on token change/initial load

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};