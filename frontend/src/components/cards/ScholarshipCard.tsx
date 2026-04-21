import { Scholarship } from "@/lib/types";
import { GraduationCap, MapPin, Calendar, ExternalLink, Award } from "lucide-react";

export default function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group hover:-translate-y-1">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-inner">
          <GraduationCap size={32} />
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                {scholarship.title}
              </h3>
              <p className="text-slate-600 font-bold flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                {scholarship.organization}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-lg border border-emerald-100">
                {scholarship.coverage}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-lg border border-blue-100">
                {scholarship.level}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-400" />
              {scholarship.country}
            </div>
            <div className="flex items-center gap-2 capitalize">
              <Award size={16} className="text-slate-400" />
              {scholarship.field}
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <Calendar size={16} />
              Deadline: {new Date(scholarship.deadline).toLocaleDateString('vi-VN')}
            </div>
          </div>
          
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
            {scholarship.description}
          </p>
          
          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
            <div className="text-lg font-black text-slate-900 tracking-tight">
              {scholarship.amount}
            </div>
            <a 
              href={scholarship.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:translate-x-1 transition-transform"
            >
              Chi tiết ứng tuyển <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
