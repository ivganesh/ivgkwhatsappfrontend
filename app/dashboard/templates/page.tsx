'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-gray-600 mt-2">Manage your WhatsApp message templates</p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-gray-400" />
              <Badge variant="outline">Draft</Badge>
            </div>
            <CardTitle className="mt-2">Welcome Message</CardTitle>
            <CardDescription>Template for welcoming new customers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Edit Template
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center border-2 border-dashed rounded-lg">
          <div className="text-center p-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">No templates yet</p>
            <Link href="/dashboard/templates/new">
              <Button variant="outline">Create Your First Template</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



