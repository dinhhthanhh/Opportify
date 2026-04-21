"use client";

import { useState, useEffect } from "react";
import {
  UserCircle2, Briefcase, GraduationCap, Star, MapPin,
  Code2, ChevronRight, ExternalLink, Award, Calendar,
  Zap, Target, RefreshCw, CheckCircle2, Users
} from "lucide-react";
import { UserProfile, RecommendedJob, RecommendedScholarship, RecommendResponse } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LEVEL_LABELS: Record<string, string> = {
  fresher: "Fresher",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
};
const EDU_LABELS: Record<string, string> = {
  bachelor: "Đại học",
  master: "Thạc sĩ",
  phd: "Tiến sĩ",
};

const LEVEL_COLORS: Record<string, string> = {
  fresher: "bg-emerald-100 text-emerald-700",
  junior: "bg-blue-100 text-blue-700",
  mid: "bg-violet-100 text-violet-700",
  senior: "bg-amber-100 text-amber-700",
};

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score);
  const color =
    pct >= 70
      ? "bg-emerald-500"
      : pct >= 40
      ? "bg-amber-500"
      : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-black ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-slate-500"}`}>
        {pct}%
      </span>
    </div>
  );
}

// ── Profile Card ──────────────────────────────────────────────────────────────

function ProfileCard({ user }: { user: UserProfile }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-600/30 mb-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-white shadow-inner backdrop-blur-sm">
          <UserCircle2 size={40} />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black tracking-tight mb-1">
            {user.full_name ?? user.username}
          </h2>
          <p className="text-blue-200 text-sm font-medium mb-1">{user.email}</p>
          {user.university && (
            <p className="text-blue-100 text-sm font-semibold flex items-center gap-1.5">
              <GraduationCap size={15} /> {user.university} · {EDU_LABELS[user.education_level ?? ""] ?? user.education_level}
            </p>
          )}
          {user.bio && (
            <p className="mt-3 text-blue-100 text-sm leading-relaxed max-w-xl">{user.bio}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {user.experience_level && (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white/20 text-white border border-white/30`}>
              {LEVEL_LABELS[user.experience_level]} · {user.experience_years} năm
            </span>
          )}
        </div>
      </div>

      {/* Skills */}
      {user.skills.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {user.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-white/15 border border-white/20 rounded-lg text-xs font-bold backdrop-blur-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Preferences */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {user.preferred_locations.length > 0 && (
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-blue-300 mt-0.5 shrink-0" />
            <span className="text-blue-100">{user.preferred_locations.join(", ")}</span>
          </div>
        )}
        {user.preferred_job_types.length > 0 && (
          <div className="flex items-start gap-2">
            <Briefcase size={16} className="text-blue-300 mt-0.5 shrink-0" />
            <span className="text-blue-100 capitalize">{user.preferred_job_types.join(", ")}</span>
          </div>
        )}
        {user.interest_fields.length > 0 && (
          <div className="flex items-start gap-2">
            <Code2 size={16} className="text-blue-300 mt-0.5 shrink-0" />
            <span className="text-blue-100">{user.interest_fields.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recommended Job Card ──────────────────────────────────────────────────────

function RecommendedJobCard({ job }: { job: RecommendedJob }) {
  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    const fmt = (n: number) =>
      n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(0)}M`
        : `${(n / 1_000).toFixed(0)}K`;
    if (job.salary_min && job.salary_max)
      return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} ${job.salary_currency}`;
    if (job.salary_min) return `Từ ${fmt(job.salary_min)} ${job.salary_currency}`;
    return null;
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors mb-1">
            {job.title}
          </h3>
          <p className="text-slate-500 font-semibold text-sm">{job.company}</p>
        </div>
        <div className="shrink-0 text-right">
          <ScoreBadge score={job.match_score} />
          <span className="text-xs text-slate-400 font-medium mt-1 block">phù hợp</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500 mb-4">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
        )}
        {job.experience && (
          <span className={`px-2 py-0.5 rounded-md capitalize ${LEVEL_COLORS[job.experience] ?? "bg-slate-100 text-slate-600"}`}>
            {LEVEL_LABELS[job.experience] ?? job.experience}
          </span>
        )}
        {job.job_type && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md capitalize">{job.job_type}</span>
        )}
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 5).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">{s}</span>
          ))}
          {job.skills.length > 5 && (
            <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md font-medium">+{job.skills.length - 5}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-sm font-black text-emerald-600">{formatSalary() ?? "Thỏa thuận"}</span>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:gap-2 transition-all"
        >
          Xem chi tiết <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

// ── Recommended Scholarship Card ──────────────────────────────────────────────

function RecommendedScholarshipCard({ s }: { s: RecommendedScholarship }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors mb-1">
            {s.title}
          </h3>
          <p className="text-slate-500 font-semibold text-sm flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" />{s.organization}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <ScoreBadge score={s.match_score} />
          <span className="text-xs text-slate-400 font-medium mt-1 block">phù hợp</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs mb-4">
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold flex items-center gap-1">
          <MapPin size={11} />{s.country}
        </span>
        {s.level && (
          <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md font-semibold capitalize">
            {EDU_LABELS[s.level] ?? s.level}
          </span>
        )}
        {s.coverage && (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold uppercase">
            {s.coverage}
          </span>
        )}
      </div>

      {s.field && (
        <p className="text-sm text-slate-500 font-medium mb-3 line-clamp-1">{s.field}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div>
          <span className="text-sm font-black text-slate-900">{s.amount ?? "Xem thêm"}</span>
          {s.deadline && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-0.5">
              <Calendar size={11} />Deadline: {new Date(s.deadline).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:gap-2 transition-all"
        >
          Chi tiết <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

// ── Mock User Selector ────────────────────────────────────────────────────────

function MockUserSelector({
  users,
  selectedId,
  onSelect,
}: {
  users: UserProfile[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-600">
        <Users size={16} className="text-blue-500" />
        Chọn hồ sơ demo để xem gợi ý cá nhân hóa
      </div>
      <div className="flex flex-wrap gap-3">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              selectedId === u.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            <span className="block text-left">{u.full_name ?? u.username}</span>
            {u.experience_level && (
              <span className={`text-xs mt-0.5 block ${selectedId === u.id ? "text-blue-200" : "text-slate-400"}`}>
                {LEVEL_LABELS[u.experience_level]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "profile" | "jobs" | "scholarships";

export default function ProfilePage() {
  const [mockUsers, setMockUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("profile");

  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [recommendedScholarships, setRecommendedScholarships] = useState<RecommendedScholarship[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingScholarships, setLoadingScholarships] = useState(false);

  // Load mock users on mount
  useEffect(() => {
    fetch(`${API}/api/v1/profile/mock-users`)
      .then((r) => r.json())
      .then((data) => {
        const users: UserProfile[] = data.users ?? [];
        setMockUsers(users);
        if (users.length > 0) {
          setSelectedUserId(users[0].id);
          setCurrentUser(users[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  // When selected user changes, load their profile
  useEffect(() => {
    if (!selectedUserId) return;
    const found = mockUsers.find((u) => u.id === selectedUserId);
    if (found) setCurrentUser(found);
  }, [selectedUserId, mockUsers]);

  // Load recommended jobs
  const fetchJobs = async () => {
    if (!selectedUserId) return;
    setLoadingJobs(true);
    try {
      const res = await fetch(`${API}/api/v1/recommend/jobs?user_id=${selectedUserId}&limit=12`);
      const data: RecommendResponse<RecommendedJob> = await res.json();
      setRecommendedJobs(data.results ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Load recommended scholarships
  const fetchScholarships = async () => {
    if (!selectedUserId) return;
    setLoadingScholarships(true);
    try {
      const res = await fetch(`${API}/api/v1/recommend/scholarships?user_id=${selectedUserId}&limit=12`);
      const data: RecommendResponse<RecommendedScholarship> = await res.json();
      setRecommendedScholarships(data.results ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScholarships(false);
    }
  };

  // Auto-fetch when tab changes
  useEffect(() => {
    if (tab === "jobs") fetchJobs();
    if (tab === "scholarships") fetchScholarships();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedUserId]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Hồ sơ năng lực", icon: <UserCircle2 size={18} /> },
    { key: "jobs", label: "Việc phù hợp", icon: <Briefcase size={18} /> },
    { key: "scholarships", label: "Học bổng phù hợp", icon: <GraduationCap size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Target size={20} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Hồ Sơ Năng Lực
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-13">
            Xây dựng hồ sơ và nhận đề xuất việc làm, học bổng được cá nhân hóa bởi AI
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Mock user selector */}
        {loadingUsers ? (
          <div className="h-24 bg-slate-100 rounded-2xl animate-pulse mb-6" />
        ) : (
          <MockUserSelector
            users={mockUsers}
            selectedId={selectedUserId}
            onSelect={(id) => {
              setSelectedUserId(id);
              // Reset fetched data when switching users
              setRecommendedJobs([]);
              setRecommendedScholarships([]);
            }}
          />
        )}

        {/* Tab navigation */}
        <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.key
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {currentUser && (
          <>
            {/* ── TAB: Profile ── */}
            {tab === "profile" && (
              <div>
                <ProfileCard user={currentUser} />

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      icon: <Code2 size={20} />,
                      label: "Kỹ năng",
                      value: currentUser.skills.length,
                      color: "text-blue-600 bg-blue-50",
                    },
                    {
                      icon: <Briefcase size={20} />,
                      label: "Năm kinh nghiệm",
                      value: currentUser.experience_years,
                      color: "text-violet-600 bg-violet-50",
                    },
                    {
                      icon: <MapPin size={20} />,
                      label: "Địa điểm",
                      value: currentUser.preferred_locations.length,
                      color: "text-emerald-600 bg-emerald-50",
                    },
                    {
                      icon: <Star size={20} />,
                      label: "Lĩnh vực quan tâm",
                      value: currentUser.interest_fields.length,
                      color: "text-amber-600 bg-amber-50",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setTab("jobs")}
                    className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
                  >
                    <Zap size={18} /> Xem {recommendedJobs.length > 0 ? recommendedJobs.length : ""} Việc Làm Phù Hợp <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setTab("scholarships")}
                    className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/25"
                  >
                    <GraduationCap size={18} /> Xem Học Bổng Phù Hợp <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: Jobs ── */}
            {tab === "jobs" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Việc làm phù hợp với <span className="text-blue-600">{currentUser.full_name ?? currentUser.username}</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                      Dựa trên kỹ năng và sở thích của hồ sơ
                    </p>
                  </div>
                  <button
                    onClick={fetchJobs}
                    disabled={loadingJobs}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={loadingJobs ? "animate-spin" : ""} />
                    Làm mới
                  </button>
                </div>

                {loadingJobs ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-56 bg-slate-100 rounded-[1.5rem] animate-pulse" />
                    ))}
                  </div>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">Chưa có dữ liệu việc làm để gợi ý</p>
                    <p className="text-sm mt-1">Hãy đảm bảo backend đang chạy và đã seed dữ liệu</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Tìm thấy <strong className="text-slate-700">{recommendedJobs.length}</strong> việc làm phù hợp nhất
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {recommendedJobs.map((job) => (
                        <RecommendedJobCard key={job.id} job={job} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB: Scholarships ── */}
            {tab === "scholarships" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Học bổng phù hợp với <span className="text-indigo-600">{currentUser.full_name ?? currentUser.username}</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                      Dựa trên trình độ học vấn và lĩnh vực quan tâm
                    </p>
                  </div>
                  <button
                    onClick={fetchScholarships}
                    disabled={loadingScholarships}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={loadingScholarships ? "animate-spin" : ""} />
                    Làm mới
                  </button>
                </div>

                {loadingScholarships ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-56 bg-slate-100 rounded-[1.5rem] animate-pulse" />
                    ))}
                  </div>
                ) : recommendedScholarships.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <GraduationCap size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">Chưa có dữ liệu học bổng để gợi ý</p>
                    <p className="text-sm mt-1">Hãy đảm bảo backend đang chạy và đã seed dữ liệu học bổng</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Tìm thấy <strong className="text-slate-700">{recommendedScholarships.length}</strong> học bổng phù hợp nhất
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {recommendedScholarships.map((s) => (
                        <RecommendedScholarshipCard key={s.id} s={s} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {!currentUser && !loadingUsers && (
          <div className="text-center py-20 text-slate-400">
            <UserCircle2 size={56} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">Không tải được hồ sơ mock</p>
            <p className="text-sm mt-1">Kiểm tra backend tại <code className="text-blue-500">localhost:8000</code></p>
          </div>
        )}
      </div>
    </div>
  );
}
