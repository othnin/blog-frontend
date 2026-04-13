'use client';

import { useAuth } from '@/components/authProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { LayoutDashboard, Users, FileText, ChefHat, FolderOpen, Tag, ArrowLeft } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/posts', label: 'Blog Posts', icon: FileText },
  { href: '/admin/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
];

export default function AdminLayout({ children }) {
  const { isAuthenticated, username, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchWithAuth('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const userRole = data?.profile?.role;
        setRole(userRole);
        if (userRole !== 'admin') router.push('/dashboard');
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setRoleLoading(false));
  }, [isAuthenticated, loading, router]);

  if (loading || roleLoading || role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-muted/30 flex flex-col py-6 px-3 shrink-0">
        <div className="mb-6 px-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Admin</p>
          <p className="text-sm font-medium text-foreground">{username}</p>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
