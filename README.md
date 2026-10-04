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

## 구현된 기능

- 홈의 월간 기록 수와 최근 기록, 모바일 하단 메뉴
- 차 이름만 필수인 새 기록, 상세 조회, 수정, 삭제 확인
- 0~5점 별점, 날짜·시간·장소·사람·이유와 감상
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

DB 이름은 `tea-life-story`, 버전은 `1`입니다. `entries`, `categories`, `tools`, `materials`, `settings` 저장소를 사용합니다. 기록은 요청의 TeaEntry 중첩 모델을 따르며 미입력 사용량·용량은 `null`, 미입력 평점은 `0`입니다. 초안은 `settings`의 `draft` 키로 저장합니다. UI 컴포넌트는 DB에 직접 접근하지 않습니다. 향후 저장소 교체는 `db` 계층을 중심으로 진행할 수 있습니다.

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

2026-10-05 확인 시 저장소는 비공개이고 현재 GitHub 요금제에서 이 저장소의 Pages 활성화가 거부되었습니다. 저장소 공개 전환에 대한 사용자 선택이 필요하며, Pages 배포는 아직 완료되지 않았습니다. 배포 성공 이후 실제 URL을 이 문서에 기록합니다.

준비 커밋 `07b5a3c`는 `[skip ci]`로 push했습니다. Pages 활성화가 불가능한 상태에서 배포 작업이 실패하지 않도록 했으며, Pages 사용 가능 상태가 된 뒤 Actions에서 `Deploy Tea Life Story to Pages`를 수동 실행하거나 다음 일반 커밋을 `main`에 push하면 됩니다.

1. GitHub 원격 저장소를 연결하고 구현 파일을 `main` 브랜치에 push합니다.
2. GitHub 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
3. `deploy.yml`이 설치 → 린트 → 데이터 테스트 → production 빌드 → Pages 배포를 실행합니다.

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

검증한 항목:

- 데이터·설정 테스트 8개: 배포 경로 정규화, CRUD, 기본 목록, JSON 복원·유효성 검증, 저장 실패 롤백, 병합 충돌, 검색·필터·통계
- Chromium 브라우저 테스트 6개: 기록·사진 유지·수정·삭제, 초안, 백업, 사용자 목록, 하위 경로·오프라인, 360/390/430/768/1280px 화면 넘침
- `npm run lint`, 루트·하위 경로 `npm run build`

실제 GitHub Pages 배포, 실제 iOS/Android 홈 화면 설치와 해당 기기의 저장소 정책은 아직 검증하지 않았습니다.
