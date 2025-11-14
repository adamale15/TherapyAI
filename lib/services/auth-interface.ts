// Common interface for all authentication services
export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  userType: "student" | "practitioner";
  createdAt: number;
  lastLogin: number;
  isActive: boolean;
  rememberMe: boolean;
}

export interface AuthService {
  createUser(
    email: string,
    password: string,
    userType: "student" | "practitioner",
    rememberMe?: boolean
  ): Promise<UserData>;

  authenticateUser(email: string, password: string): Promise<UserData | null>;

  getUserById(userId: string): Promise<UserData | null>;

  updateUser(
    userId: string,
    updates: Partial<UserData>
  ): Promise<UserData | null>;

  deactivateUser(userId: string): Promise<boolean>;

  getAllUsers(): Promise<UserData[]>;

  testConnection(): Promise<boolean>;
}

