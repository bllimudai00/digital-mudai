
"use client"

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

// The manifest is used to configure the TonConnect UI.
// It includes metadata about your app that will be displayed to the user in the connection modal.
// NOTE: We are serving the manifest from our own app's public folder to avoid issues with external hosting.
const manifestUrl = "https://main--studio-5485885718-fe943.web.app/tonconnect-manifest.json";

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
