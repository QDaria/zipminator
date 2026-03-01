'use client'

import { motion, useInView } from 'framer-motion'
import { Download, Settings, Lock, Rocket, Copy, Check } from 'lucide-react'
import { useRef, useState } from 'react'

const steps = [
  {
    number: 1,
    icon: Download,
    title: 'Install in Seconds',
    description: 'Quick setup with Python, Rust, C++, or Node.js packages',
    color: 'from-blue-500 to-cyan-500',
    codeExamples: {
      Python: 'pip install zipminator-pqc',
      Rust: 'cargo add zipminator-pqc',
      'Node.js': 'npm install zipminator-pqc',
      'C++': 'vcpkg install zipminator-pqc',
    },
  },
  {
    number: 2,
    icon: Settings,
    title: 'Configure Your Keys',
    description: 'Generate quantum-secure keypairs with real IBM entropy',
    color: 'from-purple-500 to-pink-500',
    codeExamples: {
      Python: `from zipminator import Kyber768

# Generate keypair
public_key, secret_key = Kyber768.keygen()`,
      Rust: `use zipminator::Kyber768;

// Generate keypair
let (public_key, secret_key) = Kyber768::keygen();`,
      'Node.js': `const { Kyber768 } = require('zipminator-pqc');

// Generate keypair
const { publicKey, secretKey } = Kyber768.keygen();`,
    },
  },
  {
    number: 3,
    icon: Lock,
    title: 'Encrypt Your Data',
    description: 'NIST FIPS 203 approved Kyber768 encryption in one line',
    color: 'from-green-500 to-emerald-500',
    codeExamples: {
      Python: `# Encrypt data
ciphertext, shared_secret = Kyber768.encapsulate(public_key)

# Decrypt data
recovered_secret = Kyber768.decapsulate(ciphertext, secret_key)`,
      Rust: `// Encrypt data
let (ciphertext, shared_secret) = Kyber768::encapsulate(&public_key);

// Decrypt data
let recovered_secret = Kyber768::decapsulate(&ciphertext, &secret_key);`,
      'Node.js': `// Encrypt data
const { ciphertext, sharedSecret } = Kyber768.encapsulate(publicKey);

// Decrypt data
const recoveredSecret = Kyber768.decapsulate(ciphertext, secretKey);`,
    },
  },
  {
    number: 4,
    icon: Rocket,
    title: 'Deploy with Confidence',
    description: 'Production-ready with monitoring, compliance, and support',
    color: 'from-orange-500 to-red-500',
    codeExamples: {
      Python: `# Production deployment
from zipminator import Kyber768, QuantumEntropy

# Use quantum entropy for maximum security
entropy = QuantumEntropy.from_ibm()
Kyber768.set_entropy_source(entropy)`,
      Rust: `// Production deployment
use zipminator::{Kyber768, QuantumEntropy};

// Use quantum entropy for maximum security
let entropy = QuantumEntropy::from_ibm();
Kyber768::set_entropy_source(entropy);`,
    },
  },
]

const HowItWorks = () => {
  const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({
    1: 'Python',
    2: 'Python',
    3: 'Python',
    4: 'Python',
  })
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({})
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const handleCopy = (stepNumber: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedStates({ ...copiedStates, [stepNumber]: true })
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [stepNumber]: false })
    }, 2000)
  }

  const handleLanguageChange = (stepNumber: number, language: string) => {
    setSelectedLanguages({ ...selectedLanguages, [stepNumber]: language })
  }

  return (
    <section ref={sectionRef} className="section-padding bg-gradient-to-b from-gray-900 via-gray-900/50 to-gray-900">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
            How to Get Started with <span className="gradient-text">Quantum Security</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Deploy quantum-resistant encryption in minutes, not months
          </p>
        </motion.div>

        {/* Desktop Horizontal Timeline */}
        <div className="hidden lg:block max-w-7xl mx-auto mb-20">
          {/* Timeline Line */}
          <div className="relative mb-16">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2" />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 -translate-y-1/2 origin-left"
            />

            {/* Step Circles */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg relative z-10`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`absolute top-20 text-center w-48`}>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${step.color} text-white mb-2`}>
                      Step {step.number}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Step Cards */}
          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group"
              >
                <div className="card-quantum h-full hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{step.description}</p>

                  {/* Language Tabs */}
                  <div className="flex gap-2 mb-3 overflow-x-auto">
                    {Object.keys(step.codeExamples).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(step.number, lang)}
                        className={`px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${selectedLanguages[step.number] === lang
                          ? `bg-gradient-to-r ${step.color} text-white`
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  {/* Code Snippet */}
                  <div className="relative">
                    <pre className="bg-black/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto border border-gray-800">
                      <code>{step.codeExamples[selectedLanguages[step.number] as keyof typeof step.codeExamples]}</code>
                    </pre>
                    <button
                      onClick={() =>
                        handleCopy(
                          step.number,
                          step.codeExamples[selectedLanguages[step.number] as keyof typeof step.codeExamples] || ''
                        )
                      }
                      className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedStates[step.number] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile Vertical Timeline */}
        <div className="lg:hidden max-w-2xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-800" />
            <motion.div
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 via-green-500 to-orange-500 origin-top"
            />

            {/* Steps */}
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative pl-24 pb-12 last:pb-0"
              >
                {/* Step Circle */}
                <div className={`absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg z-10`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Step Card */}
                <div className="card-quantum">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${step.color} text-white mb-3`}>
                    Step {step.number}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 mb-4">{step.description}</p>

                  {/* Language Tabs */}
                  <div className="flex gap-2 mb-3 overflow-x-auto">
                    {Object.keys(step.codeExamples).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(step.number, lang)}
                        className={`px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap ${selectedLanguages[step.number] === lang
                          ? `bg-gradient-to-r ${step.color} text-white`
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  {/* Code Snippet */}
                  <div className="relative">
                    <pre className="bg-black/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto border border-gray-800">
                      <code>{step.codeExamples[selectedLanguages[step.number] as keyof typeof step.codeExamples]}</code>
                    </pre>
                    <button
                      onClick={() =>
                        handleCopy(
                          step.number,
                          step.codeExamples[selectedLanguages[step.number] as keyof typeof step.codeExamples] || ''
                        )
                      }
                      className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedStates[step.number] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <a
            href="https://github.com/mosoftwareenterprises/zipminator-pqc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-quantum-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-quantum-500/50 transition-all duration-300 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            View Full Documentation
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
