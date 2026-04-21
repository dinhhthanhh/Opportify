import SearchBar from "@/components/search/SearchBar"
import FilterPanel from "@/components/search/FilterPanel"
import JobCard from "@/components/cards/JobCard"
import ChatWidget from "@/components/chatbot/ChatWidget"
import Pagination from "@/components/search/Pagination"
import { api } from "@/lib/api"

interface SearchParams {
  q?: string; location?: string; salary_min?: string; page?: string;
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // In Next.js 14/15 searchParams is a Promise or object based on version, let's treat it as Promise for safety in v15
  const params = await searchParams;
  
  let results: any[] = [];
  let total = 0;
  try {
    const data = await api.jobs.list(params as any);
    results = data.results || [];
    total = data.total || 0;
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
  }

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
          <FilterPanel className="w-full md:w-72 shrink-0 z-10" />
          <div className="flex-1 mt-10 md:mt-0">
            <div className="flex justify-between items-end mb-6">
              <p className="text-slate-600 font-medium">Tìm thấy <span className="text-blue-600 font-bold text-lg">{total.toLocaleString()}</span> việc làm phù hợp</p>
              <select className="text-sm bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                <option>Mới nhất</option>
                <option>Lương cao nhất</option>
                <option>Phù hợp nhất (AI)</option>
              </select>
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
