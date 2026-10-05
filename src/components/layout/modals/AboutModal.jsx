'use client'

import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import PhotoGallery from '@/components/PhotoGallery'

const ABOUT_PHOTOS = [
  { src: '/art/cubism.png', alt: 'Cubism' },
  { src: '/art/fearandloathing.png', alt: 'Fear and Loathing' },
  { src: '/art/impressionism.png', alt: 'Impressionism' },
  { src: '/art/nixon.jpg', alt: 'Nixon' },
  { src: '/art/popart.png', alt: 'Pop Art' },
  { src: '/art/renassance.png', alt: 'Renaissance' },
  { src: '/art/surrealism.png', alt: 'Surrealism' },
  { src: '/art/thescream.png', alt: 'The Scream' },
  { src: '/art/vj_day.png', alt: 'VJ Day' },
]

export default function AboutModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
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
              We are a collaborative platform exploring the intersection of science, software, food culture, and innovation. From computational breakthroughs to culinary discoveries, we celebrate the vibrant creative community in Austin across technology, research, and dining.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Our Mission</h3>
            <p className="text-sm text-muted-foreground">
              We share knowledge and insights that advance understanding in science, software engineering, and local food culture. Through technical deep-dives, interviews, and explorations, we celebrate the bold creators pushing boundaries in tech, research, and culinary arts.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">What We Cover</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Computational Biology & Bioinformatics</li>
              <li>• Machine Learning & AI</li>
              <li>• Software Architecture & Best Practices</li>
              <li>• Restaurant Reviews & Local Food Culture</li>
              <li>• Recipes & Cooking Tips</li>
              <li>• Open Source & Food Innovation</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">Join Our Community</h3>
            <p className="text-sm text-muted-foreground">
              Whether you&apos;re a researcher, developer, foodie, or curious learner, we invite you to join us. Subscribe to stay updated on insights across science, software, and Austin&apos;s vibrant food scene!
            </p>
          </div>

          <div className="border-t pt-6">
            <PhotoGallery photos={ABOUT_PHOTOS} title="About Me" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
