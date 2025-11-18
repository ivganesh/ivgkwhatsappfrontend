'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-600" />
          Super Admin Dashboard
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          Super Admin
        </Badge>
        <Avatar>
          <AvatarFallback>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}




