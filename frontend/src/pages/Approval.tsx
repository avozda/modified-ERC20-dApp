import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { simulateContract } from "@wagmi/core";
import ContractOptions from "@/lib/contract";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { config } from "../../wagmi.config";

export function Approval() {
    const [spenderAddress, setSpenderAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess, error: waitError } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (waitError) {
            toast.error("Transaction failed to confirm on the blockchain: " + waitError.message);
        }
    }, [waitError]);

    useEffect(() => {
        if (isSuccess) {
            toast.success("Approval set successfully!");
            // Clear form fields after success
            setSpenderAddress("");
            setAmount("");
        }
    }, [isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!spenderAddress) {
            toast.error("Spender address is required");
            setLoading(false);
            return;
        }

        if (!spenderAddress.startsWith("0x") || spenderAddress.length !== 42) {
            toast.error("Invalid Ethereum address format");
            setLoading(false);
            return;
        }

        if (!amount) {
            toast.error("Amount is required");
            setLoading(false);
            return;
        }

        try {
            const parsedAmount = parseUnits(amount, 18);

            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'approve',
                args: [spenderAddress, parsedAmount],
            });

            await writeContractAsync(request);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Approval error:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "An error occurred while setting approval");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Approve Token Spending</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Approve BDA25 Tokens</CardTitle>
                    <CardDescription>Allow another address to spend tokens on your behalf</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="spenderAddress">Spender Address</Label>
                            <Input
                                id="spenderAddress"
                                placeholder="0x..."
                                value={spenderAddress}
                                onChange={(e) => setSpenderAddress(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Address that will be allowed to spend your tokens</p>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="amount">Amount to Approve</Label>
                            <Input
                                id="amount"
                                placeholder="0.0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">How many tokens the spender can use on your behalf</p>
                        </div>

                        <Separator />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || isPending || isConfirming}
                        >
                            {loading || isPending || isConfirming
                                ? "Approving..."
                                : "Approve Tokens"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}