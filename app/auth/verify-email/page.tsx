'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing');
        return;
      }

      try {
        const result = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            err.message ||
            'Failed to verify email. The link may be invalid or expired.',
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Email Verification
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Verification complete'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
              <p className="text-sm text-gray-600">Please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <p className="text-sm text-center text-gray-700 mb-4">{message}</p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <p className="text-sm text-center text-gray-700 mb-4">{message}</p>
              <div className="space-y-2 w-full">
                <Button
                  onClick={() => router.push('/auth/register')}
                  variant="outline"
                  className="w-full"
                >
                  Register Again
                </Button>
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
            <p className="text-sm text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

