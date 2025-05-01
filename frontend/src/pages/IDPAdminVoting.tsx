import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { simulateContract } from "@wagmi/core";
import ContractOptions from "@/lib/contract";
import { toast } from "sonner";
import { config } from "../../wagmi.config";

export function IDPAdminVoting() {
    const [candidateAddress, setCandidateAddress] = useState("");
    const [loading, setLoading] = useState(false);

    // Get current IDP admin count to show information
    const { data: idpAdminCount } = useReadContract({
        ...ContractOptions,
        functionName: 'idpAdminCount',
        query: {
            enabled: true
        }
    }) as { data: bigint };

    // Contract write hooks for voting
    const { data: hash, isPending, writeContractAsync } = useWriteContract();

    const { isLoading: isConfirming, isSuccess, error: waitError } = useWaitForTransactionReceipt({
        hash,
    });

    // Show error messages when transaction fails
    useEffect(() => {
        if (waitError) {
            toast.error("Transaction failed: " + waitError.message);
        }
    }, [waitError]);

    // Show success notification when transaction confirms
    useEffect(() => {
        if (isSuccess) {
            toast.success("Vote submitted successfully!");
            // Clear form fields after success
            setCandidateAddress("");
        }
    }, [isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!candidateAddress) {
            toast.error("Candidate address is required");
            setLoading(false);
            return;
        }

        if (!candidateAddress.startsWith("0x") || candidateAddress.length !== 42) {
            toast.error("Invalid Ethereum address format");
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'voteIDPAdmin',
                args: [candidateAddress],
            });

            await writeContractAsync(request);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Error submitting vote:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message || "Failed to submit vote");
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate required votes for approval (more than half of current admin count)
    const requiredVotes = idpAdminCount ? Math.floor(Number(idpAdminCount) / 2) + 1 : 1;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Identity Provider Admin Voting</h2>
            <p className="text-muted-foreground">
                Vote to add or remove identity provider administrators. A majority vote (more than {idpAdminCount ? Math.floor(Number(idpAdminCount) / 2) : '0'} votes) is required to change admin status.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Vote on IDP Admin</CardTitle>
                    <CardDescription>
                        Submit your vote to grant or revoke identity provider admin privileges
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="candidateAddress">Candidate Address</Label>
                            <Input
                                id="candidateAddress"
                                placeholder="0x..."
                                value={candidateAddress}
                                onChange={(e) => setCandidateAddress(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || isPending || isConfirming}
                        >
                            {loading || isPending || isConfirming
                                ? "Processing..."
                                : "Submit Vote"}
                        </Button>
                    </form>

                    <div className="mt-6 text-sm">
                        <p className="font-medium">Voting Information:</p>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                            <li>Current identity provider admin count: {idpAdminCount ? Number(idpAdminCount) : "Loading..."}</li>
                            <li>Required votes to change status: {requiredVotes}</li>
                            <li>Your vote is final and cannot be changed</li>
                            <li>If the vote passes, the admin status will be immediately changed</li>
                            <li>Identity provider admins manage trusted identity providers and manual verification</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}