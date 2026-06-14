"use client"
import { SlidersHorizontal, Check, RotateCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

const jobTypeOptions = [
  { label: "Toàn thời gian", value: "fulltime" },
  { label: "Bán thời gian", value: "parttime" },
  { label: "Thực tập", value: "internship" },
]

const experienceOptions = [
  { label: "Mới đi làm", value: "fresher" },
  { label: "Junior", value: "junior" },
  { label: "Trung cấp", value: "mid" },
  { label: "Cao cấp", value: "senior" },
]

// Nhóm ngành HUST — đồng bộ với cột `industry` trong dữ liệu seed
const industryOptions = [
  "Công nghệ thông tin",
  "Điện - Điện tử - Viễn thông",
  "Tự động hóa - Robotics",
  "Cơ khí - Cơ điện tử - Ô tô",
  "Vật liệu - Luyện kim - Nano",
  "Hóa - Sinh - Thực phẩm - Môi trường",
  "Năng lượng - Nhiệt lạnh",
  "Xây dựng - Hạ tầng - Giao thông",
  "Kinh tế - Logistics - Quản trị",
  "Ngoại ngữ Khoa học Công nghệ",
  "Liên ngành - Giáo dục - Đào tạo",
]

const workModeOptions = [
  { label: "Tại văn phòng", value: "onsite" },
  { label: "Linh hoạt", value: "hybrid" },
  { label: "Làm từ xa", value: "remote" },
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

  const [locations, setLocations] = useState<Set<string>>(new Set())
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [salaryMin, setSalaryMin] = useState(salaryMinDefault)
  const [jobTypes, setJobTypes] = useState<Set<string>>(new Set())
  const [experiences, setExperiences] = useState<Set<string>>(new Set())
  const [industries, setIndustries] = useState<Set<string>>(new Set())
  const [workModes, setWorkModes] = useState<Set<string>>(new Set())

  const salaryMinLimit = Number.isFinite(salaryMinBound) ? salaryMinBound : salaryMinDefault
  const salaryMaxLimit = Number.isFinite(salaryMaxBound) ? salaryMaxBound : salaryMinDefault
  const salaryRangeMax = Math.max(salaryMinLimit, salaryMaxLimit)
  const salaryStep = Math.max(1, Math.round((salaryRangeMax - salaryMinLimit) / 50) || 1)

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: salaryCurrency, maximumFractionDigits: 0 }),
    [salaryCurrency]
  )

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
      setLocationError("Không tải được địa điểm")
      console.error("Failed to load locations:", error)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  // Load locations on mount
  useEffect(() => {
    loadLocations()
  }, [])

  // Đồng bộ trạng thái cục bộ từ URL (sau khi đã Áp dụng)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const parsedSalary = Number(params.get("salary_min"))

    setLocations(new Set(parseList(params.get("location"))))
    if (Number.isNaN(parsedSalary)) {
      setSalaryMin(salaryMinLimit)
    } else {
      setSalaryMin(parsedSalary)
    }
    setJobTypes(new Set(parseList(params.get("job_type")).map((item) => item.toLowerCase())))
    setExperiences(new Set(parseList(params.get("experience")).map((item) => item.toLowerCase())))
    setIndustries(new Set(parseList(params.get("industry"))))
    setWorkModes(new Set(parseList(params.get("work_mode")).map((item) => item.toLowerCase())))
  }, [searchParams, salaryMinLimit])

  const toggleListValue = (current: Set<string>, value: string) => {
    const next = new Set(current)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    return next
  }

  // Chỉ lọc khi bấm "Áp dụng"
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    const setOrDelete = (key: string, value: string | null) => {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    setOrDelete("location", Array.from(locations).join(",") || null)
    setOrDelete("salary_min", salaryMin > 0 ? salaryMin.toString() : null)
    setOrDelete("salary_currency", salaryMin > 0 ? salaryCurrency : null)
    setOrDelete("job_type", Array.from(jobTypes).join(",") || null)
    setOrDelete("experience", Array.from(experiences).join(",") || null)
    setOrDelete("industry", Array.from(industries).join(",") || null)
    setOrDelete("work_mode", Array.from(workModes).join(",") || null)

    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setLocations(new Set())
    setSalaryMin(salaryMinLimit)
    setJobTypes(new Set())
    setExperiences(new Set())
    setIndustries(new Set())
    setWorkModes(new Set())

    // Giữ lại từ khóa tìm kiếm và tiêu chí sắp xếp, chỉ xóa bộ lọc
    const params = new URLSearchParams(searchParams.toString())
    ;["location", "salary_min", "salary_currency", "job_type", "experience", "industry", "work_mode"].forEach((k) =>
      params.delete(k)
    )
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[calc(100vh-7rem)] ${className}`}>
      <div className="flex items-center gap-2 px-5 pt-5 pb-3 text-slate-800 font-semibold border-b border-slate-100 shrink-0">
        <SlidersHorizontal size={18} className="text-blue-500" />
        <h2>Lọc kết quả</h2>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 px-5 py-5">
        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Ngành nghề</h3>
          <div className="space-y-2.5 text-sm">
            {industryOptions.map((name) => (
              <label key={name} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={industries.has(name)}
                  onChange={() => setIndustries(toggleListValue(industries, name))}
                  className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all shrink-0"
                />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors leading-snug">{name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Địa điểm</h3>
          {isLoadingLocations && <p className="text-xs text-slate-400">Đang tải địa điểm...</p>}
          {!isLoadingLocations && locationOptions.length === 0 && locationError && (
            <p className="text-xs text-rose-500">{locationError}</p>
          )}
          <div className="space-y-2.5 text-sm max-h-48 overflow-y-auto pr-1">
            {locationOptions.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={locations.has(option)}
                  onChange={() => setLocations(toggleListValue(locations, option))}
                  className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all shrink-0"
                />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors leading-snug">{option}</span>
              </label>
            ))}
          </div>
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
                <input
                  type="checkbox"
                  checked={jobTypes.has(type.value)}
                  onChange={() => setJobTypes(toggleListValue(jobTypes, type.value))}
                  className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all"
                />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Hình thức làm việc</h3>
          <div className="space-y-3 text-sm">
            {workModeOptions.map((mode) => (
              <label key={mode.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={workModes.has(mode.value)}
                  onChange={() => setWorkModes(toggleListValue(workModes, mode.value))}
                  className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all"
                />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{mode.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-slate-700 mb-3 block">Kinh nghiệm</h3>
          <div className="space-y-3 text-sm">
            {experienceOptions.map((level) => (
              <label key={level.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={experiences.has(level.value)}
                  onChange={() => setExperiences(toggleListValue(experiences, level.value))}
                  className="peer w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer shadow-sm transition-all"
                />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{level.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Thanh hành động luôn hiển thị ở cuối */}
      <div className="shrink-0 border-t border-slate-100 p-4 flex gap-2 bg-white rounded-b-2xl">
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <RotateCcw size={15} /> Xóa lọc
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Check size={16} /> Áp dụng
        </button>
      </div>
    </div>
  )
}
