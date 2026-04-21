"use client"
import { SlidersHorizontal } from "lucide-react"

export default function FilterPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit ${className}`}>
      <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-3">
        <SlidersHorizontal size={18} className="text-blue-500" />
        <h2>Lọc kết quả</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Địa điểm</h3>
          <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-white transition-colors cursor-pointer">
            <option value="">Tất cả địa điểm</option>
            <option value="Ho Chi Minh">Hồ Chí Minh</option>
            <option value="Ha Noi">Hà Nội</option>
            <option value="Da Nang">Đà Nẵng</option>
          </select>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Mức lương tối thiểu</h3>
          <input 
            type="range" 
            min="0" 
            max="100000000" 
            step="5000000" 
            defaultValue="0"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>0</span>
            <span>100tr+</span>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Loại hình</h3>
          <div className="space-y-3 text-sm">
            {['Toàn thời gian', 'Bán thời gian', 'Remote', 'Thực tập'].map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all" />
                </div>
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
