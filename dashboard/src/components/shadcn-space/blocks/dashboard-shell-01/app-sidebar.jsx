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
  Building2,
  Loader2,
  X,
  UserPlus,
} from "lucide-react";
import { FlaskConicalIcon } from "lucide-react";
import { LucideGitGraph } from "lucide-react";
import { ChartNoAxesColumn } from "lucide-react";
import { ChartNoAxesCombined } from "lucide-react";
import { Database } from "lucide-react";

// Deterministic multi-color gradients for organization avatars (Linear/Vercel style)
const ORG_GRADIENTS = [
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-rose-500 via-pink-500 to-purple-600",
  "from-fuchsia-500 via-pink-500 to-rose-500",
  "from-indigo-500 via-blue-600 to-cyan-500",
  "from-teal-400 via-emerald-500 to-green-600",
  "from-orange-500 via-rose-500 to-red-600",
  "from-violet-600 via-indigo-600 to-blue-700",
];

const getOrgGradient = (name = "") => {
  if (!name) return ORG_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ORG_GRADIENTS.length;
  return ORG_GRADIENTS[index];
};

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
  const {
    org,
    credits,
    refreshProfile,
    dbUser,
    memberships,
    switchOrganization,
    isSwitchingOrg,
    pendingInvites,
    acceptInvite,
    declineInvite,
  } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isPlayground = location.pathname.startsWith("/dashboard/playground");

  // Switching organization loading state
  const [switchingOrgId, setSwitchingOrgId] = useState(null);

  // Invite action loading states
  const [actioningInviteId, setActioningInviteId] = useState(null);

  // Balance display
  const balanceDisplay = credits ? `$${(credits / 160).toFixed(2)}` : "$0.00";

  // User details
  const userName = user?.fullName || (dbUser?.firstName ? `${dbUser?.firstName} ${dbUser?.lastName || ''}`.trim() : "User");
  const userEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || "";
  const userImage = user?.imageUrl || dbUser?.imageUrl || "";
  const orgName = org?.name || "Workspace";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAcceptInvite = async (e, inviteId) => {
    e.stopPropagation();
    try {
      setActioningInviteId(inviteId);
      const res = await acceptInvite(inviteId);
      if (res?.membership?.organizationId) {
        await switchOrganization(res.membership.organizationId);
      }
    } catch (err) {
      console.error("Failed to accept invite:", err);
    } finally {
      setActioningInviteId(null);
    }
  };

  const handleDeclineInvite = async (e, inviteId) => {
    e.stopPropagation();
    try {
      setActioningInviteId(inviteId);
      await declineInvite(inviteId);
    } catch (err) {
      console.error("Failed to decline invite:", err);
    } finally {
      setActioningInviteId(null);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="py-3 px-0 bg-sidebar border-r border-sidebar-border w-64">
        <div className="flex flex-col h-full bg-sidebar justify-between">
          {/* Top Header & Navigation */}
          <div className="flex flex-col gap-2">
            {/* Header: Brand Logo & Organization Dropdown */}
            <SidebarHeader className="py-2 px-3">
              {/* Organization Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="
                      group relative flex w-full items-center gap-2.5
                      rounded-lg border border-sidebar-border/70
                      bg-sidebar-accent hover:bg-sidebar-accent/70
                      px-2.5 py-2
                      text-left outline-none
                      transition-all duration-150
                      hover:border-sidebar-border
                      data-[state=open]:bg-sidebar-accent/70
                      data-[state=open]:border-sidebar-border
                    "
                  >
                    {/* Organization gradient avatar */}
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[12px] font-semibold shadow-xs border border-white/15 transition-transform group-hover:scale-105",
                        getOrgGradient(orgName)
                      )}
                    >
                      {orgName?.charAt(0)?.toUpperCase() || "S"}
                    </div>

                    {/* Organization information */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold leading-tight text-sidebar-foreground">
                        {orgName}
                      </div>

                      {isSwitchingOrg ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium leading-none text-muted-foreground animate-pulse">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          <span>Switching...</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground leading-none">
                          <span className="capitalize">
                            {memberships?.find(m => m.organization?.id === org?.id)?.role?.toLowerCase() || "Admin"}
                          </span>
                          <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/40" />
                          <span>Workspace</span>
                        </div>
                      )}
                    </div>

                    {/* Pending Invites notification pill */}
                    {pendingInvites && pendingInvites.length > 0 && !isSwitchingOrg && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs">
                        {pendingInvites.length}
                      </span>
                    )}

                    {isSwitchingOrg ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <ChevronsUpDown
                        className="
                          h-3.5 w-3.5 shrink-0
                          text-muted-foreground/60
                          transition-colors
                          group-hover:text-foreground/80
                        "
                      />
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  className="
                    w-[300px]
                    rounded-xl
                    border border-border/80
                    bg-popover
                    p-1.5
                    text-popover-foreground
                    shadow-xl
                  "
                >
                  {/* Header Label */}
                  <div className="px-2.5 pb-1.5 pt-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Workspaces
                    </span>
                    <span className="text-[10px] text-muted-foreground/80">
                      {memberships?.length || 1} active
                    </span>
                  </div>

                  {/* Organizations list */}
                  <div className="space-y-0.5">
                    {memberships && memberships.length > 0 ? (
                      memberships.map((m) => {
                        const mOrg = m.organization;
                        const currentOrgName = mOrg?.name || "Workspace";
                        const isActive = mOrg?.id === org?.id;
                        const isThisItemSwitching = switchingOrgId === mOrg?.id || (isSwitchingOrg && isActive);

                        const role =
                          m.role === "OWNER" || m.role === "ADMIN"
                            ? "Admin"
                            : m.role;

                        return (
                          <DropdownMenuItem
                            key={m.id || mOrg?.id}
                            disabled={isSwitchingOrg}
                            onClick={async () => {
                              if (mOrg?.id && !isActive && !isSwitchingOrg) {
                                try {
                                  setSwitchingOrgId(mOrg.id);
                                  await switchOrganization(mOrg.id);
                                } finally {
                                  setSwitchingOrgId(null);
                                }
                              }
                            }}
                            className={cn(
                              "group/item flex h-[52px] cursor-pointer items-center gap-2.5 rounded-lg px-2.5 outline-none hover:bg-muted/70 focus:bg-muted/70 transition-colors",
                              isActive && "bg-muted/40",
                              isSwitchingOrg && !isThisItemSwitching && "opacity-50 pointer-events-none"
                            )}
                          >
                            {/* Organization deterministic gradient avatar */}
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[12px] font-semibold shadow-xs border border-white/10 transition-transform group-hover/item:scale-105",
                                getOrgGradient(currentOrgName)
                              )}
                            >
                              {currentOrgName.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium text-foreground">
                                {currentOrgName}
                              </div>

                              <div className="mt-0.5 text-[11px] text-muted-foreground capitalize">
                                {role?.toLowerCase()}
                              </div>
                            </div>

                            {/* Subtle checkmark or switching loader */}
                            {isThisItemSwitching ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                            ) : isActive ? (
                              <Check className="h-4 w-4 shrink-0 text-foreground" />
                            ) : null}
                          </DropdownMenuItem>
                        );
                      })
                    ) : (
                      <DropdownMenuItem
                        onClick={() => navigate("/dashboard/settings")}
                        className="flex h-[52px] cursor-pointer items-center gap-2.5 rounded-lg px-2.5 hover:bg-muted/70 focus:bg-muted/70 transition-colors"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[12px] font-semibold shadow-xs border border-white/10",
                            getOrgGradient(orgName)
                          )}
                        >
                          {orgName?.charAt(0)?.toUpperCase() || "S"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-foreground">
                            {orgName}
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            Admin
                          </div>
                        </div>

                        <Check className="h-4 w-4 shrink-0 text-foreground" />
                      </DropdownMenuItem>
                    )}
                  </div>

                  {/* Invited Workspaces Section */}
                  {pendingInvites && pendingInvites.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-1.5 bg-border/60" />
                      <div className="px-2.5 pb-1 pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Invited Workspaces
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {pendingInvites.length} pending
                        </span>
                      </div>

                      <div className="space-y-1.5 my-1">
                        {pendingInvites.map((inv) => {
                          const invName = inv.organization?.name || "Workspace";
                          return (
                            <div
                              key={inv.id}
                              className="group/inv flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/40 p-2.5 transition-colors hover:bg-muted/60"
                            >
                              {/* Top Row: Avatar + Name & Role */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white shadow-xs border border-white/10",
                                    getOrgGradient(invName)
                                  )}
                                >
                                  {invName.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium text-foreground">
                                    {invName}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate capitalize">
                                    {inv.role?.toLowerCase() || 'member'}{inv.inviter?.firstName ? ` · by ${inv.inviter.firstName}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Row: Accept & Decline Actions */}
                              <div className="flex items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  disabled={actioningInviteId === inv.id}
                                  onClick={(e) => handleAcceptInvite(e, inv.id)}
                                  className=" flex py-1 px-3 items-center justify-center gap-1.5 rounded bg-green-600 cursor-pointer hover:bg-primary/90 text-white text-[11px] font-medium transition-colors disabled:opacity-50 shadow-xs"
                                >
                                  {actioningInviteId === inv.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                    
                                      Accept
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={actioningInviteId === inv.id}
                                  onClick={(e) => handleDeclineInvite(e, inv.id)}
                                  className="flex h-7 items-center cursor-pointer justify-center rounded border border-border/80 bg-background/80 hover:bg-background text-muted-foreground hover:text-destructive px-2.5 text-[11px] font-medium transition-colors disabled:opacity-50 shadow-2xs"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-1.5 bg-border/60" />

                  {/* Create organization */}
                  <DropdownMenuItem
                    onClick={() => navigate("/onboard")}
                    className="
                      group/create
                      flex h-10 cursor-pointer items-center gap-2.5
                      rounded-lg px-2.5
                      hover:bg-muted/80 focus:bg-muted/80 transition-colors
                    "
                  >
                    <div
                      className="
                        flex h-6 w-6 shrink-0 items-center justify-center
                        rounded-md border border-dashed border-border
                        bg-background text-muted-foreground
                        transition-colors
                        group-hover/create:border-foreground/40
                        group-hover/create:text-foreground
                      "
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground">
                        Create organization
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
