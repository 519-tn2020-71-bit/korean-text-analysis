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
    "connective_analysis":[{"word":"","role":"","explanation":""}]
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

X 문항에 적용할 함정 기법:
- 범위: '일부'→'전부', '~할 수 있다'→'반드시 ~한다'
- 인과역전: A→B를 B→A로 역전
- 속성혼용: A의 특성을 B에 귀속
- 관계역전: 포함 관계 A⊂B를 B⊂A로
- 부정역전: '~이 아니다'→'~이다'
- 개념대체: 유사하지만 다른 개념으로 교체

O 문항: 학생이 헷갈리기 쉬운 핵심 사실 (맞지만 의심스러운 것)
X 문항: 위 함정 기법 하나를 명확히 적용한 틀린 진술

## 요구사항
- 총 15개 (단락당 2~3개, O:X = 약 7:8)
- statement: 수능 선지 스타일 30~60자
- explanation: 원문 근거 포함 40~80자
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
