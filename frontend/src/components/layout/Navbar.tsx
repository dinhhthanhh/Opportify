"use client"
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, User, LogOut, ChevronDown } from "lucide-react";
import { api, API_URL } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string, email: string, avatar?: string | null } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initApp = async () => {
      const fetchProfile = async () => {
        const profile = await api.profile.getMe();
        const localAvatar = localStorage.getItem(`profile_avatar_${profile.id}`);
        let avatar = localAvatar || profile.avatar_url;
        if (!localAvatar && avatar && avatar.startsWith("/uploads")) {
          avatar = `${API_URL}${avatar}`;
        }
        setUser({
          name: profile.full_name || profile.username,
          email: profile.contact_email || profile.email,
          avatar,
        });
      };

      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          if (window.location.pathname !== "/auth/login" && window.location.pathname !== "/auth/register") {
            await api.auth.autoLogin();
            await fetchProfile();
          }
        } else {
          try {
            await fetchProfile();
          } catch (err) {
            console.warn("Token may be invalid, trying auto-login...", err);
            await api.auth.autoLogin();
            await fetchProfile();
          }
        }
      } catch (err) {
        console.error("Failed to init app user:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
  ];

  return (
    <nav className={`sticky top-0 z-50 w-full border-b border-slate-100 ${isInitializing ? "bg-white border-none" : "bg-white/80 backdrop-blur-md"}`}>
      <div className={`flex items-center justify-between px-6 py-4 max-w-7xl mx-auto ${isInitializing ? "hidden" : ""}`}>
        <Link href="/" className="font-black text-3xl tracking-tighter text-blue-600 flex items-center gap-2">
          <Sparkles size={28} className="text-amber-400 drop-shadow-sm" />
          Opportify
        </Link>

        <div className="hidden md:flex gap-8 font-semibold text-sm text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-blue-600 transition decoration-2 underline-offset-8 hover:underline ${isActive(link.href) ? "text-blue-600 underline" : ""
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-100 relative">

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pl-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition active:scale-95"
                >
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <span className="text-sm font-black text-slate-900">{user.name}</span>
                    <span className="text-[10px] font-bold text-blue-500 tracking-tight">Xem hồ sơ</span>
                  </div>
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
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
                    <div className="h-px bg-slate-50 my-2" />
                    <button 
                      onClick={() => {
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("guest_id");
                        window.location.href = "/auth/login";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition"
                    >
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

      </div >

      {isInitializing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-20 h-20 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin absolute"></div>
            <Sparkles size={32} className="text-blue-600 animate-pulse" />
          </div>
          <p className="text-slate-800 font-black text-xl tracking-tight mb-2">Đang tải dữ liệu</p>
          <p className="text-slate-500 font-medium text-sm">Vui lòng chờ trong giây lát...</p>
        </div>
      )}
    </nav >
  );
}
