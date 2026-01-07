"use client"

import Navbar from './Navbar'
import Footer from './Footer'


export default function BaseLayout({ children, className}) {
    const mainClassName = className ? className : "flex-1 gap-4 bg-muted/40 p-4 md:gap-8 md:p-10"
  return (
    <div className="flex flex-col min-h-screen w-full">
        <Navbar />
      <main className={mainClassName}>
      {children}
      </main>
      <Footer />
    </div>
  )
}
