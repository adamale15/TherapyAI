import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/client";
import { UserData, AuthService } from "./auth-interface";

export class SupabaseAuthService implements AuthService {
  // Hash password using SHA-256
  private hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  // Create user
  async createUser(
    email: string,
    password: string,
    userType: "student" | "practitioner",
    rememberMe: boolean = false
  ): Promise<UserData> {
    try {
      const passwordHash = this.hashPassword(password);
      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from("users")
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          user_type: userType,
          last_login: now,
          is_active: true,
          remember_me: rememberMe,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation (email already exists)
          throw new Error("Email already registered");
        }
        throw error;
      }

      const userData: UserData = {
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        userType: data.user_type as "student" | "practitioner",
        createdAt: new Date(data.created_at).getTime(),
        lastLogin: new Date(data.last_login || data.created_at).getTime(),
        isActive: data.is_active,
        rememberMe: data.remember_me,
      };

      console.log(`User created successfully: ${email} (${userType})`);
      return userData;
    } catch (error: any) {
      console.error("Error creating user:", error);
      throw new Error(error.message || "Failed to create user account");
    }
  }

  // Authenticate user
  async authenticateUser(
    email: string,
    password: string
  ): Promise<UserData | null> {
    try {
      const passwordHash = this.hashPassword(password);

      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        console.log(`Authentication failed for: ${email}`);
        return null;
      }

      if (data.password_hash !== passwordHash) {
        console.log(`Authentication failed for: ${email} (wrong password)`);
        return null;
      }

      // Update last login
      await supabaseAdmin
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);

      const userData: UserData = {
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        userType: data.user_type as "student" | "practitioner",
        createdAt: new Date(data.created_at).getTime(),
        lastLogin: new Date().getTime(),
        isActive: data.is_active,
        rememberMe: data.remember_me,
      };

      console.log(`User authenticated successfully: ${email}`);
      return userData;
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw new Error("Authentication failed");
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        userType: data.user_type as "student" | "practitioner",
        createdAt: new Date(data.created_at).getTime(),
        lastLogin: new Date(data.last_login || data.created_at).getTime(),
        isActive: data.is_active,
        rememberMe: data.remember_me,
      };
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  // Update user
  async updateUser(
    userId: string,
    updates: Partial<UserData>
  ): Promise<UserData | null> {
    try {
      const updateData: any = {};

      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.userType !== undefined) updateData.user_type = updates.userType;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.rememberMe !== undefined) updateData.remember_me = updates.rememberMe;
      if (updates.passwordHash !== undefined) updateData.password_hash = updates.passwordHash;

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        userType: data.user_type as "student" | "practitioner",
        createdAt: new Date(data.created_at).getTime(),
        lastLogin: new Date(data.last_login || data.created_at).getTime(),
        isActive: data.is_active,
        rememberMe: data.remember_me,
      };
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

  // Get all users
  async getAllUsers(): Promise<UserData[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("is_active", true);

      if (error || !data) {
        return [];
      }

      return data.map((user) => ({
        id: user.id,
        email: user.email,
        passwordHash: user.password_hash,
        userType: user.user_type as "student" | "practitioner",
        createdAt: new Date(user.created_at).getTime(),
        lastLogin: new Date(user.last_login || user.created_at).getTime(),
        isActive: user.is_active,
        rememberMe: user.remember_me,
      }));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (error) throw error;
      console.log("Supabase connection successful");
      return true;
    } catch (error) {
      console.error("Supabase connection failed:", error);
      return false;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();

