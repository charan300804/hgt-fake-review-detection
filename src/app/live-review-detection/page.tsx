'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, AlertTriangle, CheckCircle, RefreshCw, Activity,
  Shield, TrendingUp, Users, Package, BarChart3, Pause, Play
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PageType = 'home' | 'about' | 'how-it-works' | 'model-architecture' | 'real-time-detection' | 'live-review-detection' | 'dashboard' | 'documentation'

interface LiveReview {
  _id: string
  review_id: string
  review_text: string
  rating: number
  predicted_label: string
  confidence_score: number
  createdAt: string
  user_id?: string
  product_id?: string
  low_confidence?: boolean
}

// Normalise any label format from MongoDB/CSV into display values
function normalizeLabel(raw: string): 'Fake' | 'Genuine' | 'Pending' {
  const v = String(raw || '').toLowerCase().trim()
  if (v === 'fake' || v === '1' || v === 'true' || v === 'cg') return 'Fake'
  if (v === 'genuine' || v === '0' || v === 'false' || v === 'or') return 'Genuine'
  return 'Pending'
}

interface LiveStats {
  total: number
  fake: number
  genuine: number
  pending: number
}

const POLL_INTERVAL_MS = 6000 // Auto-refresh every 6 seconds

export default function LiveReviewDetectionPage({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const [reviews, setReviews] = useState<LiveReview[]>([])
  const [stats, setStats] = useState<LiveStats>({ total: 0, fake: 0, genuine: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchReviews = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    try {
      const res = await fetch('/api/reviews?limit=20')
      if (!res.ok) return
      const data: LiveReview[] = await res.json()

      setReviews(prev => {
        const prevIds = new Set(prev.map(r => r._id))
        const incoming = new Set(data.map(r => r._id))
        const freshIds = new Set([...incoming].filter(id => !prevIds.has(id)))
        if (freshIds.size > 0) setNewIds(freshIds)
        setTimeout(() => setNewIds(new Set()), 2500)
        return data
      })

      // Compute live stats using normalized labels
      const fake = data.filter(r => normalizeLabel(r.predicted_label) === 'Fake').length
      const genuine = data.filter(r => normalizeLabel(r.predicted_label) === 'Genuine').length
      const pending = data.filter(r => normalizeLabel(r.predicted_label) === 'Pending').length
      setStats({ total: data.length, fake, genuine, pending })
      setLastUpdated(new Date())
    } catch {
      // silently fail on poll errors — don't crash the page
    } finally {
      if (initial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews(true)
  }, [fetchReviews])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => fetchReviews(false), POLL_INTERVAL_MS)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, fetchReviews])

  const fakePercent = stats.total > 0 ? Math.round((stats.fake / stats.total) * 100) : 0
  const genuinePercent = stats.total > 0 ? Math.round((stats.genuine / stats.total) * 100) : 0

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-14">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
          <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Badge className="mb-4 bg-violet-100 text-violet-700 px-4 py-1">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              Live Detection Feed
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Live Review{' '}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Auto-Detection
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Reviews from the MongoDB database are automatically classified by the HGT model in real time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Monitored', value: stats.total, icon: Shield, color: 'text-slate-700' },
              { label: 'Fake Reviews', value: stats.fake, icon: AlertTriangle, color: 'text-red-600' },
              { label: 'Genuine Reviews', value: stats.genuine, icon: CheckCircle, color: 'text-emerald-600' },
              { label: 'Pending', value: stats.pending, icon: RefreshCw, color: 'text-amber-600' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-slate-200 text-center py-3">
                  <CardContent className="p-3">
                    <stat.icon className={`w-6 h-6 mx-auto mb-1 ${stat.color}`} />
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Fraud ratio bar */}
          {stats.total > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-red-600 font-medium w-16 text-right">{fakePercent}% Fake</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${genuinePercent}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <span className="text-xs text-emerald-600 font-medium w-20">{genuinePercent}% Genuine</span>
            </div>
          )}
        </div>
      </section>

      {/* Controls & Live Feed */}
      <section className="py-10 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-sm font-medium text-slate-700">
                {running ? 'Auto-classifying every 6s' : 'Paused'}
              </span>
              {lastUpdated && (
                <span className="text-xs text-slate-400 ml-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fetchReviews(false)}>
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
              <Button
                size="sm"
                variant={running ? 'outline' : 'default'}
                onClick={() => setRunning(r => !r)}
                className={running ? '' : 'bg-violet-600 hover:bg-violet-700'}
              >
                {running ? <><Pause className="w-3 h-3 mr-1" />Pause</> : <><Play className="w-3 h-3 mr-1" />Resume</>}
              </Button>
            </div>
          </div>

          {/* Review Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
              <span className="ml-3 text-slate-500">Fetching live reviews from MongoDB...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>No classified reviews found yet.</p>
              <p className="text-sm mt-1">Submit a review via Real-Time Detection to see it appear here.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map(review => {
                  const displayLabel = normalizeLabel(review.predicted_label)
                  const isFake = displayLabel === 'Fake'
                  const isPending = displayLabel === 'Pending'
                  const isNew = newIds.has(review._id)

                  return (
                    <motion.div
                      key={review._id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35 }}
                    >
                      <Card className={`border-2 transition-all duration-300 ${isNew ? 'ring-2 ring-violet-400 ring-offset-2' :
                        isFake ? 'border-red-200 bg-red-50/30' :
                          isPending ? 'border-amber-200 bg-amber-50/30' :
                            'border-emerald-200 bg-emerald-50/30'
                        }`}>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isFake ? (
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              ) : isPending ? (
                                <RefreshCw className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              )}
                              <Badge className={`text-xs ${isFake ? 'bg-red-100 text-red-700' :
                                isPending ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                {displayLabel}
                              </Badge>
                              {isNew && (
                                <Badge className="bg-violet-100 text-violet-700 text-xs animate-pulse">NEW</Badge>
                              )}
                              {review.low_confidence && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs border-amber-200">
                                  Low Confidence
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-semibold ${isFake ? 'text-red-600' : 'text-emerald-600'}`}>
                                {review.confidence_score > 0
                                  ? `${(review.confidence_score * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </div>
                              <div className="text-xs text-slate-400">confidence</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                          <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                            "{review.review_text}"
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                              <span>{'⭐'.repeat(review.rating)}</span>
                              {review.user_id && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {String(review.user_id).slice(0, 12)}
                                </span>
                              )}
                              {review.product_id && (
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {String(review.product_id).slice(0, 12)}
                                </span>
                              )}
                            </div>
                            <span>{new Date(review.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-violet-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Want to Submit a Review Manually?</h2>
          <p className="text-violet-100 mb-6">Use the Real-Time Detection page to analyze a specific review.</p>
          <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 px-8"
            onClick={() => onNavigate('real-time-detection')}>
            <Zap className="mr-2 w-4 h-4" />
            Open Real-Time Detection
          </Button>
        </div>
      </section>
    </div>
  )
}
