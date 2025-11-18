'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText, RefreshCw, Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { whatsappApi } from '@/lib/api/whatsapp';
import { useAuthStore } from '@/lib/store/auth-store';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: Array<{
    type: string;
    format?: string;
    text?: string;
    buttons?: Array<{
      type: string;
      text?: string;
      url?: string;
    }>;
  }>;
}

export default function TemplatesPage() {
  const { currentCompany } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    data: templatesData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['whatsapp-templates', currentCompany],
    queryFn: async () => {
      if (!currentCompany) {
        throw new Error('No company selected');
      }
      return whatsappApi.getTemplates(currentCompany);
    },
    enabled: !!currentCompany,
    retry: 1,
  });

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

  const renderTemplateContent = (template: WhatsAppTemplate) => {
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
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Syncing...' : 'Sync Templates'}
          </Button>
          <Link href="/dashboard/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </Link>
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
      ) : templatesData?.templates && templatesData.templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(templatesData.templates as WhatsAppTemplate[]).map((template) => (
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
                <div className="pt-2 border-t">
                  <Button variant="outline" className="w-full" size="sm">
                    View Details
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
  );
}



