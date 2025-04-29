import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut, Coins, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "../ui/button";
import { useState } from "react";

export function Sidebar() {
    const { logout, walletAddress } = useAuth();
    const [copied, setCopied] = useState(false);

    // Format wallet address to show abbreviated form
    const shortenedAddress = walletAddress
        ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
        : '';

    // Copy address to clipboard
    const copyToClipboard = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                    <li>
                        <NavLink
                            to="/mint"
                            className={({ isActive }) => cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                                isActive ? "bg-accent text-accent-foreground" : "text-foreground"
                            )}
                            end
                        >
                            <Coins size={18} />
                            <span>Mint Tokens</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="p-4 border-t mt-auto w-full space-y-3">
                {walletAddress && (
                    <Button
                        className="w-full justify-between text-sm font-mono"
                        onClick={copyToClipboard}
                        variant="ghost"
                        size="sm"
                    >
                        <span>{shortenedAddress}</span>
                        <span className="flex items-center">
                            {copied ? (
                                <span className="text-xs text-green-500">Copied!</span>
                            ) : (
                                <Copy size={14} />
                            )}
                        </span>
                    </Button>
                )}

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