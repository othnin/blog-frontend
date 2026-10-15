"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CircleUser, Home, Settings, Shield, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "../authProvider"
import SettingsModal from "../SettingsModal"


export default function AccountDropdown() {
    const auth = useAuth()
    const router = useRouter()
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                        {auth.avatar ? (
                            <img src={auth.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                            <CircleUser className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{auth.username ? auth.username : "Account"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/home')}>
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </DropdownMenuItem>
                    {auth.role === 'admin' && (
                        <DropdownMenuItem onClick={() => router.push('/admin')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Admin
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/logout')}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    )
}
