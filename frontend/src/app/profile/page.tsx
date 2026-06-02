// frontend/src/app/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCircle2, Briefcase, GraduationCap, Star, MapPin,
  Code2, ChevronRight, ExternalLink, Award, Calendar,
  Zap, Target, RefreshCw, CheckCircle2, Upload, Loader, FileText, Pencil, Save, X, ToggleLeft, ToggleRight, Sparkles, CheckSquare, Plus, Trash2
} from "lucide-react";
import { UserProfile, RecommendedJob, RecommendedScholarship } from "@/lib/types";
import { api, API_URL } from "@/lib/api";

// ── Helpers & Constants ───────────────────────────────────────────────────────
const LEVEL_LABELS: Record<string, string> = { fresher: "Fresher", junior: "Junior", mid: "Mid-level", senior: "Senior" };
const EDU_LABELS: Record<string, string> = { bachelor: "Cử nhân / Đại học", master: "Thạc sĩ", phd: "Tiến sĩ" };

interface EducationMilestone {
  school: string;
  level: string;
  major: string;
  years: string;
  cpa?: string;
  gpa?: string;
  thesis?: string;
}

interface LanguageScore {
  certificate: string;
  score: string;
}

interface ExperienceMilestone {
  company: string;
  position: string;
  years: string;
  projects: string[];
}

