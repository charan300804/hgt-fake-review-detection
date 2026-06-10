'use client'

import { motion } from 'framer-motion'
import {
  Shield, Target, Users, Database, Cpu, Network,
  BookOpen, Award, Globe, Zap, CheckCircle, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PageType = 'home' | 'about' | 'how-it-works' | 'model-architecture' | 'real-time-detection' | 'dashboard' | 'documentation'

export default function AboutPage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const objectives = [
    {
      icon: Target,
      title: 'Accurate Detection',
      description: 'Achieve high accuracy in identifying fake reviews using advanced graph neural networks and transformer attention mechanisms.'
    },
    {
      icon: Network,
      title: 'Relational Learning',
      description: 'Capture complex relationships between users, products, and reviews through heterogeneous graph construction.'
    },
    {
      icon: Zap,
      title: 'Real-Time Inference',
      description: 'Provide instant fraud detection with optimized model inference for production deployment.'
    },
    {
      icon: Database,
      title: 'Scalable Architecture',
      description: 'Design a system that can handle millions of reviews with distributed processing capabilities.'
    }
  ]

  const technologies = [
    { name: 'PyTorch', category: 'Deep Learning', description: 'Neural network framework for model development' },
    { name: 'PyTorch Geometric', category: 'Graph ML', description: 'Library for graph neural networks' },
    { name: 'FastAPI', category: 'Backend', description: 'High-performance Python API framework' },
    { name: 'Next.js', category: 'Frontend', description: 'React framework for web applications' },
    { name: 'MongoDB', category: 'Database', description: 'NoSQL database for flexible schema' },
    { name: 'TF-IDF / BERT', category: 'NLP', description: 'Text embedding techniques for review analysis' },
    { name: 'NLTK', category: 'NLP', description: 'Text preprocessing and lemmatization' },
    { name: 'Scikit-learn', category: 'ML', description: 'Machine learning utilities and metrics' }
  ]

  const timeline = [
    {
      phase: 'Phase 1',
      title: 'Data Collection & Preprocessing',
      items: [
        'Ingest real-world review datasets with fraud labels',
        'Remove missing values and clean special characters',
        'Apply tokenization, stopword removal, lemmatization',
        'Generate TF-IDF embeddings for text representation'
      ]
    },
    {
      phase: 'Phase 2',
      title: 'Graph Construction',
      items: [
        'Define node types: User, Review, Product',
        'Create edge types: wrote, belongs to',
        'Extract behavioral and metadata features',
        'Build heterogeneous graph structure'
      ]
    },
    {
      phase: 'Phase 3',
      title: 'Model Development',
      items: [
        'Implement HGT convolution layers',
        'Design attention mechanisms for relations',
        'Create classification and auxiliary heads',
        'Train with cross-entropy loss and Adam optimizer'
      ]
    },
    {
      phase: 'Phase 4',
      title: 'Deployment & Integration',
      items: [
        'Build FastAPI backend for inference',
        'Create interactive frontend dashboard',
        'Implement real-time detection pipeline',
        'Deploy to cloud infrastructure'
      ]
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 py-20">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-teal-100 text-teal-700 px-4 py-1">
              <BookOpen className="w-3 h-3 mr-1" />
              About the Project
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Heterogeneous Graph Transformer-Based{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Fraud Detection
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              A comprehensive research project aimed at detecting fake reviews in online shopping
              platforms using state-of-the-art graph neural networks and transformer architectures.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">The Problem</h2>
              <p className="text-lg text-slate-600 mb-6">
                Fake reviews have become a significant problem in e-commerce platforms, affecting
                consumer trust and purchasing decisions. Studies show that:
              </p>
              <ul className="space-y-4">
                {[
                  'Over 30% of online reviews are estimated to be fake or misleading',
                  'Fake reviews cost consumers billions annually in misguided purchases',
                  'Traditional detection methods fail to capture complex fraud patterns',
                  'Coordinated spam networks evade simple detection algorithms'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-sm font-bold">!</span>
                    </div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Solution</h2>
              <p className="text-lg text-slate-600 mb-6">
                We propose a novel approach using Heterogeneous Graph Transformers that:
              </p>
              <ul className="space-y-4">
                {[
                  'Models complex relationships between users, products, and reviews',
                  'Learns type-specific attention weights for different relations',
                  'Detects coordinated fraud patterns through graph structure',
                  'Provides interpretable risk factors for each prediction'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Project Objectives</h2>
            <p className="text-lg text-slate-600">Key goals we aim to achieve with this system</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {objectives.map((objective, index) => (
              <motion.div
                key={objective.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center border-slate-200 bg-white hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-4">
                      <objective.icon className="w-7 h-7 text-teal-600" />
                    </div>
                    <CardTitle className="text-lg">{objective.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      {objective.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Technology Stack</h2>
            <p className="text-lg text-slate-600">Modern tools and frameworks powering our system</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{tech.name}</h3>
                    <p className="text-xs text-slate-500">{tech.category}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Timeline */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Development Timeline</h2>
            <p className="text-lg text-slate-600">Our systematic approach to building the system</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeline.map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm z-10">
                  {index + 1}
                </div>
                <Card className="pt-12 border-slate-200 bg-white">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit text-teal-600 border-teal-200">
                      {phase.phase}
                    </Badge>
                    <CardTitle className="text-lg mt-2">{phase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Explore the System
            </h2>
            <p className="text-xl text-teal-100 mb-10">
              Learn how our HGT model works or try the real-time detection demo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-teal-700 hover:bg-teal-50 px-8 py-6"
                onClick={() => onNavigate('how-it-works')}
              >
                How It Works
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-6"
                onClick={() => onNavigate('real-time-detection')}
              >
                Try Detection
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
