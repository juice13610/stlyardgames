"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/games", label: "Games" },
  { href: "/book", label: "Book Now" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#service-area", label: "Service Area" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/stlyardgames.png"
              alt="STL Yard Games"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-bold text-green-800 text-lg hidden sm:block">
              STL Yard Games
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 hover:text-green-700 font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              Reserve Now
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-gray-700 font-medium py-2 hover:text-green-700"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="bg-green-700 text-white px-4 py-3 rounded-lg font-semibold text-center hover:bg-green-800"
            onClick={() => setOpen(false)}
          >
            Reserve Now
          </Link>
        </div>
      )}
    </header>
  );
}
