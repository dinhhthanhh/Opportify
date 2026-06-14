import Link from "next/link";
import { ArrowRight, Target, GraduationCap, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none"></div>
        
        {/* Abstract shapes */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-10 right-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse [animation-delay:2s]"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-blue-700 text-sm font-bold tracking-wide mb-8 border border-slate-200 shadow-sm">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Việc làm & Học bổng cho sinh viên
          </span>
          
          <h1 className="text-6xl md:text-[5.5rem] font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Khám phá cơ hội, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Kiến tạo tương lai.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Opportify kết nối bạn với những công việc và học bổng tốt nhất.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/jobs" className="px-10 py-5 w-full sm:w-auto bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 hover:-translate-y-1 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group">
              Tìm việc ngay <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/scholarships" className="px-10 py-5 w-full sm:w-auto bg-white text-slate-800 border-2 border-slate-200 rounded-2xl font-bold text-lg shadow-md hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
              <GraduationCap size={22} className="text-indigo-500" /> Khám phá học bổng
            </Link>
          </div>
          
          <div className="mt-16 text-sm font-semibold text-slate-400 flex items-center justify-center gap-6">
             <span>Tương thích với hàng ngàn cơ hội từ</span>
             <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                 <span className="font-bold text-xl tracking-tighter text-slate-800">TopCV</span>
                 <span className="font-bold text-xl tracking-tighter text-blue-600">itviec</span>
             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50/50 border-t border-slate-100 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Tất cả cơ hội trong một nơi</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">Việc làm, thực tập và học bổng được tổng hợp và cập nhật liên tục, giúp bạn tìm đúng cơ hội phù hợp với năng lực.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group hover:-translate-y-2">
              <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Briefcase size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Tìm việc theo năng lực</h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                Lọc việc làm theo ngành nghề, kỹ năng, địa điểm và kinh nghiệm. Gợi ý dựa trên hồ sơ năng lực giúp bạn tìm đúng vị trí phù hợp.
              </p>
            </div>
            
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group hover:-translate-y-2">
              <div className="bg-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Học bổng toàn cầu</h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                Tổng hợp các chương trình học bổng uy tín từ DAAD, Chevening, MEXT, KGSP... kèm điều kiện GPA, ngoại ngữ rõ ràng để bạn dễ dàng đối chiếu.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group hover:-translate-y-2">
              <div className="bg-emerald-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Target size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Hồ sơ năng lực rõ ràng</h3>
              <p className="text-slate-500 text-base leading-relaxed font-medium">
                Xây dựng hồ sơ năng lực với kỹ năng, học vấn và mục tiêu nghề nghiệp để nhận về danh sách việc làm, học bổng phù hợp nhất với bạn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
