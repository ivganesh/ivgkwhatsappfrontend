'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Send } from 'lucide-react';
import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600 mt-2">Create and manage bulk messaging campaigns</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Welcome Campaign</CardTitle>
                <CardDescription>Send welcome messages to new customers</CardDescription>
              </div>
              <Badge variant="outline">Draft</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span>0 contacts</span>
                <span className="mx-2">•</span>
                <span>Not scheduled</span>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-12">
          <div className="text-center">
            <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">No campaigns yet</p>
            <Link href="/dashboard/campaigns/new">
              <Button variant="outline">Create Your First Campaign</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




