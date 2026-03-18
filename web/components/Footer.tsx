'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs#api' },
    { name: 'Pricing', href: '/invest' },
    { name: 'Changelog', href: 'https://github.com/qdaria/zipminator-pqc/releases' },
    { name: 'GitHub Repository', href: 'https://github.com/qdaria/zipminator-pqc' },
  ]

  const qdariaProducts = [
    {
      name: 'QDaria Platform',
      href: 'https://qdaria.com',
      description: 'Complete quantum security suite'
    },
    {
      name: 'Zipminator-PQC',
      href: '/',
      description: 'Quantum-secure encryption',
      current: true
    },
    {
      name: 'Quantum SDK',
      href: '/technology#sdk',
      description: 'Developer toolkit'
    },
    {
      name: 'Enterprise Solutions',
      href: '/technology#enterprise',
      description: 'Custom quantum security'
    },
  ]

  const companyLinks = [
    { name: 'About QDaria', href: '/impact' },
    { name: 'Careers', href: 'mailto:careers@qdaria.com' },
    { name: 'Blog', href: 'https://github.com/qdaria/zipminator-pqc/releases' },
    { name: 'Contact', href: 'mailto:contact@qdaria.com' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ]

  const socialLinks = [
    {
      icon: Github,
      href: 'https://github.com/qdaria/zipminator-pqc',
      label: 'GitHub'
    },
    {
      icon: Twitter,
      href: 'https://twitter.com/qdaria',
      label: 'Twitter'
    },
    {
      icon: Linkedin,
      href: 'https://linkedin.com/company/qdaria',
      label: 'LinkedIn'
    },
    {
      icon: Mail,
      href: 'mailto:contact@qdaria.com',
      label: 'Email'
    },
  ]

  return (
    <footer className="relative bg-gray-950 border-t border-white/[0.08] overflow-hidden">
      {/* Subtle quantum grid pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(99, 102, 241) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(99, 102, 241) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem'
        }} />
      </div>

      {/* Main Footer Content */}
      <div className="relative container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Branding */}
          <div className="space-y-6">
            {/* Zipminator Logo */}
            <div>
              <Link href="/" className="inline-block mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <span className="text-white font-bold text-2xl">Z</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Zipminator</div>
                  </div>
                </div>
              </Link>

              {/* By QDaria tagline */}
              <Link
                href="https://qdaria.com"
                className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-quantum-400 transition-colors mt-2"
              >
                <span>by</span>
                <span className="font-semibold">QDaria</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Brief description */}
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Quantum-secure encryption powered by real quantum hardware. Built for the post-quantum era.
            </p>

            {/* Social media icons */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-all duration-200 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-quantum-400 transition-colors duration-200" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-quantum-400 transition-colors text-sm inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: QDaria Products */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              QDaria Products
            </h3>
            <ul className="space-y-3">
              {qdariaProducts.map((product) => (
                <li key={product.name}>
                  <Link
                    href={product.href}
                    className={`group block ${
                      product.current
                        ? 'text-quantum-400'
                        : 'text-gray-400 hover:text-quantum-400'
                    } transition-colors text-sm`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={product.current ? 'font-medium' : ''}>
                        {product.name}
                      </span>
                      {product.current && (
                        <span className="px-2 py-0.5 bg-quantum-500/20 text-quantum-400 text-xs rounded-full border border-quantum-500/30">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors">
                      {product.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Explore all products link */}
            <Link
              href="/technology"
              className="inline-flex items-center space-x-2 text-sm text-quantum-400 hover:text-quantum-300 transition-colors mt-4 group"
            >
              <span>Explore all products</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-quantum-400 transition-colors text-sm inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/[0.06]">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span>© {currentYear} QDaria. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <div className="hidden md:flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-quantum-500 rounded-full animate-pulse" />
                <span>Built with quantum-secure technology</span>
              </div>
            </div>

            {/* Legal links */}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-quantum-400 transition-colors">
                Privacy
              </Link>
              <span>|</span>
              <Link href="/terms" className="hover:text-quantum-400 transition-colors">
                Terms
              </Link>
              <span>|</span>
              <Link href="/privacy#cookies" className="hover:text-quantum-400 transition-colors">
                Cookies
              </Link>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-4 h-4 bg-blue-600 rounded group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-gray-400 transition-colors">NIST FIPS 203 Standard</span>
              </div>
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-4 h-4 bg-green-600 rounded group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-gray-400 transition-colors">Memory-Safe Rust</span>
              </div>
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-4 h-4 bg-quantum-600 rounded group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-gray-400 transition-colors">Quantum-Secure</span>
              </div>
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-4 h-4 bg-purple-600 rounded group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-gray-400 transition-colors">SOC 2 Roadmap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
