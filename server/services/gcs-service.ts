import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import { UserData, AuthService } from "./auth-interface";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "ivory-voyage-473503-d7",
  keyFilename: "./gcp-credentials.json",
});

const bucketName = process.env.GCS_BUCKET_NAME || "therapy_ai";
const loginFolder = process.env.GCS_LOGIN_FOLDER || "login";

// GCS Service class
export class GCSService implements AuthService {
  private bucket = storage.bucket(bucketName);

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

  // Get user file path in GCS
  private getUserFilePath(userId: string): string {
    return `${loginFolder}/users/${userId}.json`;
  }

  // Store user credentials in GCS
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

      const filePath = this.getUserFilePath(userId);
      const file = this.bucket.file(filePath);

      // Upload user data to GCS
      await file.save(JSON.stringify(userData, null, 2), {
        metadata: {
          contentType: "application/json",
          cacheControl: "no-cache",
        },
      });

      console.log(`User created successfully: ${email} (${userType})`);
      return userData;
    } catch (error) {
      console.error("Error creating user in GCS:", error);
      throw new Error("Failed to create user account");
    }
  }

  // Authenticate user
  async authenticateUser(
    email: string,
    password: string
  ): Promise<UserData | null> {
    try {
      // First, we need to find the user by email
      // Since GCS doesn't support querying by content, we'll use a different approach
      const [files] = await this.bucket.getFiles({
        prefix: `${loginFolder}/users/`,
      });

      for (const file of files) {
        try {
          const [fileContent] = await file.download();
          const userData: UserData = JSON.parse(fileContent.toString());

          if (
            userData.email === email.toLowerCase().trim() &&
            userData.isActive
          ) {
            const passwordHash = this.hashPassword(password);

            if (userData.passwordHash === passwordHash) {
              // Update last login time
              userData.lastLogin = Date.now();
              await file.save(JSON.stringify(userData, null, 2), {
                metadata: {
                  contentType: "application/json",
                  cacheControl: "no-cache",
                },
              });

              console.log(`User authenticated successfully: ${email}`);
              return userData;
            }
          }
        } catch (fileError) {
          console.error("Error reading user file:", fileError);
          continue;
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
      const filePath = this.getUserFilePath(userId);
      const file = this.bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const [fileContent] = await file.download();
      const userData: UserData = JSON.parse(fileContent.toString());

      return userData.isActive ? userData : null;
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
      const userData = await this.getUserById(userId);
      if (!userData) {
        return null;
      }

      const updatedUserData = { ...userData, ...updates };
      const filePath = this.getUserFilePath(userId);
      const file = this.bucket.file(filePath);

      await file.save(JSON.stringify(updatedUserData, null, 2), {
        metadata: {
          contentType: "application/json",
          cacheControl: "no-cache",
        },
      });

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
      const [files] = await this.bucket.getFiles({
        prefix: `${loginFolder}/users/`,
      });

      const users: UserData[] = [];

      for (const file of files) {
        try {
          const [fileContent] = await file.download();
          const userData: UserData = JSON.parse(fileContent.toString());
          if (userData.isActive) {
            users.push(userData);
          }
        } catch (fileError) {
          console.error("Error reading user file:", fileError);
          continue;
        }
      }

      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // Test GCS connection
  async testConnection(): Promise<boolean> {
    try {
      const [bucket] = await this.bucket.get();
      console.log(`GCS connection successful. Bucket: ${bucket.name}`);
      return true;
    } catch (error) {
      console.error("GCS connection failed:", error);
      return false;
    }
  }
}

export const gcsService = new GCSService();
