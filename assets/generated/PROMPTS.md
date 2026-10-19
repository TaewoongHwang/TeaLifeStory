# 차곡차곡 생성형 이미지 원본

현재 적용 원본은 로고 `chagok-leaf-rice-logo-source.png`, 차 사진 `chagok-tea-scene-no-strainer-source.png`, 밥 사진 `chagok-meal-scene-inner-source.png`이다. 아래 이전 생성 과정의 '현재/유지' 표현은 해당 작업 당시의 기록이다.

## 현재 로고: 찻잎과 쌀알이 겹친 심볼 — 2026-10-19

- 생성 도구: built-in `image_gen.imagegen`, 새 이미지 생성, 불투명 배경. 참조 이미지 입력이나 CLI/API fallback은 사용하지 않았다.
- 요청: 찻잎과 쌀의 모양을 함께 상징적으로 겹친 로고. 긴 찻잎과 둥근 쌀알이 겹치며 아이보리 여백이 잎맥과 두 모양의 교차를 구분한다. 별도 글자나 그릇·주전자는 없다.
- 현재 로고 원본: `chagok-leaf-rice-logo-source.png`(1254×1254). 기본 저장 파일 `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-e511117a-5418-4e82-9dca-aed54d22ba4f.png`를 프로젝트에 복사했다. 이전 밥공기/자사호 로고 원본도 보존한다.
- 실제 결과 검토: 뾰족한 찻잎·잎맥과 둥근 쌀알, 교차 부분의 여백과 하나로 이어지는 실루엣을 확인했다.
- `npm run icons`로 헤더/favicon 192px(38,178B), PWA 512px(238,712B), 10% 여백의 maskable 512px(176,432B), Apple 180px(34,054B) PNG를 만들었다. 홈 사진은 기존 원본을 사용한다.
- 실제 브라우저 44px 헤더와 모바일/PC 배치를 확인했다. 홈 WebP 4개는 변경 전후 SHA-256이 동일하고, 오프라인에서 WebP/PNG 8개를 읽어 현재 public 파일과 해시가 전부 일치함을 확인했다.

### 최종 생성 프롬프트

```text
Use case: logo-brand
Asset type: a single finished square brand symbol for 차곡차곡, a Korean tea-and-rice meal journal. Must remain clear in a 44px app header.
Primary request: create a symbolic integrated logo by overlapping the shape of ONE tea leaf and ONE rice grain. They must interlock into a single distinctive emblem, rather than sit side by side as separate pictograms.
Design: one graceful elongated tea leaf with a pointed tip and a single broad negative-space central vein; one shorter, plump rice kernel with softly rounded ends and a smooth, unsegmented silhouette. Tilt these two organic forms across one another with a deliberate partial overlap. Use a simple ivory cutout at their crossing to keep each form legible while making them feel woven together. The leaf has a lively rising curve; the rice kernel adds a calm rounded countercurve. Balanced compact silhouette, confident curves, thick enough shapes and negative-space gaps to read at icon size. Restrained, warm, modern Korean editorial identity, with careful optical balance.
Color and medium: flat graphic artwork in one solid deep terracotta brown close to #743f32 on a perfectly solid warm ivory background close to #f8f2e8. Crisp smooth edges. No photographic texture or light.
Composition: only one emblem, centered and optically balanced in a square, filling roughly 68–74 percent of both width and height, with generous even safe margins.
Constraints: no rice bowl, teapot, cup, utensils, wheat stalk, extra leaves, extra kernels, flowers, text, letters, borders, decorative frame, mockup or presentation sheet. Do not make two identical leaves; keep the short rounded rice grain distinct from the longer pointed veined tea leaf. No gradients, shadows, realism, embossing, 3D or watermark. Opaque background.
```

## 이전 로고: 밥공기와 자사호 평면 심볼 — 2026-10-19

