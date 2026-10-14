'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, MapPin } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';

export default function MapDropdown() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setUserRole(null);
      return;
    }
    fetchWithAuth(API_ENDPOINTS.auth.me)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUserRole(data.profile?.role); })
      .catch(() => {});
  }, [isAuthenticated, authLoading]);

  const canManage = userRole === 'editor' || userRole === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-foreground gap-1 px-2 h-auto py-1"
        >
          Map
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <Link href="/map">Restaurant Map</Link>
        </DropdownMenuItem>
        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/locations">
                <MapPin className="h-4 w-4 mr-2" />
                Manage Locations
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
