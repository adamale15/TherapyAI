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
    const { email, password, userType, rememberMe } = await request.json();

    // Validate input
    if (!email || !password || !userType) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, and user type are required",
        },
        { status: 400 }
      );
    }

    if (!["student", "practitioner"].includes(userType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user type. Must be student or practitioner",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await authService.authenticateUser(email, password);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists with this email",
        },
        { status: 409 }
      );
    }

    // Create new user
    const userData = await authService.createUser(
      email,
      password,
      userType,
      rememberMe
    );

    // Return user data (without password hash)
    const { passwordHash, ...safeUserData } = userData;

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: safeUserData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during registration",
      },
      { status: 500 }
    );
  }
}

