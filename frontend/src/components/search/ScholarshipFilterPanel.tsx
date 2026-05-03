"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

const levelOptions = [
  { label: "Cử nhân (Bachelor)", value: "bachelor" },
  { label: "Thạc sĩ (Master)", value: "master" },
  { label: "Tiến sĩ (PhD)", value: "phd" },
]

const coverageOptions = [
  { label: "Toàn phần", value: "full" },
  { label: "Bán phần", value: "partial" },
  { label: "Hỗ trợ học phí", value: "tuition_only" },
]

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
  const [organization, setOrganization] = useState("")
  const [deadlineTo, setDeadlineTo] = useState("")
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const [fieldOptions, setFieldOptions] = useState<string[]>([])
  const [organizationOptions, setOrganizationOptions] = useState<string[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(false)
  const [filtersError, setFiltersError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    setLevel(params.get("level") || "")
    setCoverage(new Set(parseList(params.get("coverage")).map((item) => item.toLowerCase())))
    setCountry(params.get("country") || "")
    setField(params.get("field") || "")
    setOrganization(params.get("organization") || "")
    setDeadlineTo(params.get("deadline_to") || "")
  }, [searchParams])

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
      setFiltersError("Không thể tải bộ lọc")
      setCountryOptions([])
      setFieldOptions([])
      setOrganizationOptions([])
      console.error("Failed to load scholarship filters:", error)
    } finally {
      setIsLoadingFilters(false)
    }
  }

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleCoverage = (value: string) => {
    const next = new Set(coverage)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    setCoverage(next)
    updateParams({ coverage: Array.from(next).join(",") || null })
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 sticky top-24">
      <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
        Bộ lọc tìm kiếm
      </h3>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bậc học</label>
          <select
            id="scholarship-level"
            name="level"
            value={level}
            onChange={(event) => {
              const next = event.target.value
              setLevel(next)
              updateParams({ level: next || null })
            }}
            onFocus={loadFilters}
            onClick={loadFilters}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">Tất cả các bậc</option>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Quốc gia</label>
          <select
            id="scholarship-country"
            name="country"
            value={country}
            onChange={(event) => {
              const next = event.target.value
              setCountry(next)
              updateParams({ country: next || null })
            }}
            onFocus={loadFilters}
            onClick={loadFilters}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">Tất cả quốc gia</option>
            {isLoadingFilters && <option value="">Đang tải...</option>}
            {!isLoadingFilters && filtersError && <option value="">{filtersError}</option>}
            {countryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Ngành học</label>
          <select
            id="scholarship-field"
            name="field"
            value={field}
            onChange={(event) => {
              const next = event.target.value
              setField(next)
              updateParams({ field: next || null })
            }}
            onFocus={loadFilters}
            onClick={loadFilters}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">Tất cả ngành học</option>
            {isLoadingFilters && <option value="">Đang tải...</option>}
            {!isLoadingFilters && filtersError && <option value="">{filtersError}</option>}
            {fieldOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tổ chức</label>
          <select
            id="scholarship-organization"
            name="organization"
            value={organization}
            onChange={(event) => {
              const next = event.target.value
              setOrganization(next)
              updateParams({ organization: next || null })
            }}
            onFocus={loadFilters}
            onClick={loadFilters}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">Tất cả tổ chức</option>
            {isLoadingFilters && <option value="">Đang tải...</option>}
            {!isLoadingFilters && filtersError && <option value="">{filtersError}</option>}
            {organizationOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Deadline đến ngày</label>
          <input
            type="date"
            id="scholarship-deadline"
            name="deadline_to"
            value={deadlineTo}
            onChange={(event) => {
              const next = event.target.value
              setDeadlineTo(next)
              updateParams({ deadline_to: next || null })
            }}
            className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Loại hỗ trợ</label>
          <div className="space-y-2">
            {coverageOptions.map((type) => (
              <label key={type.value} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  id={`scholarship-coverage-${type.value}`}
                  name="coverage"
                  checked={coverage.has(type.value)}
                  onChange={() => toggleCoverage(type.value)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* <button
          type="button"
          onClick={() => updateParams({ level: level || null, coverage: Array.from(coverage).join(",") || null })}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95"
        >
          Áp dụng bộ lọc
        </button> */}
      </div>
    </div>
  )
}
