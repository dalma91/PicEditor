/**
 * tools.js - 도형 및 화살표, 호(Arc) 그리기 및 변환 도구
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.tools = {
  /**
   * 도구 선택 셀렉트 박스 변경 시 옵션 표시 제어
   */
  onToolChange() {
    const toolEl = document.getElementById('toolSelect');
    if (!toolEl) return;
    const tool = toolEl.value;
    const arrowGrp = document.getElementById('arrowOptionGroup');
    const arcGrp = document.getElementById('arcOptionGroup');
    
    if (arrowGrp) arrowGrp.style.display = (tool === 'arrow') ? 'flex' : 'none';
    if (arcGrp) arcGrp.style.display = (tool === 'arc') ? 'flex' : 'none';
  },

  /**
   * W3C 표준 SVG 타원 호(Arc) 엔드포인트 파라미터로부터 실제 원의 중심 좌표(cx, cy) 산출
   */
  getSvgArcCenter(x1, y1, rx, ry, phi, largeArc, sweep, x2, y2) {
    const cosPhi = Math.cos(phi * Math.PI / 180);
    const sinPhi = Math.sin(phi * Math.PI / 180);
    const dx2 = (x1 - x2) / 2.0;
    const dy2 = (y1 - y2) / 2.0;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;

    let rxSq = rx * rx;
    let rySq = ry * ry;
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;

    const radicand = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
    let coef = Math.sqrt(radicand);
    if (largeArc === sweep) {
      coef = -coef;
    }

    const cxp = coef * (rx * y1p / ry);
    const cyp = coef * -(ry * x1p / rx);

    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2.0;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2.0;
    return { x: cx, y: cy };
  },

  /**
   * 호의 시점(p1), 종점(p2), 원의 중심(c)을 기반으로 SVG path 'd' 및 반지름 r 계산
   */
  calculateArcD(p1, p2, c) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const cx = c.x, cy = c.y;

    const r1 = Math.hypot(x1 - cx, y1 - cy);
    const r2 = Math.hypot(x2 - cx, y2 - cy);
    let r = (r1 + r2) / 2.0;

    const chord = Math.hypot(x2 - x1, y2 - y1);
    if (chord < 0.5) {
      return { d: `M ${x1},${y1} L ${x2},${y2}`, r: 0, sweep: 1 };
    }

    if (r < chord / 2.0) {
      r = chord / 2.0;
    }

    // 외적 판정: 중심 C가 시점->종점 벡터(P1->P2)의 어느 쪽에 위치하는지 정밀 판정 (화면 Y축 아래 방향 기준)
    // cross > 0 이면 중심 C가 벡터의 우측에 위치 -> sweep = 1 (시계방향 회전)
    // cross <= 0 이면 중심 C가 벡터의 좌측에 위치 -> sweep = 0 (반시계방향 회전)
    // 이를 통해 호는 항상 중심 C를 감싸며 반대편으로 자연스럽게 휘어짐 (원의 중심 정의 일치)
    const cross = (x2 - x1) * (cy - y1) - (y2 - y1) * (cx - x1);
    const sweep = (cross > 0) ? 1 : 0;

    const d = `M ${x1.toFixed(1)},${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${x2.toFixed(1)},${y2.toFixed(1)}`;
    return { d, r, sweep };
  },

  /**
   * 요소에서 호 데이터(시점 p1, 종점 p2, 원의 중심 c) 추출
   */
  getArcData(pathEl) {
    if (!pathEl || pathEl.tagName.toLowerCase() !== 'path') return null;

    let x1 = parseFloat(pathEl.getAttribute('data-x1'));
    let y1 = parseFloat(pathEl.getAttribute('data-y1'));
    let x2 = parseFloat(pathEl.getAttribute('data-x2'));
    let y2 = parseFloat(pathEl.getAttribute('data-y2'));
    let cx = parseFloat(pathEl.getAttribute('data-cx'));
    let cy = parseFloat(pathEl.getAttribute('data-cy'));

    if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && !isNaN(cx) && !isNaN(cy)) {
      return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, c: { x: cx, y: cy } };
    }

    // data 속성이 없을 경우 'd' 속성 파싱 지원
    const d = pathEl.getAttribute('d') || '';
    const mMatch = d.match(/M\s*([\d\.-]+)[,\s]+([\d\.-]+)/i);
    if (!mMatch) return null;
    x1 = parseFloat(mMatch[1]);
    y1 = parseFloat(mMatch[2]);

    const aMatch = d.match(/A\s*([\d\.-]+)[,\s]+([\d\.-]+)[,\s]+([\d\.-]+)[,\s]+([01])[,\s]+([01])[,\s]+([\d\.-]+)[,\s]+([\d\.-]+)/i);
    if (aMatch) {
      const rx = parseFloat(aMatch[1]);
      const ry = parseFloat(aMatch[2]);
      const phi = parseFloat(aMatch[3]);
      const largeArc = parseInt(aMatch[4], 10);
      const sweep = parseInt(aMatch[5], 10);
      x2 = parseFloat(aMatch[6]);
      y2 = parseFloat(aMatch[7]);
      const center = this.getSvgArcCenter(x1, y1, rx, ry, phi, largeArc, sweep, x2, y2);
      return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, c: center };
    }

    const qMatch = d.match(/Q\s*([\d\.-]+)[,\s]+([\d\.-]+)[,\s]+([\d\.-]+)[,\s]+([\d\.-]+)/i);
    if (qMatch) {
      const qx = parseFloat(qMatch[1]);
      const qy = parseFloat(qMatch[2]);
      x2 = parseFloat(qMatch[3]);
      y2 = parseFloat(qMatch[4]);
      // 2차 베지어 제어점(볼록 측)을 현의 중점 기준으로 반전하여 원의 중심(오목 측)으로 산출
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const center = { x: mx - (qx - mx) * 1.5, y: my - (qy - my) * 1.5 };
      return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, c: center };
    }

    return null;
  },

  /**
   * 해당 요소가 호(Arc)인지 여부 판별
   */
  isArcElement(el) {
    if (!el || el.tagName.toLowerCase() !== 'path') return false;
    if (el.getAttribute('data-type') === 'arc') return true;
    const d = el.getAttribute('d') || '';
    return d.includes('A ') || d.includes('a ') || d.includes('Q ') || d.includes('q ');
  },

  /**
   * 곡선(호) 경로 업데이트 (원의 중심 C를 기반으로 계산)
   */
  updateArcPath(pathEl, p1, p2, c) {
    if (!pathEl || !p1 || !p2) return;
    if (!c) {
      c = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    const { d, r } = this.calculateArcD(p1, p2, c);
    pathEl.setAttribute("d", d);
    pathEl.setAttribute('data-type', 'arc');
    pathEl.setAttribute('data-x1', p1.x.toFixed(1));
    pathEl.setAttribute('data-y1', p1.y.toFixed(1));
    pathEl.setAttribute('data-x2', p2.x.toFixed(1));
    pathEl.setAttribute('data-y2', p2.y.toFixed(1));
    pathEl.setAttribute('data-cx', c.x.toFixed(1));
    pathEl.setAttribute('data-cy', c.y.toFixed(1));
    pathEl.setAttribute('data-r', r.toFixed(1));
  },

  /**
   * SVG 캔버스 내 호의 중심(붉은 점) 및 양 끝점(파란 점) 조작 핸들(Gizmo) 요소 보장 및 이벤트 바인딩
   */
  ensureArcCenterGizmo(svg) {
    let gizmo = svg.querySelector('#arc-center-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'arc-center-handle-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:none;');

      gizmo.innerHTML = `
        <line id="arc-chord-guide" stroke="#94a3b8" stroke-dasharray="4,4" stroke-width="1.2" style="pointer-events:none;" />
        <line id="arc-axis-guide" stroke="#ef4444" stroke-dasharray="2,2" stroke-width="1" style="pointer-events:none;" />
        <line id="arc-radius-guide-1" stroke="#fca5a5" stroke-dasharray="3,3" stroke-width="1" style="pointer-events:none;" />
        <line id="arc-radius-guide-2" stroke="#fca5a5" stroke-dasharray="3,3" stroke-width="1" style="pointer-events:none;" />
        
        <!-- 파란색 시점 P1 조작 핸들 -->
        <g id="arc-p1-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="arc-p1-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="arc-p1-anchor" r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="arc-p1-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="arc-p1-label" font-size="10" font-weight="700" fill="#2563eb" x="-26" y="-10" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">시점</text>
        </g>

        <!-- 파란색 종점 P2 조작 핸들 -->
        <g id="arc-p2-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="arc-p2-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="arc-p2-anchor" r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="arc-p2-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="arc-p2-label" font-size="10" font-weight="700" fill="#2563eb" x="12" y="-10" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">종점</text>
        </g>

        <!-- 붉은색 호의 중심 조작 핸들 -->
        <g id="arc-center-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="arc-center-hit" r="24" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="arc-center-outer" r="9" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.4)); pointer-events:none;" />
          <circle id="arc-center-inner" r="3.5" fill="#ffffff" style="pointer-events:none;" />
          <text id="arc-center-label" font-size="11" font-weight="700" fill="#dc2626" x="14" y="4" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">호의 중심</text>
        </g>
      `;

      svg.appendChild(gizmo);

      // 호의 중심 드래그 이벤트
      const handleCenterWrap = gizmo.querySelector('#arc-center-handle-wrap');
      const startDragCenter = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingArcCenter = true;
        state.hasDragged = false;
        handleCenterWrap.style.cursor = 'grabbing';
      };
      handleCenterWrap.addEventListener('mousedown', startDragCenter);
      handleCenterWrap.addEventListener('touchstart', startDragCenter, { passive: false });

      // 파란색 시점(P1) 드래그 이벤트
      const handleP1Wrap = gizmo.querySelector('#arc-p1-handle-wrap');
      const startDragP1 = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingArcP1 = true;
        state.hasDragged = false;
        handleP1Wrap.style.cursor = 'grabbing';
      };
      handleP1Wrap.addEventListener('mousedown', startDragP1);
      handleP1Wrap.addEventListener('touchstart', startDragP1, { passive: false });

      // 파란색 종점(P2) 드래그 이벤트
      const handleP2Wrap = gizmo.querySelector('#arc-p2-handle-wrap');
      const startDragP2 = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingArcP2 = true;
        state.hasDragged = false;
        handleP2Wrap.style.cursor = 'grabbing';
      };
      handleP2Wrap.addEventListener('mousedown', startDragP2);
      handleP2Wrap.addEventListener('touchstart', startDragP2, { passive: false });
    }
    return gizmo;
  },

  /**
   * 선택된 호 요소에 호의 중심 및 양 끝점 조작 핸들 표시
   */
  showArcCenterHandle(arcEl) {
    if (!arcEl) return;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    const gizmo = this.ensureArcCenterGizmo(svg);
    const data = this.getArcData(arcEl);
    if (!data) {
      gizmo.style.display = 'none';
      return;
    }

    const { p1, p2, c } = data;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    // 아크의 transform(위치/회전)과 동일하게 동기화
    gizmo.setAttribute('transform', arcEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');

    // 가이드 라인 좌표 갱신
    const chord = gizmo.querySelector('#arc-chord-guide');
    chord.setAttribute('x1', p1.x);
    chord.setAttribute('y1', p1.y);
    chord.setAttribute('x2', p2.x);
    chord.setAttribute('y2', p2.y);

    const axis = gizmo.querySelector('#arc-axis-guide');
    axis.setAttribute('x1', mx);
    axis.setAttribute('y1', my);
    axis.setAttribute('x2', c.x);
    axis.setAttribute('y2', c.y);

    const rad1 = gizmo.querySelector('#arc-radius-guide-1');
    rad1.setAttribute('x1', c.x);
    rad1.setAttribute('y1', c.y);
    rad1.setAttribute('x2', p1.x);
    rad1.setAttribute('y2', p1.y);

    const rad2 = gizmo.querySelector('#arc-radius-guide-2');
    rad2.setAttribute('x1', c.x);
    rad2.setAttribute('y1', c.y);
    rad2.setAttribute('x2', p2.x);
    rad2.setAttribute('y2', p2.y);

    // 파란색 시점(P1) 및 종점(P2) 핸들 위치 동기화
    const p1Wrap = gizmo.querySelector('#arc-p1-handle-wrap');
    if (p1Wrap) p1Wrap.setAttribute('transform', `translate(${p1.x}, ${p1.y})`);

    const p2Wrap = gizmo.querySelector('#arc-p2-handle-wrap');
    if (p2Wrap) p2Wrap.setAttribute('transform', `translate(${p2.x}, ${p2.y})`);

    // 붉은색 호의 중심 핸들 위치 동기화
    const centerWrap = gizmo.querySelector('#arc-center-handle-wrap');
    centerWrap.setAttribute('transform', `translate(${c.x}, ${c.y})`);

    const r = Math.round((Math.hypot(p1.x - c.x, p1.y - c.y) + Math.hypot(p2.x - c.x, p2.y - c.y)) / 2);
    const label = gizmo.querySelector('#arc-center-label');
    if (label) label.textContent = `호의 중심 (R=${r}px)`;

    gizmo.style.display = 'block';
  },

  /**
   * 호의 중심 및 양 끝점 조작 핸들 숨기기
   */
  hideArcCenterHandle() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#arc-center-handle-group');
    if (gizmo) gizmo.style.display = 'none';
  },

  /**
   * 아크가 드래그 이동 또는 변환될 때 기즈모의 transform 동기화
   */
  updateArcGizmoTransform(arcEl) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#arc-center-handle-group');
    if (gizmo && gizmo.style.display !== 'none') {
      gizmo.setAttribute('transform', arcEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    }
  },

  /**
   * 선 요소에 화살표 마커 적용
   */
  applyArrowMarkers(el, dir, num) {
    el.removeAttribute('marker-start');
    el.removeAttribute('marker-end');
    
    const parent = el.parentNode;
    if (parent && el.id) {
      const oldMid = parent.querySelector(`g.mid-arrow[data-for="${el.id}"]`);
      if (oldMid) oldMid.remove();
    }

    if (dir === 'end') {
      el.setAttribute("marker-end", `url(#arrow-${num})`);
    } else if (dir === 'start') {
      el.setAttribute("marker-start", `url(#arrow-start-${num})`);
    } else if (dir === 'both') {
      el.setAttribute("marker-end", `url(#arrow-${num})`);
      el.setAttribute("marker-start", `url(#arrow-start-${num})`);
    } else if (dir === 'mid-right' || dir === 'mid-left') {
      if (!el.id) el.id = 'line_' + Math.random().toString(36).substr(2, 9);
      this.addMidArrow(el, dir, num);
    }
  },

  /**
   * 선 중간에 화살표 폴리곤 추가
   */
  addMidArrow(lineEl, dir, num) {
    const parent = lineEl.parentNode;
    if (!parent) return;

    const x1 = parseFloat(lineEl.getAttribute('x1'));
    const y1 = parseFloat(lineEl.getAttribute('y1'));
    const x2 = parseFloat(lineEl.getAttribute('x2'));
    const y2 = parseFloat(lineEl.getAttribute('y2'));

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    let angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    if (dir === 'mid-left') angle += 180;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "movable mid-arrow");
    g.setAttribute("data-for", lineEl.id);
    g.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`);

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", "0,0 -10,-4 -10,4");
    polygon.setAttribute("fill", "#000000");
    g.appendChild(polygon);

    parent.appendChild(g);
  },

  /**
   * 선택된 직선을 화살표로 변환
   */
  convertToArrow() {
    const state = window.PicEditor.state;
    if (!state.selectedElement || state.selectedElement.tagName !== 'line') {
      alert('변환할 "직선(line) 요소"를 먼저 클릭하여 선택해 주세요.');
      return;
    }
    const arrowDir = document.getElementById('arrowDirSelect').value;
    const num = state.activeTab;
    this.applyArrowMarkers(state.selectedElement, arrowDir, num);
    window.PicEditor.interaction.initMovableEvents();
    if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    alert('선택한 직선이 화살표로 변경되었습니다!');
  }
};

// 전역 단축 참조
window.onToolChange = () => window.PicEditor.tools.onToolChange();
window.convertToArrow = () => window.PicEditor.tools.convertToArrow();
