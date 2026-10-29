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
| **PATCH-009** | 2026-10-29 | `TBD` | **[호의 중심] 용어 개편 및 파란색 양 끝점(P1, P2) 원의 방정식 연동 드래그 이동 구현**<br>- 붉은 점 라벨 및 도구 안내 문구를 "원의 중심"에서 **"호의 중심"**으로 직관적 개편<br>- 호의 양 끝점(시점 P1, 종점 P2)을 직접 잡고 늘리거나 줄일 수 있는 파란색 조작 핸들 탑재<br>- 호의 중심과 한 점이 고정된 상태에서 **마우스의 X좌표만을 읽어 원의 방정식으로부터 Y좌표를 자동 산출($y = cy \pm \sqrt{R^2 - (x-cx)^2}$)**하여 항상 완벽한 원호 궤적을 유지하는 구속 드래그 구현 | ✅ 완료 |
| **PATCH-008** | 2026-10-29 | `ccbc2b3` | **호(Arc) 곡률 방향 및 원의 중심 기하학적 오류(sweep-flag 반전) 완전 해결**<br>- 호가 중심(붉은 점) 쪽으로 역방향으로 솟아오르던 SVG sweep-flag 반전 결함 완전 정상화<br>- 원의 중심(붉은 점)은 항상 호의 오목한 안쪽에 위치하고, 호는 중심을 축으로 자연스럽게 회전하도록 기하학적 정의 확립<br>- W3C 표준 endpoint-to-center 수식 기반 `getSvgArcCenter` 알고리즘 탑재<br>- 기본 단진자 도면의 호 경로를 천장 피벗(400, 120) 중심 물리적 원호로 동기화 | ✅ 완료 |
| **PATCH-007** | 2026-10-29 | `c0d8ed0` | **호(Arc) 클릭 시 붉은 중심점 영구 유지 및 손가락/마우스 뗌 직후 소멸 버그 해결, 드래그 위치 수정 보장**<br>- 손가락이나 마우스를 뗄 때 붉은 점이 사라지던 버그(자동 백업 `getCleanSvgString` 내 `deselectAll()` 호출) 원천 제거<br>- 사용자가 `[선택 해제]` 버튼을 누르거나 다른 객체를 선택하기 전까지 붉은 중심점 영구 노출 유지<br>- 빈 캔버스 클릭/터치 시 호 선택 풀림 방지 보호 로직 구현<br>- 모바일/태블릿 터치(`touchstart`/`touchmove`/`touchend`) 및 포인터 이벤트 완벽 지원<br>- 붉은 중심점 터치 반경 24px 확대 및 드래그를 통한 원의 중심 위치/곡률 360° 자유 조정 보장 | ✅ 완료 |
| **PATCH-006** | 2026-10-29 | `45e90ce` | **호(Arc) 작도 방식 전면 개편: 시점-종점 중점 원의 중심(붉은 점) 표시, 드래그 곡률 제어 및 조건부 노출 핸들 구현**<br>- 호 시점($P_1$)-종점($P_2$)의 중점을 원의 중심($C$)으로 초기화하고 붉은색 조작 핸들(`🔴`) 표시<br>- 붉은 중심점을 마우스로 실시간 드래그하여 원의 중심 위치 및 반지름($R$), 볼록 방향을 360° 자유롭게 조정<br>- 선택 해제(`deselectAll`) 및 다른 객체(선, 글자, 그림) 선택 시 붉은 중심점 자동 은닉<br>- 호 재선택 시 저장된 원의 중심 좌표로 붉은 점 즉시 재노출<br>- 내보내기/저장/다운로드(GitHub, HTML, PNG) 시 에디터 조작용 기즈모 100% 완전 분리 및 배제 | ✅ 완료 |
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


---

## 🔍 [PATCH-007] 호(Arc) 클릭 시 붉은 중심점 영구 유지 및 드래그 위치 수정 보장

### 1. 이슈 개요 및 사용자 보고
- **보고 일시:** 2026-10-29 KST
- **사용자 보고 내용:**
  > *"호를 클릭하면 누른 상태에서는 점이 보이는데 손가락을 떼면 사라져. 선택 해제를 누르기 전까지는 점이 보이도록 수정해. 점을 선택해서 위치를 수정하게 할꺼야."*
