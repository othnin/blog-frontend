'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { Users, FileText, Heart, FolderOpen, Eye, MessageSquare, TrendingUp, BookOpen, UserPlus } from 'lucide-react';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { PostTrendChart } from '@/components/admin/PostTrendChart';
import { TopPostsList } from '@/components/admin/TopPostsList';
import { ActiveUsersChart } from '@/components/admin/ActiveUsersChart';

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="border rounded-lg p-5 bg-card">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground">
        {value === null ? '—' : value?.toLocaleString()}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_ENDPOINTS.admin.dashboard)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard stats');
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading stats...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Site overview and key metrics</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.total_users} />
        <StatCard icon={FileText} label="Total Posts" value={stats.total_posts} />
        <StatCard icon={BookOpen} label="Published" value={stats.published_posts} color="text-green-600" />
        <StatCard icon={TrendingUp} label="Drafts" value={stats.draft_posts} color="text-yellow-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={stats.total_views} color="text-blue-600" />
        <StatCard icon={Heart} label="Total Likes" value={stats.total_likes} color="text-rose-500" />
        <StatCard icon={MessageSquare} label="Comments" value={stats.total_comments} color="text-violet-600" />
        <StatCard icon={FolderOpen} label="Categories" value={stats.total_categories} color="text-orange-600" />
      </div>

      <div className="mb-8">
        <StatCard icon={UserPlus} label="New Users This Month" value={stats.new_users_this_month} color="text-blue-600" />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <UserGrowthChart />
          <PostTrendChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopPostsList />
          <ActiveUsersChart />
        </div>
      </div>
    </div>
  );
}
