import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContractOptions from "@/lib/contract";
import { toast } from "sonner";

export function BlockedAddresses() {
    const [addressToBlock, setAddressToBlock] = useState("");
    const [addressToUnblock, setAddressToUnblock] = useState("");

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Show success notification when transaction confirms
    useEffect(() => {
        if (isSuccess) {
            toast.success("Action completed successfully!");
            // Clear form fields after success
            setAddressToBlock("");
            setAddressToUnblock("");
        }
    }, [isSuccess]);

    // Handle block address form submission
    const handleBlockAddress = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!addressToBlock) {
            toast.error("Address is required");
            return;
        }

        if (!addressToBlock.startsWith("0x") || addressToBlock.length !== 42) {
            toast.error("Invalid Ethereum address format");
            return;
        }

        try {
            await writeContractAsync({
                ...ContractOptions,
                functionName: 'blockAddress',
                args: [addressToBlock],
            });
        } catch (err) {
            console.error("Error blocking address:", err);
            toast.error("Failed to block address");
        }
    };

    // Handle unblock address form submission
    const handleUnblockAddress = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!addressToUnblock) {
            toast.error("Address is required");
            return;
        }

        if (!addressToUnblock.startsWith("0x") || addressToUnblock.length !== 42) {
            toast.error("Invalid Ethereum address format");
            return;
        }

        try {
            await writeContractAsync({
                ...ContractOptions,
                functionName: 'unblockAddress',
                args: [addressToUnblock],
            });
        } catch (err) {
            console.error("Error unblocking address:", err);
            toast.error("Failed to unblock address");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Blocked Addresses Management</h2>

            {/* Block Address Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Block Address</CardTitle>
                    <CardDescription>Add an address to the blocked list</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleBlockAddress} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-md"
                                placeholder="0x..."
                                value={addressToBlock}
                                onChange={(e) => setAddressToBlock(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                                disabled={isPending || isConfirming}
                            >
                                {isPending || isConfirming ? "Processing..." : "Block Address"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Unblock Address Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Unblock Address</CardTitle>
                    <CardDescription>Remove an address from the blocked list</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnblockAddress} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-md"
                                placeholder="0x..."
                                value={addressToUnblock}
                                onChange={(e) => setAddressToUnblock(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                disabled={isPending || isConfirming}
                            >
                                {isPending || isConfirming ? "Processing..." : "Unblock Address"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground">
                <p>Note: Only restriction admins can block or unblock addresses.</p>
            </div>
        </div>
    );
}