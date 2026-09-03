"use client";

import React, { useState, useEffect } from "react";
import { Search, X, User, FileText, MessageSquare } from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

const TypeIcon = ({ type }) => {
  switch (type) {
    case "user":
      return <User className="w-4 h-4 text-blue-600" />;
    case "post":
      return <FileText className="w-4 h-4 text-green-600" />;
    case "comment":
      return <MessageSquare className="w-4 h-4 text-violet-600" />;
    default:
      return null;
  }
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.admin.search}?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
        title="Search admin (Ctrl+K)"
      >
        <Search className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-background border border-border rounded-lg shadow-lg">
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users, posts, comments... (min 2 chars)"
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
              <button
                onClick={handleClose}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  Searching...
                </div>
              )}

              {!loading && results.length === 0 && query.length >= 2 && (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  No results found
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="divide-y divide-border">
                  {results.map((result) => (
                    <a
                      key={`${result.type}-${result.id}`}
                      href={getResultLink(result)}
                      onClick={handleClose}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <TypeIcon type={result.type} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {result.name || result.author}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {result.description}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {result.type}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getResultLink(result) {
  switch (result.type) {
    case "user":
      return `/admin/users?id=${result.id}`;
    case "post":
      return `/dashboard/edit/${result.id}`;
    case "comment":
      return `/blog/${result.post_id}#comment-${result.id}`;
    default:
      return "#";
  }
}
