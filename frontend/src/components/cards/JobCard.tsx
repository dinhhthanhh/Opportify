import Link from "next/link"
import { MapPin, Building, DollarSign, Clock, Calendar, Briefcase } from "lucide-react"
import type { Job } from "@/lib/types"

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
    "from-blue-500 to-indigo-600 text-white",
    "from-purple-500 to-pink-600 text-white",
    "from-emerald-500 to-teal-600 text-white",
    "from-amber-500 to-orange-600 text-white",
    "from-rose-500 to-red-600 text-white",
    "from-cyan-500 to-blue-600 text-white",
    "from-indigo-500 to-purple-600 text-white",
    "from-violet-500 to-fuchsia-600 text-white",
  ]
  let hash = 0
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function getHighlightBenefits(benefitsStr?: string) {
  if (!benefitsStr) {
    return ["Thưởng tháng 13", "Bảo hiểm PTI", "Laptop riêng"]
  }
  const highlights: string[] = []
  const lower = benefitsStr.toLowerCase()
  if (lower.includes("bảo hiểm") || lower.includes("pti") || lower.includes("chăm sóc sức khỏe")) highlights.push("Bảo hiểm PTI")
  if (lower.includes("tháng 13") || lower.includes("thưởng")) highlights.push("Thưởng tháng 13")
  if (lower.includes("laptop") || lower.includes("máy tính") || lower.includes("macbook")) highlights.push("Laptop riêng")
  if (lower.includes("du lịch") || lower.includes("teambuilding") || lower.includes("nghỉ mát")) highlights.push("Du lịch hàng năm")
  if (lower.includes("đào tạo") || lower.includes("training")) highlights.push("Đào tạo bài bản")
  if (lower.includes("remote") || lower.includes("nhà") || lower.includes("hybird")) highlights.push("Làm việc từ xa")
  
  while (highlights.length < 2) {
    const fallbacks = ["Thưởng tháng 13", "Bảo hiểm PTI", "Laptop riêng", "Du lịch hàng năm"]
    const next = fallbacks.find(f => !highlights.includes(f))
    if (next) highlights.push(next)
    else break
  }
  return highlights.slice(0, 3)
}

const jobTypeStyles: Record<string, string> = {
  fulltime: "bg-sky-50 text-sky-700 border-sky-100",
  parttime: "bg-amber-50 text-amber-800 border-amber-100",
  internship: "bg-emerald-50 text-emerald-700 border-emerald-100",
  remote: "bg-purple-50 text-purple-700 border-purple-100",
}

const jobTypeLabels: Record<string, string> = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  internship: "Thực tập",
  remote: "Làm việc từ xa",
}

export default function JobCard({ job }: { job: Job }) {
  const companyColor = getCompanyColor(job.company)
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "C"
  const benefits = getHighlightBenefits(job.benefits)
  
  // Format posted date
  const postedDate = job.posted_at ? new Date(job.posted_at).toLocaleDateString('vi-VN') : null
  const deadlineDate = job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : null
  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className={`border rounded-3xl p-6 transition-all duration-300 ${
        isExpired 
          ? "border-slate-200 bg-slate-50/75 opacity-75" 
          : "border-slate-100 bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 shadow-sm"
      }`}>
        
        {/* Top Info */}
        <div className="flex gap-4 items-start mb-4">
          {/* Avatar / Logo */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 bg-gradient-to-br ${companyColor} shadow-inner`}>
            {companyInitial}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-extrabold text-slate-800 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              {isExpired ? (
                <span className="text-xs bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-lg font-black shrink-0">
                  Đã hết hạn
                </span>
              ) : job.match_score ? (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-black shrink-0">
                  {Math.round(job.match_score * 100)}% phù hợp
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
              <span className="font-bold text-slate-700 hover:text-blue-600 transition-colors">{job.company}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold">{job.industry || "Công nghệ thông tin"}</span>
            </div>
          </div>
        </div>

        {/* Location & Salary & Type */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600 mb-4">
          {job.location && (
            <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-600">
              <MapPin size={12} className="text-slate-400" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 text-emerald-700">
            <DollarSign size={12} className="text-emerald-500" />
            <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
          </span>
          <span className={`px-2.5 py-1.5 rounded-lg border uppercase tracking-wider text-[10px] font-black ${jobTypeStyles[job.job_type] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
            {jobTypeLabels[job.job_type] || job.job_type}
          </span>
        </div>

        {/* Benefits Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {benefits.map((benefit, i) => (
            <span key={i} className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/50 px-2.5 py-1 rounded-lg">
              {benefit}
            </span>
          ))}
        </div>

        {/* Footer info: Skills & Time */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-50 text-xs font-semibold text-slate-500">
          <div className="flex flex-wrap gap-1.5">
            {job.skills && job.skills.length > 0 && job.skills.slice(0, 3).map(skill => (
              <span key={skill} className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-0.5 rounded-md">
                {skill}
              </span>
            ))}
            {job.skills && job.skills.length > 3 && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">+{job.skills.length - 3}</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            {postedDate && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> Đăng: {postedDate}
              </span>
            )}
            {deadlineDate && (
              <span className="flex items-center gap-1 text-rose-500 font-bold">
                <Calendar size={12} /> Hạn nộp: {deadlineDate}
              </span>
            )}
          </div>
        </div>

      </div>
    </Link>
  )
}

