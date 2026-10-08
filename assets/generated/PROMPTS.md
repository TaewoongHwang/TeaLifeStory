# 차곡차곡 생성형 이미지 원본

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
