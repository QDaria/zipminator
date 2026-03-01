'use client'

import { motion } from 'framer-motion'
import { Building2, Heart, ShieldCheck, Cloud, Database, Lock } from 'lucide-react'

const useCases = [
  {
    icon: Building2,
    title: 'Financial Services',
    description: 'Protect transactions, customer data, and financial records against quantum threats',
    features: [
      'Quantum-secure transactions',
      'Regulatory compliance',
      'Zero-knowledge proofs',
      'Secure customer data',
    ],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Heart,
    title: 'Healthcare',
    description: 'HIPAA-compliant encryption for patient records and medical data',
    features: [
      'Patient data protection',
      'HIPAA compliance',
      'Medical records security',
      'Research data protection',
    ],
    gradient: 'from-red-500 to-pink-500',
  },
  {
    icon: ShieldCheck,
    title: 'Government & Defense',
    description: 'NIST-approved cryptography for classified and sensitive information',
    features: [
      'Classified data protection',
      'NIST compliance',
      'Military-grade security',
      'Critical infrastructure',
    ],
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Cloud,
    title: 'Cloud Providers',
    description: 'Offer quantum-secure storage and services to enterprise customers',
    features: [
      'Quantum-secure cloud storage',
      'Enterprise data protection',
      'Multi-tenant security',
      'API integration',
    ],
    gradient: 'from-purple-500 to-indigo-500',
  },
]

const additionalUseCases = [
  {
    icon: Database,
    title: 'Data Centers',
    description: 'Protect stored data at rest',
  },
  {
    icon: Lock,
    title: 'IoT & Edge',
    description: 'Secure device communication',
  },
]

const UseCases = () => {
  return (
    <section className="section-padding bg-gray-900/50">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Industry-Leading</span> Use Cases
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Quantum-secure encryption for every industry and application
          </p>
        </motion.div>

        {/* Main Use Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="card-quantum h-full hover:scale-105 transition-all duration-300">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${useCase.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <useCase.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4">{useCase.title}</h3>

                {/* Description */}
                <p className="text-gray-400 mb-6">{useCase.description}</p>

                {/* Features */}
                <div className="space-y-2">
                  {useCase.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${useCase.gradient}`} />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Use Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {additionalUseCases.map((useCase) => (
            <div
              key={useCase.title}
              className="flex items-center space-x-4 bg-gray-900/30 rounded-lg p-6 border border-gray-800 hover:border-quantum-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-quantum-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <useCase.icon className="w-6 h-6 text-quantum-400" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">{useCase.title}</div>
                <div className="text-sm text-gray-400">{useCase.description}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-400 mb-6">
            Need a custom solution for your industry?
          </p>
          <a href="#demo" className="btn-primary inline-block">
            Talk to Our Experts
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default UseCases
