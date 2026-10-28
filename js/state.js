/**
 * state.js - 에디터 전역 상태 관리
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.state = {
  activeTab: 1,
  selectedElement: null,
  isDragging: false,
  startX: 0,
  startY: 0,
  isDrawMode: false,
  isDrawing: false,
  drawStart: { x: 0, y: 0 },
  tempShape: null
};
