
"use client";

import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { ArrowLeft, Copy, Loader, RefreshCw, Send } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Address, toNano } from "@ton/core";
import { updateTonWalletAddress } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

function SendTokenDialog() {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();

    const handleSend = async () => {
        if (!wallet) {
            toast({ title: "Wallet not connected", description: "Please connect your wallet to send tokens.", variant: "destructive" });
            return;
        }
        if (!recipient || !amount) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }
        
        let parsedRecipientAddress;
        try {
            parsedRecipientAddress = Address.parse(recipient);
        } catch (error) {
            toast({ title: "Invalid Address", description: "The recipient wallet address is not valid.", variant: "destructive" });
            return;
        }

        const amountInNano = toNano(amount);

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
            messages: [
                {
                    address: parsedRecipientAddress.toString(),
                    amount: amountInNano.toString(),
                }
            ]
        };

        setIsSending(true);
        try {
            toast({ title: "Confirm Transaction", description: "Please confirm the transaction in your wallet." });
            const result = await tonConnectUI.sendTransaction(transaction);
            toast({ title: "Transaction Sent!", description: "Your transaction has been broadcasted to the network." });
        } catch (error) {
            toast({ title: "Transaction Failed", description: (error as Error)?.message || "The transaction was rejected or failed.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Send TON</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Enter TON wallet address" />
                </div>
                <div>
                    <Label htmlFor="amount">Amount (TON)</Label>
                    <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    <p className="text-xs text-muted-foreground mt-1">Note: This sends native TON. Sending custom tokens (Jettons) like FIR would require a different transaction payload.</p>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSend} disabled={isSending}>
                    {isSending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {isSending ? "Sending..." : "Send"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}


function WalletInfo() {
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const { user, loading: authLoading } = useContext(AuthContext)!;
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const isWalletConnected = !!wallet;
    
    const rawAddress = isWalletConnected ? wallet.account.address : user?.tonAddress;
    const userFriendlyAddress = rawAddress ? Address.parse(rawAddress).toString({ bounceable: true, urlSafe: true }) : '';

    const copyToClipboard = (text: string, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'Copied!', description: `${type} address copied to clipboard.` });
        }).catch(() => {
            toast({ title: 'Error', description: 'Failed to copy.', variant: 'destructive' });
        });
    };
    
    useEffect(() => {
        const saveAddress = async () => {
            if (isWalletConnected && user && user.tonAddress !== wallet.account.address) {
                setIsSaving(true);
                const result = await updateTonWalletAddress(user.id, wallet.account.address);
                if (result.success) {
                    toast({ title: 'Wallet Linked', description: 'Your TON wallet has been successfully linked.' });
                } else {
                    toast({ title: 'Error', description: result.error, variant: 'destructive' });
                }
                setIsSaving(false);
            }
        };
        saveAddress();
    }, [isWalletConnected, wallet, user, toast]);


    if (authLoading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>;
    }

    if (!rawAddress) {
        return (
             <Card className="bg-card/80 backdrop-blur-sm text-center p-8">
                <CardContent className="p-0 flex flex-col items-center">
                    <h2 className="text-lg font-semibold">Connect Your Wallet</h2>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Connect your TON wallet to manage your tokens.
                    </p>
                    <TonConnectButton />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Dialog>
            <Card className="bg-card/80 backdrop-blur-sm p-6">
                <CardContent className="p-0 space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Balance</p>
                        <p className="text-4xl font-bold">0.00 FIR</p>
                        <p className="text-sm text-muted-foreground">≈ $0.00</p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Your Wallet Address</label>
                        <div className="flex items-center gap-2 bg-background p-2 rounded-md mt-1">
                            <p className="text-sm font-mono truncate flex-1">{userFriendlyAddress}</p>
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => copyToClipboard(userFriendlyAddress, 'Address')}>
                                <Copy className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                         <DialogTrigger asChild>
                            <Button size="lg" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">
                                <Send className="w-4 h-4 mr-2" />
                                Send
                            </Button>
                        </DialogTrigger>
                        <Button size="lg" variant="outline" disabled>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Transactions
                        </Button>
                    </div>
                    {isWalletConnected ? (
                         <Button variant="link" className="w-full text-center text-red-500" onClick={() => tonConnectUI.disconnect()}>Disconnect Wallet</Button>
                    ) : (
                         <div className="pt-2 flex flex-col items-center">
                             <p className="text-xs text-muted-foreground mb-2">Connect wallet to send tokens.</p>
                            <TonConnectButton />
                         </div>
                    )}
                </CardContent>
            </Card>
            <SendTokenDialog />
        </Dialog>
    );
}


export default function WalletPage() {
    return (
        <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
            <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button asChild variant="ghost" size="icon">
                <Link href="/profile">
                    <ArrowLeft />
                </Link>
                </Button>
                <h1 className="text-xl font-bold text-center flex-1">Wallet</h1>
                <div className="w-8"></div>
            </header>

            <main className="flex-1 p-4 space-y-6">
               <WalletInfo />
            </main>
        </div>
    )
}

    