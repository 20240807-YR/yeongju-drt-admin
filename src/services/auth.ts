import { adminAccounts, type AdminRole } from '../data/adminAccounts'

export type AdminUser = {
  id: string
  name: string
  department: string
  role: AdminRole
  loginId: string
  accessToken?: string
}

const STORAGE_KEY = 'yeongju-drt-admin-session'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const toAuthEmail = (value: string) => value.includes('@') ? value.trim() : `${value.trim()}@duruon.app`

async function supabaseAuth(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY || '', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error((await response.json()).msg || '인증에 실패했습니다.')
  return response.json()
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

export async function signInWithPassword(loginId: string, password: string) {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const data = await supabaseAuth('token?grant_type=password', { email: toAuthEmail(loginId), password })
    const response = await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${data.user.id}&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${data.access_token}` },
    })
    const profiles = await response.json()
    const profile = profiles[0]
    if (!profile?.active) throw new Error('관리자 권한이 없는 계정입니다.')
    const user: AdminUser = { id: profile.id, name: profile.name, department: profile.department, role: profile.role, loginId: loginId.trim(), accessToken: data.access_token }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }

  const account = adminAccounts.find(
    (item) => item.active && item.loginId === loginId.trim(),
  )

  if (account && account.password === password) {
    const user = toAdminUser(account)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }

  throw new Error('아이디 또는 비밀번호를 확인해 주세요.')
}

export function getStoredAdminUser(): AdminUser | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function signOut() {
  sessionStorage.removeItem(STORAGE_KEY)
}
