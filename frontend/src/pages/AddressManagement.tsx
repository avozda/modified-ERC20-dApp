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

export function AddressManagement() {
    const [addressToBlock, setAddressToBlock] = useState("");
    const [addressToUnblock, setAddressToUnblock] = useState("");
    const [addressToVerify, setAddressToVerify] = useState("");
    const [addressToUnverify, setAddressToUnverify] = useState("");
    const [loading, setLoading] = useState(false);

    const { writeContractAsync } = useWriteContract();


    // Handle block address form submission
    const handleBlockAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!addressToBlock) {
            toast.error("Address is required");
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'blockAddress',
                args: [addressToBlock],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error blocking address:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to block address");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle unblock address form submission
    const handleUnblockAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!addressToUnblock) {
            toast.error("Address is required");
            setLoading(false);
            return;
        }

        if (!addressToUnblock.startsWith("0x") || addressToUnblock.length !== 42) {
            toast.error("Invalid Ethereum address format");
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'unblockAddress',
                args: [addressToUnblock],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error unblocking address:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to unblock address");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle verify address form submission
    const handleVerifyAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!addressToVerify) {
            toast.error("Address is required");
            setLoading(false);
            return;
        }

        if (!addressToVerify.startsWith("0x") || addressToVerify.length !== 42) {
            toast.error("Invalid Ethereum address format");
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'addVerifiedAddress',
                args: [addressToVerify],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error verifying address:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to verify address");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle unverify address form submission
    const handleUnverifyAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!addressToUnverify) {
            toast.error("Address is required");
            setLoading(false);
            return;
        }

        if (!addressToUnverify.startsWith("0x") || addressToUnverify.length !== 42) {
            toast.error("Invalid Ethereum address format");
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'removeVerifiedAddress',
                args: [addressToUnverify],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error unverifying address:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to unverify address");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Address Management</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Block Address</CardTitle>
                    <CardDescription>Add an address to the blocked list</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleBlockAddress} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1">
                                <Label htmlFor="addressToBlock" className="sr-only">Address to Block</Label>
                                <Input
                                    id="addressToBlock"
                                    placeholder="0x..."
                                    value={addressToBlock}
                                    onChange={(e) => setAddressToBlock(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Block Address"}
                            </Button>
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
                            <div className="flex-1">
                                <Label htmlFor="addressToUnblock" className="sr-only">Address to Unblock</Label>
                                <Input
                                    id="addressToUnblock"
                                    placeholder="0x..."
                                    value={addressToUnblock}
                                    onChange={(e) => setAddressToUnblock(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-blue-500 hover:bg-blue-600"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Unblock Address"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Verify Address Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Manually Verify Address</CardTitle>
                    <CardDescription>Manually add an address to the verified list with system-defined expiration time</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerifyAddress} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1">
                                <Label htmlFor="addressToVerify" className="sr-only">Address to Verify</Label>
                                <Input
                                    id="addressToVerify"
                                    placeholder="0x..."
                                    value={addressToVerify}
                                    onChange={(e) => setAddressToVerify(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-green-500 hover:bg-green-600"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Verify Address"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Unverify Address Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Unverify Address</CardTitle>
                    <CardDescription>Remove an address from the verified list</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUnverifyAddress} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1">
                                <Label htmlFor="addressToUnverify" className="sr-only">Address to Unverify</Label>
                                <Input
                                    id="addressToUnverify"
                                    placeholder="0x..."
                                    value={addressToUnverify}
                                    onChange={(e) => setAddressToUnverify(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-yellow-500 hover:bg-yellow-600"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Unverify Address"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-4 text-sm text-muted-foreground">
                <p>Note: Only restriction admins can block or unblock addresses, and only IDP admins can manually verify or unverify addresses.</p>
            </div>
        </div>
    );
}