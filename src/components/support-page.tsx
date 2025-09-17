"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Loader, Mail, MessageSquare, Send, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getGlobalSettings } from "@/app/actions";
import { GlobalSettings } from "@/lib/types";

function SupportOption({ icon, title, description, href, isExternal = false }: { icon: React.ReactNode, title: string, description: string, href?: string, isExternal?: boolean }) {
    if (!href) {
        return (
             <div className="opacity-50 cursor-not-allowed">
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-background rounded-lg">
                                {icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">{title}</h3>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                </Card>
             </div>
        )
    }

    return (
        <Link href={href} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : ""} className="block">
            <Card className="bg-card/80 backdrop-blur-sm hover:bg-card/100 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-background rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    )
}

export default function SupportPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalSettings().then(data => {
        setSettings(data);
        setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const supportEmail = settings?.supportEmail || "";

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      <header className="flex items-center p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button asChild variant="ghost" size="icon">
          <Link href="/profile">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-center flex-1 flex items-center justify-center gap-2">
          <Wrench className="w-5 h-5" />
          Help & Support
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
            <>
                <p className="text-center text-muted-foreground">
                    Have questions or need help? Reach out to us through one of the channels below.
                </p>
                <div className="space-y-3">
                    <SupportOption 
                        icon={<MessageSquare className="w-6 h-6 text-primary" />}
                        title="Join Group Chat"
                        description="Get help from the community and team."
                        href={settings?.telegramGroupUrl}
                        isExternal
                    />
                     <SupportOption 
                        icon={<Send className="w-6 h-6 text-primary" />}
                        title="Official Channel"
                        description="Stay updated with the latest news."
                        href={settings?.telegramChannelUrl}
                        isExternal
                    />
                     <SupportOption 
                        icon={<Mail className="w-6 h-6 text-primary" />}
                        title="Email Support"
                        description="For direct inquiries and support."
                        href={supportEmail ? `mailto:${supportEmail}` : undefined}
                    />
                </div>
            </>
        )}
      </main>
    </div>
  );
}
