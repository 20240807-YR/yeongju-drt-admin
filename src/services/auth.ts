import { adminAccounts, type AdminRole } from '../data/adminAccounts'

export type AdminUser = {
  id: string
  name: string
  department: string
  role: AdminRole
  loginId: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

const STORAGE_KEY = 'yeongju-drt-admin-session'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const PROFILE_TIMEOUT_MS = 8000
const toAuthEmail = (value: string) => {
  const normalized = value.trim()
  return normalized.includes('@') ? normalized : `${normalized}@duruon.app`
}

function persistAdminUser(user: AdminUser) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Keep the current in-memory session working when browser storage is blocked.
  }
}

function clearAdminUser() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* storage is unavailable */ }
}

async function supabaseAuth(path: string, body: Record<string, unknown>) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  let response: Response
  try {
    response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('인증 서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.')
    }
    throw new Error('인증 서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.')
  } finally {
    window.clearTimeout(timeout)
  }
  if (!response.ok) {
    const bodyText = await response.text()
    try {
      const bodyJson = JSON.parse(bodyText)
      throw new Error(bodyJson.msg || bodyJson.message || '인증에 실패했습니다.')
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error
      throw new Error('인증에 실패했습니다.')
    }
  }
  return response.json()
}

async function fetchAdminProfile(userId: string, accessToken: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(userId)}&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY || '', Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`관리자 프로필을 불러오지 못했습니다. (${response.status})`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('관리자 프로필 서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.')
    }
    if (error instanceof Error && error.message.startsWith('관리자 프로필을')) throw error
    throw new Error('관리자 프로필을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.')
  } finally {
    window.clearTimeout(timeout)
  }
}

function toAdminUser(account: (typeof adminAccounts)[number]): AdminUser {
  return {
    id: account.adminId,
    name: account.name,
    department: account.department,
    role: account.role,
    loginId: account.loginId,
  }
}

export function signInDemoAdmin(): AdminUser {
  const account = adminAccounts.find((item) => item.active)
  if (!account) throw new Error('개발용 관리자 계정을 찾을 수 없습니다.')
  const user = toAdminUser(account)
  persistAdminUser(user)
  return user
}

export async function signInWithPassword(loginId: string, password: string) {
  const normalizedLoginId = loginId.trim()
  if (!normalizedLoginId || !password) throw new Error('아이디와 비밀번호를 입력해 주세요.')

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const data = await supabaseAuth('token?grant_type=password', { email: toAuthEmail(normalizedLoginId), password })
    if (!data?.user?.id || !data?.access_token) throw new Error('로그인 결과가 올바르지 않습니다. 다시 시도해 주세요.')
    const profiles = await fetchAdminProfile(data.user.id, data.access_token)
    const profile = profiles[0]
    if (!profile?.active) throw new Error('관리자 권한이 없는 계정입니다.')
    const user: AdminUser = { id: profile.id, name: profile.name, department: profile.department, role: profile.role, loginId: normalizedLoginId, accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined }
    persistAdminUser(user)
    return user
  }

  const account = adminAccounts.find(
    (item) => item.active && item.loginId === normalizedLoginId,
  )

  if (account && account.password === password) {
    const user = toAdminUser(account)
    persistAdminUser(user)
    return user
  }

  throw new Error('아이디 또는 비밀번호를 확인해 주세요.')
}

export async function refreshAdminSession(refreshToken?: string): Promise<AdminUser> {
  const current = getStoredAdminUser()
  const token = refreshToken || current?.refreshToken
  if (!current || !token) throw new Error('관리자 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')

  const data = await supabaseAuth('token?grant_type=refresh_token', { refresh_token: token })
  if (!data?.access_token) throw new Error('관리자 로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
  const refreshed: AdminUser = {
    ...current,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : current.expiresAt,
  }
  persistAdminUser(refreshed)
  return refreshed
}

export function getStoredAdminUser(): AdminUser | null {
  let raw: string | null
  try {
    raw = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const user = JSON.parse(raw) as AdminUser
    if (!user || typeof user.id !== 'string' || !user.id) {
      clearAdminUser()
      return null
    }
    return user
  } catch {
    clearAdminUser()
    return null
  }
}

export function signOut() {
  clearAdminUser()
}
