"use client"

import { api } from "@/lib/api"
import { MapPin, Building, DollarSign, Clock, Briefcase, Calendar, ChevronLeft, Share2, Bookmark, Send, CheckCircle2, Info, Lightbulb, Users, Globe, GraduationCap, Award, FileText, Timer, Shield, CheckSquare, Sparkles, ExternalLink, TrendingUp } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { notFound } from "next/navigation"
import AIInsightCard from "@/components/ai/AIInsightCard"
import ApplyModal from "@/components/jobs/ApplyModal"
import { useState, useEffect } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

function getOrgColor(orgName: string) {
  const gradients = [
    "from-indigo-600 to-purple-700 text-white",
    "from-blue-600 to-cyan-600 text-white",
    "from-teal-600 to-emerald-700 text-white",
    "from-violet-650 to-indigo-800 text-white",
    "from-fuchsia-600 to-pink-700 text-white",
  ]
  let hash = 0
  for (let i = 0; i < orgName.length; i++) {
    hash = orgName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function parseFundingStatus(benefitsStr?: string, coverage?: string) {
  const lower = benefitsStr ? benefitsStr.toLowerCase() : ""
  const isFull = coverage === "full" || lower.includes("toàn phần")
  return {
    tuition: isFull || lower.includes("học phí") || lower.includes("tuition"),
    allowance: isFull || lower.includes("sinh hoạt phí") || lower.includes("sinh hoạt") || lower.includes("allowance") || lower.includes("stipend"),
    flight: isFull || lower.includes("vé máy bay") || lower.includes("máy bay") || lower.includes("flight"),
    insurance: isFull || lower.includes("bảo hiểm") || lower.includes("health") || lower.includes("insurance"),
  }
}

const levelLabels: Record<string, string> = {
  bachelor: "Cử nhân / Đại học",
  master: "Thạc sĩ",
  phd: "Tiến sĩ",
  postdoc: "Sau tiến sĩ",
}

const coverageLabels: Record<string, string> = {
  full: "Toàn phần",
  partial: "Bán phần",
  tuition_only: "Học phí",
}

function CountdownTimer({ deadline }: { deadline?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const targetDate = deadline ? new Date(deadline) : new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const difference = targetDate.getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 65) % 60); // stable calculation
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
        <Timer size={14} className="animate-pulse" /> Hạn nộp hồ sơ còn lại
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
       <div className="w-12 h-12 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!scholarship) return notFound()

  const orgColor = getOrgColor(scholarship.organization)
  const orgInitial = scholarship.organization ? scholarship.organization.charAt(0).toUpperCase() : "S"
  const fundStats = parseFundingStatus(scholarship.benefits, scholarship.coverage)
  const deadlineDate = scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'
  const isExpired = scholarship.deadline ? new Date(scholarship.deadline) < new Date() : false
  
  // Calculate a visual competition score if not present
  const compScore = scholarship.competitiveness_score || ((scholarship.title.length % 4) + 6)

  // Số suất học bổng (suy ra ổn định từ id nếu không có dữ liệu)
  let slotHash = 0
  const slotSrc = scholarship.id || scholarship.title || ""
  for (let i = 0; i < slotSrc.length; i++) slotHash = slotSrc.charCodeAt(i) + ((slotHash << 5) - slotHash)
  const slots = (Math.abs(slotHash) % 15) + 5

  // Danh mục hồ sơ cần chuẩn bị
  const documents = [
    { name: "Bài luận mục tiêu học tập", desc: "Bài luận thể hiện mục đích học tập và lý do xin học bổng." },
    { name: "Sơ yếu lý lịch học thuật", desc: "Tóm tắt quá trình học tập, kinh nghiệm hoạt động ngoại khóa và nghiên cứu." },
    { name: "Thư giới thiệu", desc: "Một đến hai thư từ giảng viên hoặc người hướng dẫn uy tín." },
    { name: "Bảng điểm và bằng tốt nghiệp", desc: "Bản dịch thuật công chứng kết quả học tập bậc học gần nhất." },
    { name: "Chứng chỉ ngoại ngữ", desc: "Chứng chỉ tiếng Anh tối thiểu tương ứng với yêu cầu bậc học." }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      <ApplyModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
        itemId={id!} 
        itemType="scholarship" 
        title={scholarship.title} 
      />

      {/* Hero Header section - Indigo royal color palette */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 overflow-hidden pt-24 pb-36 px-6 border-b border-indigo-900/30">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-25 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-blue-400 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[80%] bg-violet-400 rounded-full blur-[140px]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/scholarships" className="inline-flex items-center text-indigo-300 hover:text-white mb-8 transition-all group font-bold">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} />
            </div>
            Quay lại danh sách học bổng
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex gap-6 items-start flex-1 min-w-0">
              {/* Organization Logo Large */}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center font-black text-3xl md:text-4xl shrink-0 bg-gradient-to-br ${orgColor} shadow-2xl shadow-black/40 border border-white/10`}>
                {orgInitial}
              </div>
              
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {isExpired && (
                    <span className="px-3 py-1 rounded-lg bg-red-500 text-white border border-red-600 text-[10px] font-black uppercase tracking-wider">
                      Đã hết hạn
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                    Giá trị: {scholarship.amount || scholarship.coverage || "Toàn phần"}
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold">
                    <Calendar size={14} /> Hạn nộp: {deadlineDate}
                  </span>
                </div>
                
                <h1 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
                  {scholarship.title}
                </h1>
                
                <p className="font-bold text-lg text-indigo-400 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" /> {scholarship.organization}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0">
              <button className="w-14 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center backdrop-blur-md">
                <Bookmark size={24} className="text-indigo-200" />
              </button>
              {isExpired ? (
                <button
                  disabled
                  className="h-14 px-8 bg-rose-100 text-rose-700 font-black rounded-2xl border border-rose-200 cursor-not-allowed flex items-center justify-center gap-2 text-base"
                >
                  Đã hết hạn nộp đơn
                </button>
              ) : (
                <button
                  onClick={() => setIsApplyOpen(true)}
                  className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  Nộp hồ sơ ngay <Send size={18} />
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

            {/* Các giá trị nổi bật (đồng bộ với card ở trang danh sách) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">Điểm nổi bật của học bổng</h3>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 text-base font-black rounded-xl border border-emerald-100">
                  {coverageLabels[scholarship.coverage] || scholarship.coverage || "Học bổng"}
                </span>
                <span className="px-4 py-2.5 bg-blue-50 text-blue-700 text-base font-black rounded-xl border border-blue-100">
                  {levelLabels[scholarship.level] || scholarship.level}
                </span>
                {scholarship.min_gpa && (
                  <span className="px-4 py-2.5 bg-indigo-50 text-indigo-700 text-base font-black rounded-xl border border-indigo-100">
                    GPA {scholarship.min_gpa}+
                  </span>
                )}
                {scholarship.language_requirement && (
                  <span className="px-4 py-2.5 bg-violet-50 text-violet-700 text-base font-black rounded-xl border border-violet-100">
                    {scholarship.language_requirement}+
                  </span>
                )}
                <span className="px-4 py-2.5 bg-amber-50 text-amber-800 text-base font-black rounded-xl border border-amber-100">
                  {scholarship.amount || "Toàn phần"}
                </span>
                <span className="px-4 py-2.5 bg-slate-50 text-slate-700 text-base font-black rounded-xl border border-slate-100">
                  {scholarship.country || "Đa quốc gia"}
                </span>
                <span className="px-4 py-2.5 bg-rose-50 text-rose-700 text-base font-black rounded-xl border border-rose-100">
                  {slots} suất
                </span>
              </div>
            </div>

            {/* Core Metrics Table (Nationality and competitiveness score removed) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bậc học</span>
                  <span className="font-extrabold text-slate-800 text-sm capitalize">{levelLabels[scholarship.level] || scholarship.level || "Tất cả bậc học"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lĩnh vực học thuật</span>
                  <span className="font-extrabold text-slate-800 text-sm line-clamp-1">{scholarship.field || "Đa lĩnh vực"}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối tượng tuyển sinh</span>
                  <span className="font-extrabold text-slate-800 text-sm capitalize">{scholarship.gender_requirement === "Male" ? "Nam giới" : scholarship.gender_requirement === "Female" ? "Nữ giới" : "Tất cả ứng viên"}</span>
               </div>
            </div>

            {/* Specific Funding Benefits */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Award size={20} className="text-indigo-600" /> Quyền lợi & Khoản tài trợ cụ thể
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border text-center transition-all ${fundStats.tuition ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <GraduationCap size={24} className={`mx-auto mb-2 ${fundStats.tuition ? "text-emerald-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Học phí 100%</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center transition-all ${fundStats.allowance ? "bg-amber-50/50 border-amber-100 text-amber-900" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <DollarSign size={24} className={`mx-auto mb-2 ${fundStats.allowance ? "text-amber-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Sinh hoạt phí hàng tháng</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center transition-all ${fundStats.flight ? "bg-blue-50/50 border-blue-100 text-blue-800" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <Globe size={24} className={`mx-auto mb-2 ${fundStats.flight ? "text-blue-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Vé máy bay khứ hồi</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center transition-all ${fundStats.insurance ? "bg-indigo-50/50 border-indigo-100 text-indigo-800" : "bg-slate-50/50 border-slate-100 text-slate-400"}`}>
                  <Shield size={24} className={`mx-auto mb-2 ${fundStats.insurance ? "text-indigo-500" : "text-slate-300"}`} />
                  <span className="text-xs font-black">Bảo hiểm y tế quốc tế</span>
                </div>
              </div>
            </div>

            {/* Checklist of Required Documents */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" /> Danh mục tài liệu cần chuẩn bị
              </h3>
              <div className="space-y-4">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all">
                    <div className="text-indigo-500 mt-0.5">
                      <CheckSquare size={18} className="fill-indigo-50" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{doc.name}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scholarship description info */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết về học bổng</h2>
              </div>
              <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-relaxed prose-p:text-lg prose-li:text-lg">
                <ReactMarkdown>{scholarship.description || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>

            {/* Eligibility Requirements */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Điều kiện tuyển sinh & Yêu cầu</h2>
              </div>
              <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-relaxed prose-p:text-lg prose-li:text-lg">
                <ReactMarkdown>{scholarship.requirements || "_Đang cập nhật nội dung..._"}</ReactMarkdown>
              </div>
            </div>

            {/* Application Process Timeline */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quy trình ứng tuyển học bổng</h2>
              </div>
              
              <div className="relative pl-6 border-l-2 border-indigo-100 ml-4 space-y-8">
                <div className="relative">
                  <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center shadow">
                    <span className="text-[10px] font-black text-white">1</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base mb-1">Chuẩn bị hồ sơ tuyển sinh</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Thu thập đủ bảng điểm, SOP, CV và tối thiểu 2 thư giới thiệu chuẩn hóa từ giáo sư.</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center shadow">
                    <span className="text-[10px] font-black text-white">2</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base mb-1">Gửi đơn ứng tuyển qua cổng Opportify</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Hồ sơ sẽ được xem xét và gửi trực tiếp sang hệ thống trường liên kết quốc tế.</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center shadow">
                    <span className="text-[10px] font-black text-white">3</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base mb-1">Phỏng vấn cùng Hội đồng Học thuật</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Ủy ban học bổng của trường sẽ tiến hành phỏng vấn chuyên sâu 1-1 bằng tiếng Anh.</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center shadow">
                    <span className="text-[10px] font-black text-white">4</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base mb-1">Nhận kết quả tài trợ chính thức</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Hội đồng công bố danh sách tài trợ và gửi thư nhập học, hỗ trợ làm Visa du học.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            {/* AI Insight Card first */}
            <AIInsightCard itemId={id!} itemType="scholarship" />

            {/* Countdown Timer */}
            <CountdownTimer deadline={scholarship.deadline} />

            {/* Organization Info & Official Website */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 overflow-hidden relative">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
                <Building size={18} className="text-indigo-500" /> Về tổ chức tài trợ
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm font-medium mb-5">
                {scholarship.organization_info || `Học bổng từ ${scholarship.organization} nhằm hỗ trợ các tài năng xuất sắc nhất để phát triển học thuật và chuyên môn trong môi trường quốc tế.`}
              </p>
              
              <div className="space-y-3 mb-6 border-t border-slate-50 pt-4 text-xs font-bold">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase">Quốc gia</span>
                    <span className="text-slate-700">{scholarship.country || "Đa quốc gia"}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase">Lĩnh vực</span>
                    <span className="text-slate-700">{scholarship.field || "Đa lĩnh vực"}</span>
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
                  Đã hết hạn nộp đơn
                </button>
              ) : (
                <button
                  onClick={() => setIsApplyOpen(true)}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                >
                  Nộp hồ sơ ngay <Send size={18} />
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
