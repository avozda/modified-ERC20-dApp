import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { simulateContract } from "@wagmi/core";
import ContractOptions from "@/lib/contract";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { config } from "../../wagmi.config";

export function TransferRestrict() {
    const [userAddress, setUserAddress] = useState("");
    const [limitAmount, setLimitAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess, error: waitError } = useWaitForTransactionReceipt({
        hash,
    });

    // Show error messages when transaction fails
    useEffect(() => {
        if (waitError) {
            toast.error("Transaction failed to confirm on the blockchain: " + waitError.message);
        }
    }, [waitError]);

    // Show success notification when transaction confirms
    useEffect(() => {
        if (isSuccess) {
            toast.success("Transfer limit set successfully!");
            // Clear form fields after success
            setUserAddress("");
            setLimitAmount("");
        }
    }, [isSuccess]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!userAddress) {
            toast.error("User address is required");
            setLoading(false);
            return;
        }

        if (!userAddress.startsWith("0x") || userAddress.length !== 42) {
            toast.error("Invalid Ethereum address format");
            setLoading(false);
            return;
        }

        if (!limitAmount) {
            toast.error("Limit amount is required");
            setLoading(false);
            return;
        }

        try {
            const parsedAmount = parseUnits(limitAmount, 18);

            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'setDailyTransferLimit',
                args: [userAddress, parsedAmount],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error setting transfer limit:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "An error occurred while setting the transfer limit");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Set Daily Transfer Limits</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Set User Transfer Limit</CardTitle>
                    <CardDescription>Configure daily transfer limits for users</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="userAddress">User Address</Label>
                            <Input
                                id="userAddress"
                                placeholder="0x..."
                                value={userAddress}
                                onChange={(e) => setUserAddress(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Address to set the limit for</p>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="limitAmount">Daily Transfer Limit</Label>
                            <Input
                                id="limitAmount"
                                placeholder="0.0"
                                value={limitAmount}
                                onChange={(e) => setLimitAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Maximum amount the user can transfer per day</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || isPending || isConfirming}
                        >
                            {loading || isPending || isConfirming
                                ? "Setting limit..."
                                : "Set Transfer Limit"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground">
                <p>Note: Only restriction admins can set transfer limits.</p>
                <p className="mt-2">Setting a limit of 0 means there is no limit for the user.</p>
            </div>
        </div>
    );
}