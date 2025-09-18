
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();

          // Use sample data for local development if initData is not available
          const initData = tg.initData || new URLSearchParams({
              "user": JSON.stringify({
                  "id": 987654321,
                  "first_name": "Dev",
                  "last_name": "User",
                  "username": "devuser",
                  "language_code": "en",
                  "is_premium": true
              }),
              "hash": "dummy_hash_for_development",
              "auth_date": "1722889999"
          }).toString();

          if (!initData) {
            setError("Authentication failed: Not in Telegram context.");
            setLoading(false);
            return;
          }
          
          // For local development, skip server verification if using dummy hash
          if (new URLSearchParams(initData).get('hash') === 'dummy_hash_for_development' && process.env.NODE_ENV === 'development') {
              const tgUser = JSON.parse(new URLSearchParams(initData).get('user') || '{}');
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
                  isAdmin: true,
                  referralEarnings: 25,
              };
              setUser(devUser);
              setLoading(false);
              toast({ title: "Developer Mode", description: "Using dummy auth data." });
              return;
          }

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
        } else {
            setError("Not a Telegram Mini App.");
            // Fallback for non-telegram environment
            if (process.env.NODE_ENV === 'development') {
                 const devUser: UserData = {
                    id: '987654321', // Dummy ID
                    pariBalance: 100,
                    baseRate: 10,
                    referrals: [],
                    tasks: [],
                    vip: true,
                    referralCode: 'DEVCODE123',
                    name: `Dev User`,
                    username: 'devuser',
                    email: '',
                    createdAt: new Date().toISOString(),
                    sessionEndTime: null,
                    history: [],
                    vipStatus: 'approved',
                    isAdmin: true,
                    referralEarnings: 25,
                };
                setUser(devUser);
                toast({ title: "Developer Mode", description: "Telegram context not found. Using fallback dev user." });
            }
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
  
  if (error) {
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
