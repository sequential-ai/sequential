import { SignUp } from "@clerk/clerk-react";
import Logo from "@/assets/logo/logo";
import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none blur-[80px]"
        style={{ background: 'var(--primary)' }}
      />

      <div className="mb-5 z-10 flex flex-col items-center gap-1.5">
        <Logo />
        <p className="text-[11px] text-muted-foreground font-mono">Autonomous Deep Research Platform</p>
      </div>

      <div className="z-10 shadow-xl rounded-xl overflow-hidden border border-border">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: 'bg-card shadow-none border-0 p-4',
              headerTitle: 'text-foreground font-bold text-lg',
              headerSubtitle: 'text-muted-foreground text-xs',
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded text-xs h-8',
              formFieldInput: 'rounded-lg bg-muted/40 border-border text-foreground text-xs h-8',
              footerActionLink: 'text-primary hover:underline text-xs',
            }
          }}
        />
      </div>
    </div>
  );
}
