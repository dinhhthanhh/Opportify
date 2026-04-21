# Frontend Reference

## Cài đặt

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
cd frontend
npm install @supabase/ssr @supabase/supabase-js lucide-react
npx shadcn@latest init
```

## API Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const api = {
  jobs: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch<JobsResponse>(`/api/v1/jobs?${qs}`)
    },
    get: (id: string) => apiFetch<Job>(`/api/v1/jobs/${id}`),
  },
  scholarships: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch<ScholarshipsResponse>(`/api/v1/scholarships?${qs}`)
    },
  },
  search: (q: string, type = "all") =>
    apiFetch<SearchResults>(`/api/v1/search?q=${encodeURIComponent(q)}&type=${type}`),
  ai: {
    chat: (message: string, history: Message[]) =>
      apiFetch<{reply: string}>("/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      }),
    analyzeCV: (formData: FormData) =>
      fetch(`${API_URL}/api/v1/ai/analyze-cv`, { method: "POST", body: formData })
        .then(r => r.json()),
  },
}
```

## TypeScript types

```typescript
// lib/types.ts
export interface Job {
  id: string
  title: string
  company: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  description: string
  skills: string[]
  job_type: "fulltime" | "parttime" | "remote" | "internship"
  experience: "fresher" | "junior" | "mid" | "senior"
  url: string
  source: string
  posted_at: string
  match_score?: number  // 0-1, từ AI matching
}

export interface Scholarship {
  id: string
  title: string
  organization: string
  country: string
  level: "bachelor" | "master" | "phd" | "postdoc"
  field: string
  coverage: string
  amount: string
  deadline: string
  description: string
  url: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
}
```

## JobCard Component

```tsx
// components/cards/JobCard.tsx
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
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all bg-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{job.title}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
              <Building size={13} />
              <span>{job.company}</span>
            </div>
          </div>
          {job.match_score && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">
              {Math.round(job.match_score * 100)}% phù hợp
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin size={13}/>{job.location}</span>
          )}
          <span className="flex items-center gap-1">
            <DollarSign size={13}/>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            job.job_type === "remote" ? "bg-purple-50 text-purple-700" :
            job.job_type === "fulltime" ? "bg-blue-50 text-blue-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {job.job_type === "remote" ? "Remote" : 
             job.job_type === "fulltime" ? "Toàn thời gian" :
             job.job_type === "parttime" ? "Bán thời gian" : "Thực tập"}
          </span>
        </div>
        
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 5).map(skill => (
              <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="text-xs text-gray-400">+{job.skills.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
```

## CV Upload Page

```tsx
// app/profile/cv/page.tsx
"use client"
import { useState } from "react"
import { Upload, Loader } from "lucide-react"
import { api } from "@/lib/api"

export default function CVPage() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    const result = await api.ai.analyzeCV(formData)
    setAnalysis(result)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Phân tích CV bằng AI</h1>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center mb-6"
           onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}
           onDragOver={e => e.preventDefault()}>
        <Upload className="mx-auto mb-3 text-gray-400" size={32}/>
        <p className="text-gray-500 mb-3">Kéo thả CV vào đây hoặc</p>
        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)}
               className="hidden" id="cv-upload"/>
        <label htmlFor="cv-upload" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Chọn file PDF
        </label>
        {file && <p className="mt-3 text-sm text-gray-600">✓ {file.name}</p>}
      </div>

      <button onClick={handleUpload} disabled={!file || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader size={18} className="animate-spin"/> Đang phân tích...</> : "Phân tích CV"}
      </button>

      {analysis && (
        <div className="mt-8 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="font-semibold mb-2">Kỹ năng phát hiện được</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.skills?.map((s: string) => (
                <span key={s} className="bg-white border text-sm px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold mb-2">Việc làm phù hợp</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {analysis.job_suggestions?.map((j: string) => <li key={j}>{j}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
```