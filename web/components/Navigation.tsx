'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronDown, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthButton from '@/components/auth/AuthButton'
import { useTheme } from '@/components/ThemeProvider'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsProductsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const products = [
    {
      name: 'Zipminator-PQC',
      href: '/',
      description: 'Quantum-secure file encryption',
      current: true,
    },
    {
      name: 'QDaria Platform',
      href: 'https://qdaria.com',
      description: 'Enterprise quantum solutions',
    },
    {
      name: 'Quantum SDK',
      href: 'https://qdaria.com/technology/sdk',
      description: 'Developer tools for quantum computing',
    },
  ]

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Demo', href: '/demo' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Impact', href: '/impact' },
    { name: 'Invest', href: '/invest' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/40'
          : 'bg-transparent backdrop-blur-sm border-b border-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-4 group focus:outline-none focus:ring-2 focus:ring-quantum-500 rounded-lg px-1"
            aria-label="Zipminator homepage"
          >
            <Image
              src="/logos/Z-new.svg"
              alt="Zipminator"
              width={40}
              height={40}
              className="transform group-hover:scale-110 transition-transform duration-200"
              priority
            />
            <Image
              src={theme === 'dark' ? '/logos/Zipminator_0_light.svg' : '/logos/Zipminator_0.svg'}
              alt="Zipminator"
              width={140}
              height={24}
              className="hidden sm:block"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
                onFocus={() => setIsProductsOpen(true)}
                onBlur={(e) => {
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                    setIsProductsOpen(false)
                  }
                }}
                className="nav-glow flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium"
                aria-expanded={isProductsOpen}
                aria-haspopup="true"
              >
                <span>Products</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProductsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setIsProductsOpen(true)}
                    onMouseLeave={() => setIsProductsOpen(false)}
                    className="absolute top-full left-0 mt-1 w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
                    role="menu"
                  >
                    {products.map((product) => (
                      <Link
                        key={product.name}
                        href={product.href}
                        className={`block px-4 py-3 hover:bg-white/5 transition-colors ${
                          product.current ? 'bg-quantum-900/20 border-l-2 border-quantum-500' : ''
                        }`}
                        role="menuitem"
                      >
                        <div className={`text-sm font-semibold ${product.current ? 'text-quantum-400' : 'text-gray-200'}`}>
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{product.description}</div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nav Links */}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="nav-glow px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 font-medium"
              >
                {link.name}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="nav-glow p-2 text-gray-400 hover:text-white transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-gray-700/50 mx-1" aria-hidden="true" />

            {/* Auth */}
            <AuthButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-quantum-500"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl"
          >
            <div className="container-custom py-3 space-y-1">
              {/* Mobile Products */}
              <button
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                aria-expanded={isMobileProductsOpen}
              >
                <span>Products</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMobileProductsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-3 space-y-1"
                  >
                    {products.map((product) => (
                      <Link
                        key={product.name}
                        href={product.href}
                        className={`block py-2.5 px-3 rounded-lg text-sm hover:bg-white/5 transition-colors ${
                          product.current ? 'text-quantum-400' : 'text-gray-400'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{product.description}</div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block py-2.5 px-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Sign In */}
              <div className="pt-3 border-t border-gray-800">
                <Link
                  href="/auth/login"
                  className="block w-full text-center btn-primary text-sm py-2.5"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navigation
