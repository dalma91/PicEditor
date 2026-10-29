/**
 * utils.js - SVG 좌표 계산 및 변환(Transform) 헬퍼 함수
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.utils = {
  /**
   * 마우스/터치 이벤트의 화면 좌표를 SVG 내부 좌표계로 변환 (모바일 및 터치 디바이스 호환)
   */
  getSvgPoint(e, svgEl) {
    const pt = svgEl.createSVGPoint();
    const evt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    pt.x = (evt.clientX !== undefined) ? evt.clientX : (e.clientX || 0);
    pt.y = (evt.clientY !== undefined) ? evt.clientY : (e.clientY || 0);
    const svgP = pt.matrixTransform(svgEl.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  },

  /**
   * SVG transform 속성 파싱 (translate, scale, rotate)
   */
  parseTransform(el) {
    const tr = el.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)';
    const tm = tr.match(/translate\(([^,\s]+)[,\s]+([^\)]+)\)/);
    const sm = tr.match(/scale\(([^,\s]+)[,\s]+([^\)]+)\)/);
    const rm = tr.match(/rotate\(([^,\s\)]+)/);
    
    const rVal = rm ? parseFloat(rm[1]) : 0;
    return {
      x: tm ? parseFloat(tm[1]) : 0,
      y: tm ? parseFloat(tm[2]) : 0,
      sx: sm ? parseFloat(sm[1]) : 1,
      sy: sm ? parseFloat(sm[2]) : 1,
      r: parseFloat(rVal.toFixed(1))
    };
  },

  /**
   * SVG 요소에 transform 속성 적용 (회전 각도는 소수점 첫째자리 정밀도 보장)
   */
  setTransform(el, t) {
    const r = (typeof t.r === 'number') ? parseFloat(t.r.toFixed(1)) : (parseFloat(t.r) || 0);
    el.setAttribute('transform', `translate(${t.x}, ${t.y}) scale(${t.sx}, ${t.sy}) rotate(${r})`);
  },

  /**
   * 현재 활성화된 편집 SVG 엘리먼트 반환 (단일 캔버스 및 다중 캔버스 호환)
   */
  getActiveSvg() {
    return document.getElementById('svg-editor') ||
           document.getElementById(`svg-editor-${window.PicEditor.state.activeTab}`) ||
           document.querySelector('svg');
  },

  /**
   * 현재 선택된 요소 선택 해제
   */
  deselectAll() {
    const state = window.PicEditor.state;
    if (state.selectedElement) {
      const wrap = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
      wrap.classList.remove('selected');
      state.selectedElement = null;
    }
    const inspector = document.getElementById('textInspector');
    if (inspector) {
      inspector.classList.remove('active');
    }
    if (window.PicEditor.tools) {
      if (window.PicEditor.tools.hideArcCenterHandle) window.PicEditor.tools.hideArcCenterHandle();
      if (window.PicEditor.tools.hideLineHandles) window.PicEditor.tools.hideLineHandles();
    }
  },

  /**
   * 에디터 전용 기즈모 및 임시 UI 요소를 제외한 순수 SVG 문자열 반환 (활성 DOM 선택 상태 보존)
   */
  getCleanSvgString(svg) {
    if (!svg) return '';
    const clone = svg.cloneNode(true);
    const arcGizmo = clone.querySelector('#arc-center-handle-group');
    if (arcGizmo) arcGizmo.remove();
    const lineGizmo = clone.querySelector('#line-handle-group');
    if (lineGizmo) lineGizmo.remove();
    clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    return new XMLSerializer().serializeToString(clone);
  }
};

// 전역 단축 참조
window.getActiveSvg = window.PicEditor.utils.getActiveSvg;
window.deselectAll = window.PicEditor.utils.deselectAll;
