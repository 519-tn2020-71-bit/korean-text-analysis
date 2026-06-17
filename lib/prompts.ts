export function buildAnalysisPrompt(passageText: string, questionsText?: string): string {
  return `당신은 수능 국어 독서 전문 교사이자 논리학자입니다.
아래 지문을 분석하여 JSON을 반환하세요. 유효한 JSON만 반환하세요. 코드블록·마크다운·설명 텍스트 금지.

## 분석 지문
${passageText}
${questionsText ? `\n## 수능 문제\n${questionsText}` : ''}

## 분석 원칙
1. 표면 접속어보다 의미 구조를 우선해 서술방식을 판별한다.
2. 원문에 없는 내용을 추론으로 삽입하지 않는다. annotation.text는 원문과 완벽히 일치.
3. exam_traps는 구체적 함정 유형과 오답 조작 방식까지 명시한다.
4. connective_analysis는 앞 내용을 구체적으로 언급해 연결 관계를 설명한다.
5. relation_explanation은 앞 단락 내용을 직접 언급해 서술한다.

## paragraphs 필드 기준

- **function_tag**: 정의|예시|인과|대조|열거|부연|주장|근거|결론
- **core_sentence**: 단락 핵심 문장 원문 발췌 (필수)
- **relation_to_prev**: 1단락="도입" / 이후: 부연|대조|전환|예시|근거|결론
- **summary**: 2~3문장 (핵심주장 + 앞 단락 연결 + 출제 가능성)
- **function**: 전체 논증에서 이 단락의 역할 1~2문장
- **writing_style**: "개념 정의 + 대비" 형태로 한글 조합 표기
- **logical_structure**: "① 전제→② 근거→③ 결론" 형태 번호 서술
- **relation_explanation**: 앞 단락 내용 구체적 언급 포함 (1단락 제외)
- **exam_traps**: 2~3개, 구체적 오답 조작 방식 포함
- **connective_analysis**: 핵심 접속어·지시어 2~4개, 앞 내용 구체적 언급
- **reading_guide**: 교사 나레이션체 2~4문장. 구어체. 핵심어 밑줄/표시 지시·접속어 기능 설명 포함. 빈칸 정답어는 【정답어】 표기. 예: "자, 이 문단에서 '후각 수용체'에 밑줄을 그으세요. 이것은 냄새 분자를 【전기 신호】로 전환하는 매개체예요. '이후'는 시간 순서 신호이니 주목해 두세요."

## annotations 기준

색상 코딩:
- red: 핵심 주장·결론 (★)
- blue: 개념 정의·포함 관계 (□)
- purple: 논리 관계·인과·논거 (→)
- amber: 전환·역접·반박 (△)
- green: 구체 예시 (◇)

note 형식: "↳ [역할]: [설명+함정경고]" 30~80자 (역할만 쓰는 짧은 메모 금지)
text: 서술어 포함 절 전체 (명사구 단독 금지)

수량: 4단락 이하 22개 이상 / 5단락 이상 30개 이상

## compare_cards
두 대상 대립 시 반드시 생성. comparison_points 최소 4개.

## exam_points
5~7개, 30자 이상 구체적 논점.

## margin_notes
단락당 2~3개, content 30~60자.
대조 메모: "A(입장) ↔ B(입장): 대립 지점"

## JSON 스키마
{
  "macro": { "topic":"", "main_idea":"", "text_type":"", "structure":"" },
  "paragraphs": [{
    "no":1, "function_tag":"", "core_sentence":"", "keywords":[],
    "relation_to_prev":"", "summary":"", "function":"", "writing_style":"",
    "logical_structure":"", "relation_explanation":"", "exam_traps":[],
    "connective_analysis":[{"word":"","role":"","explanation":""}],
    "reading_guide":""
  }],
  "annotations": [{
    "text":"", "keyword":"", "label":"", "note":"",
    "logic_role":"", "color":"", "symbol":"", "position":0
  }],
  "highlights": [{"text":"","color":"","reason":""}],
  "compare_cards": [{"person_a":"","person_b":"","comparison_points":[{"aspect":"","a_value":"","b_value":""}]}],
  "logic_map": {"nodes":[{"id":"","label":"","type":""}],"edges":[{"from":"","to":"","label":"","type":""}]},
  "exam_points": [{"text":"","reason":"","type":""}],
  "margin_notes": [{"paragraph_no":1,"type":"","content":"","color":""}],
  "question_evidences": [{"question_no":1,"choice_no":"","text":""}]
}

## 최종 점검
□ paragraphs: 모든 필드 입력 (빈 값 금지)
□ annotations.note: "↳ [역할]: [설명]" 30자 이상
□ annotations.text: 서술어 포함 절 전체
□ annotations: 단락당 5개 이상
□ compare_cards: 두 대상 대립 있으면 반드시 생성
□ exam_traps: 구체적 오답 조작 방식 포함`
}

export function buildOxPrompt(passageText: string, paragraphs: Array<{ no: number; core_sentence: string; keywords: string[] }>): string {
  const paraInfo = paragraphs.map(p =>
    `[${p.no}단락] 핵심: ${p.core_sentence?.slice(0, 60)} | 키워드: ${p.keywords?.join(', ')}`
  ).join('\n')

  return `당신은 수능 국어 출제 전문가입니다. 아래 지문을 바탕으로 OX 확인 문제를 생성하세요.
유효한 JSON 배열만 반환하세요. 코드블록·설명 텍스트 금지.

## 지문
${passageText}

## 단락별 핵심 정보
${paraInfo}

## OX 문항 설계 원칙

**O 문항** (전체의 60~70%): 핵심 내용을 다른 표현으로 재서술 — 원문을 읽어야만 판단 가능해야 함. 상식으로 판단 가능한 문항 금지.

**X 문항** (전체의 30~40%): 아래 4가지 유형 중 하나만 적용. 조작은 단 하나의 요소만. 즉시 오답이 드러나는 X 금지.
- X1(인과비틀기): 원문의 인과 결과를 그럴듯한 다른 결과로 교체
- X2(범위변경): '일부'→'전부', '~할 수 있다'→'반드시 ~한다' 등 한정 표현 조작
- X3(관계왜곡): A⊂B를 B⊂A로, A→B를 B→A로, 병렬을 종속으로 등 관계 변경
- X4(뉘앙스변질): 원문에 없는 평가·감정 표현 삽입, 중립 서술을 긍정/부정으로 변경

## 요구사항
- 총 15개 (단락당 2~3개, O:X ≈ 9:6)
- statement: 수능 선지 스타일 30~60자
- explanation: 원문 근거 인용 포함 40~80자 (X 문항은 조작 내용도 명시)
- trap_type: O 문항="핵심재서술"|"관계확인", X 문항="X1"|"X2"|"X3"|"X4"
- difficulty: easy|medium|hard

## JSON 배열 스키마
[{
  "id": 1,
  "paragraph_no": 1,
  "statement": "",
  "answer": true,
  "explanation": "",
  "trap_type": "",
  "difficulty": ""
}]`
}
