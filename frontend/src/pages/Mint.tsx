import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ContractOptions from "@/lib/contract";
import { parseUnits } from "viem";
import { toast } from "sonner";

export function Mint() {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Update effect to show success toast when transaction is confirmed
    useEffect(() => {
        if (isSuccess) {
            toast.success("Tokens minted successfully!");
        }
    }, [isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!recipientAddress) {
            toast.error("Recipient address is required");
            return;
        }

        if (!amount) {
            toast.error("Amount is required");
            return;
        }

        try {
            const parsedAmount = parseUnits(amount, 18);

            await writeContractAsync({
                ...ContractOptions,
                functionName: 'mint',
                args: [recipientAddress, parsedAmount],
            });

        } catch (err: unknown) {
            console.error("Minting error:", err);
            toast.error("An error occurred while minting tokens");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Mint Tokens</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Mint BDA25 Tokens</CardTitle>
                    <CardDescription>Enter recipient address and amount to mint tokens</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="recipientAddress" className="text-sm font-medium">
                                Recipient Address
                            </label>
                            <input
                                id="recipientAddress"
                                type="text"
                                className="w-full p-2 border rounded-md"
                                placeholder="0x..."
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="amount" className="text-sm font-medium">
                                Amount
                            </label>
                            <input
                                id="amount"
                                type="text"
                                className="w-full p-2 border rounded-md"
                                placeholder="0.0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <Separator />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending || isConfirming}
                        >
                            {isPending || isConfirming
                                ? "Minting..."
                                : "Mint Tokens"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}