// Fallback authentication service for testing when GCS is not available
import crypto from "crypto";
import { UserData, AuthService } from "./auth-interface";

// In-memory storage for testing
const users: Map<string, UserData> = new Map();

export class FallbackAuthService implements AuthService {
  // Hash password using SHA-256
  private hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  // Generate unique user ID
  private generateUserId(email: string): string {
    return crypto
      .createHash("md5")
      .update(email + Date.now())
      .digest("hex");
  }

  // Store user credentials in memory
  async createUser(
    email: string,
    password: string,
    userType: "student" | "practitioner",
    rememberMe: boolean = false
  ): Promise<UserData> {
    try {
      const userId = this.generateUserId(email);
      const passwordHash = this.hashPassword(password);
      const now = Date.now();

      const userData: UserData = {
        id: userId,
        email: email.toLowerCase().trim(),
        passwordHash,
        userType,
        createdAt: now,
        lastLogin: now,
        isActive: true,
        rememberMe,
      };

      // Store in memory
      users.set(userId, userData);

      console.log(`User created successfully: ${email} (${userType})`);
      return userData;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user account");
    }
  }

  // Authenticate user
  async authenticateUser(
    email: string,
    password: string
  ): Promise<UserData | null> {
    try {
      const passwordHash = this.hashPassword(password);
      const emailToFind = email.toLowerCase().trim();

      // Find user by email
      for (const user of Array.from(users.values())) {
        if (user.email === emailToFind && user.isActive) {
          if (user.passwordHash === passwordHash) {
            // Update last login time
            user.lastLogin = Date.now();
            users.set(user.id, user);

            console.log(`User authenticated successfully: ${email}`);
            return user;
          }
        }
      }

      console.log(`Authentication failed for: ${email}`);
      return null;
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw new Error("Authentication failed");
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      const userData = users.get(userId);
      return userData && userData.isActive ? userData : null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  // Update user data
  async updateUser(
    userId: string,
    updates: Partial<UserData>
  ): Promise<UserData | null> {
    try {
      const userData = users.get(userId);
      if (!userData) {
        return null;
      }

      const updatedUserData = { ...userData, ...updates };
      users.set(userId, updatedUserData);

      console.log(`User updated successfully: ${userData.email}`);
      return updatedUserData;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  // Deactivate user (soft delete)
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      const result = await this.updateUser(userId, { isActive: false });
      return result !== null;
    } catch (error) {
      console.error("Error deactivating user:", error);
      return false;
    }
  }

  // Get all users (for admin purposes)
  async getAllUsers(): Promise<UserData[]> {
    try {
      return Array.from(users.values()).filter((user) => user.isActive);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // Test connection (always returns true for fallback)
  async testConnection(): Promise<boolean> {
    console.log("Using fallback authentication service");
    return true;
  }
}

export const fallbackAuthService = new FallbackAuthService();

