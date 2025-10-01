'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold text-neutral-900">SignalRunner</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Pricing
            </Link>
            <Link href="/#faq" className="text-neutral-600 hover:text-neutral-900 transition-colors">
              FAQ
            </Link>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/accounts"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
                >
                  Accounts
                </Link>
                <Link
                  href="/contacts"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
                >
                  Contacts
                </Link>
                <div className="h-4 w-px bg-neutral-300"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-semibold">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
                >
                  Sign up
                </Link>
                <Link
                  href="/start"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-neutral-600" />
            ) : (
              <Menu className="h-6 w-6 text-neutral-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col space-y-3">
              <Link
                href="/#features"
                className="text-neutral-600 hover:text-neutral-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-neutral-600 hover:text-neutral-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/#faq"
                className="text-neutral-600 hover:text-neutral-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>

              {user ? (
                <>
                  <div className="h-px bg-neutral-200 my-2"></div>
                  <Link
                    href="/accounts"
                    className="text-neutral-600 hover:text-neutral-900 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Accounts
                  </Link>
                  <Link
                    href="/contacts"
                    className="text-neutral-600 hover:text-neutral-900 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contacts
                  </Link>
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-semibold">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-neutral-600 text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="text-red-600 hover:text-red-700 transition-colors py-2 text-left font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-neutral-200 my-2"></div>
                  <Link
                    href="/login"
                    className="text-neutral-600 hover:text-neutral-900 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="text-neutral-600 hover:text-neutral-900 transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/start"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
