import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/shadcn-space/blocks/dashboard-shell-01/site-header";
import { NavMain } from "@/components/shadcn-space/blocks/dashboard-shell-01/nav-main";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { useAuth } from "@/context/AuthContext";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import {
  Home,
  Sparkles,
  Crosshair,
  Grid2X2,
  Search,
  ScanText,
  MessageSquare,
  Users,
  FlaskConical,
  PlusSquare,
  Settings,
  CreditCard,
  Bell,
  ChevronsUpDown,
  ChevronRight,
  RotateCw,
  Check,
  Plus,
  Monitor,
  Sun,
  Moon,
  BookOpen,
  Mail,
  LogOut,
  KeyRound,
  ListTodo,
  Webhook,
} from "lucide-react";
import { FlaskConicalIcon } from "lucide-react";

export const sidebarSections = [
  {
   
    items: [
    { title: "Overview", icon: Home, href: "/dashboard" },
    { title: "Playground", icon: FlaskConicalIcon, href: "/dashboard/playground/task" },
    ]
  },
  {
    title: "Console",
    items: [
      { title: "Task", icon: ListTodo, href: "/dashboard/tasks" },
      { title: "Monitor", icon: Crosshair, href: "/dashboard/monitor" },
      { title: "Memory", icon: Grid2X2, href: "/dashboard/projects" },
      // { title: "Search", icon: Search, href: "/dashboard/tasks?search=true" },
      // { title: "Extract", icon: ScanText, href: "/dashboard/api-keys" },
      // { title: "Responses", icon: MessageSquare, href: "/dashboard/audit-logs" },
    ],
  },
  {
    title: "Configure",
    items: [
      { title: "API Keys", icon: KeyRound, href: "/dashboard/api-keys" },
      { title: "Webhooks", icon: Webhook, href: "/dashboard/webhooks" },
    ],
  },
  {
    title: "Organization",
    items: [
      { title: "Team Members", icon: Users, href: "/dashboard/team" },
      { title: "Usage", icon: FlaskConical, href: "/dashboard/usage" },
  
      { title: "Settings", icon: Settings, href: "/dashboard/settings" },
      { title: "Billing", icon: CreditCard, href: "/dashboard/billing" },
      { title: "Notifications", icon: Bell, href: "/dashboard/notifications" },
    ],
  },
];

