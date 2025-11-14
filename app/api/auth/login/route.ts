import { NextRequest, NextResponse } from "next/server";
import { supabaseAuthService } from "@/lib/services/supabase-auth";
import { fallbackAuthService } from "@/lib/services/fallback-auth";
import { AuthService } from "@/lib/services/auth-interface";

// Use Supabase service, fallback to memory storage if not available
let authService: AuthService = supabaseAuthService;

// Test Supabase connection and fallback to memory storage if needed
async function initializeAuthService() {
  try {
    const isConnected = await supabaseAuthService.testConnection();
    if (!isConnected) {
      console.log("Supabase not available, using fallback authentication service");
      authService = fallbackAuthService;
    }
  } catch (error) {
    console.log("Supabase connection failed, using fallback authentication service");
    authService = fallbackAuthService;
  }
}

// Initialize auth service
initializeAuthService();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Authenticate user
    const userData = await authService.authenticateUser(email, password);

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Return user data (without password hash)
    const { passwordHash, ...safeUserData } = userData;

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: safeUserData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during login",
      },
      { status: 500 }
    );
  }
}

