# Tea Life Story

차 한 잔의 향, 우림, 순간과 마음을 기록하는 모바일 중심 Vue PWA입니다. 서버와 회원가입 없이 IndexedDB에 기록을 저장합니다.

## 실행

Node.js 22.12 이상이 필요합니다. 개발·배포 검증은 Node.js 24로 진행했습니다.

```sh
npm ci
npm run dev
```

브라우저에서 터미널에 표시된 `http://127.0.0.1:5173/` 주소를 엽니다.

```sh
npm run lint
npm test
npm run build
npm run preview
```

PWA는 production 빌드에서 활성화됩니다. `npm run dev`에서는 서비스 워커를 등록하지 않습니다. 첫 온라인 방문에서 오프라인 준비가 끝난 이후 사용할 수 있습니다. 설치는 HTTPS 또는 localhost 환경이 필요합니다.

브라우저가 앱 설치를 지원하고 설치 요청을 제공하면 설정 화면에 **앱 설치** 버튼이 나타납니다. 홈에서 받은 요청도 화면 이동 후 유지합니다. 설치 취소·실패 시 브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 이용할 수 있습니다.

## 구현된 기능

- 홈의 월간 기록 수와 최근 기록, 모바일 하단 메뉴
- 차 이름만 필수인 새 기록, 상세 조회, 수정, 삭제 확인
- 0~5점 별점, 날짜·시간·장소·사람·이유와 감상
- 선택 입력 물 온도(°C)·우림 시간(초), 즐겨찾기 저장·해제와 목록 필터
- 이름·메모·감상·태그 검색, 종류·평점·기간 필터, 최신·오래된·평점 정렬
- 월별 기록 수·평균 평점·종류별 CSS 막대그래프
- 사용자 정의 차 종류·도구·재질의 추가·수정·삭제
- 사진 첨부: JPG/PNG/WebP 최대 6장, 원본 한 장당 15MB, 최대 1400px JPEG로 축소 저장
- JSON 백업과 병합·전체 교체 복원, 복원 전 전체 스키마 검증
- 새 기록의 변경 후 250ms 자동 초안 저장, 화면 이탈 시 저장, 이어쓰기·새로 작성
- 앱 셸과 지연 로딩 화면의 오프라인 캐시, PWA 아이콘과 업데이트 알림

평점을 입력하지 않은 기록은 평균에서 제외합니다. 설정 목록의 이름 변경·삭제는 기존 기록을 바꾸지 않습니다. 기존 종류는 목록 필터와 기록 수정 화면에서 계속 선택할 수 있습니다.

## 구조

```text
src/
  config/            초기 선택 목록, 개발 샘플
  db/                IndexedDB 연결, 기록·설정·백업 저장 API
  stores/            Pinia 상태와 UI용 액션
  router/            Hash History 라우터
  components/        공통 UI와 차 기록 입력 섹션
  views/             홈, 목록, 작성·수정, 상세, 통계, 설정
  utils/             데이터 생성·정규화·검색·통계, 사진 처리
public/icons/        SVG와 192/512px PNG, maskable, Apple 아이콘
tests/               데이터·브라우저 검증
.github/workflows/   main push 시 GitHub Pages 배포
```

DB 이름은 `tea-life-story`, 버전은 `1`입니다. `entries`, `categories`, `tools`, `materials`, `settings` 저장소를 사용합니다. 기록은 요청의 TeaEntry 중첩 모델을 따르며 미입력 사용량·용량·온도·우림 시간은 `null`, 미입력 평점은 `0`, 즐겨찾기는 기본 `false`입니다. `waterTemperature`는 °C(0~100), `steepTime`은 초(0~100000)로 저장합니다. 초안은 `settings`의 `draft` 키로 저장합니다. UI 컴포넌트는 DB에 직접 접근하지 않습니다. 향후 저장소 교체는 `db` 계층을 중심으로 진행할 수 있습니다.

