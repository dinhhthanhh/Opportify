"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Trash2, Sparkles, MessageSquare } from "lucide-react"
import { api } from "@/lib/api"
import { Message } from "@/lib/types"
import ReactMarkdown from 'react-markdown'

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "assistant", content: "Chào mừng bạn đến với **AI Career Explorer**! Tôi là trợ lý AI chuyên biệt về sự nghiệp.\n\nHôm nay tôi có thể giúp gì cho bạn? Bạn có thể thử:\n- **### Tối ưu CV:** \"Làm sao để CV IT nổi bật?\"\n- **### Tìm học bổng:** \"Học bổng thạc sĩ tại Đức năm 2025?\"\n- **### Lộ trình:** \"Lộ trình từ Intern lên Senior Backend?\"" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll only when messages change, but not on initial mount or simple navigation
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom()
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const { reply } = await api.ai.chat(input, messages as Message[])
      setMessages(prev => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Xin lỗi, đã có lỗi kết nối với máy chủ AI. Hãy đảm bảo Backend đang chạy." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-80 bg-slate-50 border-r border-slate-200 flex-col">
        <div className="p-6">
          <button onClick={() => setMessages([messages[0]])} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
            <MessageSquare size={18} /> Chat mới
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Gần đây</div>
          {["Tư vấn CV Master", "Tìm học bổng DAAD", "Top cty IT tại VN"].map((chat, i) => (
            <button key={i} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-600 transition-all truncate border border-transparent hover:border-slate-100">
              {chat}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider">Opportify Pro</span>
            </div>
            <p className="text-[11px] font-medium opacity-80 mb-3">Mở khóa phân tích RAG chuyên sâu cho CV của bạn.</p>
            <button className="w-full py-2 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">Nâng cấp ngay</button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl">
              <Bot size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Opportify AI Advisor</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hoạt động</span>
              </div>
            </div>
          </div>
          <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Xóa lịch sử">
            <Trash2 size={18} />
          </button>
        </header>

        {/* Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50/30">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 md:gap-6 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  m.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-100 text-blue-600"
                }`}>
                  {m.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[80%] ${m.role === "user" ? "items-end" : ""}`}>
                  <div className={`p-4 md:p-5 rounded-3xl text-sm md:text-base leading-relaxed shadow-sm border ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white border-blue-500 rounded-tr-none font-medium" 
                      : "bg-white border-slate-100 text-slate-700 rounded-tl-none prose prose-slate max-w-none"
                  }`}>
                    {m.role === "assistant" ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1">
                    {m.role === "user" ? "Bạn" : "AI Advisor"} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 md:gap-6">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={20} />
                </div>
                <div className="bg-white border border-slate-100 p-5 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-10 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-[2rem] p-2 pr-4 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Đặt câu hỏi cho AI về sự nghiệp..."
                className="flex-1 bg-transparent border-none px-6 py-4 text-sm md:text-base outline-none text-slate-700 placeholder:text-slate-400 font-medium"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white rounded-[1.5rem] p-4 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
              Dữ liệu được xử lý bởi AI Qwen3 • Chuyên nghiệp & Tận tâm
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
