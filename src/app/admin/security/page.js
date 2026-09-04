'use client';

import { SecurityEventsTable } from '@/components/admin/SecurityEventsTable';
import { Shield } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-destructive" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Events</h1>
          <p className="text-muted-foreground">Monitor security and system events in real time</p>
        </div>
      </div>

      <SecurityEventsTable />
    </div>
  );
}
