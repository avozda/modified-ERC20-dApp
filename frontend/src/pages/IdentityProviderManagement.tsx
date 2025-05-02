import { useState } from "react";
import { useWriteContract } from "wagmi";
import { simulateContract } from "@wagmi/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ContractOptions from "@/lib/contract";
import { toast } from "sonner";
import { config } from "../../wagmi.config";

export function IdentityProviderManagement() {
    const [providerToAdd, setProviderToAdd] = useState("");
    const [providerToRemove, setProviderToRemove] = useState("");
    const [loading, setLoading] = useState(false);

    const { writeContractAsync } = useWriteContract();

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
        setLoading(true);

        if (!validateAddress(providerToAdd)) {
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'addIdentityProvider',
                args: [providerToAdd],
            });

            await writeContractAsync(request);
            toast.success("Identity provider added successfully!");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error adding identity provider:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to add identity provider");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle remove identity provider form submission
    const handleRemoveProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateAddress(providerToRemove)) {
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'removeIdentityProvider',
                args: [providerToRemove],
            });

            await writeContractAsync(request);
            toast.success("Identity provider removed successfully!");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error removing identity provider:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to remove identity provider");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Identity Provider Management</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Add Identity Provider</CardTitle>
                    <CardDescription>Add a new trusted identity provider that can verify user addresses</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddProvider} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1">
                                <Label htmlFor="providerToAdd" className="sr-only">Provider Address</Label>
                                <Input
                                    id="providerToAdd"
                                    placeholder="0x..."
                                    value={providerToAdd}
                                    onChange={(e) => setProviderToAdd(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-green-500 hover:bg-green-600"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Add Provider"}
                            </Button>
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
                            <div className="flex-1">
                                <Label htmlFor="providerToRemove" className="sr-only">Provider Address</Label>
                                <Input
                                    id="providerToRemove"
                                    placeholder="0x..."
                                    value={providerToRemove}
                                    onChange={(e) => setProviderToRemove(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Remove Provider"}
                            </Button>
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