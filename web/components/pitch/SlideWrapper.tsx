'use client'

import { motion } from 'framer-motion'

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
      className={`h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 pb-20 max-w-7xl mx-auto overflow-y-auto ${className}`}
    >
      {children}
    </motion.div>
  )
}