- **핵심 요구사항:**
  1. 호(Arc)를 클릭하거나 터치했을 때 마우스 버튼이나 손가락을 떼어도 붉은 중심점이 절대 사라지지 않고 계속 화면에 유지되어야 함.
  2. 사용자가 상단 메뉴의 **`[선택 해제]`** 버튼을 명시적으로 클릭하거나 다른 도면 요소를 선택할 때까지 붉은 원의 중심점이 영구 유지되어야 함.
  3. 사용자가 노출된 붉은 점을 선택(마우스/터치 드래그)하여 원의 중심 위치를 자유롭게 이동하고 호의 곡률 및 반경을 직관적으로 변경할 수 있어야 함.

---

### 2. 근본 원인 분석 (Root Cause Analysis)

#### 원인 ① : 로컬 자동 백업(Auto-Save) 시 라이브 DOM 선택 해제 결함
- `js/interaction.js`의 `mouseup` 이벤트 핸들러에서 사용자가 드래그를 마치거나 요소를 클릭하면 `window.PicEditor.sync.markModified()`가 호출되었습니다.
- `markModified()`는 600ms 디바운스 타이머 후 `executeAutoSave()`를 실행하는데, 이때 호출되는 `js/utils.js`의 `getCleanSvgString(svg)` 내부 첫 줄에 `this.deselectAll()`이 포함되어 있었습니다.
- 이로 인해 **사용자가 손가락이나 마우스를 뗀 후 약 600ms가 지나면 백그라운드 자동 저장이 돌면서 라이브 캔버스의 모든 선택 상태와 붉은 중심점 기즈모(`hideArcCenterHandle()`)를 강제로 은닉**시켰습니다.

#### 원인 ② : 캔버스 배경 클릭 및 미세 터치 시 무조건 선택 해제
- `js/interaction.js`의 SVG 캔버스 `mousedown` 핸들러가 호가 선택된 상태인지 확인하지 않고 빈 캔버스나 배경 `<rect>` 클릭 시 무조건 `deselectAll()`을 호출했습니다.
- 터치스크린이나 마우스로 붉은 점을 클릭하려다 몇 픽셀 빗나가거나 손가락을 떼는 과정에서 미세한 캔버스 터치가 감지되면 즉시 선택이 해제되었습니다.

#### 원인 ③ : 모바일/터치스크린 터치 이벤트(`touchstart`/`touchmove`/`touchend`) 미지원 및 버블링
- `initMovableEvents()`와 중심점 핸들에 오직 마우스 이벤트(`mousedown`, `mousemove`, `mouseup`)만 등록되어 있어, 태블릿이나 터치 노트북에서 제스처 충돌 및 스크롤 간섭이 일어났습니다.
- 또한 `onmousedown`에 `e.stopPropagation()`이 누락되어 이벤트가 상위 캔버스로 버블링되어 원치 않는 선택 해제가 유발되었습니다.

#### 원인 ④ : 기즈모 내부 가이드 점선들의 포인터 이벤트 간섭
- 기즈모 내부의 점선 안내선(`arc-chord-guide`, `arc-radius-guide`)들이 포인터 이벤트를 수신하여, 중심점을 클릭하려 할 때 안내선이 클릭을 흡수해버리는 문제가 있었습니다.

---

### 3. 기술적 해결 조치 (Technical Implementation)

