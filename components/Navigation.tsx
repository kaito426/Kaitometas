"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    TrendingUp,
    Wallet,
    CheckSquare,
    Settings,
    Target
} from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/metas", label: "Metas", icon: Target },
    { href: "/vendas", label: "Vendas", icon: TrendingUp },
    { href: "/gastos", label: "Gastos", icon: Wallet },
    { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
    { href: "/configuracoes", label: "Ajustes", icon: Settings },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-card/30 backdrop-blur-xl border-r border-white/5 p-6">
                <div className="mb-10 px-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Kaito Vision
                    </h1>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:scale-110 transition-transform")} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-4 z-50">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
