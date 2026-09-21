import { FormEvent, useState } from 'react'
import { Lock, User, Bus, Eye, EyeOff } from 'lucide-react'
import { signInDemoAdmin, signInWithPassword, type AdminUser } from '../services/auth'

type LoginProps = {
  onLogin: (user: AdminUser) => void
}

function getRememberedLoginId() {
  try { return localStorage.getItem('yeongju-drt-admin-login-id') ?? 'admin' } catch { return 'admin' }
}

function rememberLoginId(value: string) {
  try { localStorage.setItem('yeongju-drt-admin-login-id', value) } catch { /* storage is unavailable */ }
}

function forgetLoginId() {
  try { localStorage.removeItem('yeongju-drt-admin-login-id') } catch { /* storage is unavailable */ }
}

export default function Login({ onLogin }: LoginProps) {
  const [loginId, setLoginId] = useState(
    getRememberedLoginId,
  )
  const [password, setPassword] = useState('demo1234')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDemoFallback, setShowDemoFallback] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await signInWithPassword(loginId, password)
      if (remember) rememberLoginId(loginId.trim())
      if (!remember) forgetLoginId()
      onLogin(user)
    } catch (e) {
      const message = e instanceof Error ? e.message : '로그인에 실패했습니다.'
      setError(message)
      setShowDemoFallback(import.meta.env.DEV && /연결|응답|네트워크/.test(message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemoFallback = () => {
    onLogin(signInDemoAdmin())
  }

  return (
    <main className="min-h-screen bg-[#f5f7f7] flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-[880px] min-h-[420px] bg-white rounded-[20px] shadow-2xl shadow-slate-900/12 overflow-hidden grid grid-cols-2 max-md:grid-cols-1">
        <div className="bg-gradient-to-br from-[#f1fffb] via-[#bff4ea] to-[#e3ffd0] flex flex-col items-center justify-center px-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-menthe flex items-center justify-center shadow-lg shadow-menthe/30 mb-8">
            <Bus size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">영주 관광 DRT</h1>
          <p className="text-sm font-semibold text-gray-600 mt-2">운영 현황 대시보드</p>
          <p className="text-xs leading-5 text-gray-500 mt-7 max-w-[250px]">
            영주 관광 DRT 운영 데이터를 통해 정책 의사결정을 지원하는 대시보드입니다.
          </p>
        </div>

        <div className="px-14 py-12 max-md:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900">로그인</h2>
          <p className="text-xs text-gray-500 mt-1 mb-8">관리자 계정으로 로그인해주세요.</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">아이디</span>
              <span className="mt-2 h-12 flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 focus-within:border-menthe focus-within:ring-4 focus-within:ring-menthe/10">
                <User size={15} className="text-gray-400" />
                <input
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  className="w-full outline-none text-sm text-gray-800 placeholder:text-gray-300"
                  placeholder="아이디를 입력하세요"
                  autoComplete="username"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-gray-600">비밀번호</span>
              <span className="mt-2 h-12 flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 focus-within:border-menthe focus-within:ring-4 focus-within:ring-menthe/10">
                <Lock size={15} className="text-gray-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full outline-none text-sm text-gray-800 placeholder:text-gray-300"
                  placeholder="비밀번호를 입력하세요"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="w-4 h-4 accent-menthe"
                />
                아이디 저장
              </label>
              <button type="button" className="text-xs font-semibold text-menthe hover:underline">
                비밀번호 찾기
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-menthe text-white text-base font-bold shadow-lg shadow-menthe/20 hover:bg-[#2ab5a2] disabled:opacity-60 transition"
            >
              {submitting ? '로그인 중...' : '로그인'}
            </button>
            {showDemoFallback && (
              <button
                type="button"
                onClick={handleDemoFallback}
                className="w-full h-10 rounded-xl border border-menthe text-menthe text-sm font-semibold hover:bg-menthe/5 transition"
              >
                연결 없이 개발용 화면 열기
              </button>
            )}
          </form>


        </div>
      </section>
    </main>
  )
}
