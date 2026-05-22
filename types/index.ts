export interface Macro {
  topic: string
  main_idea: string
  text_type: string
  structure: string
}

export interface ConnectiveItem {
  word: string          // 접속어/지시어 원문
  role: string          // 역할: 전환|역접|인과|나열|부연|결론|지시
  explanation: string   // 앞 내용과의 연결 관계 상세 설명
}

export interface Paragraph {
  no: number
  function_tag: string
  core_sentence: string
  keywords: string[]
  relation_to_prev?: string        // 도입|전환|부연|대조|예시|근거|결론
  summary?: string                 // 학생 이해용 2~3문장 요약
  // 심층 분석 필드 (새로 추가)
  function?: string                // 문단의 기능 (1~2문장, 전체 논증 구조에서의 역할)
  writing_style?: string           // 서술방식 (예: "개념 정의 + 대비")
  logical_structure?: string       // 논리 구조 (①전제→②근거→③결론 형식)
  relation_explanation?: string    // 앞 단락과의 관계 상세 서술
  exam_traps?: string[]            // 출제 포인트 (함정 유형 + 예상 오답 조작 방식)
  connective_analysis?: ConnectiveItem[]  // 접속어/지시어 상세 분석
  reading_guide?: string           // 교사 내레이션형 읽기 가이드 ([빈칸] 포함)
}

export interface Annotation {
  text: string      // 밑줄 그을 전체 절/구 (원문 일치)
  keyword?: string  // 절 안에서 기호(○□★△)로 표시할 핵심어
  label: string
  note: string      // "↳ [역할]: [설명]" 형식 (40~80자)
  logic_role?: string  // 전제|근거|결론|반례|부연|대조|예시|정의
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

export interface OxQuestion {
  id: number
  paragraph_no: number
  statement: string      // OX 판단할 진술문 (수능 선지 스타일)
  answer: boolean        // true = O(맞다), false = X(틀리다)
  explanation: string    // 판단 근거 (원문 인용 포함)
  trap_type: string      // X 문항 함정 유형 / O 문항은 '핵심 사실 확인'
  difficulty: 'easy' | 'medium' | 'hard'
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
  ox_questions?: OxQuestion[]
  infographic_svg?: string
}

export interface QuestionEvidence {
  question_no: number
  choice_no: string
  text: string
}

export interface ParagraphSummary {
  no: number
  content: string  // 교사가 입력한 단락 중심내용 (1문장)
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
  paragraph_summaries?: ParagraphSummary[] | null
  content_summary?: string | null
  explanations?: string | null
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
