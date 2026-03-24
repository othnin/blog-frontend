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
import { ChevronDown, PenSquare } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import CreatePostModal from './modals/CreatePostModal';

export default function BlogDropdown() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setUserRole(null);
      return;
    }
    fetch(API_ENDPOINTS.auth.me)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUserRole(data.profile?.role); })
      .catch(() => {});
  }, [isAuthenticated, authLoading]);

  const canCreatePost = userRole === 'editor' || userRole === 'admin';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground gap-1 px-2 h-auto py-1"
          >
            Blog
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem asChild>
            <Link href="/blog/posts">All Posts</Link>
          </DropdownMenuItem>
          {canCreatePost && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTimeout(() => setModalOpen(true), 0)}>
                <PenSquare className="h-4 w-4 mr-2" />
                Create Post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canCreatePost && (
        <CreatePostModal open={modalOpen} onOpenChange={setModalOpen} />
      )}
    </>
  );
}
