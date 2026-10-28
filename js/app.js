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

  // 3. 텍스트 배경 박스 계산
  setTimeout(() => {
    window.PicEditor.canvas.updateAllTextBgBoxes();
  }, 100);

  console.log('물리 마스터 에디터 스튜디오가 성공적으로 초기화되었습니다.');
});
