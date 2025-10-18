
/**
 * Custom hook to get and manage authenticated user data from localStorage.
 * Allows accessing the user, knowing if authenticated, controlling loading state, and logging out.
 *
 * Usage:
 * - Call `useUserData()` in your components to access user data and logout functions.
 * - The `isLoading` state indicates if data is being loaded.
 * - The `logout` function removes session data and tokens.
 */
import { useState, useEffect } from 'react';

interface UserData {
  id: string;
  email: string;
  role?: number;
  person?: string; // id de la persona asociada
  access_token: string;
}

/**
 * Hook useUserData
 * Provides access and management of authenticated user data.
 *
 * @returns Object with state and functions for the authenticated user.
 */
export const useUserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedData = localStorage.getItem('user_data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setUserData(parsed);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const logout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUserData(null);
  };

  return {
    userData,
    isLoading,
    isAuthenticated: !!userData,
    logout
  };
};