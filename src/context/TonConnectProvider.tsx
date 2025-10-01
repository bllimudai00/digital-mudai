
"use client"

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

// The manifest is used to configure the TonConnect UI.
// It includes metadata about your app that will be displayed to the user in the connection modal.
const manifestUrl = "https://raw.githubusercontent.com/Pari-Network/parinetwork/main/public/tonconnect-manifest.json";

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
