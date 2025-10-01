
"use client"

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

// The manifest is used to configure the TonConnect UI.
// It includes metadata about your app that will be displayed to the user in the connection modal.
const manifestUrl = "https://gist.githubusercontent.com/barbarbar28/1d60721e33cb4115456d14166874838b/raw/c34762514115a1f6305a5078564882b53580575d/tonconnect-manifest.json";

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
