# Mini Event Race Dashboard

## 초기 세팅/갱신 절차

이 프로젝트의 데이터 파이프라인은 아래 순서로 동작합니다.

1. `fetch:doc` - Google Docs 원문을 `data/raw/doc.txt`로 내려받음
2. `parse:doc` - 원문 텍스트를 구조화하여 `data/contests.json`, `data/notes.json` 생성
3. `enrich:data` - 후처리 및 메타 보강
4. `validate:data` - 최소 1개 이상 대회가 생성됐는지 검증 (실패 시 exit code 1)

`build:data`는 위 과정을 조합해서 실행하며, 기본 동작은 `fetch -> parse -> enrich -> validate`입니다.

```bash
npm run build:data
```

### 1) `scripts/fetchDoc.ts` 실행 전제 (필수 환경변수)

`npm run fetch:doc` 또는 `npm run build:data`(기본 fetch 포함) 실행 시 아래 환경변수가 반드시 필요합니다.

- `GOOGLE_SERVICE_ACCOUNT_JSON`
  - Google 서비스 계정 JSON **원문 전체 문자열**
  - 필수 키: `client_email`, `private_key`
- `GOOGLE_DOC_FILE_ID`
  - 가져올 Google Docs 파일 ID (또는 문서 URL 전체도 허용)

#### 입력값 팁 (자주 발생하는 오류)

- `GOOGLE_SERVICE_ACCOUNT_JSON.private_key`에 `\n` 이스케이프 문자열이 포함되어 있어도 스크립트에서 실제 개행으로 자동 정규화합니다.
- `GOOGLE_DOC_FILE_ID`에는 순수 파일 ID뿐 아니라 아래 URL 형태도 입력 가능합니다.
  - `https://docs.google.com/document/d/<FILE_ID>/edit...`
  - `https://drive.google.com/open?id=<FILE_ID>`

#### 로컬 주입 경로

터미널에서 환경변수 export 후 실행합니다.

```bash
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
export GOOGLE_DOC_FILE_ID='your_google_doc_file_id'
npm run build:data
```

또는 `direnv`, `.envrc`, CI와 동일한 비밀관리 도구를 사용해 셸 세션에 주입해도 됩니다.

#### 배포/배치 주입 경로

운영 환경에서는 **저장소에 직접 커밋하지 말고** 시크릿 저장소를 통해 주입합니다.

- GitHub Actions: Repository/Organization Secrets -> workflow `env`로 주입
- 기타 배치 러너/호스팅: Secret Manager 또는 환경변수 설정 화면에서 런타임 주입

핵심은 `npm run fetch:doc`를 호출하는 **실행 프로세스의 환경변수**에 두 값이 존재해야 한다는 점입니다.

### 2) 운영 체크리스트 (`buildData.ts` 기준)

아래 체크리스트로 `fetch -> parse -> enrich`가 실제 산출물을 만들었는지 점검할 수 있습니다.

#### 실행 전

- [ ] `node -v`가 `>=20 <21`
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DOC_FILE_ID` 주입 완료 (fetch 필요 시)

#### 실행

- [ ] `npm run build:data`
- [ ] 로그에 `fetchDoc complete` 출력 확인
- [ ] 로그에 `parseDoc complete (contests=..., notes=...)` 출력 확인
- [ ] 로그에 `validate:data complete (contests=...)` 출력 확인

#### 산출물 검증

- [ ] `data/raw/doc.txt`가 비어 있지 않음
- [ ] `data/raw/doc.sha256`이 갱신됨
- [ ] `data/contests.json`의 `contests.length >= 1`
- [ ] `data/notes.json`이 JSON으로 파싱 가능

#### 실패/경고 해석

- `parseDoc warning: data/raw/doc.txt is empty...`
  - 원문이 비어 있음. fetch 권한/파일 ID/문서 내용 점검 필요
- `validate:data failed: at least one contest is required...`
  - CI/배치 실패 의도된 동작. 문서 포맷/원문 내용 확인 후 재실행

### 3) 자주 쓰는 명령어

```bash
# 전체 파이프라인
npm run build:data

# fetch 없이 기존 raw 문서로 parse/enrich/validate만
npm run build:data -- --parse

# 개별 실행
npm run fetch:doc
npm run parse:doc
npm run enrich:data
npm run validate:data
```

### 4) `data/notes.json` 스키마 계약 (드리프트 방지)

`notes.json`은 파이프라인에서 발생한 **비정형 문서 메모/운영 메모**를 구조화해서 보관하는 파일입니다.

```json
{
  "meta": {
    "generatedAt": "2026-03-06T00:00:00.000Z",
    "version": 1
  },
  "notes": [
    {
      "id": "parse-note-1",
      "message": "운영 메모: 행사장 주차 협소",
      "source": "parse",
      "createdAt": "2026-03-06T00:00:00.000Z",
      "contestId": "2024-10-01_서울마라톤"
    }
  ]
}
```

- `meta.generatedAt`: 파일 생성/갱신 시각(ISO-8601)
- `meta.version`: 계약 버전 (현재 `1`)
- `notes[].id`: 노트 고유 식별자
- `notes[].message`: 사람이 읽는 메모 본문
- `notes[].source`: 생성 주체 (`parse` | `enrich` | `migration`)
- `notes[].createdAt`: 노트 생성 시각(ISO-8601)
- `notes[].contestId`: 관련 대회 ID (없으면 생략 가능)

#### 레거시 마이그레이션 규칙

기존 `notes: string[]` 포맷을 읽으면 아래 규칙으로 자동 변환합니다.

1. 각 문자열 항목을 `notes[].message`로 매핑
2. `id`는 순서 기반 `migration-note-{n}` 부여
3. `source`는 `migration` 고정
4. `createdAt`은 `meta.generatedAt`(없으면 현재 파이프라인 시간) 사용
5. 출력은 항상 구조화된 `notes: NoteItem[]` 계약으로 저장
