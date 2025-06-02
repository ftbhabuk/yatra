"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

export default function NepalTourism() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f2e8] p-4">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-[#0f1419] shadow-2xl">
        {/* Logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-10 h-10 rounded-full border border-white/80 flex items-center justify-center">
            <div className="w-8 h-[1px] bg-white/80"></div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left side - Image */}
          <div className="relative w-full md:w-3/5 h-[500px] md:h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f1419] z-[1] md:hidden"></div>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f1419]/30 z-[1] hidden md:block"></div>
            <Image
              // src="/placeholder.svg?height=600&width=800"
              src='/anja-lee-ming-becker-0vewXPT9NO0-unsplash.jpg'
              alt="View of Himalayan mountains with a person looking at the vista"
              fill
              className="object-cover"
              priority
            />

            {/* Bottom left tagline */}
            <div className="absolute bottom-12 left-8 z-10">
              <h2 className="text-white text-4xl md:text-5xl font-serif">Breathe. Trek. Discover.</h2>
            </div>

            {/* Bottom left brand name */}
            <div className="absolute bottom-6 left-8 z-10">
              <p className="text-white/70 text-sm">himalayan.journeys</p>
            </div>

            {/* Bottom center navigation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span>treks</span>
                <span className="text-white">+</span>
                <span>culture</span>
                <span className="text-white">+</span>
                <span>adventure</span>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="relative w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center">
            <div className="max-w-md">
              <h1 className="text-white text-4xl md:text-5xl font-serif mb-4">Experience Nepal's hidden wonders.</h1>
              <p className="text-white/70 text-lg mb-8">
                From ancient temples to majestic peaks. Let's craft your perfect adventure.
              </p>
              <Link
                href="/create-trip"
                className="inline-block px-6 py-3 border border-white/30 text-white rounded-full hover:bg-white/10 transition-colors"
              >
                Plan your journey
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden flex items-center justify-center gap-2 text-white/70 text-sm pb-6">
          <span>treks</span>
          <span className="text-white">+</span>
          <span>culture</span>
          <span className="text-white">+</span>
          <span>adventure</span>
        </div>
      </div>
    </div>
  )
}

