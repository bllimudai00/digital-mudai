"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileJson } from "lucide-react";
import Link from "next/link";

function TermsSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-xl font-bold text-primary mb-2">{title}</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
                {children}
            </div>
        </div>
    );
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
          <FileJson className="w-5 h-5" />
          Terms of Service
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-8">
            <p className="text-sm text-muted-foreground">Last updated: August 28, 2024</p>
            
            <TermsSection title="1. Acceptance of Terms">
                <p>By accessing or using the PARI Network application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.</p>
            </TermsSection>

            <TermsSection title="2. User Accounts">
                <p>You are responsible for safeguarding your account and for any activities or actions under your account. You agree not to disclose your login credentials to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
            </TermsSection>

            <TermsSection title="3. Mining, Rewards, and PARI Tokens">
                <p>The Service allows you to earn "PARI" tokens through mining sessions and by completing tasks. PARI tokens are digital assets within the application and currently have no monetary value outside of the PARI Network ecosystem. The rate of earning, reward amounts, and token utility are subject to change at our sole discretion.</p>
            </TermsSection>
            
            <TermsSection title="4. VIP Membership">
                <p>VIP Membership is a one-time, non-refundable purchase. We reserve the right to approve or reject VIP status based on our verification process. Benefits associated with VIP status are subject to change.</p>
            </TermsSection>

             <TermsSection title="5. Prohibited Activities">
                <p>You agree not to engage in any of the following prohibited activities:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>Using automated scripts, bots, or any other unauthorized means to interact with the mining or task system.</li>
                    <li>Creating multiple accounts for a single user to abuse the referral system or other features.</li>
                    <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
                </ul>
                <p>Violation of these rules may result in the suspension or permanent termination of your account and forfeiture of your entire PARI balance.</p>
            </TermsSection>
            
            <TermsSection title="6. Termination">
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease, and your accumulated PARI balance may be forfeited.</p>
            </TermsSection>

            <TermsSection title="7. Disclaimer of Warranty">
                <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the service will be uninterrupted, secure, or error-free. The value of PARI tokens is not guaranteed and may fluctuate.</p>
            </TermsSection>

            <TermsSection title="8. Changes to Terms">
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.</p>
            </TermsSection>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
