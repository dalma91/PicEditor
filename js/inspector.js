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

    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
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
    if (rRange) rRange.value = parseFloat(t.r.toFixed(1));
    if (rNum) rNum.value = parseFloat(t.r.toFixed(1));

    // 선택된 객체의 실선/점선 상태를 UI 버튼에 동기화
    if (window.PicEditor.tools && window.PicEditor.tools.getStrokeStyleOfElement) {
      const curStyle = window.PicEditor.tools.getStrokeStyleOfElement(target);
      const sel = document.getElementById('strokeStyleSelect');
      if (sel) sel.value = curStyle;

      const btnSolid = document.getElementById('btnStrokeSolid');
      const btnDashed = document.getElementById('btnStrokeDashed');
      if (btnSolid) btnSolid.classList.toggle('active', curStyle === 'solid');
      if (btnDashed) btnDashed.classList.toggle('active', curStyle === 'dashed');

      const inspSolid = document.getElementById('inspStrokeSolid');
      const inspDashed = document.getElementById('inspStrokeDashed');
      if (inspSolid) inspSolid.classList.toggle('active', curStyle === 'solid');
      if (inspDashed) inspDashed.classList.toggle('active', curStyle === 'dashed');
    }

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
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const parent = target.parentNode;
    if (parent) {
      parent.appendChild(target);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  sendToBack() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
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
  /**
   * 텍스트 요소 추출 (text-el 또는 text-wrap 호환)
   */
  getTextElement(el) {
    if (!el) return null;
    if (el.classList && el.classList.contains('text-el')) return el;
    if (el.querySelector) return el.querySelector('.text-el');
    return null;
  },

  /**
   * 텍스트 전용 인스펙터 동기화
   */
  syncTextInspector() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;

    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;
    const wrap = textEl.closest('.text-wrap') || textEl;

    // 1. 글자 내용 (Text Content)
    const contentInput = document.getElementById('textContentInput');
    if (contentInput) {
      contentInput.value = textEl.textContent || '';
    }

    // 2. 글꼴 크기 (Font Size in px)
    const sizeInput = document.getElementById('textFontSizeNum');
    if (sizeInput) {
      let fs = parseInt(textEl.getAttribute('font-size'));
      if (!fs || isNaN(fs)) {
        try {
          fs = parseInt(window.getComputedStyle(textEl).fontSize) || 24;
        } catch (e) {
          fs = 24;
        }
      }
      sizeInput.value = fs;
    }

    // 3. 글꼴 서체 (Font Family)
    const familySelect = document.getElementById('textFontFamilySelect');
    if (familySelect) {
      const ff = (textEl.getAttribute('font-family') || '').toLowerCase();
      if (ff.includes('batang') || ff.includes('바탕')) {
        familySelect.value = "'Batang', serif";
      } else if (ff.includes('malgun') || ff.includes('맑은')) {
        familySelect.value = "'Malgun Gothic', sans-serif";
      } else if (ff.includes('times')) {
        familySelect.value = "'Times New Roman', serif";
      } else if (ff.includes('sans')) {
        familySelect.value = "sans-serif";
      } else {
        familySelect.value = "'Times New Roman', serif";
      }
    }

    // 4. 이탤릭 및 볼드 서식 상태
    const italicBtn = document.getElementById('textItalicBtn');
    if (italicBtn) {
      let isItalic = (textEl.getAttribute('font-style') === 'italic');
      if (!isItalic) {
        try {
          isItalic = (window.getComputedStyle(textEl).fontStyle === 'italic');
        } catch (e) {}
      }
      italicBtn.classList.toggle('active', !!isItalic);
    }

    const boldBtn = document.getElementById('textBoldBtn');
    if (boldBtn) {
      let fw = textEl.getAttribute('font-weight') || '';
      if (!fw) {
        try {
          fw = window.getComputedStyle(textEl).fontWeight || '';
        } catch (e) {}
      }
      const isBold = (fw === 'bold' || fw === '700' || parseInt(fw) >= 600);
      boldBtn.classList.toggle('active', !!isBold);
    }

    // 5. 글자 색상 (Color)
    const colorPicker = document.getElementById('textColorPicker');
    if (colorPicker) {
      let fill = textEl.getAttribute('fill') || '#000000';
      if (fill.startsWith('#') && fill.length === 7) {
        colorPicker.value = fill;
      } else {
        colorPicker.value = '#000000';
      }
    }

    // 6. 스케일 배율 (Transform Scale %)
    const t = window.PicEditor.utils.parseTransform(wrap);
    const pct = Math.round(Math.abs(t.sx) * 100);
    const scaleRange = document.getElementById('textScaleRange');
    const scaleNum = document.getElementById('textScaleNum');
    if (scaleRange) scaleRange.value = Math.min(200, Math.max(0, pct));
    if (scaleNum) scaleNum.value = pct;

    // 7. 배경 모드 (투명, 흰색 박스, 외곽선 흰색)
    const bgSelect = document.getElementById('textBgModeSelect');
    let mode = 'transparent';
    if (wrap.classList.contains('bg-box-white')) mode = 'box-white';
    else if (textEl.classList.contains('bg-stroke-white')) mode = 'stroke-white';
    if (bgSelect) bgSelect.value = mode;
  },

  /**
   * 텍스트 내용 실시간 수정
   */
  onTextInput(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;

    textEl.textContent = val;
    const wrap = textEl.closest('.text-wrap');
    if (wrap && window.PicEditor.canvas) {
      window.PicEditor.canvas.updateSingleTextBgBox(wrap);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 자주 쓰는 물리 특수기호 삽입
   */
  insertSymbol(sym) {
    const input = document.getElementById('textContentInput');
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const val = input.value;
    input.value = val.substring(0, start) + sym + val.substring(end);
    input.selectionStart = input.selectionEnd = start + sym.length;
    input.focus();
    this.onTextInput(input.value);
  },

  /**
   * 폰트 크기(px) 변경
   */
  onTextFontSize(size) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;

    const num = Math.max(6, parseInt(size) || 24);
    textEl.setAttribute('font-size', num);
    const wrap = textEl.closest('.text-wrap');
    if (wrap && window.PicEditor.canvas) {
      window.PicEditor.canvas.updateSingleTextBgBox(wrap);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 폰트 서체(Font-Family) 변경
   */
  onTextFontFamily(family) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;

    textEl.setAttribute('font-family', family);
    const wrap = textEl.closest('.text-wrap');
    if (wrap && window.PicEditor.canvas) {
      window.PicEditor.canvas.updateSingleTextBgBox(wrap);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 이탤릭(기울임꼴) 서식 토글
   */
  toggleTextItalic() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;

    const cur = textEl.getAttribute('font-style') || 'normal';
    const next = (cur === 'italic') ? 'normal' : 'italic';
    textEl.setAttribute('font-style', next);

    const btn = document.getElementById('textItalicBtn');
    if (btn) btn.classList.toggle('active', next === 'italic');

    const wrap = textEl.closest('.text-wrap');
    if (wrap && window.PicEditor.canvas) {
      window.PicEditor.canvas.updateSingleTextBgBox(wrap);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 굵게(Bold) 서식 토글
   */
  toggleTextBold() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;

    const cur = textEl.getAttribute('font-weight') || 'normal';
    const isBold = (cur === 'bold' || cur === '700' || parseInt(cur) >= 600);
    const next = isBold ? 'normal' : 'bold';
    textEl.setAttribute('font-weight', next);

    const btn = document.getElementById('textBoldBtn');
    if (btn) btn.classList.toggle('active', next === 'bold');

    const wrap = textEl.closest('.text-wrap');
    if (wrap && window.PicEditor.canvas) {
      window.PicEditor.canvas.updateSingleTextBgBox(wrap);
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 글자 색상 변경
   */
  onTextColor(color) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;

    textEl.setAttribute('fill', color);
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 캔버스 위에서 더블클릭 시 인라인 텍스트 편집기 띄우기
   */
  startInlineTextEdit(textEl) {
    if (!textEl) return;
    let editor = document.getElementById('canvasInlineTextInput');
    if (!editor) {
      editor = document.createElement('input');
      editor.id = 'canvasInlineTextInput';
      editor.className = 'canvas-inline-editor';
      editor.type = 'text';
      document.body.appendChild(editor);
    }

    const wrap = textEl.closest('.text-wrap') || textEl;
    const rect = textEl.getBoundingClientRect();
    let cs;
    try {
      cs = window.getComputedStyle(textEl);
    } catch (e) {
      cs = {};
    }

    editor.style.left = `${Math.round(rect.left)}px`;
    editor.style.top = `${Math.round(rect.top)}px`;
    editor.style.fontSize = cs.fontSize || '20px';
    editor.style.fontFamily = cs.fontFamily || "'Times New Roman', serif";
    editor.style.fontStyle = cs.fontStyle || 'normal';
    editor.style.fontWeight = cs.fontWeight || 'normal';
    editor.style.color = textEl.getAttribute('fill') || '#000000';
    editor.style.display = 'block';
    editor.value = textEl.textContent.trim();

    editor.oninput = () => {
      textEl.textContent = editor.value;
      const inputEl = document.getElementById('textContentInput');
      if (inputEl) inputEl.value = editor.value;
      if (wrap && window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
    };

    const finish = () => {
      editor.style.display = 'none';
      if (wrap && window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    };

    editor.onkeydown = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        finish();
      } else if (e.key === 'Escape') {
        editor.style.display = 'none';
      }
    };

    editor.onblur = finish;
    editor.focus();
    editor.select();
  },

  /**
   * 글자 크기 (%) 조절 슬라이더
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
        bgRect.setAttribute('fill', '#ffffff');
        bgRect.setAttribute('stroke', 'none');
        bgRect.setAttribute('stroke-width', '0');
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
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
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
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
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
    const parsed = parseFloat(parseFloat(val).toFixed(1));
    if (numEl) numEl.value = parsed;
    this.applyRotate(parsed);
  },

  onRotateNumber(val) {
    if (val === '') return;
    const num = parseFloat(parseFloat(val).toFixed(1));
    const numEl = document.getElementById('rotateNum');
    const rangeEl = document.getElementById('rotateRange');
    if (numEl) numEl.value = num;
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

    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const t = window.PicEditor.utils.parseTransform(target);
    t.r = angle;
    window.PicEditor.utils.setTransform(target, t);
    if (window.PicEditor.tools) {
      if (window.PicEditor.tools.updateGizmosTransform) {
        window.PicEditor.tools.updateGizmosTransform(target);
      }
      if (window.PicEditor.tools.updateAxesLabelsOrientation) {
        window.PicEditor.tools.updateAxesLabelsOrientation(target);
      }
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
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
    const t = window.PicEditor.utils.parseTransform(target);
    if (direction === 'H') t.sx *= -1;
    if (direction === 'V') t.sy *= -1;
    window.PicEditor.utils.setTransform(target, t);
    if (window.PicEditor.tools) {
      if (window.PicEditor.tools.updateGizmosTransform) {
        window.PicEditor.tools.updateGizmosTransform(target);
      }
      if (window.PicEditor.tools.updateAxesLabelsOrientation) {
        window.PicEditor.tools.updateAxesLabelsOrientation(target);
      }
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 선택된 요소 삭제
   */
  deleteSelected() {
    const state = window.PicEditor.state;
    if (state.selectedElement) {
      const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
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
window.onTextInput = (v) => window.PicEditor.inspector.onTextInput(v);
window.insertSymbol = (s) => window.PicEditor.inspector.insertSymbol(s);
window.onTextFontSize = (s) => window.PicEditor.inspector.onTextFontSize(s);
window.onTextFontFamily = (f) => window.PicEditor.inspector.onTextFontFamily(f);
window.toggleTextItalic = () => window.PicEditor.inspector.toggleTextItalic();
window.toggleTextBold = () => window.PicEditor.inspector.toggleTextBold();
window.onTextColor = (c) => window.PicEditor.inspector.onTextColor(c);
window.startInlineTextEdit = (el) => window.PicEditor.inspector.startInlineTextEdit(el);
window.onObjectWidthInput = (v) => window.PicEditor.inspector.onObjectWidthInput(v);
window.onObjectHeightInput = (v) => window.PicEditor.inspector.onObjectHeightInput(v);
window.onRotateSlider = (v) => window.PicEditor.inspector.onRotateSlider(v);
window.onRotateNumber = (v) => window.PicEditor.inspector.onRotateNumber(v);
window.flipElement = (d) => window.PicEditor.inspector.flipElement(d);
window.deleteSelected = () => window.PicEditor.inspector.deleteSelected();
