'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const { user, currentCompany } = useAuthStore();
  const company = user?.companies?.find((c) => c.id === currentCompany);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold">
          {company?.name || 'Select a company'}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}




