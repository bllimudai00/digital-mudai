"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

function PolicySection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-xl font-bold text-primary mb-2">{title}</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
                {children}
            </div>
        </div>
    );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Policy
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-8">
            <p className="text-sm text-muted-foreground">Last updated: August 28, 2024</p>
            
            <PolicySection title="1. Introduction">
                <p>Welcome to PARI Network. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we collect, use, and protect your personal information.</p>
            </PolicySection>

            <PolicySection title="2. Data We Collect">
                <p>We may collect the following information:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>Account Information:</strong> When you register, we collect your name, email address, and username.</li>
                    <li><strong>Usage Data:</strong> We track your activity, including mining sessions, task completion, PARI balance, and referral history.</li>
                    <li><strong>VIP Membership:</strong> If you choose to upgrade to VIP, we collect the transaction ID of your payment for verification purposes. We do not store your private wallet keys.</li>
                </ul>
            </PolicySection>

            <PolicySection title="3. How We Use Your Data">
                <p>Your data is used to:</p_section>
                <ul className="list-disc list-inside space-y-2">
                    <li>Provide and maintain our services, including the mining and rewards system.</li>
                    <li>Manage your account and your PARI balance.</li>
                    <li>Verify VIP membership payments.</li>
                    <li>Calculate and attribute referral commissions.</li>
                    <li>Communicate with you about updates, news, and support inquiries.</li>
                </ul>
            </PolicySection>
            
            <PolicySection title="4. Data Sharing and Disclosure">
                <p>We do not sell, trade, or rent your personal identification information to others. Your data is stored securely on Firebase and is not shared with any third-party services for marketing purposes.</p>
            </PolicySection>
            
            <PolicySection title="5. Security">
                <p>We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information. All connections to our app are encrypted using SSL technology.</p>
            </PolicySection>
            
            <PolicySection title="6. Your Rights">
                <p>You have the right to access and update your personal information. You may also request the deletion of your account. Please contact our support team for any such requests.</p>
            </PolicySection>

            <PolicySection title="7. Changes to This Privacy Policy">
                <p>We have the discretion to update this privacy policy at any time. When we do, we will revise the updated date at the top of this page. We encourage you to frequently check this page for any changes to stay informed about how we are helping to protect the personal information we collect.</p>
            </PolicySection>

            <PolicySection title="8. Contacting Us">
                <p>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us through the "Get Support" link in the app.</p>
            </PolicySection>
            
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
