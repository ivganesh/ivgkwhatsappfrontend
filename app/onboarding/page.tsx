'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companiesApi } from '@/lib/api/companies';
import { useAuthStore } from '@/lib/store/auth-store';

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

type CompanyForm = z.infer<typeof companySchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { setCurrentCompany } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'company' | 'whatsapp'>('company');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  });

  const name = watch('name');
  const slug = name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const onSubmit = async (data: CompanyForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const company = await companiesApi.create({
        ...data,
        slug: slug || data.slug,
      });
      setCurrentCompany(company.id);
      setStep('whatsapp');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'whatsapp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect WhatsApp</CardTitle>
            <CardDescription>
              Connect your WhatsApp Business account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You&apos;ll be redirected to Meta&apos;s Embedded Signup to connect your WhatsApp Business account.
              </p>
              <Button
                onClick={() => router.push('/dashboard/whatsapp/connect')}
                className="w-full"
              >
                Connect WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Company</CardTitle>
          <CardDescription>
            Set up your company to start using IVGK WhatsApp Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Company"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Company Slug</Label>
              <Input
                id="slug"
                type="text"
                placeholder="my-company"
                value={slug || ''}
                {...register('slug')}
              />
              <p className="text-xs text-gray-500">
                This will be used in your company URL
              </p>
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Company'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



