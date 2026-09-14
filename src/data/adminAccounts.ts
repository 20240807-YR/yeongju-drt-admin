export type AdminRole = 'operator' | 'admin'

export type AdminAccountRecord = {
  adminId: string
  loginId: string
  password: string
  name: string
  department: string
  role: AdminRole
  active: boolean
}

// Demo-only admin account store. Replace password validation with Supabase Auth
// before production; keep only profile and role metadata in Postgres.
export const adminAccounts: AdminAccountRecord[] = [
  {
    adminId: 'admin01',
    loginId: 'admin',
    password: 'demo1234',
    name: '관리자',
    department: '영주시청 교통과',
    role: 'admin',
    active: true,
  },
  {
    adminId: 'operator01',
    loginId: 'operator',
    password: 'demo1234',
    name: '운영자',
    department: '영주시청 교통과',
    role: 'operator',
    active: true,
  },
]
