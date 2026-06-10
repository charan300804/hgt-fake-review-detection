'use client'

import { motion } from 'framer-motion'
import {
  Layers, Cpu, Network, ArrowRight, Box, Zap,
  ArrowDown, ChevronRight, Code, Database
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PageType = 'home' | 'about' | 'how-it-works' | 'model-architecture' | 'real-time-detection' | 'dashboard' | 'documentation'

export default function ModelArchitecturePage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const architectureLayers = [
    {
      name: 'Input Layer',
      components: [
        { name: 'Text Features', dim: '5000', desc: 'TF-IDF vectors from preprocessed review text' },
        { name: 'Behavioral Features', dim: '6', desc: 'Rating, deviation, helpful ratio, vote count, extreme rating, user history' }
      ]
    },
    {
      name: 'Feature Encoders',
      components: [
        { name: 'Text Encoder', dim: '128', desc: 'Linear → LayerNorm → ReLU → Dropout' },
        { name: 'Behavioral Encoder', dim: '128', desc: 'Linear → LayerNorm → ReLU → Dropout' }
      ]
    },
    {
      name: 'Attention Layers',
      components: [
        { name: 'Multi-Head Self-Attention', dim: '128', desc: '4 heads, 2 layers with residual connections' },
        { name: 'Cross-Attention', dim: '128', desc: 'Q, K, V projections for feature fusion' }
      ]
    },
    {
      name: 'Output Heads',
      components: [
        { name: 'Classifier', dim: '2', desc: 'Linear(256→128→64→2) for genuine/fake prediction' },
        { name: 'Risk Detector', dim: '5', desc: 'Auxiliary network for risk factor analysis' }
      ]
    }
  ]

  const hgtMechanism = [
    {
      step: '1',
      title: 'Type-Specific Projections',
      formula: 'Q = W_Q^t · h_t,  K = W_K^r · h_s,  V = W_V^r · h_s',
      description: 'Each node type has separate projection matrices for Query, Key, and Value vectors.'
    },
    {
      step: '2',
      title: 'Attention Computation',
      formula: 'α = softmax((Q · K^T) / √d_k)',
      description: 'Scaled dot-product attention computed between connected nodes.'
    },
    {
      step: '3',
      title: 'Message Aggregation',
      formula: 'h\'_t = ∑_{s∈N(t)} α_{s→t} · V_s',
      description: 'Weighted aggregation of messages from neighboring nodes.'
    },
    {
      step: '4',
      title: 'Output Projection',
      formula: 'h\'\'_t = LayerNorm(h\'_t + W_skip · h_t)',
      description: 'Skip connection and layer normalization for stable training.'
    }
  ]

  const hyperparameters = [
    { name: 'Hidden Dimension', value: '128', desc: 'Size of hidden representations' },
    { name: 'Attention Heads', value: '4', desc: 'Number of parallel attention heads' },
    { name: 'Layers', value: '2', desc: 'Number of HGT convolution layers' },
    { name: 'Dropout', value: '0.3', desc: 'Regularization dropout rate' },
    { name: 'Learning Rate', value: '0.001', desc: 'Adam optimizer learning rate' },
    { name: 'Batch Size', value: '64', desc: 'Training batch size' },
    { name: 'Epochs', value: '50', desc: 'Maximum training epochs' },
    { name: 'Text Features', value: '5000', desc: 'TF-IDF vocabulary size' }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-20">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-violet-100 text-violet-700 px-4 py-1">
              <Layers className="w-3 h-3 mr-1" />
              Model Architecture
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Heterogeneous Graph{' '}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Transformer
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              A detailed look at the neural network architecture powering our fraud detection system,
              including attention mechanisms and feature processing pipelines.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Network Architecture</h2>
            <p className="text-lg text-slate-600">
              End-to-end pipeline from input features to fraud prediction
            </p>
          </motion.div>

          <div className="space-y-6">
            {architectureLayers.map((layer, layerIndex) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: layerIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {layerIndex + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{layer.name}</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {layer.components.map((comp, compIndex) => (
                    <Card key={comp.name} className="border-slate-200 bg-slate-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-900">{comp.name}</h4>
                          <Badge variant="outline" className="text-violet-600 border-violet-200">
                            dim={comp.dim}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{comp.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {layerIndex < architectureLayers.length - 1 && (
                  <div className="flex justify-center py-4">
                    <ArrowDown className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HGT Attention Mechanism */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">HGT Attention Mechanism</h2>
            <p className="text-lg text-slate-600">
              The core attention computation that enables type-specific learning
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {hgtMechanism.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-slate-200 bg-white">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {item.step}
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 rounded-lg bg-slate-100 font-mono text-sm mb-4 overflow-x-auto">
                      {item.formula}
                    </div>
                    <CardDescription className="text-slate-600">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Graph Schema */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Graph Schema</h2>
              <p className="text-lg text-slate-600 mb-6">
                The heterogeneous graph is defined by three node types and two edge types,
                creating a rich relational structure for fraud pattern detection.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-500" />
                    Node Types
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span><strong>User:</strong> Reviewers with behavioral features</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span><strong>Review:</strong> Individual review instances</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span><strong>Product:</strong> Items being reviewed</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Network className="w-4 h-4 text-violet-500" />
                    Edge Types
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-teal-500" />
                      <span><strong>(User, wrote, Review):</strong> Authorship relation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-teal-500" />
                      <span><strong>(Review, belongs to, Product):</strong> Product association</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-8">
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  {/* User nodes */}
                  <g>
                    <circle cx="60" cy="80" r="25" fill="#3b82f6" opacity="0.9" />
                    <text x="60" y="85" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">User</text>

                    <circle cx="60" cy="150" r="25" fill="#3b82f6" opacity="0.9" />
                    <text x="60" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">User</text>

                    <circle cx="60" cy="220" r="25" fill="#3b82f6" opacity="0.9" />
                    <text x="60" y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">User</text>
                  </g>

                  {/* Review nodes */}
                  <g>
                    <circle cx="150" cy="100" r="20" fill="#10b981" opacity="0.9" />
                    <text x="150" y="105" textAnchor="middle" fill="white" fontSize="9">Review</text>

                    <circle cx="150" cy="150" r="20" fill="#10b981" opacity="0.9" />
                    <text x="150" y="155" textAnchor="middle" fill="white" fontSize="9">Review</text>

                    <circle cx="150" cy="200" r="20" fill="#10b981" opacity="0.9" />
                    <text x="150" y="205" textAnchor="middle" fill="white" fontSize="9">Review</text>
                  </g>

                  {/* Product nodes */}
                  <g>
                    <circle cx="240" cy="120" r="25" fill="#8b5cf6" opacity="0.9" />
                    <text x="240" y="125" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Product</text>

                    <circle cx="240" cy="200" r="25" fill="#8b5cf6" opacity="0.9" />
                    <text x="240" y="205" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Product</text>
                  </g>

                  {/* Edges: User -> Review (writes) */}
                  <g stroke="#10b981" strokeWidth="2" fill="none" opacity="0.6">
                    <path d="M85 80 Q115 90 130 100" markerEnd="url(#arrowGreen)" />
                    <path d="M85 150 L130 150" markerEnd="url(#arrowGreen)" />
                    <path d="M85 220 Q115 210 130 200" markerEnd="url(#arrowGreen)" />
                  </g>

                  {/* Edges: Review -> Product (belongs_to) */}
                  <g stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.6">
                    <path d="M170 100 Q195 110 215 115" markerEnd="url(#arrowPurple)" />
                    <path d="M170 150 Q195 155 215 125" markerEnd="url(#arrowPurple)" />
                    <path d="M170 200 L215 200" markerEnd="url(#arrowPurple)" />
                  </g>

                  {/* Arrow markers */}
                  <defs>
                    <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                    </marker>
                    <marker id="arrowPurple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L9,3 z" fill="#8b5cf6" />
                    </marker>
                  </defs>

                  {/* Legend */}
                  <g transform="translate(20, 270)">
                    <rect x="0" y="0" width="260" height="25" fill="white" opacity="0.8" rx="4" />
                    <line x1="10" y1="12" x2="40" y2="12" stroke="#10b981" />
                    {/* Edge Labels */}
                    <g className="animate-fade-in" style={{ animationDelay: '2.5s', opacity: 0, animationFillMode: 'forwards' }}>
                      <text x="45" y="16" fontSize="8" fill="#666">wrote</text>
                      <text x="125" y="16" fontSize="8" fill="#666">belongs to</text>
                    </g>
                  </g>
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hyperparameters */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Hyperparameters</h2>
            <p className="text-lg text-slate-600">
              Optimized configuration for fraud detection performance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4">
            {hyperparameters.map((param, index) => (
              <motion.div
                key={param.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="text-center border-slate-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-violet-600 mb-1">{param.value}</div>
                    <div className="text-sm font-medium text-slate-900 mb-1">{param.name}</div>
                    <div className="text-xs text-slate-500">{param.desc}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Details */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Training Configuration</h2>
              <div className="space-y-4">
                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Loss Function
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      Cross-Entropy Loss for binary classification
                    </p>
                    <code className="text-xs bg-slate-100 p-2 rounded block">
                      Loss = -[y·log(p) + (1-y)·log(1-p)]
                    </code>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      Optimizer
                    </h4>
                    <p className="text-sm text-slate-600">
                      Adam optimizer with learning rate 0.001, β1=0.9, β2=0.999
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      Data Split
                    </h4>
                    <p className="text-sm text-slate-600">
                      80% Training, 10% Validation, 10% Test with stratified sampling
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Evaluation Metrics</h2>
              <div className="space-y-4">
                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Primary Metrics</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-slate-500">Accuracy:</span>
                        <span className="ml-2 font-medium">Correct / Total</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-slate-500">Precision:</span>
                        <span className="ml-2 font-medium">TP / (TP + FP)</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-slate-500">Recall:</span>
                        <span className="ml-2 font-medium">TP / (TP + FN)</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-slate-500">F1-Score:</span>
                        <span className="ml-2 font-medium">2·P·R / (P+R)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Confusion Matrix</h4>
                    <div className="grid grid-cols-2 gap-2 text-center text-sm">
                      <div className="p-3 bg-emerald-100 rounded">
                        <div className="font-semibold text-emerald-700">TN</div>
                        <div className="text-xs text-emerald-600">True Negative</div>
                      </div>
                      <div className="p-3 bg-red-100 rounded">
                        <div className="font-semibold text-red-700">FP</div>
                        <div className="text-xs text-red-600">False Positive</div>
                      </div>
                      <div className="p-3 bg-orange-100 rounded">
                        <div className="font-semibold text-orange-700">FN</div>
                        <div className="text-xs text-orange-600">False Negative</div>
                      </div>
                      <div className="p-3 bg-emerald-100 rounded">
                        <div className="font-semibold text-emerald-700">TP</div>
                        <div className="text-xs text-emerald-600">True Positive</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Try the Real-Time Detection
            </h2>
            <p className="text-xl text-violet-100 mb-10">
              Test the model with your own review text and see fraud detection in action.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-violet-700 hover:bg-violet-50 px-8 py-6"
                onClick={() => onNavigate('real-time-detection')}
              >
                Try Detection
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-6"
                onClick={() => onNavigate('dashboard')}
              >
                View Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
