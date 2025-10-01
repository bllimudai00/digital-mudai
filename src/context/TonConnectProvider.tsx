"use client"

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

// The manifest is used to configure the TonConnect UI.
// It includes metadata about your app that will be displayed to the user in the connection modal.
const manifestUrl = "https://gist.githubusercontent.com/siandree/034b2f56755a544ad5544710100238e8/raw/d513723de3165cb640538006dab1539f3c834079/gistfile1.txt";

export function TonConnectProvider({ children }: { children: ReactNode }) {
    return (
        <TonConnectUIProvider
            manifestUrl={manifestUrl}
            actionsConfiguration={{
                twaReturnUrl: 'https://t.me/parinetworkbot/parinetwork'
            }}
        >
            {children}
        </TonConnectUIProvider>
    )
}
