import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase">독서 분석</span>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/login" className="hover:text-gray-800 transition-colors">로그인</Link>
          <Link href="/signup" className="hover:text-gray-800 transition-colors">회원가입</Link>
          <Link href="/settings" className="hover:text-gray-800 transition-colors">설정</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI 기반 수능 독서 지문 분석
        </div>

        {/* Heading */}
        <h1 className="text-center text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
          수능{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
            독서 지문
          </span>
          <br />함께 읽기
        </h1>
        <div className="mb-14" />

        {/* Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <Link
            href="/teacher/dashboard"
            className="group flex-1 relative overflow-hidden bg-gray-950 text-white rounded-2xl p-7 hover:bg-gray-800 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">Teacher</p>
            <p className="text-2xl font-bold mb-1">교사 모드</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              지문 등록 · AI 초안 분석<br />단계별 학생 공개 제어
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-indigo-400 group-hover:gap-3 transition-all">
              시작하기 <span>→</span>
            </div>
          </Link>

          <Link
            href="/student/dashboard"
            className="group flex-1 relative overflow-hidden bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-7 hover:border-gray-300 hover:bg-white hover:shadow-lg transition-all duration-300"
          >
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">Student</p>
            <p className="text-2xl font-bold mb-1">학생 모드</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              화이트보드 필기 · 힌트 확인<br />교사 분석과 나란히 비교
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-gray-400 group-hover:text-gray-700 group-hover:gap-3 transition-all">
              시작하기 <span>→</span>
            </div>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
          {['AI 주석 자동 생성', '인물 비교 카드', '마인드맵', '실시간 공개 제어', 'PDF 저장', '학생 화이트보드'].map(f => (
            <span key={f} className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">{f}</span>
          ))}
        </div>
      </main>
    </div>
  )
}