이전 기록·초안·버전 1 백업도 계속 사용할 수 있습니다. 누락된 신규 필드는 읽을 때 기본값으로 보완하고 원본 시각은 유지합니다. 기존 사진은 보존하며 사진 필드가 없는 모델도 읽습니다. 저장소와 인덱스를 바꾸지 않으므로 DB·백업 버전은 유지합니다. 초안은 작성 중 범위를 벗어난 유한한 수치도 백업·복원에서 보존하며, 최종 기록 저장 시에는 기존 범위 제한을 적용합니다.

기본 선택 목록은 DB 최초 생성 때 한 번만 삽입합니다. 개발 샘플은 개발 모드 설정 화면에서 직접 추가하는 경우에만 삽입하며 `isSample`으로 구분합니다. production에서는 샘플 기능과 코드가 제외됩니다.

## 백업과 데이터 보관

설정 → 전체 데이터 내보내기로 기록·사진·선택 목록·초안을 함께 백업합니다. 파일에는 개인정보가 포함될 수 있으므로 직접 안전한 장소에 보관하세요. 앱은 데이터를 외부 서버로 전송하지 않습니다.

- **병합:** 새로운 ID는 추가합니다. 같은 기록 ID는 `updatedAt`이 더 최근인 쪽을 유지합니다. 같은 설정 ID와 이미 있는 초안은 현재 기기의 내용을 유지합니다.
- **전체 교체:** 현재 기록·선택 목록·초안을 모두 백업의 내용으로 교체합니다. 실행 전에 UI에서 명시적으로 선택·확인합니다.
- 잘못된 스키마·중복 ID·잘못된 날짜·평점·사진 URL을 거부합니다. 쓰기 실패는 단일 IndexedDB 트랜잭션으로 롤백됩니다.
- 가져오기 파일의 최대 크기는 30MB입니다. 사진 크기를 줄이고 정기적으로 백업하세요.

브라우저 저장소 삭제, 시크릿 모드 종료, 기기 변경 시 데이터가 사라질 수 있습니다. 브라우저별·사이트 주소별로 저장 공간이 분리되며 서로 자동 동기화되지 않습니다. 기기의 저장 공간 부족과 브라우저 강제 종료 직전의 변경까지 보장할 수는 없습니다. 수정 화면은 저장하지 않고 이동할 때 확인을 표시하며 새 기록용 초안을 덮어쓰지 않습니다.

## GitHub Pages 배포

