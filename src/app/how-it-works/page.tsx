'use client'

import { motion } from 'framer-motion'
import {
  Cpu, Database, Network, Search, Shield, Zap,
  FileText, Users, Package, ArrowRight, CheckCircle,
  MessageSquare, BarChart3, Layers
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PageType = 'home' | 'about' | 'how-it-works' | 'model-architecture' | 'real-time-detection' | 'dashboard' | 'documentation'

export default function HowItWorksPage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const steps = [
    {
      number: '01',
      title: 'Problem Objective',
      icon: Search,
      description: 'Define the core objective of the AI-based fraud detection system.',
      details: [
        'Build an AI-based system to detect fraudulent reviews.',
        'Learn behavioral patterns of users.',
        'Learn relational patterns between users, reviews, and products.',
        'Enhance trust and reliability in online shopping platforms.'
      ]
    },
    {
      number: '02',
      title: 'Dataset and Input Stage',
      icon: Database,
      description: 'Load real-world review datasets (like Amazon or Yelp) containing necessary attributes.',
      details: [
        'User ID: Unique identifier for the reviewer.',
        'Product ID: Unique identifier for the item.',
        'Review Text: The actual written feedback.',
        'Rating: Numerical score given by the user.',
        'Timestamp: Exact date and time of the review.',
        'Label: Ground truth marking the review as Fake or Genuine.'
      ]
    },
    {
      number: '03',
      title: 'Data Preprocessing',
      icon: FileText,
      description: 'Clean and transform raw data into a structured format ready for modeling.',
      details: [
        'Remove missing or null values.',
        'Remove special characters and extra symbols.',
        'Convert text to lowercase and remove stopwords.',
        'Perform tokenization and optional stemming/lemmatization.',
        'Encode categorical variables (User ID, Product ID).',
        'Normalize numerical features (Ratings, Timestamps).'
      ]
    },
    {
      number: '04',
      title: 'Heterogeneous Graph Construction',
      icon: Network,
      description: 'Build a complex graph mapping multi-entity relationships.',
      details: [
        'Create User, Product, and Review nodes.',
        'Build edges: User → writes → Review.',
        'Build edges: Review → belongs_to → Product.',
        'Capture behavioral patterns and suspicious activity clusters.',
        'Enable cross-product spam detection.'
      ]
    },
    {
      number: '05',
      title: 'Feature Representation',
      icon: Layers,
      description: 'Convert real-world data into dense mathematical representations.',
      details: [
        'Convert review text into embeddings (TF-IDF/BERT).',
        'Incorporate ratings as numerical features.',
        'Incorporate timestamps and votes as additional metadata.',
        'Initialize node features prior to processing.'
      ]
    },
    {
      number: '06',
      title: 'HGT Model Application',
      icon: Cpu,
      description: 'Apply the Heterogeneous Graph Transformer (HGT) as the intelligence core.',
      details: [
        'Perform type-specific node transformations.',
        'Apply relation-aware attention mechanisms.',
        'Enable message passing across varying node types.',
        'Utilize multi-head attention across heterogeneous edges.',
        'Learn hidden fraud patterns seamlessly.'
      ]
    },
    {
      number: '07',
      title: 'Model Training',
      icon: Zap,
      description: 'Train the model using supervised learning across labeled data splits.',
      details: [
        'Split dataset into 80% training and 20% testing.',
        'Apply cross-entropy loss to evaluate performance.',
        'Use optimization algorithms (e.g., Adam).',
        'Train continuously across multiple epochs.',
        'Monitor accuracy, precision, recall, and F1-score.'
      ]
    },
    {
      number: '08',
      title: 'Prediction Phase',
      icon: Shield,
      description: 'Execute real-time inference on new incoming reviews.',
      details: [
        'Accept a newly submitted review.',
        'Instantly connect the new node in the active graph.',
        'Perform a forward pass through the trained HGT model.',
        'Output final classification (FAKE or GENUINE).',
        'Provide probability confidence scores.'
      ]
    },
    {
      number: '09',
      title: 'Final Output',
      icon: CheckCircle,
      description: 'Deliver actionable results and scalable fraud detection.',
      details: [
        'Provide instant review classification results.',
        'Yield fraud detection insights and behavior clustering.',
        'Perform robust, scalable detection for live operations.',
        'Vastly improve platform trust and consumer safety.'
      ]
    }
  ]

  const fraudPatterns = [
    {
      pattern: 'Burst Review Activity',
      icon: Zap,
      description: 'Multiple reviews posted in a short time period by the same user',
      detection: 'Graph structure captures temporal connections between reviews'
    },
    {
      pattern: 'Repetitive Review Text',
      icon: MessageSquare,
      description: 'Similar or identical text across multiple reviews',
      detection: 'TF-IDF embeddings highlight text similarity patterns'
    },
    {
      pattern: 'Extreme Rating Patterns',
      icon: BarChart3,
      description: 'Consistently giving 1-star or 5-star ratings without variation',
      detection: 'Behavioral features encode rating deviation metrics'
    },
    {
      pattern: 'Coordinated Spam Networks',
      icon: Users,
      description: 'Groups of users posting fake reviews for the same products',
      detection: 'Graph attention identifies suspicious user-product connections'
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 py-20">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-cyan-100 text-cyan-700 px-4 py-1">
              <Cpu className="w-3 h-3 mr-1" />
              How It Works
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              From Raw Data to{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                Fraud Detection
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              A step-by-step guide through our comprehensive fraud detection pipeline,
              from data ingestion to real-time inference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Process Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      {step.number}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-cyan-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-lg text-slate-600 mb-6">{step.description}</p>
                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <step.icon className="w-24 h-24 text-slate-300" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fraud Patterns */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Fraud Patterns We Detect</h2>
            <p className="text-lg text-slate-600">
              Our system identifies various fraud patterns through graph-based analysis
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {fraudPatterns.map((pattern, index) => (
              <motion.div
                key={pattern.pattern}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-slate-200 bg-white hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                        <pattern.icon className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pattern.pattern}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 mb-4">
                      {pattern.description}
                    </CardDescription>
                    <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                      <p className="text-sm text-teal-700">
                        <strong>Detection:</strong> {pattern.detection}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Graph Structure Visual */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Heterogeneous Graph Structure</h2>
              <p className="text-lg text-slate-600 mb-6">
                Our system constructs a graph with three types of nodes and two types of edges,
                enabling the model to learn complex relational patterns.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">User Nodes</h4>
                  </div>
                  <p className="text-sm text-blue-700">Contains behavioral features: review count, average rating, activity frequency</p>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-900">Review Nodes</h4>
                  </div>
                  <p className="text-sm text-emerald-700">Contains text embeddings (TF-IDF/BERT) + metadata features</p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Product Nodes</h4>
                  </div>
                  <p className="text-sm text-purple-700">Contains aggregated features: average rating, review count, category</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-8 relative overflow-hidden">
                {/* Graph visualization */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Edges */}
                  <line x1="50" y1="100" x2="100" y2="50" stroke="#10b981" strokeWidth="2" strokeDasharray="4" />
                  <line x1="50" y1="100" x2="100" y2="100" stroke="#10b981" strokeWidth="2" strokeDasharray="4" />
                  <line x1="50" y1="100" x2="100" y2="150" stroke="#10b981" strokeWidth="2" strokeDasharray="4" />
                  <line x1="100" y1="50" x2="150" y2="100" stroke="#8b5cf6" strokeWidth="2" />
                  <line x1="100" y1="100" x2="150" y2="100" stroke="#8b5cf6" strokeWidth="2" />
                  <line x1="100" y1="150" x2="150" y2="100" stroke="#8b5cf6" strokeWidth="2" />

                  {/* User Node */}
                  <circle cx="50" cy="100" r="20" fill="#3b82f6" />
                  <text x="50" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">User</text>

                  {/* Review Nodes */}
                  <circle cx="100" cy="50" r="16" fill="#10b981" />
                  <circle cx="100" cy="100" r="16" fill="#10b981" />
                  <circle cx="100" cy="150" r="16" fill="#10b981" />
                  <text x="100" y="54" textAnchor="middle" fill="white" fontSize="8">R1</text>
                  <text x="100" y="104" textAnchor="middle" fill="white" fontSize="8">R2</text>
                  <text x="100" y="154" textAnchor="middle" fill="white" fontSize="8">R3</text>

                  {/* Product Node */}
                  <circle cx="150" cy="100" r="20" fill="#8b5cf6" />
                  <text x="150" y="105" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Product</text>

                  {/* Edge Labels */}
                  <text x="70" y="70" fontSize="6" fill="#666">wrote</text>
                  <text x="125" y="70" fontSize="6" fill="#666">belongs to</text>
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-cyan-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Explore the Model Architecture
            </h2>
            <p className="text-xl text-cyan-100 mb-10">
              Dive deeper into the HGT model's attention mechanisms and neural network structure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-cyan-700 hover:bg-cyan-50 px-8 py-6"
                onClick={() => onNavigate('model-architecture')}
              >
                Model Architecture
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
