'use client';

import { useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Users, FileDown, Loader2, Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { contactsApi, type Contact, type ContactPayload } from '@/lib/api/contacts';
import { cn } from '@/lib/utils';

interface ContactFormValues {
  name?: string;
  phone: string;
  email?: string;
  tags?: string;
}

export default function ContactsPage() {
  const { currentCompany } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [importPreview, setImportPreview] = useState<ContactPayload[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    processed: number;
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      tags: '',
    },
  });

  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['contacts', currentCompany, page],
    queryFn: async () => {
      if (!currentCompany) {
        throw new Error('No company selected');
      }
      return contactsApi.list(currentCompany, page, 25);
    },
    enabled: !!currentCompany,
  });

  const contacts = data?.data || [];
  const meta = data?.meta;

  const filteredContacts = useMemo(() => {
    if (!search.trim()) {
      return contacts;
    }
    const term = search.toLowerCase();
    return contacts.filter((contact) => {
      return (
        contact.phone.toLowerCase().includes(term) ||
        contact.name?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [contacts, search]);

  const openCreateDialog = () => {
    setSelectedContact(null);
    reset({
      name: '',
      phone: '',
      email: '',
      tags: '',
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    reset({
      name: contact.name || '',
      phone: contact.phone,
      email: contact.email || '',
      tags: contact.tags?.join(', ') || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: ContactFormValues) => {
    if (!currentCompany) {
      return;
    }

    const payload: ContactPayload = {
      phone: values.phone.trim(),
      name: values.name?.trim() || undefined,
      email: values.email?.trim() || undefined,
      tags:
        values.tags
          ?.split(',')
          .map((tag) => tag.trim())
          .filter(Boolean) || [],
    };

    if (selectedContact) {
      await contactsApi.update(currentCompany, selectedContact.id, payload);
    } else {
      await contactsApi.create(currentCompany, payload);
    }

    setIsFormOpen(false);
    setSelectedContact(null);
    reset();
    refetch();
  };

  const handleDelete = async (contact: Contact) => {
    if (!currentCompany) return;
    const confirmed = window.confirm(`Delete contact ${contact.name || contact.phone}?`);
    if (!confirmed) return;
    await contactsApi.delete(currentCompany, contact.id);
    refetch();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportSummary(null);
    setImportError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setImportError('No file selected');
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.error) {
      setImportError(parsed.error);
      setImportPreview([]);
      return;
    }
    setImportPreview(parsed.contacts);
  };

  const handleImport = async () => {
    if (!currentCompany) return;
    if (importPreview.length === 0) {
      setImportError('No contacts to import. Please upload a CSV file.');
      return;
    }

    const response = await contactsApi.import(currentCompany, importPreview);
    if (response?.summary) {
      setImportSummary(response.summary);
    }
    setImportPreview([]);
    setImportError(null);
    refetch();
  };

  const downloadSample = () => {
    const sample = 'name,phone,email,tags\nJohn Doe,+1234567890,john@example.com,VIP;Lead';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contacts-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <p className="text-gray-600">
          Manage your WhatsApp audience. Add contacts manually or import from a CSV file.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Contact List</CardTitle>
            <CardDescription>Keep your contact list synced and organized.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadSample}>
              <FileDown className="mr-2 h-4 w-4" />
              Sample CSV
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-4"
              />
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {data?.meta.total || 0} contacts
            </div>
          </div>

          <div className="overflow-hidden border rounded-lg">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No contacts found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {contact.name || 'Unnamed contact'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Last active:{' '}
                            {contact.lastMessageAt
                              ? new Date(contact.lastMessageAt).toLocaleString()
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.length === 0 ? (
                            <span className="text-gray-400 text-xs">No tags</span>
                          ) : (
                            contact.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-gray-900"
                          onClick={() => openEditDialog(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(contact)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === meta.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Contact */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit contact' : 'Add new contact'}</DialogTitle>
            <DialogDescription>
              {selectedContact
                ? 'Update the contact details below.'
                : 'Enter the contact information to start sending messages.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="John Doe" {...register('name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                required
                {...register('phone', { required: true })}
              />
              <p className="text-xs text-gray-500">
                Use the international format (e.g., +919876543210).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" {...register('email')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Textarea
                id="tags"
                placeholder="VIP, Lead, Follow-up"
                {...register('tags')}
                className="min-h-[70px]"
              />
              <p className="text-xs text-gray-500">
                Separate tags with commas. Example: VIP, High Value, Demo
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedContact ? 'Save changes' : 'Create contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Contacts */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import contacts from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with the columns: name, phone, email, tags. Tags can be separated by
              semicolons.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
            {importError && <p className="text-sm text-red-600">{importError}</p>}

            {importPreview.length > 0 && (
              <div className="rounded-md border bg-gray-50 p-4">
                <p className="text-sm font-medium">
                  Preview ({importPreview.length} contacts ready to import)
                </p>
                <div className="mt-3 max-h-48 overflow-y-auto text-sm">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="pr-4">Name</th>
                        <th className="pr-4">Phone</th>
                        <th className="pr-4">Email</th>
                        <th>Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 5).map((contact, index) => (
                        <tr key={`${contact.phone}-${index}`} className="text-gray-700">
                          <td className="pr-4 py-1">{contact.name || '—'}</td>
                          <td className="pr-4 py-1">{contact.phone}</td>
                          <td className="pr-4 py-1">{contact.email || '—'}</td>
                          <td className="py-1">
                            {contact.tags && contact.tags.length > 0
                              ? contact.tags.join(', ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.length > 5 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Showing first 5 contacts out of {importPreview.length}.
                    </p>
                  )}
                </div>
              </div>
            )}

            {importSummary && (
              <div className="rounded-md border bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">Import summary</p>
                <p>Processed: {importSummary.processed}</p>
                <p>Created: {importSummary.created}</p>
                <p>Updated: {importSummary.updated}</p>
                <p>Skipped: {importSummary.skipped}</p>
              </div>
            )}

            <DialogFooter className={cn('gap-2')}>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Close
              </Button>
              <Button disabled={importPreview.length === 0} onClick={handleImport}>
                {importPreview.length === 0 ? 'Select a file' : 'Import contacts'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseCsv(text: string): { contacts: ContactPayload[]; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { contacts: [], error: 'CSV file is empty.' };
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return { contacts: [], error: 'CSV must contain a header row and at least one data row.' };
  }

  const headers = lines[0]
    .split(',')
    .map((header) => header.trim().toLowerCase());

  const requiredHeaders = ['phone'];
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      return { contacts: [], error: `Missing required column: ${header}` };
    }
  }

  const contacts: ContactPayload[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvRow(lines[i]);
    if (row.length === 0) continue;

    const contact: ContactPayload = {
      phone: row[headers.indexOf('phone')]?.trim() || '',
      name: headers.includes('name') ? row[headers.indexOf('name')]?.trim() : undefined,
      email: headers.includes('email') ? row[headers.indexOf('email')]?.trim() : undefined,
      tags: [],
    };

    if (!contact.phone) {
      continue;
    }

    if (headers.includes('tags')) {
      const tagsRaw = row[headers.indexOf('tags')];
      if (tagsRaw) {
        contact.tags = tagsRaw
          .split(/[,;]+/)
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }

    contacts.push(contact);
  }

  return { contacts };
}

function splitCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    result.push(current.trim());
  }

  return result;
}


