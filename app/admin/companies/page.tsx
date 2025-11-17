'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Company } from '@/lib/api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2, XCircle, MessageSquare, Users, Send } from 'lucide-react';
import Link from 'next/link';

export default function AdminCompaniesPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', page],
    queryFn: () => adminApi.getAllCompanies(page, 50),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: adminApi.toggleCompanyStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Management</h1>
        <p className="text-gray-600 mt-2">Manage all companies on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>
            Total: {data?.meta.total || 0} companies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.data.map((company: Company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{company.name}</p>
                      {company.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Inactive
                        </Badge>
                      )}
                      {company.whatsappConnected && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          WhatsApp Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Owner: {company.owner.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {company._count.users} users
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {company._count.messages} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {company._count.campaigns} campaigns
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatusMutation.mutate(company.id)}
                  >
                    {company.isActive ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



