'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function CopyrightModal({ open, onOpenChange }) {
  const currentYear = new Date().getFullYear()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Copyright & Legal Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Copyright Notice</h3>
            <p className="text-sm text-muted-foreground">
              © {currentYear} Monsters Eat Austin. All rights reserved. The content, images, and materials on this website are the exclusive property of Monsters Eat Austin and are protected by international copyright laws.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">License Grant</h3>
            <p className="text-sm text-muted-foreground">
              You may access, view, and print pages from this website for your personal, non-commercial use. Any other use is strictly prohibited. The content may not be copied, reproduced, modified, or distributed without explicit written permission from Monsters Eat Austin.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Intellectual Property</h3>
            <p className="text-sm text-muted-foreground">
              All trademarks, logos, and brand names mentioned on this website are the property of their respective owners. The "Monsters Eat Austin" name and logo are exclusive trademarks of this publication.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Third-Party Content</h3>
            <p className="text-sm text-muted-foreground">
              When we feature restaurants, chefs, or products, all rights to those respective businesses and their content remain with the original owners. We cite and credit all sources appropriately.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Disclaimer</h3>
            <p className="text-sm text-muted-foreground">
              The opinions expressed on this blog are those of the authors and do not necessarily reflect the views of any business, brand, or individual mentioned. We are not responsible for third-party content, external links, or user-generated comments.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Contact for Permissions</h3>
            <p className="text-sm text-muted-foreground">
              For inquiries regarding permissions, licensing, or copyright issues, please contact us at{' '}
              <a href="mailto:legal@monsterseataustin.com" className="text-primary hover:underline">
                legal@monsterseataustin.com
              </a>
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
