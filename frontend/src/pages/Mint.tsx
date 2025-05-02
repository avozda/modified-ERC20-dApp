import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWriteContract, useReadContract } from "wagmi";
import { simulateContract } from "@wagmi/core";
import ContractOptions from "@/lib/contract";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { useUserContext } from "@/lib/user-context";
import { config } from "../../wagmi.config";

export function Mint() {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [maxDailyMint, setMaxDailyMint] = useState<bigint>(BigInt(0));
    const userData = useUserContext();
    const [loading, setLoading] = useState(false);

    const { data: maxDailyMintData } = useReadContract({
        ...ContractOptions,
        functionName: 'maxDailyMint',
    });

    const remainingMintAllowance = maxDailyMint > userData.dailyMinted
        ? maxDailyMint - userData.dailyMinted
        : BigInt(0);

    useEffect(() => {
        if (maxDailyMintData) {
            setMaxDailyMint(maxDailyMintData as bigint);
        }
    }, [maxDailyMintData]);

    const { writeContractAsync } = useWriteContract();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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

            const { request } = await simulateContract(config, {
                ...ContractOptions,
                functionName: 'mint',
                args: [recipientAddress, parsedAmount],
            });

            await writeContractAsync(request);
            toast.success("Minting successful!");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Minting error:", err);
            if (err.shortMessage) {
                toast.error(err.shortMessage);
            } else {
                toast.error(err.message);
            }
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Mint Tokens</h2>
            <Card className="bg-slate-50">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Daily Mint Limit</p>
                            <p className="text-2xl font-semibold">{maxDailyMint ? formatUnits(maxDailyMint, 18) : '0'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Used Today</p>
                            <p className="text-2xl font-semibold">{formatUnits(userData.dailyMinted, 18)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p className="text-2xl font-semibold text-green-600">{formatUnits(remainingMintAllowance, 18)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mint BDA25 Tokens</CardTitle>
                    <CardDescription>Enter recipient address and amount to mint tokens</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="recipientAddress">Recipient Address</Label>
                            <Input
                                id="recipientAddress"
                                placeholder="0x..."
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                placeholder="0.0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <Separator />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}

                        >
                            {loading
                                ? "Minting..."
                                : "Mint Tokens"}

                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}