import React from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, KeyRound, Zap } from "lucide-react";

const NOTIFICATIONS = [
  {
    textColor: "text-primary",
    bgColor: "bg-primary/10",
    icon: Sparkles,
    title: "Task Completed",
    desc: "tsk_9f83a1b2 finished with 18 citations",
    time: "10m ago",
    link: "/dashboard/tasks/tsk_9f83a1b2",
  },
  {
    textColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    icon: KeyRound,
    title: "New API Key Created",
    desc: "Production Worker Key generated",
    time: "45m ago",
    link: "/dashboard/api-keys",
  },
  {
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    icon: Zap,
    title: "Credits Refilled",
    desc: "10,000 monthly credits granted",
    time: "1d ago",
    link: "/dashboard/billing",
  },
];

const NotificationDropdown = ({
  trigger,
  defaultOpen,
  align = "end",
}) => {
  return (
    <div className="flex items-center justify-center">
      <DropdownMenu defaultOpen={defaultOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className="p-0 w-72 rounded-xl border border-border shadow-2xl bg-card text-card-foreground overflow-hidden"
        >
          {/* title */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold text-foreground">
                Notifications
              </p>
              <Badge variant="outline" className="font-mono text-[9px] bg-primary/10 text-primary border-primary/20 px-1 py-0">
                3 New
              </Badge>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {/* Notifications */}
          <DropdownMenuGroup className="divide-y divide-border">
            {NOTIFICATIONS.map(({ bgColor, textColor, icon: Icon, title, desc, time, link }) => (
              <DropdownMenuItem key={title} asChild className="p-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                <Link to={link} className="flex items-start gap-2.5 w-full">
                  <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", bgColor, textColor)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-foreground truncate">
                        {title}
                      </p>
                      <span className="text-[9px] text-muted-foreground font-mono">{time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {desc}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          {/* button */}
          <div className="p-1.5 border-t border-border bg-muted/10">
            <Button asChild variant="ghost" className="rounded-lg w-full h-7 text-xs font-medium cursor-pointer hover:text-primary">
              <Link to="/dashboard/notifications">View All Notifications</Link>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationDropdown;