- 생성 도구: built-in `image_gen.imagegen`, 새 이미지 생성, 불투명 배경. 참조 이미지 입력이나 CLI/API fallback은 사용하지 않았다.
- 요청: 헤더 사진형 마크를 밥과 차를 뜻하는 디자인된 로고로 변경. 밥공기와 쌀알 세 개, 자사호의 뚜껑·주둥이·손잡이를 단순한 붉은 갈색 실루엣과 여백으로 표현했다. 별도 글자는 없다.
- 현재 로고 원본: `chagok-rice-tea-logo-source.png`(1254×1254). 기본 저장 파일 `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-ceff2406-8264-46f6-9029-ca3bc71fe34f.png`를 프로젝트에 복사했다. 이전 사진형 원본도 보존한다.
- `npm run icons`로 같은 로고에서 헤더/favicon 192px(44,141B), PWA 512px(238,672B), 10% 여백을 둔 maskable 512px(178,640B), Apple 180px(39,587B) PNG를 생성했다. 원본을 다시 그리지 않고 크기와 여백만 변환했다.
- 실제 결과 검토: 밥공기·쌀알·자사호와 단순한 심볼 구성을 확인하고 44px 헤더를 실제 브라우저 캡처로 확인했다. 홈 사진 WebP 4개의 수정 전후 SHA-256은 동일하며, 오프라인 PNG 4개는 새 public 파일과 해시가 일치했다.

### 최종 생성 프롬프트

```text
Use case: logo-brand
Asset type: one finished square app logomark for 차곡차곡, a Korean rice-meal and tea journal, also used at 44px in a website header.
Primary request: design a warm, elegant, minimal graphic symbol that clearly combines a bowl of rice and a small round lidded tea pot. This must look like a deliberately designed brand logo.
Design: a compact harmonious paired emblem: a simple semicircular rice bowl with a short foot and just three bold grain shapes, alongside a rounded zisha-inspired teapot with a clear lid knob, short pouring spout and open loop handle. Unite their curved geometry, stroke weight and baseline so they feel like one coherent identity. Both meanings should be immediately recognizable, with open negative space and a strong silhouette.
Style: flat two-dimensional geometric logo artwork; confident thick rounded curves, a restrained balance of solid forms and negative cutouts, polished optical spacing. Gentle Korean everyday-living sensibility. Single terracotta-brown ink close to #743f32 on a perfectly solid warm ivory background #f8f2e8.
Composition: a single centered symbol, occupying about 78 percent of the square width and 65 percent of its height, with safe breathing room on every side. Readable as a tiny app icon; no hairline details.
Constraints: no text, letters, numbers, captions, border, mockup, multiple options or presentation sheet. No photography, realism, ceramic texture, wood, food texture, gradients, shadows, lighting effects, 3D rendering or extra decoration. Opaque background.
```

## 현재 밥 사진: 밥·청국장은 안쪽, 반찬은 바깥쪽 — 2026-10-19

- 생성 도구: built-in `image_gen.imagegen`, 기존 이미지 편집, 불투명 배경. CLI/API fallback은 사용하지 않았다.
- 편집 입력: 실제로 열어 본 `chagok-meal-scene-source.png`. 밥과 청국장을 먹는 사람과 가까운 앞쪽(안쪽)에, 구운 두부·간장·김·가지볶음을 그 너머 뒤쪽/가장자리(바깥쪽)에 재배치했다.
- 현재 밥 원본: `chagok-meal-scene-inner-source.png`(1536×1024). 기본 저장 파일 `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-51e499a7-7bc8-4499-baba-651238a2cf11.png`를 프로젝트에 복사했다. 이전 원본도 보존한다.
- 실제 결과 검토: 앞쪽 밥공기/청국장과 뒤쪽 네 반찬 그릇, 오른쪽 수저, 같은 나무 쟁반과 자연광을 확인했다. 차 사진과 앱 마크는 기존 원본을 사용한다.
- 기존 최적화 스크립트로 앱용 WebP를 생성했다(960×640 122,852B / 600×400 57,018B). 차 WebP 2개·마크 PNG 4개의 수정 전후 SHA-256은 동일하다. 음식 구성과 대체 텍스트, 홈 레이아웃은 유지한다.

### 최종 편집 프롬프트

