'use client'

import { useState } from 'react'
import { Mail, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SubscribeModal from './modals/SubscribeModal'
import AboutModal from './modals/AboutModal'
import ContactModal from './modals/ContactModal'
import CopyrightModal from './modals/CopyrightModal'

export default function Footer() {
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [copyrightOpen, setCopyrightOpen] = useState(false)

  return (
    <>
      <footer className="border-t bg-background mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Left: Copyright Info */}
            <div className="flex flex-col items-start md:items-center">
              <p className="text-sm text-muted-foreground">
                © 2026 Monsters Eat Austin
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setCopyrightOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground p-0 mt-2"
              >
                View full copyright
              </Button>
            </div>

            {/* Center: Quick Links */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Links</h3>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubscribeOpen(true)}
                >
                  Subscribe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAboutOpen(true)}
                >
                  About
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContactOpen(true)}
                >
                  Contact
                </Button>
              </div>
            </div>

            {/* Right: Social & Brand */}
            <div className="flex flex-col items-end md:items-center">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> in Austin
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-8">
            <p className="text-xs text-muted-foreground text-center">
              Monsters Eat Austin - A Blog About Local Food & Culture
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SubscribeModal open={subscribeOpen} onOpenChange={setSubscribeOpen} />
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
      <CopyrightModal open={copyrightOpen} onOpenChange={setCopyrightOpen} />
    </>
  )
}
