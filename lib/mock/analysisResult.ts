import type { AnalysisResult } from '@/types'

export const MOCK_ANALYSIS: AnalysisResult = {
  macro: {
    topic: '후각 수용체와 냄새 신호 전달',
    main_idea: '후각 수용체 단백질이 냄새 분자를 전기 신호로 변환하여 뇌에 전달하는 과정을 설명한다.',
    text_type: '설명문',
    structure: '개념 정의 → 메커니즘 서술 → 심화 정보',
  },
  paragraphs: [
    {
      no: 1,
      function_tag: '정의',
      core_sentence: '후각 수용체는 코 안쪽 점막에 위치한 단백질 분자이다.',
      keywords: ['후각 수용체', '점막', '단백질'],
      relation_to_prev: '도입',
      summary: '후각 수용체의 위치와 기본 속성을 정의한다. 이 단락은 이후 작동 원리 설명의 전제가 된다.',
      function: '핵심 개념인 후각 수용체를 정의하여 전체 지문의 출발점을 제공한다.',
      writing_style: '개념 정의 + 위치 서술',
      logical_structure: '① 대상 제시 → ② 위치 특정 → ③ 물질적 속성 기술',
      relation_explanation: '',
      exam_traps: [
        '후각 수용체를 세포로 오인하게 유도하는 선지 주의 (단백질 분자임)',
        '위치를 코 표면으로 바꾸는 범위 변경 함정 가능',
      ],
      connective_analysis: [
        { word: '즉', role: '부연', explanation: '앞의 위치 설명을 요약하여 핵심 속성을 재강조한다.' },
      ],
      reading_guide: '자, 1단락에서 \'후각 수용체\'에 밑줄을 그으세요. 이것이 오늘 지문의 주인공이에요. \'점막\'이라는 위치도 동그라미 쳐두세요. 수용체가 어디에 있는지가 【점막】이에요.',
      reading_barriers: [
        { type: '생소개념', text: '후각 수용체', tip: '냄새를 탐지하는 열쇠-자물쇠 비유로 설명하면 효과적입니다.' },
      ],
      vocab_items: [
        { word: '수용체', level: 'high', meaning: '특정 물질을 받아들이는 단백질' },
        { word: '점막', level: 'medium', meaning: '촉촉한 코 안쪽 막' },
      ],
    },
    {
      no: 2,
      function_tag: '인과',
      core_sentence: '냄새 분자가 수용체에 결합하면 세포 내부에서 전기 신호가 생성된다.',
      keywords: ['냄새 분자', '결합', '전기 신호'],
      relation_to_prev: '부연',
      summary: '수용체의 작동 원리를 인과 구조로 서술한다. 1단락의 정의를 받아 실제 메커니즘을 설명하는 핵심 단락이다.',
      function: '후각 신호 변환의 핵심 메커니즘을 인과 관계로 설명한다.',
      writing_style: '인과 서술 + 과정 나열',
      logical_structure: '① 자극(냄새 분자 도착) → ② 반응(수용체 결합) → ③ 결과(전기 신호 생성)',
      relation_explanation: '1단락에서 정의한 후각 수용체가 실제로 어떻게 작동하는지를 인과적으로 풀어낸다.',
      exam_traps: [
        '전기 신호 생성 위치를 세포 외부로 바꾸는 함정 주의',
        '냄새 분자가 수용체를 변형시킨다고 오인하게 유도 가능',
        '인과 순서를 역전(신호 → 결합)시키는 X3 유형 함정',
      ],
      connective_analysis: [
        { word: '이때', role: '인과', explanation: '냄새 분자 결합 직후 전기 신호가 생성되는 시간적·인과적 연결을 표시한다.' },
        { word: '따라서', role: '결론', explanation: '앞의 결합 과정을 전제로 신호 전달이라는 결론을 이끌어낸다.' },
      ],
      reading_guide: '2단락이 핵심이에요. \'결합\'과 \'전기 신호\'를 화살표로 연결해보세요. 냄새 분자가 수용체에 붙으면 → 전기 신호가 생깁니다. 이 인과 관계가 시험에 꼭 나와요. \'이때\'는 바로 그 순간을 가리키는 【시간 신호】예요.',
      reading_barriers: [
        { type: '인과관계', text: '결합하면 전기 신호가 생성된다', tip: '원인(결합)과 결과(신호)를 화살표로 칠판에 그려주면 즉시 이해됩니다.' },
        { type: '추상표현', text: '세포 내부에서 신호 변환', tip: '자물쇠-열쇠 비유: 분자(열쇠)가 수용체(자물쇠)에 맞으면 문(신호)이 열린다고 설명하세요.' },
      ],
      vocab_items: [
        { word: '결합', level: 'medium', meaning: '두 물질이 붙어 연결되는 것' },
        { word: '전기 신호', level: 'high', meaning: '신경이 정보를 전달하는 전기적 변화' },
      ],
    },
    {
      no: 3,
      function_tag: '부연',
      core_sentence: '하나의 수용체는 특정 구조의 분자에만 반응하는 선택성을 가진다.',
      keywords: ['선택성', '구조 특이성', '자물쇠-열쇠'],
      relation_to_prev: '심화',
      summary: '수용체의 선택성 원리를 자물쇠-열쇠 모델로 설명한다. 2단락의 결합 개념을 구조적으로 심화한다.',
      function: '수용체-분자 결합의 선택성 원리를 제시하여 메커니즘을 정밀화한다.',
      writing_style: '비유 + 원리 설명',
      logical_structure: '① 선택성 주장 → ② 자물쇠-열쇠 비유 → ③ 선택성의 생물학적 의의',
      relation_explanation: '2단락에서 설명한 결합 과정이 "왜 특정 냄새만 구별하는가"라는 질문에 답하기 위해 선택성 개념을 도입한다.',
      exam_traps: [
        '모든 수용체가 모든 분자에 반응한다는 범위 변경 오답 주의',
        '자물쇠-열쇠 관계를 역전(수용체가 분자를 찾아간다)시키는 함정 가능',
      ],
      connective_analysis: [
        { word: '그런데', role: '전환', explanation: '2단락의 일반적 결합 설명에서 선택성이라는 심화 개념으로 화제를 전환한다.' },
      ],
      reading_guide: '\'그런데\'에 세모 표시하세요. 화제가 바뀌는 신호예요. 이 단락의 핵심은 \'선택성\'이에요. 수용체마다 맞는 분자가 【하나씩 정해져】 있다는 뜻이에요. 자물쇠-열쇠 그림을 그리면서 설명해보세요.',
      reading_barriers: [
        { type: '수식어구', text: '특정 구조의 분자에만 반응하는', tip: '\'특정\'과 \'만\'을 강조해서 읽게 하면 선택성 개념이 명확해집니다.' },
      ],
      vocab_items: [
        { word: '선택성', level: 'high', meaning: '특정 대상에만 반응하는 성질' },
        { word: '구조 특이성', level: 'high', meaning: '모양이 맞아야만 결합하는 성질' },
      ],
    },
  ],
  annotations: [
    { text: '후각 수용체는 코 안쪽 점막에 위치한 단백질 분자이다', keyword: '후각 수용체', label: '핵심 개념 정의', note: '↳ [정의]: 지문 전체 논의의 핵심 대상, 위치(점막)와 물질적 속성(단백질) 동시 제시', logic_role: '정의', color: 'blue', symbol: '□', position: 0 },
    { text: '냄새 분자가 수용체에 결합하면 세포 내부에서 전기 신호가 생성된다', keyword: '전기 신호', label: '핵심 인과', note: '↳ [인과]: 결합(원인) → 전기 신호(결과), X3 함정으로 순서 역전 주의', logic_role: '결론', color: 'red', symbol: '★', position: 100 },
    { text: '하나의 수용체는 특정 구조의 분자에만 반응하는 선택성을 가진다', keyword: '선택성', label: '심화 개념', note: '↳ [부연]: 2단락 결합 원리를 구조적 선택성으로 심화, \'만\'이 범위 한정 핵심어', logic_role: '부연', color: 'purple', symbol: '→', position: 200 },
    { text: '그런데', keyword: '', label: '전환 신호', note: '↳ [전환]: 일반 결합 → 선택성 심화로 화제 전환, 수험생 주목 필요', logic_role: '대조', color: 'amber', symbol: '△', position: 195 },
  ],
  highlights: [
    { text: '후각 수용체', color: 'yellow', reason: '지문 핵심 개념' },
    { text: '전기 신호', color: 'blue', reason: '결과 개념' },
    { text: '선택성', color: 'pink', reason: '심화 핵심어' },
  ],
  compare_cards: [],
  logic_map: {
    nodes: [
      { id: 'receptor', label: '후각 수용체', type: 'root' },
      { id: 'molecule', label: '냄새 분자', type: 'concept' },
      { id: 'signal', label: '전기 신호', type: 'concept' },
      { id: 'selectivity', label: '선택성', type: 'detail' },
    ],
    edges: [
      { from: 'molecule', to: 'receptor', label: '결합', type: 'causal' },
      { from: 'receptor', to: 'signal', label: '변환', type: 'causal' },
      { from: 'receptor', to: 'selectivity', label: '속성', type: 'include' },
    ],
  },
  exam_points: [
    { text: '수용체의 위치를 코 표면/세포 외부로 바꾸는 오답 식별', reason: '지문에서 \'점막\'으로 명시', type: '사실확인' },
    { text: '전기 신호 생성의 인과 관계(결합 → 신호) 순서 파악', reason: '순서 역전 함정 빈출', type: '추론' },
    { text: '선택성의 의미: 모든 분자 vs 특정 분자 구별', reason: '\'만\'이라는 한정 표현 근거', type: '사실확인' },
    { text: '자물쇠-열쇠 비유의 적용 범위 파악', reason: '비유 오남용 선지 빈출', type: '추론' },
    { text: '\'그런데\'의 담화 기능 — 부연이 아닌 전환', reason: '접속어 기능 오인 유형', type: '구조파악' },
  ],
  sentence_breaks: [
    { text: '냄새 분자가 수용체에 결합하면 세포 내부에서 전기 신호가 생성된다', breaks: ['냄새 분자가 / 수용체에 결합하면', '세포 내부에서 / 전기 신호가 생성된다'] },
  ],
  margin_notes: [
    { id: 'm1', paragraph_no: 1, content: '수용체 = 단백질 (세포 ✗)', color: 'yellow', type: '일반' },
    { id: 'm2', paragraph_no: 2, content: '결합 → 전기신호 (인과 순서!)', color: 'blue', type: '흐름' },
    { id: 'm3', paragraph_no: 3, content: '선택성 = 한 수용체 = 한 분자 구조', color: 'pink', type: '대조' },
  ],
  question_evidences: [
    { question_no: 1, choice_no: '①', text: '후각 수용체는 코 안쪽 점막에 위치한 단백질 분자이다' },
    { question_no: 1, choice_no: '②', text: '냄새 분자가 수용체에 결합하면 세포 내부에서 전기 신호가 생성된다' },
    { question_no: 2, choice_no: '①', text: '하나의 수용체는 특정 구조의 분자에만 반응하는 선택성을 가진다' },
    { question_no: 2, choice_no: '③', text: '전기 신호가 생성된다' },
  ],
  question_type_map: [
    { type: '내용일치', basis: '수용체 위치·속성 등 사실 정보가 명확해 일치 문항 출제 가능', paragraph_no: 1 },
    { type: '빈칸추론', basis: '인과 관계의 결과어(전기 신호)를 빈칸으로 처리하면 고난도 문항 성립', paragraph_no: 2 },
    { type: '주제요지', basis: '각 단락이 정의→원리→심화로 연결되어 전체 주제 파악 문항 적합', },
    { type: '순서배열', basis: '정의→메커니즘→선택성의 논리 순서가 명확해 문단 순서 배열 가능' },
  ],
  difficulty_score: {
    overall: 3,
    predicted_pass_rate: '55~65%',
    grade_estimate: '3~4등급',
    factors: ['생소한 생물학 전문 용어', '인과 구조와 선택성 개념의 중층적 연결', '비유(자물쇠-열쇠)의 적용 범위 판단'],
  },
}
