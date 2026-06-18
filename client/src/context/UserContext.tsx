import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthMe } from '../services/api';

interface User {
  id: number;
  email: string;
  plan: string;
  expireTime: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  isProOrAbove: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const refreshUser = async () => {
    try {
      const response = await getAuthMe();
      if (response.success) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  const isProOrAbove = user?.plan === 'pro' || user?.plan === 'enterprise';

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, isProOrAbove }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
