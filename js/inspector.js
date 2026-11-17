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

    // 만약 선택된 대상이 그룹에 속해 있다면 그룹 요소를 최상위 대상으로 지정
    const groupWrap = state.selectedElement.closest ? state.selectedElement.closest('.group-wrap') : null;

    // 만약 선택된 대상이 텍스트 관련이면 textEl와 wrap을 정확히 결정
    const textEl = !groupWrap ? this.getTextElement(state.selectedElement) : null;
    const wrap = groupWrap || (textEl ? this.getTextWrap(textEl) : (state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement));
    const target = wrap;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    let bbox = { width: 40, height: 20 };
    try {
      bbox = target.getBBox();
    } catch (e) {
      if (textEl) {
        try { bbox = textEl.getBBox(); } catch (err) {}
      }
    }

    const t = window.PicEditor.utils.parseTransform(target);
    const realW = Math.round((bbox.width || 40) * Math.abs(t.sx || 1));
    const realH = Math.round((bbox.height || 20) * Math.abs(t.sy || 1));

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
    const shapeInspector = document.getElementById('shapeInspector');
    const groupInspector = document.getElementById('groupInspector');

    const isGroup = window.PicEditor.tools && window.PicEditor.tools.isGroupElement(target);
    const isShape = window.PicEditor.tools && window.PicEditor.tools.isShapeElement(target);

    [textInspector, imageInspector, shapeInspector, groupInspector].forEach(el => {
      if (el) el.classList.remove('active');
    });

    if (isGroup) {
      if (groupInspector) groupInspector.classList.add('active');
      const bgMode = target.getAttribute('data-bg-mode') || 'transparent';
      const radT = document.getElementById('groupBgTransparent') || document.getElementById('groupBgTrans');
      const radW = document.getElementById('groupBgWhite');
      if (radT) radT.checked = (bgMode === 'transparent');
      if (radW) radW.checked = (bgMode === 'white');

      const btnTrans = document.getElementById('btnGroupBgTrans');
      const btnWhite = document.getElementById('btnGroupBgWhite');
      if (btnTrans) btnTrans.classList.toggle('active', bgMode === 'transparent');
      if (btnWhite) btnWhite.classList.toggle('active', bgMode === 'white');

      this.updateGroupBgBox(target);
    } else if (tag === 'image') {
      if (imageInspector) imageInspector.classList.add('active');
      this.syncImageInspector(target);
    } else if (textEl || target.classList.contains('text-wrap') || this.getTextElement(target)) {
      if (textInspector) textInspector.classList.add('active');
      this.syncTextInspector();
    } else if (isShape) {
      if (shapeInspector) shapeInspector.classList.add('active');
      this.syncShapeInspector(target);
    }

    // 소속 레이어 드롭다운 동기화
    const layerSelect = document.getElementById('objLayerSelect');
    if (layerSelect && target) {
      if (target.closest('.text-layer')) layerSelect.value = 'text-layer';
      else if (target.closest('.bg-layer')) layerSelect.value = 'bg-layer';
      else if (target.closest('.front-layer')) layerSelect.value = 'front-layer';
      else layerSelect.value = 'main-diagram';
    }

    // 선/화살표 선택 시 양쪽 머리크기 일치 옵션 표시 연동
    const arrowGrp = document.getElementById('arrowOptionGroup');
    const equalOpt = document.getElementById('arrowHeadEqualOption');
    if (tag === 'line') {
      const ms = target.getAttribute('marker-start');
      const me = target.getAttribute('marker-end');
      if (ms && me) {
        if (arrowGrp) arrowGrp.style.display = 'flex';
        if (equalOpt) equalOpt.style.display = 'flex';
        const isEq = ms.includes('arrow-equal') && me.includes('arrow-equal');
        const eqCheck = document.getElementById('arrowHeadEqualCheck');
        if (eqCheck) eqCheck.checked = isEq;
      }
    }
  },

  /**
   * 도형 채우기 및 옵션 인스펙터 동기화
   */
  syncShapeInspector(target) {
    if (!target) return;
    const fillTransparentCheck = document.getElementById('shapeFillTransparent');
    const fillColorInput = document.getElementById('shapeFillColor');
    const fillColorHex = document.getElementById('shapeFillColorHex');
    const patternSelect = document.getElementById('shapePatternSelect');
    const fillColorRow = document.getElementById('shapeFillColorRow');

    const curFill = target.getAttribute('fill') || '';
    const curOpacity = target.getAttribute('fill-opacity');
    const isTransparent = (curFill === 'none' || curOpacity === '0');

    if (fillTransparentCheck) fillTransparentCheck.checked = isTransparent;
    if (fillColorRow) fillColorRow.style.opacity = isTransparent ? '0.5' : '1';

    if (curFill.startsWith('url(#pattern-')) {
      const match = curFill.match(/url\(#pattern-([^)]+)\)/);
      if (match && patternSelect) {
        patternSelect.value = match[1];
      }
    } else {
      if (patternSelect) patternSelect.value = 'none';
      if (curFill.startsWith('#') && fillColorInput) {
        fillColorInput.value = curFill;
        if (fillColorHex) fillColorHex.textContent = curFill;
      }
    }
  },

  onShapeFillTransparent(isTransparent) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest ? (state.selectedElement.closest('polygon, rect, circle, ellipse, path') || state.selectedElement) : state.selectedElement;

    const fillColorRow = document.getElementById('shapeFillColorRow');
    if (fillColorRow) fillColorRow.style.opacity = isTransparent ? '0.5' : '1';

    if (isTransparent) {
      const curFill = target.getAttribute('fill');
      if (curFill && curFill !== 'none') target.setAttribute('data-prev-fill', curFill);
      target.setAttribute('fill', 'none');
    } else {
      const patternSelect = document.getElementById('shapePatternSelect');
      const pattern = patternSelect ? patternSelect.value : 'none';
      if (pattern !== 'none') {
        target.setAttribute('fill', `url(#pattern-${pattern})`);
      } else {
        const prevFill = target.getAttribute('data-prev-fill');
        const color = document.getElementById('shapeFillColor') ? document.getElementById('shapeFillColor').value : '#e2e8f0';
        target.setAttribute('fill', prevFill && prevFill !== 'none' ? prevFill : color);
      }
    }
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  onShapeFillColor(color) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest ? (state.selectedElement.closest('polygon, rect, circle, ellipse, path') || state.selectedElement) : state.selectedElement;

    const fillTransparentCheck = document.getElementById('shapeFillTransparent');
    if (fillTransparentCheck) fillTransparentCheck.checked = false;
    const fillColorRow = document.getElementById('shapeFillColorRow');
    if (fillColorRow) fillColorRow.style.opacity = '1';

    const hexLabel = document.getElementById('shapeFillColorHex');
    if (hexLabel) hexLabel.textContent = color;

    const patternSelect = document.getElementById('shapePatternSelect');
    if (patternSelect) patternSelect.value = 'none';

    target.setAttribute('fill', color);
    target.removeAttribute('fill-opacity');
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  onShapePattern(patternName) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest ? (state.selectedElement.closest('polygon, rect, circle, ellipse, path') || state.selectedElement) : state.selectedElement;

    const fillTransparentCheck = document.getElementById('shapeFillTransparent');
    if (fillTransparentCheck) fillTransparentCheck.checked = false;
    const fillColorRow = document.getElementById('shapeFillColorRow');
    if (fillColorRow) fillColorRow.style.opacity = '1';

    if (patternName === 'none') {
      const color = document.getElementById('shapeFillColor') ? document.getElementById('shapeFillColor').value : '#e2e8f0';
      target.setAttribute('fill', color);
    } else {
      const svg = target.closest('svg') || window.PicEditor.utils.getActiveSvg();
      if (window.PicEditor.tools && window.PicEditor.tools.ensurePatternDefs) {
        window.PicEditor.tools.ensurePatternDefs(svg);
      }
      target.setAttribute('fill', `url(#pattern-${patternName})`);
    }
    target.removeAttribute('fill-opacity');
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
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
   * SVG 내 4개 기본 레이어 보장 및 반환 (배경, 도형, 텍스트, 최상위)
   */
  ensureLayers(svg) {
    if (!svg) svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return null;
    let bgLayer = svg.querySelector('.bg-layer');
    let mainGrp = svg.querySelector('.main-diagram');
    let textLayer = svg.querySelector('.text-layer');
    let frontLayer = svg.querySelector('.front-layer');

    if (!bgLayer) {
      bgLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      bgLayer.setAttribute('class', 'bg-layer');
      if (mainGrp) svg.insertBefore(bgLayer, mainGrp);
      else svg.appendChild(bgLayer);
    }
    if (!mainGrp) {
      mainGrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
      mainGrp.setAttribute('class', 'main-diagram');
      svg.appendChild(mainGrp);
    }
    if (!textLayer) {
      textLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      textLayer.setAttribute('class', 'text-layer');
      svg.appendChild(textLayer);
    }
    if (!frontLayer) {
      frontLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      frontLayer.setAttribute('class', 'front-layer');
      svg.appendChild(frontLayer);
    }
    return { bgLayer, mainGrp, textLayer, frontLayer };
  },

  /**
   * 선택된 요소의 소속 레이어 변경 ('main-diagram', 'text-layer', 'bg-layer', 'front-layer')
   */
  changeSelectedLayer(layerClass) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement.closest('.group-wrap') || state.selectedElement;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg || !target) return;

    this.ensureLayers(svg);
    let targetContainer = svg.querySelector(`.${layerClass}`);
    if (targetContainer && targetContainer !== target.parentNode) {
      targetContainer.appendChild(target);
      if (window.PicEditor.tools && window.PicEditor.tools.updateGizmosTransform) {
        window.PicEditor.tools.updateGizmosTransform(target);
      }
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  /**
   * 레이어 순서 제어 (맨 앞으로 / 앞으로 1단계 / 뒤로 1단계 / 맨 뒤로)
   */
  bringToFront() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement.closest('.group-wrap') || state.selectedElement;
    const parent = target.parentNode;
    if (parent) {
      parent.appendChild(target);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  bringForward() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement.closest('.group-wrap') || state.selectedElement;
    const next = target.nextElementSibling;
    if (next && target.parentNode) {
      target.parentNode.insertBefore(next, target);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  sendBackward() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement.closest('.group-wrap') || state.selectedElement;
    const prev = target.previousElementSibling;
    if (prev && target.parentNode) {
      target.parentNode.insertBefore(target, prev);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  sendToBack() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement.closest('.group-wrap') || state.selectedElement;
    const parent = target.parentNode;
    if (parent) {
      parent.insertBefore(target, parent.firstElementChild);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  /**
   * 선택된 다중 객체들을 하나의 그룹으로 묶기
   */
  createGroup() {
    const state = window.PicEditor.state;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    let items = (state.selectedElements && state.selectedElements.length >= 2)
      ? [...state.selectedElements]
      : (state.selectedElement ? [state.selectedElement] : []);

    if (items.length < 2) {
      alert('그룹화할 개체들을 Shift 키를 누른 채 클릭하여 2개 이상 선택해 주세요.');
      return;
    }

    const firstCanonical = items[0].closest('.axes-wrap') || items[0].closest('.text-wrap') || items[0].closest('.group-wrap') || items[0];
    const parent = firstCanonical.parentNode || svg.querySelector('.main-diagram') || svg;

    const groupG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    groupG.setAttribute('class', 'movable group-wrap');
    groupG.setAttribute('data-group', 'true');
    groupG.setAttribute('data-bg-mode', 'transparent');
    groupG.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');

    // 흰색 배경 선택 시 표시될 배경 rect
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute('class', 'group-bg-rect');
    bgRect.setAttribute('fill', '#ffffff');
    bgRect.setAttribute('stroke', 'none');
    bgRect.setAttribute('stroke-width', '0');
    bgRect.setAttribute('style', 'display:none; pointer-events:all;');
    groupG.appendChild(bgRect);

    // 선택된 아이템들을 그룹 안으로 이동
    items.forEach(el => {
      const canonical = el.closest('.axes-wrap') || el.closest('.text-wrap') || el.closest('.group-wrap') || el;
      canonical.classList.remove('selected');
      groupG.appendChild(canonical);
    });

    parent.appendChild(groupG);
    this.updateGroupBgBox(groupG);

    window.PicEditor.interaction.initMovableEvents();
    window.PicEditor.utils.deselectAll();

    state.selectedElement = groupG;
    state.selectedElements = [groupG];
    groupG.classList.add('selected');

    this.syncUItoSelected();
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 선택된 그룹 해제
   */
  ungroup() {
    const state = window.PicEditor.state;
    let groupG = null;
    if (state.selectedElement && state.selectedElement.closest) {
      groupG = state.selectedElement.closest('.group-wrap');
    }
    if (!groupG && state.selectedElements && state.selectedElements.length > 0) {
      for (let el of state.selectedElements) {
        if (el && el.closest) {
          const g = el.closest('.group-wrap');
          if (g) { groupG = g; break; }
        }
      }
    }
    if (!groupG) {
      alert('해제할 그룹 요소를 먼저 선택해 주세요.');
      return;
    }

    const svg = window.PicEditor.utils.getActiveSvg();
    const parent = groupG.parentNode || svg.querySelector('.main-diagram') || svg;
    const gt = window.PicEditor.utils.parseTransform(groupG);

    const bgRect = groupG.querySelector('.group-bg-rect');
    if (bgRect) bgRect.remove();

    const children = Array.from(groupG.children).filter(ch => ch !== bgRect && !ch.classList.contains('group-bg-rect'));
    const unwrapped = [];

    children.forEach(ch => {
      const ct = window.PicEditor.utils.parseTransform(ch);
      ct.x += gt.x;
      ct.y += gt.y;
      ct.r = (ct.r || 0) + (gt.r || 0);
      window.PicEditor.utils.setTransform(ch, ct);
      ch.classList.add('movable');

      parent.appendChild(ch);
      unwrapped.push(ch);
    });

    groupG.remove();
    window.PicEditor.interaction.initMovableEvents();
    window.PicEditor.utils.deselectAll();

    state.selectedElements = unwrapped;
    if (unwrapped.length > 0) {
      state.selectedElement = unwrapped[0];
      unwrapped.forEach(el => el.classList.add('selected'));
    }
    this.syncUItoSelected();
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 그룹 배경 모드 설정 ('transparent' | 'white')
   */
  setGroupBgMode(mode) {
    const state = window.PicEditor.state;
    let groupG = null;
    if (state.selectedElement && state.selectedElement.closest) {
      groupG = state.selectedElement.closest('.group-wrap');
    }
    if (!groupG && state.selectedElements && state.selectedElements.length > 0) {
      for (let el of state.selectedElements) {
        if (el && el.closest) {
          const g = el.closest('.group-wrap');
          if (g) { groupG = g; break; }
        }
      }
    }
    if (!groupG) return;

    groupG.setAttribute('data-bg-mode', mode);
    let bgRect = groupG.querySelector('.group-bg-rect');
    if (!bgRect) {
      bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute('class', 'group-bg-rect');
      bgRect.setAttribute('rx', '4');
      groupG.insertBefore(bgRect, groupG.firstChild);
    } else {
      if (groupG.firstChild !== bgRect) {
        groupG.insertBefore(bgRect, groupG.firstChild);
      }
    }

    if (mode === 'white') {
      bgRect.removeAttribute('display');
      bgRect.style.display = 'block';
      bgRect.setAttribute('fill', '#ffffff');
      bgRect.setAttribute('fill-opacity', '1');
      bgRect.setAttribute('stroke', 'none');
      bgRect.setAttribute('stroke-width', '0');
      this.updateGroupBgBox(groupG);
    } else {
      bgRect.style.display = 'none';
      bgRect.setAttribute('display', 'none');
      bgRect.setAttribute('fill', 'none');
      bgRect.setAttribute('stroke', 'none');
    }

    // UI 토글 버튼 및 라디오 동기화
    const btnTrans = document.getElementById('btnGroupBgTrans');
    const btnWhite = document.getElementById('btnGroupBgWhite');
    if (btnTrans) btnTrans.classList.toggle('active', mode === 'transparent');
    if (btnWhite) btnWhite.classList.toggle('active', mode === 'white');

    const radT = document.getElementById('groupBgTransparent') || document.getElementById('groupBgTrans');
    const radW = document.getElementById('groupBgWhite');
    if (radT) radT.checked = (mode === 'transparent');
    if (radW) radW.checked = (mode === 'white');

    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 그룹 배경 흰색 박스 크기 자동 계산/업데이트
   */
  updateGroupBgBox(groupG) {
    if (!groupG) return;
    let bgRect = groupG.querySelector('.group-bg-rect');
    const bgMode = groupG.getAttribute('data-bg-mode') || 'transparent';

    if (bgMode === 'transparent') {
      if (bgRect) {
        bgRect.style.display = 'none';
        bgRect.setAttribute('display', 'none');
      }
      return;
    }

    if (!bgRect) {
      bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute('class', 'group-bg-rect');
      bgRect.setAttribute('rx', '4');
      groupG.insertBefore(bgRect, groupG.firstChild);
    } else {
      if (groupG.firstChild !== bgRect) {
        groupG.insertBefore(bgRect, groupG.firstChild);
      }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasValid = false;

    // 1) bgRect를 잠시 숨긴 후 groupG.getBBox()로 전체 영역 직접 산출 시도
    const prevDisplay = bgRect.style.display;
    bgRect.style.display = 'none';
    bgRect.setAttribute('display', 'none');

    try {
      const gBox = groupG.getBBox();
      if (gBox && (gBox.width > 0 || gBox.height > 0)) {
        minX = gBox.x;
        minY = gBox.y;
        maxX = gBox.x + gBox.width;
        maxY = gBox.y + gBox.height;
        hasValid = true;
      }
    } catch (e) {}

    // 2) fallback: 자식 개별 순회하여 BBox 합산
    if (!hasValid) {
      const members = Array.from(groupG.children).filter(c => c !== bgRect && !c.classList.contains('group-bg-rect'));
      members.forEach(m => {
        try {
          if (m.getBBox) {
            const b = m.getBBox();
            const mt = window.PicEditor.utils.parseTransform(m);
            const bx = b.x + mt.x;
            const by = b.y + mt.y;
            const bw = b.width * Math.abs(mt.sx || 1);
            const bh = b.height * Math.abs(mt.sy || 1);
            if (bw > 0 || bh > 0) {
              minX = Math.min(minX, bx);
              minY = Math.min(minY, by);
              maxX = Math.max(maxX, bx + bw);
              maxY = Math.max(maxY, by + bh);
              hasValid = true;
            }
          }
        } catch (err) {}
      });
    }

    if (hasValid && minX !== Infinity && maxX >= minX && maxY >= minY) {
      // 폭이나 여백(padding)을 전혀 주지 않고, 그룹화된 객체들의 영역 크기 그대로 적용
      const x = minX;
      const y = minY;
      const w = maxX - minX;
      const h = maxY - minY;

      bgRect.setAttribute('x', x.toFixed(1));
      bgRect.setAttribute('y', y.toFixed(1));
      bgRect.setAttribute('width', Math.max(1, w).toFixed(1));
      bgRect.setAttribute('height', Math.max(1, h).toFixed(1));
      bgRect.setAttribute('fill', '#ffffff');
      bgRect.setAttribute('fill-opacity', '1');
      bgRect.setAttribute('stroke', 'none');
      bgRect.setAttribute('stroke-width', '0');
      bgRect.removeAttribute('rx');
      bgRect.removeAttribute('ry');
      bgRect.removeAttribute('display');
      bgRect.style.display = 'block';
      bgRect.style.pointerEvents = 'all';
    } else {
      bgRect.style.display = prevDisplay;
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
   * 상단 인스펙터 W, H 치수 동기화 헬퍼
   */
  syncDimensionsToUI(target) {
    if (!target) return;
    try {
      const bbox = target.getBBox();
      const t = window.PicEditor.utils.parseTransform(target);
      const realW = Math.round(bbox.width * Math.abs(t.sx));
      const realH = Math.round(bbox.height * Math.abs(t.sy));
      const wNum = document.getElementById('objWidthNum');
      const hNum = document.getElementById('objHeightNum');
      if (wNum && realW > 0) wNum.value = realW;
      if (hNum && realH > 0) hNum.value = realH;
    } catch (e) {}
  },

  /**
   * 텍스트 요소 추출 (text-el, 일반 text 태그 또는 text-wrap 내부 text)
   */
  getTextElement(el) {
    if (!el) return null;
    
    // 1. el 자체가 text 태그이거나 .text-el 인 경우
    if (el.tagName && el.tagName.toLowerCase() === 'text') return el;
    if (el.classList && el.classList.contains('text-el')) return el;

    // 2. 만약 axes-wrap, 기즈모, 또는 독립 도형(polygon, circle, line, path, ellipse, image, 일반 rect)이면 텍스트 아님
    if (el.classList && (el.classList.contains('axes-wrap') || el.classList.contains('editor-gizmo-group'))) return null;
    const tag = (el.tagName || '').toLowerCase();
    if (['polygon', 'circle', 'line', 'path', 'ellipse', 'image'].includes(tag)) {
      return null;
    }
    if (tag === 'rect') {
      // 오직 .text-wrap 내부의 텍스트 배경 상자인 경우에만 그 text-wrap의 텍스트 반환
      const parentWrap = el.closest ? el.closest('.text-wrap') : null;
      if (parentWrap && (el.classList.contains('text-bg-rect') || el.classList.contains('text-bg-box'))) {
        return parentWrap.querySelector('.text-el') || parentWrap.querySelector('text');
      }
      return null;
    }

    // 3. el이 .text-wrap 요소인 경우 내부 text 반환
    if (el.classList && el.classList.contains('text-wrap')) {
      return el.querySelector('.text-el') || el.querySelector('text');
    }

    // 4. el이 .text-wrap 부모 내부에 속해 있는 경우
    const textWrap = el.closest ? el.closest('.text-wrap') : null;
    if (textWrap) {
      return textWrap.querySelector('.text-el') || textWrap.querySelector('text');
    }

    // 5. el이 독립된 소형 그룹(g)이고 직속으로 text를 보유하며 도형이 없는 텍스트 전용 그룹인 경우
    if (tag === 'g' && !el.classList.contains('main-diagram') && !el.classList.contains('text-layer') && !el.classList.contains('editor-gizmo-group') && !(el.id && el.id.includes('handle'))) {
      const hasShapes = el.querySelector('polygon, circle, line, path, rect:not(.text-bg-rect):not(.text-bg-box)');
      if (!hasShapes) {
        return el.querySelector('.text-el') || el.querySelector('text');
      }
    }

    return null;
  },

  /**
   * 텍스트를 감싸는 부모 래퍼 그룹(g.text-wrap) 추출
   */
  getTextWrap(el) {
    if (!el) return null;
    const textEl = this.getTextElement(el);
    if (!textEl) return null;

    const p = textEl.closest('.text-wrap');
    if (p) return p;

    const parentG = textEl.parentElement;
    if (parentG && parentG.tagName && parentG.tagName.toLowerCase() === 'g' &&
        !parentG.classList.contains('main-diagram') &&
        !parentG.classList.contains('text-layer') &&
        !parentG.classList.contains('editor-gizmo-group')) {
      parentG.classList.add('text-wrap');
      return parentG;
    }
    return textEl;
  },

  /**
   * 텍스트 전용 인스펙터 동기화
   */
  syncTextInspector() {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;

    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    // 1. 글자 내용 (Text Content) - 여러 <text> 태그가 결합된 라벨("음속 v2" 등)도 완벽 결합 표시
    const contentInput = document.getElementById('textContentInput');
    const allTexts = wrap.querySelectorAll ? Array.from(wrap.querySelectorAll('text')) : [textEl];
    if (contentInput) {
      if (allTexts.length > 1) {
        contentInput.value = allTexts.map(t => t.textContent.trim()).filter(Boolean).join(' ');
      } else {
        contentInput.value = textEl.textContent.trim() || textEl.textContent || '';
      }
    }

    // 2. 글꼴 크기 (Font Size in px) 및 스케일 동기화
    const t = window.PicEditor.utils.parseTransform(wrap);
    const curScale = Math.abs(t.sx) || 1;

    let baseFs = parseInt(wrap.getAttribute('data-base-fs'));
    if (!baseFs || isNaN(baseFs)) {
      baseFs = parseInt(textEl.style.fontSize) || parseInt(textEl.getAttribute('font-size'));
      if (!baseFs || isNaN(baseFs)) {
        try {
          baseFs = parseInt(window.getComputedStyle(textEl).fontSize) || 28;
        } catch (e) {
          baseFs = 28;
        }
      }
      wrap.setAttribute('data-base-fs', baseFs);
    }

    const currentFs = Math.max(6, Math.round(baseFs * curScale));
    const sizeInput = document.getElementById('textFontSizeNum');
    if (sizeInput) {
      sizeInput.value = currentFs;
    }

    // 6. 스케일 배율 UI 동기화
    const pct = Math.max(10, Math.round(curScale * 100));
    const scaleRange = document.getElementById('textScaleRange');
    const scaleNum = document.getElementById('textScaleNum');
    if (scaleRange) scaleRange.value = Math.min(200, Math.max(10, pct));
    if (scaleNum) scaleNum.value = pct;

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

    // 7. 배경 모드 (투명, 흰색 박스, 외곽선 흰색)
    const bgSelect = document.getElementById('textBgModeSelect');
    let mode = 'transparent';
    if (wrap.classList.contains('bg-box-white')) mode = 'box-white';
    else if (textEl.classList.contains('bg-stroke-white')) mode = 'stroke-white';
    if (bgSelect) bgSelect.value = mode;
  },

  /**
   * 텍스트 래퍼 좌측 상단 고정 스케일링 (위치 이동 없이 좌측 상단 기준으로 크기 조절)
   */
  scaleWrapCenter(wrap, targetScale, baseFs) {
    if (!wrap) return;
    const t = window.PicEditor.utils.parseTransform(wrap);
    const signX = t.sx < 0 ? -1 : 1;
    const signY = t.sy < 0 ? -1 : 1;
    const curScale = Math.abs(t.sx) || 1;

    // wrap의 BBox 계산 (좌측 상단 고정 기준점 설정)
    let bbox = { x: 0, y: 0, width: 40, height: 20 };
    try {
      bbox = wrap.getBBox();
    } catch (e) {
      const firstT = wrap.querySelector('text');
      if (firstT) try { bbox = firstT.getBBox(); } catch(err) {}
    }

    let anchorX = parseFloat(wrap.getAttribute('data-anchor-x'));
    let anchorY = parseFloat(wrap.getAttribute('data-anchor-y'));
    if (isNaN(anchorX) || isNaN(anchorY)) {
      anchorX = bbox.x;
      anchorY = bbox.y;
      wrap.setAttribute('data-anchor-x', anchorX);
      wrap.setAttribute('data-anchor-y', anchorY);
    }

    const rad = (t.r || 0) * Math.PI / 180;
    const rx = anchorX * Math.cos(rad) - anchorY * Math.sin(rad);
    const ry = anchorX * Math.sin(rad) + anchorY * Math.cos(rad);

    t.x = t.x + (curScale - targetScale) * rx;
    t.y = t.y + (curScale - targetScale) * ry;
    t.sx = targetScale * signX;
    t.sy = targetScale * signY;

    window.PicEditor.utils.setTransform(wrap, t);

    // 픽셀 크기 인풋 동기화
    if (baseFs) {
      const targetPx = Math.max(6, Math.round(baseFs * targetScale));
      const sizeInput = document.getElementById('textFontSizeNum');
      if (sizeInput) sizeInput.value = targetPx;
    }

    if (window.PicEditor.canvas) {
      window.PicEditor.canvas.updateSingleTextBgBox(wrap);
    }
    this.syncDimensionsToUI(wrap);
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
  },

  /**
   * 텍스트 내용 실시간 수정 (텍스트 상자 실시간 자동 확장/축소)
   */
  onTextInput(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;
    const allTexts = wrap.querySelectorAll ? Array.from(wrap.querySelectorAll('text')) : [textEl];

    if (allTexts.length > 1) {
      const parts = val.trim().split(/\s+/);
      if (parts.length === allTexts.length) {
        allTexts.forEach((t, i) => { t.textContent = parts[i]; });
      } else {
        allTexts[0].textContent = val;
        for (let i = 1; i < allTexts.length; i++) {
          allTexts[i].textContent = '';
        }
      }
    } else {
      textEl.textContent = val;
    }

    if (wrap) {
      wrap.removeAttribute('data-anchor-x');
      wrap.removeAttribute('data-anchor-y');
      if (window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
    }
    this.syncDimensionsToUI(wrap);
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
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    let baseFs = parseInt(wrap.getAttribute('data-base-fs'));
    if (!baseFs || isNaN(baseFs)) {
      baseFs = parseInt(textEl.style.fontSize) || parseInt(textEl.getAttribute('font-size')) || 28;
      wrap.setAttribute('data-base-fs', baseFs);
    }
    const num = Math.max(6, parseInt(size) || baseFs);
    const targetScale = Math.max(0.1, num / baseFs);

    const pct = Math.max(10, Math.round(targetScale * 100));
    const scaleRange = document.getElementById('textScaleRange');
    const scaleNum = document.getElementById('textScaleNum');
    if (scaleRange) scaleRange.value = Math.min(200, Math.max(10, pct));
    if (scaleNum) scaleNum.value = pct;

    this.scaleWrapCenter(wrap, targetScale, baseFs);
  },

  /**
   * 폰트 서체(Font-Family) 변경
   */
  onTextFontFamily(family) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    wrap.querySelectorAll('text, tspan').forEach(el => {
      el.setAttribute('font-family', family);
      el.style.fontFamily = family;
    });

    if (wrap) {
      wrap.removeAttribute('data-anchor-x');
      wrap.removeAttribute('data-anchor-y');
      if (window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
    }
    this.syncDimensionsToUI(wrap || textEl);
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
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    let cur = textEl.style.fontStyle || textEl.getAttribute('font-style');
    if (!cur) {
      try { cur = window.getComputedStyle(textEl).fontStyle; } catch (e) {}
    }
    const next = (cur === 'italic') ? 'normal' : 'italic';

    wrap.querySelectorAll('text, tspan').forEach(el => {
      el.setAttribute('font-style', next);
      el.style.fontStyle = next;
    });

    const btn = document.getElementById('textItalicBtn');
    if (btn) btn.classList.toggle('active', next === 'italic');

    if (wrap) {
      wrap.removeAttribute('data-anchor-x');
      wrap.removeAttribute('data-anchor-y');
      if (window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
    }
    this.syncDimensionsToUI(wrap || textEl);
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
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    let fw = textEl.style.fontWeight || textEl.getAttribute('font-weight');
    if (!fw) {
      try { fw = window.getComputedStyle(textEl).fontWeight; } catch (e) {}
    }
    const isBold = (fw === 'bold' || fw === '700' || parseInt(fw) >= 600);
    const next = isBold ? 'normal' : 'bold';

    wrap.querySelectorAll('text, tspan').forEach(el => {
      el.setAttribute('font-weight', next);
      el.style.fontWeight = next;
    });

    const btn = document.getElementById('textBoldBtn');
    if (btn) btn.classList.toggle('active', next === 'bold');

    if (wrap) {
      wrap.removeAttribute('data-anchor-x');
      wrap.removeAttribute('data-anchor-y');
      if (window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
    }
    this.syncDimensionsToUI(wrap || textEl);
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
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    wrap.querySelectorAll('text, tspan').forEach(el => {
      el.setAttribute('fill', color);
      el.style.fill = color;
    });

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

    const allTexts = wrap.querySelectorAll ? Array.from(wrap.querySelectorAll('text')) : [textEl];
    const initialText = (allTexts.length > 1) 
      ? allTexts.map(t => t.textContent.trim()).filter(Boolean).join(' ') 
      : (textEl.textContent.trim() || textEl.textContent || '');

    editor.style.left = `${Math.round(rect.left)}px`;
    editor.style.top = `${Math.round(rect.top)}px`;
    editor.style.fontSize = cs.fontSize || '20px';
    editor.style.fontFamily = cs.fontFamily || "'Times New Roman', serif";
    editor.style.fontStyle = cs.fontStyle || 'normal';
    editor.style.fontWeight = cs.fontWeight || 'normal';
    editor.style.color = textEl.getAttribute('fill') || '#000000';
    editor.style.display = 'block';
    editor.value = initialText;

    editor.oninput = () => {
      this.onTextInput(editor.value);
      const inputEl = document.getElementById('textContentInput');
      if (inputEl) inputEl.value = editor.value;
    };

    const finish = () => {
      editor.style.display = 'none';
      const contentInput = document.getElementById('textContentInput');
      if (contentInput) contentInput.value = editor.value;
      if (wrap && window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
      this.syncDimensionsToUI(wrap);
      this.syncUItoSelected();
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
    if (rangeEl) rangeEl.value = Math.min(200, Math.max(10, num));
    this.applyTextScale(num);
  },

  applyTextScale(val) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;
    const textEl = this.getTextElement(state.selectedElement);
    if (!textEl) return;
    const wrap = this.getTextWrap(state.selectedElement) || this.getTextWrap(textEl) || textEl;

    const rawPct = parseFloat(val);
    const pct = (isNaN(rawPct) || rawPct <= 0) ? 100 : Math.max(10, rawPct);
    const targetScale = Math.max(0.1, pct / 100);

    let baseFs = parseInt(wrap.getAttribute('data-base-fs'));
    if (!baseFs || isNaN(baseFs)) {
      baseFs = parseInt(textEl.style.fontSize) || parseInt(textEl.getAttribute('font-size')) || 28;
      wrap.setAttribute('data-base-fs', baseFs);
    }

    const targetPx = Math.max(6, Math.round(baseFs * targetScale));
    const sizeInput = document.getElementById('textFontSizeNum');
    if (sizeInput) {
      sizeInput.value = targetPx;
    }

    this.scaleWrapCenter(wrap, targetScale, baseFs);
  },

  /**
   * 글자 배경 스타일 변경 (투명, 흰색 박스, 외곽선 흰색)
   */
  onChangeTextBgMode(mode) {
    const state = window.PicEditor.state;
    if (!state.selectedElement) return;

    // 1. 선택된 대상에서 textEl 및 wrap 안전하게 추출
    let textEl = this.getTextElement(state.selectedElement);
    let wrap = state.selectedElement.closest ? state.selectedElement.closest('.text-wrap') : null;

    // 만약 wrap이 없는 일반 <text>인 경우 동적으로 .text-wrap으로 감싸기
    if (!wrap && textEl) {
      wrap = textEl.closest ? textEl.closest('.text-wrap') : null;
      if (!wrap) {
        const parent = textEl.parentNode || window.PicEditor.utils.getActiveSvg().querySelector('.text-layer');
        wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrap.setAttribute('class', 'movable text-wrap');
        const tf = textEl.getAttribute('transform');
        if (tf) {
          wrap.setAttribute('transform', tf);
          textEl.removeAttribute('transform');
        } else {
          wrap.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');
        }
        parent.insertBefore(wrap, textEl);
        wrap.appendChild(textEl);
      }
    }

    if (!textEl && wrap) {
      textEl = wrap.querySelector('.text-el') || wrap.querySelector('text');
    }

    if (!wrap || !textEl) return;

    // text-el 클래스 보장
    if (textEl.classList && !textEl.classList.contains('text-el')) {
      textEl.classList.add('text-el');
    }

    // 기존 스타일 초기화
    wrap.classList.remove('bg-box-white');
    wrap.classList.remove('bg-transparent');
    textEl.classList.remove('bg-stroke-white');
    textEl.removeAttribute('paint-order');
    textEl.removeAttribute('stroke');
    textEl.removeAttribute('stroke-width');

    let bgRect = wrap.querySelector('.text-bg-rect');

    if (mode === 'box-white') {
      wrap.classList.add('bg-box-white');
      if (!bgRect) {
        bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute('class', 'text-bg-rect');
        wrap.insertBefore(bgRect, textEl);
      } else {
        // bgRect가 항상 textEl 뒤(SVG 기준 앞 순서)에 오도록 보장
        if (textEl.previousElementSibling !== bgRect) {
          wrap.insertBefore(bgRect, textEl);
        }
      }

      bgRect.removeAttribute('display');
      bgRect.style.display = 'inline';
      bgRect.setAttribute('fill', '#ffffff');
      bgRect.setAttribute('fill-opacity', '1');
      bgRect.setAttribute('stroke', 'none');
      bgRect.setAttribute('stroke-width', '0');
      bgRect.setAttribute('rx', '3');
      bgRect.setAttribute('ry', '3');

      // BBox 및 박스 좌표 실시간 계산 적용
      if (window.PicEditor.canvas) {
        window.PicEditor.canvas.updateSingleTextBgBox(wrap);
      }
    } else if (mode === 'stroke-white') {
      wrap.classList.add('bg-transparent');
      if (bgRect) {
        bgRect.setAttribute('display', 'none');
        bgRect.style.display = 'none';
      }
      textEl.classList.add('bg-stroke-white');
      textEl.setAttribute('paint-order', 'stroke fill');
      textEl.setAttribute('stroke', '#FFFFFF');
      textEl.setAttribute('stroke-width', '5px');
    } else {
      // transparent (투명)
      wrap.classList.add('bg-transparent');
      if (bgRect) {
        bgRect.setAttribute('display', 'none');
        bgRect.style.display = 'none';
      }
    }

    // UI 인스펙터 선택 상자 동기화
    const bgSelect = document.getElementById('textBgModeSelect');
    if (bgSelect) bgSelect.value = mode;

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
    
    const textEl = this.getTextElement(target);
    if (textEl) {
      const wrap = this.getTextWrap(target) || this.getTextWrap(textEl) || target;
      const ratio = targetW / bbox.width;
      const t = window.PicEditor.utils.parseTransform(wrap);
      const curScale = Math.abs(t.sx) || 1;
      const targetScale = Math.max(0.1, curScale * ratio);
      let baseFs = parseInt(wrap.getAttribute('data-base-fs')) || 28;
      this.scaleWrapCenter(wrap, targetScale, baseFs);
      const pct = Math.max(10, Math.round(targetScale * 100));
      const scaleRange = document.getElementById('textScaleRange');
      const scaleNum = document.getElementById('textScaleNum');
      if (scaleRange) scaleRange.value = Math.min(200, Math.max(10, pct));
      if (scaleNum) scaleNum.value = pct;
      return;
    }

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
    
    const textEl = this.getTextElement(target);
    if (textEl) {
      const wrap = this.getTextWrap(target) || this.getTextWrap(textEl) || target;
      const ratio = targetH / bbox.height;
      const t = window.PicEditor.utils.parseTransform(wrap);
      const curScale = Math.abs(t.sx) || 1;
      const targetScale = Math.max(0.1, curScale * ratio);
      let baseFs = parseInt(wrap.getAttribute('data-base-fs')) || 28;
      this.scaleWrapCenter(wrap, targetScale, baseFs);
      const pct = Math.max(10, Math.round(targetScale * 100));
      const scaleRange = document.getElementById('textScaleRange');
      const scaleNum = document.getElementById('textScaleNum');
      if (scaleRange) scaleRange.value = Math.min(200, Math.max(10, pct));
      if (scaleNum) scaleNum.value = pct;
      return;
    }

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
      if (window.PicEditor.interaction && window.PicEditor.interaction.updateModeByObjectCount) {
        window.PicEditor.interaction.updateModeByObjectCount();
      }
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
window.onShapeFillTransparent = (c) => window.PicEditor.inspector.onShapeFillTransparent(c);
window.onShapeFillColor = (c) => window.PicEditor.inspector.onShapeFillColor(c);
window.onShapePattern = (p) => window.PicEditor.inspector.onShapePattern(p);
window.bringForward = () => window.PicEditor.inspector.bringForward();
window.sendBackward = () => window.PicEditor.inspector.sendBackward();
window.changeSelectedLayer = (l) => window.PicEditor.inspector.changeSelectedLayer(l);
window.groupSelected = () => window.PicEditor.inspector.createGroup();
window.ungroupSelected = () => window.PicEditor.inspector.ungroup();
window.onGroupBgModeChange = (m) => window.PicEditor.inspector.setGroupBgMode(m);
window.setActiveLayer = (l) => window.PicEditor.interaction.setActiveLayer(l);
