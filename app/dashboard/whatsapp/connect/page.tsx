'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { whatsappApi } from '@/lib/api/whatsapp';
import { useAuthStore } from '@/lib/store/auth-store';
import { CheckCircle2, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    FB: any;
  }
}

export default function ConnectWhatsAppPage() {
  const router = useRouter();
  const { currentCompany, user } = useAuthStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Load Facebook SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    script.onload = () => {
      if (window.FB) {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || '3449670348602936',
          version: 'v18.0',
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleConnect = async () => {
    if (!currentCompany) {
      setError('Please select a company first');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Launch Meta Embedded Signup
      if (window.FB) {
        window.FB.login(
          async (response: any) => {
            if (response.authResponse && response.authResponse.code) {
              try {
                const result = await whatsappApi.connect({
                  companyId: currentCompany,
                  code: response.authResponse.code,
                });

                if (result.success) {
                  setConnected(true);
                  setTimeout(() => {
                    router.push('/dashboard');
                  }, 2000);
                }
              } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to connect WhatsApp');
              } finally {
                setIsConnecting(false);
              }
            } else {
              setError('Failed to get authorization code from Meta');
              setIsConnecting(false);
            }
          },
          {
            config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || '2216301802211791',
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              sessionInfoVersion: '3',
            },
          }
        );
      } else {
        setError('Facebook SDK not loaded. Please refresh the page.');
        setIsConnecting(false);
      }
    } catch (err: any) {
      setError('Failed to connect WhatsApp. Please try again.');
      setIsConnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Connected!</h1>
          <p className="text-gray-600 mt-2">Your WhatsApp Business account is now connected.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <span>Successfully connected to WhatsApp Business</span>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Connect your WhatsApp Business account via Meta Embedded Signup
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta Embedded Signup</CardTitle>
          <CardDescription>
            Connect your WhatsApp Business account to start sending and receiving messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">What you'll need:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>A Facebook Business account</li>
              <li>Access to Meta Business Manager</li>
              <li>A phone number for WhatsApp Business</li>
            </ul>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting || !currentCompany}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect WhatsApp Business'
            )}
          </Button>

          {!currentCompany && (
            <p className="text-sm text-yellow-600">
              Please create a company first before connecting WhatsApp.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

