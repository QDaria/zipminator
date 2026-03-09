'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface SlideWrapperProps {
  children: React.ReactNode
  className?: string
}

export default function SlideWrapper({
  children,
  className = '',
}: SlideWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`relative h-full flex flex-col px-8 md:px-16 lg:px-24 pt-6 pb-20 max-w-7xl mx-auto overflow-y-auto ${className}`}
    >
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <Image
          src="/logos/QDaria_logo_teal Large.png"
          alt="QDaria"
          width={160}
          height={64}
          className="opacity-40 hover:opacity-80 transition-opacity pointer-events-auto"
        />
      </div>
      {children}
    </motion.div>
  )
}
