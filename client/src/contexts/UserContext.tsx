import { createContext, useContext, ReactNode, useState } from "react";

interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  cancerType: string;
  cancerStage: string;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
}

const defaultUser: User = {
  id: 1,
  username: "liz",
  displayName: "Liz",
  email: "liz@example.com",
  cancerType: "Breast Cancer",
  cancerStage: "Stage 2"
};

// Create context with default values to avoid undefined checks
const initialContextValue: UserContextType = {
  user: defaultUser,
  setUser: () => {},
  isAuthenticated: true
};

const UserContext = createContext<UserContextType>(initialContextValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const isAuthenticated = true; // Hard-coded for now
  
  const value = {
    user,
    setUser,
    isAuthenticated
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
