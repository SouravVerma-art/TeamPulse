"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { name: "Dashboard", href: "/" },
  { name: "Agents", href: "/agents" },
  { name: "Insights", href: "/insights" },
  { name: "Settings", href: "/settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-canvas-off-white relative">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-gutter">
        {/* Logo */}
        <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-black transition-transform group-hover:scale-105">
            <span className="text-[20px] font-semibold leading-none text-white">t</span>
          </div>
          <span className="text-[20px] font-semibold tracking-tight text-ink-black">
            TeamPulse
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "border-b-2 pb-1 font-mono text-sm tracking-wide transition-colors",
                  isActive
                    ? "border-ink-black text-ink-black"
                    : "border-transparent text-on-surface-variant hover:text-ink-black"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        </div>
        <button
          type="button"
          onClick={() => {
            console.log("Mobile menu toggled. Prev state:", isMenuOpen);
            setIsMenuOpen(!isMenuOpen);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-ink-black md:hidden"
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMenuOpen}
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-20 left-0 right-0 z-50 bg-white border-b border-outline-variant p-gutter shadow-sm md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={clsx(
                    "font-mono text-sm tracking-wider transition-colors py-2",
                    isActive
                      ? "text-ink-black font-medium"
                      : "text-on-surface-variant hover:text-ink-black"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
