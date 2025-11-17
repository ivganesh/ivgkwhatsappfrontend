'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { whatsappApi } from '@/lib/api/whatsapp';
import { companiesApi } from '@/lib/api/companies';
import { useAuthStore } from '@/lib/store/auth-store';
import { CheckCircle2, Loader2, Plus, Info } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface FacebookSDK {
  init: (config: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }) => void;
  login: (
    callback: (response: {
      authResponse?: { code: string };
      error?: { message: string };
    }) => void,
    options: {
      config_id: string;
      response_type: string;
      override_default_response_type: boolean;
      extras?: { sessionInfoVersion: string };
    }
  ) => void;
}

declare global {
  interface Window {
    FB?: FacebookSDK;
  }
}

export default function ConnectWhatsAppPage() {
  const router = useRouter();
  const { currentCompany, setCurrentCompany } = useAuthStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Load companies
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.getAll(),
  });

  // Set current company if not set but user has companies
  useEffect(() => {
    if (!currentCompany && companies && companies.length > 0) {
      setCurrentCompany(companies[0].id);
    }
  }, [currentCompany, companies, setCurrentCompany]);

  useEffect(() => {
    // Load Facebook SDK
    const initSDK = () => {
      if (window.FB) {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || '3449670348602936',
          version: 'v23.0',
          cookie: true,
          xfbml: false,
        });
        setSdkReady(true);
        return true;
      }
      return false;
    };

    if (initSDK()) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    script.onload = () => {
      if (initSDK()) {
        console.log('Facebook SDK initialized');
      }
    };

    script.onerror = () => {
      console.error('Failed to load Facebook SDK');
      setError('Failed to load Facebook SDK. Please check your internet connection.');
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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
      if (!window.FB) {
        setError('Facebook SDK not loaded. Please refresh the page.');
        setIsConnecting(false);
        return;
      }

      window.FB.login(
        (response: {
          authResponse?: { code: string };
          error?: { message: string };
        }) => {
          console.log('FB.login response:', response);
          
          if (response.error) {
            console.error('FB.login error:', response.error);
            setError(response.error.message || 'Failed to authenticate with Meta');
            setIsConnecting(false);
            return;
          }

          if (response.authResponse && response.authResponse.code) {
            // Handle async operation without making callback async
            (async () => {
              try {
                console.log('Exchanging code for access token...');
                const result = await whatsappApi.connect({
                  companyId: currentCompany,
                  code: response.authResponse!.code,
                });

                if (result.success) {
                  setConnected(true);
                  setTimeout(() => {
                    router.push('/dashboard');
                  }, 2000);
                } else {
                  setError('Failed to connect WhatsApp. Please try again.');
                  setIsConnecting(false);
                }
              } catch (err: unknown) {
                console.error('Backend error:', err);
                const error = err as { response?: { data?: { message?: string } }; message?: string };
                const errorMessage = error.response?.data?.message || error.message || 'Failed to connect WhatsApp';
                setError(errorMessage);
                setIsConnecting(false);
              }
            })();
          } else {
            console.error('No code in response:', response);
            setError('Failed to get authorization code from Meta. Please try again.');
            setIsConnecting(false);
          }
        },
        {
          config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID || '2216301802211791',
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            sessionInfoVersion: '3',
            // Note: Meta's Embedded Signup will automatically detect and offer coexistence
            // if the user has an existing WhatsApp Business App number during the signup flow
            // The checkbox is for user awareness - Meta handles the actual coexistence flow
          },
        }
      );
    } catch (err: unknown) {
      console.error('Connection error:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to connect WhatsApp. Please try again.');
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

          {isLoadingCompanies ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="company-select">Select Company</Label>
              <Select
                value={currentCompany || ''}
                onValueChange={(value) => setCurrentCompany(value)}
              >
                <SelectTrigger id="company-select">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Coexistence Support</AlertTitle>
            <AlertDescription className="text-sm mt-2 space-y-2">
              <p>
                You can use the same phone number on both WhatsApp Business App and WhatsApp Cloud API. 
                When you enter your phone number during Meta&apos;s signup process, Meta will automatically detect 
                if it&apos;s already registered with WhatsApp and show you coexistence options.
              </p>
              <p className="font-semibold text-blue-700 mt-3">
                How it works:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click &quot;Connect WhatsApp Business&quot; to start the signup process</li>
                <li>Log in with your Facebook/Meta Business account</li>
                <li>When you enter your phone number, Meta checks if it&apos;s already registered</li>
                <li>If registered, you&apos;ll see a &quot;Select your setup&quot; screen with two options:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong>Connect your existing WhatsApp Business App</strong> - For coexistence</li>
                    <li><strong>Start with a new WhatsApp phone number</strong> - For a new number</li>
                  </ul>
                </li>
                <li>Select coexistence and scan the QR code from your WhatsApp Business App</li>
              </ol>
              <p className="text-xs text-gray-600 mt-2 italic">
                Note: The detection is based on the phone number you enter, not your email or account.
              </p>
            </AlertDescription>
          </Alert>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-xs text-blue-800 space-y-2">
              <div>
                <strong>Coexistence Requirements:</strong>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                  <li>Phone number active on WhatsApp Business App for at least 7 days</li>
                  <li>Real customer conversations (not just test messages)</li>
                  <li>WhatsApp Business App version 2.24.17 or later</li>
                  <li>Number must be from a supported region (not EEA, UK, Australia, Japan, Nigeria, Philippines, Russia, South Korea, South Africa, or Turkey)</li>
                </ul>
              </div>
              <div className="mt-2">
                <strong>Important:</strong> Meta will automatically detect if your phone number is registered 
                when you enter it during the signup process. If eligible, you&apos;ll see the &quot;Select your setup&quot; 
                screen where you can choose coexistence. You&apos;ll then scan a QR code from your WhatsApp Business App 
                (Settings → WhatsApp → Sign Up with Facebook) to complete the linking.
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-semibold">What you&apos;ll need:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>A Facebook Business account</li>
              <li>Access to Meta Business Manager</li>
              <li>A phone number for WhatsApp Business (or existing WhatsApp Business App number for coexistence)</li>
            </ul>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting || !currentCompany || !sdkReady}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : !sdkReady ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Connect WhatsApp Business'
            )}
          </Button>

          {!currentCompany && (
            <div className="space-y-3">
              <p className="text-sm text-yellow-600">
                Please create a company first before connecting WhatsApp.
              </p>
              <Link href="/onboarding">
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Company
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



