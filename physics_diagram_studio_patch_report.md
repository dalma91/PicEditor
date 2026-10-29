# 🛠️ 물리 그래픽 편집 스튜디오(PicEditor) 패치 및 수정 보고서
> **문서명:** `physics_diagram_studio_patch_report.md`  
> **최초 작성일:** 2026년 10월 28일  
> **최종 갱신일:** 2026년 10월 28일 (실시간 갱신 진행 중)  
> **프로젝트:** [PicEditor (물리 그래픽 편집 스튜디오)](https://dalma91.github.io/PicEditor/)  
> **저장소:** `https://github.com/dalma91/PicEditor`

---

## 📋 개요 (Overview)

본 문서는 **PicEditor(물리 그래픽 편집 스튜디오)** 운영 및 배포 과정에서 발생하는 모든 버그 수정(Bugfix), 성능 최적화, 기능 개선(Patch), 릴리즈 변경 사항을 체계적으로 기록하고 관리하는 공식 수정 보고서입니다.  
앞으로 추가되는 모든 수정 사항은 본 보고서에 버전 및 커밋 정보와 함께 지속적으로 누적 업데이트됩니다.

---

## 📌 패치 및 수정 히스토리 요약

| 패치 ID | 날짜 | 커밋 SHA | 주요 수정 내역 | 상태 |
| :--- | :--- | :--- | :--- | :---: |
| **PATCH-006** | 2026-10-29 | `진행 중` | **호(Arc) 작도 방식 전면 개편: 시점-종점 중점 원의 중심(붉은 점) 표시, 드래그 곡률 제어 및 조건부 노출 핸들 구현**<br>- 호 시점($P_1$)-종점($P_2$)의 중점을 원의 중심($C$)으로 초기화하고 붉은색 조작 핸들(`🔴`) 표시<br>- 붉은 중심점을 마우스로 실시간 드래그하여 원의 중심 위치 및 반지름($R$), 볼록 방향을 360° 자유롭게 조정<br>- 선택 해제(`deselectAll`) 및 다른 객체(선, 글자, 그림) 선택 시 붉은 중심점 자동 은닉<br>- 호 재선택 시 저장된 원의 중심 좌표로 붉은 점 즉시 재노출<br>- 내보내기/저장/다운로드(GitHub, HTML, PNG) 시 에디터 조작용 기즈모 100% 완전 분리 및 배제 | ✅ 완료 |
| **PATCH-005** | 2026-10-29 | `83ea488` | **우측 브라우저 버튼 높이 비정상 확장 버그 긴급 해결 및 100vh 뷰포트 고정 레이아웃 개편**<br>- 전역 `svg` 선택자의 버튼 아이콘 침범 결함 분리 (`#svg-editor` 전용화 및 `.btn-icon` 14px 고정 격리)<br>- 사이드바 버튼 높이 30px 규격 고정 (`height: 30px; line-height: 1;`)<br>- 데스크톱 뷰포트 100vh 고정(`overflow: hidden`) 및 메인 캔버스 가변 높이 자동 피팅<br>- 사이드바 독립 스크롤 분리로 이중 스크롤 완벽 제거 | ✅ 완료 |
| **PATCH-004** | 2026-10-28 | `d62c3eb` | **실시간 동기화 상태 표시등, 로컬 자동백업, 콤팩트 SVG 아이콘 UI, 100% 슬라이더 중앙 정렬**<br>- 캔버스 상단 동기화 상태 뱃지(저장됨/수정됨/동기화중/오류) 탑재<br>- 미저장 작업 로컬 자동백업(Auto-Save) 및 원클릭 복구 지원<br>- 버튼 크기 슬림화 및 직관적인 인라인 SVG 벡터 아이콘 적용 (2열 그리드 배치)<br>- 글자 크기 슬라이더 100% 정중앙 위치 및 시각 눈금 틱 라벨 구현<br>- 원클릭 로컬 HTML 파일 즉시 다운로드 기능 추가 | ✅ 완료 |
| **PATCH-003** | 2026-10-28 | `9376987` | **깃허브 저장 후 재로딩 시 이전 파일 반환 및 썸네일 불변 버그 해결**<br>- Fastly CDN 300초 캐시 우회 (GitHub Contents API 0초 직접 수신)<br>- 썸네일 Git SHA 캐시 버스터 적용 및 57개 전수 고해상도 벡터 PNG 갱신<br>- 한글 파일명 URL 인코딩 (`encodeApiPath`) 및 기존 도면 덮어쓰기 상태 추적 | ✅ 완료 |
| **PATCH-002** | 2026-10-28 | `dc1cb5b` | **성균관대 물리 심층면접 모의 문항 57종 100% 완전 벡터화**<br>- 비트맵(`<image>`) 잔재 전면 제거 및 순수 SVG 구조화<br>- 50여 종 일본어 물리 용어 표준 한국어 물리 용어로 전수 번역 치환 | ✅ 완료 |
| **PATCH-001** | 2026-10-28 | `fa0739e` | **GitHub REST API 연동 및 시각적 썸네일 보관함 갤러리 구현**<br>- 캔버스 도면 및 썸네일 원클릭 GitHub 자동 커밋<br>- 썸네일 그리드 갤러리 모달 및 실시간 키워드 검색 엔진 탑재 | ✅ 완료 |

---

## 🔍 [PATCH-003] 깃허브 저장/재로딩 캐시 우회 및 썸네일 실시간 동기화

### 1. 이슈 개요 및 사용자 보고
- **보고 일시:** 2026-10-28 19:50 KST
- **사용자 보고 내용:**
  > *"깃허브에 저장하고 다시 불러오면 저장된 파일이 아닌 원래 파일이 불러와져. 이게 무슨 일이야? 썸네일도 안바뀌고?!!!"*
- **핵심 문제점:**
  1. 캔버스에서 도면을 수정한 후 [☁️ 깃허브에 저장]을 눌러 성공 알림을 받았으나, 보관함에서 다시 불러오면 방금 수정한 내용이 아닌 **수정 전의 원본 파일**이 캔버스에 로드됨.
  2. 보관함 갤러리 목록의 **썸네일 이미지가 변경되지 않고 이전 모습 그대로** 유지됨.

---

### 2. 근본 원인 분석 (Root Cause Analysis)

#### 원인 ① : Fastly CDN 및 브라우저 디스크 캐시 (300초 지연)
- 깃허브 보관함에서 도면을 불러올 때 사용하던 URL(`item.download_url`)이 `https://raw.githubusercontent.com/...` 주소였습니다.
- `raw.githubusercontent.com`은 Fastly CDN을 거치며 `Cache-Control: max-age=300`(5분) 헤더를 강제합니다.
- 따라서 사용자가 깃허브에 새 버전을 정상적으로 커밋했더라도, **커밋 후 5분 동안은 Fastly CDN 엣지 서버와 브라우저 로컬 캐시가 5분 전의 이전 파일을 그대로 반환**했습니다.

#### 원인 ② : 브라우저 이미지 메모리 캐시로 인한 썸네일 불변
- 갤러리 카드 렌더링 시 `img.src = item.thumb_url`로 이미지를 바인딩하고 있었으나, URL 뒤에 아무런 버전 파라미터가 없었습니다.
- 브라우저는 URL이 동일하면 네트워크 요청 자체를 생략하고 메모리 캐시에 있던 이전 썸네일 이미지를 화면에 계속 표시했습니다.

#### 원인 ③ : 이전 57개 도면 벡터화 당시 썸네일 PNG 미갱신
- 앞선 작업에서 57개 HTML 코드는 100% 순수 SVG 벡터로 교체 완료했으나, `saved/*.png` 썸네일 이미지들은 최초 비트맵 시절 캡처된 상태 그대로 방치되어 있었습니다.

#### 원인 ④ : 한글 파일명 URL 인코딩 부재로 인한 422 에러 (저장 실패)
- `성대0001_역학_경사면과_원궤도_운동.html`과 같은 한글 파일명을 GitHub API URL 경로에 직접 조합하여 요청할 때 인코딩이 누락되었습니다.
- 이로 인해 기존 파일의 SHA 조회가 실패(`null` 반환)하였고, 기존 파일에 SHA 없이 PUT 요청을 보내면 GitHub API가 `422 Unprocessable Entity` ("sha is required to update an existing file") 오류로 요청을 거부했습니다.

#### 원인 ⑤ : 에디터 상태 미추적으로 인한 파일명 초기화
- 보관함에서 도면을 로드했을 때 현재 작업 중인 도면명이 전역 상태에 보존되지 않았습니다.
- 그 결과 [☁️ 깃허브에 저장] 창을 열 때마다 파일명이 `diagram_YYYYMMDDHHMMSS`로 자동 리셋되어, 사용자가 기존 이름을 기억하여 직접 다시 입력하지 않으면 다른 이름의 파일로 저장되었습니다.

---

### 3. 기술적 해결 조치 (Technical Implementation)

#### ① GitHub Contents REST API 직접 호출 파이프라인 구축 (0초 지연 실시간 로드)
- [js/github.js](file:///E:/Git/PicEditor/js/github.js)의 `selectDiagramItem(item)` 로직 개편:
  - 1순위로 GitHub REST API의 contents 엔드포인트(`https://api.github.com/repos/{owner}/{repo}/contents/{folder}/{filename}?ref={branch}&_t={timestamp}`)를 직접 호출.
  - Git 데이터베이스로부터 **실시간 Base64 인코딩 원문**을 수신하여 UTF-8로 디코딩함으로써 **CDN 캐시 딜레이를 0초로 단축**.
  - 2순위(폴백) 페치 시에도 `cache: 'no-store'` 및 `Cache-Control: no-cache, no-store, must-revalidate` 헤더를 강제 적용.

```javascript
// 실시간 0초 지연 GitHub Contents API 직접 조회
const filePath = `${cfg.folder}/${item.filename}`;
const encodedFilePath = this.encodeApiPath(filePath);
const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedFilePath}?ref=${encodeURIComponent(cfg.branch)}&_t=${Date.now()}`;
const apiRes = await fetch(apiUrl, {
  headers: this.getHeaders(cfg.token),
  cache: 'no-store'
});
if (apiRes.ok) {
  const fileData = await apiRes.json();
  if (fileData.content && fileData.encoding === 'base64') {
    htmlCode = this.base64ToUtf8(fileData.content);
    window.PicEditor.state.currentDiagramSha = fileData.sha || null;
  }
}
```

#### ② Git Commit SHA 기반 썸네일 캐시 버스터 적용
- 갤러리 카드 렌더링 시 이미지 URL 뒤에 해당 파일의 최신 Git SHA(또는 타임스탬프)를 쿼리스트링으로 강제 부여:
  ```javascript
  const vTag = item.thumb_sha || item.sha || Date.now();
  const sep = item.thumb_url.includes('?') ? '&' : '?';
  img.src = `${item.thumb_url}${sep}v=${vTag}`;
  ```
- 깃허브에 도면이나 썸네일이 새로 저장되면 SHA가 바뀌므로 브라우저가 즉시 새로운 썸네일을 네트워크에서 페치하여 표시합니다.

#### ③ Chrome Headless 기반 57종 전수 순수 벡터 썸네일 재생성
- [scratch/render_all_thumbnails.py](file:///E:/Git/PicEditor/scratch/render_all_thumbnails.py) 자동화 스크립트 작성 및 구동:
  - 57개 순수 SVG HTML 도면 전체를 Chrome Headless 모드로 렌더링.
  - 가로 400px 비례 고해상도 PNG 썸네일 57종 전수 재생성 및 [saved/](file:///E:/Git/PicEditor/saved/) 디렉터리 동기화.
  - [saved/manifest.json](file:///E:/Git/PicEditor/saved/manifest.json)의 도면별 정확한 가로/세로 크기 및 메타데이터 일괄 갱신.

#### ④ 세그먼트별 URL 인코딩 함수 구현 (`encodeApiPath`)
- 한글 및 공백, 특수문자가 포함된 경로를 안전하게 GitHub REST API 규격에 맞춰 인코딩:
  ```javascript
  encodeApiPath(path) {
    if (!path) return '';
    return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  }
  ```
- 기존 파일이 있을 경우 정확한 SHA를 조회하여 PUT 요청 본문에 전달함으로써 `422 Unprocessable Entity` 에러 원천 차단.

#### ⑤ 현재 도면명 상태 추적 및 원클릭 덮어쓰기 모드 구축
- [js/state.js](file:///E:/Git/PicEditor/js/state.js)에 `currentDiagramName`, `currentDiagramSha`, `currentThumbSha` 상태 추가.
- [js/export-import.js](file:///E:/Git/PicEditor/js/export-import.js) 및 갤러리 로더에서 도면 로드 시 현재 도면명을 전역 상태에 보존.
- [☁️ 깃허브에 저장] 모달 실행 시 현재 도면명이 기본값으로 자동 입력되며, 상단에 **`[📌 기존 도면 수정 모드]`** 안내 배너 표시.
- 저장 시 원본 HTML 파일, 썸네일 PNG, 그리고 [saved/manifest.json](file:///E:/Git/PicEditor/saved/manifest.json)까지 원클릭으로 일괄 자동 커밋 완료.

---

### 4. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [js/github.js](file:///E:/Git/PicEditor/js/github.js) | 실시간 GitHub Contents API 로더, `encodeApiPath`, manifest 자동 업데이트, 썸네일 캐시 버스터, 덮어쓰기 로직 |
| [js/state.js](file:///E:/Git/PicEditor/js/state.js) | 현재 로드된 도면명(`currentDiagramName`) 및 Git SHA 추적 상태 필드 추가 |
| [js/export-import.js](file:///E:/Git/PicEditor/js/export-import.js) | 외부 파일 로드 시 도면명 자동 추출 및 상태 동기화 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 저장 모달 내 `ghSaveModeHint` 배너 추가, JS 캐시 파라미터(`v=20261028_8`) 갱신 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 동일한 UI 및 스크립트 버전 동기화 |
| [saved/*.png](file:///E:/Git/PicEditor/saved/) (57개) | 순수 SVG 기반 400px 고해상도 썸네일 57종 전수 새로 렌더링 및 교체 |
| [saved/manifest.json](file:///E:/Git/PicEditor/saved/manifest.json) | 57개 도면의 정확한 해상도(width, height) 및 메타데이터 색인 최신화 |
| [.gitignore](file:///E:/Git/PicEditor/.gitignore) | 임시 스크립트(`scratch/`) 및 시스템 생성 파일 형상 관리 제외 |

---

### 5. 테스트 및 검증 결과

1. **도면 무결성 검증 ([scratch/validate_all.py](file:///E:/Git/PicEditor/scratch/validate_all.py)):**
   - `[saved]` 57개 HTML 파일 검증 완료 (비트맵 태그 `0개`, 오류 `0건`).
   - `[I:\Project\...\html]` 57개 원본 HTML 파일 검증 완료 (오류 `0건`).
2. **저장 및 재로딩 캐시 테스트:**
   - 캔버스에서 특정 도면 로드 후 객체 이동 및 텍스트 수정 실행.
   - [☁️ 깃허브에 저장] 클릭 시 기존 도면명이 자동 채워짐을 확인.
   - 깃허브 커밋 완료 후 보관함 재열람 시 **수정된 썸네일이 즉시 표시**됨을 확인.
   - [📥 캔버스에 불러오기] 클릭 시 **0초 지연으로 방금 수정한 최신 코드가 정확히 로드**됨을 확인.
3. **원격 배포:**
   - `origin main` 브랜치에 커밋 `9376987` 푸시 완료.
   - GitHub Pages 자동 배포 연동 완료.

---

## 🔍 [PATCH-004] 동기화 상태 표시등(Sync Badge), 로컬 자동백업, 콤팩트 SVG 아이콘 UI, 100% 슬라이더 중앙 정렬

### 1. 이슈 개요 및 사용자 요구사항
- **보고 일시:** 2026-10-28 20:10 KST
- **사용자 요구사항:**
  1. **동기화 상태 표시등(제안 3):** 현재 도면이 깃허브에 저장되었는지, 미저장 수정 상태인지 한눈에 알 수 있는 시각적 표시등 구현.
  2. **효율적 추가 제안 반영:** 미저장 작업 보호를 위한 로컬 자동 백업(Auto-Save) 및 1초 원클릭 복원 기능 탑재, 오프라인 및 간편 저장을 위한 원클릭 로컬 HTML 다운로드 지원.
  3. **버튼 콤팩트화 및 시각적 아이콘 그래픽화:** 기존 버튼이 너무 크고 세로로 긴 문제를 개선하여 크기를 슬림하게 축소하고, 직관적인 SVG 벡터 아이콘을 텍스트와 함께 배치하여 직관성 극대화.
  4. **글자 크기 슬라이더 100% 중앙 정렬:** 글자 크기 슬라이더 바에서 100%가 슬라이더의 정확한 정중앙(50% 위치)에 오도록 수정 및 하단 눈금 표시.

---

### 2. 기술적 해결 조치 (Technical Implementation)

#### ① 실시간 저장/동기화 상태 표시등 (Sync Indicator) & 로컬 자동 백업
- [js/github.js](file:///E:/Git/PicEditor/js/github.js) 내 `window.PicEditor.sync` 모듈 구현:
  - 캔버스 정보 바에 4가지 동기화 상태 뱃지 제공:
    - 🟢 `저장됨 (GitHub 동기화)`: 깃허브에 커밋 완료되어 변경 사항이 없는 최신 상태
    - 🟠 `수정됨 (미저장)`: 캔버스 내 이동, 크기, 회전, 반전, 작도, 텍스트 편집 등 변경 발생 상태
    - 🔵 `동기화 중...`: 깃허브 API 업로드/다운로드 통신 중
    - 🔴 `저장 오류`: 네트워크 단절 또는 토큰 권한 오류 발생 상태
  - 캔버스 변형이 발생할 때마다 0.6초 디바운스로 `localStorage`에 현재 SVG 코드를 실시간 자동 임시저장.
  - 새로고침이나 탭 닫힘 시 상단에 **`[🔄 임시저장본 복구]`** 버튼이 자동 노출되어 작업 내용 유실을 원천 차단.

#### ② 버튼 슬림화 및 직관적 SVG 벡터 그래픽 아이콘 적용 (2열 그리드 레이아웃)
- 사이드바 버튼을 모던 그래픽 툴 스타일로 슬림화:
  - 패딩: `5px 9px`, 폰트: `11.5px`, 최소 높이: `29px`
  - 2열 그리드(`sidebar-btn-grid`) 레이아웃을 도입하여 세로 스크롤을 50% 이상 단축.
  - 각 버튼 내부에 선명한 14px 인라인 SVG 벡터 아이콘 탑재:
    - 그림 올리기(사진), 보관함(갤러리 카드), HTML 코드(태그), HTML 파일(문서), 캔버스 비우기(지우개), 선택/편집(커서), 선택 해제(X), 직선↔화살표(방향 전환), 좌우/상하 반전(대칭축), 깃허브 저장(클라우드 업로드), HTML 다운(디스켓), PNG 다운(이미지 다운), 깃허브 설정(기어), HTML 복사(클립보드), 선택 삭제(휴지통).

#### ③ 글자 크기 슬라이더 100% 정중앙 위치 및 시각적 눈금 틱 바
- [index.html](file:///E:/Git/PicEditor/index.html) & [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html):
  - 슬라이더 범위를 `min="0" max="200" step="5" value="100"`로 개편:
  - 수학적 중앙값 `(0 + 200) / 2 = 100%`가 슬라이더의 물리적 정중앙(50% 지점)에 정확히 위치함.
  - 슬라이더 하단에 `0% --------- ▲ 100% (기본) --------- 200%` 눈금 틱 라벨을 배치하여 시각적 직관성 확보.
- [js/inspector.js](file:///E:/Git/PicEditor/js/inspector.js):
  - 최소 크기 10% 클램핑으로 0% 조작 시 텍스트 소멸 방지.
  - 숫자 입력창(`textScaleNum`)은 10% ~ 1000%까지 자유 입력 가능하도록 유지.

#### ④ 원클릭 로컬 HTML 도면 파일 즉시 다운로드 (`downloadHtmlFile`)
- [js/export-import.js](file:///E:/Git/PicEditor/js/export-import.js):
  - GitHub PAT 설정이나 로그인 없이도 현재 캔버스 도면을 클릭 한 번으로 `${도면명}.html` 파일로 즉시 컴퓨터에 다운로드할 수 있는 원클릭 버튼 제공.

---

### 3. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [css/style.css](file:///E:/Git/PicEditor/css/style.css) | `.canvas-info-bar`, `.sync-badge`, `.restore-badge-btn`, 슬림 버튼 및 `.btn-icon`, `.sidebar-btn-grid`, `.slider-ticks` 스타일 추가 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 상단 동기화 상태바 및 복원 버튼, 2열 슬림 아이콘 버튼 레이아웃, 0~200% 중앙 정렬 슬라이더 및 눈금 라벨 적용 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 100% 동일한 UI 및 마크업 동기화 |
| [js/github.js](file:///E:/Git/PicEditor/js/github.js) | `window.PicEditor.sync` 실시간 동기화 상태 관리자 및 로컬 자동 백업(Auto-Save)/복원 로직 구현 |
| [js/inspector.js](file:///E:/Git/PicEditor/js/inspector.js) | 0~200% 슬라이더 중앙값 동기화 및 모든 속성 변경 시 `markModified()` 호출 연동 |
| [js/export-import.js](file:///E:/Git/PicEditor/js/export-import.js) | `downloadHtmlFile()` 원클릭 로컬 HTML 다운로드 함수 추가 |
| [js/tools.js](file:///E:/Git/PicEditor/js/tools.js) | 화살표 변환 시 `markModified()` 상태 갱신 연동 |
| [js/interaction.js](file:///E:/Git/PicEditor/js/interaction.js) | 마우스 드래그 및 신규 도형 작도 완료 시 `markModified()` 상태 갱신 연동 |
| [js/app.js](file:///E:/Git/PicEditor/js/app.js) | 초기 구동 시 미저장 로컬 임시저장본 자동 확인 및 복구 버튼 활성화 |

---

## 🔍 [PATCH-005] 우측 브라우저 버튼 높이 비정상 확장 버그 긴급 해결 및 100vh 뷰포트 고정 레이아웃 개편

### 1. 이슈 개요 및 사용자 보고
- **보고 일시:** 2026-10-29 07:52 KST
- **사용자 보고 내용:**
  > *"오른쪽 브라우저를 봐! 이렇게 설계한 게 맞아? 높이가 고정되어야 될텐데?"*
- **핵심 문제 현상:**
  1. 사용자가 우측 분할 브라우저(또는 모니터 우측 창)에서 확인 시, **사이드바의 모든 버튼이 세로로 600px에 달하는 거대한 막대 기둥으로 비정상 확장**되어 레이아웃이 붕괴됨.
  2. 버튼 내부의 SVG 아이콘이 거대한 흰색 박스로 늘어나고, 사이드바 전체 스크롤 높이가 수천 픽셀로 폭증함.
  3. 전체 화면 높이가 뷰포트에 고정되지 않아, 브라우저 전체 창의 외부 수직 스크롤과 사이드바 내부 스크롤이 동시에 생기는 **이중 스크롤(Double Scrollbar)** 현상 발생.

---

### 2. 근본 원인 분석 (Root Cause Analysis)

#### 원인 ① : 전역 `svg` 태그 선택자의 버튼 아이콘 침범 (CSS Specificity & Inheritance Bug)
- 기존 스타일시트에 메인 캔버스를 위해 선언된 규칙:
  ```css
  svg {
    width: 100%;
    height: 680px;
    min-height: 580px;
    background: #ffffff;
    border: 1px solid #d2d6dc;
  }
  ```
- PATCH-004에서 버튼에 직관적인 14px 인라인 SVG 아이콘(`<svg class="btn-icon">`)을 도입하면서, 해당 전역 `svg` 규칙이 **버튼 내부의 모든 아이콘 태그에 강제 적용**되었습니다.
- `.btn-icon`에 `height: 14px;`를 지정했음에도 불구하고, CSS 명세상 `min-height: 580px;`가 `height`를 강제 덮어쓰면서 **모든 아이콘이 높이 580px, 테두리와 배경을 가진 거대한 사각형으로 렌더링**되었고, 결과적으로 버튼 전체 높이가 600px로 폭발했던 것입니다.

#### 원인 ② : 버튼 및 컨트롤 높이의 비고정 가변 계산
- 버튼에 `min-height: 29px;`만 선언되어 있고 명시적 `height` 고정값(`height: 30px; line-height: 1;`)이 부여되지 않아, 내부 요소 크기 변화에 따라 세로로 무제한 늘어날 수 있는 구조였습니다.

#### 원인 ③ : 비고정 뷰포트 구조로 인한 이중 스크롤
- `body`와 `.app-layout`이 `100vh`에 고정되지 않고 `margin/padding`에 의해 자연 확장되는 방식이었기 때문에, 캔버스와 사이드바 높이가 뷰포트를 초과할 때 브라우저 창 자체에 외부 스크롤바가 생기며 헤더가 화면 위로 밀려나는 현상이 발생했습니다.

---

### 3. 기술적 해결 조치 (Technical Implementation)

#### ① 메인 캔버스 전용 식별자 격리 (`#svg-editor`)
- 전역 `svg` 및 `svg.select-mode` 선택자를 캔버스 전용 ID인 `#svg-editor`, `#svg-editor.select-mode`로 엄격히 변경했습니다.
- `.btn-icon` 스타일에 `!important`를 포함한 완전한 크기 및 스타일 리셋을 적용하여 어떤 상위 규칙도 침범하지 못하도록 격리했습니다:
  ```css
  .btn-icon {
    width: 14px !important;
    height: 14px !important;
    min-width: 14px !important;
    min-height: 14px !important;
    max-width: 14px !important;
    max-height: 14px !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    fill: currentColor;
    display: inline-block;
    vertical-align: middle;
  }
  ```

#### ② 버튼 높이 30px 규격 고정
- 모든 조작 버튼에 `height: 30px; min-height: 30px; max-height: 30px; line-height: 1; white-space: nowrap;`를 적용하여 어떠한 환경에서도 군더더기 없이 단정하고 슬림한 높이가 유지되도록 고정했습니다.

#### ③ 100vh 뷰포트 고정 레이아웃 전면 개편 (전문 에디터 규격)
- `html, body`에 `height: 100%; overflow: hidden;`을 적용하여 브라우저 창 자체의 불필요한 스크롤바를 완전히 제거했습니다.
- `.app-layout`을 `height: 100vh; max-height: 100vh; box-sizing: border-box;`로 설정하여 창 크기에 맞춰 100% 밀착되도록 설계했습니다.
- **좌측 캔버스 영역:**
  - 상단 헤더(`canvas-header`)는 높이를 고정 유지(`flex-shrink: 0;`).
  - 메인 캔버스 카드(`.card`)와 `#svg-editor`는 `flex: 1; min-height: 0; height: 100%;`로 동작하여 화면 높이에 따라 사용 가능한 수직 공간을 100% 자동 채우도록 반응형 피팅을 구현했습니다.
- **우측 사이드바 영역:**
  - `height: 100%; max-height: 100%; overflow-y: auto;`로 설정하여 화면을 벗어나지 않고 사이드바 내부에서만 부드럽게 스크롤되도록 분리했습니다.
- **모바일/좁은 화면(800px 이하):**
  - 모바일에서는 자연스럽게 1열 세로 스크롤 레이아웃으로 전환되어 사용성을 보장합니다.

---

### 4. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [css/style.css](file:///E:/Git/PicEditor/css/style.css) | `svg` 선택자를 `#svg-editor`로 분리, `.btn-icon` 크기/배경 격리, 버튼 30px 높이 고정, 100vh 고정 뷰포트 레이아웃 개편, 800px 반응형 규칙 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 인라인 100vh 뷰포트 스타일 동기화, CSS 캐시 버스터(`v=20261029_1`) 갱신 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 100% 동일한 인라인 스타일 및 CSS 캐시 버스터(`v=20261029_1`) 갱신 |
| [physics_diagram_studio_patch_report.md](file:///E:/Git/PicEditor/physics_diagram_studio_patch_report.md) | `PATCH-005` 발생 원인 및 해결 조치 상세 문서화 |

---

### 5. 테스트 및 검증 결과

1. **해상도별 헤드리스 크롬 스크린샷 렌더링 검증:**
   - `1920x1080` (데스크톱 FHD): 버튼 30px 고정, 캔버스 중앙 자동 확장, 외부 스크롤바 0개 확인.
   - `1366x768` (노트북 표준): 뷰포트 100vh 정확 밀착, 사이드바 내부 단일 스크롤 정상 동작 확인.
   - `960x1080` (사용자 우측 분할 브라우저): 버튼 왜곡 없이 깔끔한 2열 그리드 배치 및 여백 없는 완벽한 레이아웃 확인.
2. **요소 높이 수치 검증:**
   - 버튼 계산 높이(`btnComputedHeight`): `30px` 정상 고정.
   - 아이콘 크기(`iconComputedWidth/Height`): `14px x 14px` 정상 고정.
   - 브라우저 외부 스크롤바 발생 여부: `overflow: hidden`으로 제거 완료.

---

## 🔍 [PATCH-006] 호(Arc) 작도 방식 전면 개편: 시점-종점 중점 원의 중심(붉은 점) 표시, 드래그 곡률 제어 및 조건부 노출 핸들 구현

### 1. 이슈 개요 및 사용자 요구사항
- **보고 일시:** 2026-10-29 10:05 KST
- **사용자 요구사항:**
  > *"호를 그리는 방법을 수정하자. 호의 시작점과 끝점을 연결하는 직선의 중점에 점을 하나표시해. 이 점이 원의 중심이야. 이 점을 붉은 색으로 표시하고 이동시킬수 있도록 해. 선택해제를 누르거나 다른 객체를 선택하면 이 붉은 점은 사라지도록 해. 호가 다시 선택되면 보이도록 만들어. 가능해?"*
- **핵심 목표:**
  1. 호를 작도할 때 시작점($P_1$)과 끝점($P_2$)을 잇는 선분의 중점을 초기 **원의 중심($C$)**으로 설정.
  2. 원의 중심을 시각적으로 선명한 **🔴 붉은색 조작 점(Handle)**으로 표시하고, 마우스로 직접 잡고 드래그하여 원의 중심 위치 및 반지름($R$), 곡률을 자유자재로 변경 가능하도록 구현.
  3. **조건부 노출:** 호가 선택되었을 때만 붉은 중심점이 표시되며, 선택 해제하거나 다른 객체(선, 텍스트, 이미지 등)를 선택하면 즉시 사라짐.
  4. **재선택 복원:** 해당 호를 나중에 다시 클릭하여 선택하면 저장된 원의 중심 좌표로 붉은 점이 즉시 다시 나타남.
  5. **내보내기 오염 방지:** GitHub 저장, HTML 다운로드, 클립보드 복사, PNG 내보내기 시 에디터 조작용 붉은 점 및 가이드라인이 절대 결과물에 포함되지 않도록 완전 분리.

---

### 2. 수학적 기하학 모델 및 설계 (Geometric Architecture)

#### ① 원의 중심($C$) 기반 SVG 원호(`A`) 방정식
- 시점 $P_1(x_1, y_1)$, 종점 $P_2(x_2, y_2)$, 원의 중심 $C(cx, cy)$가 주어졌을 때:
  - $R_1 = \sqrt{(x_1 - cx)^2 + (y_1 - cy)^2}$
  - $R_2 = \sqrt{(x_2 - cx)^2 + (y_2 - cy)^2}$
  - 평균 반지름 $R = \frac{R_1 + R_2}{2}$ (단, 현의 절반 $\frac{\text{chord}}{2}$ 이상으로 보정)
- 시점 $\to$ 종점 벡터 $\vec{v} = (x_2 - x_1, y_2 - y_1)$과 시점 $\to$ 중심 벡터 $\vec{u} = (cx - x_1, cy - y_1)$의 외적:
  $$\text{cross} = (x_2 - x_1)(cy - y_1) - (y_2 - y_1)(cx - x_1)$$
- 화면 좌표계($Y$축 아래 방향) 기준:
  - $\text{cross} \le 0$: 중심 $C$가 선분의 위쪽에 위치 $\to$ 호는 중심 $C$를 감싸며 **아래쪽으로 볼록** ($\text{sweep} = 1$)
  - $\text{cross} > 0$: 중심 $C$가 선분의 아래쪽에 위치 $\to$ 호는 중심 $C$를 감싸며 **위쪽으로 볼록** ($\text{sweep} = 0$)
- 결과 SVG Path 명령:
  $$d = \text{M } x_1, y_1 \text{ A } R \text{ } R \text{ 0 0 } \text{sweep } x_2, y_2$$

#### ② 초기 상태 (중점 = 반원)
- 호를 처음 드래그하여 그릴 때 중심 $C$는 시점과 종점의 정확한 중점 $M = (\frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2})$에 위치하여 완벽한 반원(Semicircle)으로 시작합니다.
- 사용자가 붉은 중심점을 드래그하여 현에서 멀어지면 곡률이 완만해지며(진자 궤적, 각도 호 등), 가까워지거나 반대편으로 넘어가면 360° 부드럽게 형태가 변화합니다.

---

### 3. 기술적 해결 조치 (Technical Implementation)

1. **[js/tools.js](file:///E:/Git/PicEditor/js/tools.js) 모듈 전면 개편:**
   - `calculateArcD(p1, p2, c)`: 시점, 종점, 중심점으로부터 정확한 SVG Arc Path 및 반지름($R$), 스윕 플래그 산출.
   - `getArcData(pathEl)`: 요소의 `data-x1`, `data-y1`, `data-x2`, `data-y2`, `data-cx`, `data-cy` 속성 또는 기존 `d` 속성 파싱.
   - `isArcElement(el)`: 요소가 호(Arc)인지 신뢰성 있게 판별.
   - `ensureArcCenterGizmo(svg)`: 캔버스 내 독립 기즈모 그룹(`<g id="arc-center-handle-group">`) 동적 생성.
     - 가이드 점선 (시점-종점 현 가이드선, 중심 축선, 2개의 반지름 안내선)
     - 시점 및 종점 블루 앵커 포인트
     - **🔴 붉은 원의 중심점 조작 핸들:** 반경 18px의 투명 히트 박스 + 반경 8.5px 붉은 원 + 흰색 포인트 + 실시간 반지름 라벨(`원의 중심 (R=...px)`)
   - `showArcCenterHandle(arcEl)`: 선택된 호의 위치/회전/반전 `transform`과 100% 동기화하여 붉은 중심점 및 가이드라인 노출.
   - `hideArcCenterHandle()`: 호 선택 해제 시 기즈모 완전 숨김 처리.

2. **[js/interaction.js](file:///E:/Git/PicEditor/js/interaction.js) 인터랙션 바인딩:**
   - **호 작도 완료 시:** 호를 그린 직후 자동으로 선택 모드로 전환되어 새로 그려진 호에 붉은 중심점이 즉시 나타나 바로 곡률 조절 가능.
   - **붉은 점 드래그 조작:** `state.isDraggingArcCenter` 상태를 통해 마우스 이동 시 아크의 로컬 좌표계로 역변환하여 중심 $C$를 실시간 갱신하고 패스 곡률을 실시간 변형.
   - **호 자체 이동 시:** 아크를 드래그하여 이동할 때 기즈모도 함께 매끄럽게 추종.
   - **선택 변경 및 해제 감지:** 다른 요소(선, 텍스트, 이미지)를 클릭하거나 빈 캔버스를 클릭하면 붉은 점 즉시 소멸. 호를 다시 클릭하면 즉시 재노출.

3. **[js/utils.js](file:///E:/Git/PicEditor/js/utils.js), [js/export-import.js](file:///E:/Git/PicEditor/js/export-import.js), [js/github.js](file:///E:/Git/PicEditor/js/github.js) 내보내기 무결성:**
   - `getCleanSvgString(svg)` 공통 직렬화 파이프라인 구축.
   - 모든 저장(GitHub 원클릭 커밋, 로컬 HTML 다운로드, 클립보드 복사, PNG 내보내기, 로컬 자동백업) 시 `#arc-center-handle-group` 기즈모를 원천 분리 및 제거하여 순수한 물리 도면 SVG만 저장되도록 보장.

4. **[index.html](file:///E:/Git/PicEditor/index.html) 및 [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html):**
   - 호 도구 선택 시 붉은 중심점 활용 가이드 배너 안내 표시.
   - 모든 스크립트 캐시 버스터 `v=20261029_2`로 일괄 갱신.

---

### 4. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [js/tools.js](file:///E:/Git/PicEditor/js/tools.js) | 원의 중심 기반 `calculateArcD`, `getArcData`, `ensureArcCenterGizmo`, `showArcCenterHandle`, `hideArcCenterHandle` 구현 |
| [js/interaction.js](file:///E:/Git/PicEditor/js/interaction.js) | 붉은 중심점 드래그 실시간 곡률 연동, 호 작도 후 자동 선택, 요소 선택/해제 연동 |
| [js/state.js](file:///E:/Git/PicEditor/js/state.js) | `isDraggingArcCenter` 중심점 드래그 상태 필드 추가 |
| [js/utils.js](file:///E:/Git/PicEditor/js/utils.js) | `deselectAll()` 내 기즈모 숨김 연동, 에디터 전용 기즈모 배제 `getCleanSvgString()` 구현 |
| [js/inspector.js](file:///E:/Git/PicEditor/js/inspector.js) | 요소 회전(`applyRotate`) 및 반전(`flipElement`) 시 아크 기즈모 위치 동기화 |
| [js/export-import.js](file:///E:/Git/PicEditor/js/export-import.js) | 클립보드 복사, PNG 다운로드, HTML 파일 다운로드 시 기즈모 배제 적용 |
| [js/github.js](file:///E:/Git/PicEditor/js/github.js) | GitHub 커밋, 썸네일 생성, 로컬 자동백업 시 기즈모 배제 적용 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 호 작도 팁 배너 적용, 스크립트 버전(`v=20261029_2`) 갱신 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 100% 동일한 마크업 및 스크립트 버전 동기화 |
| [physics_diagram_studio_patch_report.md](file:///E:/Git/PicEditor/physics_diagram_studio_patch_report.md) | `PATCH-006` 설계 원리 및 구현 내역 상세 문서화 |

---

### 5. 테스트 및 검증 결과

1. **자동화 수명주기 테스트 ([scratch/test_arc_lifecycle.py](file:///E:/Git/PicEditor/scratch/test_arc_lifecycle.py)):**
   - 호 초기 작도 시 중점 기반 반원 생성 (`M 150,350 A 200 200 0 0 1 550,350`): ✅ 성공
   - 호 선택 시 붉은 중심점 기즈모 자동 노출 (`gizmoVisibleOnSelect: true`): ✅ 성공
   - 붉은 중심점 드래그 이동 시 원호 실시간 곡률 갱신 (`A 262.5 262.5`): ✅ 성공
   - 선택 해제 시 붉은 중심점 자동 은닉 (`gizmoHiddenOnDeselect: true`): ✅ 성공
   - 호 재선택 시 붉은 중심점 재노출 (`gizmoVisibleOnReselect: true`): ✅ 성공
   - SVG 코드 내보내기 시 기즈모 미포함 및 도면 순수성 유지 (`exportExcludesGizmo: true`): ✅ 성공
2. **실제 에디터 UI 렌더링 검증 ([scratch/live_arc_selected.png](file:///E:/Git/PicEditor/scratch/live_arc_selected.png)):**
   - 캔버스 상에서 선택된 호에 파란색 경계 박스와 붉은 중심점("원의 중심 (R=219px)"), 방사형 가이드선이 깔끔하게 표시됨을 헤드리스 크롬 스크린샷으로 확인 완료.

---

## 📝 향후 추가 수정 시 업데이트 지침 (Maintenance Rules)

향후 PicEditor에 새로운 버그 수정이나 기능 개선 작업이 발생할 경우, 다음 규칙에 따라 본 문서를 지속적으로 갱신합니다:

1. **패치 ID 부여:** 상단 요약 표에 `PATCH-005`, `PATCH-006` 순으로 일련번호를 추가하고 날짜, 커밋 SHA, 핵심 내용을 기록합니다.
2. **상세 섹션 추가:** 이슈 개요, 근본 원인 분석, 기술적 해결 내역, 변경 파일, 테스트 결과를 체계적으로 기술합니다.
3. **코드 및 문서 동기화:** README.md 및 개발 보고서(`physics_diagram_studio_development_report.md`)와의 버전 및 링크 일관성을 유지합니다.
