import React from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, Clock } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { API_CATEGORIES } from '../../pages/Playground'

export default function PlaygroundHeader({
    normalizedCategory,
    setActiveView,
    activeView,
    theme,
    toggle,
}) {
    return (
        <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-[#FAF8F5] dark:bg-zinc-950 shrink-0">
            {/* Top API Mode Tabs + Sidebar Trigger */}
            <div className="flex items-center gap-1 sm:gap-2">
                <SidebarTrigger className="-ml-1 h-7 w-7 mr-1 cursor-pointer text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white" />
                {API_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isActive = normalizedCategory === cat.id
                    return (
                        <Link
                            key={cat.id}
                            to={`/dashboard/playground/${cat.id}`}
                            onClick={() => setActiveView('playground')}
                            className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                                ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-900 shadow-xs'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'
                                }`}
                        >
                            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500'}`} />
                            <span>{cat.label}</span>
                            {isActive && (
                                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Right Header Controls: Theme Toggle & History */}
            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggle}
                    className="h-7 w-7 rounded text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                    title="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="h-3.5 w-3.5" />
                    ) : (
                        <Moon className="h-3.5 w-3.5" />
                    )}
                </Button>

                <button
                    type="button"
                    onClick={() => setActiveView(activeView === 'playground' ? 'history' : 'playground')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-mono uppercase transition-all cursor-pointer border ${activeView === 'history'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                >
                    <Clock className="h-3.5 w-3.5" />
                    HISTORY
                </button>
            </div>
        </div>
    )
}
