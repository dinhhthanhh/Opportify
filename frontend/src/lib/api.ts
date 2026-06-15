import { JobsResponse, Job, ScholarshipsResponse, SearchResults, Message, Scholarship, UserProfile, RecommendResponse, RecommendedJob, RecommendedScholarship} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
   auth: {
    autoLogin: async () => {
      if (typeof window === "undefined") return;

      let guestId = localStorage.getItem("guest_id");
      if (!guestId) {
        guestId = Math.random().toString(36).substring(2, 10);
        localStorage.setItem("guest_id", guestId);
      }

      const isOwner = guestId === "owner";
      const email = isOwner ? "an.nguyen@mock.opportify" : `guest_${guestId}@mock.opportify`;
      const username = isOwner ? "an_nguyen" : `guest_${guestId}`;
      const password = "mock1234";

      // Form data chuẩn OAuth2
      const loginData = new URLSearchParams();
      loginData.append("username", email); 
      loginData.append("password", password);

      try {
        // 1. Thử đăng nhập
        let res = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: loginData.toString()
        });

        // 2. Nếu thất bại (401 - chưa có tài khoản do DB trống), tiến hành Đăng ký
        if (!res.ok) {
          const regRes = await fetch(`${API_URL}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password })
          });

          if (regRes.ok) {
            // Đăng ký xong, gọi đăng nhập lại
            res = await fetch(`${API_URL}/api/v1/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: loginData.toString()
            });
          } else {
            console.error("Auto register failed");
            return;
          }
        }

        // 3. Lưu Token
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
      } catch (err) {
        console.error("Auto auth failed", err);
      }
    }
  },

  jobs: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch<JobsResponse>(`/api/v1/jobs?${qs}`)
    },
    get: (id: string) => apiFetch<Job>(`/api/v1/jobs/${id}`),
    locations: () => apiFetch<{ results: string[] }>("/api/v1/jobs/locations"),
  },
  scholarships: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch<ScholarshipsResponse>(`/api/v1/scholarships?${qs}`)
    },
    filters: () => apiFetch<{ countries: string[]; fields: string[]; organizations: string[] }>("/api/v1/scholarships/filters"),
    get: (id: string) => apiFetch<Scholarship>(`/api/v1/scholarships/${id}`),
  },
  search: (q: string, type = "all") =>
    apiFetch<SearchResults>(`/api/v1/search?q=${encodeURIComponent(q)}&type=${type}`),
  profile: {
    // MVP: Lấy mock user đầu tiên làm user đang đăng nhập
    getMe: () => apiFetch<UserProfile>("/api/v1/profile/me"),
    updateMe: (data: Partial<UserProfile>) =>
      apiFetch<UserProfile>("/api/v1/profile/me", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    uploadAvatar: (formData: FormData) => {
      const headers = new Headers();
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(`${API_URL}/api/v1/profile/avatar`, { method: "POST", body: formData, headers })
        .then(r => r.json()) as Promise<{ avatar_url: string }>;
    },
  },

  recommend: {
    jobs: (userId: string, extra?: { certificates?: string }) => {
      let url = `/api/v1/recommend/jobs?user_id=${userId}&limit=12`;
      if (extra?.certificates) {
        url += `&certificates=${encodeURIComponent(extra.certificates)}`;
      }
      return apiFetch<RecommendResponse<RecommendedJob>>(url);
    },
    scholarships: (userId: string, extra?: {
      certificates?: string;
      research_papers?: string;
      target_country?: string;
      target_degree?: string;
      language_scores?: string;
    }) => {
      let url = `/api/v1/recommend/scholarships?user_id=${userId}&limit=12`;
      if (extra?.certificates) url += `&certificates=${encodeURIComponent(extra.certificates)}`;
      if (extra?.research_papers) url += `&research_papers=${encodeURIComponent(extra.research_papers)}`;
      if (extra?.target_country) url += `&target_country=${encodeURIComponent(extra.target_country)}`;
      if (extra?.target_degree) url += `&target_degree=${encodeURIComponent(extra.target_degree)}`;
      if (extra?.language_scores) url += `&language_scores=${encodeURIComponent(extra.language_scores)}`;
      return apiFetch<RecommendResponse<RecommendedScholarship>>(url);
    },
  },
  ai: {
    chat: (message: string, history: Message[]) =>
      apiFetch<{reply: string}>("/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
      }),
    analyzeCV: (formData: FormData) =>
      fetch(`${API_URL}/api/v1/ai/analyze-cv`, { method: "POST", body: formData })
        .then(r => r.json()),
  },
}
