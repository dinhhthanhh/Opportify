"use client"

import { api } from "@/lib/api"
import { MapPin, Building, DollarSign, Clock, Briefcase, Calendar, ChevronLeft, Share2, Bookmark, Send, CheckCircle2, Info, Lightbulb, Users, Globe, Timer, TrendingUp, Gift, Shield, Laptop } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { notFound } from "next/navigation"
import AIInsightCard from "@/components/ai/AIInsightCard"
import ApplyModal from "@/components/jobs/ApplyModal"
import { useState, useEffect } from "react"
import { getSavedUserLocation, HUST_LOCATION, USER_LOCATION_KEY } from "@/components/location/UserLocationContext"

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

function getCompanyColor(companyName: string) {
  const gradients = [
    "from-blue-600 to-indigo-700 text-white",
    "from-purple-600 to-pink-700 text-white",
    "from-emerald-600 to-teal-700 text-white",
    "from-amber-600 to-orange-700 text-white",
    "from-rose-600 to-red-700 text-white",
    "from-cyan-600 to-blue-700 text-white",
  ]
  let hash = 0
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function parseBenefitsStatus(benefitsStr?: string) {
  const lower = benefitsStr ? benefitsStr.toLowerCase() : ""
  return {
    insurance: lower.includes("bảo hiểm") || lower.includes("pti") || lower.includes("chăm sóc sức khỏe") || lower.includes("bhyt"),
    bonus: lower.includes("thưởng") || lower.includes("tháng 13") || lower.includes("lễ tết"),
    laptop: lower.includes("laptop") || lower.includes("máy tính") || lower.includes("macbook") || lower.includes("thiết bị"),
    travel: lower.includes("du lịch") || lower.includes("nghỉ mát") || lower.includes("teambuilding") || lower.includes("nghỉ phép"),
  }
}

const jobTypeStyles: Record<string, string> = {
  fulltime: "bg-sky-100 text-sky-700 border-sky-200",
  parttime: "bg-amber-100 text-amber-800 border-amber-200",
  internship: "bg-emerald-100 text-emerald-700 border-emerald-200",
  remote: "bg-purple-100 text-purple-700 border-purple-200",
}

const jobTypeLabels: Record<string, string> = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  internship: "Thực tập",
  remote: "Làm việc từ xa",
}

