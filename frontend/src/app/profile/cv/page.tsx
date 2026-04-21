"use client"
import { useState } from "react"
import { Upload, Loader, FileText, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import ChatWidget from "@/components/chatbot/ChatWidget"

export default function CVPage() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
        const result = await api.ai.analyzeCV(formData)
        setAnalysis(result)
    } catch {
        console.error("Lỗi khi phân tích CV.")
        // Mock data để demo nếu backend chưa bật
        setTimeout(() => {
          setAnalysis({
            name: file.name.replace(".pdf", ""),
            skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
            experience_years: 3,
            education: "Đại học Công nghệ",
            job_suggestions: ["Frontend Engineer tại VNG", "React Developer tại FPT"],
            scholarship_suggestions: ["Học bổng master ngành Software Engineering"],
            strengths: ["Kỹ năng lập trình UI tốt", "Cập nhật công nghệ mới"],
            improvements: ["Cần thêm kinh nghiệm System Design"]
          })
          setLoading(false)
        }, 1500)
        return
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Phân tích CV bằng AI</h1>
          <p className="text-slate-500 text-lg">Tải lên CV của bạn, AI sẽ đánh giá, gợi ý cải thiện và tìm công việc phù hợp.</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 transition-all">
            <div className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors
                ${file ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50'}`}
                 onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}
                 onDragOver={e => e.preventDefault()}>
              
              {!file ? (
                <>
                  <div className="bg-white p-4 rounded-full shadow-sm w-fit mx-auto mb-4 border border-slate-100">
                    <Upload className="text-blue-500" size={32}/>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Kéo thả file PDF vào đây</h3>
                  <p className="text-slate-500 mb-8 text-sm">Hoặc nhấn nút bên dưới để chọn file. Kích thước tối đa 5MB.</p>
                  
                  <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)}
                         className="hidden" id="cv-upload"/>
                  <label htmlFor="cv-upload" className="cursor-pointer bg-blue-600 shadow-lg hover:shadow-xl text-white font-semibold px-8 py-3 rounded-xl text-sm hover:bg-blue-700 transition shadow-blue-600/30 active:scale-95 inline-block">
                    Chọn tệp tin
                  </label>
                </>
              ) : (
                <div className="flex flex-col items-center">
                    <FileText size={56} className="text-blue-500 mb-4 drop-shadow-sm" />
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{file.name}</h3>
                    <p className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5 mt-2 bg-emerald-50 px-3 py-1 rounded-full">
                        <CheckCircle2 size={16} /> Đã tải lên thành công
                    </p>
                    <button onClick={() => {setFile(null); setAnalysis(null);}} className="mt-8 text-sm font-medium text-slate-400 hover:text-red-500 transition border-b border-transparent hover:border-red-500">
                      Đổi CV khác
                    </button>
                </div>
              )}
            </div>

            <button onClick={handleUpload} disabled={!file || loading}
                    className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {loading ? (
                  <><Loader size={20} className="animate-spin"/> AI Đang phân tích hồ sơ...</>
              ) : "Bắt đầu AI phân tích"}
            </button>
        </div>

        {analysis && (
          <div className="bg-white border text-left border-slate-200 rounded-3xl p-8 shadow-md animate-in slide-in-from-bottom-5 fade-in duration-500">
             <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100">
                 <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-inner border border-blue-50">
                     {(analysis.name || "U")[0]}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">{analysis.name || "Thí sinh"}</h2>
                    <p className="text-slate-500 mt-1.5 font-medium">{analysis.experience_years} năm kinh nghiệm • {analysis.education}</p>
                 </div>
             </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div className="bg-emerald-50/80 border border-emerald-100/80 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                            <span className="bg-emerald-200/80 p-1.5 rounded-lg text-emerald-700"><CheckCircle2 size={16} /></span>
                            Kỹ năng nổi bật
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                        {analysis.skills?.map((s: string) => (
                            <span key={s} className="bg-white border border-emerald-200/60 text-emerald-700 font-semibold text-sm px-3.5 py-1.5 rounded-lg shadow-sm">{s}</span>
                        ))}
                        </div>
                    </div>
                    
                    <div className="bg-blue-50/80 border border-blue-100/80 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-blue-800 mb-4 block text-lg">Điểm mạnh</h3>
                        <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
                            {analysis.strengths?.map((j: string, i: number) => (
                                <li key={i} className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><span>{j}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-indigo-50/80 border border-indigo-100/80 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                            Gợi ý việc làm phù hợp
                        </h3>
                        <ul className="space-y-3">
                            {analysis.job_suggestions?.map((j: string, i: number) => (
                                <li key={i} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-indigo-100 shadow-sm text-sm text-indigo-900 font-bold hover:bg-slate-50 transition cursor-pointer hover:shadow-md">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-inner"></div>
                                    {j}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-orange-50/80 border border-orange-100/80 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-orange-800 mb-4 block text-lg">Điểm cần cải thiện</h3>
                        <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
                            {analysis.improvements?.map((j: string, i: number) => (
                                <li key={i} className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0"></div><span>{j}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
      <ChatWidget />
    </div>
  )
}
