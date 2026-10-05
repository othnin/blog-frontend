'use client'

import { Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SubscribeModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] flex flex-col items-center justify-center min-h-[400px]">
        <style jsx>{`
          @keyframes stampRotate {
            0% { transform: rotate(-15deg); }
            100% { transform: rotate(-15deg); }
          }
          .stamp {
            font-size: 4rem;
            font-weight: bold;
            color: rgba(239, 68, 68, 0.7);
            border: 3px solid rgba(239, 68, 68, 0.7);
            border-radius: 8px;
            padding: 1rem 2rem;
            white-space: nowrap;
            pointer-events: none;
            z-index: 50;
            text-transform: uppercase;
            letter-spacing: 2px;
            animation: stampRotate 0.5s ease-out;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            transform: rotate(-15deg);
          }
        `}</style>

        <div className="absolute inset-0 bg-black/20 rounded-lg pointer-events-none z-40" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Subscribe to Our Blog
          </DialogTitle>
          <DialogDescription>
            Get the latest posts delivered to your inbox. No spam, just great content about Austin&apos;s food scene.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 opacity-50 pointer-events-none">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              placeholder="your@email.com"
              disabled
            />
          </div>
          <Button type="button" className="w-full" disabled>
            Subscribe
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>

        <div className="stamp">Coming Soon</div>
      </DialogContent>
    </Dialog>
  )
}
