export const SUPABASE_TABLES = [
  'admin_profiles',
  'reservations',
  'vehicles',
  'routes',
  'operation_settings',
] as const

export const SUPABASE_AUTH_PLAN = {
  authProvider: 'Supabase Auth',
  profileTable: 'admin_profiles',
  userIdColumn: 'auth_user_id',
  notes: [
    'Use Supabase Auth for password, session, reset, and email policies.',
    'Store only admin profile and role metadata in admin_profiles.',
    'Keep operational tables behind row-level security policies.',
  ],
}
