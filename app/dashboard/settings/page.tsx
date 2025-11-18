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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Copy } from 'lucide-react';
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

  const apiBaseUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || '';
    if (!raw) {
      return 'https://your-domain.com/api';
    }
    return raw.replace(/\/$/, '');
  }, []);

  const webhookUrl = useMemo(() => `${apiBaseUrl}/whatsapp/webhook`, [apiBaseUrl]);

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
        <p className="text-gray-600">
          Manage company configuration, WhatsApp connectivity, and developer integrations.
        </p>
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
          <CardDescription>Monitor the status of your WhatsApp Business integration.</CardDescription>
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
          <CardTitle>Webhook &amp; API</CardTitle>
          <CardDescription>Configure Meta webhooks and integrate with the IVGK REST API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} />
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(webhookUrl)}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Configure this URL and the verify token inside <strong>Meta Business Manager → WhatsApp → Configuration → Webhooks</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Verify token</Label>
            <Input
              readOnly
              value={company?.whatsappWebhookToken || 'Set WHATSAPP_WEBHOOK_VERIFY_TOKEN in your .env'}
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-800">API base URL</p>
            <div className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-sm font-mono">
              <span>{apiBaseUrl}</span>
              <Button variant="ghost" size="sm" className="h-auto px-2 py-0" onClick={() => navigator.clipboard?.writeText(apiBaseUrl)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Authenticate via <code>POST {apiBaseUrl}/auth/login</code> and send the returned JWT in{' '}
              <code>Authorization: Bearer &lt;token&gt;</code>. API-key support is coming soon.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Send a text message</p>
            <pre className="rounded bg-slate-900 p-4 text-xs text-slate-100 overflow-auto">{`curl -X POST ${apiBaseUrl}/whatsapp/send/text \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
  "companyId": "${currentCompany ?? '<your-company-id>'}",
  "phoneNumber": "+919876543210",
  "message": "Hi John, your order has been received."
}'`}</pre>
            <p className="text-xs text-gray-500">Phone numbers must be E.164 format (+countrycode...).</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Send an approved template</p>
            <pre className="rounded bg-slate-900 p-4 text-xs text-slate-100 overflow-auto">{`curl -X POST ${apiBaseUrl}/whatsapp/send/template \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
  "companyId": "${company?.id ?? '<your-company-id>'}",
  "phoneNumber": "+919876543210",
  "templateName": "order_update",
  "languageCode": "en_US",
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John" },
        { "type": "text", "text": "#12345" }
      ]
    }
  ]
}'`}</pre>
            <p className="text-xs text-gray-500">
              Use the template slug shown on the Templates page and match the approved <code>languageCode</code>. Format{' '}
              <code>components</code> as described in the{' '}
              <Link
                className="underline"
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object"
                target="_blank"
              >
                WhatsApp documentation
              </Link>
              .
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Retrieve message history</p>
            <pre className="rounded bg-slate-900 p-4 text-xs text-slate-100 overflow-auto">{`curl "${apiBaseUrl}/messages?companyId=${company?.id ?? '<your-company-id>'}&limit=50" \\
  -H "Authorization: Bearer <JWT_TOKEN>"`}</pre>
            <p className="text-xs text-gray-500">
              Returns outbound &amp; inbound messages with delivery states. Use <code>contactId</code>, <code>page</code>, and{' '}
              <code>limit</code> to paginate.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Need API keys or custom automation? Reach out to support—we can guide you through secure server-to-server messaging.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
