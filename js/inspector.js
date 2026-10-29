/**
 * inspector.js - 속성 인스펙터 (크기, 회전, 반전, 글자 배경, 이미지 투명도 및 레이어 순서)
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.inspector = {
  /**
   * 선택된 요소의 속성을 상단 UI 컨트롤에 동기화
   */
  syncUItoSelected() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;

    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const tag = target.tagName.toLowerCase();
    const bbox = target.getBBox();
    const t = window.PicEditor.utils.parseTransform(target);
    
    const realW = Math.round(bbox.width * Math.abs(t.sx));
    const realH = Math.round(bbox.height * Math.abs(t.sy));

    const wNum = document.getElementById('objWidthNum');
    const hNum = document.getElementById('objHeightNum');
    const rRange = document.getElementById('rotateRange');
    const rNum = document.getElementById('rotateNum');

    if (wNum) wNum.value = realW > 0 ? realW : 10;
    if (hNum) hNum.value = realH > 0 ? realH : 10;
    if (rRange) rRange.value = t.r;
    if (rNum) rNum.value = Math.round(t.r);

    const textInspector = document.getElementById('textInspector');
    const imageInspector = document.getElementById('imageInspector');

    if (tag === 'image') {
      if (imageInspector) imageInspector.classList.add('active');
      if (textInspector) textInspector.classList.remove('active');
      this.syncImageInspector(target);
    } else if (target.classList.contains('text-wrap') || state.selectedElement.classList.contains('text-el')) {
      if (textInspector) textInspector.classList.add('active');
      if (imageInspector) imageInspector.classList.remove('active');
      this.syncTextInspector();
    } else {
      if (textInspector) textInspector.classList.remove('active');
      if (imageInspector) imageInspector.classList.remove('active');
    }
  },

  /**
   * 이미지 전용 인스펙터 동기화
   */
  syncImageInspector(imgEl) {
    let opacity = parseFloat(imgEl.getAttribute('opacity') || 1);
    let pct = Math.round(opacity * 100);

    const opRange = document.getElementById('imgOpacityRange');
    const opNum = document.getElementById('imgOpacityNum');
    if (opRange) opRange.value = pct;
    if (opNum) opNum.value = pct;
  },

  /**
   * 이미지 투명도 조절
   */
  onImageOpacitySlider(val) {
    const numEl = document.getElementById('imgOpacityNum');
    if (numEl) numEl.value = val;
    this.applyImageOpacity(val);
  },

  onImageOpacityNumber(val) {
    if (val === '') return;
    const num = parseFloat(val);
    const rangeEl = document.getElementById('imgOpacityRange');
    if (rangeEl) rangeEl.value = num;
    this.applyImageOpacity(num);
  },

  applyImageOpacity(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('image') || state.selectedElement;
    if (target.tagName.toLowerCase() === 'image') {
      const op = Math.max(0.05, Math.min(1.0, parseFloat(val) / 100));
      target.setAttribute('opacity', op);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  /**
   * 레이어 순서 제어 (맨 앞으로 / 맨 뒤로)
   */
  bringToFront() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const parent = target.parentNode;
    if (parent) {
      parent.appendChild(target);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  sendToBack() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const parent = target.parentNode;
    if (parent) {
      parent.insertBefore(target, parent.firstChild);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  /**
   * 캔버스 크기를 현재 선택된 이미지 크기에 맞추기
   */
  fitCanvasToSelectedImage() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('image') || state.selectedElement;
    if (target.tagName.toLowerCase() === 'image') {
      const bbox = target.getBBox();
      const activeSvg = window.PicEditor.utils.getActiveSvg();
      if (activeSvg && bbox.width > 0 && bbox.height > 0) {
        activeSvg.setAttribute('viewBox', `0 0 ${Math.round(bbox.width)} ${Math.round(bbox.height)}`);
        window.PicEditor.canvas.updateCanvasInfo();
      }
    }
  },

  /**
   * 텍스트 전용 인스펙터 동기화
   */
  syncTextInspector() {
    const state = window.PicEditor.state;
    if (!state.selectedElement || !state.selectedElement.classList.contains('text-el')) return;

    const wrap = state.selectedElement.closest('.text-wrap');
    const t = window.PicEditor.utils.parseTransform(wrap);
    const pct = Math.round(Math.abs(t.sx) * 100);
    
    const scaleRange = document.getElementById('textScaleRange');
    const scaleNum = document.getElementById('textScaleNum');
    const bgSelect = document.getElementById('textBgModeSelect');

    // 슬라이더 범위 (0 ~ 200, 중앙 100%)
    if (scaleRange) scaleRange.value = Math.min(200, Math.max(0, pct));
    if (scaleNum) scaleNum.value = pct;

    let mode = 'transparent';
    if (wrap.classList.contains('bg-box-white')) mode = 'box-white';
    else if (state.selectedElement.classList.contains('bg-stroke-white')) mode = 'stroke-white';
    
    if (bgSelect) bgSelect.value = mode;
  },

  /**
   * 글자 크기 (%) 조절 (0~200% 범위, 100%가 슬라이더 정중앙 위치)
   */
  onTextScaleSlider(val) {
    const numEl = document.getElementById('textScaleNum');
    if (numEl) numEl.value = val;
    this.applyTextScale(val);
  },

  onTextScaleNumber(val) {
    if (val === '') return;
    const num = parseFloat(val);
    const rangeEl = document.getElementById('textScaleRange');
    if (rangeEl) rangeEl.value = Math.min(200, Math.max(0, num));
    this.applyTextScale(num);
  },

  applyTextScale(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement || !state.selectedElement.classList.contains('text-el')) return;

    const pct = Math.max(10, parseInt(val) || 100);
    const scale = pct / 100;
    const wrap = state.selectedElement.closest('.text-wrap');
    const t = window.PicEditor.utils.parseTransform(wrap);
    
    const signX = t.sx < 0 ? -1 : 1;
    const signY = t.sy < 0 ? -1 : 1;
    t.sx = scale * signX;
    t.sy = scale * signY;
    window.PicEditor.utils.setTransform(wrap, t);

    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 글자 배경 스타일 변경 (투명, 흰색 박스, 외곽선 흰색)
   */
  onChangeTextBgMode(mode) {
    const state = window.PicEditor.state;
    if (!state.selectedElement || !state.selectedElement.classList.contains('text-el')) return;

    const wrap = state.selectedElement.closest('.text-wrap');
    wrap.classList.remove('bg-box-white');
    state.selectedElement.classList.remove('bg-stroke-white');
    state.selectedElement.removeAttribute('paint-order');
    state.selectedElement.removeAttribute('stroke');
    state.selectedElement.removeAttribute('stroke-width');

    if (mode === 'box-white') {
      wrap.classList.add('bg-box-white');
      const textEl = wrap.querySelector('.text-el');
      const bgRect = wrap.querySelector('.text-bg-rect');
      if (textEl && bgRect) {
        const bbox = textEl.getBBox();
        bgRect.setAttribute('x', bbox.x - 4);
        bgRect.setAttribute('y', bbox.y - 3);
        bgRect.setAttribute('width', bbox.width + 8);
        bgRect.setAttribute('height', bbox.height + 6);
      }
    } else if (mode === 'stroke-white') {
      state.selectedElement.classList.add('bg-stroke-white');
      state.selectedElement.setAttribute('paint-order', 'stroke fill');
      state.selectedElement.setAttribute('stroke', '#FFFFFF');
      state.selectedElement.setAttribute('stroke-width', '5px');
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 가로/세로 직접 입력 크기 조절
   */
  onObjectWidthInput(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement || val === '') return;

    const targetW = parseFloat(val);
    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const bbox = target.getBBox();
    if (bbox.width === 0) return;
    
    const t = window.PicEditor.utils.parseTransform(target);
    const signX = t.sx < 0 ? -1 : 1;
    t.sx = (targetW / bbox.width) * signX;
    window.PicEditor.utils.setTransform(target, t);
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  onObjectHeightInput(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement || val === '') return;

    const targetH = parseFloat(val);
    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const bbox = target.getBBox();
    if (bbox.height === 0) return;
    
    const t = window.PicEditor.utils.parseTransform(target);
    const signY = t.sy < 0 ? -1 : 1;
    t.sy = (targetH / bbox.height) * signY;
    window.PicEditor.utils.setTransform(target, t);
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 회전 각도 조절 (슬라이더 / 숫자 입력)
   */
  onRotateSlider(val) {
    const numEl = document.getElementById('rotateNum');
    if (numEl) numEl.value = val;
    this.applyRotate(val);
  },

  onRotateNumber(val) {
    if (val === '') return;
    const num = parseFloat(val);
    const rangeEl = document.getElementById('rotateRange');
    if (rangeEl) rangeEl.value = num;
    this.applyRotate(num);
  },

  applyRotate(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;

    let angle = parseFloat(val);
    const snapCheck = document.getElementById('snapCheck');
    if (snapCheck && snapCheck.checked) {
      angle = Math.round(angle / 45) * 45;
      const rangeEl = document.getElementById('rotateRange');
      const numEl = document.getElementById('rotateNum');
      if (rangeEl) rangeEl.value = angle;
      if (numEl) numEl.value = angle;
    }

    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const t = window.PicEditor.utils.parseTransform(target);
    t.r = angle;
    window.PicEditor.utils.setTransform(target, t);
    if (window.PicEditor.tools && window.PicEditor.tools.isArcElement(target)) {
      window.PicEditor.tools.updateArcGizmoTransform(target);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 요소 반전 (가로 H / 세로 V)
   */
  flipElement(direction) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) {
      alert('반전할 요소를 먼저 선택해 주세요.');
      return;
    }
    const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const t = window.PicEditor.utils.parseTransform(target);
    if (direction === 'H') t.sx *= -1;
    if (direction === 'V') t.sy *= -1;
    window.PicEditor.utils.setTransform(target, t);
    if (window.PicEditor.tools && window.PicEditor.tools.isArcElement(target)) {
      window.PicEditor.tools.updateArcGizmoTransform(target);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 선택된 요소 삭제
   */
  deleteSelected() {
    const state = window.PicEditor.state;
    if (state.selectedElement) {
      const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
      if (state.selectedElement.id) {
        const svg = window.PicEditor.utils.getActiveSvg();
        const midG = svg ? svg.querySelector(`g.mid-arrow[data-for="${state.selectedElement.id}"]`) : null;
        if (midG) midG.remove();
      }
      target.remove();
      window.PicEditor.utils.deselectAll();
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    } else {
      alert('삭제할 요소를 먼저 클릭하여 선택해 주세요.');
    }
  }
};

// 전역 단축 참조
window.syncUItoSelected = () => window.PicEditor.inspector.syncUItoSelected();
window.syncTextInspector = () => window.PicEditor.inspector.syncTextInspector();
window.onImageOpacitySlider = (v) => window.PicEditor.inspector.onImageOpacitySlider(v);
window.onImageOpacityNumber = (v) => window.PicEditor.inspector.onImageOpacityNumber(v);
window.bringToFront = () => window.PicEditor.inspector.bringToFront();
window.sendToBack = () => window.PicEditor.inspector.sendToBack();
window.fitCanvasToSelectedImage = () => window.PicEditor.inspector.fitCanvasToSelectedImage();
window.onTextScaleSlider = (v) => window.PicEditor.inspector.onTextScaleSlider(v);
window.onTextScaleNumber = (v) => window.PicEditor.inspector.onTextScaleNumber(v);
window.onChangeTextBgMode = (m) => window.PicEditor.inspector.onChangeTextBgMode(m);
window.onObjectWidthInput = (v) => window.PicEditor.inspector.onObjectWidthInput(v);
window.onObjectHeightInput = (v) => window.PicEditor.inspector.onObjectHeightInput(v);
window.onRotateSlider = (v) => window.PicEditor.inspector.onRotateSlider(v);
window.onRotateNumber = (v) => window.PicEditor.inspector.onRotateNumber(v);
window.flipElement = (d) => window.PicEditor.inspector.flipElement(d);
window.deleteSelected = () => window.PicEditor.inspector.deleteSelected();
