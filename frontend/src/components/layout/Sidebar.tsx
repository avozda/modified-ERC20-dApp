import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "../ui/button";

export function Sidebar() {
    const { logout } = useAuth();

    return (
        <div className="h-svh w-64 border-r bg-background flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">BDA25 dApp</h2>
            </div>

            <nav className="flex-1 p-2">
                <ul className="space-y-1">
                    <li>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) => cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                                isActive ? "bg-accent text-accent-foreground" : "text-foreground"
                            )}
                            end
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="p-4 border-t mt-auto w-full">
                <Button
                    className="w-full"
                    onClick={logout}
                    variant="outline"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    );
}