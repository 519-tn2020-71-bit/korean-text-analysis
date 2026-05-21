export interface Macro {
  topic: string
  main_idea: string
  text_type: string
  structure: string
}

export interface Paragraph {
  no: number
  function_tag: string
  core_sentence: string
  keywords: string[]
  relation_to_prev?: string   // 이 단락이 앞 단락과 맺는 관계: 도입|전환|부연|대조|예시|근거|결론
  summary?: string            // 단락 내용 상세 요약 (2~3문장, 학생 이해용)
}

export interface Annotation {
  text: string      // 밑줄 그을 전체 절/구 (원문 일치)
  keyword?: string  // 절 안에서 기호(○□★△)로 표시할 핵심어 (원문 일치, 짧은 단어/어구)
  label: string
  note: string      // 15자 이내 초간단 메모 (예: "○ 이(理): 법칙·원리")
  logic_role?: string  // 이 절이 논리 구조에서 하는 역할: 전제|근거|결론|반례|부연|대조|예시|정의
  color: 'blue' | 'red' | 'amber' | 'green' | 'purple'
  symbol: '○' | '□' | '→' | '↔' | '★' | '△' | '◇'
  position: number
}

export interface Highlight {
  text: string
  color: 'yellow' | 'blue' | 'pink' | 'orange'
  reason: string
}

export interface ComparisonPoint {
  aspect: string
  a_value: string
  b_value: string
}

export interface CompareCard {
  person_a: string
  person_b: string
  comparison_points: ComparisonPoint[]
}

export interface LogicNode {
  id: string
  label: string
  type: 'root' | 'concept' | 'detail' | 'example'
}

export interface LogicEdge {
  from: string
  to: string
  label: string
  type: 'causal' | 'contrast' | 'include' | 'example' | 'sequence'
}

export interface LogicMap {
  nodes: LogicNode[]
  edges: LogicEdge[]
}

export interface ExamPoint {
  text: string
  reason: string
  type: '사실확인' | '추론' | '어휘' | '구조파악' | '적용'
}

export interface MarginNote {
  id: string
  paragraph_no: number
  content: string
  color: 'yellow' | 'blue' | 'pink' | 'green'
  type?: '관계' | '흐름' | '대조' | '예시' | '일반'
}

export interface SentenceBreak {
  text: string
  breaks: string[]
}

export interface AnalysisResult {
  macro: Macro
  paragraphs: Paragraph[]
  annotations: Annotation[]
  highlights: Highlight[]
  compare_cards: CompareCard[]
  logic_map: LogicMap
  exam_points: ExamPoint[]
  sentence_breaks?: SentenceBreak[]
  margin_notes?: MarginNote[]
  question_evidences?: QuestionEvidence[]
  infographic_svg?: string
}

export interface QuestionEvidence {
  question_no: number    // 1, 2, 3...
  choice_no: string      // "①" "②" "③" "④" "⑤"
  text: string           // exact passage text (원문 일치)
}

export interface Passage {
  id: string
  teacher_id: string
  title: string
  text: string
  subject: '인문' | '사회' | '과학' | '기술' | '예술'
  year: number
  questions: string | null
  created_at: string
}

export interface TeacherAnalysis {
  id: string
  passage_id: string
  analysis_json: AnalysisResult | null
  annotations: Annotation[] | null
  summary: string | null
  mindmap: LogicMap | null
  compare_card: CompareCard[] | null
  stage_released: 0 | 1 | 2 | 3
  updated_at: string
}

export interface StudentActivity {
  id: string
  student_id: string
  passage_id: string
  whiteboard_data: string | null
  text_memos: string | null
  completed_steps: number[]
  created_at: string
}

export interface UserSettings {
  api_provider: 'gemini' | 'openrouter' | 'claude'
  gemini_model: string
  openrouter_model: string
}

export interface UserRow {
  id: string
  email: string
  role: 'teacher' | 'student'
  api_provider: 'gemini' | 'openrouter' | 'claude' | null
  api_key_encrypted: string | null
  gemini_model: string | null
  openrouter_model: string | null
  created_at: string
}
