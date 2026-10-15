'use client';

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

export default function MapDropdown() {
  const { role } = useAuth();

  const canManage = role === 'editor' || role === 'admin';

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
              <Link href="/home/locations">
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
