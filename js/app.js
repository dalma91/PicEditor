/**
 * app.js - 애플리케이션 초기화 및 진입점
 */
window.addEventListener('DOMContentLoaded', () => {
  // 1. 도구 옵션 그룹 초기화
  window.PicEditor.tools.onToolChange();

  // 2. 초기 캔버스 정보 및 이동 요소 이벤트 초기화
  window.PicEditor.canvas.updateCanvasInfo();
  window.PicEditor.interaction.initMovableEvents();
  window.PicEditor.interaction.initGlobalEvents();

  // 캔버스 내 객체 유무에 따라 자동 모드 설정 (객체가 있으면 선택/편집 모드, 없으면 작도 모드)
  if (window.PicEditor.interaction && window.PicEditor.interaction.updateModeByObjectCount) {
    window.PicEditor.interaction.updateModeByObjectCount();
  } else {
    document.querySelectorAll('svg').forEach(svg => {
      svg.classList.add('select-mode');
    });
  }

  if (window.PicEditor.utils && window.PicEditor.utils.deselectAll) {
    window.PicEditor.utils.deselectAll();
  }

  // 3. 텍스트 배경 박스 계산
  setTimeout(() => {
    window.PicEditor.canvas.updateAllTextBgBoxes();
  }, 100);

  // 4. 로컬 미저장 임시저장본 확인
  if (window.PicEditor.sync) {
    window.PicEditor.sync.checkAutoSaveOnLoad();
  }

  console.log('물리 그래픽 편집 스튜디오 V1.1이 성공적으로 초기화되었습니다.');
});
