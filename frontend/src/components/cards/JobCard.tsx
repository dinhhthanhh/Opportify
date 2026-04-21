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
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <MapPin size={14} className="text-blue-500" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
            <DollarSign size={14} className="text-green-500" />
            <span className="font-medium">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
            job.job_type === "remote" ? "bg-purple-100 text-purple-700 border border-purple-200" :
            job.job_type === "fulltime" ? "bg-blue-100 text-blue-700 border border-blue-200" :
            "bg-slate-100 text-slate-600 border border-slate-200"
          }`}>
            {job.job_type === "remote" ? "Remote" : 
             job.job_type === "fulltime" ? "Toàn thời gian" :
             job.job_type === "parttime" ? "Bán thời gian" : "Thực tập"}
          </span>
        </div>
        
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 5).map(skill => (
              <span key={skill} className="text-xs font-medium bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-md transition-colors cursor-default">
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">+{job.skills.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
