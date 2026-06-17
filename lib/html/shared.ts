/** HTML 특수문자 이스케이프 */
export function esc(str: string | undefined | null): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 【정답어】 → 빈칸 span 변환 */
export function processGuide(text: string, mode: 'student' | 'teacher'): string {
  return esc(text).replace(/【([^】]+)】/g, (_, answer) => {
    if (mode === 'teacher') {
      return `<span class="teacher-answer">${esc(answer)}</span>`
    }
    return `<span class="blank"></span>`
  })
}

/** 지문 텍스트 → 문단 배열 */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
}

export const GOOGLE_FONTS = `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap`