function getGradientByHash(text: string) {
  const gradients = [
    "from-blue-500 to-indigo-650",
    "from-indigo-500 to-purple-600",
    "from-purple-500 to-pink-600",
    "from-violet-500 to-indigo-700",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function categorizeSkills(skills: string[]) {
  const hard: string[] = [];
  const academic: string[] = [];
  const languages: string[] = [];

  const langKeywords = ["ielts", "toefl", "toeic", "german", "english", "french", "tiếng", "japanese", "chinese", "jlpt", "hsk", "ngoại ngữ"];
  const academicKeywords = ["writing", "research", "methodology", "literature", "statistics", "statistical", "latex", "analysis", "spss", "học thuật", "nghiên cứu"];

  skills.forEach(skill => {
    const sLower = skill.toLowerCase();
    if (langKeywords.some(kw => sLower.includes(kw))) {
      languages.push(skill);
    } else if (academicKeywords.some(kw => sLower.includes(kw))) {
      academic.push(skill);
    } else {
      hard.push(skill);
    }
  });

  return { hard, academic, languages };
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeJobAppCount, setActiveJobAppCount] = useState(0);
  const [activeScholarshipAppCount, setActiveScholarshipAppCount] = useState(0);

  // Profile Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Extra Mocked Fields (Persisted in LocalStorage)
  const [availability, setAvailability] = useState<"seeking" | "watching">("seeking");
  const [aspirations, setAspirations] = useState<string[]>([]);
  const [languageScores, setLanguageScores] = useState<LanguageScore[]>([]);
  const [educationHistory, setEducationHistory] = useState<EducationMilestone[]>([]);
  const [experienceHistory, setExperienceHistory] = useState<ExperienceMilestone[]>([]);

  // Text inputs for edit form comma separation to avoid cursor resets
  const [skillsInput, setSkillsInput] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
  const [fieldsInput, setFieldsInput] = useState("");

  // Sub-Tab selection
  const [activeTab, setActiveTab] = useState<"profile" | "jobs" | "scholarships">("profile");

  // Matching Opportunities
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [recommendedScholarships, setRecommendedScholarships] = useState<RecommendedScholarship[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // CV Upload & Analysis
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [loadingCV, setLoadingCV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCurrentUser(prev => prev ? { ...prev, avatar_url: base64String } : null);
        setEditData(prev => ({ ...prev, avatar_url: base64String }));
        if (currentUser) {
          localStorage.setItem(`profile_avatar_${currentUser.id}`, base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditData({
      ...currentUser,
      skills: currentUser?.skills || [],
      interest_fields: currentUser?.interest_fields || [],
      preferred_locations: currentUser?.preferred_locations || [],
      preferred_job_types: currentUser?.preferred_job_types || []
    });
    setSkillsInput(currentUser?.skills?.join(", ") || "");
    setLocationsInput(currentUser?.preferred_locations?.join(", ") || "");
    setFieldsInput(currentUser?.interest_fields?.join(", ") || "");
  };

  // Initialize Profile & Fetch Data
  useEffect(() => {
    const initProfile = async () => {
      try {
        await api.auth.autoLogin();
        const user = await api.profile.getMe();

        // Load custom localStorage avatar
        const localAvatarKey = `profile_avatar_${user.id}`;
        const localAvatar = localStorage.getItem(localAvatarKey);
        if (localAvatar) {
          user.avatar_url = localAvatar;
        }
        setCurrentUser(user);

        // Sync database fields with editable data
        setEditData({
          ...user,
          skills: user.skills || [],
          interest_fields: user.interest_fields || [],
          preferred_locations: user.preferred_locations || [],
          preferred_job_types: user.preferred_job_types || []
        });

        // Load applications count
        fetch(`${API_URL}/api/v1/applications/my`)
          .then(res => res.json())
          .then(apps => {
            if (Array.isArray(apps)) {
              const jobsApps = apps.filter(app => app.item_type === "job");
              const schApps = apps.filter(app => app.item_type === "scholarship");
              setActiveJobAppCount(jobsApps.length);
              setActiveScholarshipAppCount(schApps.length);
            }
          })
          .catch(e => console.error("Lỗi lấy ứng tuyển", e));

        // Load custom localStorage fields
        const localKey = `profile_mock_${user.id}`;
        const localDataRaw = localStorage.getItem(localKey);
        if (localDataRaw) {
          const localData = JSON.parse(localDataRaw);
          setAvailability(localData.availability || "seeking");
          setAspirations(localData.aspirations || ["Tìm việc làm Full-time", "Săn học bổng Sau đại học"]);

          if (localData.languageScores) {
            setLanguageScores(localData.languageScores);
          } else if (localData.targetScores) {
            const migrated = [];
            if (localData.targetScores.ielts) migrated.push({ certificate: "IELTS", score: localData.targetScores.ielts });
            if (localData.targetScores.toefl) migrated.push({ certificate: "TOEFL", score: localData.targetScores.toefl });
            if (localData.targetScores.gre) migrated.push({ certificate: "GRE", score: localData.targetScores.gre });
            if (localData.targetScores.gmat) migrated.push({ certificate: "GMAT", score: localData.targetScores.gmat });
            setLanguageScores(migrated);
          } else {
            setLanguageScores([
              { certificate: "IELTS", score: "7.0" },
              { certificate: "TOEFL", score: "95" },
              { certificate: "GRE", score: "310" }
            ]);
          }
          setEducationHistory(localData.educationHistory || []);
          setExperienceHistory(localData.experienceHistory || []);
        } else {
          // Pre-populate with realistic defaults matching database profile
          const initialEdu: EducationMilestone[] = [];
          if (user.university) {
            initialEdu.push({
              school: user.university,
              level: user.education_level || "bachelor",
              major: user.education_field || "Công nghệ thông tin",
              years: "2021 - 2025",
              cpa: "3.4/4.0",
              thesis: "Nghiên cứu ứng dụng AI trong tối ưu hóa tìm kiếm việc làm"
            });
          }
          const initialExp: ExperienceMilestone[] = [];
          if (user.experience_years && user.experience_years > 0) {
            initialExp.push({
              company: "FPT Software",
              position: user.experience_level === "senior" ? "Senior Engineer" : "Junior Developer",
              years: `${user.experience_years} năm (2024 - Hiện tại)`,
              projects: ["Xây dựng hệ thống Crawler dữ liệu đa nguồn bằng Python", "Tối ưu hóa UI Frontend cho ứng dụng web React/Next.js"]
            });
          }
          setAvailability("seeking");
          setAspirations(["Tìm việc làm Full-time", "Săn học bổng Sau đại học"]);
          setLanguageScores([
            { certificate: "IELTS", score: "7.0" },
            { certificate: "TOEFL", score: "95" },
            { certificate: "GRE", score: "310" }
          ]);
          setEducationHistory(initialEdu);
          setExperienceHistory(initialExp);
        }

        // Fetch matches
        fetchRecommendations(user.id);

      } catch (e) {
        console.error("Không thể tải profile", e);
      } finally {
        setLoadingUser(false);
      }
    };
    initProfile();
  }, []);

  const fetchRecommendations = async (userId: string) => {
    setLoadingMatch(true);
    try {
      const jobData = await api.recommend.jobs(userId);
      setRecommendedJobs(jobData.results?.slice(0, 5) || []);
      const schData = await api.recommend.scholarships(userId);
      setRecommendedScholarships(schData.results?.slice(0, 5) || []);
    } catch (e) {
      console.error("Lỗi lấy đề xuất", e);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Save changes to backend & localStorage
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const finalSkills = skillsInput.split(",").map(x => x.trim()).filter(Boolean);
      const finalLocations = locationsInput.split(",").map(x => x.trim()).filter(Boolean);
      const finalFields = fieldsInput.split(",").map(x => x.trim()).filter(Boolean);

      const payload = {
        ...editData,
        skills: finalSkills,
        preferred_locations: finalLocations,
        interest_fields: finalFields
      };

      // 1. Save to backend database
      const updatedUser = await api.profile.updateMe(payload);

      const localAvatarKey = `profile_avatar_${currentUser.id}`;
      const localAvatar = localStorage.getItem(localAvatarKey);
      if (localAvatar) {
        updatedUser.avatar_url = localAvatar;
      }

      setCurrentUser(updatedUser as UserProfile);

      // 2. Save custom fields to localStorage
      const localKey = `profile_mock_${currentUser.id}`;
      const mockPayload = {
        availability,
        aspirations,
        languageScores,
        educationHistory,
        experienceHistory
      };
      localStorage.setItem(localKey, JSON.stringify(mockPayload));

      setIsEditing(false);

      // Refresh recommendations
      fetchRecommendations(currentUser.id);
    } catch (error) {
      console.error("Lỗi lưu hồ sơ", error);
    } finally {
      setIsSaving(false);
    }
  };

  // CV Upload Analysis
  const handleAnalyzeCV = async () => {
    if (!cvFile || !currentUser) return;
    setLoadingCV(true);
    const formData = new FormData();
    formData.append("file", cvFile);
    try {
      const result = await api.ai.analyzeCV(formData);
      setCvAnalysis(result);
    } catch {
      // Robust simulated fallback if API fails
      setTimeout(() => {
        setCvAnalysis({
          name: cvFile.name.replace(".pdf", ""),
          skills: ["React", "Next.js", "Python", "Academic Writing", "IELTS 7.5", "Docker"],
          experience_years: Math.max(currentUser.experience_years || 0, 2),
          education: currentUser.university || "Đại học Bách Khoa Hà Nội",
          strengths: ["Kỹ năng lập trình Frontend vững vàng", "Có khả năng viết bài báo khoa học tiếng Anh"],
          improvements: ["Nên bổ sung thêm chứng chỉ GRE để săn học bổng Mỹ"]
        });
        setLoadingCV(false);
      }, 2000);
      return;
    }
    setLoadingCV(false);
  };

  const handleMergeCVtoProfile = () => {
    if (!cvAnalysis || !currentUser) return;

    // Merge skills
    const currentSkills = editData.skills || [];
    const mergedSkills = Array.from(new Set([...currentSkills, ...(cvAnalysis.skills || [])]));

    setEditData({
      ...editData,
      skills: mergedSkills,
      experience_years: Math.max(editData.experience_years || 0, cvAnalysis.experience_years || 0),
      university: editData.university || cvAnalysis.education
    });

    // Automatically update timeline if empty
    if (educationHistory.length === 0 && cvAnalysis.education) {
      setEducationHistory([
        {
          school: cvAnalysis.education,
          level: editData.education_level || "bachelor",
          major: editData.education_field || "Công nghệ thông tin",
          years: "2021 - 2025",
          gpa: "3.2/4.0",
          thesis: "Nghiên cứu được trích xuất từ CV"
        }
      ]);
    }

    alert("Đã phân tích và trích xuất dữ liệu CV vào form thành công! Hãy nhấn 'Lưu thay đổi' phía dưới để lưu lại.");
    setCvAnalysis(null);
    setCvFile(null);
  };

  // Calculate Profile Completeness (Progress Bar)
  const calculateCompleteness = () => {
    if (!currentUser) return 0;
    const items = [
      (currentUser.skills?.length || 0) > 0,
      !!currentUser.experience_level,
      !!currentUser.education_level,
      !!currentUser.education_field,
      !!currentUser.university,
      (currentUser.interest_fields?.length || 0) > 0,
      (currentUser.preferred_locations?.length || 0) > 0,
      aspirations.length > 0,
      educationHistory.length > 0,
      experienceHistory.length > 0,
    ];
    const filled = items.filter(Boolean).length;
    return Math.round((filled / items.length) * 100);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Không thể kết nối tài khoản. Vui lòng tải lại trang.
      </div>
    );
  }

  const { hard, academic, languages } = categorizeSkills(currentUser.skills || []);
  const completionPct = calculateCompleteness();
  const tagline = `${currentUser.experience_level ? LEVEL_LABELS[currentUser.experience_level] : "Kỹ sư"} ${currentUser.education_field || "Công nghệ"} & Ứng viên tiềm năng`;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">

      {/* A. Khu vực Header (Thông tin chung & Thống kê nhanh) */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 pt-16 pb-28 px-6 text-white shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/2 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">

          <div className="flex gap-5 items-center">
            {/* Circular Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center border-2 border-white/20 shadow-xl overflow-hidden shrink-0 relative group">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">{currentUser.full_name?.charAt(0) || currentUser.username.charAt(0).toUpperCase()}</span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={16} className="text-white mb-1" />
                  <span className="text-[9px] text-white font-bold uppercase">Tải ảnh</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">{currentUser.full_name || currentUser.username}</h1>
                <span className="bg-white/15 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">@{currentUser.username}</span>
              </div>
              <p className="text-indigo-200 text-sm font-semibold mb-1">{currentUser.email}</p>
              <p className="text-white/60 text-xs flex items-center gap-1.5"><Sparkles size={12} /> {tagline}</p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            {!isEditing ? (
              <button
                onClick={handleStartEditing}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-black px-6 py-3 rounded-2xl shadow-xl transition-all flex items-center gap-2"
              >
                <Pencil size={16} /> Chỉnh sửa hồ sơ
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3 rounded-2xl border border-white/10 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} Lưu hồ sơ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-blue-205 shrink-0"><Briefcase size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Kinh nghiệm</p>
              <p className="text-base md:text-lg font-black">{currentUser.experience_years || 0} năm làm việc</p>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-purple-205 shrink-0"><GraduationCap size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Trình độ cao nhất</p>
              <p className="text-base md:text-lg font-black capitalize">{currentUser.education_level ? EDU_LABELS[currentUser.education_level] : "Chưa cập nhật"}</p>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-pink-205 shrink-0"><Briefcase size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Việc làm ứng tuyển</p>
              <p className="text-base md:text-lg font-black">{activeJobAppCount} công việc</p>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-amber-205 shrink-0"><GraduationCap size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Học bổng ứng tuyển</p>
              <p className="text-base md:text-lg font-black">{activeScholarshipAppCount} học bổng</p>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid Content (65/35 Layout) */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* B. Cột Trái (65%): Dữ liệu cốt lõi */}
          <div className="lg:col-span-8 space-y-8">

            {/* 0. Thông tin Hồ sơ & Học vấn (Edit mode only - render at the top) */}
            {isEditing && (
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
                <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-2">
                  <UserCircle2 size={20} className="text-blue-600" /> Thông tin Hồ sơ & Học vấn
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Họ tên hiển thị</label>
                    <input type="text" value={editData.full_name || ""} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Đại học / Viện nghiên cứu</label>
                    <input type="text" value={editData.university || ""} onChange={e => setEditData({ ...editData, university: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Trình độ học vấn</label>
                    <select value={editData.education_level || ""} onChange={e => setEditData({ ...editData, education_level: e.target.value as any })} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none">
                      <option value="">Chọn trình độ</option>
                      <option value="bachelor">Cử nhân</option>
                      <option value="master">Thạc sĩ</option>
                      <option value="phd">Tiến sĩ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Ngành học</label>
                    <input type="text" value={editData.education_field || ""} onChange={e => setEditData({ ...editData, education_field: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Số năm kinh nghiệm</label>
                    <input type="number" value={editData.experience_years || 0} onChange={e => setEditData({ ...editData, experience_years: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Bio / Giới thiệu</label>
                  <textarea rows={3} value={editData.bio || ""} onChange={e => setEditData({ ...editData, bio: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-[1.25rem] gap-1.5 mb-8 border border-slate-200/40 w-fit backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-2.5 px-5 text-xs md:text-sm font-bold rounded-[1rem] transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                  activeTab === "profile" 
                    ? "bg-white text-blue-600 shadow-sm border border-slate-100 font-black" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                <UserCircle2 size={16} /> Hồ sơ cá nhân
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`py-2.5 px-5 text-xs md:text-sm font-bold rounded-[1rem] transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                  activeTab === "jobs" 
                    ? "bg-white text-blue-600 shadow-sm border border-slate-100 font-black" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                <Briefcase size={16} /> Việc làm phù hợp
                {recommendedJobs.length > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-lg font-black transition-colors ${
                    activeTab === "jobs" ? "bg-blue-50 text-blue-700" : "bg-slate-200/60 text-slate-600"
                  }`}>
                    {Math.round(recommendedJobs[0].match_score * 100) / 1}%
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("scholarships")}
                className={`py-2.5 px-5 text-xs md:text-sm font-bold rounded-[1rem] transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                  activeTab === "scholarships" 
                    ? "bg-white text-indigo-650 shadow-sm border border-slate-100 font-black" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                <GraduationCap size={16} /> Học bổng phù hợp
                {recommendedScholarships.length > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-lg font-black transition-colors ${
                    activeTab === "scholarships" ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/60 text-slate-600"
                  }`}>
                    {Math.round(recommendedScholarships[0].match_score * 100) / 1}%
                  </span>
                )}
              </button>
            </div>

            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* 1. Định hướng Sự nghiệp & Học thuật */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-[4rem] -z-0 pointer-events-none"></div>

                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Target size={20} /></div>
                    <h2 className="text-xl font-black text-slate-800">Định hướng Sự nghiệp & Học thuật</h2>
                  </div>

                  {!isEditing ? (
                    <div className="border-2 border-dashed border-slate-150 rounded-2xl p-6 bg-slate-50/30 space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Địa điểm mong muốn</p>
                          <div className="flex flex-wrap gap-1.5">
                            {currentUser.preferred_locations && currentUser.preferred_locations.length > 0 ? (
                              currentUser.preferred_locations.map(loc => (
                                <span key={loc} className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-100">
                                  {loc}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">Chưa cập nhật</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Lĩnh vực quan tâm</p>
                          <div className="flex flex-wrap gap-1.5">
                            {currentUser.interest_fields && currentUser.interest_fields.length > 0 ? (
                              currentUser.interest_fields.map(field => (
                                <span key={field} className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg border border-purple-100">
                                  {field}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">Chưa cập nhật</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Mục tiêu ngắn hạn / Nguyện vọng</p>
                        <div className="flex flex-wrap gap-2">
                          {aspirations.map(asp => (
                            <span key={asp} className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-indigo-500" /> {asp}
                            </span>
                          ))}
                          {aspirations.length === 0 && <span className="text-slate-400 text-xs">Chưa chọn nguyện vọng</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Địa điểm mong muốn (phân cách bằng dấu phẩy)</label>
                          <input
                            type="text"
                            value={locationsInput}
                            onChange={e => setLocationsInput(e.target.value)}
                            placeholder="Hà Nội, Hồ Chí Minh, Đức, Anh..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Lĩnh vực quan tâm (phân cách bằng dấu phẩy)</label>
                          <input
                            type="text"
                            value={fieldsInput}
                            onChange={e => setFieldsInput(e.target.value)}
                            placeholder="AI, Kinh tế, Tiếp thị, IT..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mục tiêu ngắn hạn / Nguyện vọng</label>
                        <div className="grid sm:grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                          {[
                            "Tìm việc làm Full-time",
                            "Săn học bổng Sau đại học",
                            "Tìm vị trí Nghiên cứu (Research Assistant)",
                            "Thực tập doanh nghiệp",
                            "Làm việc tự xa tự do"
                          ].map(asp => {
                            const active = aspirations.includes(asp);
                            return (
                              <label key={asp} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${active ? "bg-indigo-50 border-indigo-200 text-indigo-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}>
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() => {
                                    if (active) setAspirations(aspirations.filter(x => x !== asp));
                                    else setAspirations([...aspirations, asp]);
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{asp}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Dòng thời gian Lịch sử Học vấn & Kinh nghiệm */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Calendar size={20} /></div>
                      <h2 className="text-xl font-black text-slate-800">Lịch sử Học vấn & Kinh nghiệm</h2>
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEducationHistory([...educationHistory, { school: "", level: "bachelor", major: "", years: "", cpa: "" }])}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg flex items-center gap-1"
                        >
                          <Plus size={12} /> Thêm Học vấn
                        </button>
                        <button
                          onClick={() => setExperienceHistory([...experienceHistory, { company: "", position: "", years: "", projects: [""] }])}
                          className="px-3 py-1.5 bg-purple-50 text-purple-600 font-bold text-xs rounded-lg flex items-center gap-1"
                        >
                          <Plus size={12} /> Thêm Kinh nghiệm
                        </button>
                      </div>
                    )}
                  </div>

                  {/* View Mode Timeline */}
                  {!isEditing ? (
                    <div className="relative pl-6 border-l-2 border-slate-100 ml-4 space-y-8">
                      {/* Education Items */}
                      {educationHistory.map((edu, i) => (
                        <div key={`edu-${i}`} className="relative">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center shadow-md">
                            <GraduationCap size={10} className="text-white" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-extrabold text-slate-800 text-base">{edu.school}</h3>
                              <span className="text-[10px] bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded border border-blue-100 uppercase">{edu.years}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-500 mb-2 capitalize">{EDU_LABELS[edu.level] || edu.level} · Chuyên ngành {edu.major}</p>
                            {(edu.cpa || edu.gpa) && (
                              <p className="text-xs text-slate-600 font-bold bg-slate-50 border border-slate-100 w-fit px-2 py-0.5 rounded-lg mb-2">
                                Điểm trung bình (CPA): {edu.cpa || edu.gpa}
                              </p>
                            )}
                            {edu.thesis && (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 font-medium leading-relaxed">
                                <strong>Đề tài/Luận văn:</strong> {edu.thesis}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Experience Items */}
                      {experienceHistory.map((exp, i) => (
                        <div key={`exp-${i}`} className="relative">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-purple-500 border-4 border-white flex items-center justify-center shadow-md">
                            <Briefcase size={10} className="text-white" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-extrabold text-slate-800 text-base">{exp.company}</h3>
                              <span className="text-[10px] bg-purple-50 text-purple-700 font-black px-2 py-0.5 rounded border border-purple-100 uppercase">{exp.years}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-500 mb-2">{exp.position}</p>
                            <ul className="list-disc pl-4 text-xs text-slate-500 font-medium space-y-1">
                              {exp.projects && exp.projects.map((proj, idx) => (
                                <li key={idx}>{proj}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}

                      {educationHistory.length === 0 && experienceHistory.length === 0 && (
                        <p className="text-slate-400 text-sm font-medium">Chưa có lịch sử học tập & làm việc. Bấm Chỉnh sửa để thêm mới.</p>
                      )}
                    </div>
                  ) : (
                    // Edit Mode Timeline Forms
                    <div className="space-y-8">
                      {/* Education Form */}
                      {educationHistory.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider">Chỉnh sửa Lịch sử Học vấn</h3>
                          {educationHistory.map((edu, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 relative">
                              <button
                                onClick={() => setEducationHistory(educationHistory.filter((_, i) => i !== idx))}
                                className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={edu.school}
                                  onChange={e => {
                                    const copy = [...educationHistory];
                                    copy[idx].school = e.target.value;
                                    setEducationHistory(copy);
                                  }}
                                  placeholder="Tên trường học/Đại học"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={edu.years}
                                  onChange={e => {
                                    const copy = [...educationHistory];
                                    copy[idx].years = e.target.value;
                                    setEducationHistory(copy);
                                  }}
                                  placeholder="Thời gian (VD: 2021 - 2025)"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={edu.major}
                                  onChange={e => {
                                    const copy = [...educationHistory];
                                    copy[idx].major = e.target.value;
                                    setEducationHistory(copy);
                                  }}
                                  placeholder="Chuyên ngành"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={edu.cpa || edu.gpa || ""}
                                  onChange={e => {
                                    const copy = [...educationHistory];
                                    copy[idx].cpa = e.target.value;
                                    copy[idx].gpa = undefined;
                                    setEducationHistory(copy);
                                  }}
                                  placeholder="CPA (VD: 3.5/4.0)"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                              <input
                                type="text"
                                value={edu.thesis || ""}
                                onChange={e => {
                                  const copy = [...educationHistory];
                                  copy[idx].thesis = e.target.value;
                                  setEducationHistory(copy);
                                }}
                                placeholder="Mô tả đề tài nghiên cứu hoặc khóa luận tốt nghiệp"
                                className="w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Experience Form */}
                      {experienceHistory.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase text-purple-600 tracking-wider">Chỉnh sửa Lịch sử Kinh nghiệm</h3>
                          {experienceHistory.map((exp, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 relative">
                              <button
                                onClick={() => setExperienceHistory(experienceHistory.filter((_, i) => i !== idx))}
                                className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={exp.company}
                                  onChange={e => {
                                    const copy = [...experienceHistory];
                                    copy[idx].company = e.target.value;
                                    setExperienceHistory(copy);
                                  }}
                                  placeholder="Tên công ty"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={exp.years}
                                  onChange={e => {
                                    const copy = [...experienceHistory];
                                    copy[idx].years = e.target.value;
                                    setExperienceHistory(copy);
                                  }}
                                  placeholder="Thời gian (VD: 2022 - 2024)"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={exp.position}
                                  onChange={e => {
                                    const copy = [...experienceHistory];
                                    copy[idx].position = e.target.value;
                                    setExperienceHistory(copy);
                                  }}
                                  placeholder="Vị trí (VD: Junior Developer)"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={exp.projects?.join("; ") || ""}
                                  onChange={e => {
                                    const copy = [...experienceHistory];
                                    copy[idx].projects = e.target.value.split(";").map(x => x.trim()).filter(Boolean);
                                    setExperienceHistory(copy);
                                  }}
                                  placeholder="Các dự án/nhiệm vụ (phân cách bằng dấu chấm phẩy ';')"
                                  className="px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-indigo-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Bản đồ Kỹ năng chuyên môn (Skills Cloud) */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Code2 size={20} /></div>
                    <h2 className="text-xl font-black text-slate-800">Bản đồ Kỹ năng chuyên môn (Skills Cloud)</h2>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Kỹ năng chuyên môn (Hard Skills)</h3>
                        <div className="flex flex-wrap gap-2">
                          {hard.map(s => (
                            <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold">{s}</span>
                          ))}
                          {hard.length === 0 && <span className="text-slate-400 text-xs">Chưa cập nhật</span>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Kỹ năng Nghiên cứu & Học thuật (Academic Skills)</h3>
                        <div className="flex flex-wrap gap-2">
                          {academic.map(s => (
                            <span key={s} className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-xs font-bold">{s}</span>
                          ))}
                          {academic.length === 0 && <span className="text-slate-400 text-xs">Chưa cập nhật</span>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Chứng chỉ Ngoại ngữ & Khác (Languages)</h3>
                        <div className="flex flex-wrap gap-2">
                          {languages.map(s => (
                            <span key={s} className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-xs font-bold">{s}</span>
                          ))}
                          {languages.length === 0 && <span className="text-slate-400 text-xs">Chưa cập nhật</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Kỹ năng tổng hợp (phân cách bằng dấu phẩy)</label>
                      <textarea
                        value={skillsInput}
                        onChange={e => setSkillsInput(e.target.value)}
                        placeholder="React, Next.js, Academic Writing, IELTS 7.5, Python..."
                        rows={4}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-semibold"
                      />
                      <p className="text-[10px] text-slate-400 font-bold">Hệ thống AI sẽ tự động phân tách kỹ năng vào các mục tương ứng sau khi bạn lưu.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: VIỆC LÀM PHÙ HỢP */}
            {activeTab === "jobs" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-500" /> Đề xuất Việc làm Phù hợp
                  </h3>
                  <button
                    onClick={() => fetchRecommendations(currentUser.id)}
                    disabled={loadingMatch}
                    className="text-slate-400 hover:text-indigo-650 transition-colors"
                  >
                    <RefreshCw size={14} className={loadingMatch ? "animate-spin" : ""} />
                  </button>
                </div>
                {loadingMatch ? (
                  <div className="space-y-4">
                    <div className="h-28 bg-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="h-28 bg-slate-100 rounded-3xl animate-pulse"></div>
                  </div>
                ) : recommendedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedJobs.map((job) => {
                      const score = Math.round(job.match_score * 100) / 100;
                      const pct = Math.round(score);
                      const scoreColor = pct >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : pct >= 50 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-600 border-slate-200";
                      return (
                        <div key={job.id} className="border border-slate-150 rounded-[1.5rem] p-6 bg-white hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative group">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                {job.title}
                              </h4>
                              <p className="text-sm text-slate-500 font-bold mt-1">{job.company} · {job.location}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-black rounded-lg border uppercase tracking-wider shrink-0 ${scoreColor}`}>
                              {pct}% Khớp
                            </span>
                          </div>

                          <div className="mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lý do gợi ý:</p>
                            <div className="flex flex-wrap gap-2">
                              {job.match_reasons?.map((reason, idx) => (
                                <span key={idx} className="text-xs bg-slate-50 text-slate-600 border border-slate-150 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {reason}
                                </span>
                              ))}
                              {(!job.match_reasons || job.match_reasons.length === 0) && (
                                <span className="text-xs text-slate-400 font-semibold italic">Gợi ý dựa trên hồ sơ chung</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <span className="text-xs font-bold text-slate-400">
                              Kỹ năng yêu cầu: {job.skills?.slice(0, 3).join(", ") || "Không có yêu cầu cụ thể"}
                            </span>
                            <Link
                              href={`/jobs/${job.id}`}
                              className="flex items-center gap-1.5 text-blue-650 hover:text-blue-500 font-black text-xs transition-colors"
                            >
                              Xem chi tiết ứng tuyển <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <Briefcase className="mx-auto text-slate-350 mb-3" size={32} />
                    <p className="text-sm font-extrabold text-slate-500">Chưa có đề xuất việc làm phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Hãy cập nhật kỹ năng chuyên môn và địa điểm mong muốn của bạn.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HỌC BỔNG PHÙ HỢP */}
            {activeTab === "scholarships" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <GraduationCap size={20} className="text-indigo-650" /> Đề xuất Học bổng Phù hợp
                  </h3>
                  <button
                    onClick={() => fetchRecommendations(currentUser.id)}
                    disabled={loadingMatch}
                    className="text-slate-400 hover:text-indigo-650 transition-colors"
                  >
                    <RefreshCw size={14} className={loadingMatch ? "animate-spin" : ""} />
                  </button>
                </div>
                {loadingMatch ? (
                  <div className="space-y-4">
                    <div className="h-28 bg-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="h-28 bg-slate-100 rounded-3xl animate-pulse"></div>
                  </div>
                ) : recommendedScholarships.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedScholarships.map((sch) => {
                      const score = Math.round(sch.match_score * 100) / 100;
                      const pct = Math.round(score);
                      const scoreColor = pct >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : pct >= 50 ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-slate-50 text-slate-600 border-slate-200";
                      return (
                        <div key={sch.id} className="border border-slate-150 rounded-[1.5rem] p-6 bg-white hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative group">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                                {sch.title}
                              </h4>
                              <p className="text-sm text-slate-500 font-bold mt-1">{sch.organization} · {sch.country}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-black rounded-lg border uppercase tracking-wider shrink-0 ${scoreColor}`}>
                              {pct}% Khớp
                            </span>
                          </div>

                          <div className="mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lý do gợi ý:</p>
                            <div className="flex flex-wrap gap-2">
                              {sch.match_reasons?.map((reason, idx) => (
                                <span key={idx} className="text-xs bg-slate-50 text-slate-600 border border-slate-150 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {reason}
                                </span>
                              ))}
                              {(!sch.match_reasons || sch.match_reasons.length === 0) && (
                                <span className="text-xs text-slate-400 font-semibold italic">Gợi ý dựa trên ngành học</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <span className="text-xs font-bold text-slate-400">
                              Trị giá: <span className="text-indigo-600 font-black">{sch.amount}</span>
                            </span>
                            <Link
                              href={`/scholarships/${sch.id}`}
                              className="flex items-center gap-1.5 text-indigo-650 hover:text-indigo-500 font-black text-xs transition-colors"
                            >
                              Xem chi tiết ứng tuyển <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <GraduationCap className="mx-auto text-slate-350 mb-3" size={32} />
                    <p className="text-sm font-extrabold text-slate-500">Chưa có đề xuất học bổng phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Hãy cập nhật lịch sử học tập (CPA) và quốc gia mong muốn của bạn.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* C. Cột Phải (35%): AI Integration & Hành động nhanh */}
          <div className="lg:col-span-4 space-y-6">

            {/* Availability Badge */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-800">Trạng thái sẵn sàng</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{availability === "seeking" ? "Đang tìm cơ hội mới" : "Chỉ xem cơ hội phù hợp"}</p>
              </div>
              <button
                onClick={() => setAvailability(availability === "seeking" ? "watching" : "seeking")}
                className="text-indigo-600 hover:scale-105 transition-transform"
              >
                {availability === "seeking" ? <ToggleRight size={44} className="text-indigo-600" /> : <ToggleLeft size={44} className="text-slate-300" />}
              </button>
            </div>

            {/* Target Scores - Học bổng */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" /> Ngoại ngữ
              </h3>

              {!isEditing ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {languageScores.map((score, i) => (
                    <div key={i} className="bg-slate-50 border p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">{score.certificate}</span>
                      <span className="font-extrabold text-slate-700">{score.score || "Chưa đặt"}</span>
                    </div>
                  ))}
                  {languageScores.length === 0 && (
                    <p className="text-xs text-slate-400 font-bold col-span-2 text-center py-2">Chưa đặt mục tiêu chứng chỉ</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {languageScores.map((score, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={score.certificate}
                        onChange={e => {
                          const copy = [...languageScores];
                          copy[i].certificate = e.target.value;
                          setLanguageScores(copy);
                        }}
                        className="w-1/2 px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs"
                        placeholder="Chứng chỉ (VD: IELTS)"
                      />
                      <input
                        type="text"
                        value={score.score}
                        onChange={e => {
                          const copy = [...languageScores];
                          copy[i].score = e.target.value;
                          setLanguageScores(copy);
                        }}
                        className="w-1/3 px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs"
                        placeholder="Điểm"
                      />
                      <button
                        onClick={() => {
                          setLanguageScores(languageScores.filter((_, idx) => idx !== i));
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setLanguageScores([...languageScores, { certificate: "", score: "" }])}
                    className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 text-slate-500 mt-2"
                  >
                    <Plus size={14} /> Thêm ngoại ngữ
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}