function CountdownTimer({ deadline }: { deadline?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const targetDate = deadline ? new Date(deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const difference = targetDate.getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center shadow-inner">
      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
        <Timer size={14} className="animate-pulse" /> Hạn nộp còn lại
      </p>
      <div className="flex justify-center gap-2">
        <div className="flex flex-col items-center bg-white border border-rose-100/50 rounded-xl px-2.5 py-1.5 w-12 shadow-sm">
          <span className="text-lg font-black text-rose-600">{timeLeft.days}</span>
          <span className="text-[8px] font-bold text-rose-400 uppercase">Ngày</span>
        </div>
        <div className="flex flex-col items-center bg-white border border-rose-100/50 rounded-xl px-2.5 py-1.5 w-12 shadow-sm">
          <span className="text-lg font-black text-rose-600">{timeLeft.hours}</span>
          <span className="text-[8px] font-bold text-rose-400 uppercase">Giờ</span>
        </div>
        <div className="flex flex-col items-center bg-white border border-rose-100/50 rounded-xl px-2.5 py-1.5 w-12 shadow-sm">
          <span className="text-lg font-black text-rose-600">{timeLeft.minutes}</span>
          <span className="text-[8px] font-bold text-rose-400 uppercase">Phút</span>
        </div>
        <div className="flex flex-col items-center bg-white border border-rose-100/50 rounded-xl px-2.5 py-1.5 w-12 shadow-sm">
          <span className="text-lg font-black text-rose-600">{timeLeft.seconds}</span>
          <span className="text-[8px] font-bold text-rose-400 uppercase">Giây</span>
        </div>
      </div>
    </div>
  );
}

function ApplicationRoadmap() {
  const steps = [
    { title: "Nộp hồ sơ", desc: "Hồ sơ của bạn sẽ được chuyển đến nhà tuyển dụng để xem xét." },
    { title: "Đánh giá năng lực", desc: "Hoàn thành bài kiểm tra chuyên môn nhỏ để chứng minh kinh nghiệm của bạn." },
    { title: "Phỏng vấn chuyên sâu", desc: "Trò chuyện trực tiếp cùng quản lý trực tiếp để hiểu rõ hơn về công việc." },
    { title: "Nhận thư mời nhận việc", desc: "Trở thành thành viên chính thức và hưởng toàn bộ phúc lợi hấp dẫn." }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
          <TrendingUp size={24} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Lộ trình ứng tuyển</h2>
      </div>
      
      <div className="relative pl-6 border-l-2 border-indigo-100 ml-4 space-y-8">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center shadow-md">
              <span className="text-[10px] font-black text-white">{i + 1}</span>
            </div>
            
            <div>
              <h3 className="font-extrabold text-slate-800 text-base mb-1">{step.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JobDetailPage({ params }: PageProps) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [id, setId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [userLoc, setUserLoc] = useState(HUST_LOCATION)

  // Lấy vị trí người dùng (đã lưu hoặc hỏi quyền) để chỉ đường tới công ty
  useEffect(() => {
    setUserLoc(getSavedUserLocation())
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          setUserLoc(next)
          try { localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(next)) } catch { /* ignore */ }
        },
        () => { /* giữ vị trí đã lưu / mặc định HUST */ },
        { enableHighAccuracy: false, timeout: 8000 }
      )
    }
  }, [])

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

  const companyColor = getCompanyColor(job.company)
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "C"
  const benStats = parseBenefitsStatus(job.benefits)
  const deadlineDate = job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Nhận hồ sơ liên tục'
  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false
  const destination = job.latitude && job.longitude
    ? `${job.latitude},${job.longitude}`
    : encodeURIComponent(`${job.company} ${job.location || "Việt Nam"}`)
  // Chỉ đường từ vị trí người dùng (hoặc HUST) đến công ty
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lon}&destination=${destination}`

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      <ApplyModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        itemId={id!} 
        itemType="job" 
        title={job.title} 
      />

      {/* Hero Header section */}
      <div className="relative bg-[#0f172a] overflow-hidden pt-24 pb-36 px-6">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-indigo-600 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/jobs" className="inline-flex items-center text-blue-300 hover:text-white mb-8 transition-all group font-bold">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Quay lại danh sách việc làm
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex gap-6 items-start flex-1 min-w-0">
              {/* Company Logo Large */}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center font-black text-3xl md:text-4xl shrink-0 bg-gradient-to-br ${companyColor} shadow-2xl shadow-black/40 border border-white/10`}>
                {companyInitial}
              </div>
              
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${jobTypeStyles[job.job_type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {jobTypeLabels[job.job_type] || "Toàn thời gian"}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                    <Clock size={14} /> {job.posted_at ? `Đăng ngày: ${new Date(job.posted_at).toLocaleDateString('vi-VN')}` : 'Đang tuyển dụng'}
                  </span>
                  {isExpired && (
                    <span className="px-3 py-1 rounded-lg bg-red-500 text-white border border-red-600 text-xs font-black uppercase tracking-wider">
                      Đã hết hạn
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
                  {job.title}
                </h1>
                
                <p className="font-bold text-lg text-blue-400">{job.company}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => setSaved(s => !s)}
                title={saved ? "Đã lưu" : "Lưu công việc"}
                className={`w-14 h-14 rounded-2xl border transition-all flex items-center justify-center backdrop-blur-md ${
                  saved
                    ? "bg-amber-400 text-slate-900 border-amber-300"
                    : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                }`}
              >
                <Bookmark size={24} className={saved ? "fill-slate-900" : ""} />
              </button>
              {isExpired ? (
                <button
                  disabled
                  className="h-14 px-8 bg-rose-100 text-rose-700 font-black rounded-2xl border border-rose-200 cursor-not-allowed flex items-center justify-center gap-2 text-base"
                >
                  Đã hết hạn nộp hồ sơ
                </button>
              ) : (
                <button 
                  onClick={() => setIsApplyOpen(true)}
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  Ứng tuyển ngay <Send size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* Core Metrics Table */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-6">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấp bậc</span>
                  <span className="font-extrabold text-slate-800 text-sm capitalize">{job.job_level || job.experience || "Fresher/Junior"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kinh nghiệm</span>
                  <span className="font-extrabold text-slate-800 text-sm">{job.experience_years ? `${job.experience_years} năm` : "Không yêu cầu"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngành nghề</span>
                  <span className="font-extrabold text-slate-800 text-sm line-clamp-1">{job.industry || "Công nghệ / IT"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</span>
                  <span className="font-extrabold text-slate-800 text-sm">{job.working_time || "T2 - T6"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Hạn nộp hồ sơ</span>
                  <span className="font-black text-rose-600 text-sm">{deadlineDate}</span>
               </div>
            </div>

            {/* Outstanding Benefits Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Gift size={20} className="text-indigo-600" /> Phúc lợi nổi bật của công ty
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border text-center transition-all ${benStats.insurance ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <Shield size={24} className={`mx-auto mb-2 ${benStats.insurance ? "text-emerald-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Bảo hiểm sức khỏe</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center transition-all ${benStats.bonus ? "bg-amber-50/50 border-amber-100 text-amber-900" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <DollarSign size={24} className={`mx-auto mb-2 ${benStats.bonus ? "text-amber-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Thưởng tháng 13++</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center transition-all ${benStats.laptop ? "bg-blue-50/50 border-blue-100 text-blue-850" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <Laptop size={24} className={`mx-auto mb-2 ${benStats.laptop ? "text-blue-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Có thiết bị riêng</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center transition-all ${benStats.travel ? "bg-indigo-50/50 border-indigo-100 text-indigo-800" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <Globe size={24} className={`mx-auto mb-2 ${benStats.travel ? "text-indigo-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Du lịch hàng năm</span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mô tả công việc</h2>
              </div>
              <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-relaxed prose-p:text-lg prose-li:text-lg">
                <ReactMarkdown>{job.description || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>

            {/* Requirements Card */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Yêu cầu ứng viên</h2>
              </div>
              <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-relaxed prose-p:text-lg prose-li:text-lg">
                <ReactMarkdown>{job.requirements || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Kỹ năng cốt lõi</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.map((skill: string) => (
                    <span key={skill} className="px-4 py-2.5 bg-violet-50 text-violet-700 font-bold rounded-xl border border-violet-100/50 text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Application Roadmap */}
            <ApplicationRoadmap />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            {/* AI Insight Card first */}
            <AIInsightCard itemId={id!} itemType="job" />

            {/* Countdown Timer */}
            <CountdownTimer deadline={job.deadline} />

            {/* Company Info & Source */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 overflow-hidden relative">
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
                <Building size={20} className="text-blue-500" /> Thông tin công ty
              </h3>
              <p className="text-slate-600 leading-relaxed text-base font-medium mb-4">
                {job.company_info || `Tại ${job.company}, chúng tôi luôn tìm kiếm những tài năng xuất sắc nhất để cùng xây dựng những giải pháp công nghệ tiên phong.`}
              </p>
              <div className="space-y-3 border-t border-slate-50 pt-4">
                 <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400 uppercase">Quy mô</span>
                    <span className="text-slate-700">50 - 150 nhân viên</span>
                 </div>
                 <div className="flex justify-between items-center gap-3 text-sm font-bold">
                    <span className="text-slate-400 uppercase shrink-0">Địa chỉ</span>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 text-right min-w-0"
                    >
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{job.location || "Việt Nam"}</span>
                    </a>
                 </div>
              </div>
            </div>

            {/* Fast Apply Button Container */}
            <div className="space-y-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
               {isExpired ? (
                <button
                  disabled
                  className="w-full h-14 bg-rose-100 text-rose-700 font-black rounded-2xl border border-rose-200 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Đã hết hạn nộp
                </button>
              ) : (
                <button
                  onClick={() => setIsApplyOpen(true)}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10"
                >
                  Nộp đơn ngay <Send size={18} />
                </button>
              )}
              <p className="text-xs text-center font-bold text-slate-400 px-2">
                 Bạn có thể nộp từ CV trong hệ thống hoặc tải file CV lên.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