```text
Use case: precise-object-edit
Asset type: the existing 3:2 Korean meal photograph in a tea-and-meal journal.
Input image 1: EDIT TARGET. Keep the same meal, dishes, wooden serving tray, table, lighting, camera angle and realistic photographic style.
Primary request: rearrange the existing meal into a natural diner-facing Korean place setting: the rice and cheonggukjang belong on the INNER side, closest to the person eating, while the side dishes belong on the OUTER side, farther away.
Make this visible in the photograph: bring the rice bowl and dark earthenware cheonggukjang pot into the near/front half of the tray (toward the bottom of the image, rice on the diner's left and stew on the diner's right), with natural breathing room. Move the four smaller side dishes—grilled tofu, soy sauce, roasted gim seaweed and stir-fried eggplant—to the far/back and outer sides of the tray, forming a loose arc beyond the rice and stew. Keep the food recognizable and unobscured, and leave the spoon and chopsticks neatly on the right edge within easy reach.
Preserve exactly these SIX food items: golden grilled tofu rectangles; thick Korean cheonggukjang with visible soybeans and tofu in the same dark pot; a modest normal portion of steamed rice in the same ivory bowl; a tiny dish of soy sauce; rectangular roasted gim seaweed sheets; glossy purple-skinned stir-fried eggplant. Do not add food or duplicate dishes.
Keep the whole tray, all six dishes, wooden spoon and chopsticks fully within frame, the same warm ivory ceramics, walnut wood textures, soft natural side daylight, natural contact shadows, food texture and proportions, gentle elevated three-quarter viewpoint and 3:2 landscape framing. Change the placement only as needed. No tea vessels, people, hands, text, logos or watermark. Photorealistic, opaque background.
```

## 현재 차 사진: 거름망 제거 — 2026-10-19

- 생성 도구: built-in `image_gen.imagegen`, 기존 이미지 편집, 불투명 배경. CLI/API fallback은 사용하지 않았다.
- 편집 입력: 실제로 열어 본 `chagok-tea-scene-source.png`. 공도배 위 금속 거름망과 손잡이/지지부만 제거하고 열린 유리 공도배 입구를 복원했다.
- 현재 차 원본: `chagok-tea-scene-no-strainer-source.png`(1536×1024). 기본 저장 파일 `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-87414872-eac2-408d-8d48-14d6ccdd6573.png`를 프로젝트에 복사했다. 이전 원본도 보존한다.
- 실제 결과 검토: 거름망 없는 공도배, 보이차, 자사호, 찻잔과 수반을 확인했다. 밥 사진과 헤더/PWA 마크는 이전 원본을 계속 사용한다.
- `npm run icons`로 차 사진 WebP 두 크기를 생성했다(960×640 68,034B / 600×400 31,924B). 밥 사진 WebP 2개와 마크 PNG 4개는 재생성 전후 SHA-256이 동일함을 확인했다.

### 최종 편집 프롬프트

```text
Use case: precise-object-edit
Asset type: the existing 3:2 tea photograph used in a Korean tea-and-meal journal.
Input image 1: EDIT TARGET, the current tea scene.
Primary request: remove ONLY the stainless steel tea strainer from the glass fairness pitcher. Remove its entire mesh basket, metal rim, long handle extending to the right, and small supporting loop. Naturally reconstruct the transparent glass pitcher's open top rim and neck and the background previously hidden by the strainer. The pitcher must remain a coherent open glass gong dao bei with its original pouring spout and glass handle.
Preserve all other parts as closely as possible: the same wide shallow ivory su-ban basin with moisture, the same red clay zisha teapot on the left, the ivory teacup at the front, pu-erh tea inside the cup and pitcher, and their exact size, position, shape and materials. Preserve the same framing, 3:2 dimensions, warm daylight, reflections, shadows, walnut tabletop and ivory background.
No other composition changes, no added objects, no text or watermark. Photorealistic, opaque background.
```

## 이전 차/밥 분리 원본: 차 자리와 밥상 두 장 — 2026-10-19

