"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("userType");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-blue-50/80 to-white p-4">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-[420px]",
            card: "bg-white shadow-2xl rounded-2xl border-0",
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-sm text-gray-600",
            socialButtonsBlockButton: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-medium",
            socialButtonsBlockButtonText: "text-gray-700",
            formButtonPrimary: "bg-gray-900 hover:bg-gray-800 text-white rounded-full font-semibold shadow-md",
            formFieldInput: "bg-gray-100 border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400",
            formFieldLabel: "text-gray-700 font-medium",
            footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
            identityPreviewText: "text-gray-900",
            identityPreviewEditButton: "text-gray-600 hover:text-gray-900",
            formResendCodeLink: "text-blue-600 hover:text-blue-700",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-500",
            alertText: "text-gray-700",
            formFieldSuccessText: "text-green-600",
            formFieldErrorText: "text-red-600",
            formFieldOptionalIndicator: "text-gray-400 text-xs",
          },
          variables: {
            colorPrimary: "#111827",
            colorText: "#111827",
            colorTextSecondary: "#6B7280",
            colorBackground: "#FFFFFF",
            colorInputBackground: "#F3F4F6",
            colorInputText: "#111827",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-raleway, system-ui, sans-serif)",
          },
        }}
        afterSignUpUrl={userType ? `/api/auth/set-user-type?userType=${userType}` : "/"}
        routing="path"
        path="/sign-up"
      />
    </div>
  );
}

