"use client"
import { Search } from "lucide-react"

export default function SearchBar({ placeholder = "Tìm kiếm việc làm, kỹ năng, công ty..." }: { placeholder?: string }) {
  return (
    <div className="relative max-w-3xl w-full mx-auto shadow-sm group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-md shadow-slate-200/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base placeholder:text-slate-400"
        placeholder={placeholder}
      />
      <div className="absolute inset-y-0 right-2 flex items-center">
        <button className="bg-blue-600 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer shadow-sm active:scale-95">
          Tìm kiếm
        </button>
      </div>
    </div>
  )
}
