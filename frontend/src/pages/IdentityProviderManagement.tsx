import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContractOptions from "@/lib/contract";
import { toast } from "sonner";

export function IdentityProviderManagement() {
    const [providerToAdd, setProviderToAdd] = useState("");
    const [providerToRemove, setProviderToRemove] = useState("");

    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Show success notification when transaction confirms
    useEffect(() => {
        if (isSuccess) {
            toast.success("Action completed successfully!");
            // Clear form fields after success
            setProviderToAdd("");
            setProviderToRemove("");
        }
    }, [isSuccess]);

    const validateAddress = (address: string) => {
        if (!address) {
            toast.error("Address is required");
            return false;
        }

        if (!address.startsWith("0x") || address.length !== 42) {
            toast.error("Invalid Ethereum address format");
            return false;
        }

        return true;
    };

    // Handle add identity provider form submission
    const handleAddProvider = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAddress(providerToAdd)) {
            return;
        }

        try {
            await writeContractAsync({
                ...ContractOptions,
                functionName: 'addIdentityProvider',
                args: [providerToAdd],
            });
        } catch (err) {
            console.error("Error adding identity provider:", err);
            toast.error("Failed to add identity provider");
        }
    };

    // Handle remove identity provider form submission
    const handleRemoveProvider = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAddress(providerToRemove)) {
            return;
        }

        try {
            await writeContractAsync({
                ...ContractOptions,
                functionName: 'removeIdentityProvider',
                args: [providerToRemove],
            });
        } catch (err) {
            console.error("Error removing identity provider:", err);
            toast.error("Failed to remove identity provider");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Identity Provider Management</h2>

            {/* Add Identity Provider Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Add Identity Provider</CardTitle>
                    <CardDescription>Add a new trusted identity provider that can verify user addresses</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddProvider} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-md"
                                placeholder="0x..."
                                value={providerToAdd}
                                onChange={(e) => setProviderToAdd(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                disabled={isPending || isConfirming}
                            >
                                {isPending || isConfirming ? "Processing..." : "Add Provider"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Remove Identity Provider Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Remove Identity Provider</CardTitle>
                    <CardDescription>Remove an address from the trusted identity providers list</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRemoveProvider} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-md"
                                placeholder="0x..."
                                value={providerToRemove}
                                onChange={(e) => setProviderToRemove(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                                disabled={isPending || isConfirming}
                            >
                                {isPending || isConfirming ? "Processing..." : "Remove Provider"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground">
                <p>Note: Only IDP admins can manage identity providers. Once added, an identity provider can verify user addresses.</p>
                <p>Security Considerations: Identity provider keys should be kept secure as they control who can hold tokens.</p>
            </div>
        </div>
    );
}