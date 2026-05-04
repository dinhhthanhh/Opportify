"use client"
import { SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

const jobTypeOptions = [
  { label: "Toàn thời gian", value: "fulltime" },
  { label: "Bán thời gian", value: "parttime" },
  { label: "Thực tập", value: "internship" },
]

const experienceOptions = [
  { label: "Fresher", value: "fresher" },
  { label: "Junior", value: "junior" },
  { label: "Mid", value: "mid" },
  { label: "Senior", value: "senior" },
]

const salaryMinDefault = 0

function parseList(value: string | null) {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function FilterPanel({
  className = "",
  salaryMinBound = 0,
  salaryMaxBound = 0,
  salaryCurrency = "VND",
}: {
  className?: string
  salaryMinBound?: number
  salaryMaxBound?: number
  salaryCurrency?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState("")
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [salaryMin, setSalaryMin] = useState(salaryMinDefault)
  const [jobTypes, setJobTypes] = useState<Set<string>>(new Set())
  const [experiences, setExperiences] = useState<Set<string>>(new Set())

  const salaryMinLimit = Number.isFinite(salaryMinBound) ? salaryMinBound : salaryMinDefault
  const salaryMaxLimit = Number.isFinite(salaryMaxBound) ? salaryMaxBound : salaryMinDefault
  const salaryRangeMax = Math.max(salaryMinLimit, salaryMaxLimit)
  const salaryStep = Math.max(1, Math.round((salaryRangeMax - salaryMinLimit) / 50) || 1)

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: salaryCurrency, maximumFractionDigits: 0 }),
    [salaryCurrency]
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const parsedSalary = Number(params.get("salary_min"))

    setLocation(params.get("location") || "")
    if (Number.isNaN(parsedSalary)) {
      setSalaryMin(salaryMinLimit)
    } else {
      setSalaryMin(parsedSalary)
    }
    setJobTypes(new Set(parseList(params.get("job_type")).map((item) => item.toLowerCase())))
    setExperiences(new Set(parseList(params.get("experience")).map((item) => item.toLowerCase())))
  }, [searchParams, salaryMinLimit])

  const loadLocations = async () => {
    if (isLoadingLocations || locationOptions.length > 0) return
    setIsLoadingLocations(true)
    setLocationError(null)
    try {
      const data = await api.jobs.locations()
      const normalized = data.results
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
      setLocationOptions(normalized)
    } catch (error) {
      setLocationOptions([])
      setLocationError("Không thể tải địa điểm")
      console.error("Failed to load locations:", error)
    } finally {
      setIsLoadingLocations(false)
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

  const toggleListValue = (current: Set<string>, value: string) => {
    const next = new Set(current)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    return next
  }

  const applyJobTypes = (next: Set<string>) => {
    const serialized = Array.from(next).join(",")
    updateParams({ job_type: serialized || null })
  }

  const applyExperience = (next: Set<string>) => {
    const serialized = Array.from(next).join(",")
    updateParams({ experience: serialized || null })
  }

  const applySalaryMin = (value: number) => {
    const salaryValue = value > 0 ? value.toString() : null
    updateParams({ salary_min: salaryValue, salary_currency: value > 0 ? salaryCurrency : null })
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit ${className}`}>
      <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold border-b border-slate-100 pb-3">
        <SlidersHorizontal size={18} className="text-blue-500" />
        <h2>Lọc kết quả</h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Địa điểm</h3>
          <select
            id="job-location"
            name="location"
            value={location}
            onChange={(event) => {
              const next = event.target.value
              setLocation(next)
              updateParams({ location: next || null })
            }}
            onFocus={loadLocations}
            onClick={loadLocations}
            onMouseDown={loadLocations}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-white transition-colors cursor-pointer"
          >
            <option value="">Tất cả địa điểm</option>
            {isLoadingLocations && <option value="">Đang tải...</option>}
            {!isLoadingLocations && locationOptions.length === 0 && locationError && (
              <option value="">{locationError}</option>
            )}
            {locationOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-2 block">Mức lương tối thiểu</h3>
          <div className="text-xs text-slate-500 font-medium mb-3">{currencyFormatter.format(salaryMin)}</div>
          <input
            type="range"
            id="job-salary-min"
            name="salary_min"
            min={salaryMinLimit}
            max={salaryRangeMax}
            step={salaryStep}
            value={salaryMin}
            onChange={(event) => setSalaryMin(Number(event.target.value))}
            onMouseUp={(event) => applySalaryMin(Number((event.target as HTMLInputElement).value))}
            onTouchEnd={(event) => applySalaryMin(Number((event.target as HTMLInputElement).value))}
            onBlur={(event) => applySalaryMin(Number((event.target as HTMLInputElement).value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{currencyFormatter.format(salaryMinLimit)}</span>
            <span>{currencyFormatter.format(salaryRangeMax)}</span>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Loại hình</h3>
          <div className="space-y-3 text-sm">
            {jobTypeOptions.map((type) => (
              <label key={type.value} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={jobTypes.has(type.value)}
                    onChange={() => {
                      const next = toggleListValue(jobTypes, type.value)
                      setJobTypes(next)
                      applyJobTypes(next)
                    }}
                    className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all"
                  />
                </div>
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Kinh nghiệm</h3>
          <div className="space-y-3 text-sm">
            {experienceOptions.map((level) => (
              <label key={level.value} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={experiences.has(level.value)}
                    onChange={() => {
                      const next = toggleListValue(experiences, level.value)
                      setExperiences(next)
                      applyExperience(next)
                    }}
                    className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all"
                  />
                </div>
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{level.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
