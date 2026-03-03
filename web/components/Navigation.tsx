'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect for enhanced backdrop
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on escape key
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
      href: 'https://zipminator.zip',
      description: 'Quantum-secure file encryption',
      current: true
    },
    {
      name: 'QDaria Platform',
      href: 'https://qdaria.com',
      description: 'Enterprise quantum solutions'
    },
    {
      name: 'Quantum SDK',
      href: 'https://qdaria.com/technology/sdk',
      description: 'Developer tools for quantum computing'
    },
  ]

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Demo', href: '/demo' },
    { name: 'Impact', href: '/impact' },
    { name: 'Documentation', href: 'https://docs.zipminator.zip' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'GitHub', href: 'https://github.com/qdaria/zipminator-pqc' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/40'
        : 'bg-transparent backdrop-blur-sm border-b border-transparent'
        }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding Section */}
          <div className="flex items-center space-x-4 lg:space-x-8">
            {/* Zipminator Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-quantum-500 rounded-lg px-1"
              aria-label="Zipminator homepage"
            >
              <img
                src="/logos/z.svg"
                alt="Zipminator Logomark"
                className="h-8 w-auto transform group-hover:scale-110 transition-transform duration-200"
              />
              <img
                src="/logos/zipminator.svg"
                alt="Zipminator Wordmark"
                className="h-6 w-auto hidden sm:block transform group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>

            {/* Visual Separator */}
            <div className="hidden lg:block h-6 w-px bg-gray-700" aria-hidden="true" />

            {/* Breadcrumb Trail */}
            <nav
              className="hidden lg:flex items-center text-sm text-gray-400"
              aria-label="Breadcrumb"
            >
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    href="https://qdaria.com"
                    className="hover:text-quantum-400 transition-colors focus:outline-none focus:text-quantum-400"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="w-4 h-4" />
                </li>
                <li>
                  <Link
                    href="https://qdaria.com/technology/products"
                    className="hover:text-quantum-400 transition-colors focus:outline-none focus:text-quantum-400"
                  >
                    Products
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="w-4 h-4" />
                </li>
                <li>
                  <span className="text-quantum-400 font-semibold" aria-current="page">
                    Zipminator
                  </span>
                </li>
              </ol>
            </nav>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
                onFocus={() => setIsProductsOpen(true)}
                onBlur={(e) => {
                  // Keep open if focus moves to dropdown
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                    setIsProductsOpen(false)
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-quantum-500"
                aria-expanded={isProductsOpen}
                aria-haspopup="true"
              >
                <span className="font-medium">Products</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProductsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setIsProductsOpen(true)}
                    onMouseLeave={() => setIsProductsOpen(false)}
                    className="absolute top-full left-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
                    role="menu"
                    aria-label="Products menu"
                  >
                    {products.map((product) => (
                      <Link
                        key={product.name}
                        href={product.href}
                        className={`block px-5 py-4 hover:bg-gray-800/60 transition-colors ${product.current ? 'bg-quantum-900/20 border-l-4 border-quantum-500' : ''
                          }`}
                        role="menuitem"
                      >
                        <div className={`font-semibold ${product.current ? 'text-quantum-400' : 'text-gray-200'}`}>
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                        {product.current && (
                          <div className="text-xs text-quantum-500 mt-1 font-medium">Current Product</div>
                        )}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Regular Nav Links */}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-quantum-500"
              >
                {link.name}
              </Link>
            ))}

            {/* CTA Button */}
            <Link
              href="#demo"
              className="ml-2 btn-primary focus:outline-none focus:ring-2 focus:ring-quantum-400 focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              Request Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-quantum-500"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-xl"
          >
            <div className="container-custom py-4 space-y-2">
              {/* Mobile Products Dropdown */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  className="flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all font-medium"
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
                      className="pl-4 space-y-1"
                    >
                      {products.map((product) => (
                        <Link
                          key={product.name}
                          href={product.href}
                          className={`block py-3 px-3 rounded-lg hover:bg-gray-800/50 transition-colors ${product.current ? 'bg-quantum-900/20 text-quantum-400' : 'text-gray-300'
                            }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block py-3 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile CTA Button */}
              <Link
                href="#demo"
                className="block w-full text-center btn-primary mt-4"
                onClick={() => setIsOpen(false)}
              >
                Request Demo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navigation