- 생성 도구: built-in `image_gen.imagegen`, 기존 이미지 편집, 불투명 배경. CLI/API fallback은 사용하지 않았다.
- 차 입력: 실제로 열어 본 `chagok-tea-hero-source.png`(이전 차 전용 사진). 식사 입력: 실제로 열어 본 `chagok-tea-meal-hero-natural-source.png`.
- 최종 원본: `chagok-tea-scene-source.png`, `chagok-meal-scene-source.png`(각 1536×1024). 기존 모든 원본을 보존한다.
- 기본 저장 파일(같은 `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/` 폴더): 차 `exec-cf063811-4a1a-4de7-8551-eeafad0dd774.png`, 밥 `exec-0f36712a-8388-4b1c-b1e1-55eb10ae8425.png`. 두 파일을 프로젝트에 복사했다.
- 실제 결과 검토: 차 사진의 낮고 넓은 수반, 자사호, 공도배 위 금속 거름망, 보이차가 담긴 공도배/찻잔을 확인했다. 밥 사진은 쟁반 위 구운 두부·청국장·밥·간장·김·가지볶음 6종과 수저를 각각 확인했다.
- 홈에서는 두 사진을 각각 `차 한 잔`, `밥 한 끼`로 구분한다. `npm run icons`는 차·밥 사진을 각각 960×640 / 600×400 WebP로 최적화한다. 헤더/PWA 마크는 앞서 생성한 `chagok-tea-meal-mark-natural-source.png`를 유지한다.
- 사진의 콘텐츠는 사용자 구성 요청과 생성 결과를 기준으로 한다. 수반 관련 용어는 검색으로 추가 확인했으나 외부 사진을 내려받거나 생성 입력으로 사용하지 않았다.

### 차 자리 최종 편집 프롬프트

```text
Use case: compositing
Asset type: landscape 3:2 editorial photograph for the TEA photo of a Korean tea-and-meal diary.
Input image 1: edit target and reference for the realistic zisha teapot, clear glass pitcher, ivory cup, warm wood/ivory palette and light.
Primary request: create a dedicated tea ceremony scene with a Korean su-ban water-catching basin (수반) and, ON the basin's stable flat inner support surface, a red-clay Yixing zisha teapot, a fine-mesh tea strainer, a clear glass gong dao bei fairness pitcher, and an ivory handleless teacup filled with ripe pu-erh tea.
Scene: a wide shallow warm-white ceramic su-ban basin with a softly rounded raised rim serves as the water-catching tea tray on a quiet walnut table. It must read as a low ceramic basin, not a sink or soup bowl. All the tea utensils rest securely within its broad flat interior. A little moisture on the basin floor is subtle.
Arrangement: authentic squat matte reddish-brown zisha teapot at one side with a natural fitted lid, coherent spout and single loop handle; one clear glass fairness pitcher on the other side containing transparent reddish-dark-amber ripe pu-erh tea; a recognizable small stainless-steel FINE MESH strainer seated across the pitcher rim, visibly separate, with a coherent small handle and support. One ivory teacup toward the front, visibly holding the SAME red-amber pu-erh tea. The mesh basket, glass pitcher, teapot, cup and ceramic basin should each be identifiable. No pouring or hands.
Composition: gentle elevated three-quarter view, whole basin and vessels fully inside the frame with a little breathing room. Compact clear silhouette and natural spacing for a small mobile photo. No food, no rice, no meal tray, no extra teaware. Warm soft side daylight, calm candid tea moment, tactile handmade ceramics and glass, realistic contact shadows, warm ivory background, restrained saturation.
Constraints: photorealistic, not illustration; no text, logos, watermark, people, hands, decorative flowers, distorted handles or cropped vessels.
```

### 밥상 최종 편집 프롬프트

