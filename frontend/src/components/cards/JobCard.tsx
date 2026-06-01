import Link from "next/link"
import { MapPin, Building, DollarSign, Clock } from "lucide-react"
import type { Job } from "@/lib/types"

function formatSalary(min?: number, max?: number, currency = "VND") {
  if (!min && !max) return "Thỏa thuận"
  const fmt = (n: number) => currency === "VND" 
    ? `${(n/1_000_000).toFixed(0)}tr` 
    : `$${n.toLocaleString()}`
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  return min ? `Từ ${fmt(min)}` : `Đến ${fmt(max!)}`
}

const jobTypeStyles: Record<string, string> = {
  fulltime: "bg-sky-100 text-sky-700 border-sky-200",
  parttime: "bg-amber-100 text-amber-800 border-amber-200",
  internship: "bg-emerald-100 text-emerald-700 border-emerald-200",
}

const jobTypeLabels: Record<string, string> = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  internship: "Thực tập",
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">{job.title}</h3>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1.5">
              <Building size={14} className="text-slate-400" />
              <span className="font-medium">{job.company}</span>
            </div>
          </div>
          {job.match_score && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold drop-shadow-sm">
              {Math.round(job.match_score * 100)}% phù hợp
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-4">
          {job.location && (
            <span className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 text-indigo-700">
              <MapPin size={14} className="text-indigo-500" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 text-teal-700">
            <DollarSign size={14} className="text-teal-500" />
            <span className="font-medium">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
          </span>
          {job.job_type !== "remote" && (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${jobTypeStyles[job.job_type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
              {jobTypeLabels[job.job_type] || job.job_type}
            </span>
          )}
        </div>
        
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 5).map(skill => (
              <span key={skill} className="text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-md transition-colors cursor-default">
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">+{job.skills.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
