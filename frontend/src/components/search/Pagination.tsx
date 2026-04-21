"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
}

export default function Pagination({ totalItems, itemsPerPage }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get("page")) || 1
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (totalPages <= 1) return null

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const showMax = 5
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }
      
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Link
        href={createPageURL(currentPage - 1)}
        className={`p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm ${
          currentPage <= 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronLeft size={20} className="text-slate-600" />
      </Link>

      <div className="flex gap-2">
        {getPageNumbers().map((page, i) => (
          page === "..." ? (
            <span key={`dots-${i}`} className="px-3 py-2 text-slate-400 font-bold">...</span>
          ) : (
            <Link
              key={page}
              href={createPageURL(page)}
              className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all shadow-sm ${
                currentPage === page
                  ? "bg-blue-600 text-white shadow-blue-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {page}
            </Link>
          )
        ))}
      </div>

      <Link
        href={createPageURL(currentPage + 1)}
        className={`p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm ${
          currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronRight size={20} className="text-slate-600" />
      </Link>
    </div>
  )
}
