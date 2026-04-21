import { api } from "@/lib/api"
import { MapPin, Building, DollarSign, Clock, Briefcase, Calendar, ChevronLeft, Share2, Bookmark, Send } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { notFound } from "next/navigation"

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

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  
  let job
  try {
    job = await api.jobs.get(id)
  } catch (error) {
    console.error("Failed to fetch job details:", error)
    return notFound()
  }

  if (!job) return notFound()

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 pt-20 pb-32 px-4 shadow-xl">
        <div className="max-w-5xl mx-auto">
          <Link href="/jobs" className="inline-flex items-center text-blue-100 hover:text-white mb-8 transition-colors group">
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại danh sách</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  job.job_type === "remote" ? "bg-purple-500/20 text-purple-200 border border-purple-400/30" :
                  job.job_type === "fulltime" ? "bg-blue-500/20 text-blue-200 border border-blue-400/30" :
                  "bg-slate-500/20 text-slate-200 border border-slate-400/30"
                }`}>
                  {job.job_type === "remote" ? "Remote" : 
                   job.job_type === "fulltime" ? "Toàn thời gian" : "Khác"}
                </span>
                <span className="text-blue-200 text-sm font-medium flex items-center gap-1">
                  <Clock size={14} /> Đăng {job.posted_at ? new Date(job.posted_at).toLocaleDateString('vi-VN') : 'vừa xong'}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-blue-100/80">
                <div className="flex items-center gap-2 font-semibold">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Building size={18} />
                  </div>
                  {job.company}
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <MapPin size={18} />
                  </div>
                  {job.location}
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <div className="p-2 bg-white/10 rounded-lg text-emerald-400">
                    <DollarSign size={18} />
                  </div>
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
               <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95 shadow-lg">
                 <Bookmark size={24} />
               </button>
               <button className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95 shadow-lg">
                 <Share2 size={24} />
               </button>
               <a 
                 href={job.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex-1 md:flex-none px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl shadow-2xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 Ứng tuyển ngay <Send size={20} />
               </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-sm">
              <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                Mô tả công việc
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                {job.description ? (
                  <ReactMarkdown>{job.description}</ReactMarkdown>
                ) : (
                  <p className="italic text-slate-400">Thông tin chi tiết đang được cập nhật...</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Yêu cầu & Kỹ năng
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills && job.skills.length > 0 ? job.skills.map((skill: string) => (
                  <span key={skill} className="px-5 py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-default">
                    {skill}
                  </span>
                )) : (
                   <p className="text-slate-400 font-medium">Không có yêu cầu kỹ năng cụ thể.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200/50">
               <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                 <Briefcase size={20} className="text-blue-300" />
                 Thông tin tóm tắt
               </h3>
               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <Calendar className="text-blue-200" size={20} />
                   </div>
                   <div>
                     <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest">Kinh nghiệm</p>
                     <p className="font-bold">{job.experience || "Không yêu cầu"}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <MapPin className="text-blue-200" size={20} />
                   </div>
                   <div>
                     <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest">Địa điểm</p>
                     <p className="font-bold">{job.location}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <Building className="text-blue-200" size={20} />
                   </div>
                   <div>
                     <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-widest">Nguồn tin</p>
                     <p className="font-bold capitalize">{job.source}</p>
                   </div>
                 </div>
               </div>
               
               <div className="mt-10 pt-10 border-t border-white/10">
                 <p className="text-sm text-blue-200/80 mb-6 font-medium leading-relaxed">
                   Bạn quan tâm đến vị trí này? Hãy ứng tuyển ngay trên website của nhà tuyển dụng.
                 </p>
                 <a 
                   href={job.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   Ứng tuyển <Send size={18} />
                 </a>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Bookmark size={30} />
              </div>
              <h4 className="font-black text-slate-800 mb-2">Lưu công việc</h4>
              <p className="text-slate-500 text-sm font-medium mb-6">Lưu lại để xem sau hoặc so sánh với các vị trí khác.</p>
              <button className="w-full py-3 border-2 border-slate-100 hover:border-blue-600 hover:text-blue-600 text-slate-600 font-bold rounded-2xl transition-all">
                Lưu ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
