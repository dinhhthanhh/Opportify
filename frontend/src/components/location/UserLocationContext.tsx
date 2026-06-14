"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Vị trí mặc định khi người dùng không cho phép lấy vị trí: Đại học Bách khoa Hà Nội (HUST)
export const HUST_LOCATION = { lat: 21.0061832, lon: 105.8431307 }
export const USER_LOCATION_KEY = "opportify_user_location"

type Coords = { lat: number; lon: number }

/** Đọc vị trí người dùng đã lưu (hoặc mặc định HUST) — dùng cho trang không bọc Provider. */
export function getSavedUserLocation(): Coords {
  if (typeof window === "undefined") return HUST_LOCATION
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.lat === "number" && typeof parsed?.lon === "number") return parsed
    }
  } catch {
    /* ignore */
  }
  return HUST_LOCATION
}

interface UserLocationValue {
  coords: Coords
  /** true nếu đang dùng vị trí thật của người dùng; false nếu dùng mặc định HUST */
  isReal: boolean
}

const UserLocationContext = createContext<UserLocationValue>({ coords: HUST_LOCATION, isReal: false })

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords>(HUST_LOCATION)
  const [isReal, setIsReal] = useState(false)

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setCoords(next)
        setIsReal(true)
        try { localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      },
      () => {
        // Từ chối hoặc lỗi -> giữ vị trí mặc định HUST
        setCoords(HUST_LOCATION)
        setIsReal(false)
        try { localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(HUST_LOCATION)) } catch { /* ignore */ }
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [])

  return (
    <UserLocationContext.Provider value={{ coords, isReal }}>
      {children}
    </UserLocationContext.Provider>
  )
}

export function useUserLocation() {
  return useContext(UserLocationContext)
}

/** Khoảng cách Haversine (km) giữa hai toạ độ. */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLon = ((bLon - aLon) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}
