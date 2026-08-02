import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUserRound, CreditCard, ReceiptText, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const PROFILE_ITEMS = [
  { label: "My Profile", icon: CircleUserRound, link: "/dashboard/settings" },
  { label: "My Subscription", icon: CreditCard, link: "/dashboard/billing" },
  { label: "Usage & Invoices", icon: ReceiptText, link: "/dashboard/usage" },
];

const SETTINGS_ITEMS = [
  { label: "Account Settings", icon: Settings, link: "/dashboard/settings" },
];

const itemClass =
  "p-2.5 text-xs font-medium text-foreground cursor-pointer gap-2.5 rounded-xl hover:bg-muted transition-colors";

const UserDropdown = ({
  trigger,
  defaultOpen,
  align = "end"
}) => {
  return (
    <div className="flex items-center justify-center">
      <DropdownMenu defaultOpen={defaultOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="w-64 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-1.5"
        >
          {/* User Info */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-3 px-3 py-2.5">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"
                    alt="Yash Tailor" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">YT</AvatarFallback>
                </Avatar>
                <span
                  className="ring-card absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-foreground text-xs font-semibold truncate">
                  Yash Tailor
                </span>
                <span className="text-muted-foreground text-[11px] truncate font-mono">
                  yashtailor@sequential.ai
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Main Links */}
          <DropdownMenuGroup>
            {PROFILE_ITEMS.map(({ label, icon: Icon, link }) => (
              <DropdownMenuItem key={label} asChild className={itemClass}>
                <Link to={link} className="flex items-center">
                  <Icon size={16} className="text-muted-foreground" />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Settings */}
          <DropdownMenuGroup>
            {SETTINGS_ITEMS.map(({ label, icon: Icon, link }) => (
              <DropdownMenuItem key={label} asChild className={itemClass}>
                <Link to={link} className="flex items-center">
                  <Icon size={16} className="text-muted-foreground" />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem variant="destructive" className={itemClass}>
            <LogOut size={16} />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserDropdown;