연결된 저장소는 [TaewoongHwang/TeaLifeStory](https://github.com/TaewoongHwang/TeaLifeStory)이며, 원격 주소는 `https://github.com/TaewoongHwang/TeaLifeStory.git`입니다. 원격 `main`의 초기 README 커밋을 보존하면서 로컬 프로젝트를 연결하고, 앱과 개발 문서를 `main`에 push했습니다.

2026-10-05 앞선 Pages 생성 요청은 비공개 저장소의 요금제 제한으로 거부되었습니다. 이번 읽기 전용 조회에서도 저장소는 비공개, `has_pages=false`이고 Pages는 HTTP 404를 반환합니다. API가 계정 plan 정보를 제공하지 않아 현재 요금제는 미확인입니다. 공개 전환 또는 비공개 Pages를 지원하는 환경의 확인이 필요하며 실제 배포는 완료되지 않았습니다. [GitHub Pages 지원 범위](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)를 참고하세요.

최신 MVP·UI·PWA 개선과 브라우저 검증을 포함한 배포 준비 커밋을 비공개 `main`에 반영합니다. Pages 설정 전에는 배포 workflow가 실패하지 않도록 `[skip ci]`를 사용합니다. 사용자가 공개 페이지를 허용했지만, 자동 승인 검토는 저장소 전체 소스와 커밋 이력의 공개에 대한 명시적 승인이 별도로 필요하다고 판단했습니다. 공개 전환·Pages 활성화는 실행되지 않았습니다.

준비 커밋 `07b5a3c`는 `[skip ci]`로 push했습니다. Pages 활성화가 불가능한 상태에서 배포 작업이 실패하지 않도록 했으며, Pages 사용 가능 상태가 된 뒤 Actions에서 `Deploy Tea Life Story to Pages`를 수동 실행하거나 다음 일반 커밋을 `main`에 push하면 됩니다.

1. GitHub 원격 저장소를 연결하고 구현 파일을 `main` 브랜치에 push합니다.
2. GitHub 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
3. `deploy.yml`이 의존성 설치 → 린트 → 데이터 테스트 → Pages 설정 → Chromium 설치 → 실제 Pages 경로의 브라우저 회귀·PWA 검증 → 최종 production 빌드 → Pages 배포를 실행합니다. workflow의 새 검증 단계는 로컬에서 준비했으며 실제 Actions 실행 결과는 아직 없습니다.

`actions/configure-pages`가 알려주는 `base_path`를 `VITE_BASE_PATH`에 전달하므로 저장소 이름을 코드에 고정하지 않습니다. 사용자 Pages와 사용자 정의 도메인은 루트 경로, 프로젝트 Pages는 저장소 하위 경로로 빌드합니다. manifest의 시작 경로·scope·아이콘, 서비스 워커와 asset 경로도 동일한 base를 사용합니다. 라우터는 `createWebHashHistory`를 사용합니다.

하위 경로를 PowerShell에서 직접 확인하려면:

```powershell
$env:VITE_BASE_PATH = '/TeaLifeStory/'
npm run build
npm run preview
```

`http://127.0.0.1:4173/TeaLifeStory/`에서 확인합니다. 루트 개발로 돌아갈 때는 `Remove-Item Env:VITE_BASE_PATH`로 해제하세요. 빌드와 preview에 같은 base 설정을 적용해야 합니다.

참고: [Vite GitHub Pages 배포 안내](https://vite.dev/guide/static-deploy.html#github-pages), [Vue Router Hash History](https://router.vuejs.org/guide/essentials/history-mode.html), [Vite PWA 안내](https://vite-pwa-org.netlify.app/guide/).

## 브라우저 검증

```sh
npx playwright install chromium
npm run test:e2e
```

테스트가 `/TeaLifeStory/`로 production 빌드하고 4173 포트에서 미리보기 서버를 시작합니다. `TEST_BASE_PATH`로 다른 경로를 지정할 수도 있습니다. 포트가 이미 사용 중이라면 먼저 종료해야 합니다. 테스트 종료 시 서버도 종료합니다.

2026-10-05 기능 검수에서 검증한 항목:

- 데이터·설정 테스트 13개: 배포 경로 정규화, CRUD, 기본 목록, JSON 복원·유효성 검증, 저장 실패 롤백, 병합 충돌, 검색·필터·통계, 이전 기록·초안·백업 호환성, 신규 우림 필드와 즐겨찾기의 저장·검증·오류 처리, 작성 중 범위 밖 수치가 있는 초안의 백업 복원
- Chromium 브라우저 테스트 13개: 기록·사진 유지·수정·삭제, 초안, 백업, 사용자 목록, 하위 경로·오프라인, 360/390/430/768/1280px 화면 넘침, 앱 페이지 종료 후 재접속, 신규 우림 필드·즐겨찾기·새 브라우저 복원, 이전 기록·초안 편집, 정확한 통계·진단 메시지·하단 메뉴 접근·미완성 초안 백업 복원, 실제 Chromium 설치 가능 조건, 설치 이벤트의 화면 이동·취소·실패·완료 처리
- 루트 주소(`TEST_BASE_PATH=/`)에서도 manifest·설치 안내·오프라인 테스트 3개 통과. Chromium 설치 가능 조건 검사와 이벤트 모사는 실제 iOS/Android 설치 검수와 구분합니다.
- 개발 서버 루트 주소에서도 검수 테스트 3개 통과: Vue warning·console error·미처리 예외 없음. production에서는 같은 검수와 기존 회귀를 함께 실행함
- `npm run lint`, 루트·하위 경로 `npm run build`

실제 GitHub Pages 배포, 실제 iOS/Android 홈 화면 설치와 해당 기기의 저장소 정책은 아직 검증하지 않았습니다.
