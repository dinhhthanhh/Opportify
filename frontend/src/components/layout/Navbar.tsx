"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname?.startsWith(path);
  };

  const navLinks = [
    { name: "Việc làm", href: "/jobs" },
    { name: "Học bổng", href: "/scholarships" },
    { name: "Hồ sơ AI", href: "/profile" },
    { name: "CV AI", href: "/profile/cv" },
    { name: "Chatbot", href: "/chatbot" },
  ];

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

        <div className="flex gap-4">
          <Link href="/auth/login" className="text-sm font-bold px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition">
            Đăng nhập
          </Link>
          <Link href="/auth/register" className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition hover:-translate-y-0.5 active:translate-y-0">
            Đăng ký
          </Link>
        </div>
      </div>
    </nav>
  );
}
