import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { simulateContract } from "@wagmi/core";
import ContractOptions from "@/lib/contract";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { useUserContext } from "@/lib/user-context";
import { config } from "../../../wagmi.config";

export function TransferFromCard() {
    const [fromAddress, setFromAddress] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const userData = useUserContext();

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess, error: waitError } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (waitError) {
            toast.error("Transaction failed to confirm on the blockchain: " + waitError.message);
        }
    }, [waitError]);

    // Update effect to show success toast when transaction is confirmed
    useEffect(() => {
        if (isSuccess) {
            toast.success("Tokens transferred successfully!");
            // Clear form after successful transfer
            setFromAddress("");
            setRecipientAddress("");
            setAmount("");
        }
    }, [isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!fromAddress) {
            toast.error("From address is required");
            setLoading(false);
            return;
        }

        if (!fromAddress.startsWith("0x") || fromAddress.length !== 42) {
            toast.error("Invalid From address format");
            setLoading(false);
            return;
        }

        if (!recipientAddress) {
            toast.error("Recipient address is required");
            setLoading(false);
            return;
        }

        if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
            toast.error("Invalid Recipient address format");
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
                functionName: 'transferFrom',
                args: [fromAddress, recipientAddress, parsedAmount],
            });

            await writeContractAsync(request);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("TransferFrom error:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "An error occurred while transferring tokens");
            }
        } finally {
            setLoading(false);
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
                            disabled={loading || isPending || isConfirming}
                        >
                            {loading || isPending || isConfirming
                                ? "Transferring..."
                                : "Transfer Tokens"}
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}