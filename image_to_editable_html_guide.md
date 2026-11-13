# 비트맵 도면 이미지의 수정 가능한 웹 표준 HTML(SVG) 변환 가이드

> **문서 버전:** 1.0.0  
> **최종 수정일:** 2026-11-13  
> **대상 시스템:** 물리 그래픽 편집 스튜디오 (`PicEditor` / `physics_master_studio`)  
> **작성 목적:** 스캔·촬영·캡처된 물리 시험지/교재 도면(BMP, PNG, JPG)을 웹 에디터 상에서 자유롭게 선택, 마우스 드래그 이동, 크기 조절, 회전, 텍스트 수정이 가능한 **무결점 독립형 HTML/SVG 도면**으로 복원 및 변환하는 표준 제작 워크플로우를 체계화함.

---

## 📋 목차
1. [개요 및 핵심 원칙](#1-개요-및-핵심-원칙)
2. [전체 변환 파이프라인 워크플로우](#2-전체-변환-파이프라인-워크플로우)
3. [[1단계] 원본 이미지 전처리 및 기하학적 분석](#3-1단계-원본-이미지-전처리-및-기하학적-분석)
4. [[2단계] PicEditor 호환 HTML/SVG 표준 구조 설계](#4-2단계-piceditor-호환-htmlsvg-표준-구조-설계)
5. [[3단계] 객체별 정밀 작도 및 인라인 스타일 규칙](#5-3단계-객체별-정밀-작도-및-인라인-스타일-규칙)
6. [[4단계] 실제 복원 사례: 평행판 축전기 금속판 삽입 도면](#6-4단계-실제-복원-사례-평행판-축전기-금속판-삽입-도면)
7. [[5단계] 썸네일 생성, 갤러리 등록 및 배포](#7-5단계-썸네일-생성-갤러리-등록-및-배포)
8. [주요 트러블슈팅 및 방어 설계](#8-주요-트러블슈팅-및-방어-설계)

---

## 1. 개요 및 핵심 원칙

종이 시험지나 교재에 인쇄된 비트맵 도면(JPG, PNG, BMP 등)은 픽셀 단위로 굳어져 있어 텍스트 수정, 선 굵기 조절, 요소 이동 등의 재편집이 불가능합니다.  
본 가이드는 이러한 비트맵 이미지를 브라우저의 DOM 엔진과 벡터 그래픽(SVG)을 활용하여 **각 선, 도형, 글자가 모두 살아있는 독립형 HTML 파일**로 복원하는 표준 방법론을 정의합니다.

### 🌟 4대 핵심 제작 원칙
1. **100% 순수 벡터화 (Zero Bitmap):**  
   비트맵 `<image>` 태그 래핑을 일절 배제하고, 모든 요소를 `<line>`, `<rect>`, `<circle>`, `<polygon>`, `<path>`, `<text>`로 정밀 작도합니다.
2. **에디터 상호작용성 (Full Interactivity):**  
   모든 개별 그래픽 요소에 `class="movable"`과 초기 `transform`을 부여하여, PicEditor 로드 시 마우스로 클릭하여 선택·이동·변형할 수 있도록 만듭니다.
3. **인라인 스타일 완전성 (Self-Contained Styling):**  
   외부 CSS나 `<style>` 클래스 선언에만 의존하지 않고, 태그 자체에 `stroke`, `fill`, `stroke-width`, `font-family`를 직접 명시하여 어떤 뷰어나 에디터 환경에서도 깨짐이 없도록 합니다.
4. **텍스트-배경 밀착 핏팅 구조 (Text Layering):**  
   텍스트 요소는 `<g class="movable text-wrap">`으로 감싸고 내부에 `<rect class="text-bg-rect">`를 함께 배치하여, 글자 뒤편의 복잡한 선들을 깔끔하게 가리고 글자 수정 시에도 배경 박스가 유연하게 늘어나도록 설계합니다.

---

## 2. 전체 변환 파이프라인 워크플로우

```
[비트맵 도면 이미지 (BMP, PNG, JPG)]
                 │
                 ▼
 [1단계: 스캔 및 물리 요소 정밀 분석]
   - 해상도/비율 파악 (viewBox 결정)
   - 선 종류(실선, 파선, 쇄선) 및 연결 위상 분석
   - 외국어 기호 → 한국어 표준 물리 용어 매핑
                 │
                 ▼
 [2단계: PicEditor 표준 HTML/SVG 골격 생성]
   - 순백색 캔버스 배경 (#FFFFFF)
   - 화살표/패턴 defs 정의
   - main-diagram (도형) / text-layer (문자) 레이어 분리
                 │
                 ▼
 [3단계: 인라인 벡터 요소 코딩 (1:1 정밀 작도)]
   - 인라인 속성 (fill, stroke, stroke-width) 직접 명시
   - movable 클래스 및 transform="translate(0,0)..." 부여
   - 수식 이탤릭 / 기호 로만 / 한글 고딕 폰트 지정
                 │
                 ▼
 [4단계: 헤드리스 브라우저 검증 및 렌더링 테스트]
   - Chrome Headless로 실제 DOM/SVG 렌더링 검증
   - 렌더링 결함(검정 채우기, 선 투명화 등) 즉시 보정
                 │
                 ▼
 [5단계: 썸네일 PNG 추출 & 갤러리(manifest.json) 등록]
   - 400px 비율 유지 썸네일 생성
   - saved/ 폴더 저장 및 manifest.json 최상단 추가
   - PicEditor 보관함에서 원클릭 로드 및 즉시 편집 가능
```

---

## 3. [1단계] 원본 이미지 전처리 및 기하학적 분석

### 3.1 이미지 디코딩 및 비율 결정
1. 원본 이미지의 크기를 확인합니다. (예: `1040 × 773`)
2. 도면의 복잡도와 여백을 고려하여 SVG의 `viewBox` 좌표계를 결정합니다. 여백을 약간 포함한 `viewBox="0 0 1040 820"`과 같은 정수 좌표계로 설정합니다.

### 3.2 선의 종류 및 위상(Topology) 파악
물리 도면에서는 선의 스타일에 따라 물리학적 의미가 완전히 달라집니다:
* **실선 (Solid Line):** 극판, 도선, 장치 외곽선, 바닥면, 좌표축, 치수 보조선.
* **파선 (Dashed Line):** 전하/입자의 이동 궤적, 물체 뒤에 가려진 은선 (`stroke-dasharray="4,4"` 또는 `"6,4"`).
* **일점쇄선 (Dash-dot Line):** 대칭축, 중심축 (`stroke-dasharray="12,4,2,4"`).
* **도트 패턴 (Stipple Pattern):** 도체/유전체/금속판의 단면 또는 표면 질감 표현.

### 3.3 용어 및 문자 로컬라이징 사전 매핑
외국어(일본어/영어)로 작성된 시험지 도면은 한국 물리 교육과정 표준 용어로 즉시 치환합니다:
* `金属板` $\rightarrow$ **금속판**
* `天井` $\rightarrow$ **천장** / `地面` $\rightarrow$ **지면**
* `部分 Ⅰ`, `部分 Ⅱ` $\rightarrow$ **부분 Ⅰ**, **부분 Ⅱ**
* `図 1`, `図 2` $\rightarrow$ **그림 1**, **그림 2**
* 물리 변수($V, d, \ell, w, L, X, c, b$ 등)는 표준 수식 폰트(`Times New Roman, italic`)로 보존합니다.

---

## 4. [2단계] PicEditor 호환 HTML/SVG 표준 구조 설계

PicEditor는 브라우저 기반의 반응형 캔버스를 사용하므로, 저장되는 HTML 파일은 아래의 표준 구조를 반드시 준수해야 합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>diagram_YYYYMMDDHHMMSS</title>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" id="svg-editor" viewBox="0 0 [W] [H]" class="select-mode" width="100%" height="100%">
  <!-- 1. 배경 사각형 (캔버스 바탕색 유지) -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>

  <!-- 2. 공통 정의 (화살표 마커, 패턴 등) -->
  <defs>
    <!-- 날렵한 양방향/단방향 치수 화살표 -->
    <marker id="arrow-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 1.5 L 9 5 L 0 8.5 Z" fill="#000000"/>
    </marker>
    <marker id="arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 9 1.5 L 0 5 L 9 8.5 Z" fill="#000000"/>
    </marker>
    <marker id="arrow-dim-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 9 2 L 1 5 L 9 8 Z" fill="#000000"/>
    </marker>
    <marker id="arrow-dim-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 2 L 9 5 L 1 8 Z" fill="#000000"/>
    </marker>
  </defs>

  <!-- 3. 메인 그래픽 레이어 (도형, 선, 회로) -->
  <g class="main-diagram">
    <!-- 개별 movable 요소들이 배치됨 -->
  </g>

  <!-- 4. 텍스트 레이어 (글자 및 배경 박스) -->
  <g class="text-layer">
    <!-- 개별 movable text-wrap 요소들이 배치됨 -->
  </g>
</svg>
</body>
</html>
```

---

## 5. [3단계] 객체별 정밀 작도 및 인라인 스타일 규칙

### 5.1 인라인 프레젠테이션 속성 필수 규칙 (★ 매우 중요)
에디터가 HTML/SVG를 동적으로 파싱하여 주입할 때 `<style>` 태그가 누락되거나 클래스 상속이 끊어질 수 있습니다.  
따라서 **모든 그래픽 요소에는 아래 인라인 속성을 반드시 직접 기입**합니다:

| 요소 타입 | 필수 인라인 속성 | 기본값 예시 | 이유 |
| :--- | :--- | :--- | :--- |
| `<path>` (열린 선, 바닥면 등) | `fill="none"` `stroke="#000000"` `stroke-width="..."` | `fill="none" stroke="#000000" stroke-width="2.5"` | `fill` 미지정 시 SVG 기본값으로 인해 **면 전체가 검은색으로 채워지는 치명적 결함 방지** |
| `<line>` (도선, 극판, 치수선) | `fill="none"` `stroke="#000000"` `stroke-width="..."` | `fill="none" stroke="#000000" stroke-width="2.0"` | `stroke` 미지정 시 **선이 투명해져 보이지 않는 결함 방지** |
| `<polygon>`, `<rect>` (닫힌 면) | `fill="..."` `stroke="#000000"` `stroke-width="..."` | `fill="#FFFFFF" stroke="#000000" stroke-width="2.0"` | 도면의 앞뒤 겹침(Occlusion)을 올바르게 차폐 |
| `<circle>` (단자, 질점) | `fill="#000000"` `stroke="none"` | `fill="#000000" stroke="none"` | 깨끗한 솔리드 접속점 표현 |

### 5.2 에디터 이동 및 조작을 위한 `class` 및 `transform` 부여
모든 개별 선과 도형 태그는 PicEditor의 마우스 인터랙션 엔진([interaction.js](file:///e:/Git/PicEditor/js/interaction.js))과 반응해야 합니다:
```html
<line class="movable" x1="208" y1="465" x2="618" y2="465" fill="none" stroke="#000000" stroke-width="2.8"/>
<rect class="movable" x="140" y="489" width="263" height="64" fill="#E5E5E5" stroke="#000000" stroke-width="2.0"/>
```

### 5.3 텍스트 래퍼(`text-wrap`) 구성 표준
텍스트는 글자 뒤로 지나가는 도선이나 격자를 가려주는 **배경 박스(`<rect class="text-bg-rect">`)**와 함께 그룹으로 구성합니다:
```html
<g class="movable text-wrap" transform="translate(0,0)">
  <!-- PicEditor의 updateAllTextBgBoxes()가 실행되면 BBox에 맞게 x, y, width, height가 자동 연산됨 -->
  <rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none" stroke-width="0"/>
  <text class="text-el" x="413" y="446" fill="#000000" font-family="'Times New Roman', serif" font-style="italic" font-size="20" text-anchor="middle">ℓ</text>
</g>
```

#### 타이포그래피 규칙
* **물리 알파벳/변수:** `font-family="'Times New Roman', serif" font-style="italic"` ($V, d, \ell, w, L, X, c, b$ 등)
* **단자 및 지점 명칭:** `font-family="'Times New Roman', serif" font-weight="normal"` (A, B 등)
* **한국어 텍스트 및 캡션:** `font-family="'KoPubWorld Dotum', 'Malgun Gothic', 'Noto Sans KR', sans-serif"` (금속판, 부분 Ⅰ, 부분 Ⅱ, 그림 1 등)

---

## 6. [4단계] 실제 복원 사례: 평행판 축전기 금속판 삽입 도면

아래는 실제로 `20261030_105854.bmp` 이미지를 PicEditor 표준 HTML로 1:1 정밀 복원한 전체 코드 구조입니다.  
([diagram_20261030111800.html](file:///e:/Git/PicEditor/saved/diagram_20261030111800.html))

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>diagram_20261030111800</title>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" id="svg-editor" viewBox="0 0 1040 820" class="select-mode" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <defs>
    <marker id="arrow-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 1.5 L 9 5 L 0 8.5 Z" fill="#000000"/>
    </marker>
    <marker id="arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 9 1.5 L 0 5 L 9 8.5 Z" fill="#000000"/>
    </marker>
    <marker id="arrow-dim-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 9 2 L 1 5 L 9 8 Z" fill="#000000"/>
    </marker>
    <marker id="arrow-dim-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 2 L 9 5 L 1 8 Z" fill="#000000"/>
    </marker>
    <pattern id="stipple" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="0.6" fill="#666666"/>
    </pattern>
  </defs>

  <!-- ========================================== -->
  <!-- 1. 메인 다이어그램 레이어 (도형 및 선)    -->
  <!-- ========================================== -->
  <g class="main-diagram" id="fig-all">
    <!-- [그림 1] 바닥면 (fill="none" 필수) -->
    <path class="movable" d="M 305 175 L 55 345 L 770 345 L 1015 175" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- [그림 1] 후면 극판 B -->
    <polygon class="movable" points="436,97 676,97 676,261 436,261" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>

    <!-- [그림 1] 금속판 (3D 블록 윗면 및 좌측면) -->
    <polygon class="movable" points="342,125 363,106 521,106 500,125" fill="#EAEAEA" stroke="#000000" stroke-width="1.8"/>
    <polygon class="movable" points="342,125 363,106 521,106 500,125" fill="url(#stipple)" stroke="#000000" stroke-width="1.8"/>
    <polygon class="movable" points="342,125 363,106 363,270 342,289" fill="#E0E0E0" stroke="#000000" stroke-width="1.8"/>
    <polygon class="movable" points="342,125 363,106 363,270 342,289" fill="url(#stipple)" stroke="#000000" stroke-width="1.8"/>

    <!-- [그림 1] 전면 극판 A -->
    <rect class="movable" x="388" y="142" width="240" height="164" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>

    <!-- [그림 1] 회로 배선 및 전원 V -->
    <circle class="movable" cx="635" cy="115" r="3.5" fill="#000000" stroke="none"/>
    <line class="movable" x1="635" y1="115" x2="676" y2="90" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="4,4"/>
    <line class="movable" x1="676" y1="90" x2="745" y2="90" fill="none" stroke="#000000" stroke-width="1.4"/>
    <line class="movable" x1="745" y1="80" x2="745" y2="100" fill="none" stroke="#000000" stroke-width="3.8" stroke-linecap="square"/>
    <line class="movable" x1="757" y1="70" x2="757" y2="110" fill="none" stroke="#000000" stroke-width="1.6" stroke-linecap="square"/>
    <line class="movable" x1="757" y1="90" x2="855" y2="90" fill="none" stroke="#000000" stroke-width="1.4"/>
    <line class="movable" x1="855" y1="90" x2="730" y2="180" fill="none" stroke="#000000" stroke-width="1.4"/>
    <circle class="movable" cx="590" cy="160" r="3.5" fill="#000000" stroke="none"/>
    <line class="movable" x1="590" y1="160" x2="565" y2="180" fill="none" stroke="#000000" stroke-width="1.4"/>
    <line class="movable" x1="565" y1="180" x2="730" y2="180" fill="none" stroke="#000000" stroke-width="1.4"/>

    <!-- [그림 2] 상단 극판 B / 하단 극판 A -->
    <line class="movable" x1="208" y1="465" x2="618" y2="465" fill="none" stroke="#000000" stroke-width="2.8"/>
    <line class="movable" x1="208" y1="593" x2="618" y2="593" fill="none" stroke="#000000" stroke-width="2.8"/>

    <!-- [그림 2] 금속판 단면 -->
    <rect class="movable" x="140" y="489" width="263" height="64" fill="#E5E5E5" stroke="#000000" stroke-width="2.0"/>

    <!-- [그림 2] 치수선 및 화살표 -->
    <line class="movable" x1="214" y1="447" x2="612" y2="447" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="430" y1="495" x2="430" y2="547" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="430" y1="559" x2="430" y2="587" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="515" y1="471" x2="515" y2="587" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="146" y1="612" x2="397" y2="612" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="214" y1="638" x2="397" y2="638" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="214" y1="684" x2="397" y2="684" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>
    <line class="movable" x1="409" y1="684" x2="612" y2="684" fill="none" stroke="#000000" stroke-width="1.2" marker-start="url(#arrow-dim-start)" marker-end="url(#arrow-dim-end)"/>

    <!-- [그림 2] 직교 좌표계 -->
    <line class="movable" x1="812" y1="593" x2="900" y2="593" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow-end)"/>
    <line class="movable" x1="812" y1="593" x2="812" y2="505" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow-end)"/>
  </g>

  <!-- ========================================== -->
  <!-- 2. 텍스트 레이어 (개별 편집 가능)          -->
  <!-- ========================================== -->
  <g class="text-layer">
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="608" y="290" fill="#000000" font-family="'Times New Roman', serif" font-size="22" text-anchor="middle">A</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="656" y="238" fill="#000000" font-family="'Times New Roman', serif" font-size="22" text-anchor="middle">B</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="556" y="74" fill="#000000" font-family="'Times New Roman', serif" font-style="italic" font-size="20" text-anchor="middle">ℓ</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="255" y="95" fill="#000000" font-family="'KoPubWorld Dotum', sans-serif" font-size="18" text-anchor="middle">금속판</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="510" y="395" fill="#000000" font-family="'KoPubWorld Dotum', sans-serif" font-weight="bold" font-size="20" text-anchor="middle">그림 1</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="305.5" y="715" fill="#000000" font-family="'KoPubWorld Dotum', sans-serif" font-size="18" text-anchor="middle">부분 Ⅱ</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="510.5" y="715" fill="#000000" font-family="'KoPubWorld Dotum', sans-serif" font-size="18" text-anchor="middle">부분 Ⅰ</text></g>
    <g class="movable text-wrap" transform="translate(0,0)"><rect class="text-bg-rect" rx="2" fill="#ffffff" stroke="none"/><text class="text-el" x="510" y="770" fill="#000000" font-family="'KoPubWorld Dotum', sans-serif" font-weight="bold" font-size="20" text-anchor="middle">그림 2</text></g>
  </g>
</svg>
</body>
</html>
```

---

## 7. [5단계] 썸네일 생성, 갤러리 등록 및 배포

제작된 `.html` 파일이 PicEditor의 보관함 및 갤러리 시스템에 즉시 나타나게 하려면 아래 3가지 후속 조치를 자동화 파이프라인으로 수행합니다:

### 7.1 헤드리스 브라우저를 통한 썸네일 PNG 생성 (자동화 스크립트)
```python
import os, subprocess
from PIL import Image

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
html_path = os.path.abspath(r"saved/diagram_20261030111800.html")
raw_png = os.path.abspath(r"saved/temp_capture.png")
thumb_png = os.path.abspath(r"saved/diagram_20261030111800.png")

# 1. HTML을 헤드리스 크롬으로 고해상도 캡처
subprocess.run([
    chrome, "--headless=new", "--disable-gpu",
    "--window-size=1040,820", f"--screenshot={raw_png}",
    f"file:///{html_path.replace(os.sep, '/')}"
], check=True)

# 2. 가로 400px 기준으로 가로세로 비율 유지 리사이즈 (LANCZOS 필터)
img = Image.open(raw_png)
orig_w, orig_h = img.size
thumb_w = 400
thumb_h = int(orig_h * (thumb_w / orig_w))
thumb = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
thumb.save(thumb_png)
os.remove(raw_png)
```

### 7.2 `saved/manifest.json` 등록
갤러리 모달이 원격 API 호출 없이도 로컬 및 오프라인에서 즉시 최신 도면을 인지할 수 있도록 `saved/manifest.json`의 **맨 앞(index 0)**에 메타데이터를 추가합니다:
```json
[
  {
    "name": "diagram_20261030111800",
    "filename": "diagram_20261030111800.html",
    "thumb": "diagram_20261030111800.png",
    "width": 400,
    "height": 315
  },
  ...
]
```

### 7.3 사용자 다운로드 폴더 자동 배치
사용자가 수동 다운로드나 복사-붙여넣기를 하지 않아도 되도록, 생성 즉시 OS의 기본 다운로드 폴더(`C:\Users\ADMIN\Downloads`)에 동기화 복사합니다.

---

## 8. 주요 트러블슈팅 및 방어 설계

### 🚨 트러블슈팅 1: 외부 SVG 로드 시 바닥면이 검게 채워지거나 선이 사라지는 현상
* **발생 원인:**
  1. SVG 표준 명세상 `<path>`의 `fill` 속성 기본값은 `black`(`#000000`)입니다. 따라서 CSS 클래스로만 `fill: none`을 선언해 둔 경우, 에디터 파서가 클래스를 해석하지 못하면 바닥면 전체가 검은색 다각형으로 칠해집니다.
  2. 마찬가지로 `<line>`의 `stroke` 속성 기본값은 `none`(투명)입니다. CSS 클래스가 끊어지면 모든 선이 투명해지고 마커(화살표 머리)만 둥둥 떠다니게 됩니다.
* **해결책:**
  1. **도면 코드 자체:** 모든 열린 경로와 선에 `fill="none"` 및 `stroke="#000000"`을 직접 인라인 속성으로 부여합니다.
  2. **에디터 파서 보완 (`export-import.js`):** 외부 SVG를 가져올 때 원본의 `<style>` 태그를 누락하지 않고 캔버스의 `<defs>` 또는 활성 SVG 내부로 자동 복제하도록 엔진을 패치했습니다:
     ```javascript
     // js/export-import.js
     const importedStyles = importedSvg.querySelectorAll('style');
     importedStyles.forEach(s => {
       activeSvg.appendChild(s.cloneNode(true));
     });
     ```

### 🚨 트러블슈팅 2: 텍스트 수정 시 배경 흰색 박스가 깨지거나 어긋나는 현상
* **발생 원인:**
  사용자가 에디터에서 글자 내용을 바꾸거나 폰트 크기/이탤릭을 변경할 때, 글자의 가로 폭이 바뀌지만 뒤쪽 배경 사각형의 `width`가 갱신되지 않아 글자가 박스 바깥으로 삐져나오는 문제가 발생할 수 있습니다.
* **해결책:**
  PicEditor의 `window.PicEditor.canvas.updateAllTextBgBoxes()` 함수는 SVG DOM의 `getBBox()`를 호출하여 실제 렌더링된 텍스트의 바운딩 박스를 계산한 후, `<rect class="text-bg-rect">`의 `x, y, width, height`를 패딩(좌우 4px, 상하 2px)과 함께 실시간으로 자동 재계산합니다. HTML을 생성할 때는 초기 `x, y`를 주지 않고 빈 `rect`만 넣어두어도 에디터 로드 시 0.1초 내에 완벽 밀착 피팅됩니다.

---

## 📌 요약 및 체크리스트

새로운 비트맵 도면을 수정 가능한 HTML로 변환할 때는 항상 다음 체크리스트를 확인하십시오:

- [ ] **배경 사각형:** `<rect width="100%" height="100%" fill="#FFFFFF"/>` 포함 여부
- [ ] **인라인 프레젠테이션:** 모든 `<path>`, `<line>`에 `fill="none"`과 `stroke="#000000"`이 직접 적혀 있는가?
- [ ] **모바일/에디터 조작성:** 움직여야 할 모든 도형에 `class="movable"`이 지정되어 있는가?
- [ ] **텍스트 레이어:** `<g class="text-layer">` 내부에 `<g class="movable text-wrap">` 구조로 글자와 `text-bg-rect`가 묶여 있는가?
- [ ] **용어 검수:** 일본어/외국어 잔재 없이 한국어 표준 물리 용어로 번역되었는가?
- [ ] **수식 폰트:** 물리 변수는 `Times New Roman` 이탤릭, 지점 기호는 정자체로 구분되었는가?
- [ ] **갤러리 연동:** 가로 400px 썸네일 PNG 생성 및 `manifest.json` 등록이 완료되었는가?
