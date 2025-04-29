import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function Dashboard() {
    const { walletAddress } = useAuth();

    // Format wallet address to show abbreviated form
    const formattedAddress = walletAddress
        ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
        : '';


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
                                <p className="text-3xl font-bold">0</p>
                            </div>

                        </div>
                        <Separator className="my-4" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}