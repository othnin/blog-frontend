"use client"

import Link from "next/link"
import { Menu, Dna } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "../authProvider"

import NavLinks, {NonUserLinks} from './NavLinks'
import BrandLink from "./BrandLink"



export default function MobileNavbar({className}) {
    const auth = useAuth()
    return   <Sheet>
    <SheetTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 md:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="left">
      <nav className="grid gap-6 text-lg font-medium">
        <BrandLink displayName={true} className="flex items-center gap-2 text-lg font-semibold" />
        
        {NavLinks.map((navLinkItem, idx)=>{
          const shouldHide = !auth.isAuthenticated &&navLinkItem.authRequired

          return shouldHide ? null : <Link
              href={navLinkItem.href}
              key={`nav-links-b-${idx}`}
              className="text-muted-foreground hover:text-foreground"
          >
              {navLinkItem.label}
          </Link>
      })}
        
        <Link href="/recipes" className="text-muted-foreground hover:text-foreground">
          All Recipes
        </Link>
        <Link href="/map" className="text-muted-foreground hover:text-foreground">
          Restaurant Map
        </Link>
        {/* The Thales lab lives on the Django backend; /lab redirects to it. */}
        <Link href="/lab" prefetch={false} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Dna className="h-4 w-4" />
          Thales
        </Link>
        {auth.isAuthenticated && (
          <Link href="/home/create-recipe" className="text-muted-foreground hover:text-foreground">
            Add Recipe
          </Link>
        )}

        {auth.isAuthenticated ?
        <Link href="/logout" className="text-muted-foreground hover:text-foreground">
          Logout
        </Link>
        : <>
          {NonUserLinks.map((navLinkItem, idx)=>{
              const shouldHide = !auth.isAuthenticated &&navLinkItem.authRequired

              return shouldHide ? null : <Link
                  href={navLinkItem.href}
                  key={`nav-links-c-${idx}`}
                  className="text-muted-foreground hover:text-foreground"
              >
                  {navLinkItem.label}
              </Link>
          })}
      </>}
      </nav>
    </SheetContent>
  </Sheet>
}