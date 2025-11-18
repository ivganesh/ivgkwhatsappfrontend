'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.push('/auth/login');
    } else if (!user.isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [accessToken, user, router]);

  if (!accessToken || !user || !user.isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}




