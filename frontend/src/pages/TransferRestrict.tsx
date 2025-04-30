import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ContractOptions from "@/lib/contract";
import { parseUnits } from "viem";
import { toast } from "sonner";

export function TransferRestrict() {
    const [userAddress, setUserAddress] = useState("");
    const [limitAmount, setLimitAmount] = useState("");

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

        if (!userAddress) {
            toast.error("User address is required");
            return;
        }

        if (!userAddress.startsWith("0x") || userAddress.length !== 42) {
            toast.error("Invalid Ethereum address format");
            return;
        }

        if (!limitAmount) {
            toast.error("Limit amount is required");
            return;
        }

        try {
            const parsedAmount = parseUnits(limitAmount, 18);

            await writeContractAsync({
                ...ContractOptions,
                functionName: 'setDailyTransferLimit',
                args: [userAddress, parsedAmount],
            });
        } catch (err: unknown) {
            console.error("Error setting transfer limit:", err);
            toast.error("An error occurred while setting the transfer limit");
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
                        <div className="space-y-2">
                            <label htmlFor="userAddress" className="text-sm font-medium">
                                User Address
                            </label>
                            <input
                                id="userAddress"
                                type="text"
                                className="w-full p-2 border rounded-md"
                                placeholder="0x..."
                                value={userAddress}
                                onChange={(e) => setUserAddress(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Address to set the limit for</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="limitAmount" className="text-sm font-medium">
                                Daily Transfer Limit
                            </label>
                            <input
                                id="limitAmount"
                                type="text"
                                className="w-full p-2 border rounded-md"
                                placeholder="0.0"
                                value={limitAmount}
                                onChange={(e) => setLimitAmount(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Maximum amount the user can transfer per day</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending || isConfirming}
                        >
                            {isPending || isConfirming
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