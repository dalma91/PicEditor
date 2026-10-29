/**
 * tools.js - 도형 및 화살표, 호(Arc) 그리기 및 변환 도구
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.tools = {
  /**
   * 도구 선택 셀렉트 박스 변경 시 옵션 표시 제어
   */
  currentTool: 'line',

  getCurrentTool() {
    return this.currentTool || (document.getElementById('toolSelect') ? document.getElementById('toolSelect').value : 'line');
  },

  /**
   * 아이콘 버튼 클릭 시 도구 설정
   */
  setTool(toolName) {
    this.currentTool = toolName;
    const toolSelect = document.getElementById('toolSelect');
    if (toolSelect) toolSelect.value = toolName;

    // 아이콘 버튼 활성화 상태 갱신
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolName);
    });

    // 상단 뱃지 갱신
    const badge = document.getElementById('currentToolBadge');
    const toolNames = {
      axes: '좌표계',
      line: '직선',
      arrow: '화살표',
      rect: '사각형',
      triangle: '삼각형',
      circle: '원',
      arc: '호',
      text: '글자',
      parabola2: '포물선(2점)',
      parabola3: '포물선(3점)',
      hyperbola: '반비례(1/x)',
      sqrt: '루트(√x)',
      exp: '지수(e⁻ˣ)'
    };
    if (badge) badge.textContent = toolNames[toolName] || toolName;

    // 서브 옵션 표시/숨김
    const arrowGrp = document.getElementById('arrowOptionGroup');
    const arcGrp = document.getElementById('arcOptionGroup');
    const textGrp = document.getElementById('textOptionGroup');

    if (arrowGrp) arrowGrp.style.display = (toolName === 'arrow') ? 'flex' : 'none';
    if (arcGrp) arcGrp.style.display = (toolName === 'arc') ? 'flex' : 'none';
    if (textGrp) textGrp.style.display = (toolName === 'text') ? 'flex' : 'none';

    // 안내 박스 텍스트 갱신
    const tipBox = document.getElementById('toolTipBox');
    const tips = {
      axes: '💡 <b>직교 좌표계</b>: 마우스로 드래그하여 직사각형 크기에 맞는 직교 좌표계(x, y축)를 생성합니다. (원점 기준 회전 가능)',
      line: '💡 <b>직선</b>: 마우스로 드래그하여 시점부터 종점까지 직선을 그립니다.',
      arrow: '💡 <b>화살표</b>: 드래그하여 벡터 화살표를 작도합니다. (하단에서 방향 선택 가능)',
      rect: '💡 <b>직사각형</b>: 드래그하여 작도합니다. (선택 시 4개 꼭짓점(파란 점)을 드래그하면 직사각형의 정의를 유지하며 점 한 쌍이 함께 조절됩니다)',
      triangle: '💡 <b>삼각형</b>: 드래그하여 작도합니다. (선택 시 3개 꼭짓점(파란 점)을 각각 자유롭게 이동할 수 있습니다)',
      circle: '💡 <b>원</b>: 중심점을 클릭하고 바깥으로 드래그하여 원을 그립니다. (선택 시 원 중심에 빨간 점이 표시되며 드래그하여 이동할 수 있습니다)',
      arc: '💡 <b>원호</b>: 드래그 후 나타나는 🔴호의 중심이나 🔵끝점을 당겨 곡률을 조절합니다.',
      text: '💡 <b>글자</b>: 캔버스에서 글자를 넣을 위치를 클릭하면 즉시 입력창이 열립니다.',
      parabola2: '💡 <b>포물선 (꼭짓점-끝점)</b>: 꼭짓점을 누른 채 좌/우 낙하지점으로 드래그합니다.',
      parabola3: '💡 <b>포물선 (3점)</b>: 발사점에서 최고점 및 반대편 낙하지점으로 드래그합니다.',
      hyperbola: '💡 <b>반비례 곡선 (y=k/x)</b>: 대각선으로 드래그하여 보일 법칙(등온선) 쌍곡선을 작도합니다.',
      sqrt: '💡 <b>무리함수 (y=√x)</b>: 원점에서 드래그하여 위로 완만해지는 루트 곡선을 작도합니다.',
      exp: '💡 <b>지수 곡선 (y=e⁻ˣ)</b>: 대각선으로 드래그하여 지수 감쇠(방사성/방전) 곡선을 작도합니다.'
    };
    if (tipBox && tips[toolName]) {
      tipBox.innerHTML = tips[toolName];
    }

    // 선택 모드인 경우 자동으로 작도 모드로 전환
    const state = window.PicEditor.state;
    if (state && !state.isDrawMode) {
      if (window.PicEditor.interaction && window.PicEditor.interaction.toggleMode) {
        window.PicEditor.interaction.toggleMode();
      } else if (typeof window.toggleMode === 'function') {
        window.toggleMode();
      }
    }
  },

  /**
   * 레거시 셀렉트 호환 및 초기화
   */
  onToolChange() {
    const toolEl = document.getElementById('toolSelect');
    if (!toolEl) return;
    this.setTool(toolEl.value);
  },

  /**
   * 실선/점선 토글 및 선택된 객체에 변환 적용
   */
  setStrokeStyle(style) {
    const sel = document.getElementById('strokeStyleSelect');
    if (sel) sel.value = style;

    // 상단 툴바 토글 버튼 상태 동기화
    const btnSolid = document.getElementById('btnStrokeSolid');
    const btnDashed = document.getElementById('btnStrokeDashed');
    if (btnSolid) btnSolid.classList.toggle('active', style === 'solid');
    if (btnDashed) btnDashed.classList.toggle('active', style === 'dashed');

    // 인스펙터 토글 버튼 상태 동기화
    const inspSolid = document.getElementById('inspStrokeSolid');
    const inspDashed = document.getElementById('inspStrokeDashed');
    if (inspSolid) inspSolid.classList.toggle('active', style === 'solid');
    if (inspDashed) inspDashed.classList.toggle('active', style === 'dashed');

    // 선택된 객체가 있을 경우, 해당 객체(모든 종류의 객체)에 실선/점선 변환 즉시 적용
    const state = window.PicEditor.state;
    if (state && state.selectedElement) {
      const target = state.selectedElement.closest('.axes-wrap') || 
                     state.selectedElement.closest('.text-wrap') || 
                     state.selectedElement.closest('.mid-arrow') || 
                     state.selectedElement;
      
      this.applyStrokeStyleToElement(target, style);
      if (window.PicEditor.sync) window.PicEditor.sync.markModified();
    }
  },

  /**
   * 임의의 SVG 요소(직선, 화살표, 호, 원, 사각형, 삼각형, 포물선, 곡선, 좌표계, 글자박스 등 모든 객체)에 실선/점선 적용
   */
  applyStrokeStyleToElement(target, style) {
    if (!target) return;
    const isDashed = (style === 'dashed');
    const dashVal = '6,4';

    // 1. 좌표계 (axes-wrap): X축 및 Y축 라인에 적용
    if (target.classList.contains('axes-wrap')) {
      target.querySelectorAll('.axis-line').forEach(line => {
        if (isDashed) line.setAttribute('stroke-dasharray', dashVal);
        else line.removeAttribute('stroke-dasharray');
      });
      return;
    }

    // 2. 글자 래퍼 (text-wrap): 배경 박스 테두리에 적용
    if (target.classList.contains('text-wrap')) {
      const bg = target.querySelector('.text-bg-rect');
      if (bg) {
        if (isDashed) bg.setAttribute('stroke-dasharray', '4,3');
        else bg.removeAttribute('stroke-dasharray');
      }
      return;
    }

    // 3. 중간 화살표 래퍼 (mid-arrow)
    if (target.classList.contains('mid-arrow')) {
      const forId = target.getAttribute('data-for');
      if (forId) {
        const svg = target.closest('svg');
        const parentLine = svg ? svg.querySelector('#' + forId) : null;
        if (parentLine) {
          if (isDashed) parentLine.setAttribute('stroke-dasharray', dashVal);
          else parentLine.removeAttribute('stroke-dasharray');
        }
      }
    }

    // 4. 일반 단일 도형 (line, path, rect, circle, polygon 등)
    if (isDashed) {
      target.setAttribute('stroke-dasharray', dashVal);
    } else {
      target.removeAttribute('stroke-dasharray');
    }

    // 5. 그룹(g) 요소인 경우 내부 모든 스트로크 도형에 일괄 적용
    if (target.tagName && target.tagName.toLowerCase() === 'g') {
      target.querySelectorAll('line, path, rect, circle, polygon').forEach(child => {
        if (child.classList.contains('text-bg-rect')) return;
        if (isDashed) child.setAttribute('stroke-dasharray', dashVal);
        else child.removeAttribute('stroke-dasharray');
      });
    }
  },

  /**
   * 요소의 현재 실선/점선 상태 확인 ('dashed' 또는 'solid')
   */
  getStrokeStyleOfElement(el) {
    if (!el) return 'solid';
    const target = el.closest('.axes-wrap') || el.closest('.text-wrap') || el.closest('.mid-arrow') || el;
    let strokeEl = target;
    if (target.classList.contains('axes-wrap')) {
      strokeEl = target.querySelector('.axis-line') || target;
    } else if (target.classList.contains('text-wrap')) {
      strokeEl = target.querySelector('.text-bg-rect') || target;
    } else if (target.classList.contains('mid-arrow')) {
      const forId = target.getAttribute('data-for');
      const svg = target.closest('svg');
      strokeEl = (svg && forId) ? (svg.querySelector('#' + forId) || target) : target;
    }
    const da = strokeEl.getAttribute('stroke-dasharray');
    return (da && da !== 'none' && da.trim() !== '') ? 'dashed' : 'solid';
  },

  /**
   * 화살표 방향 설정
   */
  setArrowDir(dir) {
    const sel = document.getElementById('arrowDirSelect');
    if (sel) sel.value = dir;
    document.querySelectorAll('.arrow-dir-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.dir === dir);
    });
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
    const type = el.getAttribute('data-type') || '';
    if (type === 'arc') return true;
    if (type.startsWith('parabola') || type === 'hyperbola' || type === 'sqrt' || type === 'exp') return false;
    const d = el.getAttribute('d') || '';
    if (d.includes('A ') || d.includes('a ')) return true;
    if (el.getAttribute('data-cx') && el.getAttribute('data-r')) return true;
    return false;
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
   * 요소가 직선 또는 화살표 선 관련 요소인지 확인
   */
  isLineElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'line') return true;
    if (el.classList && el.classList.contains('mid-arrow')) return true;
    if (el.getAttribute && el.getAttribute('data-for')) return true;
    return false;
  },

  /**
   * 선 관련 요소에서 실제 <line> SVGElement 추출
   */
  getLineElement(el) {
    if (!el) return null;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'line') return el;
    if (el.getAttribute && el.getAttribute('data-for')) {
      const root = el.ownerSVGElement || document;
      return root.getElementById(el.getAttribute('data-for'));
    }
    const mid = el.closest ? el.closest('.mid-arrow') : null;
    if (mid && mid.getAttribute('data-for')) {
      const root = mid.ownerSVGElement || document;
      return root.getElementById(mid.getAttribute('data-for'));
    }
    return null;
  },

  /**
   * SVG 캔버스 내 직선 및 화살표 양 끝점(파란 점) 조작 핸들(Gizmo) 요소 보장 및 이벤트 바인딩
   */
  ensureLineGizmo(svg) {
    let gizmo = svg.querySelector('#line-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'line-handle-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:none;');

      gizmo.innerHTML = `
        <!-- 파란색 시점 P1 조작 핸들 -->
        <g id="line-p1-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="line-p1-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="line-p1-anchor" r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="line-p1-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="line-p1-label" font-size="10" font-weight="700" fill="#2563eb" x="-26" y="-10" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">시점</text>
        </g>

        <!-- 파란색 종점 P2 조작 핸들 -->
        <g id="line-p2-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="line-p2-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="line-p2-anchor" r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="line-p2-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="line-p2-label" font-size="10" font-weight="700" fill="#2563eb" x="12" y="-10" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">종점</text>
        </g>
      `;

      svg.appendChild(gizmo);

      // 파란색 시점(P1) 드래그 이벤트
      const handleP1Wrap = gizmo.querySelector('#line-p1-handle-wrap');
      const startDragP1 = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingLineP1 = true;
        state.hasDragged = false;
        handleP1Wrap.style.cursor = 'grabbing';
      };
      handleP1Wrap.addEventListener('mousedown', startDragP1);
      handleP1Wrap.addEventListener('touchstart', startDragP1, { passive: false });

      // 파란색 종점(P2) 드래그 이벤트
      const handleP2Wrap = gizmo.querySelector('#line-p2-handle-wrap');
      const startDragP2 = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingLineP2 = true;
        state.hasDragged = false;
        handleP2Wrap.style.cursor = 'grabbing';
      };
      handleP2Wrap.addEventListener('mousedown', startDragP2);
      handleP2Wrap.addEventListener('touchstart', startDragP2, { passive: false });
    }
    return gizmo;
  },

  /**
   * 선택된 직선/화살표 요소에 양 끝점(시점/종점) 파란색 조작 핸들 표시
   */
  showLineHandles(el) {
    const lineEl = this.getLineElement(el);
    if (!lineEl) return;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    const gizmo = this.ensureLineGizmo(svg);
    const x1 = parseFloat(lineEl.getAttribute('x1')) || 0;
    const y1 = parseFloat(lineEl.getAttribute('y1')) || 0;
    const x2 = parseFloat(lineEl.getAttribute('x2')) || 0;
    const y2 = parseFloat(lineEl.getAttribute('y2')) || 0;

    // 선 요소의 transform(위치/회전)과 동일하게 동기화
    gizmo.setAttribute('transform', lineEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');

    const p1Wrap = gizmo.querySelector('#line-p1-handle-wrap');
    if (p1Wrap) p1Wrap.setAttribute('transform', `translate(${x1}, ${y1})`);

    const p2Wrap = gizmo.querySelector('#line-p2-handle-wrap');
    if (p2Wrap) p2Wrap.setAttribute('transform', `translate(${x2}, ${y2})`);

    const len = Math.round(Math.hypot(x2 - x1, y2 - y1));
    const p2Label = gizmo.querySelector('#line-p2-label');
    if (p2Label) p2Label.textContent = `종점 (${len}px)`;

    gizmo.style.display = 'block';
  },

  /**
   * 직선/화살표 양 끝점 조작 핸들 숨기기
   */
  hideLineHandles() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#line-handle-group');
    if (gizmo) gizmo.style.display = 'none';
  },

  /**
   * 직선/화살표가 드래그 이동 또는 변환될 때 기즈모의 transform 동기화
   */
  updateLineGizmoTransform(lineEl) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#line-handle-group');
    if (gizmo && gizmo.style.display !== 'none') {
      gizmo.setAttribute('transform', lineEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    }
  },

  /**
   * 요소가 원(Circle)인지 여부 판별
   */
  isCircleElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag !== 'circle') return false;
    if (el.id && el.id.includes('handle')) return false;
    if (el.classList && (el.classList.contains('axis-origin-dot') || el.classList.contains('text-bg-rect'))) return false;
    return el.classList && el.classList.contains('movable');
  },

  /**
   * 요소가 삼각형(Polygon)인지 여부 판별
   */
  isTriangleElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag !== 'polygon') return false;
    if (el.classList && el.classList.contains('mid-arrow')) return false;
    return el.classList && el.classList.contains('movable');
  },

  /**
   * 삼각형의 3개 꼭짓점 좌표 배열 [{x,y}, {x,y}, {x,y}] 추출
   */
  getTrianglePoints(el) {
    if (!el) return null;
    const raw = (el.getAttribute('points') || '').trim();
    if (!raw) return null;
    const pairs = raw.split(/[\s,]+/).filter(Boolean);
    if (pairs.length >= 6) {
      return [
        { x: parseFloat(pairs[0]) || 0, y: parseFloat(pairs[1]) || 0 },
        { x: parseFloat(pairs[2]) || 0, y: parseFloat(pairs[3]) || 0 },
        { x: parseFloat(pairs[4]) || 0, y: parseFloat(pairs[5]) || 0 }
      ];
    }
    return null;
  },

  /**
   * 요소가 직사각형(Rect)인지 여부 판별
   */
  isRectElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag !== 'rect') return false;
    if (el.classList && el.classList.contains('text-bg-rect')) return false;
    return el.classList && el.classList.contains('movable');
  },

  /**
   * 원(Circle) 중심 빨간 점 조작 핸들 보장 및 이벤트 바인딩
   */
  ensureCircleGizmo(svg) {
    let gizmo = svg.querySelector('#circle-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'circle-handle-group');
      gizmo.setAttribute('class', 'editor-gizmo-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:none;');
      gizmo.innerHTML = `
        <!-- 원의 중심 붉은 점 조작 핸들 -->
        <g id="circle-center-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="circle-center-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="circle-center-anchor" r="6.5" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="circle-center-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="circle-center-label" font-size="10" font-weight="700" fill="#dc2626" x="12" y="4" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">중심</text>
        </g>
      `;
      svg.appendChild(gizmo);

      const handleCenter = gizmo.querySelector('#circle-center-handle-wrap');
      const startDragCenter = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingCircleCenter = true;
        state.hasDragged = false;
        handleCenter.style.cursor = 'grabbing';
      };
      handleCenter.addEventListener('mousedown', startDragCenter);
      handleCenter.addEventListener('touchstart', startDragCenter, { passive: false });
    }
    return gizmo;
  },

  showCircleHandles(circleEl) {
    if (!circleEl) return;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    const gizmo = this.ensureCircleGizmo(svg);
    const cx = parseFloat(circleEl.getAttribute('cx')) || 0;
    const cy = parseFloat(circleEl.getAttribute('cy')) || 0;

    gizmo.setAttribute('transform', circleEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    const centerWrap = gizmo.querySelector('#circle-center-handle-wrap');
    if (centerWrap) centerWrap.setAttribute('transform', `translate(${cx}, ${cy})`);
    gizmo.style.display = 'block';
  },

  hideCircleHandles() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#circle-handle-group');
    if (gizmo) gizmo.style.display = 'none';
  },

  updateCircleGizmoTransform(circleEl) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#circle-handle-group');
    if (gizmo && gizmo.style.display !== 'none') {
      gizmo.setAttribute('transform', circleEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    }
  },

  /**
   * 삼각형(Triangle) 꼭짓점 3개 파란 점 조작 핸들 보장 및 이벤트 바인딩
   */
  ensureTriangleGizmo(svg) {
    let gizmo = svg.querySelector('#triangle-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'triangle-handle-group');
      gizmo.setAttribute('class', 'editor-gizmo-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:none;');
      gizmo.innerHTML = `
        <g id="triangle-p1-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
          <text font-size="10" font-weight="700" fill="#2563eb" x="10" y="-8" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">P1</text>
        </g>
        <g id="triangle-p2-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
          <text font-size="10" font-weight="700" fill="#2563eb" x="-24" y="16" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">P2</text>
        </g>
        <g id="triangle-p3-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
          <text font-size="10" font-weight="700" fill="#2563eb" x="10" y="16" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">P3</text>
        </g>
      `;
      svg.appendChild(gizmo);

      [1, 2, 3].forEach(idx => {
        const h = gizmo.querySelector(`#triangle-p${idx}-handle-wrap`);
        const startDrag = (e) => {
          e.stopPropagation();
          if (e.cancelable && e.type === 'touchstart') e.preventDefault();
          const state = window.PicEditor.state;
          state[`isDraggingTriangleP${idx}`] = true;
          state.hasDragged = false;
          h.style.cursor = 'grabbing';
        };
        h.addEventListener('mousedown', startDrag);
        h.addEventListener('touchstart', startDrag, { passive: false });
      });
    }
    return gizmo;
  },

  showTriangleHandles(triEl) {
    if (!triEl) return;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    const gizmo = this.ensureTriangleGizmo(svg);
    const pts = this.getTrianglePoints(triEl);
    if (!pts) {
      gizmo.style.display = 'none';
      return;
    }

    gizmo.setAttribute('transform', triEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');

    const p1 = gizmo.querySelector('#triangle-p1-handle-wrap');
    const p2 = gizmo.querySelector('#triangle-p2-handle-wrap');
    const p3 = gizmo.querySelector('#triangle-p3-handle-wrap');

    if (p1) p1.setAttribute('transform', `translate(${pts[0].x}, ${pts[0].y})`);
    if (p2) p2.setAttribute('transform', `translate(${pts[1].x}, ${pts[1].y})`);
    if (p3) p3.setAttribute('transform', `translate(${pts[2].x}, ${pts[2].y})`);

    gizmo.style.display = 'block';
  },

  hideTriangleHandles() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#triangle-handle-group');
    if (gizmo) gizmo.style.display = 'none';
  },

  updateTriangleGizmoTransform(triEl) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#triangle-handle-group');
    if (gizmo && gizmo.style.display !== 'none') {
      gizmo.setAttribute('transform', triEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    }
  },

  /**
   * 직사각형(Rect) 꼭짓점 4개 파란 점 조작 핸들 보장 및 이벤트 바인딩
   */
  ensureRectGizmo(svg) {
    let gizmo = svg.querySelector('#rect-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'rect-handle-group');
      gizmo.setAttribute('class', 'editor-gizmo-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:none;');
      gizmo.innerHTML = `
        <g id="rect-v0-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
        </g>
        <g id="rect-v1-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
        </g>
        <g id="rect-v2-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
        </g>
        <g id="rect-v3-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle r="2" fill="#ffffff" style="pointer-events:none;" />
        </g>
      `;
      svg.appendChild(gizmo);

      [0, 1, 2, 3].forEach(idx => {
        const h = gizmo.querySelector(`#rect-v${idx}-handle-wrap`);
        const startDrag = (e) => {
          e.stopPropagation();
          if (e.cancelable && e.type === 'touchstart') e.preventDefault();
          const state = window.PicEditor.state;
          state.isDraggingRectCorner = true;
          state.rectCornerIndex = idx;
          state.hasDragged = false;

          const rectEl = state.selectedElement;
          if (rectEl) {
            const x = parseFloat(rectEl.getAttribute('x')) || 0;
            const y = parseFloat(rectEl.getAttribute('y')) || 0;
            const w = parseFloat(rectEl.getAttribute('width')) || 0;
            const h = parseFloat(rectEl.getAttribute('height')) || 0;

            // 반대편 대각선 꼭짓점을 고정 앵커로 설정하여 직사각형의 정의 엄격 유지
            let ax = x, ay = y;
            if (idx === 0) { ax = x + w; ay = y + h; }
            else if (idx === 1) { ax = x; ay = y + h; }
            else if (idx === 2) { ax = x; ay = y; }
            else if (idx === 3) { ax = x + w; ay = y; }
            state.rectAnchor = { x: ax, y: ay };
          }
          h.style.cursor = 'grabbing';
        };
        h.addEventListener('mousedown', startDrag);
        h.addEventListener('touchstart', startDrag, { passive: false });
      });
    }
    return gizmo;
  },

  showRectHandles(rectEl) {
    if (!rectEl) return;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    const gizmo = this.ensureRectGizmo(svg);
    const x = parseFloat(rectEl.getAttribute('x')) || 0;
    const y = parseFloat(rectEl.getAttribute('y')) || 0;
    const w = parseFloat(rectEl.getAttribute('width')) || 0;
    const h = parseFloat(rectEl.getAttribute('height')) || 0;

    gizmo.setAttribute('transform', rectEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');

    const v0 = gizmo.querySelector('#rect-v0-handle-wrap');
    const v1 = gizmo.querySelector('#rect-v1-handle-wrap');
    const v2 = gizmo.querySelector('#rect-v2-handle-wrap');
    const v3 = gizmo.querySelector('#rect-v3-handle-wrap');

    if (v0) v0.setAttribute('transform', `translate(${x}, ${y})`);
    if (v1) v1.setAttribute('transform', `translate(${x + w}, ${y})`);
    if (v2) v2.setAttribute('transform', `translate(${x + w}, ${y + h})`);
    if (v3) v3.setAttribute('transform', `translate(${x}, ${y + h})`);

    gizmo.style.display = 'block';
  },

  hideRectHandles() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#rect-handle-group');
    if (gizmo) gizmo.style.display = 'none';
  },

  updateRectGizmoTransform(rectEl) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#rect-handle-group');
    if (gizmo && gizmo.style.display !== 'none') {
      gizmo.setAttribute('transform', rectEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    }
  },

  /**
   * 요소가 포물선(parabola2 또는 parabola3)인지 여부 판별
   */
  isParabolaElement(el) {
    if (!el || (el.tagName || '').toLowerCase() !== 'path') return false;
    const type = el.getAttribute('data-type') || '';
    if (type === 'parabola2' || type === 'parabola3' || el.classList.contains('parabola-shape')) return true;
    if (type === 'arc' || type === 'hyperbola' || type === 'sqrt' || type === 'exp') return false;
    const d = el.getAttribute('d') || '';
    return d.includes('Q ') || d.includes('q ');
  },

  /**
   * 포물선 y = a*(x - vx)^2 + vy 위의 점 중 (px, py)에 가장 가까운 점(투영점) 계산
   */
  projectOntoParabola(px, py, vx, vy, a) {
    if (Math.abs(a) < 1e-9) {
      return { x: px, y: vy };
    }
    const xd = px - vx;
    const yd = py - vy;
    let u = xd;
    // 뉴턴-랩슨 반복 (최대 6회)으로 최적 u 찾기
    for (let iter = 0; iter < 6; iter++) {
      const f = 2 * a * a * u * u * u + (1 - 2 * a * yd) * u - xd;
      const df = 6 * a * a * u * u + (1 - 2 * a * yd);
      if (Math.abs(df) < 1e-7) break;
      const nextU = u - f / df;
      if (!isFinite(nextU) || Math.abs(nextU) > 20000) break;
      if (Math.abs(nextU - u) < 1e-4) {
        u = nextU;
        break;
      }
      u = nextU;
    }
    if (!isFinite(u) || Math.abs(u) > 20000) u = xd;
    const projX = vx + u;
    const projY = vy + a * u * u;
    return { x: projX, y: projY };
  },

  /**
   * 포물선 곡선 데이터 (타입, 꼭짓점 V, 양 끝점 P1, P2, 곡률 a) 추출
   */
  getParabolaData(el) {
    if (!el) return null;
    const d = (el.getAttribute('d') || '').trim();
    // d 형식: M x0,y0 Q cx,cy x1,y1
    const m = d.match(/M\s*([-\d.]+)[,\s]+([-\d.]+)\s*Q\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)/i);
    if (!m) return null;
    const x0 = parseFloat(m[1]), y0 = parseFloat(m[2]);
    const cx = parseFloat(m[3]), cy = parseFloat(m[4]);
    const x1 = parseFloat(m[5]), y1 = parseFloat(m[6]);

    let type = el.getAttribute('data-type');
    if (!type) {
      if (Math.abs(cy - y0) < 1.0 || Math.abs(cx - x1) < 1.0) type = 'parabola2';
      else type = 'parabola3';
    }

    if (type === 'parabola3') {
      let vx, vy, a;
      const attrVx = el.getAttribute('data-vx');
      const attrVy = el.getAttribute('data-vy');
      const attrA = el.getAttribute('data-a');
      if (attrVx !== null && attrVy !== null && attrA !== null) {
        vx = parseFloat(attrVx);
        vy = parseFloat(attrVy);
        a = parseFloat(attrA);
      } else {
        const dx = x1 - x0;
        if (Math.abs(dx) > 1e-4) {
          a = (y0 + y1 - 2 * cy) / (dx * dx);
          if (Math.abs(a) > 1e-8) {
            vx = (x0 + x1) / 2 - (y1 - y0) / (2 * a * dx);
            vy = y0 - a * Math.pow(x0 - vx, 2);
          } else {
            vx = (x0 + x1) / 2;
            vy = (cy + y0) / 2;
            a = (y0 - vy) / Math.max(1, Math.pow(x0 - vx, 2));
          }
        } else {
          vx = cx;
          vy = (cy + y0) / 2;
          a = 0;
        }
      }
      return {
        type: 'parabola3',
        v: { x: vx, y: vy },
        p1: { x: x0, y: y0 },
        p2: { x: x1, y: y1 },
        a: a
      };
    } else {
      // parabola2: x0,y0 (꼭짓점 V), x1,y1 (끝점 P1)
      return {
        type: 'parabola2',
        v: { x: x0, y: y0 },
        p1: { x: x1, y: y1 }
      };
    }
  },

  /**
   * 포물선 조작 핸들 보장 (꼭짓점에 붉은색 점, 끝점에 파란색 점)
   */
  ensureParabolaGizmo(svg) {
    let gizmo = svg.querySelector('#parabola-handle-group');
    if (!gizmo) {
      gizmo = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gizmo.setAttribute('id', 'parabola-handle-group');
      gizmo.setAttribute('class', 'editor-gizmo-group');
      gizmo.setAttribute('style', 'display:none; pointer-events:none;');
      gizmo.innerHTML = `
        <!-- 꼭짓점 붉은색 점 조작 핸들 -->
        <g id="parabola-v-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="parabola-v-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="parabola-v-anchor" r="7" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="parabola-v-inner" r="2.5" fill="#ffffff" style="pointer-events:none;" />
          <text id="parabola-v-label" font-size="10" font-weight="700" fill="#dc2626" x="12" y="4" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">꼭짓점</text>
        </g>

        <!-- 끝점 / 시점 파란색 점 조작 핸들 -->
        <g id="parabola-p1-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="parabola-p1-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="parabola-p1-anchor" r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="parabola-p1-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="parabola-p1-label" font-size="10" font-weight="700" fill="#2563eb" x="12" y="4" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">끝점</text>
        </g>

        <!-- 우측 끝점 파란색 점 조작 핸들 (parabola3 전용) -->
        <g id="parabola-p2-handle-wrap" style="cursor:grab; pointer-events:all;">
          <circle id="parabola-p2-hit" r="22" fill="#000000" opacity="0.001" style="cursor:grab; pointer-events:all;" />
          <circle id="parabola-p2-anchor" r="6.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35)); pointer-events:none;" />
          <circle id="parabola-p2-inner" r="2" fill="#ffffff" style="pointer-events:none;" />
          <text id="parabola-p2-label" font-size="10" font-weight="700" fill="#2563eb" x="12" y="4" style="user-select:none; pointer-events:none; text-shadow:0 1px 2px #ffffff;">종점</text>
        </g>
      `;
      svg.appendChild(gizmo);

      const vWrap = gizmo.querySelector('#parabola-v-handle-wrap');
      const startDragV = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingParabolaV = true;
        state.hasDragged = false;
        vWrap.style.cursor = 'grabbing';
      };
      vWrap.addEventListener('mousedown', startDragV);
      vWrap.addEventListener('touchstart', startDragV, { passive: false });

      const p1Wrap = gizmo.querySelector('#parabola-p1-handle-wrap');
      const startDragP1 = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingParabolaP1 = true;
        state.hasDragged = false;
        p1Wrap.style.cursor = 'grabbing';
      };
      p1Wrap.addEventListener('mousedown', startDragP1);
      p1Wrap.addEventListener('touchstart', startDragP1, { passive: false });

      const p2Wrap = gizmo.querySelector('#parabola-p2-handle-wrap');
      const startDragP2 = (e) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        const state = window.PicEditor.state;
        state.isDraggingParabolaP2 = true;
        state.hasDragged = false;
        p2Wrap.style.cursor = 'grabbing';
      };
      p2Wrap.addEventListener('mousedown', startDragP2);
      p2Wrap.addEventListener('touchstart', startDragP2, { passive: false });
    }
    return gizmo;
  },

  showParabolaHandles(parabolaEl) {
    if (!parabolaEl) return;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    const gizmo = this.ensureParabolaGizmo(svg);
    const data = this.getParabolaData(parabolaEl);
    if (!data) {
      gizmo.style.display = 'none';
      return;
    }

    gizmo.setAttribute('transform', parabolaEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');

    const vWrap = gizmo.querySelector('#parabola-v-handle-wrap');
    const p1Wrap = gizmo.querySelector('#parabola-p1-handle-wrap');
    const p2Wrap = gizmo.querySelector('#parabola-p2-handle-wrap');

    if (vWrap) vWrap.setAttribute('transform', `translate(${data.v.x}, ${data.v.y})`);
    if (p1Wrap) p1Wrap.setAttribute('transform', `translate(${data.p1.x}, ${data.p1.y})`);

    const p1Lbl = gizmo.querySelector('#parabola-p1-label');
    if (data.type === 'parabola3') {
      if (p1Lbl) p1Lbl.textContent = '시점';
      if (p2Wrap) {
        p2Wrap.style.display = 'block';
        p2Wrap.setAttribute('transform', `translate(${data.p2.x}, ${data.p2.y})`);
      }
    } else {
      if (p1Lbl) p1Lbl.textContent = '끝점';
      if (p2Wrap) p2Wrap.style.display = 'none';
    }

    gizmo.style.display = 'block';
  },

  hideParabolaHandles() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#parabola-handle-group');
    if (gizmo) gizmo.style.display = 'none';
  },

  updateParabolaGizmoTransform(parabolaEl) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const gizmo = svg.querySelector('#parabola-handle-group');
    if (gizmo && gizmo.style.display !== 'none') {
      gizmo.setAttribute('transform', parabolaEl.getAttribute('transform') || 'translate(0,0) scale(1,1) rotate(0)');
    }
  },

  /**
   * 모든 기즈모 조작점(호, 직선, 원, 삼각형, 직사각형, 포물선) 일괄 숨김
   */
  hideAllGizmos() {
    this.hideArcCenterHandle();
    this.hideLineHandles();
    this.hideCircleHandles();
    this.hideTriangleHandles();
    this.hideRectHandles();
    this.hideParabolaHandles();
  },

  /**
   * 선택된 요소의 타입에 맞추어 활성화된 기즈모의 transform 속성 동기화
   */
  updateGizmosTransform(el) {
    if (!el) return;
    if (this.isArcElement(el)) this.updateArcGizmoTransform(el);
    else if (this.isLineElement(el)) this.updateLineGizmoTransform(el);
    else if (this.isCircleElement(el)) this.updateCircleGizmoTransform(el);
    else if (this.isTriangleElement(el)) this.updateTriangleGizmoTransform(el);
    else if (this.isRectElement(el)) this.updateRectGizmoTransform(el);
    else if (this.isParabolaElement(el)) this.updateParabolaGizmoTransform(el);
  },


  /**
   * 중간 화살표(mid-arrow) 위치 및 각도 갱신
   */
  updateMidArrowPosition(lineEl) {
    if (!lineEl || !lineEl.id) return;
    const parent = lineEl.parentNode;
    if (!parent) return;
    const midArrow = parent.querySelector(`g.mid-arrow[data-for="${lineEl.id}"]`);
    if (!midArrow) return;

    const x1 = parseFloat(lineEl.getAttribute('x1')) || 0;
    const y1 = parseFloat(lineEl.getAttribute('y1')) || 0;
    const x2 = parseFloat(lineEl.getAttribute('x2')) || 0;
    const y2 = parseFloat(lineEl.getAttribute('y2')) || 0;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    let angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    if (midArrow.getAttribute('data-dir') === 'mid-left') angle += 180;

    midArrow.setAttribute("transform", `translate(${mx}, ${my}) rotate(${angle})`);
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
    g.setAttribute("data-dir", dir);
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

window.setTool = (t) => window.PicEditor.tools.setTool(t);
window.setStrokeStyle = (s) => window.PicEditor.tools.setStrokeStyle(s);
window.setArrowDir = (d) => window.PicEditor.tools.setArrowDir(d);