```text
Use case: compositing
Asset type: landscape 3:2 editorial photograph for the MEAL photo of the same Korean tea-and-meal diary.
Input image 1: edit target, keep its warm wooden serving tray and table, handmade warm-white ceramics, soft natural daylight and believable Korean home-meal mood.
Primary request: a dedicated nourishing everyday Korean meal on the tray, with ALL SIX requested foods clearly recognizable: grilled tofu (구운 두부), cheonggukjang (청국장), steamed rice (밥), soy sauce (간장), roasted gim seaweed (김), and stir-fried eggplant (가지볶음). Remove the teapot and the teacup entirely.
Food details: one small plate of several golden pan-grilled tofu rectangles with natural browned faces; one modest dark earthenware ttukbaegi pot of thick tan Korean cheonggukjang fermented-soybean stew with visible whole soybeans and small tofu pieces, not clear soup; one ceramic bowl with a normal portion of steamed rice below the rim, not a tall mound; one tiny dipping dish with dark soy sauce; one small dish of stacked crisp dark-green-black rectangular roasted gim seaweed sheets, not rolls or salad; one small dish of glossy tender purple-skinned eggplant strips stir-fried Korean style. These six dishes are separate, all present and not hidden behind each other.
Composition: all six small dishes arranged as one practical, relaxed single-person Korean home meal on the same shallow walnut tray, with a wooden spoon and one pair of chopsticks resting along its edge. Modest food portions, natural spacing and accurate dish scale, slightly elevated three-quarter view so the foods can be recognized, whole tray and dishes inside the frame. Cozy wholesome impression through simple home cooking, not a nutrition diagram.
Preserve the prior image's warm ivory/walnut palette, understated soft window light and realistic textures. Match the companion tea photo's photographic mood and angle. No tea vessels, no coffee, no extra food, no people or hands, no text, no logos, no watermark, no illustration, no overly glossy artificial food, no dramatic steam or cropped dishes.
```


## 자연스러운 한 끼로 재구성 — 2026-10-19

- 이전 적용 원본: `chagok-tea-meal-hero-natural-source.png`, `chagok-tea-meal-mark-natural-source.png`. 마크는 현재도 유지한다.
- built-in `image_gen.imagegen` 편집 모드, 불투명 배경. CLI/API fallback은 사용하지 않았다.
- 편집 입력: 아래 첫 차·밥 통합 원본 `chagok-tea-meal-hero-source.png`, `chagok-tea-meal-mark-source.png`를 각각 실제로 열어 확인한 뒤 편집 대상으로 사용했다.
- 기본 저장 파일: `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-c16b1fbf-3b5c-46e8-b66e-c53cd29306cf.png` (홈), `exec-50aac6b7-b60d-4238-aaf5-7e724c327dab.png` (마크, 같은 폴더).
- 프로젝트에 두 원본을 복사했다. 이전 원본도 보존하며 `npm run icons`는 현재 natural 원본으로 WebP 2개·PNG 4개를 재생성한다.
- 검토: 홈 사진의 쟁반 위 밥·두부·채소·수저·찻잔과 자사호, 낮춰 담은 밥, 마크의 분리된 그릇과 자사호를 실제로 확인했다.

### 홈 최종 편집 프롬프트

```text
Use case: compositing
Asset type: landscape 3:2 home photo for a Korean tea-and-meal journal, readable at 170–280px wide.
Input image 1: edit target, the current staged tea-and-rice photograph.
Primary request: make the meal and tea feel naturally together in one everyday home meal, rather than four separate products arranged for a catalog.
Change the composition and portions: create one modest single-person place setting on a simple shallow wooden serving tray on the same warm wooden table. An ivory bowl holds a normal modest portion of cooked rice, sitting just below the rim with an uneven natural surface, not a large perfect dome. Beside it is a small ceramic plate with a few pieces of tofu and lightly cooked leafy greens and carrot, casually served and not piled high. A wooden spoon and one natural pair of chopsticks rest neatly along the tray edge as a practical meal setting. A small red-clay zisha teapot and a partly filled small cup of amber tea sit casually at the far corner, within reach for a quiet sip with the meal. Keep dish and teapot sizes physically realistic.
Preserve: authentic red-clay teapot with coherent handle, spout and lid; warm cream ceramic bowls, amber tea, calm warm wood and ivory palette, soft window daylight, realistic material textures.
Photography: a candid but beautiful Korean home-food editorial photograph, gentle elevated three-quarter angle, relaxed slight asymmetry, soft natural shadows, understated real everyday food, subtle handmade ceramic imperfections. A single coherent moment rather than a collage or symmetrical product lineup. Show the whole place setting and vessels without edge crops; compact enough to read at phone size with breathing room. Natural quiet background, no giant empty top band.
Avoid: overfilled rice, oversized grains, towering garnish, glossy plastic-looking food, harsh studio lighting, dramatic spotlight, contrived floating bowls, text, branding, watermarks, people, hands, extra decorative objects, illustration. Opaque background.
```