const SequentialAppSidebar = ({ children }) => {
  const { org, credits, refreshProfile, dbUser, memberships, switchOrganization } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isPlayground = location.pathname.startsWith("/dashboard/playground");

  // Create Org state
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Balance display
  const balanceDisplay = credits ? `$${(credits / 160).toFixed(2)}` : "$19.93";

  // User details
  const userName = user?.fullName || (dbUser?.firstName ? `${dbUser?.firstName} ${dbUser?.lastName || ''}`.trim() : "YASH Tupkar");
  const userEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || "yashtupkar6@gmail.com";
  const userImage = user?.imageUrl || dbUser?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
  const orgName = org?.name || "Gmail";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleCreateOrg = (e) => {
    e.preventDefault();
    navigate("/onboard");
  };

  return (
    <SidebarProvider>
      <Sidebar className="py-3 px-0 bg-sidebar border-r border-sidebar-border w-64">
        <div className="flex flex-col h-full bg-sidebar justify-between">
          {/* Top Header & Navigation */}
          <div className="flex flex-col gap-2">
            {/* Header: Brand Logo & Organization Dropdown */}
            <SidebarHeader className="py-1 px-3 space-y-2.5">
              {/* Sequential Brand Logo on Top */}
              <div className="px-1 pt-1 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="font-bold text-base tracking-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    Sequential
                  </span>
                </Link>
              </div>

              {/* Organization Dropdown (Compact, without logo, with default translucent bg) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer group outline-none select-none">
                    <div className="flex flex-col items-start gap-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {orgName}
                      </span>
                      <span className="text-[10px] text-sky-500 dark:text-sky-400 font-medium rounded leading-none">
                        Admin
                      </span>
                    </div>

                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 group-hover:text-foreground transition-colors" />
                  </div>
                </DropdownMenuTrigger>

                {/* Organization Popup matching image */}
                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  className="w-74 p-1.5 rounded-2xl border border-border shadow-xl bg-card text-card-foreground overflow-hidden"
                >
                  {/* Current and other orgs */}
                  {memberships && memberships.length > 0 ? (
                    memberships.map((m) => {
                      const mOrg = m.organization;
                      const isActive = mOrg?.id === org?.id;
                      return (
                        <DropdownMenuItem
                          key={m.id || mOrg?.id}
                          className="p-2.5 rounded-lg flex items-center justify-between cursor-pointer focus:bg-muted/60"
                          onClick={() => {
                            if (mOrg?.id) switchOrganization(mOrg.id);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {mOrg?.name || "Workspace"}
                            </span>
                            <span className="text-xs bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-medium px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/40">
                              {m.role === 'OWNER' || m.role === 'ADMIN' ? 'Admin' : m.role}
                            </span>
                          </div>
                          {isActive && <Check className="h-4 w-4 text-foreground shrink-0 ml-2" />}
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <DropdownMenuItem
                      className="p-2.5 rounded-xl flex items-center justify-between cursor-pointer focus:bg-muted/60"
                      onClick={() => navigate("/dashboard/settings")}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {orgName}
                        </span>
                        <span className="text-xs bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-medium px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/40">
                          Admin
                        </span>
                      </div>
                      <Check className="h-4 w-4 text-foreground shrink-0 ml-2" />
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1 bg-border/80" />

                  {/* Create Organization item */}
                  <DropdownMenuItem
                    onClick={() => navigate("/onboard")}
                    className="p-2.5 rounded-xl flex items-start gap-2.5 cursor-pointer focus:bg-muted/60"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground leading-snug">
                        Create organization
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-snug">
                        Collaborate in a shared workspace
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarHeader>

            {/* Scrollable Navigation */}
            <SidebarContent className="overflow-hidden gap-0 px-0">
              <SimpleBar autoHide={true} className="h-[calc(100vh-270px)] px-3">
                <NavMain sections={sidebarSections} />
              </SimpleBar>
            </SidebarContent>
          </div>

          {/* Bottom Section: Command hint + Balance Card + User Profile Popup */}
          <SidebarFooter className="p-3 pt-6 flex flex-col gap-2.5">
        
            {/* Sleek Mini Credit Card Balance Widget */}
            <Link
              to="/dashboard/billing"
              className="block p-3 rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-primary/10 shadow-2xs hover:border-primary/50 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 " />
                  <span className="text-xs font-semibold text-foreground/90">Balance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="Refresh Balance"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (refreshProfile) refreshProfile();
                    }}
                    className="text-muted-foreground hover:text-foreground transition-transform hover:rotate-180 duration-300"
                  >
                    <RotateCw className="h-3 w-3" />
                  </button>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-bold font-mono tracking-tight text-foreground">
                  {balanceDisplay}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted/60">
                  {Math.round((credits || 3188)).toLocaleString()} cr
                </span>
              </div>
            </Link>

            {/* User Profile Dropdown Popup matching Image */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer outline-none select-none group">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={userImage}
                      alt={userName}
                      className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
                    />
                    <div className="flex flex-col min-w-0 text-left">
                      <p className="text-xs font-bold text-foreground truncate leading-tight">
                        {userName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight font-normal">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-1.5 rounded-lg text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                    title="Account Options"
                  >
                    <Settings className="h-4 w-4" />
                  </div>
                </div>
              </DropdownMenuTrigger>

              {/* User Profile Popup matching Image 2 */}
              <DropdownMenuContent
                align="start"
                side="top"
                sideOffset={10}
                className="w-72 p-2 rounded-2xl border border-border shadow-2xl bg-card text-card-foreground overflow-hidden"
              >
                {/* Header User Profile Info */}
                <div className="flex items-center gap-3 p-2">
                  <img
                    src={userImage}
                    alt={userName}
                    className="w-9 h-9 rounded-lg object-cover border border-border shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {userName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5 font-normal">
                      {userEmail}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5 bg-border/80" />

                {/* Theme Selector Segmented Control */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl">
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Sparkles className="h-4 w-4 text-foreground/80" />
                    <span className="text-xs font-medium">Theme</span>
                  </div>

                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/60">
                    {/* System Theme Button */}
                    <button
                      type="button"
                      title="System Theme"
                      onClick={() => setTheme("system")}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer",
                        theme === "system"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>

                    {/* Light Theme Button */}
                    <button
                      type="button"
                      title="Light Theme"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer",
                        theme === "light"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" />
                    </button>

                    {/* Dark Theme Button */}
                    <button
                      type="button"
                      title="Dark Theme"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer",
                        theme === "dark"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Moon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5 bg-border/80" />

                {/* Settings Item */}
                <DropdownMenuItem
                  asChild
                  className="p-2 rounded-xl flex items-center gap-2.5 cursor-pointer focus:bg-muted/60"
                >
                  <Link to="/dashboard/settings" className="w-full flex items-center gap-2.5">
                    <Settings className="h-4 w-4 text-foreground/80" />
                    <span className="text-xs font-medium text-foreground">Settings</span>
                  </Link>
                </DropdownMenuItem>

                {/* Docs Item */}
                <DropdownMenuItem
                  asChild
                  className="p-2 rounded-xl flex items-center gap-2.5 cursor-pointer focus:bg-muted/60"
                >
                  <a
                    href="https://docs.sequential.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-2.5"
                  >
                    <BookOpen className="h-4 w-4 text-foreground/80" />
                    <span className="text-xs font-medium text-foreground">Docs</span>
                  </a>
                </DropdownMenuItem>

                {/* Contact Us Item */}
                <DropdownMenuItem
                  asChild
                  className="p-2 rounded-xl flex items-center gap-2.5 cursor-pointer focus:bg-muted/60"
                >
                  <a
                    href="mailto:support@sequential.ai"
                    className="w-full flex items-center gap-2.5"
                  >
                    <Mail className="h-4 w-4 text-foreground/80" />
                    <span className="text-xs font-medium text-foreground">Contact us</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-border/80" />

                {/* Sign out */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="p-2 rounded-xl flex items-center gap-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </div>
      </Sidebar>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create New Organization</DialogTitle>
            <DialogDescription className="text-xs">
              Create a shared workspace to collaborate on research pipelines with your team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrg} className="space-y-3.5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-semibold">
                Organization Name
              </Label>
              <Input
                id="org-name"
                placeholder="e.g. Acme Research Labs"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="rounded-lg h-8 text-xs"
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOrgOpen(false)}
                className="rounded text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newOrgName.trim()}
                className="rounded text-xs text-white font-medium shadow-xs"
                style={{ background: "var(--primary)" }}
              >
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Content Inset */}
      <SidebarInset className={cn(
        "flex flex-col min-w-0 w-full",
        isPlayground ? "h-screen max-h-screen overflow-hidden" : "min-h-screen overflow-x-hidden"
      )}>
        {!isPlayground && (
          <header className="sticky top-0 z-50 flex items-center border-b border-border px-4 sm:px-6 py-2.5 bg-background shrink-0">
            <SiteHeader />
          </header>
        )}
        <main className={cn(
          "flex-1 bg-background min-w-0 w-full",
          isPlayground ? "p-0 h-full max-h-full overflow-hidden flex flex-col min-h-0" : "p-4 sm:p-6 overflow-x-hidden"
        )}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SequentialAppSidebar;
