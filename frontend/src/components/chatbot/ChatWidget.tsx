"use client"
import { useState } from "react"
import { MessageSquare, X, Send, Bot } from "lucide-react"
import { api } from "@/lib/api"
import { Message } from "@/lib/types"

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "assistant", content: "Xin chào! Tôi có thể giúp bạn tìm việc làm hoặc học bổng phù hợp. Hãy cho tôi biết bạn đang tìm kiếm gì?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: "user", content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const { reply } = await api.ai.chat(input, newMessages as Message[])
      setMessages([...newMessages, { role: "assistant", content: reply }])
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Xin lỗi, đã có lỗi kết nối." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {open && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-[340px] sm:w-[380px] h-[540px] flex flex-col mb-4 border border-blue-50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm shadow-inner">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <span className="font-bold block text-sm tracking-wide">AI Tư vấn Nghề nghiệp</span>
                <span className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`text-sm p-3.5 rounded-2xl max-w-[85%] shadow-sm ${
                  m.role === "user" 
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm" 
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 text-slate-500 text-xs p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center shadow-sm rounded-full bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Hỏi AI về việc làm..."
                className="flex-1 bg-transparent border-none pl-5 pr-12 py-3 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              />
              <button onClick={sendMessage}
                className="absolute right-1.5 bg-blue-600 text-white rounded-full p-2 hover:bg-indigo-600 transition shadow-md disabled:opacity-50 hover:scale-105 active:scale-95">
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-4 shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.5)] transition-all hover:scale-110 flex items-center justify-center relative group"
        >
          <MessageSquare size={28} className="transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
        </button>
      )}
    </div>
  )
}
