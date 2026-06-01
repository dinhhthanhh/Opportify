"use client"

import { useState, useEffect } from "react"
import { Briefcase, Calendar, CheckCircle2, Clock, XCircle, Edit3, ChevronRight, MapPin, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { API_URL } from "@/lib/api"

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingApp, setEditingApp] = useState<any>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/v1/applications/my`)
      .then(res => res.json())
      .then(data => {
        setApps(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "interviewing":
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg border border-amber-200 flex items-center gap-1.5"><Calendar size={12} /> Phỏng vấn</span>
      case "viewed":
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded-lg border border-blue-200 flex items-center gap-1.5"><Eye size={12} /> Đã xem</span>
      case "rejected":
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-lg border border-red-200 flex items-center gap-1.5"><XCircle size={12} /> Từ chối</span>
      case "offered":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-200 flex items-center gap-1.5"><CheckCircle2 size={12} /> Trúng tuyển</span>
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-lg border border-slate-200 flex items-center gap-1.5"><Clock size={12} /> Chờ duyệt</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Quản lý ứng tuyển</h1>
          <p className="text-slate-500 font-bold">Theo dõi trạng thái và chỉnh sửa thông tin hồ sơ của bạn</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : apps.length > 0 ? (
          <div className="space-y-6">
            {apps.map((app) => (
              <div key={app.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                  {app.item_type === "job" ? <Briefcase className="text-blue-600" /> : <Calendar className="text-amber-600" />}
                </div>
                
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{app.title}</h3>
                      {getStatusBadge(app.status)}
                   </div>
                   <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(app.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 uppercase tracking-widest">{app.item_type}</span>
                      {app.is_viewed ? (
                        <span className="flex items-center gap-1 text-emerald-600"><Eye size={14} /> Nhà tuyển dụng đã xem</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500"><EyeOff size={14} /> Chưa xem - Có thể sửa</span>
                      )}
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   {app.status === "interviewing" && app.interview_date && (
                     <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Lịch phỏng vấn</p>
                        <p className="text-xs font-black text-amber-900">{new Date(app.interview_date).toLocaleString()}</p>
                     </div>
                   )}
                   
                   {!app.is_viewed && (
                     <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                       <Edit3 size={18} />
                     </button>
                   )}
                   
                   <Link href={app.item_type === "job" ? `/jobs/${app.item_id}` : `/scholarships/${app.item_id}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                      <ChevronRight size={18} />
                   </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Briefcase size={32} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">Bạn chưa ứng tuyển vị trí nào</h3>
             <p className="text-slate-500 font-medium mb-8">Hãy bắt đầu khám phá hàng ngàn cơ hội việc làm và học bổng ngay!</p>
             <Link href="/jobs" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition shadow-xl shadow-blue-500/20">
               Khám phá ngay
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}
