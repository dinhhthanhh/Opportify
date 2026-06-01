"use client"

import { useState } from "react"
import { X, Send, CheckCircle2, Upload, FileText, User } from "lucide-react"
import { API_URL } from "@/lib/api"

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  itemType: string
  title: string
}

export default function ApplyModal({ isOpen, onClose, itemId, itemType, title }: ApplyModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "Demo User",
    email: "demo@opportify.ai",
    phone: "",
    coverLetter: "",
    useProfileCV: true
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    const data = new FormData()
    data.append("item_id", itemId)
    data.append("item_type", itemType)
    data.append("full_name", formData.fullName)
    data.append("email", formData.email)
    data.append("phone", formData.phone)
    data.append("cover_letter", formData.coverLetter)
    
    try {
      await fetch(`${API_URL}/api/v1/applications/apply`, {
        method: "POST",
        body: data
      })
      setStep(3)
    } catch (error) {
      console.error("Apply failed:", error)
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start border-b border-slate-50">
          <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ứng tuyển ngay</h3>
             <p className="text-sm font-bold text-blue-600 mt-1">{title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Họ và tên</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số điện thoại</label>
                <input 
                  type="text" 
                  placeholder="09xx xxx xxx"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-slate-700" 
                />
              </div>

              <div className="pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Chọn CV của bạn</h4>
                <div className="grid grid-cols-1 gap-3">
                   <button 
                    onClick={() => setFormData({...formData, useProfileCV: true})}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${formData.useProfileCV ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                   >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.useProfileCV ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <User size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">Sử dụng CV từ hồ sơ AI</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cập nhật lúc 03/05/2026</p>
                      </div>
                      {formData.useProfileCV && <CheckCircle2 size={20} className="ml-auto text-blue-600" />}
                   </button>
                   
                   <button 
                    onClick={() => setFormData({...formData, useProfileCV: false})}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${!formData.useProfileCV ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                   >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!formData.useProfileCV ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Upload size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">Tải CV mới lên</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">PDF, DOCX (Max 5MB)</p>
                      </div>
                      {!formData.useProfileCV && <CheckCircle2 size={20} className="ml-auto text-blue-600" />}
                   </button>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Tiếp tục
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thư giới thiệu (Không bắt buộc)</label>
                <textarea 
                  rows={6}
                  placeholder="Chia sẻ lý do bạn phù hợp với vị trí này..."
                  value={formData.coverLetter}
                  onChange={e => setFormData({...formData, coverLetter: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium text-slate-700 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Quay lại
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-2 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận nộp đơn"} <Send size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 size={48} />
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Nộp đơn thành công!</h3>
               <p className="text-slate-600 font-medium max-w-sm mx-auto">
                 Hồ sơ của bạn đã được gửi đến nhà tuyển dụng. Opportify AI sẽ thông báo cho bạn ngay khi có phản hồi.
               </p>
               <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
               >
                 Đóng
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
