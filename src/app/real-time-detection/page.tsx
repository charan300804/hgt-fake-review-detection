'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Shield, AlertTriangle, CheckCircle, Zap,
  Send, Loader2, RefreshCw, TrendingUp, BarChart3,
  AlertCircle, Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type PageType = 'home' | 'about' | 'how-it-works' | 'model-architecture' | 'real-time-detection' | 'dashboard' | 'documentation'

interface PredictionResult {
  review_id: string
  prediction: 'fake' | 'genuine'
  confidence: number
  fraud_probability: number
  risk_factors: string[]
  low_confidence?: boolean
  processing_time_ms: number
}


export default function RealTimeDetectionPage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const [userId, setUserId] = useState('')
  const [productId, setProductId] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentPredictions, setRecentPredictions] = useState<PredictionResult[]>([])

  // --- Feature 1: Product Review Lookup ---
  const [plUserId, setPlUserId] = useState('')
  const [plProductId, setPlProductId] = useState('')
  const [plLoading, setPlLoading] = useState(false)
  const [plResult, setPlResult] = useState<any>(null)
  const [plError, setPlError] = useState<string | null>(null)

  const handleProductLookup = async () => {
    if (!plUserId.trim() || !plProductId.trim()) { setPlError('Both User ID and Product ID are required.'); return }
    setPlLoading(true); setPlError(null); setPlResult(null)
    try {
      const res = await fetch(`/api/reviews/product-lookup?user_id=${encodeURIComponent(plUserId)}&product_id=${encodeURIComponent(plProductId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlResult(data)
    } catch (e: any) { setPlError(e.message) } finally { setPlLoading(false) }
  }

  // --- Feature 2: User Fraud Profile ---
  const [usUserId, setUsUserId] = useState('')
  const [usLoading, setUsLoading] = useState(false)
  const [usResult, setUsResult] = useState<any>(null)
  const [usError, setUsError] = useState<string | null>(null)

  const handleUserStats = async () => {
    if (!usUserId.trim()) { setUsError('User ID is required.'); return }
    setUsLoading(true); setUsError(null); setUsResult(null)
    try {
      const res = await fetch(`/api/reviews/user-stats?user_id=${encodeURIComponent(usUserId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsResult(data)
    } catch (e: any) { setUsError(e.message) } finally { setUsLoading(false) }
  }

  // --- Feature 3: Review Text Identity Lookup ---
  const [tlText, setTlText] = useState('')
  const [tlLoading, setTlLoading] = useState(false)
  const [tlResult, setTlResult] = useState<any>(null)
  const [tlError, setTlError] = useState<string | null>(null)

  const handleTextLookup = async () => {
    if (!tlText.trim() || tlText.trim().length < 5) { setTlError('Paste at least 5 characters of the review text.'); return }
    setTlLoading(true); setTlError(null); setTlResult(null)
    try {
      const res = await fetch(`/api/reviews/text-lookup?text=${encodeURIComponent(tlText.slice(0, 200))}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTlResult(data)
    } catch (e: any) { setTlError(e.message) } finally { setTlLoading(false) }
  }

  const handlePredict = async () => {
    if (!userId.trim() || !productId.trim() || !reviewText.trim()) {
      setError('User ID, Product ID, and Review Text are required')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Direct the request to our local Next.js MongoDB API which validates the entities
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          review_text: reviewText,
          rating: rating
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze review')
      }

      const savedReview = await response.json()

      // Shim the response back mapping Mongoose document structure to PredictionResult
      const data: PredictionResult = {
        review_id: savedReview._id || savedReview.review_id,
        prediction: savedReview.predicted_label?.toLowerCase() as 'fake' | 'genuine' || 'genuine',
        confidence: savedReview.confidence_score || 0,
        fraud_probability: savedReview.confidence_score || 0,
        risk_factors: [],
        low_confidence: savedReview.low_confidence || false,
        processing_time_ms: 0,
      }

      setResult(data)
      setRecentPredictions(prev => [data, ...prev.slice(0, 4)])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to connect to ML service')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }




  const clearForm = () => {
    setUserId('')
    setProductId('')
    setReviewText('')
    setRating('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-16">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-rose-100 text-rose-700 px-4 py-1">
              <Target className="w-3 h-3 mr-1" />
              Real-Time Detection
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Detect Fake{' '}
              <span className="bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                Reviews Instantly
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Enter a review and get instant fraud detection with confidence scores and risk factor analysis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Detection Interface */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-rose-500" />
                    Review Analysis
                  </CardTitle>
                  <CardDescription>
                    Enter the review details below to analyze for potential fraud
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  <div className="grid grid-cols-2 gap-4">
                    {/* User ID */}
                    <div>
                      <Label htmlFor="user-id">User ID *</Label>
                      <Input
                        id="user-id"
                        placeholder="e.g. A3SGXH7AUHU8GW"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    {/* Product ID */}
                    <div>
                      <Label htmlFor="product-id">Product ID *</Label>
                      <Input
                        id="product-id"
                        placeholder="e.g. B000LQOCH0"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Review Text */}
                  <div>
                    <Label htmlFor="review-text">Review Text *</Label>
                    <Textarea
                      id="review-text"
                      placeholder="Enter the review text to analyze..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="mt-1.5 min-h-[150px]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {reviewText.length} characters
                    </p>
                  </div>

                  {/* Rating */}
                  <div>
                    <Label htmlFor="rating">Rating (1-5 Stars)</Label>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Input
                        id="rating"
                        type="number"
                        min={1}
                        max={5}
                        value={rating}
                        onChange={(e) => setRating(e.target.value === '' ? '' : (parseInt(e.target.value) || 1))}
                        className="w-20"
                      />
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-2xl ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields Removed */}

                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                      onClick={handlePredict}
                      disabled={loading || !reviewText.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Analyze Review
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearForm}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className={`border-2 ${result ? (result.prediction === 'fake' ? 'border-red-200' : 'border-emerald-200') : 'border-slate-200'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-500" />
                    Analysis Result
                  </CardTitle>
                  <CardDescription>
                    Fraud detection results will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {!result ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-12"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                          <Target className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500">
                          Enter a review and click "Analyze" to see results
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        {/* Main Verdict */}
                        <div className={`p-6 rounded-xl ${result.prediction === 'fake' ? 'bg-red-50' : 'bg-emerald-50'} text-center`}>
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${result.prediction === 'fake' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                            {result.prediction === 'fake' ? (
                              <AlertTriangle className="w-8 h-8 text-red-600" />
                            ) : (
                              <CheckCircle className="w-8 h-8 text-emerald-600" />
                            )}
                          </div>
                          <h3 className={`text-2xl font-bold mb-2 ${result.prediction === 'fake' ? 'text-red-700' : 'text-emerald-700'}`}>
                            {result.prediction === 'fake' ? 'Fake Review Detected' : 'Genuine Review'}
                          </h3>
                          <p className={`text-sm ${result.prediction === 'fake' ? 'text-red-600' : 'text-emerald-600'}`}>
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                          </p>
                          {result.low_confidence && (
                            <Badge className="mt-3 bg-amber-100 text-amber-700 border-amber-200">
                              <Info className="w-3 h-3 mr-1" />
                              Low Confidence
                            </Badge>
                          )}
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-slate-50">
                            <div className="text-sm text-slate-500 mb-1">Fraud Probability</div>
                            <div className="flex items-center gap-2">
                              <Progress value={result.fraud_probability * 100} className="flex-1 h-2" />
                              <span className="text-sm font-medium">{(result.fraud_probability * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-slate-50">
                            <div className="text-sm text-slate-500 mb-1">Processing Time</div>
                            <div className="text-lg font-semibold text-slate-900">
                              {result.processing_time_ms.toFixed(1)} ms
                            </div>
                          </div>
                        </div>

                        {/* Risk Factors */}
                        {result.risk_factors.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Info className="w-4 h-4 text-amber-500" />
                              <span className="font-medium text-slate-900">Risk Factors Identified</span>
                            </div>
                            <div className="space-y-2">
                              {result.risk_factors.map((factor, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                  <span className="text-sm text-amber-800">{factor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Review ID */}
                        <div className="text-xs text-slate-400 text-center">
                          Review ID: {result.review_id}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Recent Predictions */}
              {recentPredictions.length > 0 && (
                <Card className="mt-6 border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentPredictions.map((pred, i) => (
                        <div
                          key={pred.review_id}
                          className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-slate-100' : 'bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            {pred.prediction === 'fake' ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className={`text-sm font-medium ${pred.prediction === 'fake' ? 'text-red-700' : 'text-emerald-700'}`}>
                              {pred.prediction === 'fake' ? 'Fake' : 'Genuine'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {(pred.confidence * 100).toFixed(0)}% conf.
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How Detection Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How Detection Works</h2>
            <p className="text-slate-600">Our HGT model analyzes multiple factors to identify fake reviews</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Text Analysis',
                description: 'TF-IDF embeddings capture semantic patterns, repetitive phrases, and sentiment extremes.'
              },
              {
                icon: TrendingUp,
                title: 'Behavioral Patterns',
                description: 'Rating deviations, timing patterns, and voting ratios reveal suspicious activity.'
              },
              {
                icon: Target,
                title: 'Graph Relations',
                description: 'User-product connections identify coordinated spam networks and review manipulation.'
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full text-center border-slate-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-rose-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          THREE LOOKUP FEATURE SECTIONS
      ============================================================ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* Section Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Database Lookup Tools</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Use these tools to look up reviews, user profiles, and identify review origins from the database.</p>
          </div>

          {/* ---- Feature 1: Product Review Lookup ---- */}
          <Card className="border-2 border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50/60 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Product Review Lookup</CardTitle>
                  <CardDescription>Enter a User ID + Product ID from the CSV to see their reviews</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>User ID <span className="text-slate-400 text-xs">(e.g. user_1126)</span></Label>
                  <Input placeholder="user_1126" value={plUserId} onChange={e => setPlUserId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Product ID <span className="text-slate-400 text-xs">(e.g. prod_0941)</span></Label>
                  <Input placeholder="prod_0941" value={plProductId} onChange={e => setPlProductId(e.target.value)} />
                </div>
              </div>
              {plError && <p className="text-sm text-red-500">{plError}</p>}
              <Button onClick={handleProductLookup} disabled={plLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {plLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Looking up...</> : 'Find Reviews'}
              </Button>
              {plResult && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    Found <span className="text-blue-600 font-bold">{plResult.count}</span> review(s) by <code className="bg-slate-100 px-1 rounded">{plResult.user_id}</code> for product <code className="bg-slate-100 px-1 rounded">{plResult.product_id}</code>
                  </p>
                  {plResult.reviews.length === 0 ? (
                    <p className="text-slate-400 text-sm">No reviews found for this combination.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {plResult.reviews.map((r: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm">
                          <div className="flex justify-between mb-1">
                            <span>{'⭐'.repeat(r.rating)}</span>
                            <Badge className={r.predicted_label?.toLowerCase() === 'fake' || r.predicted_label === '1' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                              {r.predicted_label === '1' ? 'Fake' : r.predicted_label === '0' ? 'Genuine' : r.predicted_label}
                            </Badge>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{r.review_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Feature 2: User Fraud Profile ---- */}
          <Card className="border-2 border-orange-100 shadow-md">
            <CardHeader className="bg-orange-50/60 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-orange-900">User Fraud Profile</CardTitle>
                  <CardDescription>Enter any User ID to see how many fake reviews they have submitted</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-3">
                <Input
                  className="flex-1"
                  placeholder="Enter User ID (e.g. user_1126)"
                  value={usUserId}
                  onChange={e => setUsUserId(e.target.value)}
                />
                <Button onClick={handleUserStats} disabled={usLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {usLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Check User'}
                </Button>
              </div>
              {usError && <p className="text-sm text-red-500">{usError}</p>}
              {usResult && (
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Reviews', value: usResult.total_reviews, color: 'text-slate-700' },
                      { label: 'Fake Reviews', value: usResult.fake_count, color: 'text-red-600' },
                      { label: 'Genuine Reviews', value: usResult.genuine_count, color: 'text-emerald-600' },
                      { label: 'Fraud Rate', value: `${usResult.fraud_rate}%`, color: usResult.fraud_rate > 50 ? 'text-red-600' : 'text-emerald-600' },
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {usResult.total_reviews === 0 ? (
                    <p className="text-slate-400 text-sm">No reviews found for this user ID.</p>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span className="text-emerald-600">{usResult.genuine_count} Genuine</span>
                          <span className="text-red-600">{usResult.fake_count} Fake</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${100 - usResult.fraud_rate}%` }} />
                        </div>
                      </div>
                      {usResult.recent_reviews?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-600">Recent reviews by this user:</p>
                          {usResult.recent_reviews.map((r: any, i: number) => (
                            <div key={i} className="p-2 rounded border border-slate-200 bg-slate-50 text-xs text-slate-600 flex justify-between gap-2">
                              <span className="line-clamp-1 flex-1">{r.review_text}</span>
                              <Badge className={`shrink-0 ${r.predicted_label?.toLowerCase() === 'fake' || r.predicted_label === '1' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {r.predicted_label === '1' ? 'Fake' : r.predicted_label === '0' ? 'Genuine' : r.predicted_label}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Feature 3: Review Identity Lookup ---- */}
          <Card className="border-2 border-violet-100 shadow-md">
            <CardHeader className="bg-violet-50/60 border-b border-violet-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-violet-900">Review Identity Finder</CardTitle>
                  <CardDescription>Paste any review text from the CSV to find its User ID and Product ID</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Paste a review text snippet here (e.g. 'Love this! Well made, sturdy...')"
                value={tlText}
                onChange={e => setTlText(e.target.value)}
                rows={3}
                className="resize-none"
              />
              {tlError && <p className="text-sm text-red-500">{tlError}</p>}
              <Button onClick={handleTextLookup} disabled={tlLoading} className="bg-violet-600 hover:bg-violet-700 text-white">
                {tlLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</> : 'Find Review Origin'}
              </Button>
              {tlResult && (
                <div className="mt-2">
                  {!tlResult.found ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Not Found</AlertTitle>
                      <AlertDescription>{tlResult.message}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="p-4 rounded-xl border-2 border-violet-200 bg-violet-50 space-y-3">
                      <p className="text-sm font-semibold text-violet-800">Review Identified ✓</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-violet-200">
                          <p className="text-xs text-slate-500 mb-1">User ID</p>
                          <p className="font-mono font-bold text-violet-700 text-sm">{tlResult.user_id}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-violet-200">
                          <p className="text-xs text-slate-500 mb-1">Product ID</p>
                          <p className="font-mono font-bold text-violet-700 text-sm">{tlResult.product_id}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-violet-200">
                          <p className="text-xs text-slate-500 mb-1">Rating</p>
                          <p className="font-bold text-slate-700">{'⭐'.repeat(tlResult.rating)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-violet-200">
                          <p className="text-xs text-slate-500 mb-1">Classification</p>
                          <Badge className={tlResult.predicted_label?.toLowerCase() === 'fake' || tlResult.predicted_label === '1' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                            {tlResult.predicted_label === '1' ? 'Fake' : tlResult.predicted_label === '0' ? 'Genuine' : tlResult.predicted_label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-rose-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              View Analytics Dashboard
            </h2>
            <p className="text-xl text-rose-100 mb-8">
              Explore detailed statistics, visualizations, and model performance metrics.
            </p>
            <Button
              size="lg"
              className="bg-white text-rose-600 hover:bg-rose-50 px-8 py-6"
              onClick={() => onNavigate('dashboard')}
            >
              Open Dashboard
              <TrendingUp className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
