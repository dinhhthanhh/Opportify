import SearchBar from "@/components/search/SearchBar"
import FilterPanel from "@/components/search/FilterPanel"
import ScholarshipCard from "@/components/cards/ScholarshipCard"
import ChatWidget from "@/components/chatbot/ChatWidget"
import Pagination from "@/components/search/Pagination"
import { api } from "@/lib/api"
import { Scholarship } from "@/lib/types"
import { GraduationCap } from "lucide-react"

interface SearchParams {
  q?: string; country?: string; level?: string; page?: string;
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
          <SearchBar placeholder="Tìm học bổng theo quốc gia, ngành học hoặc bậc học..." />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 -mt-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Filters */}
          <div className="w-full lg:w-80 shrink-0">
             <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 sticky top-24">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                  Bộ lọc tìm kiếm
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bậc học</label>
                    <select className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none">
                      <option>Tất cả các bậc</option>
                      <option>Cử nhân (Bachelor)</option>
                      <option>Thạc sĩ (Master)</option>
                      <option>Tiến sĩ (PhD)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Loại hỗ trợ</label>
                    <div className="space-y-2">
                      {["Toàn phần", "Bán phần", "Hỗ trợ học phí"].map((type) => (
                        <label key={type} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer group">
                           <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                    Áp dụng bộ lọc
                  </button>
                </div>
             </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-500 font-bold ml-2">Tìm thấy <span className="text-indigo-600">{total}</span> học bổng phù hợp</p>
              <div className="flex gap-2">
                <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
              </div>
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
      <ChatWidget />
    </div>
  )
}