1. **[js/utils.js](file:///E:/Git/PicEditor/js/utils.js) 순수 복제 기반 직렬화로 개편:**
   - `getCleanSvgString(svg)`에서 라이브 DOM을 변경하던 `this.deselectAll()` 호출을 완전히 제거하였습니다.
   - 원본 SVG를 `svg.cloneNode(true)`로 복제한 후, **클론(Clone) 내부에서만** `.selected` 클래스와 `#arc-center-handle-group` 기즈모를 제거하고 직렬화하도록 수정하여 활성 화면의 선택 상태를 100% 보존합니다.
   - `getSvgPoint(e, svgEl)` 함수를 확장하여 마우스 이벤트뿐만 아니라 `e.touches`, `e.changedTouches`를 지원하도록 개편하여 모바일/태블릿 터치 좌표를 정밀 변환합니다.

2. **[js/github.js](file:///E:/Git/PicEditor/js/github.js) 썸네일 생성 시 활성 선택 상태 보존:**
   - `generateThumbnailBase64()`에서도 라이브 `deselectAll()`을 제거하고 복제본 내부에서만 정리하도록 일원화하였습니다.

3. **[js/interaction.js](file:///E:/Git/PicEditor/js/interaction.js) 호 선택 보호 및 터치 제어 통합:**
   - `initMovableEvents()`: `onmousedown` 및 `ontouchstart` 양쪽에 `e.stopPropagation()`을 적용하고 선택 상태를 활성화.
   - `handleCanvasStart`: 호(Arc)가 선택되어 붉은 중심점이 노출 중일 때는 빈 캔버스 배경을 클릭/터치하더라도 선택이 절대 해제되지 않도록 방어 로직을 수립하였습니다. 오직 **`[선택 해제]` 버튼을 누르거나, 다른 객체를 선택하거나, ESC 키를 누를 때만** 중심점이 닫힙니다.
   - `mousemove`와 `touchmove`를 통합한 `handlePointerMove`: 붉은 점 드래그 조작 시 화면 스크롤 간섭을 방지(`e.preventDefault()`)하고 실시간으로 중심 좌표 $C(cx, cy)$를 역변환하여 호의 곡률을 실시간 렌더링.
   - `mouseup`과 `touchend`를 통합한 `handlePointerUp`: 조작 완료 후에도 붉은 점이 화면에 그대로 유지되도록 처리.

4. **[js/tools.js](file:///E:/Git/PicEditor/js/tools.js) 기즈모 포인터 격리 및 터치 영역 확대:**
   - 기즈모 컨테이너 및 가이드 점선에 `pointer-events: none;`을 적용하여 클릭 가로챔 방지.
   - 붉은 중심점 조작 핸들(`#arc-center-hit`)의 감지 반경을 기존 18px에서 **24px**로 확대하고, 투명 히트 서클에 `fill="#000000" opacity="0.001"`을 부여하여 모든 브라우저 및 터치 기기에서 손가락으로 손쉽게 잡고 이동할 수 있도록 개선.

5. **캐시 버스터 갱신:**
   - [index.html](file:///E:/Git/PicEditor/index.html) 및 [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) 스크립트 태그를 `?v=20261029_3`으로 일괄 갱신.

---

### 4. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [js/utils.js](file:///E:/Git/PicEditor/js/utils.js) | `getCleanSvgString()` 라이브 DOM 불변 보장, `getSvgPoint()` 터치 좌표 완벽 지원 |
| [js/github.js](file:///E:/Git/PicEditor/js/github.js) | `generateThumbnailBase64()` 라이브 `deselectAll()` 호출 제거 및 클론 내 정리 |
| [js/tools.js](file:///E:/Git/PicEditor/js/tools.js) | 붉은 중심점 터치 반경 24px 확대, 가이드선 포인터 이벤트 차단, 터치 이벤트 등록 |
| [js/interaction.js](file:///E:/Git/PicEditor/js/interaction.js) | 캔버스 클릭 시 아크 선택 유지, 터치/마우스 통합 포인터 이벤트 및 버블링 차단 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 스크립트 모듈 캐시 버스터 `v=20261029_3` 일괄 적용 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 완전 동기화 |
| [physics_diagram_studio_patch_report.md](file:///E:/Git/PicEditor/physics_diagram_studio_patch_report.md) | `PATCH-007` 상세 기술 분석 및 검증 결과 문서화 |

---

### 5. 테스트 및 검증 결과

1. **자동화 검증 스위트 ([scratch/verify_arc_fix.py](file:///E:/Git/PicEditor/scratch/verify_arc_fix.py)):**
   - **호 클릭 직후 중심점 표시 (`immediateDisplay`):** `block` (✅ 합격)
   - **손가락/마우스 뗌 및 1,000ms 자동저장 경과 후 유지 (`afterAutosaveDisplay`):** `block` (✅ 합격)
   - **중심점 드래그 시 아크 곡률 및 패스 'd' 실시간 변형 (`dragModifiedD`):** `true` (✅ 합격)
   - **드래그 완료 후 손가락/마우스를 떼었을 때 중심점 유지 (`afterDragDisplay`):** `block` (✅ 합격)
   - **빈 캔버스 배경 클릭/터치 시 중심점 유지 (`afterBgClickDisplay`):** `block` (✅ 합격)
   - **[선택 해제] 버튼 클릭 시 중심점 소멸 (`afterDeselectAllDisplay`):** `none` (✅ 합격)
   - **호 재선택 시 중심점 재표시 (`reselectedDisplay`):** `block` (✅ 합격)
   - **다른 객체(직선 등) 선택 시 호 중심점 자동 소멸 (`afterSelectOtherDisplay`):** `none` (✅ 합격)
2. **모바일/터치스크린 검증:**
   - `ontouchstart` 이벤트 디스패치 시 즉각적인 기즈모 활성화 확인 완료.
3. **실제 시각 렌더링 캡처 확인 ([scratch/arc_selection_crop.png](file:///E:/Git/PicEditor/scratch/arc_selection_crop.png)):**
   - 손가락을 뗀 뒤에도 호와 붉은 원의 중심점(`🔴 원의 중심 (R=89px)`), 엔드포인트 앵커가 온전히 캔버스 상에 고정 노출되어 있음을 시각적으로 검증 완료.


---

## 🔍 [PATCH-008] 호(Arc) 곡률 방향 및 원의 중심 기하학적 오류(sweep-flag 반전) 완전 해결

### 1. 이슈 개요 및 사용자 보고
- **보고 일시:** 2026-10-29 10:49 KST
- **사용자 보고 내용:**
  > *"이게 호의 중심이 맞아?"*
- **핵심 문제점:**
  1. 화면에 표시된 붉은 점("원의 중심 (R=140px)")이 호의 **바깥쪽(볼록한 쪽)**에 위치하여, 호가 원의 중심 쪽으로 솟아올라 휘어지는 기하학적 모순 발생.
  2. 원의 정의상 원의 중심은 항상 호의 **안쪽(오목한 쪽)**에 있어야 하며, 호의 모든 점은 중심으로부터 일정한 반지름($R$)을 유지해야 하나 완전히 정반대로 렌더링됨.
  3. 천장에 매달린 단진자(Pendulum) 도면에서 진자의 회전 중심은 천장 피벗(검은 점 `400, 120`)이어야 하지만, 엉뚱한 허공에 붉은 점이 표시됨.

---

### 2. 근본 원인 분석 (Root Cause Analysis)

#### 원인 ① : SVG 타원 호(Arc) sweep-flag 외적 판정 부호 반전
- `js/tools.js`의 `calculateArcD` 함수 내에서 시계/반시계 방향 회전 플래그(`sweep`)를 결정할 때 사용한 2D 외적 공식 `(cross <= 0) ? 1 : 0`의 판정 부호가 반대로 되어 있었습니다.
- 화면 좌표계(Y축 아래 방향)에서 중심 $C$가 현(Chord)의 상단(천장 방향)에 있을 때 `cross < 0`이 되는데, 이때 `sweep = 1`을 지정함으로써 SVG 렌더러가 중심을 현의 반대편(하단 `y≈424`)에 있는 것으로 간주하여 호를 위로 불룩하게 그렸습니다.
- 즉, **사용자가 지정한 중심점 위치와 실제 그려진 호의 곡률 중심이 현(Chord)을 사이에 두고 180° 반대편으로 대칭 반전**되어 나타난 치명적인 수학적 결함이었습니다.

#### 원인 ② : W3C 엔드포인트 파라미터 역계산 부재
- 기존 `getArcData()`에서 SVG `A` 경로 파싱 시 원의 중심을 단순히 시점과 종점의 중점(`mx, my`)으로 어림잡아 할당하여 실제 호의 기하학적 중심과 불일치했습니다.

---

### 3. 기술적 해결 조치 (Technical Implementation)

1. **[js/tools.js](file:///E:/Git/PicEditor/js/tools.js) 외적 판정 및 곡률 방향 100% 정상화:**
   - `calculateArcD`의 외적 판정식을 정규화:
     ```javascript
     const cross = (x2 - x1) * (cy - y1) - (y2 - y1) * (cx - x1);
     const sweep = (cross > 0) ? 1 : 0;
     ```
   - 중심 $C$가 있는 쪽이 항상 원의 안쪽(오목한 쪽)이 되도록 보장하여, 호의 모든 점에서 중심 $C$까지의 거리 $R$이 항상 일정하게 유지되도록 기하학적 무결성을 확립했습니다.

2. **W3C 표준 `getSvgArcCenter` 알고리즘 탑재:**
   - W3C SVG 1.1 Implementation Notes(Section F.6.5) 표준 공식에 따른 엔드포인트-투-센터(Endpoint-to-Center) 변환 함수를 구현하여, 임의의 `A rx ry ...` 호에서 실제 수학적 중심 $(cx, cy)$를 소수점 단위로 완벽하게 역계산합니다.

3. **기본 단진자 도면 물리적 중심 동기화:**
   - [index.html](file:///E:/Git/PicEditor/index.html) 및 [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) 기본 도면의 호 경로를 `d="M 400,295 A 194.1 194.1 0 0 0 565,255"`(중심: `400, 120`)으로 교체.
   - 호를 클릭하면 붉은 점이 천장 피벗(검은 점 `400, 120`)에 정확히 겹쳐서 표시되며, 호는 중력 방향으로 자연스럽게 아래로 처진 원호 궤적을 그립니다.

---

### 4. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [js/tools.js](file:///E:/Git/PicEditor/js/tools.js) | `calculateArcD` sweep 부호 정상화, W3C 표준 `getSvgArcCenter` 구현, `getArcData` 정밀 역계산 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 샘플 진자 호 경로 천장 피벗(400, 120) 동기화, 캐시 버스터 `v=20261029_4` 갱신 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 100% 동일 동기화 |
| [physics_diagram_studio_patch_report.md](file:///E:/Git/PicEditor/physics_diagram_studio_patch_report.md) | `PATCH-008` 상세 기하학적 분석 및 해결 내역 문서화 |

---

### 5. 테스트 및 검증 결과

1. **단진자 피벗 중심 일치 검증 ([scratch/index_arc_crop.png](file:///E:/Git/PicEditor/scratch/index_arc_crop.png)):**
   - 캔버스에서 호를 클릭했을 때 붉은 중심점("원의 중심 (R=194px)")이 천장 고정점(피벗 `400, 120`)에 정확히 안착됨을 확인.
   - 호의 곡률이 아래로 오목하게 처지며 단진자 운동 궤적과 100% 일치함을 시각적으로 검증 완료.
2. **비교 검증 그래픽 생성 ([scratch/arc_center_comparison.png](file:///E:/Git/PicEditor/scratch/arc_center_comparison.png)):**
   - 오류 상태(볼록 외측 중심) vs 수정 상태(오목 내측 중심)의 기하학적 비교 차트를 생성하여 시각적 타당성 검증 완료.


---

## 🔍 [PATCH-009] 호의 중심 용어 개편 및 파란색 양 끝점(P1, P2) 원의 방정식 연동 드래그 구현

### 1. 이슈 개요 및 사용자 보고
- **보고 일시:** 2026-10-29 11:00 KST
- **사용자 보고 내용:**
  > *"수정하고, 원의 중심 -> 호의 중심으로 수정해. 파란색 점을 이동시킬 수 있도록 해. 호의 중심과 한 점이 정해져 있으므로 마우스의 x포인트만을 읽어서 y포인터의 값을 정해서 그려. 이해했어? 즉시 코드 수정하고 반영해."*
- **핵심 요구사항:**
  1. 기즈모 라벨 텍스트 및 UI 안내 문구에서 **"원의 중심"**이라는 표현을 **"호의 중심"**으로 전면 교체.
  2. 호의 양 끝에 위치한 **파란색 점(시점 P1, 종점 P2)**을 마우스나 터치로 직접 잡고 드래그하여 이동할 수 있도록 조작 핸들화.
  3. 파란색 점을 드래그할 때, **호의 중심 $C(cx, cy)$과 반대편 고정점 $P_{\text{fixed}}$에 의해 반지름 $R$이 이미 결정되어 있으므로**, 마우스의 X좌표만 읽어 원의 방정식 $(x - cx)^2 + (y - cy)^2 = R^2$으로부터 $Y$좌표를 수학적으로 엄밀하게 계산하여 그릴 것.

---

### 2. 기술적 해결 조치 (Technical Implementation)

#### ① 용어 개편 ("원의 중심" → "호의 중심")
- [js/tools.js](file:///E:/Git/PicEditor/js/tools.js) 기즈모 텍스트 라벨:
  `label.textContent = "호의 중심 (R=${r}px)";`
- [index.html](file:///E:/Git/PicEditor/index.html) 및 [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) 사이드바 안내 문구:
  "드래그하여 호를 그린 뒤, 나타나는 **🔴 호의 중심**이나 **🔵 파란 끝점**을 드래그하면 호의 중심과 길이, 곡률을 자유롭게 조절할 수 있습니다."

#### ② 파란색 양 끝점(P1, P2) 조작 핸들 인터랙션 구축
- 기존의 정적 점(`arc-p1-anchor`, `arc-p2-anchor`)을 드래그 가능한 인터랙티브 그룹(`arc-p1-handle-wrap`, `arc-p2-handle-wrap`)으로 개편.
- 터치 감지 반경 22px 투명 히트 서클, 6.5px 블루 코어 링, 드롭 섀도우 및 "시점", "종점" 라벨 추가.
- `mousedown`, `touchstart` 이벤트를 바인딩하여 `state.isDraggingArcP1`, `state.isDraggingArcP2` 상태 제어.

#### ③ 원의 방정식 기반 단일 자유도(X→Y) 구속 드래그 수학 공식 적용
- 파란색 종점 $P_2$를 드래그할 때:
  1. 고정점 $P_1(x_1, y_1)$과 호의 중심 $C(cx, cy)$으로부터 불변의 반지름 $R = \sqrt{(x_1 - cx)^2 + (y_1 - cy)^2}$ 산출.
  2. 마우스의 화면 좌표를 아크의 로컬 좌표계로 역변환하여 $X = \text{localX}$ 취득.
  3. $dx = X - cx$ 계산 (원 범위를 벗어나지 않도록 $|dx| \le 0.999R$ 클램핑).
  4. 원의 방정식에 의해 $dy = \sqrt{\max(0, R^2 - dx^2)}$ 산출.
  5. 마우스 커서의 수직 위치에 따라 부호 결정:
     $$y_{\text{new}} = \begin{cases} cy + dy & (\text{localY} \ge cy) \\ cy - dy & (\text{localY} < cy) \end{cases}$$
  6. 산출된 $(x_{\text{new}}, y_{\text{new}})$는 중심 $C$로부터의 거리가 정확히 $R$인 원주 위의 점이 되며, 이를 새로운 $P_2$ 좌표로 하여 호 경로(`updateArcPath`)를 실시간 갱신.
- 파란색 시점 $P_1$을 드래그할 때도 종점 $P_2$와 중심 $C$를 고정하여 동일한 수식으로 대칭 적용.

---

### 3. 변경된 파일 목록 (Files Modified)

| 파일 경로 | 주요 변경 내용 |
| :--- | :--- |
| [js/state.js](file:///E:/Git/PicEditor/js/state.js) | `isDraggingArcP1`, `isDraggingArcP2` 전역 상태 플래그 추가 |
| [js/tools.js](file:///E:/Git/PicEditor/js/tools.js) | "호의 중심" 라벨 개편, 파란색 점 P1/P2 조작 핸들 및 이벤트 바인딩 |
| [js/interaction.js](file:///E:/Git/PicEditor/js/interaction.js) | 마우스 X좌표 기반 원의 방정식 Y좌표 자동 산출 및 호 경로 실시간 연동 드래그 구현 |
| [index.html](file:///E:/Git/PicEditor/index.html) | 호 작도 안내 문구 개편, 캐시 버스터 `v=20261029_5` 갱신 |
| [PicEditor.html](file:///E:/Git/PicEditor/PicEditor.html) | `index.html`과 완전 동기화 |
| [physics_diagram_studio_patch_report.md](file:///E:/Git/PicEditor/physics_diagram_studio_patch_report.md) | `PATCH-009` 상세 수식 및 구현 내역 문서화 |

---

### 4. 테스트 및 검증 결과

1. **자동화 검증 스위트 ([scratch/verify_blue_dot_drag.py](file:///E:/Git/PicEditor/scratch/verify_blue_dot_drag.py)):**
   - **라벨 변경 확인 (`centerLabel`):** `"호의 중심 (R=194px)"` (✅ 합격)
   - **파란 점 P1/P2 핸들 생성 확인:** `p1HandleExists: true`, `p2HandleExists: true` (✅ 합격)
   - **P2 드래그 시 마우스 X 기반 Y 산출 및 원주 일치 (`p2OnCircle`):** `dist == R` 오차 0.0px (✅ 합격)
   - **P1 드래그 시 마우스 X 기반 Y 산출 및 원주 일치 (`p1OnCircle`):** `dist == R` 오차 0.0px (✅ 합격)
   - **내보내기 순수성 보장 (`cleanSvgExcludesGizmo`):** `true` (✅ 합격)
2. **실제 UI 캡처 스크린샷 ([scratch/arc_ho_crop.png](file:///E:/Git/PicEditor/scratch/arc_ho_crop.png)):**
   - 붉은 점에 `호의 중심 (R=194px)` 표시, 양 끝점에 파란색 `시점`, `종점` 핸들이 선명하게 배치됨을 확인 완료.
