"use client"

import Link from "next/link"
import { useAuth } from "../authProvider"
import BrandLink from "./BrandLink"
import MobileNavbar from "./MobileNavbar"
import AccountDropdown from "./AccountDropdown"
import CategoryDropdown from "./CategoryDropdown"
import { Search, CircleUser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


export default function Navbar({className}) {
    const auth = useAuth()
    const finalClass = className ? className : "sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"
    
    return (
        <header className={finalClass}>
            {/* Mobile Navigation */}
            <MobileNavbar />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:flex-row md:items-center md:gap-6 w-full">
                {/* Left section: Brand and Menu Items */}
                <div className="flex items-center gap-6">
                    <BrandLink displayName={true} />
                    
                    <CategoryDropdown />
                    
                    <Link
                        href="/blog/posts"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Blog
                    </Link>
                </div>
                
                {/* Middle section: Search */}
                <div className="flex flex-1 items-center gap-2 md:max-w-md ml-6">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="h-9 bg-muted/50 border-0 focus:bg-background"
                    />
                </div>
                
                {/* Right section: Account */}
                <div className="ml-auto flex items-center gap-4">
                    {auth.isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{auth.username}</span>
                            <AccountDropdown />
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                        >
                            <Link href="/login">Login</Link>
                        </Button>
                    )}
                </div>
            </nav>
            
            {/* Mobile Brand - shown only on mobile */}
            <div className="md:hidden">
                <BrandLink displayName={true} />
            </div>
        </header>
    )
}