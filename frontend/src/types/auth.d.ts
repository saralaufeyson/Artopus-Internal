// frontend/src/types/auth.d.ts
export interface User {
  firstName: string;
  lastName: string;
  _id: string;
  username: string;
  email: string;
  roles: string[];
  // Add any other user properties your backend returns
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  // You might add a 'loadUser' function here if needed for initial user data fetching
}