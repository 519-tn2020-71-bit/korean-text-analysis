import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase">독서 분석</span>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/login" className="hover:text-gray-800 transition-colors">로그인</Link>
          <Link href="/signup" className="hover:text-gray-800 transition-colors">회원가입</Link>
          <Link href="/settings" className="hover:text-gray-800 transition-colors">설정</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="mb-8 inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI 기반 수능 독서 활동지 제작 도구
        </div>

        <h1 className="text-center text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
          수능{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
            독서 지문
          </span>
          <br />활동지 제작
        </h1>
        <p className="text-center text-gray-400 text-base mt-2 mb-12">
          지문을 붙여넣으면 AI가 분석 초안을 생성합니다. 교사가 직접 수정·보완해 활동지로 완성하세요.
        </p>

        <Link
          href="/teacher/dashboard"
          className="group relative overflow-hidden bg-gray-950 text-white rounded-2xl px-10 py-5 hover:bg-gray-800 transition-all duration-300 flex items-center gap-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div>
            <p className="text-lg font-bold">대시보드 시작하기</p>
            <p className="text-sm text-gray-400 mt-0.5">지문 등록 · AI 분석 · PPT 내보내기</p>
          </div>
          <span className="text-indigo-400 text-xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <div className="flex flex-wrap justify-center gap-2 mt-10">
          {['AI 주석 자동 생성', '인물·개념 비교 카드', '인포그래픽', 'OX 확인 문제', 'PPT 내보내기', '스마트 붙여넣기'].map(f => (
            <span key={f} className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">{f}</span>
          ))}
        </div>
      </main>
    </div>
  )
}
