import express from "express";
import { gcsService } from "../services/gcs-service";
import { fallbackAuthService } from "../services/fallback-auth";
import { AuthService, UserData } from "../services/auth-interface";

// Use fallback service if GCS is not available
let authService: AuthService = gcsService;

// Test GCS connection and fallback to memory storage if needed
async function initializeAuthService() {
  try {
    const isConnected = await gcsService.testConnection();
    if (!isConnected) {
      console.log("GCS not available, using fallback authentication service");
      authService = fallbackAuthService;
    }
  } catch (error) {
    console.log("GCS connection failed, using fallback authentication service");
    authService = fallbackAuthService;
  }
}

// Initialize auth service
initializeAuthService();

const router = express.Router();

// Register new user
router.post("/register", async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, userType, rememberMe } = req.body;

    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and user type are required",
      });
    }

    if (!["student", "practitioner"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be student or practitioner",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await authService.authenticateUser(email, password);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
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

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: safeUserData,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

// Login user
router.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Authenticate user
    const userData = await authService.authenticateUser(email, password);

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Return user data (without password hash)
    const { passwordHash, ...safeUserData } = userData;

    res.json({
      success: true,
      message: "Login successful",
      user: safeUserData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// Get user by ID
router.get("/user/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    const userData = await authService.getUserById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user data (without password hash)
    const { passwordHash, ...safeUserData } = userData;

    res.json({
      success: true,
      user: safeUserData,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user profile
router.put("/user/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.passwordHash;
    delete updates.id;
    delete updates.createdAt;

    const updatedUser = await authService.updateUser(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return updated user data (without password hash)
    const { passwordHash, ...safeUserData } = updatedUser;

    res.json({
      success: true,
      message: "User updated successfully",
      user: safeUserData,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during update",
    });
  }
});

// Deactivate user account
router.delete("/user/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;

    const success = await authService.deactivateUser(userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deactivated",
      });
    }

    res.json({
      success: true,
      message: "User account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during deactivation",
    });
  }
});

// Test connection
router.get("/test-connection", async (req, res) => {
  try {
    const isConnected = await authService.testConnection();

    res.json({
      success: isConnected,
      message: isConnected
        ? "Authentication service connected"
        : "Authentication service failed",
    });
  } catch (error) {
    console.error("Auth test error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication service test failed",
    });
  }
});

export default router;
