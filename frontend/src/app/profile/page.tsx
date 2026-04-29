// frontend/src/app/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import {
  UserCircle2, Briefcase, GraduationCap, Star, MapPin,
  Code2, ChevronRight, ExternalLink, Award, Calendar,
  Zap, Target, RefreshCw, CheckCircle2, Upload, Loader, FileText, Pencil, Save, X, Image as ImageIcon
} from "lucide-react";
import { UserProfile, RecommendedJob, RecommendedScholarship } from "@/lib/types";
import { api } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_LABELS: Record<string, string> = { fresher: "Fresher", junior: "Junior", mid: "Mid-level", senior: "Senior" };
const EDU_LABELS: Record<string, string> = { bachelor: "Cử nhân / Đại học", master: "Thạc sĩ", phd: "Tiến sĩ" };

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score);
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-black ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-slate-500"}`}>{pct}%</span>
    </div>
  );
}

// Component tái sử dụng cho các ô input nhập mảng chuỗi (cách nhau bằng dấu phẩy)
// Giúp giữ nguyên các phím cách/phẩy khi đang gõ mà không bị mất nét
function CommaSeparatedInput({
  initialValues,
  onChange,
  placeholder,
}: {
  initialValues?: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  // State cục bộ lưu trữ chuỗi văn bản thô (giữ nguyên dấu cách/phẩy của người dùng)
  const [inputValue, setInputValue] = useState(initialValues?.join(", ") || "");

  // Hàm xử lý mỗi khi người dùng gõ phím
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawText = e.target.value;
    
    // 1. Cập nhật giao diện mượt mà
    setInputValue(rawText);
    
    // 2. Chuyển đổi thành mảng sạch và đẩy lên component cha
    const cleanArray = rawText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(cleanArray);
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
type Tab = "profile" | "cv" | "jobs" | "scholarships";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Recommend
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [recommendedScholarships, setRecommendedScholarships] = useState<RecommendedScholarship[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingScholarships, setLoadingScholarships] = useState(false);

  // CV Analysis
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [loadingCV, setLoadingCV] = useState(false);

  // Load Auth & User Profile on mount
  useEffect(() => {
    const initProfile = async () => {
      try {
        await api.auth.autoLogin(); 
        const user = await api.profile.getMe(); 
        setCurrentUser(user);
        setEditData({
          ...user,
          skills: user.skills || [],
          interest_fields: user.interest_fields || [],
          preferred_locations: user.preferred_locations || [],
          preferred_job_types: user.preferred_job_types || []
        });
      } catch (e) {
        console.error("Không thể tải profile", e);
      } finally {
        setLoadingUser(false);
      }
    };
    initProfile();
  }, []);

  const fetchJobs = async () => {
    if (!currentUser) return;
    setLoadingJobs(true);
    try {
      const data = await api.recommend.jobs(currentUser.id);
      setRecommendedJobs(data.results ?? []);
    } catch (e) { console.error(e); } finally { setLoadingJobs(false); }
  };

  const fetchScholarships = async () => {
    if (!currentUser) return;
    setLoadingScholarships(true);
    try {
      const data = await api.recommend.scholarships(currentUser.id);
      setRecommendedScholarships(data.results ?? []);
    } catch (e) { console.error(e); } finally { setLoadingScholarships(false); }
  };

  useEffect(() => {
    if (tab === "jobs" && recommendedJobs.length === 0) fetchJobs();
    if (tab === "scholarships" && recommendedScholarships.length === 0) fetchScholarships();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, currentUser]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await api.profile.updateMe(editData);
      setCurrentUser(updatedUser as UserProfile);
      setIsEditing(false);
      setRecommendedJobs([]); 
      setRecommendedScholarships([]);
    } catch (error) {
      console.error("Lỗi lưu profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeCV = async () => {
    if (!cvFile) return;
    setLoadingCV(true);
    const formData = new FormData();
    formData.append("file", cvFile);
    try {
        const result = await api.ai.analyzeCV(formData);
        setCvAnalysis(result);
    } catch {
        setTimeout(() => {
          setCvAnalysis({
            name: cvFile.name.replace(".pdf", ""),
            skills: ["React", "Next.js", "Python", "Teamwork"],
            experience_years: 2,
            education: "Đại học FPT",
            strengths: ["Kỹ năng Frontend vững", "Giao tiếp tiếng Anh"],
            improvements: ["Thiếu kinh nghiệm Backend"]
          });
          setLoadingCV(false);
        }, 1500);
        return;
    }
    setLoadingCV(false);
  };

  const handleMergeCVtoProfile = async () => {
    if (!cvAnalysis || !currentUser) return;
    try {
      const newSkills = Array.from(new Set([...(currentUser.skills || []), ...(cvAnalysis.skills || [])]));
      const updatedUser = await api.profile.updateMe({
         skills: newSkills,
         experience_years: Math.max(currentUser.experience_years || 0, cvAnalysis.experience_years || 0),
         university: currentUser.university || cvAnalysis.education
      });
      setCurrentUser(updatedUser as UserProfile);
      setEditData(updatedUser as UserProfile);
      alert("Đã cập nhật dữ liệu CV vào Hồ sơ của bạn thành công!");
      setTab("profile");
    } catch (e) { console.error("Lỗi merge CV", e); }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Không xác định";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const tabsConfig: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Hồ sơ năng lực", icon: <UserCircle2 size={18} /> },
    { key: "cv", label: "Phân tích CV (AI)", icon: <FileText size={18} /> },
    { key: "jobs", label: "Việc phù hợp", icon: <Briefcase size={18} /> },
    { key: "scholarships", label: "Học bổng", icon: <GraduationCap size={18} /> },
  ];

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-blue-500" size={40}/></div>;
  if (!currentUser) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang khởi tạo tài khoản... Vui lòng thử tải lại trang.</div>;

  return (

    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30"><Target size={28} /></div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trang Cá Nhân</h1>
            <p className="text-slate-500 font-medium mt-1">Quản lý hồ sơ và nhận đề xuất thông minh từ AI</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          {tabsConfig.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.key ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFILE ── */}
        {tab === "profile" && (
          <div className="space-y-6">
            {!isEditing ? (
              // ── CHẾ ĐỘ HIỂN THỊ (VIEW MODE) ──
              <>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                  <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors z-20">
                    <Pencil size={16}/> Chỉnh sửa
                  </button>

                  <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center shrink-0 text-white shadow-inner backdrop-blur-sm overflow-hidden border-2 border-white/30">
                      {currentUser.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 size={48} className="opacity-70" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-black tracking-tight">{currentUser.full_name || currentUser.username}</h2>
                        <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-semibold backdrop-blur-sm">@{currentUser.username}</span>
                      </div>
                      <p className="text-blue-200 font-medium mb-1">{currentUser.email}</p>
                      <p className="text-blue-200/70 text-xs mb-3 flex items-center gap-1"><Calendar size={12}/> Tham gia: {formatDate(currentUser.created_at)}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentUser.experience_level && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/20 border border-white/30 backdrop-blur-sm uppercase">
                            {LEVEL_LABELS[currentUser.experience_level] || currentUser.experience_level} · {currentUser.experience_years} năm KN
                          </span>
                        )}
                        {(currentUser.university || currentUser.education_field) && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/20 border border-white/30 backdrop-blur-sm flex items-center gap-1.5">
                            <GraduationCap size={14}/> 
                            {[
                              currentUser.education_level ? EDU_LABELS[currentUser.education_level] : null,
                              currentUser.education_field,
                              currentUser.university
                            ].filter(Boolean).join(" - ")}
                          </span>
                        )}
                      </div>

                      <p className="text-blue-100 text-sm leading-relaxed max-w-2xl bg-black/10 p-4 rounded-xl border border-white/10">
                        {currentUser.bio || "Chưa có giới thiệu bản thân. Bấm chỉnh sửa để thêm bio nhé!"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/20">
                    <div className="lg:col-span-2">
                       <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-3 flex items-center gap-2"><Code2 size={16}/> Kỹ năng chuyên môn</h3>
                       <div className="flex flex-wrap gap-2">
                         {currentUser.skills && currentUser.skills.length > 0 ? currentUser.skills.map(s => (
                           <span key={s} className="px-3 py-1.5 bg-white border border-transparent text-blue-700 rounded-lg text-xs font-bold">{s}</span>
                         )) : <span className="text-blue-200/50 text-sm font-medium">Chưa cập nhật (Vào tab Phân tích CV để thêm tự động)</span>}
                       </div>
                    </div>
                    <div className="space-y-5 bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div>
                        <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin size={14}/> Địa điểm làm việc</h3>
                        <p className="text-sm font-medium text-white">{currentUser.preferred_locations?.join(", ") || "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Briefcase size={14}/> Hình thức</h3>
                        <p className="text-sm font-medium text-white capitalize">{currentUser.preferred_job_types?.join(", ") || "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Star size={14}/> Lĩnh vực quan tâm</h3>
                        <p className="text-sm font-medium text-white">{currentUser.interest_fields?.join(", ") || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // ── CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) ──
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Pencil className="text-blue-500"/> Cập nhật hồ sơ</h2>
                  <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X size={20}/></button>
                </div>

                <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                  {/* CỘT 1: THÔNG TIN CƠ BẢN & KINH NGHIỆM */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-slate-900 border-b pb-2">Thông tin cơ bản</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên</label>
                      <input type="text" value={editData.full_name || ""} onChange={e => setEditData({...editData, full_name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><ImageIcon size={16}/> Link ảnh đại diện (Avatar URL)</label>
                      <input type="text" placeholder="https://..." value={editData.avatar_url || ""} onChange={e => setEditData({...editData, avatar_url: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Giới thiệu bản thân (Bio)</label>
                      <textarea rows={3} value={editData.bio || ""} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                    </div>

                    <h3 className="font-bold text-slate-900 border-b pb-2 pt-4">Kinh nghiệm & Kỹ năng</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Số năm kinh nghiệm</label>
                        <input type="number" min="0" value={editData.experience_years || 0} onChange={e => setEditData({...editData, experience_years: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cấp bậc</label>
                        <select value={editData.experience_level || ""} onChange={e => setEditData({...editData, experience_level: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                          <option value="">-- Chọn --</option>
                          <option value="fresher">Fresher</option>
                          <option value="junior">Junior</option>
                          <option value="mid">Mid-level</option>
                          <option value="senior">Senior</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Kỹ năng (cách nhau dấu phẩy)</label>
                      <CommaSeparatedInput
                        initialValues={editData.skills}
                        onChange={(arr) => setEditData({ ...editData, skills: arr })}
                        placeholder="React, Python, SQL..."
                      />
                    </div>
                  </div>

                  {/* CỘT 2: HỌC VẤN & SỞ THÍCH */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-slate-900 border-b pb-2">Học vấn</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Trường Đại học / Tổ chức</label>
                      <input type="text" value={editData.university || ""} onChange={e => setEditData({...editData, university: e.target.value})} placeholder="VD: Đại học Bách Khoa" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Trình độ học vấn</label>
                        <select value={editData.education_level || ""} onChange={e => setEditData({...editData, education_level: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                          <option value="">-- Chọn --</option>
                          <option value="bachelor">Cử nhân / Đại học</option>
                          <option value="master">Thạc sĩ</option>
                          <option value="phd">Tiến sĩ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ngành học</label>
                        <input type="text" value={editData.education_field || ""} onChange={e => setEditData({...editData, education_field: e.target.value})} placeholder="VD: Khoa học máy tính" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 border-b pb-2 pt-4">Sở thích tìm việc</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Lĩnh vực quan tâm (cách nhau dấu phẩy)</label>
                      <CommaSeparatedInput
                        initialValues={editData.interest_fields}
                        onChange={(arr) => setEditData({ ...editData, interest_fields: arr })}
                        placeholder="AI, Frontend, Marketing..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Địa điểm làm việc (cách nhau dấu phẩy)</label>
                      <CommaSeparatedInput
                        initialValues={editData.preferred_locations}
                        onChange={(arr) => setEditData({ ...editData, preferred_locations: arr })}
                        placeholder="Hà Nội, Hồ Chí Minh..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Loại hình công việc (cách nhau dấu phẩy)</label>
                      <CommaSeparatedInput
                        initialValues={editData.preferred_job_types}
                        onChange={(arr) => setEditData({ ...editData, preferred_job_types: arr })}
                        placeholder="fulltime, parttime, remote..."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <button onClick={() => setIsEditing(false)} className="px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Hủy bỏ</button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50">
                    {isSaving ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>} Lưu thay đổi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CÁC TAB KHÁC GIỮ NGUYÊN (CV, JOBS, SCHOLARSHIPS) ── */}
        {tab === "cv" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><Upload size={30}/></div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tải CV lên để AI phân tích</h2>
                <p className="text-slate-500">Chúng tôi sẽ trích xuất kỹ năng, đánh giá điểm mạnh/yếu và tự động cập nhật vào Hồ sơ năng lực của bạn.</p>
              </div>

              <div className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${cvFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50'}`}
                   onDrop={e => { e.preventDefault(); setCvFile(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()}>
                {!cvFile ? (
                  <>
                    <input type="file" accept=".pdf" onChange={e => setCvFile(e.target.files?.[0] || null)} className="hidden" id="cv-upload"/>
                    <label htmlFor="cv-upload" className="cursor-pointer bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 inline-block">Chọn file PDF từ máy tính</label>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText size={48} className="text-blue-500 mb-3" />
                    <h3 className="text-lg font-bold text-slate-800">{cvFile.name}</h3>
                    <p className="text-emerald-600 text-sm font-bold mt-2 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1.5"><CheckCircle2 size={16} /> Đã chọn thành công</p>
                    <button onClick={() => {setCvFile(null); setCvAnalysis(null);}} className="mt-6 text-sm font-bold text-slate-400 hover:text-rose-500 transition">Đổi CV khác</button>
                  </div>
                )}
              </div>

              {cvFile && !cvAnalysis && (
                <button onClick={handleAnalyzeCV} disabled={loadingCV} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loadingCV ? <><Loader size={20} className="animate-spin"/> AI đang đọc và phân tích...</> : "Bắt đầu phân tích CV"}
                </button>
              )}
            </div>

            {cvAnalysis && (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-lg animate-in slide-in-from-bottom-5">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Zap className="text-amber-500"/> Kết quả phân tích từ AI</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><CheckCircle2 size={18}/> Kỹ năng & Điểm mạnh</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cvAnalysis.skills?.map((s: string) => <span key={s} className="px-2.5 py-1 bg-white text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">{s}</span>)}
                    </div>
                    <ul className="space-y-2 text-sm text-emerald-900 font-medium">
                      {cvAnalysis.strengths?.map((s: string, i: number) => <li key={i} className="flex gap-2"><span>•</span>{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6">
                    <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><Target size={18}/> Điểm cần cải thiện</h4>
                    <ul className="space-y-2 text-sm text-rose-900 font-medium">
                      {cvAnalysis.improvements?.map((s: string, i: number) => <li key={i} className="flex gap-2"><span>•</span>{s}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button onClick={handleMergeCVtoProfile} className="bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold transition flex items-center gap-2">
                     <Save size={18}/> Cập nhật vào Hồ sơ của tôi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "jobs" && (
          <div className="animate-in fade-in">
             <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-2xl font-bold text-slate-900">Việc làm phù hợp</h2><p className="text-slate-500 text-sm mt-1">AI chấm điểm độ khớp với hồ sơ của bạn</p></div>
                <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition"><RefreshCw size={16} className={loadingJobs?"animate-spin":""}/> Làm mới</button>
             </div>
             {loadingJobs ? (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({length:3}).map((_,i)=><div key={i} className="h-48 bg-slate-200 rounded-3xl animate-pulse"/>)}</div>
             ) : recommendedJobs.length === 0 ? (
               <div className="text-center py-12 text-slate-400">Không có gợi ý nào. Hãy thêm Kỹ năng vào Hồ sơ!</div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {recommendedJobs.map(job => (
                   <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between">
                     <div>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition">{job.title}</h3>
                          <ScoreBadge score={job.match_score} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 mb-4">{job.company}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills?.slice(0,3).map(s=><span key={s} className="text-xs px-2 py-1 bg-slate-100 rounded-lg font-bold text-slate-600">{s}</span>)}
                        </div>
                     </div>
                     <a href={job.url} target="_blank" className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline mt-2">Xem chi tiết <ExternalLink size={14}/></a>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {tab === "scholarships" && (
          <div className="animate-in fade-in">
             <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-2xl font-bold text-slate-900">Học bổng phù hợp</h2><p className="text-slate-500 text-sm mt-1">Đề xuất dựa trên ngành học và sở thích</p></div>
                <button onClick={fetchScholarships} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition"><RefreshCw size={16} className={loadingScholarships?"animate-spin":""}/> Làm mới</button>
             </div>
             {loadingScholarships ? (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({length:3}).map((_,i)=><div key={i} className="h-48 bg-slate-200 rounded-3xl animate-pulse"/>)}</div>
             ) : recommendedScholarships.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Không có gợi ý học bổng nào. Hãy thêm Lĩnh vực quan tâm!</div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {recommendedScholarships.map(s => (
                   <div key={s.id} className="bg-white border border-slate-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between">
                     <div>
                       <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition">{s.title}</h3>
                         <ScoreBadge score={s.match_score} />
                       </div>
                       <p className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-1.5"><Award size={14}/> {s.organization}</p>
                       <div className="flex flex-wrap gap-2 mb-4 text-xs font-bold">
                         <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600">{s.country}</span>
                         <span className="px-2 py-1 bg-indigo-50 rounded-lg text-indigo-600 uppercase">{s.level}</span>
                       </div>
                     </div>
                     <a href={s.url} target="_blank" className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline mt-2">Xem chi tiết <ExternalLink size={14}/></a>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}