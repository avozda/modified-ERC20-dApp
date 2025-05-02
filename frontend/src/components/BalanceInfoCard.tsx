import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUnits } from "viem";
import { useWatchContractEvent } from "wagmi";
import ContractOptions from "@/lib/contract";
import { useAuth } from "@/lib/auth";
import { useUserContext } from "@/lib/user-context";

interface BalanceInfoCardProps {
    balance: bigint | null;
    refetch: () => void;
}

export function BalanceInfoCard({ balance, refetch }: BalanceInfoCardProps) {
    const { walletAddress } = useAuth();
    const userData = useUserContext();


    // Watch for TokensMinted events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'TokensMinted',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                const to = log.args.to;

                // If the current wallet is the recipient, update balance
                if (to === walletAddress) {
                    refetch();
                }
            });
        },
    });

    // Watch for TokensTransferred events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'TokensTransferred',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                const from = log.args.from;
                const to = log.args.to;
                // If the current wallet is involved in the transfer, update balance
                if (from === walletAddress || to === walletAddress) {
                    refetch();
                }
            });
        },
    });

    // Format the amounts with 18 decimals
    const formattedBalance = balance
        ? formatUnits(balance as bigint, 18)
        : '0';

    const formattedTransferLimit = userData.transferLimit > 0
        ? formatUnits(userData.transferLimit, 18)
        : '0';

    const formattedTransferredAmount = userData.dailyTransferred
        ? formatUnits(userData.dailyTransferred, 18)
        : '0';

    const formattedRemainingAmount = userData.transferLimit > 0
        ? formatUnits((userData.transferLimit - userData.dailyTransferred), 18)
        : '0';

    return (
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

                {userData.transferLimit > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium">Transfer Limits</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Daily Limit</p>
                                <p className="text-sm font-medium">{formattedTransferLimit}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Already Spent</p>
                                <p className="text-sm font-medium">{formattedTransferredAmount}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Remaining Today</p>
                            <p className="text-sm font-medium">{formattedRemainingAmount}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}