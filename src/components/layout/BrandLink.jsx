"use client"

import Link from "next/link"
import { Zap } from "lucide-react"

export default function BrandLink({displayName, className}){
    const finalClass = className ? className : "flex items-center gap-2 text-lg font-semibold md:text-base"
    return <Link
        href="/"
        className={finalClass}
    >
        <Zap className="h-6 w-6 text-orange-500" />
        {displayName ? 
             <span className="text-foreground">Monsters Eat Austin</span>
            : 
            <span className="sr-only">Monsters Eat Austin</span>
        }
    </Link>
}