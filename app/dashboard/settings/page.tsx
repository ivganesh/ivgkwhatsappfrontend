'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { companiesApi, type CompanyDetail } from '@/lib/api/companies';
import { cn } from '@/lib/utils';

const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'US/Eastern', value: 'America/New_York' },
  { label: 'US/Pacific', value: 'America/Los_Angeles' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
];

const localeOptions = [
  { label: 'English (US)', value: 'en' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'Hindi', value: 'hi' },
];

interface SettingsFormValues {
  name: string;
  slug: string;
  timezone: string;
  locale: string;
}

export default function SettingsPage() {
  const { currentCompany } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: company,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery<CompanyDetail>({
    queryKey: ['company-settings', currentCompany],
    queryFn: async () => {
      if (!currentCompany) {
        throw new Error('No company selected');
      }
      return companiesApi.getById(currentCompany);
    },
    enabled: !!currentCompany,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm<SettingsFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      timezone: 'UTC',
      locale: 'en',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        slug: company.slug,
        timezone: company.timezone || 'UTC',
        locale: company.locale || 'en',
      });
    }
  }, [company, reset]);

  const webhookUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    if (!base) return 'https://yourdomain.com/api/whatsapp/webhook';
    return `${base.replace(/\/$/, '')}/whatsapp/webhook`;
  }, []);

  const onSubmit = async (values: SettingsFormValues) => {
    if (!currentCompany) return;
    setFormError(null);
    setSuccessMessage(null);
    try {
      await companiesApi.update(currentCompany, {
        name: values.name,
        timezone: values.timezone,
        locale: values.locale,
      });
      setSuccessMessage('Settings saved successfully.');
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update settings');
    }
  };

  if (!currentCompany) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-2">Select a company to manage its settings.</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You must select a company before editing settings.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your company configuration.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as Error)?.message || 'Failed to load company settings.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage company profile, localization, and WhatsApp connection.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>Update basic information such as name, timezone, and locale.</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Company name</Label>
                <Input
                  id="name"
                  placeholder="IVGK WhatsApp"
                  disabled={isLoading}
                  {...register('name', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" disabled {...register('slug')} />
                <p className="text-xs text-gray-500">Slug is used in URLs and cannot be changed.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={watch('timezone')}
                  onValueChange={(value) => setValue('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Locale</Label>
                <Select
                  value={watch('locale')}
                  onValueChange={(value) => setValue('locale', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select locale" />
                  </SelectTrigger>
                  <SelectContent>
                    {localeOptions.map((locale) => (
                      <SelectItem key={locale.value} value={locale.value}>
                        {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp connection</CardTitle>
          <CardDescription>Monitor your WhatsApp Business integration status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-500">Connection status</p>
              <Badge
                variant={company?.whatsappConnected ? 'default' : 'outline'}
                className={cn(
                  company?.whatsappConnected
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200',
                )}
              >
                {company?.whatsappConnected ? 'Connected' : 'Not connected'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/whatsapp/connect">
                <Button variant="outline">
                  Manage connection
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/templates">
                <Button variant="ghost">
                  View templates
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-xs uppercase text-gray-500">WhatsApp Business ID</p>
              <p className="text-sm font-medium text-gray-900">
                {company?.whatsappBusinessId || 'Not configured'}
              </p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs uppercase text-gray-500">Phone number ID</p>
              <p className="text-sm font-medium text-gray-900">
                {company?.whatsappPhoneId || 'Not configured'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook & API</CardTitle>
          <CardDescription>Use these values when configuring Meta webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Verify token</Label>
            <Input
              readOnly
              value={company?.whatsappWebhookToken || 'Set WHATSAPP_WEBHOOK_VERIFY_TOKEN in your .env'}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure the same webhook URL and verify token inside Meta Business Manager under
              <strong> WhatsApp → Configuration → Webhooks</strong>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

