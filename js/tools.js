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

    // 외적으로 중심 C가 시점->종점 벡터의 어느 쪽에 위치하는지 판정
    // Y축이 아래로 향하는 화면 좌표계 기준
    const cross = (x2 - x1) * (cy - y1) - (y2 - y1) * (cx - x1);
    const sweep = (cross <= 0) ? 1 : 0;

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
      x2 = parseFloat(aMatch[6]);
      y2 = parseFloat(aMatch[7]);
      cx = (x1 + x2) / 2;
      cy = (y1 + y2) / 2;
      return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, c: { x: cx, y: cy } };
    }

    const qMatch = d.match(/Q\s*([\d\.-]+)[,\s]+([\d\.-]+)[,\s]+([\d\.-]+)[,\s]+([\d\.-]+)/i);
    if (qMatch) {
      cx = parseFloat(qMatch[1]);
      cy = parseFloat(qMatch[2]);
      x2 = parseFloat(qMatch[3]);
      y2 = parseFloat(qMatch[4]);
      return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, c: { x: cx, y: cy } };
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
   * SVG 캔버스 내 붉은 중심점 핸들(Gizmo) 요소 보장 및 이벤트 바인딩
   */
  ensureArcCenterGizmo(svg) {
    let gizmo = svg.querySelector('#arc-center-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'arc-center-handle-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:all;');

      gizmo.innerHTML = `
        <line id="arc-chord-guide" stroke="#94a3b8" stroke-dasharray="4,4" stroke-width="1.2" />
        <line id="arc-axis-guide" stroke="#ef4444" stroke-dasharray="2,2" stroke-width="1" />
        <line id="arc-radius-guide-1" stroke="#fca5a5" stroke-dasharray="3,3" stroke-width="1" />
        <line id="arc-radius-guide-2" stroke="#fca5a5" stroke-dasharray="3,3" stroke-width="1" />
        <circle id="arc-p1-anchor" r="4" fill="#3b82f6" />
        <circle id="arc-p2-anchor" r="4" fill="#3b82f6" />
        <g id="arc-center-handle-wrap" style="cursor:grab;">
          <circle id="arc-center-hit" r="18" fill="transparent" />
          <circle id="arc-center-outer" r="8.5" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));" />
          <circle id="arc-center-inner" r="3" fill="#ffffff" />
          <text id="arc-center-label" font-size="11" font-weight="700" fill="#dc2626" x="12" y="4" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">원의 중심</text>
        </g>
      `;

      svg.appendChild(gizmo);

      const handleWrap = gizmo.querySelector('#arc-center-handle-wrap');
      handleWrap.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const state = window.PicEditor.state;
        state.isDraggingArcCenter = true;
        handleWrap.style.cursor = 'grabbing';
      });
    }
    return gizmo;
  },

  /**
   * 선택된 호 요소에 붉은 중심점 핸들 표시
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

    // 가이드 라인 및 앵커 좌표 갱신
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

    const ap1 = gizmo.querySelector('#arc-p1-anchor');
    ap1.setAttribute('cx', p1.x);
    ap1.setAttribute('cy', p1.y);

    const ap2 = gizmo.querySelector('#arc-p2-anchor');
    ap2.setAttribute('cx', p2.x);
    ap2.setAttribute('cy', p2.y);

    // 붉은 원의 중심점 위치 이동
    const wrap = gizmo.querySelector('#arc-center-handle-wrap');
    wrap.setAttribute('transform', `translate(${c.x}, ${c.y})`);

    const r = Math.round((Math.hypot(p1.x - c.x, p1.y - c.y) + Math.hypot(p2.x - c.x, p2.y - c.y)) / 2);
    const label = gizmo.querySelector('#arc-center-label');
    if (label) label.textContent = `원의 중심 (R=${r}px)`;

    gizmo.style.display = 'block';
  },

  /**
   * 붉은 중심점 핸들 숨기기
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
