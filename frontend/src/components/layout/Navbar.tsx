"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, User, LogOut, ChevronDown, Bell, FileText, Briefcase, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-login logic
    const savedUser = localStorage.getItem("opportify_user");
    if (!savedUser) {
      const demoUser = { name: "Demo User", email: "demo@opportify.ai" };
      localStorage.setItem("opportify_user", JSON.stringify(demoUser));
      setUser(demoUser);
    } else {
      setUser(JSON.parse(savedUser));
    }

    // Fetch notifications
    fetch("http://localhost:8000/api/v1/applications/notifications")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      })
      .catch(err => {
        console.error(err);
        setNotifications([]);
      });

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname?.startsWith(path);
  };

  const navLinks = [
    { name: "Việc làm", href: "/jobs" },
    { name: "Học bổng", href: "/scholarships" },
    { name: "Chatbot", href: "/chatbot" },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="font-black text-3xl tracking-tighter text-blue-600 flex items-center gap-2">
          <Sparkles size={28} className="text-amber-400 drop-shadow-sm" />
          Opportify<span className="text-slate-900">.</span>
        </Link>
        
        <div className="hidden md:flex gap-8 font-semibold text-sm text-slate-600">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`hover:text-blue-600 transition decoration-2 underline-offset-8 hover:underline ${
                isActive(link.href) ? "text-blue-600 underline" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-100 relative">
              
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition relative active:scale-95"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                       <h4 className="font-black text-sm text-slate-900">Thông báo</h4>
                       <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Đánh dấu đã đọc</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                             <p className="text-xs font-black text-slate-900 mb-1">{n.title}</p>
                             <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                             <span className="text-[9px] font-bold text-slate-300 uppercase mt-2 block">
                               {new Date(n.created_at).toLocaleTimeString()}
                             </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-xs font-bold text-slate-400 italic">Không có thông báo mới</p>
                        </div>
                      )}
                    </div>
                    <Link href="/profile/applications" className="block p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 hover:text-blue-600 transition">Xem tất cả</Link>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pl-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition active:scale-95"
                >
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs font-black text-slate-900">{user.name}</span>
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Premium Member</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                    <User size={16} />
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 mb-2 border-b border-slate-50">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ của bạn</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition">
                      <Sparkles size={18} className="text-amber-400" /> Hồ sơ năng lực
                    </Link>
                    <Link href="/profile/cv" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition">
                      <FileText size={18} className="text-blue-500" /> Tạo CV
                    </Link>
                    <Link href="/profile/applications" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition">
                      <Briefcase size={18} className="text-emerald-500" /> Quản lý ứng tuyển
                    </Link>
                    <div className="h-px bg-slate-50 my-2" />
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition">
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href="/auth/login" className="text-sm font-bold px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition">
                Đăng nhập
              </Link>
              <Link href="/auth/register" className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
