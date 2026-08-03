import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationDropdown from "@/components/shadcn-space/blocks/dashboard-shell-01/notification-dropdown";
import { UserButton } from "@clerk/clerk-react";
import { BellRing, Sun, Moon, SearchIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteHeader() {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger className="-ml-1 h-7 w-7 cursor-pointer" />
        <div className="relative hidden sm:block">
          <SearchIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks, docs, API keys…"
            className="pl-8 h-8 w-56 rounded-lg bg-muted/40 border-0 focus-visible:ring-1 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Gradient accent bar strip
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
          style={{
            background: 'var(--seq-orange-soft)',
            color: 'var(--seq-orange)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--seq-orange)' }} />
          3,160 credits
        </div> */}

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 rounded">
          {theme === 'dark'
            ? <Sun className="h-3.5 w-3.5" />
            : <Moon className="h-3.5 w-3.5" />
          }
        </Button>

        {/* Notifications */}
        <NotificationDropdown
          defaultOpen={false}
          align="end"
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded relative">
              <BellRing className="size-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </Button>
          }
        />

        {/* Clerk user button */}
        <UserButton afterSignOutUrl="/login" />
      </div>
    </div>
  );
}
