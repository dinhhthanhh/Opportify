import SearchBar from "@/components/search/SearchBar"
import FilterPanel from "@/components/search/FilterPanel"
import JobCard from "@/components/cards/JobCard"
import ChatWidget from "@/components/chatbot/ChatWidget"
import Pagination from "@/components/search/Pagination"
import { api } from "@/lib/api"

import SortDropdown from "@/components/search/SortDropdown"

interface SearchParams {
  q?: string;
  location?: string;
  salary_min?: string;
  salary_max?: string;
  salary_currency?: string;
  job_type?: string;
  experience?: string;
  page?: string;
  sort_by?: string; 
  order?: string;
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // In Next.js 14/15 searchParams is a Promise or object based on version, let's treat it as Promise for safety in v15
  const params = await searchParams;
  
  let results: any[] = [];
  let total = 0;
  let salaryMinBound = 0;
  let salaryMaxBound = 0;
  let salaryCurrency = "VND";
  try {
    const data = await api.jobs.list(params as any);
    results = data.results || [];
    total = data.total || 0;
    if (results.length > 0) {
      const salaryValues = results
        .flatMap((job: any) => [job.salary_min, job.salary_max])
        .filter((value: number | null | undefined) => typeof value === "number" && Number.isFinite(value)) as number[]

      if (salaryValues.length > 0) {
        salaryMinBound = Math.min(...salaryValues)
        salaryMaxBound = Math.max(...salaryValues)
      }
      salaryCurrency = results.find((job: any) => typeof job.salary_currency === "string")?.salary_currency || salaryCurrency
    }
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
  }

  const sortOptions = [
    { label: "Ngày đăng mới nhất", value: "posted_at", order: "desc" as const },
    { label: "Mức lương cao nhất", value: "salary", order: "desc" as const },
    { label: "Độ phù hợp AI", value: "match_score", order: "desc" as const },
    { label: "Hạn nộp gần nhất", value: "deadline", order: "asc" as const },
    { label: "Mức độ phổ biến", value: "popularity", order: "desc" as const },
    { label: "Khoảng cách gần nhất", value: "distance", order: "asc" as const },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 pt-16 pb-24 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Tìm công việc & Học bổng <br/><span className="text-blue-200">Mơ ước của bạn</span></h1>
          <SearchBar placeholder="Tìm kiếm việc làm, kỹ năng, công ty..." />
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 -mt-10">
        <div className="flex flex-col md:flex-row gap-8">
          <FilterPanel
            className="w-full md:w-72 shrink-0 z-10"
            salaryMinBound={salaryMinBound}
            salaryMaxBound={salaryMaxBound}
            salaryCurrency={salaryCurrency}
          />
          <div className="flex-1 mt-10 md:mt-0">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-600 font-medium">Tìm thấy <span className="text-blue-600 font-bold text-lg">{total.toLocaleString()}</span> việc làm phù hợp</p>
              <SortDropdown options={sortOptions} defaultValue="posted_at" />
            </div>
            
            {results.length > 0 ? (
              <>
                <div className="space-y-4">
                  {results.map((job: any) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Pagination totalItems={total} itemsPerPage={20} />
              </>
            ) : (
               <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm mt-4 backdrop-blur-sm">
                  <div className="bg-slate-100 p-5 rounded-full w-fit mx-auto mb-6 shadow-inner">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Chưa có kết quả</h3>
                  <p className="leading-relaxed">Xin lỗi, hiện tại hệ thống chưa trả về danh sách việc làm.<br/>Có thể Backend API chưa phản hồi, hãy đảm bảo Backend đang chạy ở localhost:8000.</p>
               </div>
            )}
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
