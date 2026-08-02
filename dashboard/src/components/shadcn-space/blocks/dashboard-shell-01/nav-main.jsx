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
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");

          return (
            <div key={item.title || idx} className="space-y-1">
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] transition-all group",
                  isActive
                    ? "bg-primary/10 dark:bg-primary/15 text-primary font-normal shadow-2xs"
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
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : (pathname === item.href || (item.href.includes('?') && currentUrl === item.href) || (!item.href.includes('?') && pathname.startsWith(item.href) && item.href !== "/dashboard"));

                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] transition-all group",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/15 text-primary font-normal shadow-2xs"
                        : "text-foreground/85 dark:text-zinc-300 font-light hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors stroke-[1.75]",
                          isActive
                            ? "text-primary"
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
