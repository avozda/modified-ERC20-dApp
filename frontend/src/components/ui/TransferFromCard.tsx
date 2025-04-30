// filepath: /Users/adamvozda/Documents/modified-ERC20-dApp/frontend/src/components/ui/TransferFromCard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ContractOptions from "@/lib/contract";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { useUserContext } from "@/lib/user-context";

export function TransferFromCard() {
    const [fromAddress, setFromAddress] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const userData = useUserContext();

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess, error: waitError } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (waitError) {
            toast.error("Transaction failed to confirm on the blockchain" + waitError.message);
        }
    }, [waitError]);

    // Update effect to show success toast when transaction is confirmed
    useEffect(() => {
        if (isSuccess) {
            toast.success("Tokens transferred successfully!");
        }
    }, [isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAddress) {
            toast.error("From address is required");
            return;
        }

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
                functionName: 'transferFrom',
                args: [fromAddress, recipientAddress, parsedAmount],
            });

        } catch (err: unknown) {
            console.error("TransferFrom error:", err);
            toast.error("An error occurred while transferring tokens");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>TransferFrom BDA25 Tokens</CardTitle>
                <CardDescription>Transfer tokens from an approved address to another address</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="fromAddress" className="text-sm font-medium">
                            From Address
                        </label>
                        <input
                            id="fromAddress"
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder="0x..."
                            value={fromAddress}
                            onChange={(e) => setFromAddress(e.target.value)}
                        />
                    </div>

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
                    {userData.isBlocked || !userData.isVerified ? (
                        <p>
                            You cannot transfer tokens because your address is blocked or not verified.
                        </p>
                    ) : (
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending || isConfirming}
                        >
                            {isPending || isConfirming
                                ? "Transferring..."
                                : "Transfer Tokens"}
                        </Button>
                    )}

                </form>
            </CardContent>
        </Card>
    );
}