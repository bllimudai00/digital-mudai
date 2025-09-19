
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { UserData } from '@/lib/types';
import { verifyTelegramAuth } from '@/app/actions';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const ADMIN_USERNAMES = ['Digitalmudai01', 'DesignerDynamo', 'arafatislam0'];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const authenticate = async () => {
      try {
        const isDevEnv = process.env.NODE_ENV === 'development';
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

        if (tg) {
          tg.ready();
          tg.expand();

          const initData = tg.initData;

          // Scenario 1: Running in Telegram with real initData
          if (initData) {
            // Special case for local dev using dummy hash but with real `initData` present
            if (new URLSearchParams(initData).get('hash') === 'dummy_hash_for_development' && isDevEnv) {
                const tgUser = JSON.parse(new URLSearchParams(initData).get('user') || '{}');
                const isDevAdmin = ADMIN_USERNAMES.includes(tgUser.username || '');
                const devUser: UserData = {
                    id: tgUser.id.toString(),
                    pariBalance: 100,
                    baseRate: 10,
                    referrals: [],
                    tasks: [],
                    vip: true,
                    referralCode: 'DEVCODE123',
                    name: `${tgUser.first_name} ${tgUser.last_name}`,
                    username: tgUser.username,
                    email: '',
                    createdAt: new Date().toISOString(),
                    sessionEndTime: null,
                    history: [],
                    vipStatus: 'approved',
                    isAdmin: isDevAdmin,
                    referralEarnings: 25,
                };
                setUser(devUser);
                toast({ title: "Developer Mode", description: "Using dummy hash auth data." });
            } else {
                 // Production or real verification path
                const result = await verifyTelegramAuth(initData);
                if ('user' in result) {
                    setUser(result.user);
                    if(result.isNewUser) {
                        toast({ title: "Welcome!", description: "Your account has been created." });
                    }
                } else {
                    setError(result.error);
                    toast({ title: "Auth Error", description: result.error, variant: 'destructive' });
                }
            }
          } else if (isDevEnv) {
            // Scenario 2: Dev env, but no `initData` at all. Fallback to dummy user.
            setError("Telegram.WebApp.initData is empty. Falling back to dev user.");
            const devUsername = "Digitalmudai01";
            const isDevAdmin = ADMIN_USERNAMES.includes(devUsername);
            const devUser: UserData = {
              id: '987654321',
              pariBalance: 100,
              baseRate: 10,
              referrals: [],
              tasks: [],
              vip: true,
              referralCode: 'DEVCODE123',
              name: `Dev User`,
              username: devUsername,
              email: '',
              createdAt: new Date().toISOString(),
              sessionEndTime: null,
              history: [],
              vipStatus: 'approved',
              isAdmin: isDevAdmin,
              referralEarnings: 25,
            };
            setUser(devUser);
            toast({ title: "Developer Mode", description: "initData not found. Using fallback dev user." });
          } else {
             // Scenario 3: Production env, but no `initData`. This is an error.
             setError("Authentication failed: Not in a valid Telegram context.");
          }
        } else if (isDevEnv) {
             // Scenario 4: Not even in a Telegram-like environment (no `window.Telegram`), but in dev.
             setError("Telegram context not found. Using fallback dev user.");
             const devUsername = "Digitalmudai01";
             const isDevAdmin = ADMIN_USERNAMES.includes(devUsername);
             const devUser: UserData = {
                id: '987654321', // Dummy ID
                pariBalance: 100,
                baseRate: 10,
                referrals: [],
                tasks: [],
                vip: true,
                referralCode: 'DEVCODE123',
                name: `Dev User`,
                username: devUsername,
                email: '',
                createdAt: new Date().toISOString(),
                sessionEndTime: null,
                history: [],
                vipStatus: 'approved',
                isAdmin: isDevAdmin,
                referralEarnings: 25,
            };
            setUser(devUser);
            toast({ title: "Developer Mode", description: "Telegram context not found. Using fallback dev user." });
        } else {
            // Scenario 5: Not in Telegram and not in dev. This is an error.
            setError("Not a Telegram Mini App.");
        }

      } catch (e: any) {
        console.error(e);
        setError(e.message || "An unexpected error occurred during authentication.");
        toast({ title: "Fatal Error", description: e.message || "Could not authenticate.", variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [toast]);

  const value = { user, loading, error };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4">Authenticating...</p>
      </div>
    );
  }
  
  if (error && !user) { // Only show full-screen error if we couldn't fall back to a user
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
        <p>{error}</p>
        <p className="mt-4 text-xs text-muted-foreground">Please try launching the app via Telegram again.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Add a declaration for the Telegram WebApp window object
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

    