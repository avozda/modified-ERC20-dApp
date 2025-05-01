import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useUserContext } from "@/lib/user-context";
import { useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { mockIdentityProvider } from "@/lib/mock-identity-provider";
import ContractOptions from "@/lib/contract";
import { simulateContract } from "@wagmi/core";
import { config } from "../../wagmi.config";

export function WalletInfoCard() {
    const { walletAddress } = useAuth();
    const userData = useUserContext();
    const [verifying, setVerifying] = useState(false);
    const [verificationExpiry, setVerificationExpiry] = useState<string | null>(null);

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

    // Format wallet address for display
    const formattedAddress = walletAddress
        ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
        : '';


    const { writeContractAsync } = useWriteContract();

    const { data: expirationTime } = useReadContract({
        ...ContractOptions,
        functionName: 'expirationTime',
        query: {
            enabled: !!walletAddress
        }
    });

    const { data: verificationTimestamp } = useReadContract({
        ...ContractOptions,
        functionName: 'verifiedAddresses',
        args: walletAddress ? [walletAddress] : undefined,
        query: {
            enabled: !!walletAddress
        }
    });

    // Calculate and format verification expiry date whenever the timestamp changes
    useEffect(() => {
        if (verificationTimestamp && expirationTime && Number(verificationTimestamp) > 0) {
            const expiryTimestamp = Number(verificationTimestamp) + Number(expirationTime);
            const expiryDate = new Date(expiryTimestamp * 1000);

            // Format the date
            const formattedDate = expiryDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Check if already expired
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (expiryTimestamp < currentTimestamp) {
                setVerificationExpiry("Expired");
            } else {
                setVerificationExpiry(formattedDate);
            }
        } else {
            setVerificationExpiry(null);
        }
    }, [verificationTimestamp, expirationTime]);


    const handleVerify = async () => {
        if (!walletAddress) return;

        try {
            setVerifying(true);
            // Get verification details from the identity provider
            const verificationData = await mockIdentityProvider.verifyAddress(walletAddress);

            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'verificationData',
                args: [BigInt(verificationData.timestamp), verificationData.signature],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Minting error:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message);
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
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
                        {userData.isVerified && verificationExpiry && (
                            <div className="mt-1">
                                <p className="text-sm text-muted-foreground">
                                    Verification expires on: <span className={verificationExpiry === "Expired" ? "text-red-500" : "font-medium"}>{verificationExpiry}</span>
                                </p>
                            </div>
                        )}
                        {!userData.isBlocked && (
                            <Button
                                className="mt-4"
                                onClick={handleVerify}
                                disabled={verifying}
                                variant="secondary"
                            >
                                {verifying ? 'Verifying...' : (userData.isVerified ? "Reverify identity" : 'Verify Identity')}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}