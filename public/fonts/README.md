# Pretendard Variable

차곡차곡에서 자체 제공하는 웹폰트의 출처와 검증 정보다. 글꼴과 라이선스는 공식 저장소의 파일을 수정 없이 보관한다. CDN CSS나 외부 글꼴 서버를 앱에서 호출하지 않는다.

## 출처

- 제작자: 길형진 / Kil Hyung-jin (`orioncactus`)
- 공식 프로젝트: https://github.com/orioncactus/pretendard
- 안정판 태그: `v1.3.9` — https://github.com/orioncactus/pretendard/releases/tag/v1.3.9
- 안정판 공개 시각: `2023-11-05T18:21:09Z`
- 가져온 날짜: `2026-10-08` (Asia/Seoul)
- 원본 글꼴 경로: `packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2`
- 글꼴 원본: https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2
- 라이선스 원본: https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE
- 공식 CSS: https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/variable/pretendardvariable.css

`PretendardVariable.woff2`는 upstream의 전체 웹폰트 파일이다. 앱에서 사용할 글자만 추출한 정적 서브셋이나 동적 서브셋이 아니며 변환·편집하지 않았다.

## 검증

| 파일 | 크기 (byte) | SHA-256 |
| --- | ---: | --- |
| `PretendardVariable.woff2` | 2,057,688 | `9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4` |
| `OFL.txt` | 4,418 | `d31ddd9f2bed32fd7e302a205cf2380ba0de6529152d239ef99cfb6f261bfc04` |

- 글꼴 시그니처: `wOF2` (WOFF2)
- 내부 family: `Pretendard Variable`, style: `Regular`
- 내부 version: `Version 1.309;Glyphs 3.2 (3225)`
- 공식 CSS 선언: `font-weight: 45 920`, `font-style: normal`, `font-display: swap`
- 내부 `fvar`의 `wght` 축: 최소 45, 기본 400, 최대 930. 앱 CSS의 지원 범위는 upstream CSS의 45–920을 따른다.
- 내부 `maxp` glyph 수: 14,757
- Git blob SHA-1: 글꼴 `49c54b5152a184a243e85f7281ed338b6569987e`, 라이선스 `c0592ca0072da4537bdc064eb935d88e9bb4361d`. 다운로드 파일로 계산한 값이 공식 태그의 Git tree와 일치한다.
- 글꼴은 약 1.96 MiB다. Workbox 기본 개별 precache 한계 2 MiB(2,097,152 byte)보다 39,464 byte 작다. 이 비교는 파일 크기 확인이며 실제 precache·오프라인 동작은 앱 빌드와 브라우저에서 별도로 검증한다.

## 문자 범위와 fallback

upstream 전체 파일이라고 모든 언어의 글자가 들어 있는 것은 아니다. 파일의 cmap에서 `차`, `곡`을 확인했고 `茶`, `中`, `文`, `漢`, `字`, `🍵`는 포함되지 않은 것을 확인했다. 한자·이모지·지원하지 않는 언어는 기존 시스템 글꼴과 emoji fallback으로 표시한다. 사용자 입력을 앱 화면의 고정 글자만으로 제한하지 않는다.

## 라이선스

SIL Open Font License 1.1. 원본 저작권 고지와 전체 라이선스는 동봉한 `OFL.txt`에 있다. Reserved Font Name은 `Pretendard`다. 이 자산을 재배포할 때도 저작권과 라이선스를 함께 보관한다.
