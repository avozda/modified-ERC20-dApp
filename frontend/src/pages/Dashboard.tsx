import { useAuth } from "@/lib/auth";
import { useReadContract } from "wagmi";
import ContractOptions from "@/lib/contract";
import { PageLoader } from "@/components/ui/overlay/PageLoader";
import { UnknownError } from "@/components/ui/overlay/UnknownError";
import { TransferCard } from "@/components/TransferCard";
import { TransferFromCard } from "@/components/TransferFromCard";
import { WalletInfoCard } from "@/components/WalletInfoCard";
import { BalanceInfoCard } from "@/components/BalanceInfoCard";

export function Dashboard() {
    const { walletAddress } = useAuth();

    const { data: balance, error, isLoading, refetch } = useReadContract({
        ...ContractOptions,
        functionName: 'balanceOf',
        args: walletAddress ? [walletAddress] : undefined,
        query: {
            enabled: !!walletAddress
        }
    });

    if (isLoading) {
        return <PageLoader message="Loading account data..." />;
    }

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
                <WalletInfoCard />
                <BalanceInfoCard balance={balance as bigint} refetch={refetch} />
            </div>
            <TransferCard />
            <TransferFromCard />
        </div>
    );
}