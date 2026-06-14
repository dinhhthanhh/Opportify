import SearchBar from "@/components/search/SearchBar"
import ScholarshipFilterPanel from "@/components/search/ScholarshipFilterPanel"
import ScholarshipCard from "@/components/cards/ScholarshipCard"
import Pagination from "@/components/search/Pagination"
import { api } from "@/lib/api"
import { Scholarship } from "@/lib/types"
import { GraduationCap } from "lucide-react"

import SortDropdown from "@/components/search/SortDropdown"

export const dynamic = "force-dynamic"

interface SearchParams {
  q?: string;
  country?: string;
  level?: string;
  coverage?: string;
  field?: string;
  organization?: string;
  deadline_to?: string;
  page?: string;
  sort_by?: string; 
  order?: string;
}

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  
  let results: Scholarship[] = [];
  let total = 0;
  try {
    const data = await api.scholarships.list(params as any);
    results = data.results || [];
    total = data.total || 0;
  } catch (error) {
    console.error("Failed to fetch scholarships:", error)
  }

  const sortOptions = [
    { label: "Hạn nộp gần nhất", value: "deadline", order: "asc" as const },
    { label: "Ngày đăng mới nhất", value: "posted_at", order: "desc" as const },
    { label: "Giá trị học bổng cao nhất", value: "value", order: "desc" as const },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-indigo-900 pt-20 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-800 skew-x-12 translate-x-1/2 opacity-20"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-800 text-indigo-100 text-[10px] font-black tracking-widest uppercase mb-6 border border-indigo-700">
            Cơ hội học tập toàn cầu
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-none">
            Săn học bổng <br/><span className="text-indigo-400">Thay đổi tương lai</span>
          </h1>
          <SearchBar placeholder="Tìm học bổng theo tên..." />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Filters */}
          <div className="w-full lg:w-80 shrink-0">
            <ScholarshipFilterPanel />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-900 font-extrabold ml-2">Tìm thấy <span className="text-indigo-700 text-xl font-black">{total}</span> học bổng phù hợp</p>
              <SortDropdown options={sortOptions} defaultValue="deadline" />
            </div>
            
            <div className="space-y-6">
              {results.map((item) => (
                <ScholarshipCard key={item.id} scholarship={item} />
              ))}
              <Pagination totalItems={total} itemsPerPage={20} />
            </div>
            
            {results.length === 0 && (
               <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 mb-8 border border-slate-100">
                    <GraduationCap size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">Chưa tìm thấy học bổng</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">Hãy thử điều chỉnh lại từ khóa hoặc bộ lọc để tìm kiếm thêm nhiều cơ hội khác.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
