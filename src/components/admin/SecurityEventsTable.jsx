'use client';

import React, { useState, useMemo } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import useSWR from 'swr';
import { AlertTriangle, AlertCircle, Shield, Filter, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SEVERITY_COLORS = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
  critical: 'text-red-600 bg-red-50',
};

const SEVERITY_ICONS = {
  info: Shield,
  warning: AlertCircle,
  critical: AlertTriangle,
};

export function SecurityEventsTable() {
  const [eventType, setEventType] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (eventType) params.append('event_type', eventType);
    if (ipAddress) params.append('ip', ipAddress);
    if (searchMessage) params.append('search', searchMessage);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return params.toString();
  }, [eventType, ipAddress, searchMessage, startDate, endDate]);

  const url = queryParams
    ? `${API_ENDPOINTS.admin.securityEvents}?${queryParams}`
    : API_ENDPOINTS.admin.securityEvents;

  const { data: events, isLoading, error } = useSWR(url, async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load security events');
    return response.json();
  });

  const clearFilters = () => {
    setEventType('');
    setIpAddress('');
    setSearchMessage('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    eventType || ipAddress || searchMessage || startDate || endDate;

  const eventTypes = [
    { value: 'permission_denied', label: 'Permission Denied (403)' },
    { value: 'rate_limited', label: 'Rate Limited (429)' },
    { value: 'email_send_failed', label: 'Email Send Failed' },
    { value: 'storage_failed', label: 'Storage Failed' },
    { value: 'elevated_error_rate', label: 'Elevated Error Rate (5xx)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Events</CardTitle>
        <CardDescription>
          Monitor security and system events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Event Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              >
                <option value="">All Types</option>
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* IP Address */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 192.168.1.1"
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
              />
            </div>

            {/* Search Message */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Search Message
              </label>
              <input
                type="text"
                value={searchMessage}
                onChange={(e) => setSearchMessage(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Loading/Error/Empty states */}
        {isLoading && (
          <p className="text-center text-muted-foreground py-8">Loading events...</p>
        )}
        {error && (
          <p className="text-center text-destructive py-8">Failed to load events</p>
        )}
        {events?.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">No events found</p>
        )}

        {/* Events Table */}
        {events && events.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Severity</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const IconComponent = SEVERITY_ICONS[event.severity] || Shield;
                  return (
                    <TableRow key={event.id} className="hover:bg-muted">
                      <TableCell>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${SEVERITY_COLORS[event.severity]}`}>
                          <IconComponent className="w-3 h-3" />
                          <span className="capitalize">{event.severity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="px-2 py-1 bg-muted rounded text-xs font-mono">
                          {event.event_type.replace(/_/g, '_')}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-xs truncate">
                        {event.message}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {event.ip_address}
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.username ? (
                          <span className="text-muted-foreground">{event.username}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
