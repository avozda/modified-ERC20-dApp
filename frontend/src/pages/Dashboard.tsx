import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import ContractOptions from "@/lib/contract";
import { PageLoader } from "@/components/ui/overlay/PageLoader";
import { UnknownError } from "@/components/ui/overlay/UnknownError";
import { TransferCard } from "@/components/ui/TransferCard";


export function Dashboard() {
    const { walletAddress } = useAuth();

    // Format wallet address to show abbreviated form
    const formattedAddress = walletAddress
        ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
        : '';

    const { data: balance, error, isLoading, refetch } = useReadContract({
        ...ContractOptions,
        functionName: 'balanceOf',
        args: walletAddress ? [walletAddress] : undefined,
        query: {
            enabled: !!walletAddress
        }
    });

    // Format the balance with 18 decimals (standard for ERC20)
    const formattedBalance = balance
        ? formatUnits(balance as bigint, 18)
        : '0';

    // Show loader when data is loading
    if (isLoading) {
        return <PageLoader message="Loading account data..." />;
    }

    // Show error state if there's an issue fetching data
    if (error) {
        return (
            <UnknownError
                title="Failed to load data"
                message={error.message || "Could not fetch your account information. Please try again."}
                onRetry={() => refetch()}
            />
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Information */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Wallet Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="space-y-1">
                                <p className="font-medium">Connected Address</p>
                                <p className="font-mono text-sm text-muted-foreground">{formattedAddress}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Token Balance */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Token Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">BDA25 Tokens</p>
                                <p className="text-3xl font-bold">{formattedBalance}</p>
                            </div>

                        </div>
                        <Separator className="my-4" />
                    </CardContent>
                </Card>
            </div>

            {/* Transfer Component */}
            <TransferCard />
        </div>
    );
}