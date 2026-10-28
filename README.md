# 물리 마스터 에디터 스튜디오 (PicEditor)

웹 브라우저에서 바로 실행할 수 있는 물리 문제 및 도식/도면 편집기 웹 애플리케이션입니다.

## 📁 프로젝트 모듈 구조
기존 단일 대형 파일 구조에서 기능별/역할별 모듈형 아키텍처로 분리되었습니다:

```
PicEditor/
├── index.html            # 메인 HTML 마크업 (구조화 및 시맨틱 태그)
├── PicEditor.html        # 로컬 실행 호환용 HTML
├── css/
│   └── style.css         # 툴바, 인스펙터, 캔버스 등 전체 UI 스타일시트
├── js/
│   ├── state.js          # 전역 상태 관리 (모드, 선택 요소, 드래그 상태 등)
│   ├── utils.js          # SVG 좌표 변환 및 transform 속성 계산 헬퍼
│   ├── canvas.js         # 탭 전환, viewBox 크기 조절, 텍스트 배경 박스 계산
│   ├── tools.js          # 직선, 화살표, 호(Arc) 작도 및 마커 변환
│   ├── inspector.js      # 크기, 각도(회전), 반전, 텍스트 배경 스타일 속성 제어
│   ├── interaction.js    # 마우스 드래그, 선택/이동, 모드 전환 이벤트
│   ├── export-import.js  # 고해상도 PNG 다운로드 및 외부 HTML 도면 불러오기
│   └── app.js            # 애플리케이션 부트스트랩 및 초기화 진입점
└── README.md
```

## ✨ 주요 기능
- **모드 전환**: 선택/편집 모드와 작도 모드(직선, 화살표, 호) 지원
- **실시간 속성 제어**: 크기(W/H), 45° 스냅 회전, 가로/세로 반전
- **텍스트 인스펙터**: 글자 크기(%), 배경 스타일(투명, 박스 흰색, 테두리 흰색) 지원
- **외부 불러오기 & 저장**: HTML 도면 SVG 요소 불러오기 및 300% 고해상도 PNG 내보내기

## 🚀 실행 방법
- 로컬에서 [index.html](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/PicEditor/index.html)을 더블 클릭하여 바로 실행할 수 있습니다.
- GitHub Pages 배포 시 웹 브라우저에서 바로 접속 가능합니다: `https://<사용자이름>.github.io/PicEditor/`
