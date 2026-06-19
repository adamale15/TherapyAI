import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get("userType");

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (userType && (userType === "student" || userType === "practitioner")) {
      // Update user metadata in Clerk
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          userType: userType,
        },
      });
    }

    // Redirect to home page with flag to refresh user metadata
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("userTypeSet", "true");
    if (userType) {
      redirectUrl.searchParams.set("userType", userType);
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error setting user type:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
