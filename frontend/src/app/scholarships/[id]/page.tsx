"use client"

import { api } from "@/lib/api"
import { MapPin, Building, DollarSign, Clock, Briefcase, Calendar, ChevronLeft, Share2, Bookmark, Send, CheckCircle2, Info, Lightbulb, Users, Globe, GraduationCap, Award, FileText } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { notFound } from "next/navigation"
import AIInsightCard from "@/components/ai/AIInsightCard"
import ApplyModal from "@/components/jobs/ApplyModal"
import { useState, useEffect } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ScholarshipDetailPage({ params }: PageProps) {
  const [scholarship, setScholarship] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      api.scholarships.get(p.id).then(data => {
        setScholarship(data)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    })
  }, [params])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!scholarship) return notFound()

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      <ApplyModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        itemId={id!} 
        itemType="scholarship" 
        title={scholarship.title} 
      />

      {/* Header section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 overflow-hidden pt-24 pb-40 px-6">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-blue-400 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[80%] bg-violet-400 rounded-full blur-[140px]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/scholarships" className="inline-flex items-center text-blue-200 hover:text-white mb-10 transition-all group font-bold">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} />
            </div>
            Danh sách học bổng
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-4 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-black uppercase tracking-wider">
                  {scholarship.level || "Toàn phần"}
                </span>
                <span className="flex items-center gap-1.5 text-blue-200 text-sm font-bold">
                  <Calendar size={16} /> Hạn nộp: {scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-[1.1]">
                {scholarship.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-y-4 gap-x-10 text-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-blue-300">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/50">Tổ chức</p>
                    <p className="font-bold text-lg">{scholarship.organization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-amber-300">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/50">Giá trị</p>
                    <p className="font-bold text-lg">{scholarship.amount || scholarship.coverage || "Toàn phần"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-emerald-300">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/50">Quốc gia</p>
                    <p className="font-bold text-lg">{scholarship.country || "Đa quốc gia"}</p>
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
                className="h-14 px-10 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3 text-lg"
              >
                Nộp hồ sơ ngay <Send size={20} />
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bậc học</span>
                  <span className="font-bold text-slate-800">{scholarship.level || "Tất cả"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới tính</span>
                  <span className="font-bold text-slate-800">{scholarship.gender_requirement || "Tất cả"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lĩnh vực</span>
                  <span className="font-bold text-slate-800">{scholarship.field || "Đa lĩnh vực"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quốc tịch</span>
                  <span className="font-bold text-slate-800">{scholarship.nationality_requirement || "Việt Nam"}</span>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Thông tin học bổng</h2>
              </div>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:text-lg">
                <ReactMarkdown>{scholarship.description || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Giá trị & Quyền lợi</h2>
              </div>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:text-lg">
                <ReactMarkdown>{scholarship.benefits || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quy trình ứng tuyển</h2>
              </div>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:text-lg">
                <ReactMarkdown>{scholarship.application_process || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <AIInsightCard itemId={id!} itemType="scholarship" />

              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 overflow-hidden relative">
                 <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Building size={20} className="text-blue-500" /> Về tổ chức
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm font-medium mb-6">
                  {scholarship.organization_info || `Học bổng từ ${scholarship.organization} nhằm hỗ trợ các tài năng trẻ phát triển sự nghiệp trong môi trường quốc tế.`}
                </p>
                <Link 
                  href={scholarship.website_url || "#"} 
                  className="text-blue-600 font-bold text-sm hover:underline"
                >
                  Ghé thăm website chính thức
                </Link>
              </div>

              <div className="space-y-4">
                 <button 
                  onClick={() => setIsApplyOpen(true)}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  Nộp hồ sơ ngay <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
