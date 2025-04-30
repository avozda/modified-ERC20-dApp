import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut, Coins, Copy, Check, ShieldAlert, Sliders, Key, Vote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "../ui/button";
import { useState } from "react";
import { useUserContext } from "@/lib/user-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


export function Sidebar() {
    const { logout, walletAddress } = useAuth();
    const [copied, setCopied] = useState(false);
    const userData = useUserContext();

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

    // Helper to determine if a route is accessible
    const canAccessRoute = (route: string) => {
        switch (route) {
            case '/mint':
                return userData.isMintingAdmin;
            case '/minting-admin-voting':
                return userData.isMintingAdmin;
            case '/address-management':
            case '/transfer-restrict':
            case '/restriction-admin-voting':
                return userData.isRestrictionAdmin;
            case '/identity-providers':
            case '/idp-admin-voting':
                return userData.isIdpAdmin;
            case '/approval':
                return !userData.isBlocked && userData.isVerified;
            default:
                return true;
        }
    };

    // Helper to get tooltip message for disabled routes
    const getTooltipMessage = (route: string) => {
        switch (route) {
            case '/mint':
            case '/minting-admin-voting':
                return "Requires Minting Admin role";
            case '/address-management':
            case '/transfer-restrict':
            case '/restriction-admin-voting':
                return "Requires Restriction Admin role";
            case '/identity-providers':
            case '/idp-admin-voting':
                return "Requires IDP Admin role";
            case '/approval':
                return "Not available for blocked or unverified addresses";
            default:
                return "";
        }
    };

    // Custom navigation item component
    const NavItem = ({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) => {
        const isAccessible = canAccessRoute(to);

        return (
            <li>
                {isAccessible ? (
                    <NavLink
                        to={to}
                        className={({ isActive }) => cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                            isActive ? "bg-accent text-accent-foreground" : "text-foreground"
                        )}
                        end
                    >
                        {icon}
                        <span>{label}</span>
                    </NavLink>
                ) : (
                    <Tooltip>
                        <TooltipTrigger>

                            <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md cursor-not-allowed opacity-50",
                                "text-foreground"
                            )}>
                                {icon}
                                <span>{label}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{getTooltipMessage(to)}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </li>
        );
    };

    return (
        <div className="h-svh w-64 border-r bg-background flex flex-col sticky left-0 top-0">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">BDA25 dApp</h2>
            </div>

            <nav className="flex-1 p-2">
                <ul className="space-y-1">
                    <NavItem
                        to="/dashboard"
                        label="Dashboard"
                        icon={<LayoutDashboard size={18} />}
                    />
                    <NavItem
                        to="/mint"
                        label="Mint Tokens"
                        icon={<Coins size={18} />}
                    />
                    <NavItem
                        to="/approval"
                        label="Approve Tokens"
                        icon={<Check size={18} />}
                    />
                    <NavItem
                        to="/address-management"
                        label="Address Management"
                        icon={<ShieldAlert size={18} />}
                    />
                    <NavItem
                        to="/transfer-restrict"
                        label="Transfer Limits"
                        icon={<Sliders size={18} />}
                    />

                    <NavItem
                        to="/identity-providers"
                        label="Identity Providers"
                        icon={<Key size={18} />}
                    />
                    <NavItem
                        to="/minting-admin-voting"
                        label="Minting Admin Voting"
                        icon={<Vote size={18} />}
                    />
                    <NavItem
                        to="/idp-admin-voting"
                        label="IDP Admin Voting"
                        icon={<Vote size={18} />}
                    />
                    <NavItem
                        to="/restriction-admin-voting"
                        label="Restriction Admin Voting"
                        icon={<Vote size={18} />}
                    />
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