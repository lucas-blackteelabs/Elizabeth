import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  cancerType: string | null;
  cancerStage: string | null;
  bio: string | null;
  diagnosis_date: string | null;
  treatmentStatus: string | null;
  treatmentHistory: string | null;
  currentMedications: string | null;
  adverseEventHistory: string | null;
  dietaryPreferences: string | null;
  phoneNumber: string | null;
  address: string | null;
  timezone: string | null;
  oncologist: string | null;
  goals: string | null;
  medicalNotes: string | null;
  scanSummary: string | null;
  nextScanDate: string | null;
  profilePhoto: string | null;
  nanoBananaCreativity: number | null;
  mirrorUserId: number | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  dataUserId: number;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const initialContextValue: UserContextType = {
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  isLoading: true,
  dataUserId: 1,
  login: async () => {},
  register: async () => {},
  logout: async () => {}
};

const UserContext = createContext<UserContextType>(initialContextValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await apiRequest('/api/auth/me', {
          method: 'GET'
        });
        setUser(userData);
      } catch (authError) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const newUser = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST'
      });
      
      setUser(null);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };
  
  const dataUserId = user?.mirrorUserId || user?.id || 1;

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    isLoading,
    dataUserId,
    login,
    register,
    logout
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  return context;
}
