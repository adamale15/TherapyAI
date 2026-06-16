import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/Vesh.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 w-full flex justify-center p-4">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-[420px]",
              card: "bg-[#1a1a1a]/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl border border-white/10",
              headerTitle: "text-2xl font-bold text-white",
              headerSubtitle: "text-sm text-gray-400",
              socialButtonsBlockButton:
                "bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-300",
              socialButtonsBlockButtonText: "text-white font-semibold",
              formButtonPrimary:
                "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]",
              formFieldInput:
                "!bg-[#0a0a0a] !border-white/10 !text-white rounded-xl focus:!ring-2 focus:!ring-purple-500/50 focus:!border-purple-500 transition-all duration-300",
              formFieldLabel: "text-gray-300 font-medium",
              footerActionLink: "text-purple-400 hover:text-purple-300 font-bold transition-colors",
              identityPreviewText: "text-white font-medium",
              identityPreviewEditButton: "text-purple-400 hover:text-purple-300",
              formResendCodeLink: "text-purple-400 hover:text-purple-300",
              dividerLine: "bg-white/10",
              dividerText: "text-gray-500 uppercase text-xs tracking-wider",
              alertText: "text-gray-300",
              formFieldSuccessText: "text-green-400",
              formFieldErrorText: "text-red-400",
            },
            variables: {
              colorPrimary: "#8b5cf6",
              colorBackground: "#1a1a1a",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-raleway, system-ui, sans-serif)",
            },
          }}
          fallbackRedirectUrl="/"
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
}
