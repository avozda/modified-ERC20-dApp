import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWriteContract, useReadContract } from "wagmi";
import { simulateContract } from "@wagmi/core";
import ContractOptions from "@/lib/contract";
import { toast } from "sonner";
import { config } from "../../wagmi.config";

export function RestrictionAdminVoting() {
    const [candidateAddress, setCandidateAddress] = useState("");
    const [loading, setLoading] = useState(false);

    // Get current restriction admin count to show information
    const { data: restrAdminCount } = useReadContract({
        ...ContractOptions,
        functionName: 'restrAdminCount',
        query: {
            enabled: true
        }
    }) as { data: bigint };


    // Contract write hooks for voting
    const { writeContractAsync } = useWriteContract();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!candidateAddress) {
            toast.error("Candidate address is required");
            setLoading(false);
            return;
        }

        try {
            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'voteRestrAdmin',
                args: [candidateAddress],
            });

            await writeContractAsync(request);
            toast.success("Vote submitted successfully!");
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
    const requiredVotes = restrAdminCount ? Math.floor(Number(restrAdminCount) / 2) + 1 : 1;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Restriction Admin Voting</h2>
            <p className="text-muted-foreground">
                Vote to add or remove restriction administrators. A majority vote (more than {restrAdminCount ? Math.floor(Number(restrAdminCount) / 2) : '0'} votes) is required to change admin status.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Vote on Restriction Admin</CardTitle>
                    <CardDescription>
                        Submit your vote to grant or revoke restriction admin privileges
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
                            disabled={loading}
                        >
                            {loading
                                ? "Processing..."
                                : "Submit Vote"}
                        </Button>
                    </form>

                    <div className="mt-6 text-sm">
                        <p className="font-medium">Voting Information:</p>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                            <li>Current restriction admin count: {restrAdminCount ? Number(restrAdminCount) : "Loading..."}</li>
                            <li>Required votes to change status: {requiredVotes}</li>
                            <li>Your vote is final and cannot be changed</li>
                            <li>If the vote passes, the admin status will be immediately changed</li>
                            <li>Restriction admins manage transfer limits and blocked addresses</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}