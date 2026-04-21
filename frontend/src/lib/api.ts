import { JobsResponse, Job, ScholarshipsResponse, SearchResults, Message } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const api = {
  jobs: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch<JobsResponse>(`/api/v1/jobs?${qs}`)
    },
    get: (id: string) => apiFetch<Job>(`/api/v1/jobs/${id}`),
  },
  scholarships: {
    list: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString()
      return apiFetch<ScholarshipsResponse>(`/api/v1/scholarships?${qs}`)
    },
  },
  search: (q: string, type = "all") =>
    apiFetch<SearchResults>(`/api/v1/search?q=${encodeURIComponent(q)}&type=${type}`),
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
