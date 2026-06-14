"use client"
import { useEffect, useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

const levelOptions = [
  { label: "Cử nhân", value: "bachelor" },
  { label: "Thạc sĩ", value: "master" },
  { label: "Tiến sĩ", value: "phd" },
]

const coverageOptions = [
  { label: "Toàn phần", value: "full" },
  { label: "Bán phần", value: "partial" },
  { label: "Hỗ trợ học phí", value: "tuition_only" },
]

const gpaOptions = [
  { label: "Từ 2.5 trở lên", value: "2.5" },
  { label: "Từ 3.0 trở lên", value: "3.0" },
  { label: "Từ 3.2 trở lên", value: "3.2" },
  { label: "Từ 3.5 trở lên", value: "3.5" },
  { label: "Từ 3.7 trở lên", value: "3.7" },
]

const languageOptions = ["IELTS", "TOEFL", "TOEIC", "JLPT", "TOPIK", "HSK"]

function parseList(value: string | null) {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function ScholarshipFilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [level, setLevel] = useState("")
  const [coverage, setCoverage] = useState<Set<string>>(new Set())
  const [country, setCountry] = useState("")
  const [field, setField] = useState("")
  const [organizations, setOrganizations] = useState<Set<string>>(new Set())
  const [deadlineTo, setDeadlineTo] = useState("")
  const [minGpa, setMinGpa] = useState("")
  const [languages, setLanguages] = useState<Set<string>>(new Set())
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const [fieldOptions, setFieldOptions] = useState<string[]>([])
  const [organizationOptions, setOrganizationOptions] = useState<string[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(false)
  const [filtersError, setFiltersError] = useState<string | null>(null)

  const loadFilters = async () => {
    if (isLoadingFilters || countryOptions.length > 0 || fieldOptions.length > 0 || organizationOptions.length > 0) return
    setIsLoadingFilters(true)
    setFiltersError(null)
    try {
      const data = await api.scholarships.filters()
      setCountryOptions(data.countries.map((item) => item.trim()).filter(Boolean))
      setFieldOptions(data.fields.map((item) => item.trim()).filter(Boolean))
      setOrganizationOptions(data.organizations.map((item) => item.trim()).filter(Boolean))
    } catch (error) {
      setFiltersError("Không tải được bộ lọc")
      setCountryOptions([])
      setFieldOptions([])
      setOrganizationOptions([])
      console.error("Failed to load scholarship filters:", error)
    } finally {
      setIsLoadingFilters(false)
    }
  }

  // Load filters on mount
  useEffect(() => {
    loadFilters()
  }, [])

  // Đồng bộ trạng thái cục bộ từ URL (sau khi đã Áp dụng)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    setLevel(params.get("level") || "")
    setCoverage(new Set(parseList(params.get("coverage")).map((item) => item.toLowerCase())))
    setCountry(params.get("country") || "")
    setField(params.get("field") || "")
    setOrganizations(new Set(parseList(params.get("organization"))))
    setDeadlineTo(params.get("deadline_to") || "")
    setMinGpa(params.get("min_gpa") || "")
    setLanguages(new Set(parseList(params.get("language"))))
  }, [searchParams])

  const toggleCoverage = (value: string) => {
    const next = new Set(coverage)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setCoverage(next)
  }

  // Chỉ lọc khi bấm "Áp dụng"
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    const setOrDelete = (key: string, value: string | null) => {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    setOrDelete("level", level || null)
    setOrDelete("coverage", Array.from(coverage).join(",") || null)
    setOrDelete("country", country || null)
    setOrDelete("field", field || null)
    setOrDelete("organization", Array.from(organizations).join(",") || null)
    setOrDelete("deadline_to", deadlineTo || null)
    setOrDelete("min_gpa", minGpa || null)
    setOrDelete("language", Array.from(languages).join(",") || null)
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setLevel("")
    setCoverage(new Set())
    setCountry("")
    setField("")
    setOrganizations(new Set())
    setDeadlineTo("")
    setMinGpa("")
    setLanguages(new Set())
    const params = new URLSearchParams(searchParams.toString())
    ;["level", "coverage", "country", "field", "organization", "deadline_to", "min_gpa", "language"].forEach((k) =>
      params.delete(k)
    )
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectClass =
    "w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24 flex flex-col max-h-[calc(100vh-7rem)]">
      <h3 className="text-lg font-black text-slate-900 px-8 pt-8 pb-5 flex items-center gap-2 shrink-0">
        <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
        Bộ lọc tìm kiếm
      </h3>

      <div className="space-y-6 overflow-y-auto flex-1 px-8 pb-2">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bậc học</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectClass}>
            <option value="">Tất cả các bậc</option>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Quốc gia</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} onFocus={loadFilters} onClick={loadFilters} className={selectClass}>
            <option value="">Tất cả quốc gia</option>
            {isLoadingFilters && <option value="">Đang tải...</option>}
            {!isLoadingFilters && filtersError && <option value="">{filtersError}</option>}
            {countryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Ngành học</label>
          <select value={field} onChange={(e) => setField(e.target.value)} onFocus={loadFilters} onClick={loadFilters} className={selectClass}>
            <option value="">Tất cả ngành học</option>
            {isLoadingFilters && <option value="">Đang tải...</option>}
            {!isLoadingFilters && filtersError && <option value="">{filtersError}</option>}
            {fieldOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tổ chức cấp</label>
          {isLoadingFilters && <p className="text-xs text-slate-400">Đang tải tổ chức...</p>}
          {!isLoadingFilters && filtersError && <p className="text-xs text-rose-500">{filtersError}</p>}
          <div className="space-y-2.5 text-sm max-h-48 overflow-y-auto pr-1">
            {organizationOptions.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={organizations.has(option)}
                  onChange={() => {
                    const next = new Set(organizations)
                    if (next.has(option)) next.delete(option)
                    else next.add(option)
                    setOrganizations(next)
                  }}
                  className="peer w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all shrink-0"
                />
                <span className="text-slate-600 font-semibold group-hover:text-indigo-650 transition-colors leading-snug">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Điểm trung bình tối thiểu</label>
          <select value={minGpa} onChange={(e) => setMinGpa(e.target.value)} className={selectClass}>
            <option value="">Tất cả mức điểm</option>
            {gpaOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Chứng chỉ ngoại ngữ</label>
          <div className="space-y-2.5 text-sm max-h-48 overflow-y-auto pr-1">
            {languageOptions.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={languages.has(option)}
                  onChange={() => {
                    const next = new Set(languages)
                    if (next.has(option)) next.delete(option)
                    else next.add(option)
                    setLanguages(next)
                  }}
                  className="peer w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all shrink-0"
                />
                <span className="text-slate-600 font-semibold group-hover:text-indigo-650 transition-colors leading-snug">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Hạn nộp đến ngày</label>
          <input
            type="date"
            value={deadlineTo}
            onChange={(e) => setDeadlineTo(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Loại hỗ trợ</label>
          <div className="space-y-2">
            {coverageOptions.map((type) => (
              <label key={type.value} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  checked={coverage.has(type.value)}
                  onChange={() => toggleCoverage(type.value)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Thanh hành động luôn hiển thị ở cuối */}
      <div className="shrink-0 border-t border-slate-100 p-5 flex gap-2 bg-white rounded-b-[2rem]">
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <RotateCcw size={15} /> Xóa lọc
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Check size={16} /> Áp dụng
        </button>
      </div>
    </div>
  )
}
