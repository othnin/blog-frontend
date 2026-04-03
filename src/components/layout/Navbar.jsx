"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "../authProvider"
import BrandLink from "./BrandLink"
import MobileNavbar from "./MobileNavbar"
import AccountDropdown from "./AccountDropdown"
import CategoryDropdown from "./CategoryDropdown"
import BlogDropdown from "./BlogDropdown"
import { Search, CircleUser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


export default function Navbar({className}) {
    const auth = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const finalClass = className ? className : "sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"

    const [searchValue, setSearchValue] = useState('')

    useEffect(() => {
        if (pathname !== '/blog/posts') {
            setSearchValue('')
        }
    }, [pathname])

    const handleSearchKeyDown = (e) => {
        if (e.key !== 'Enter') return
        const params = new URLSearchParams()
        if (searchValue.trim()) {
            params.set('search', searchValue.trim())
        }
        router.push(`/blog/posts${params.toString() ? `?${params.toString()}` : ''}`)
    }
    
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

                    <BlogDropdown />

                    <Link
                        href="/recipes"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Recipes
                    </Link>
                </div>
                
                {/* Middle section: Search */}
                <div className="flex flex-1 items-center gap-2 md:max-w-md ml-6">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="h-9 bg-muted/50 border-0 focus:bg-background"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
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