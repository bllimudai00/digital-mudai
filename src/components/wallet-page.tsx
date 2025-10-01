"use client";

import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { ArrowLeft, Copy, Loader, RefreshCw, Send } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Address } from "@ton/core";
import { updateTonWalletAddress } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

function WalletInfo() {
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const { user, loading: authLoading } = useContext(AuthContext)!;
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const userFriendlyAddress = wallet ? Address.parse(wallet.account.address).toString({ bounceable: true, urlSafe: true }) : '';
    const rawAddress = wallet ? wallet.account.address : '';

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'Copied!', description: `${type} address copied to clipboard.` });
        }).catch(() => {
            toast({ title: 'Error', description: 'Failed to copy.', variant: 'destructive' });
        });
    };

    useEffect(() => {
        const saveAddress = async () => {
            if (wallet && user && user.tonAddress !== rawAddress) {
                setIsSaving(true);
                const result = await updateTonWalletAddress(user.id, rawAddress);
                if (result.success) {
                    toast({ title: 'Wallet Linked', description: 'Your TON wallet has been successfully linked.' });
                } else {
                    toast({ title: 'Error', description: result.error, variant: 'destructive' });
                }
                setIsSaving(false);
            }
        };
        saveAddress();
    }, [wallet, user, rawAddress, toast]);


    if (authLoading) {
        return <div className="flex justify-center p-8"><Loader className="w-6 h-6 animate-spin"/></div>;
    }

    if (!wallet) {
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
        <Card className="bg-card/80 backdrop-blur-sm p-6">
            <CardContent className="p-0 space-y-4">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="text-4xl font-bold">1,250.75 FIR</p>
                    <p className="text-sm text-green-400">≈ $50.25</p>
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
                    <Button size="lg" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">
                        <Send className="w-4 h-4 mr-2" />
                        Send
                    </Button>
                    <Button size="lg" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Transactions
                    </Button>
                </div>
                <Button variant="link" className="w-full text-center text-red-500" onClick={() => tonConnectUI.disconnect()}>Disconnect Wallet</Button>
            </CardContent>
        </Card>
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
