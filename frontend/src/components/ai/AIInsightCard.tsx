"use client"

import { useState, useEffect } from "react"
import { Sparkles, Brain, Target, AlertCircle, Lightbulb, Zap } from "lucide-react"
import { API_URL } from "@/lib/api"

interface AIInsightCardProps {
  itemId: string
  itemType: "job" | "scholarship"
}

export default function AIInsightCard({ itemId, itemType }: AIInsightCardProps) {
  const [insight, setInsight] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsight() {
      try {
        const response = await fetch(`${API_URL}/api/v1/ai/insight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId, item_type: itemType })
        })
        const data = await response.json()
        setInsight(data)
      } catch (error) {
        console.error("Failed to fetch AI insight:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInsight()
  }, [itemId, itemType])

  if (loading) {
    return (
      <div className="bg-linear-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="animate-spin text-blue-200" />
          <span className="font-black text-xl">Opportify Insight đang phân tích...</span>
        </div>
        <div className="h-4 bg-white/10 rounded-full w-full mb-3"></div>
        <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
      </div>
    )
  }

  if (!insight) return null

  return (
    <div className="bg-linear-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-500/40 border border-indigo-400/20 relative overflow-hidden group">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Zap size={20} className="text-amber-400 fill-amber-400" />
            </div>
            <span className="font-black text-lg tracking-tight">Opportify Insight</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black leading-none">{insight.score}%</span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Độ phù hợp</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
            <p className="text-indigo-50 text-[15px] leading-relaxed font-medium">
              {insight.analysis}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">Điểm nổi bật</h4>
                <div className="flex flex-wrap gap-2">
                  {insight.pros?.map((pro: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-emerald-500/30">
                      <Target size={14} /> {pro}
                    </span>
                  ))}
                </div>
             </div>

             <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300">Lời khuyên</h4>
                <div className="flex flex-col gap-2">
                  {insight.tips?.map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-indigo-100 font-medium bg-white/5 p-3.5 rounded-xl">
                      <Lightbulb size={18} className="text-amber-400 shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