### 마크 최종 편집 프롬프트

```text
Use case: precise-object-edit
Asset type: square photographic app/header mark, clear at 44px.
Input image 1: edit target, the current rice bowl and zisha teapot mark.
Primary request: make this pair more natural in food portion, scale and placement, while retaining a simple recognizable tea-and-meal mark.
Keep the warm ivory background, the authentic matte reddish-brown zisha teapot, and one warm-white ceramic bowl of rice. Reposition them as two real objects casually set beside each other on the same surface with believable shared contact shadows, slight diagonal alignment and a small gap or only minimal overlap. Use a modest everyday rice portion with rice just below the bowl rim, an irregular natural surface and correctly sized rice grains; remove the tall perfect mound. A compact small teapot should be slightly lower than the rice bowl in apparent height and have a natural lid, one coherent handle and spout. Make both silhouettes legible and clearly separate instead of the rice bowl covering most of the teapot.
Composition: square, whole pair centered with generous quiet ivory margins; keep the pair inside the central 70 percent of width and 60 percent of height for round masks. Soft window daylight and restrained natural ceramic/clay textures, calm unforced photograph, no theatrical studio look.
Constraints: only the teapot and the rice bowl, no tray or utensils at icon size, no people, hands, text, logo, watermark, frames, cropping, cartoon or illustration. Preserve opaque warm ivory background.
```


## 차·밥 통합 이미지 — 2026-10-19

- 생성 도구: built-in `image_gen.imagegen`, 기존 이미지 편집(compositing), 불투명 배경. CLI/API fallback은 사용하지 않았다.
- 편집 입력: 아래에 보존한 이전 차 전용 원본 두 장. 각각 실제로 열어 확인한 뒤 해당 입력만 참조했다.
- 홈 원본: `chagok-tea-meal-hero-source.png` (1536×1024). 기본 저장 파일: `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-c4c4f6b9-5e77-4ddb-885e-1f0e99e86e0f.png`.
- 마크 원본: `chagok-tea-meal-mark-source.png` (1254×1254). 기본 저장 파일: `C:/Users/user1/.codex/generated_images/01a12da3-f6ad-7630-a7ae-c2410f40d714/exec-c14cb9c3-cc5b-4cac-bc13-9b55bc89a702.png`.
- 두 결과를 프로젝트에 복사하고 원본·이전 원본을 모두 보존했다. 자사호/찻잔과 밥·두부·채소가 함께 보이는 홈 사진, 자사호와 밥공기가 함께 보이는 마크를 직접 확인했다.
- `npm run icons`는 새 원본으로 기존 `public/images/chagok-tea-hero*.webp` 2개와 `public/icons/chagok-*.png` 4개를 재생성한다. 크기·포맷 변경과 maskable 안전 여백 외에 내용을 다시 그리지 않는다. 헤더·favicon·PWA·Apple 마크를 같은 이미지로 유지한다.
- 종이 양식 참고 파일 `reference/tea-diary-reference.png`는 이번 작업에서도 없음을 확인했다.

### 홈 사진 최종 편집 프롬프트

```text
Use case: compositing
Asset type: landscape home photograph for Korean tea-and-meal diary 차곡차곡, 3:2 aspect ratio.
Input image 1: edit target, the existing warm photographic tea still life.
Primary request: evolve this existing tea-only photograph into a harmonious tea AND everyday Korean meal still life, both subjects equally legible on a small phone screen.
Keep: its reddish-brown Yixing zisha teapot with coherent spout, handle and lid; a small ivory cup of amber tea; warm walnut table, parchment ivory background, realistic tactile ceramics and soft side daylight, premium quiet editorial photographic style.
Add: one clearly recognizable ivory ceramic bowl of freshly cooked rice, and one modest small plate of home-cooked food with leafy greens, carrot and tofu. The rice bowl should have similar visual importance to the teapot, so it unmistakably communicates a meal.
Composition: recompose the existing objects naturally as one compact table scene. The transparent pitcher may be omitted to keep the tea and meal subjects clear. Show the complete teapot, cup, rice bowl and small plate with room around all edges. Keep all subjects in the middle two-thirds, with some quiet space above; no giant empty top area. Natural three-quarter downward camera view. Cohesive realistic perspective, materials, contact shadows and food proportions.
Constraints: photographic, not a drawing, no text, logos, lettering, watermark, people, hands, extra decorative props, or cropped dishes. Do not add text or alter the warm calm color palette. Opaque background.
```

