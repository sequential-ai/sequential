import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function NavMain({ sections }) {
  const { pathname, search } = useLocation();
  const currentUrl = pathname + search;

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        if (section.isSingle) {
          const item = section.item;
          const Icon = item.icon;
          const isPlaygroundActive = (item.href.startsWith("/dashboard/playground") || item.href === "/dashboard/playground") && pathname.startsWith("/dashboard/playground");
          const isActive = isPlaygroundActive || (pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard"));

          return (
            <div key={item.title || idx} className="space-y-1">
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-all group",
                  isActive
                    ? "text-foreground bg-black/5 dark:bg-white/5 font-medium shadow-2xs"
                    : "text-foreground/85 dark:text-zinc-300 font-light hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors stroke-[1.75]",
                      isActive ? "text-primary" : "text-foreground/70 dark:text-zinc-400 group-hover:text-foreground"
                    )}
                  />
                )}
                <span>{item.title}</span>
              </Link>
            </div>
          );
        }

        return (
          <div key={section.title || idx} className="space-y-1">
            {section.title && (
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs font-semibold text-muted-foreground/80">
                  {section.title}
                </span>
                {section.hasArrow && (
                  <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                )}
              </div>
            )}

            <div className="space-y-0.5">
              {section.items?.map((item) => {
                const Icon = item.icon;
                // Active matching
                const isPlaygroundActive = (item.href.startsWith("/dashboard/playground") || item.href === "/dashboard/playground") && pathname.startsWith("/dashboard/playground");
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : isPlaygroundActive || (pathname === item.href || (item.href.includes('?') && currentUrl === item.href) || (!item.href.includes('?') && pathname.startsWith(item.href) && item.href !== "/dashboard"));

                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-1.5 rounded-lg text-[14px] transition-all group",
                      isActive
                        ? "text-foreground bg-black/5 dark:bg-white/15 font-medium shadow-2xs"
                        : "text-foreground/85 dark:text-zinc-300 font-light hover:text-foreground hover:bg-black/3 dark:hover:bg-white/10"
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors stroke-[1.75]",
                          isActive
                            ? "text-foreground dark:text-white"
                            : "text-foreground/70 dark:text-zinc-400 group-hover:text-foreground"
                        )}
                      />
                    )}
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NavMain;
