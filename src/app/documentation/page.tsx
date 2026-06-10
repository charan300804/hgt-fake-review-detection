'use client'

import { motion } from 'framer-motion'
import {
  BookOpen, Code, Database, Server, Globe, Terminal,
  FileText, Layers, Zap, CheckCircle, ExternalLink,
  ChevronRight, Copy, Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type PageType = 'home' | 'about' | 'how-it-works' | 'model-architecture' | 'real-time-detection' | 'dashboard' | 'documentation'

export default function DocumentationPage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const apiEndpoints = [
    {
      method: 'POST',
      path: '/predict',
      description: 'Predict if a single review is fake or genuine',
      request: {
        review_id: 'string',
        user_id: 'string',
        product_id: 'string',
        review_text: 'string',
        rating: 'number (1-5)',
        timestamp: 'string (optional)',
        helpful_votes: 'number (optional)',
        total_votes: 'number (optional)'
      },
      response: {
        review_id: 'string',
        prediction: '"fake" | "genuine"',
        confidence: 'number (0-1)',
        fraud_probability: 'number (0-1)',
        risk_factors: 'string[]',
        processing_time_ms: 'number'
      }
    },
    {
      method: 'POST',
      path: '/predict/batch',
      description: 'Batch prediction for multiple reviews',
      request: {
        reviews: 'ReviewInput[]'
      },
      response: {
        predictions: 'PredictionOutput[]',
        total_processed: 'number',
        genuine_count: 'number',
        fake_count: 'number',
        processing_time_ms: 'number'
      }
    },
    {
      method: 'GET',
      path: '/metrics',
      description: 'Get model performance metrics',
      response: {
        accuracy: 'number',
        precision: 'number',
        recall: 'number',
        f1_score: 'number',
        confusion_matrix: 'number[][]',
        training_loss: 'number[]',
        validation_loss: 'number[]'
      }
    },
    {
      method: 'GET',
      path: '/dataset/stats',
      description: 'Get dataset statistics',
      response: {
        total_reviews: 'number',
        genuine_reviews: 'number',
        fake_reviews: 'number',
        unique_users: 'number',
        unique_products: 'number',
        rating_distribution: 'object',
        fraud_distribution: 'object',
        avg_review_length: 'number'
      }
    },
    {
      method: 'GET',
      path: '/graph/stats',
      description: 'Get graph statistics',
      response: {
        num_nodes: 'number',
        num_edges: 'number',
        num_users: 'number',
        num_products: 'number',
        num_reviews: 'number',
        avg_reviews_per_user: 'number',
        avg_reviews_per_product: 'number'
      }
    },
    {
      method: 'GET',
      path: '/model/architecture',
      description: 'Get model architecture details',
      response: {
        name: 'string',
        type: 'string',
        components: 'object',
        hyperparameters: 'object'
      }
    },
    {
      method: 'POST',
      path: '/train',
      description: 'Train the model with specified parameters',
      request: {
        epochs: 'number (default: 20)',
        batch_size: 'number (default: 64)',
        learning_rate: 'number (default: 0.001)',
        retrain: 'boolean (default: false)'
      }
    },
    {
      method: 'GET',
      path: '/train/status',
      description: 'Get current training status',
      response: {
        status: 'string',
        progress: 'number (0-1)',
        current_epoch: 'number',
        total_epochs: 'number',
        metrics: 'ModelMetrics (optional)'
      }
    }
  ]

  const codeExamples = {
    python: `import requests
import json

# Predict single review
response = requests.post(
    'http://localhost:5001/predict',
    json={
        'review_id': 'review_001',
        'user_id': 'user_123',
        'product_id': 'product_456',
        'review_text': 'This product is amazing! Best purchase ever!',
        'rating': 5
    }
)

result = response.json()
print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Fraud Probability: {result['fraud_probability']:.2%}")`,

    javascript: `// Predict single review
const response = await fetch('http://localhost:5001/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    review_id: 'review_001',
    user_id: 'user_123',
    product_id: 'product_456',
    review_text: 'This product is amazing! Best purchase ever!',
    rating: 5
  })
});

const result = await response.json();
console.log('Prediction:', result.prediction);
console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');`,

    curl: `# Predict single review
curl -X POST "http://localhost:5001/predict" \\
  -H "Content-Type: application/json" \\
  -d '{
    "review_id": "review_001",
    "user_id": "user_123",
    "product_id": "product_456",
    "review_text": "This product is amazing! Best purchase ever!",
    "rating": 5
  }'`
  }

  const setupSteps = [
    {
      title: 'Prerequisites',
      items: [
        'Python 3.9+ with pip',
        'Node.js 18+ with npm or bun',
        'Git for cloning the repository'
      ]
    },
    {
      title: 'Backend Setup',
      items: [
        'Install Python dependencies: pip install -r requirements.txt',
        'Download NLTK data: python -c "import nltk; nltk.download(\'all\')"',
        'Start FastAPI server: uvicorn index:app --port 5001'
      ]
    },
    {
      title: 'Frontend Setup',
      items: [
        'Install dependencies: bun install',
        'Start development server: bun run dev',
        'Access at http://localhost:3000'
      ]
    },
    {
      title: 'Model Training',
      items: [
        'Prepare dataset in /data directory',
        'Run training: POST /train endpoint',
        'Monitor progress: GET /train/status',
        'Model saved to /models/hgt_model.pt'
      ]
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-slate-700 text-slate-300 px-4 py-1">
              <BookOpen className="w-3 h-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              API Reference &{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Integration Guide
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Complete documentation for integrating the HGT Fraud Detection system into your applications.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-white border-slate-200">
              <Zap className="h-4 w-4 text-amber-500" />
              <AlertTitle>Quick Start</AlertTitle>
              <AlertDescription className="mt-2">
                The API runs on port <code className="px-1 py-0.5 bg-slate-100 rounded text-sm">5001</code>.
                Use the <code className="px-1 py-0.5 bg-slate-100 rounded text-sm">XTransformPort</code> query parameter
                when calling from the frontend: <code className="px-1 py-0.5 bg-slate-100 rounded text-sm">/api/predict?XTransformPort=5001</code>
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Setup & Installation</h2>
            <p className="text-slate-600">Get the system up and running in your environment</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {setupSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-slate-200">
                  <CardHeader>
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm mb-2">
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {step.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
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

      {/* API Endpoints */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">API Endpoints</h2>
            <p className="text-slate-600">Complete reference for all available endpoints</p>
          </motion.div>

          <div className="space-y-6">
            {apiEndpoints.map((endpoint, index) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        } font-mono`}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-lg font-semibold text-slate-900">{endpoint.path}</code>
                    </div>
                    <CardDescription className="mt-2">{endpoint.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {endpoint.request && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Request Body</h4>
                          <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-slate-100 overflow-x-auto">
                            <pre>{JSON.stringify(endpoint.request, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      {endpoint.response && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Response</h4>
                          <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-slate-100 overflow-x-auto">
                            <pre>{JSON.stringify(endpoint.response, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-12 bg-white">

      </section>

      {/* Architecture Overview */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">System Architecture</h2>
            <p className="text-slate-600">Overview of the system components and data flow</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Server,
                title: 'Backend Services',
                items: [
                  'FastAPI REST API (Port 5001)',
                  'HGT Model Inference Engine',
                  'TF-IDF Preprocessing Pipeline',
                  'SQLite / Prisma Data Persistence'
                ]
              },
              {
                icon: Globe,
                title: 'Frontend',
                items: [
                  'Next.js 16 App Router',
                  'React 19 with TypeScript',
                  'Tailwind CSS Styling',
                  'Interactive Visualizations'
                ]
              },
              {
                icon: Database,
                title: 'Data Layer',
                items: [
                  'User-Review-Product Graph',
                  'Review Text Embeddings',
                  'Behavioral Features',
                  'Model Artifacts Storage'
                ]
              }
            ].map((component, index) => (
              <motion.div
                key={component.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                      <component.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{component.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {component.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
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

      {/* Model Details */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Model Details</h2>
            <p className="text-slate-600">Technical specifications of the HGT model</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Hidden Dimension</div>
                      <div className="text-lg font-semibold">128</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Attention Heads</div>
                      <div className="text-lg font-semibold">4</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">HGT Layers</div>
                      <div className="text-lg font-semibold">2</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Dropout</div>
                      <div className="text-lg font-semibold">0.3</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Text Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">TF-IDF Features</div>
                      <div className="text-lg font-semibold">5,000</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">N-gram Range</div>
                      <div className="text-lg font-semibold">1-2</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Min Document Freq</div>
                      <div className="text-lg font-semibold">2</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Max Document Freq</div>
                      <div className="text-lg font-semibold">95%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-500" />
                  Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Optimizer</span>
                    <span className="font-medium">Adam (lr=0.001)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Loss Function</span>
                    <span className="font-medium">Cross-Entropy</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Batch Size</span>
                    <span className="font-medium">64</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Data Split</span>
                    <span className="font-medium">80/10/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  Graph Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Node Types</span>
                    <span className="font-medium">User, Review, Product</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                    <span className="font-medium">User &rarr; Review</span>
                    <span className="font-medium">wrote</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                    <span className="font-medium">Review &rarr; Product</span>
                    <span className="font-medium">belongs to</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">User Features</span>
                    <span className="font-medium">6 behavioral</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Product Features</span>
                    <span className="font-medium">4 aggregated</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
            <p className="text-slate-400 mb-8">
              Explore our detailed pages for more information about the system
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => onNavigate('about')}
              >
                About the Project
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => onNavigate('model-architecture')}
              >
                Model Architecture
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => onNavigate('how-it-works')}
              >
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
