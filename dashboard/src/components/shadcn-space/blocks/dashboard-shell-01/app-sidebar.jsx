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
import { LucideGitGraph } from "lucide-react";
import { ChartNoAxesColumn } from "lucide-react";
import { ChartNoAxesCombined } from "lucide-react";
import { Database } from "lucide-react";

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
      { title: "Memory", icon: Database, href: "/dashboard/projects" },
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
      { title: "Usage", icon: ChartNoAxesCombined, href: "/dashboard/usage" },
  
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
              {/* <div className="px-1 pt-1 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="font-bold text-base tracking-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    Sequential
                  </span>
                </Link>
              </div> */}

              {/* Organization Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="
                      group flex w-full items-center gap-2.5
                      rounded-lg border border-transparent
                      bg-black/[0.035] dark:bg-white/[0.05]
                      px-2.5 py-2
                      text-left outline-none
                      transition-all duration-150
                      hover:bg-black/[0.06] dark:hover:bg-white/[0.08]
                      data-[state=open]:bg-black/[0.06]
                      dark:data-[state=open]:bg-white/[0.08]
                    "
                  >
                    {/* Organization avatar */}
                    <div
                      className="
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-md bg-primary
                        text-[12px] font-semibold text-white
                        shadow-xs
                      "
                    >
                      {orgName?.charAt(0)?.toUpperCase() || "S"}
                    </div>

                    {/* Organization information */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold leading-5 text-foreground">
                        {orgName}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] leading-none text-muted-foreground">
                          Workspace
                        </span>

                        <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />

                        <span className="text-[10px] font-medium leading-none text-primary">
                          Admin
                        </span>
                      </div>
                    </div>

                    <ChevronsUpDown
                      className="
                        h-3.5 w-3.5 shrink-0
                        text-muted-foreground/60
                        transition-colors
                        group-hover:text-foreground/70
                      "
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  className="
                    w-[280px]
                    rounded-xl
                    border border-border
                    bg-popover
                    p-1.5
                    text-popover-foreground
                    shadow-lg
                  "
                >
                  {/* Label */}
                  <div className="px-2.5 pb-1.5 pt-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Workspaces
                    </span>
                  </div>

                  {/* Organizations */}
                  {memberships && memberships.length > 0 ? (
                    memberships.map((m) => {
                      const mOrg = m.organization;
                      const currentOrgName = mOrg?.name || "Workspace";
                      const isActive = mOrg?.id === org?.id;

                      const role =
                        m.role === "OWNER" || m.role === "ADMIN"
                          ? "Admin"
                          : m.role;

                      return (
                        <DropdownMenuItem
                          key={m.id || mOrg?.id}
                          onClick={() => {
                            if (mOrg?.id && !isActive) {
                              switchOrganization(mOrg.id);
                            }
                          }}
                          className="
                            group/item
                            flex cursor-pointer items-center gap-2.5
                            rounded-lg
                            px-2.5 py-2
                            outline-none
                            focus:bg-muted
                          "
                        >
                          {/* Organization avatar */}
                          <div
                            className="
                              flex h-8 w-8 shrink-0 items-center justify-center
                              rounded-md bg-primary
                              text-[11px] font-semibold text-white
                              shadow-xs
                            "
                          >
                            {currentOrgName.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-medium text-foreground">
                              {currentOrgName}
                            </div>

                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {role}
                              </span>

                              {isActive && (
                                <>
                                  <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />

                                  <span className="text-[10px] font-medium text-primary">
                                    Current
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <div
                              className="
                                flex h-5 w-5 shrink-0 items-center justify-center
                                rounded-full bg-primary/10
                              "
                            >
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          )}
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard/settings")}
                      className="
                        flex cursor-pointer items-center gap-2.5
                        rounded-lg px-2.5 py-2
                        focus:bg-muted
                      "
                    >
                      <div
                        className="
                          flex h-8 w-8 shrink-0 items-center justify-center
                          rounded-md bg-primary
                          text-[11px] font-semibold text-white
                          shadow-xs
                        "
                      >
                        {orgName?.charAt(0)?.toUpperCase() || "S"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-foreground">
                          {orgName}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            Admin
                          </span>

                          <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />

                          <span className="text-[10px] font-medium text-primary">
                            Current
                          </span>
                        </div>
                      </div>

                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1 bg-border" />

                  {/* Create organization */}
                  <DropdownMenuItem
                    onClick={() => navigate("/onboard")}
                    className="
                      group/create
                      flex cursor-pointer items-center gap-2.5
                      rounded-lg px-2.5 py-2
                      focus:bg-muted
                    "
                  >
                    <div
                      className="
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-md border border-dashed border-border
                        bg-background
                        transition-colors
                        group-hover/create:border-primary/30
                        group-hover/create:bg-primary/5
                      "
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover/create:text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-foreground">
                        Create organization
                      </div>

                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        Collaborate in a shared workspace
                      </div>
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
