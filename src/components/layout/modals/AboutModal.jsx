'use client'

import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function AboutModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About Monsters Eat Austin
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Our Story</h3>
            <p className="text-sm text-muted-foreground">
              Monsters Eat Austin is a passionate blog dedicated to exploring the vibrant food culture and local dining scene of Austin, Texas. We celebrate the unique flavors, creative chefs, and food establishments that make Austin a premier destination for food enthusiasts.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-2">Our Mission</h3>
            <p className="text-sm text-muted-foreground">
              We aim to showcase the best culinary experiences Austin has to offer, from food trucks to fine dining, and help our community discover amazing places to eat. Through honest reviews and behind-the-scenes stories, we celebrate the "monsters" of Austin's food scene – the bold creators who are pushing boundaries and delighting our taste buds.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">What We Cover</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Restaurant Reviews & Recommendations</li>
              <li>• Food Truck Adventures</li>
              <li>• Local Chef Interviews</li>
              <li>• Food Events & Festivals</li>
              <li>• Recipes & Cooking Tips</li>
              <li>• Austin Food Culture</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Join Our Community</h3>
            <p className="text-sm text-muted-foreground">
              Whether you're a foodie, a casual diner, or someone looking to discover new flavors, we invite you to join our growing community of Austin food lovers. Subscribe to stay updated on the latest posts and food discoveries!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
