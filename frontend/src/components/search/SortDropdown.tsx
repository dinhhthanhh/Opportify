"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ListFilter } from "lucide-react"

interface SortOption {
  label: string;
  value: string;
  order?: "asc" | "desc";
}

interface SortDropdownProps {
  options: SortOption[];
  defaultValue?: string;
}

export default function SortDropdown({ options, defaultValue }: SortDropdownProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const currentSort = searchParams.get("sort_by") || defaultValue || options[0].value
  const currentOrder = searchParams.get("order") || "desc"

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, order] = e.target.value.split(":")
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort_by", sortBy)
    params.set("order", order || "desc")
    params.set("page", "1") // Reset page on sort
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <select
          value={`${currentSort}:${currentOrder}`}
          onChange={handleSortChange}
          className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-10 pr-10 py-3 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer shadow-sm hover:border-slate-300"
        >
          {options.map((option) => (
            <option key={`${option.value}:${option.order || "desc"}`} value={`${option.value}:${option.order || "desc"}`}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <ListFilter size={16} />
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  )
}
