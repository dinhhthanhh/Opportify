"use client"

import { api } from "@/lib/api"
import { MapPin, Building, DollarSign, Clock, Briefcase, Calendar, ChevronLeft, Share2, Bookmark, Send, CheckCircle2, Info, Lightbulb, Users, Globe, Timer } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { notFound } from "next/navigation"
import AIInsightCard from "@/components/ai/AIInsightCard"
import ApplyModal from "@/components/jobs/ApplyModal"
import { useState, useEffect } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

function formatSalary(min?: number, max?: number, currency = "VND") {
  if (!min && !max) return "Thỏa thuận"
  const fmt = (n: number) => currency === "VND" 
    ? `${(n/1_000_000).toFixed(0)}tr` 
    : `$${n.toLocaleString()}`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  return min ? `Từ ${fmt(min)}` : `Đến ${fmt(max!)}`
}

export default function JobDetailPage({ params }: PageProps) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      api.jobs.get(p.id).then(data => {
        setJob(data)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    })
  }, [params])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!job) return notFound()

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      <ApplyModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        itemId={id!} 
        itemType="job" 
        title={job.title} 
      />

      {/* Header section */}
      <div className="relative bg-[#0f172a] overflow-hidden pt-24 pb-40 px-6">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-indigo-600 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/jobs" className="inline-flex items-center text-blue-300 hover:text-white mb-10 transition-all group font-bold">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Quay lại danh sách
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-4 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider">
                  {job.job_type || "Full-time"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                  <Clock size={16} /> {job.posted_at ? new Date(job.posted_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-[1.1]">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-y-4 gap-x-10 text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-blue-400">
                    <Building size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Công ty</p>
                    <p className="font-bold text-lg">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-emerald-400">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mức lương</p>
                    <p className="font-bold text-lg">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-rose-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Địa điểm</p>
                    <p className="font-bold text-lg">{job.location}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="w-14 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center backdrop-blur-md">
                <Bookmark size={24} />
              </button>
              <button 
                onClick={() => setIsApplyOpen(true)}
                className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
              >
                Ứng tuyển ngay <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-10">
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấp bậc</span>
                  <span className="font-bold text-slate-800">{job.job_level || job.experience || "N/A"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kinh nghiệm</span>
                  <span className="font-bold text-slate-800">{job.experience_years ? `${job.experience_years} năm` : "Không yêu cầu"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngành nghề</span>
                  <span className="font-bold text-slate-800">{job.industry || "Công nghệ / IT"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</span>
                  <span className="font-bold text-slate-800">{job.working_time || "T2 - T6"}</span>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mô tả công việc</h2>
              </div>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:text-lg prose-li:text-slate-600 prose-li:text-lg">
                <ReactMarkdown>{job.description || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu ứng viên</h2>
              </div>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:text-lg">
                <ReactMarkdown>{job.requirements || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
              
              <div className="mt-10 pt-10 border-t border-slate-50">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Kỹ năng chuyên môn</h3>
                <div className="flex flex-wrap gap-3">
                  {job.skills?.map((skill: string) => (
                    <span key={skill} className="px-5 py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <AIInsightCard itemId={id!} itemType="job" />

              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12"></div>
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Building size={20} className="text-blue-500" /> Về công ty
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm font-medium mb-6">
                  {job.company_info || `Tại ${job.company}, chúng tôi luôn tìm kiếm những tài năng xuất sắc nhất để cùng xây dựng những giải pháp công nghệ tiên phong.`}
                </p>
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-slate-500 text-xs">
                      <Users size={16} /> 50 - 150 nhân viên
                   </div>
                   <div className="flex items-center gap-3 text-slate-500 text-xs">
                      <Globe size={16} /> {job.location}
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                 <button 
                  onClick={() => setIsApplyOpen(true)}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
                >
                  Nộp đơn ngay <Send size={20} />
                </button>
                <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest px-6">
                   Bạn sẽ được chọn CV từ hồ sơ AI hoặc tải CV mới lên
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