### 앱 마크 최종 편집 프롬프트

```text
Use case: compositing
Asset type: square photographic app/header mark for Korean tea-and-meal diary 차곡차곡, designed to remain clear at 44px.
Input image 1: edit target, the existing warm ivory zisha teapot app mark.
Primary request: add a clearly recognizable bowl of rice beside the teapot, so the mark represents BOTH tea and a meal.
Keep: the authentic reddish-brown low round Yixing teapot, matte clay surface, physically coherent handle, spout and fitted lid; uniform warm ivory background and gentle natural light; photorealistic style.
Composition: a compact balanced pair of objects: slightly smaller teapot in back and one small warm-white ceramic rice bowl forward beside it, partially overlapping but neither hiding the other's defining shape. Rice grains visibly mound above the bowl rim; use a subtly darker ceramic lower edge for contrast on ivory. Show both objects complete, center the whole pair within the central 68 percent of square width and 60 percent of square height, with generous clean margins for round icon masks. Make the rice bowl large enough to remain recognizable as a rice bowl at icon size. Two simple strong silhouettes, no side dishes or utensils.
Constraints: no text, logos, letters, watermark, frame, cartoon, vector drawing, people, hands, extra objects or cropped vessels. Match the original warm cream and red clay palette. Opaque background.
```

## 이전 차 전용 원본 — 보존 이력


생성일: 2026-10-08 (Asia/Seoul)

- 생성 모드: built-in `image_gen.imagegen` (새 이미지 생성, 불투명 배경)
- CLI/API fallback: 사용하지 않음
- 참고 이미지: 사용하지 않음. 기존 종이 일기 참고 파일의 존재나 내용을 가정하지 않음.
- 생성 원본은 변경하지 않고 이 폴더에 보존한다. 실제 앱 배포 파일은 원본을 바탕으로 크기·포맷을 조정한다.

앱 적용 파일은 `npm run icons`로 재생성한다. 홈은 960×640 / 600×400 WebP 두 크기, 앱 마크는 192×192 / 512×512 / Apple 180×180 PNG이다. maskable 512×512는 원본 전체를 80% 크기로 중앙 배치하고 10% 아이보리 안전 여백을 둔다. 도형·색상·물체를 새로 그리거나 원본을 덮어쓰지 않는다. 홈 사진과 작은 아이콘은 실제 브라우저 화면에서 별도로 검토한다.

## 홈 이미지

- 원본: `chagok-tea-hero-source.png`
- 파일 확인: PNG, 1536×1024px
- built-in 저장 경로: `C:\\Users\\user1\\.codex\\generated_images\\01a11a1d-00c5-79f1-9318-c0795ce5ba80\\exec-8a599bc8-2033-406c-ad8a-138240371646.png`
- 검토: 자사호·찻잔·투명 공도배 전체가 화면 안에 보이며 손잡이·뚜껑·주둥이 형태를 직접 확인했다. 실제 앱에서 크기와 잘림 여부를 별도로 검증한다.

최종 생성 프롬프트:

