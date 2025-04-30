import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUnits } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import ContractOptions from "@/lib/contract";
import { PageLoader } from "@/components/ui/overlay/PageLoader";
import { UnknownError } from "@/components/ui/overlay/UnknownError";
import { TransferCard } from "@/components/ui/TransferCard";
import { TransferFromCard } from "@/components/ui/TransferFromCard";
import { useUserContext } from "@/lib/user-context";
import { mockIdentityProvider } from "@/lib/identity-provider";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export function Dashboard() {
    const { walletAddress } = useAuth();
    const userData = useUserContext();
    const [verifying, setVerifying] = useState(false);

    // Get address status based on user data
    const getAddressStatus = () => {
        if (userData.isBlocked) {
            return { status: 'Blocked', color: 'text-red-500' };
        } else if (!userData.isVerified) {
            return { status: 'Unverified', color: 'text-yellow-500' };
        } else {
            return { status: 'Verified', color: 'text-green-500' };
        }
    };

    const addressStatus = getAddressStatus();

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

    // Contract write hooks for verification
    const { data: hash, writeContract, isPending } = useWriteContract();

    const { error: waitError } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (waitError) {
            toast.error("Transaction failed to confirm on the blockchain: " + waitError.message);
        }
    }
        , [waitError]);

    // Format the balance with 18 decimals (standard for ERC20)
    const formattedBalance = balance
        ? formatUnits(balance as bigint, 18)
        : '0';

    // Handle verify identity
    const handleVerify = async () => {
        if (!walletAddress) return;

        try {
            setVerifying(true);
            // Get verification details from the identity provider
            const verificationData = await mockIdentityProvider.verifyAddress(walletAddress);

            // Call the smart contract's verifyIdentity function
            writeContract({
                ...ContractOptions,
                functionName: 'verifyIdentity',
                args: [BigInt(verificationData.timestamp), verificationData.signature],
            }, {
                onSuccess: () => {
                    toast.success("Identity verification submitted successfully");
                },
                onError: (error) => {
                    toast.error(`Verification failed: ${error.message}`);
                }
            });
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setVerifying(false);
        }
    };

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
                                <div className="flex items-center mt-2">
                                    <p className="text-sm mr-2">Status:</p>
                                    <p className={`text-sm font-medium ${addressStatus.color}`}>{addressStatus.status}</p>
                                </div>
                                {!userData.isVerified && !userData.isBlocked && (
                                    <Button
                                        className="mt-4"
                                        onClick={handleVerify}
                                        disabled={verifying || isPending}
                                        variant="secondary"
                                    >
                                        {verifying || isPending ? 'Verifying...' : 'Verify Identity'}
                                    </Button>
                                )}
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

            {/* TransferFrom Component */}
            <TransferFromCard />
        </div>
    );
}