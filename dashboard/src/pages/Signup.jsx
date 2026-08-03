import { SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "@/context/ThemeContext";

export default function Signup() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-10 pointer-events-none blur-[90px]"
        style={{ background: 'var(--seq-grad)' }}
      />

    
      <div className="z-10 shadow-xl rounded-xl overflow-hidden border border-border bg-card">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            baseTheme: isDark ? dark : undefined,
            variables: {
              colorPrimary: '#FB631B',
              colorBackground: isDark ? '#121215' : '#FFFFFF',
              colorInputBackground: isDark ? '#18181b' : '#FAF8F5',
              colorInputText: isDark ? '#f4f4f5' : '#17140F',
              colorText: isDark ? '#f4f4f5' : '#17140F',
              colorTextSecondary: isDark ? '#a1a1aa' : '#7C7665',
              colorDanger: '#EF4444',
              borderRadius: '0.5rem',
              fontFamily: 'var(--font-sans, "Inter", sans-serif)',
            },
            elements: {
              card: 'bg-card shadow-none border-0 p-4 sm:p-6',
              headerTitle: 'text-foreground font-bold text-lg',
              headerSubtitle: 'text-muted-foreground text-xs',
              socialButtonsBlockButton: 'border border-border hover:bg-muted/50 text-foreground text-xs font-medium rounded-lg transition-colors h-9',
              socialButtonsBlockButtonText: 'text-foreground font-medium text-xs',
              dividerLine: 'bg-border',
              dividerText: 'text-muted-foreground text-xs uppercase',
              formFieldLabel: 'text-foreground text-xs font-semibold',
              formFieldInput: 'rounded-lg bg-card border border-input focus:border-primary focus:ring-1 focus:ring-primary text-foreground text-xs h-9 transition-colors',
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-9 transition-all shadow-xs',
              footerActionLink: 'text-primary hover:underline text-xs font-medium',
              footerActionText: 'text-muted-foreground text-xs',
              formFieldAction: 'text-primary hover:underline text-xs',
              identityPreviewText: 'text-foreground text-xs font-medium',
              identityPreviewEditButton: 'text-primary hover:underline text-xs',
            }
          }}
        />
      </div>
    </div>
  );
}
