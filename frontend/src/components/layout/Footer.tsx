import Link from "next/link";
import { Sparkles, Globe, Mail, Info } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <Link href="/" className="font-black text-3xl tracking-tighter text-blue-600 flex items-center gap-2 mb-6">
              <Sparkles size={28} className="text-amber-400 drop-shadow-sm" />
              Opportify<span className="text-slate-900">.</span>
            </Link>
            <p className="text-slate-500 max-w-sm mb-8 font-medium leading-relaxed">
              Nền tảng kết nối cơ hội việc làm và học bổng dựa trên trí tuệ nhân tạo, giúp bạn kiến tạo sự nghiệp tương lai một cách thông minh nhất.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all hover:-translate-y-1 shadow-sm">
                <Globe size={20} />
              </a>
              <a href="#" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-100 transition-all hover:-translate-y-1 shadow-sm">
                <Mail size={20} />
              </a>
              <a href="#" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-700 hover:border-blue-100 transition-all hover:-translate-y-1 shadow-sm">
                <Info size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Nền tảng</h4>
            <ul className="space-y-4 text-slate-500 font-medium">
              <li><Link href="/jobs" className="hover:text-blue-600 transition">Tìm việc làm</Link></li>
              <li><Link href="/scholarships" className="hover:text-blue-600 transition">Tìm học bổng</Link></li>
              <li><Link href="/profile/cv" className="hover:text-blue-600 transition">Phân tích CV</Link></li>
              <li><Link href="/chatbot" className="hover:text-blue-600 transition">Hỏi AI</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 text-slate-500 font-medium">
              <li><a href="#" className="hover:text-blue-600 transition">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Liên hệ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} Opportify AI Platform. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-semibold text-slate-400">
            <span>Made with ❤️ for students & professionals</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
