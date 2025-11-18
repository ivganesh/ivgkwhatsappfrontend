'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  templatesApi,
  type Template,
  type TemplatePayload,
  type TemplateComponent,
} from '@/lib/api/templates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TemplateFormValues {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
}

function getPlaceholderIndexes(text: string): number[] {
  const regex = /{{(\d+)}}/g;
  const indexes = new Set<number>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const value = parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > 0) {
      indexes.add(value);
    }
  }
  return Array.from(indexes).sort((a, b) => a - b);
}

export default function TemplatesPage() {
  const { currentCompany } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [bodySamples, setBodySamples] = useState<string[]>([]);
  const [headerSamples, setHeaderSamples] = useState<string[]>([]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['templates', currentCompany],
    queryFn: async () => {
      if (!currentCompany) {
        throw new Error('No company selected');
      }
      return templatesApi.list(currentCompany, 1, 50);
    },
    enabled: !!currentCompany,
  });

  const templates: Template[] = data?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
    watch,
  } = useForm<TemplateFormValues>({
    defaultValues: {
      name: '',
      category: 'MARKETING',
      language: 'en_US',
      headerText: '',
      bodyText: '',
      footerText: '',
    },
  });

  const bodyTextValue = watch('bodyText');
  const headerTextValue = watch('headerText');

  const bodyPlaceholderIndexes = useMemo(
    () => getPlaceholderIndexes(bodyTextValue || ''),
    [bodyTextValue],
  );

  const headerPlaceholderIndexes = useMemo(
    () => getPlaceholderIndexes(headerTextValue || ''),
    [headerTextValue],
  );

  useEffect(() => {
    const max = bodyPlaceholderIndexes.length
      ? Math.max(...bodyPlaceholderIndexes)
      : 0;
    setBodySamples((prev) => {
      const next = [...prev];
      if (max > next.length) {
        while (next.length < max) {
          next.push('');
        }
      } else if (max < next.length) {
        next.splice(max);
      }
      return next;
    });
  }, [bodyPlaceholderIndexes]);

  useEffect(() => {
    const max = headerPlaceholderIndexes.length
      ? Math.max(...headerPlaceholderIndexes)
      : 0;
    setHeaderSamples((prev) => {
      const next = [...prev];
      if (max > next.length) {
        while (next.length < max) {
          next.push('');
        }
      } else if (max < next.length) {
        next.splice(max);
      }
      return next;
    });
  }, [headerPlaceholderIndexes]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      MARKETING: 'bg-blue-50 text-blue-700 border-blue-200',
      UTILITY: 'bg-purple-50 text-purple-700 border-purple-200',
      AUTHENTICATION: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return (
      <Badge variant="outline" className={colors[category] || ''}>
        {category}
      </Badge>
    );
  };

  const renderTemplateContent = (template: Template) => {
    const headerComponent = template.components?.find((c) => c.type === 'HEADER');
    const bodyComponent = template.components?.find((c) => c.type === 'BODY');
    const footerComponent = template.components?.find((c) => c.type === 'FOOTER');

    return (
      <div className="space-y-2 text-sm">
        {headerComponent && (
          <div>
            <span className="font-semibold text-gray-500">Header: </span>
            <span className="text-gray-700">{headerComponent.text || headerComponent.format || 'Media'}</span>
          </div>
        )}
        {bodyComponent && (
          <div>
            <span className="font-semibold text-gray-500">Body: </span>
            <span className="text-gray-700">{bodyComponent.text || 'N/A'}</span>
          </div>
        )}
        {footerComponent && (
          <div>
            <span className="font-semibold text-gray-500">Footer: </span>
            <span className="text-gray-700">{footerComponent.text || 'N/A'}</span>
          </div>
        )}
      </div>
    );
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    reset({
      name: '',
      category: 'MARKETING',
      language: 'en_US',
      headerText: '',
      bodyText: '',
      footerText: '',
    });
    setBodySamples([]);
    setHeaderSamples([]);
    setIsFormOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    const header = template.components.find((c) => c.type === 'HEADER');
    const body = template.components.find((c) => c.type === 'BODY');
    const footer = template.components.find((c) => c.type === 'FOOTER');

    reset({
      name: template.name,
      category: template.category,
      language: template.language,
      headerText: header?.text || '',
      bodyText: body?.text || '',
      footerText: footer?.text || '',
    });
    const bodyExamples =
      (body?.example as any)?.body_text?.[0] ||
      (Array.isArray((body?.example as any)?.body_text)
        ? (body?.example as any)?.body_text
        : []);
    setBodySamples(
      Array.isArray(bodyExamples) ? [...bodyExamples] : [],
    );
    const headerExamples =
      (header?.example as any)?.header_text ||
      (header?.example as any)?.header_handle;
    setHeaderSamples(
      Array.isArray(headerExamples)
        ? [...headerExamples]
        : headerExamples
        ? [headerExamples]
        : [],
    );
    setIsFormOpen(true);
  };

  const buildComponents = (
    values: TemplateFormValues,
    samples: { body: string[]; header: string[] },
  ) => {
    const components: TemplateComponent[] = [];
    if (values.headerText?.trim()) {
      const header: TemplateComponent = {
        type: 'HEADER',
        format: 'TEXT',
        text: values.headerText.trim(),
      };
      if (samples.header.length > 0) {
        header.example = { header_text: samples.header };
      }
      components.push(header);
    }
    const body: TemplateComponent = {
      type: 'BODY',
      text: values.bodyText.trim(),
    };
    if (samples.body.length > 0) {
      body.example = { body_text: [samples.body] };
    }
    components.push(body);
    if (values.footerText?.trim()) {
      components.push({
        type: 'FOOTER',
        text: values.footerText.trim(),
      });
    }
    return components;
  };

  const onSubmit = async (values: TemplateFormValues) => {
    if (!currentCompany) return;
    setFormError(null);
    setError(null);

    const sanitizedName = values.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!sanitizedName) {
      setFormError('Template name must use lowercase letters, numbers, or underscores.');
      return;
    }

    const headerText = values.headerText?.trim();
    const bodyText = values.bodyText.trim();
    const footerText = values.footerText?.trim();

    if (!bodyText) {
      setFormError('Body text is required.');
      return;
    }
    if (bodyText.length > 1024) {
      setFormError('Body text cannot exceed 1024 characters.');
      return;
    }
    if (headerText && headerText.length > 60) {
      setFormError('Header text cannot exceed 60 characters.');
      return;
    }
    if (footerText && footerText.length > 60) {
      setFormError('Footer text cannot exceed 60 characters.');
      return;
    }
    const placeholderError = validatePlaceholderUsage(bodyText);
    if (placeholderError) {
      setFormError(placeholderError);
      return;
    }
    if (bodyPlaceholderIndexes.length > 0) {
      for (let i = 0; i < bodyPlaceholderIndexes.length; i += 1) {
        if (!bodySamples[i] || !bodySamples[i].trim()) {
          setFormError(`Provide sample text for placeholder {{${i + 1}}}.`);
          return;
        }
      }
    }
    if (headerPlaceholderIndexes.length > 0) {
      for (let i = 0; i < headerPlaceholderIndexes.length; i += 1) {
        if (!headerSamples[i] || !headerSamples[i].trim()) {
          setFormError(`Provide sample text for header placeholder {{${i + 1}}}.`);
          return;
        }
      }
    }

    const payload: TemplatePayload = {
      name: sanitizedName,
      category: values.category,
      language: values.language.trim(),
      components: buildComponents(
        {
          ...values,
          headerText,
          bodyText,
          footerText,
        },
        { body: bodySamples.map((sample) => sample.trim()), header: headerSamples.map((s) => s.trim()) },
      ),
    };

    try {
      if (editingTemplate) {
        await templatesApi.update(currentCompany, editingTemplate.id, payload);
      } else {
        await templatesApi.create(currentCompany, payload);
      }
      setIsFormOpen(false);
      setEditingTemplate(null);
      reset();
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Unable to save template.');
    }
  };

  const handleDelete = async (template: Template) => {
    if (!currentCompany) return;
    const confirmed = window.confirm(`Delete template "${template.name}"?`);
    if (!confirmed) return;
    await templatesApi.remove(currentCompany, template.id);
    refetch();
  };

  const handleSubmitToMeta = async (template: Template) => {
    if (!currentCompany) return;
    setError(null);
    try {
      await templatesApi.submit(currentCompany, template.id);
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit template');
    }
  };

  const handleSync = async () => {
    if (!currentCompany) return;
    setError(null);
    try {
      await templatesApi.sync(currentCompany);
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync templates');
    }
  };

  if (!currentCompany) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-gray-600 mt-2">Manage your WhatsApp message templates</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a company first to view templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-gray-600 mt-2">
            Templates from your WhatsApp Business Account
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isRefetching || isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Syncing...' : 'Sync Templates'}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load templates. Make sure WhatsApp is connected for this company.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      ) : templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(template.status)}
                    {getCategoryBadge(template.category)}
                  </div>
                </div>
                <CardTitle className="mt-2">{template.name}</CardTitle>
                <CardDescription>
                  Language: {template.language.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderTemplateContent(template)}
                {template.rejectionReason && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                    Rejection reason: {template.rejectionReason}
                  </div>
                )}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={template.status !== 'DRAFT'}
                    onClick={() => handleSubmitToMeta(template)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit to Meta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center border-2 border-dashed rounded-lg">
          <div className="text-center p-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">No templates found</p>
            <p className="text-xs text-gray-500 mb-4">
              Templates will appear here once they&apos;re created in Meta Business Manager
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>

    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit template' : 'Create template'}</DialogTitle>
          <DialogDescription>
            Template names must be lowercase and can include numbers or underscores. Body section is
            required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template name *</Label>
              <Input id="name" placeholder="welcome_offer" {...register('name', { required: true })} />
              <p className="text-xs text-gray-500">Lowercase letters, numbers, and underscores.</p>
            </div>
            <div className="space-y-2">
              <Label>Language *</Label>
              <Input id="language" placeholder="en_US" {...register('language', { required: true })} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) =>
                  setValue('category', value as TemplateFormValues['category'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Header (optional)</Label>
              <Input placeholder="Welcome to our store!" {...register('headerText')} />
            </div>
          </div>
          {headerPlaceholderIndexes.length > 0 && (
            <div className="space-y-2">
              <Label>Header sample values *</Label>
              <div className="space-y-2">
                {headerPlaceholderIndexes.map((index) => (
                  <Input
                    key={`header-sample-${index}`}
                    placeholder={`Sample for header {{${index}}}`}
                    value={headerSamples[index - 1] || ''}
                    onChange={(e) => {
                      const next = [...headerSamples];
                      next[index - 1] = e.target.value;
                      setHeaderSamples(next);
                    }}
                    required
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Body *</Label>
            <Textarea
              placeholder="Hi {{1}}, thanks for contacting us..."
              className="min-h-[140px]"
              {...register('bodyText', { required: true })}
            />
            <p className="text-xs text-gray-500">
              Use placeholders like &#123;&#123;1&#125;&#125; for variables.
            </p>
          </div>

          {bodyPlaceholderIndexes.length > 0 && (
            <div className="space-y-2">
              <Label>Body sample values *</Label>
              <div className="space-y-2">
                {bodyPlaceholderIndexes.map((index) => (
                  <Input
                    key={`body-sample-${index}`}
                    placeholder={`Sample for {{${index}}}`}
                    value={bodySamples[index - 1] || ''}
                    onChange={(e) => {
                      const next = [...bodySamples];
                      next[index - 1] = e.target.value;
                      setBodySamples(next);
                    }}
                    required
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                WhatsApp requires sample text for each placeholder before review.{' '}
                <Link
                  href="https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Learn more
                </Link>
                .
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Footer (optional)</Label>
            <Input placeholder="Reply STOP to unsubscribe" {...register('footerText')} />
          </div>

          {formError && (
            <div className="text-sm text-red-600">{formError}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

function validatePlaceholderUsage(text: string): string | null {
  const regex = /{{(\d+)}}/g;
  const indices = new Set<number>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const index = parseInt(match[1], 10);
    if (!index || index < 1) {
      return 'Placeholder indexes must start from {{1}}.';
    }
    if (index > 10) {
      return 'A maximum of 10 placeholders ({{1}} to {{10}}) are allowed.';
    }
    indices.add(index);
  }

  if (indices.size > 0) {
    const max = Math.max(...Array.from(indices.values()));
    for (let i = 1; i <= max; i += 1) {
      if (!indices.has(i)) {
        return 'Placeholders must be sequential without gaps ({{1}}, {{2}}, ...).';
      }
    }
  }

  return null;
}