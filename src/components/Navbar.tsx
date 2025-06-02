"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Create a context for scroll state
const ScrollContext = React.createContext({ isScrolled: false })
const useScrollContext = () => React.useContext(ScrollContext)

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled ? "bg-[#0f1419]/90 backdrop-blur-md py-3" : "bg-transparent py-6",
      )}
    >
      <ScrollContext.Provider value={{ isScrolled }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${isScrolled ? "border-white/80" : "border-black/80"}`}
              >
                <div className={`w-6 h-[1px] ${isScrolled ? "bg-white/80" : "bg-black/80"}`}></div>
              </div>
              <span className={`font-serif text-xl hidden sm:inline-block ${isScrolled ? "text-white" : "text-black"}`}>
                Hamro Guide
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink href="/destinations">Destinations</NavLink>
              <NavLink href="/experiences">Experiences</NavLink>
              <NavLink href="/treks">Treks</NavLink>
              <NavLink href="/culture">Culture</NavLink>
              <NavLink href="/about">About</NavLink>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Link
                href="/create-trip"
                className={`inline-block px-5 py-2 border rounded-full transition-colors text-sm ${
                  isScrolled
                    ? "border-white/30 text-white hover:bg-white/10"
                    : "border-black/30 text-black hover:bg-black/10"
                }`}
              >
                Plan your journey
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden ${isScrolled ? "text-white" : "text-black"}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </ScrollContext.Provider>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 bg-[#0f1419]/95 backdrop-blur-md z-40 transition-transform duration-300 ease-in-out md:hidden pt-20",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex flex-col items-center justify-center space-y-6 p-8 h-full">
          <MobileNavLink href="/destinations" onClick={() => setIsMobileMenuOpen(false)}>
            Destinations
          </MobileNavLink>
          <MobileNavLink href="/experiences" onClick={() => setIsMobileMenuOpen(false)}>
            Experiences
          </MobileNavLink>
          <MobileNavLink href="/treks" onClick={() => setIsMobileMenuOpen(false)}>
            Treks
          </MobileNavLink>
          <MobileNavLink href="/culture" onClick={() => setIsMobileMenuOpen(false)}>
            Culture
          </MobileNavLink>
          <MobileNavLink href="/about" onClick={() => setIsMobileMenuOpen(false)}>
            About
          </MobileNavLink>
          <div className="pt-6">
            <Link
              href="/contact"
              className="inline-block px-8 py-3 border border-white/30 text-white rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Plan your journey
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { isScrolled } = useScrollContext()
  return (
    <Link
      href={href}
      className={`text-sm font-medium relative group ${isScrolled ? "text-white/80 hover:text-white" : "text-black/80 hover:text-black"}`}
    >
      {children}
      <span
        className={`absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isScrolled ? "bg-white" : "bg-black"}`}
      ></span>
    </Link>
  )
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="text-white/90 hover:text-white text-2xl font-serif" onClick={onClick}>
      {children}
    </Link>
  )
}