```text
Use case: photorealistic-natural
Asset type: Home hero image for a quiet Korean mobile tea journal named 차곡차곡. Produce a landscape image with approximately 3:2 aspect ratio.
Primary request: A premium contemporary editorial still-life photograph of authentic Chinese gongfu tea vessels, inviting and tactile, restrained and timeless.
Scene/backdrop: An aged walnut tabletop with subtle natural grain, a warm parchment ivory seamless quiet background. A clean uncluttered tea moment with no extra props.
Subject: One authentic low round reddish-brown Yixing zisha teapot with a short graceful spout, a single coherent loop handle and a properly seated lid; one small handleless off-white porcelain teacup holding clear deep red amber pu-erh tea; one clear glass gong dao bei fairness pitcher with a physically coherent single handle and a clean pouring lip, also holding amber tea. The three objects have realistic useful proportions and coherent physical forms.
Style/medium: High-end real editorial product photography, material realism, tiny natural handmade details, sophisticated minimal contemporary East Asian tea journal atmosphere. Absolutely not illustration or vector.
Composition/framing: All three objects fully visible, grouped in the lower-middle of the landscape frame, neither overly large nor miniature, harmonious spacing, ample clean negative space above. Eye-level three-quarter camera angle with a gentle downward view into the cup and pitcher. A photograph composed to read clearly as a small mobile hero.
Lighting/mood: Soft side daylight, gentle natural muted contact shadows, quiet warmth and calm. Restrained contrast, elegant clarity, no dramatic spotlight.
Color palette: Warm ivory near #f4ece2 and #faf5ed, clay reddish brown near #743f32, natural walnut, red amber tea. Low saturation and natural color.
Materials/textures: Unglazed fine sandy matte zisha clay, softly glossy porcelain, transparent thin glass with believable reflections, subtly textured walnut.
Text: No text anywhere.
Constraints: No logo, letters, numbers, watermarks, people, hands, cartoon, vector, decorative frame, artificial gradient, steam exaggeration, leaves, flowers or extra cups. Do not crop any vessel. Preserve recognizable authentic teapot, cup and fairness pitcher shapes.
```

## 앱 아이콘 원본

- 원본: `chagok-mark-source.png`
- 파일 확인: PNG, 1254×1254px
- built-in 저장 경로: `C:\\Users\\user1\\.codex\\generated_images\\01a11a1d-00c5-79f1-9318-c0795ce5ba80\\exec-1babe899-1fd7-453e-8db6-aac66da70357.png`
- 검토: 단독 자사호 전체와 자연스러운 형태를 직접 확인했다. 생성 결과의 가로 실루엣은 프롬프트의 중앙 60% 요구보다 크므로 maskable 배포 아이콘은 원본 자체를 안전 영역 안으로 축소하여 배치해야 한다. 실제 마스크와 작은 크기 확인은 별도 검증한다.

최종 생성 프롬프트:

```text
Use case: product-mockup
Asset type: Square source photograph for a Korean tea journal PWA app icon. Produce a square image.
Primary request: A single beautiful authentic low round Yixing red clay zisha teapot, photographed as a high-end contemporary studio still life against warm ivory.
Scene/backdrop: A clean uniform warm ivory surface and matching seamless background near #f4ece2 and #faf5ed, extremely restrained, no scenery or other props.
Subject: One authentic low round reddish-brown Yixing zisha teapot near #743f32 with a properly seated fitted lid and small rounded knob, one graceful short spout and one coherent simple loop handle. Physical form must be natural and useful with believable teapot proportions. The entire teapot including spout and handle is visible.
Style/medium: Sophisticated photorealistic product photograph, tactile fine matte unglazed clay, elegant artisan material, calm minimal East Asian tea journal mood. Absolutely not vector, cartoon or illustration.
Composition/framing: Square frame, centered teapot viewed from front three-quarter with slight downward angle. Strong recognizable silhouette at small sizes. The full teapot is contained inside the central 60 percent of both the square width and height, leaving at least 20 percent quiet ivory margin on every edge for maskable icon crops. No cropped vessel, isolated single subject.
Lighting/mood: Soft side studio daylight revealing the fine clay texture, natural subtle contact shadow only, restrained clean contrast, no dramatic spotlight.
Color palette: Warm ivory background and deep reddish clay, no bright saturated accents.
Text: No text anywhere.
Constraints: One teapot only. No cup, no pitcher, no saucer, no table scenery, no leaves, no flowers, no people or hands, no text, no letters, no numbers, no logo, no watermark, no frame, no decorative border, no artificial drop shadow, no gradients. Do not enlarge the teapot beyond the central 60 percent safety area.
```
