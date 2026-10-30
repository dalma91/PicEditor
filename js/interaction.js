/**
 * interaction.js - 마우스 드래그, 이동, 작도/선택 모드 전환, 이미지 드래그앤드롭 및 클립보드(Ctrl+V) 붙여넣기
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.interaction = {
  /**
   * 모드 토글 (작도 모드 ↔ 선택/편집 모드)
   */
  toggleMode() {
    const state = window.PicEditor.state;
    state.isDrawMode = !state.isDrawMode;
    
    const svg = window.PicEditor.utils.getActiveSvg();
    const modeBtn = document.getElementById('modeBtn');
    
    if (state.isDrawMode) {
      if (modeBtn) {
        modeBtn.textContent = "✏️ 작도 모드 중";
        modeBtn.classList.add('active-mode');
      }
      if (svg) svg.classList.remove('select-mode');
      window.PicEditor.utils.deselectAll();
    } else {
      if (modeBtn) {
        modeBtn.textContent = "🖱️ 모드: 선택/편집";
        modeBtn.classList.remove('active-mode');
      }
      if (svg) svg.classList.add('select-mode');
    }
  },

  /**
   * 이동 가능(.movable) 요소들에 마우스 이벤트(선택 및 드래그) 등록
   */
  initMovableEvents() {
    const state = window.PicEditor.state;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    svg.querySelectorAll('.movable').forEach(el => {
      if (!el.getAttribute('transform')) {
        el.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');
      }

      const selectAndStartDrag = (e) => {
        if (state.isDrawMode) return;
        if (e.touches && e.touches.length > 1) return;

        const wrap = el.closest('.axes-wrap') || el.closest('.text-wrap') || el.closest('.mid-arrow') || el;
        const targetEl = wrap.classList.contains('axes-wrap') ? wrap : (wrap.querySelector('.text-el') || el);

        // 기존에 다른 객체가 선택되어 있다면 자연스럽게 선택 해제하고 신규 객체 선택
        if (state.selectedElement && state.selectedElement !== targetEl && state.selectedElement !== wrap) {
          window.PicEditor.utils.deselectAll();
        }

        e.stopPropagation();

        state.selectedElement = targetEl;

        svg.querySelectorAll('.movable').forEach(elem => {
          const w = elem.closest('.axes-wrap') || elem.closest('.text-wrap') || elem.closest('.mid-arrow') || elem;
          w.classList.remove('selected');
        });
        wrap.classList.add('selected');
        
        window.PicEditor.inspector.syncUItoSelected();

        if (window.PicEditor.tools && window.PicEditor.tools.hideAllGizmos) {
          window.PicEditor.tools.hideAllGizmos();
          if (window.PicEditor.tools.isArcElement(targetEl)) {
            window.PicEditor.tools.showArcCenterHandle(targetEl);
          } else if (window.PicEditor.tools.isLineElement(targetEl)) {
            window.PicEditor.tools.showLineHandles(targetEl);
          } else if (window.PicEditor.tools.isCircleElement(targetEl)) {
            window.PicEditor.tools.showCircleHandles(targetEl);
          } else if (window.PicEditor.tools.isTriangleElement(targetEl)) {
            window.PicEditor.tools.showTriangleHandles(targetEl);
          } else if (window.PicEditor.tools.isRectElement(targetEl)) {
            window.PicEditor.tools.showRectHandles(targetEl);
          } else if (window.PicEditor.tools.isParabolaElement(targetEl)) {
            window.PicEditor.tools.showParabolaHandles(targetEl);
          } else if (window.PicEditor.tools.isAxesElement(targetEl)) {
            window.PicEditor.tools.showAxesHandles(targetEl);
          } else if (window.PicEditor.tools.isCurveElement(targetEl)) {
            window.PicEditor.tools.showCurveHandles(targetEl);
          }
        }

        state.isDragging = true;
        state.hasDragged = false;
        const pt = window.PicEditor.utils.getSvgPoint(e, svg);
        state.startX = pt.x;
        state.startY = pt.y;
      };

      el.onmousedown = selectAndStartDrag;
      el.ontouchstart = selectAndStartDrag;

      el.onclick = (e) => {
        if (state.isDrawMode) return;
        e.stopPropagation();
      };

      el.ondblclick = (e) => {
        if (state.isDrawMode) return;
        e.stopPropagation();
        const wrap = el.closest('.axes-wrap') || el.closest('.text-wrap') || el.closest('.mid-arrow') || el;
        const textEl = wrap.querySelector ? (wrap.querySelector('.text-el') || (el.classList.contains('text-el') ? el : null)) : null;
        if (textEl) {
          state.selectedElement = textEl;
          wrap.classList.add('selected');
          window.PicEditor.inspector.syncUItoSelected();
          window.PicEditor.inspector.startInlineTextEdit(textEl);
        }
      };

      // 직교 좌표계 화살표 끝부분 직접 클릭 및 드래그 바인딩 (선택 전에도 화살표 끝 클릭으로 즉시 선택/길이조절)
      if (el.classList.contains('axes-wrap')) {
        const hitArrX = el.querySelector('.axis-arrow-hit-x');
        if (hitArrX) {
          hitArrX.onmousedown = (e) => {
            if (state.isDrawMode) return;
            e.stopPropagation();
            selectAndStartDrag(e);
            state.isDraggingAxesX = true;
            state.isDraggingAxesY = false;
            state.isDragging = false;
          };
          hitArrX.ontouchstart = hitArrX.onmousedown;
        }
        const hitArrY = el.querySelector('.axis-arrow-hit-y');
        if (hitArrY) {
          hitArrY.onmousedown = (e) => {
            if (state.isDrawMode) return;
            e.stopPropagation();
            selectAndStartDrag(e);
            state.isDraggingAxesY = true;
            state.isDraggingAxesX = false;
            state.isDragging = false;
          };
          hitArrY.ontouchstart = hitArrY.onmousedown;
        }
      }
    });
  },

  /**
   * 전역 마우스/터치 이벤트 및 SVG 캔버스 작도/드래그앤드롭/클립보드 이벤트 초기화
   */
  initGlobalEvents() {
    const state = window.PicEditor.state;

    // SVG 캔버스 작도 시작 (mousedown 및 touchstart)
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
      const handleCanvasStart = (e) => {
        if (!state.isDrawMode) {
          // 아크 또는 라인 기즈모 클릭/터치 시 선택 해제 방지
          if (e.target.closest && (
            e.target.closest('#arc-center-handle-group') ||
            e.target.closest('#line-handle-group') ||
            e.target.closest('#circle-handle-group') ||
            e.target.closest('#triangle-handle-group') ||
            e.target.closest('#rect-handle-group') ||
            e.target.closest('#parabola-handle-group') ||
            e.target.closest('.editor-gizmo-group')
          )) {
            return;
          }

          // 선택된 객체가 있을 경우, 사용자가 명시적으로 [선택 해제] 버튼을 누르기 전까지 선택 유지
          if (state.selectedElement) {
            return;
          }

          if (e.target === svg || (e.target.tagName && e.target.tagName.toLowerCase() === 'rect' && !e.target.classList.contains('text-bg-rect'))) {
            window.PicEditor.utils.deselectAll();
          }
          return;
        }
        state.isDrawing = true;
        
        const pt = window.PicEditor.utils.getSvgPoint(e, svg);
        state.drawStart = pt;

        const tool = (window.PicEditor.tools && window.PicEditor.tools.getCurrentTool) 
          ? window.PicEditor.tools.getCurrentTool() 
          : (document.getElementById('toolSelect') ? document.getElementById('toolSelect').value : 'line');
        const strokeStyleEl = document.getElementById('strokeStyleSelect');
        const strokeStyle = strokeStyleEl ? strokeStyleEl.value : 'solid';
        const arrowDirEl = document.getElementById('arrowDirSelect');
        const arrowDir = arrowDirEl ? arrowDirEl.value : 'end';
        let mainGrp = svg.querySelector('.main-diagram');

        if (!mainGrp) {
          mainGrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
          mainGrp.setAttribute('class', 'main-diagram');
          svg.appendChild(mainGrp);
        }

        if (tool === 'text') {
          let textLayer = svg.querySelector('.text-layer');
          if (!textLayer) {
            textLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
            textLayer.setAttribute('class', 'text-layer');
            svg.appendChild(textLayer);
          }

          const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
          wrap.setAttribute('class', 'movable text-wrap');
          wrap.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');

          const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          bgRect.setAttribute('class', 'text-bg-rect');
          bgRect.setAttribute('rx', '2');

          const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
          textEl.setAttribute('class', 'text-el');
          textEl.setAttribute('x', Math.round(pt.x));
          textEl.setAttribute('y', Math.round(pt.y));
          textEl.setAttribute('font-family', "'Times New Roman', serif");
          textEl.setAttribute('font-size', '28');
          textEl.setAttribute('font-style', 'normal');
          textEl.setAttribute('font-weight', 'normal');
          textEl.setAttribute('fill', '#000000');
          textEl.textContent = 'Text';

          wrap.appendChild(bgRect);
          wrap.appendChild(textEl);
          textLayer.appendChild(wrap);

          window.PicEditor.canvas.updateSingleTextBgBox(wrap);
          window.PicEditor.interaction.initMovableEvents();

          // 모드를 선택 모드로 자동 전환하고 새로 생성된 텍스트 선택
          window.PicEditor.interaction.toggleMode();
          window.PicEditor.utils.deselectAll();
          state.selectedElement = textEl;
          wrap.classList.add('selected');
          window.PicEditor.inspector.syncUItoSelected();

          setTimeout(() => {
            window.PicEditor.inspector.startInlineTextEdit(textEl);
          }, 60);

          if (window.PicEditor.sync) window.PicEditor.sync.markModified();
          return;
        } else if (tool === 'line' || tool === 'arrow') {
          state.tempShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
          state.tempShape.setAttribute("x1", pt.x);
          state.tempShape.setAttribute("y1", pt.y);
          state.tempShape.setAttribute("x2", pt.x);
          state.tempShape.setAttribute("y2", pt.y);
          state.tempShape.setAttribute("stroke", "#000000");
          state.tempShape.setAttribute("stroke-width", "2");

          if (strokeStyle === 'dashed') {
            state.tempShape.setAttribute("stroke-dasharray", "6,4");
          }

          if (tool === 'arrow') {
            window.PicEditor.tools.applyArrowMarkers(state.tempShape, arrowDir, 1);
          }
        } else if (tool === 'arc') {
          state.tempShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
          state.tempShape.setAttribute("fill", "none");
          state.tempShape.setAttribute("stroke", "#000000");
          state.tempShape.setAttribute("stroke-width", "1.8");
          if (strokeStyle === 'dashed') {
            state.tempShape.setAttribute("stroke-dasharray", "6,4");
          }
          const mid = { x: (pt.x + pt.x) / 2, y: (pt.y + pt.y) / 2 };
          window.PicEditor.tools.updateArcPath(state.tempShape, state.drawStart, pt, mid);
        } else if (tool === 'triangle') {
          state.tempShape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          state.tempShape.setAttribute("class", "movable triangle-shape");
          state.tempShape.setAttribute("points", `${pt.x},${pt.y} ${pt.x},${pt.y} ${pt.x},${pt.y}`);
          state.tempShape.setAttribute("fill", "none");
          state.tempShape.setAttribute("stroke", "#000000");
          state.tempShape.setAttribute("stroke-width", "2");
          if (strokeStyle === 'dashed') state.tempShape.setAttribute("stroke-dasharray", "6,4");
        } else if (tool === 'rect') {
          state.tempShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          state.tempShape.setAttribute("x", pt.x);
          state.tempShape.setAttribute("y", pt.y);
          state.tempShape.setAttribute("width", "0");
          state.tempShape.setAttribute("height", "0");
          state.tempShape.setAttribute("fill", "none");
          state.tempShape.setAttribute("stroke", "#000000");
          state.tempShape.setAttribute("stroke-width", "2");
          if (strokeStyle === 'dashed') state.tempShape.setAttribute("stroke-dasharray", "6,4");
        } else if (tool === 'circle') {
          state.tempShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          state.tempShape.setAttribute("cx", pt.x);
          state.tempShape.setAttribute("cy", pt.y);
          state.tempShape.setAttribute("r", "0");
          state.tempShape.setAttribute("fill", "none");
          state.tempShape.setAttribute("stroke", "#000000");
          state.tempShape.setAttribute("stroke-width", "2");
          if (strokeStyle === 'dashed') state.tempShape.setAttribute("stroke-dasharray", "6,4");
        } else if (['parabola2', 'parabola3', 'hyperbola', 'sqrt', 'exp'].includes(tool)) {
          state.tempShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
          state.tempShape.setAttribute("fill", "none");
          state.tempShape.setAttribute("stroke", "#000000");
          state.tempShape.setAttribute("stroke-width", "2");
          state.tempShape.setAttribute("data-type", tool);
          if (tool === 'parabola2' || tool === 'parabola3') {
            state.tempShape.classList.add('parabola-shape');
          }
          if (strokeStyle === 'dashed') state.tempShape.setAttribute("stroke-dasharray", "6,4");
          state.tempShape.setAttribute("d", `M ${pt.x},${pt.y} L ${pt.x},${pt.y}`);
        } else if (tool === 'axes') {
          if (window.PicEditor.tools && window.PicEditor.tools.ensureArrowMarkers) {
            window.PicEditor.tools.ensureArrowMarkers(svg);
          }
          const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
          group.setAttribute('class', 'movable axes-wrap');
          group.setAttribute('transform', `translate(${pt.x}, ${pt.y}) scale(1,1) rotate(0)`);

          // 투명 광폭 히트 영역 (축 선 클릭 반응성 대폭 강화)
          const hitLineX = document.createElementNS("http://www.w3.org/2000/svg", "line");
          hitLineX.setAttribute('class', 'axis-hit-line axis-hit-x');
          hitLineX.setAttribute('x1', '0'); hitLineX.setAttribute('y1', '0');
          hitLineX.setAttribute('x2', '0'); hitLineX.setAttribute('y2', '0');
          hitLineX.setAttribute('stroke', '#000000');
          hitLineX.setAttribute('stroke-width', '24');
          hitLineX.setAttribute('opacity', '0.001');
          hitLineX.setAttribute('style', 'cursor:ew-resize;');

          const hitLineY = document.createElementNS("http://www.w3.org/2000/svg", "line");
          hitLineY.setAttribute('class', 'axis-hit-line axis-hit-y');
          hitLineY.setAttribute('x1', '0'); hitLineY.setAttribute('y1', '0');
          hitLineY.setAttribute('x2', '0'); hitLineY.setAttribute('y2', '0');
          hitLineY.setAttribute('stroke', '#000000');
          hitLineY.setAttribute('stroke-width', '24');
          hitLineY.setAttribute('opacity', '0.001');
          hitLineY.setAttribute('style', 'cursor:ns-resize;');

          // 화살표 끝부분 전용 히트 영역 (화살표 끝을 바로 클릭/선택하고 길이 조절 가능)
          const hitArrowX = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          hitArrowX.setAttribute('class', 'axis-arrow-hit axis-arrow-hit-x');
          hitArrowX.setAttribute('cx', '0'); hitArrowX.setAttribute('cy', '0');
          hitArrowX.setAttribute('r', '24');
          hitArrowX.setAttribute('fill', '#000000');
          hitArrowX.setAttribute('opacity', '0.001');
          hitArrowX.setAttribute('style', 'cursor:ew-resize;');

          const hitArrowY = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          hitArrowY.setAttribute('class', 'axis-arrow-hit axis-arrow-hit-y');
          hitArrowY.setAttribute('cx', '0'); hitArrowY.setAttribute('cy', '0');
          hitArrowY.setAttribute('r', '24');
          hitArrowY.setAttribute('fill', '#000000');
          hitArrowY.setAttribute('opacity', '0.001');
          hitArrowY.setAttribute('style', 'cursor:ns-resize;');

          const lineX = document.createElementNS("http://www.w3.org/2000/svg", "line");
          lineX.setAttribute('class', 'axis-line axis-x');
          lineX.setAttribute('x1', '0');
          lineX.setAttribute('y1', '0');
          lineX.setAttribute('x2', '0');
          lineX.setAttribute('y2', '0');
          lineX.setAttribute('stroke', '#000000');
          lineX.setAttribute('stroke-width', '2');
          lineX.setAttribute('marker-end', 'url(#arrow)');
          if (strokeStyle === 'dashed') lineX.setAttribute('stroke-dasharray', '6,4');

          const lineY = document.createElementNS("http://www.w3.org/2000/svg", "line");
          lineY.setAttribute('class', 'axis-line axis-y');
          lineY.setAttribute('x1', '0');
          lineY.setAttribute('y1', '0');
          lineY.setAttribute('x2', '0');
          lineY.setAttribute('y2', '0');
          lineY.setAttribute('stroke', '#000000');
          lineY.setAttribute('stroke-width', '2');
          lineY.setAttribute('marker-end', 'url(#arrow)');
          if (strokeStyle === 'dashed') lineY.setAttribute('stroke-dasharray', '6,4');

          const originDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          originDot.setAttribute('class', 'axis-origin-dot');
          originDot.setAttribute('cx', '0');
          originDot.setAttribute('cy', '0');
          originDot.setAttribute('r', '2.5');
          originDot.setAttribute('fill', '#000000');

          const labelX = document.createElementNS("http://www.w3.org/2000/svg", "text");
          labelX.setAttribute('class', 'axis-label axis-label-x');
          labelX.setAttribute('x', '0');
          labelX.setAttribute('y', '0');
          labelX.setAttribute('font-family', "'Times New Roman', serif");
          labelX.setAttribute('font-size', '16');
          labelX.setAttribute('font-style', 'italic');
          labelX.setAttribute('fill', '#000000');
          labelX.textContent = 'x';

          const labelY = document.createElementNS("http://www.w3.org/2000/svg", "text");
          labelY.setAttribute('class', 'axis-label axis-label-y');
          labelY.setAttribute('x', '0');
          labelY.setAttribute('y', '0');
          labelY.setAttribute('font-family', "'Times New Roman', serif");
          labelY.setAttribute('font-size', '16');
          labelY.setAttribute('font-style', 'italic');
          labelY.setAttribute('fill', '#000000');
          labelY.textContent = 'y';

          const labelO = document.createElementNS("http://www.w3.org/2000/svg", "text");
          labelO.setAttribute('class', 'axis-label axis-label-o');
          labelO.setAttribute('x', '-12');
          labelO.setAttribute('y', '14');
          labelO.setAttribute('font-family', "'Times New Roman', serif");
          labelO.setAttribute('font-size', '14');
          labelO.setAttribute('font-style', 'italic');
          labelO.setAttribute('fill', '#000000');
          labelO.textContent = 'O';

          group.appendChild(hitLineX);
          group.appendChild(hitLineY);
          group.appendChild(lineX);
          group.appendChild(lineY);
          group.appendChild(hitArrowX);
          group.appendChild(hitArrowY);
          group.appendChild(originDot);
          group.appendChild(labelX);
          group.appendChild(labelY);
          group.appendChild(labelO);

          state.tempShape = group;
        }

        if (state.tempShape) {
          state.tempShape.classList.add('movable');
          mainGrp.appendChild(state.tempShape);
        }
      };

      svg.addEventListener('mousedown', handleCanvasStart);
      svg.addEventListener('touchstart', handleCanvasStart, { passive: true });
    });

    // 드래그앤드롭 파일 업로드 (그림 이미지 및 HTML 파일 모두 지원)
    const cardEl = document.querySelector('.card');
    if (cardEl) {
      cardEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        cardEl.classList.add('drag-over');
      });
      cardEl.addEventListener('dragleave', (e) => {
        e.preventDefault();
        cardEl.classList.remove('drag-over');
      });
      cardEl.addEventListener('drop', (e) => {
        e.preventDefault();
        cardEl.classList.remove('drag-over');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            window.PicEditor.storage.loadImageFile(file, true);
          } else {
            const reader = new FileReader();
            reader.onload = (re) => {
              window.PicEditor.storage.importHtmlCode(re.target.result, false);
              alert(`"${file.name}" 코드를 캔버스에 성공적으로 올렸습니다!`);
            };
            reader.readAsText(file);
          }
        }
      });
    }

    // 클립보드 붙여넣기 (Ctrl + V): 스크린샷이나 복사한 이미지를 캔버스에 즉시 추가
    window.addEventListener('paste', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'textarea' || activeTag === 'input') {
        return; // 입력 필드 내부에서는 기본 붙여넣기 동작 허용
      }

      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let foundImage = false;

      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          window.PicEditor.storage.loadImageFile(blob, true);
          foundImage = true;
          break;
        }
      }

      if (foundImage) {
        e.preventDefault();
      }
    });

    // 마우스/터치 이동 (mousemove 및 touchmove)
    const handlePointerMove = (e) => {
      const svg = window.PicEditor.utils.getActiveSvg();
      if (!svg) return;
      const pt = window.PicEditor.utils.getSvgPoint(e, svg);

      // 1. 호의 중심(붉은 점) 또는 양 끝점(파란 점 P1, P2) 드래그 조작
      if ((state.isDraggingArcCenter || state.isDraggingArcP1 || state.isDraggingArcP2) && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const arcEl = state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(arcEl);

        const rad = (t.r || 0) * Math.PI / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const lx = (pt.x - t.x) / (t.sx || 1);
        const ly = (pt.y - t.y) / (t.sy || 1);
        const localX = lx * cos - ly * sin;
        const localY = lx * sin + ly * cos;

        const data = window.PicEditor.tools.getArcData(arcEl);
        if (data) {
          if (state.isDraggingArcCenter) {
            // 호의 중심 이동 (반지름 및 곡률 갱신)
            window.PicEditor.tools.updateArcPath(arcEl, data.p1, data.p2, { x: localX, y: localY });
          } else if (state.isDraggingArcP1) {
            // 파란색 시점 P1 이동: 호의 중심(c)과 종점(p2)이 고정되어 있으므로
            // 마우스의 X좌표만을 읽어 원의 방정식에서 Y좌표 산출
            const c = data.c;
            const fixedP = data.p2;
            const r = Math.hypot(fixedP.x - c.x, fixedP.y - c.y);
            let dx = localX - c.x;
            if (Math.abs(dx) > r * 0.999) {
              dx = Math.sign(dx) * r * 0.999;
            }
            const xNew = c.x + dx;
            const dy = Math.sqrt(Math.max(0, r * r - dx * dx));
            const yNew = (localY >= c.y) ? (c.y + dy) : (c.y - dy);

            if (Math.hypot(xNew - fixedP.x, yNew - fixedP.y) >= 4) {
              window.PicEditor.tools.updateArcPath(arcEl, { x: xNew, y: yNew }, data.p2, data.c);
            }
          } else if (state.isDraggingArcP2) {
            // 파란색 종점 P2 이동: 호의 중심(c)과 시점(p1)이 고정되어 있으므로
            // 마우스의 X좌표만을 읽어 원의 방정식에서 Y좌표 산출
            const c = data.c;
            const fixedP = data.p1;
            const r = Math.hypot(fixedP.x - c.x, fixedP.y - c.y);
            let dx = localX - c.x;
            if (Math.abs(dx) > r * 0.999) {
              dx = Math.sign(dx) * r * 0.999;
            }
            const xNew = c.x + dx;
            const dy = Math.sqrt(Math.max(0, r * r - dx * dx));
            const yNew = (localY >= c.y) ? (c.y + dy) : (c.y - dy);

            if (Math.hypot(xNew - fixedP.x, yNew - fixedP.y) >= 4) {
              window.PicEditor.tools.updateArcPath(arcEl, data.p1, { x: xNew, y: yNew }, data.c);
            }
          }
          window.PicEditor.tools.showArcCenterHandle(arcEl);
        }
        return;
      }

      // 1-1. 직선 및 화살표 양 끝점(파란 점 P1, P2) 드래그 조작
      if ((state.isDraggingLineP1 || state.isDraggingLineP2) && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const lineEl = window.PicEditor.tools.getLineElement(state.selectedElement);
        if (lineEl) {
          const t = window.PicEditor.utils.parseTransform(lineEl);
          const rad = (t.r || 0) * Math.PI / 180;
          const cos = Math.cos(-rad);
          const sin = Math.sin(-rad);
          const lx = (pt.x - t.x) / (t.sx || 1);
          const ly = (pt.y - t.y) / (t.sy || 1);
          const localX = lx * cos - ly * sin;
          const localY = lx * sin + ly * cos;

          if (state.isDraggingLineP1) {
            lineEl.setAttribute('x1', localX.toFixed(1));
            lineEl.setAttribute('y1', localY.toFixed(1));
          } else if (state.isDraggingLineP2) {
            lineEl.setAttribute('x2', localX.toFixed(1));
            lineEl.setAttribute('y2', localY.toFixed(1));
          }

          window.PicEditor.tools.updateMidArrowPosition(lineEl);
          window.PicEditor.tools.showLineHandles(lineEl);
        }
        return;
      }

      // 1-C. 원(Circle) 반지름 크기 조절 드래그
      if (state.isDraggingCircleRadius && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const circleEl = state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(circleEl);
        const rad = (t.r || 0) * Math.PI / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const lx = (pt.x - t.x) / (t.sx || 1);
        const ly = (pt.y - t.y) / (t.sy || 1);
        const localX = lx * cos - ly * sin;
        const localY = lx * sin + ly * cos;

        const cx = parseFloat(circleEl.getAttribute('cx')) || 0;
        const cy = parseFloat(circleEl.getAttribute('cy')) || 0;
        const newR = Math.max(5, Math.round(Math.hypot(localX - cx, localY - cy)));
        circleEl.setAttribute('r', newR);
        window.PicEditor.tools.showCircleHandles(circleEl);
        window.PicEditor.inspector.syncUItoSelected();
        if (window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 1-F. 함수 곡선(반비례, 루트, 지수) 양 끝점 드래그
      if ((state.isDraggingCurveP1 || state.isDraggingCurveP2) && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const curveEl = state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(curveEl);
        const rad = (t.r || 0) * Math.PI / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const lx = (pt.x - t.x) / (t.sx || 1);
        const ly = (pt.y - t.y) / (t.sy || 1);
        const localX = lx * cos - ly * sin;
        const localY = lx * sin + ly * cos;

        let x1 = parseFloat(curveEl.getAttribute('data-x1')) || 0;
        let y1 = parseFloat(curveEl.getAttribute('data-y1')) || 0;
        let x2 = parseFloat(curveEl.getAttribute('data-x2')) || 0;
        let y2 = parseFloat(curveEl.getAttribute('data-y2')) || 0;
        const type = curveEl.getAttribute('data-type');

        if (state.isDraggingCurveP1) {
          x1 = localX; y1 = localY;
        } else if (state.isDraggingCurveP2) {
          x2 = localX; y2 = localY;
        }
        curveEl.setAttribute('data-x1', x1.toFixed(1));
        curveEl.setAttribute('data-y1', y1.toFixed(1));
        curveEl.setAttribute('data-x2', x2.toFixed(1));
        curveEl.setAttribute('data-y2', y2.toFixed(1));

        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const dx = maxX - minX, dy = maxY - minY;

        let d = '';
        if (type === 'hyperbola') {
          d = `M ${minX.toFixed(1)},${minY.toFixed(1)} C ${minX.toFixed(1)},${(minY + 0.60 * dy).toFixed(1)} ${(minX + 0.40 * dx).toFixed(1)},${maxY.toFixed(1)} ${maxX.toFixed(1)},${maxY.toFixed(1)}`;
        } else if (type === 'sqrt') {
          d = `M ${minX.toFixed(1)},${maxY.toFixed(1)} Q ${minX.toFixed(1)},${minY.toFixed(1)} ${maxX.toFixed(1)},${minY.toFixed(1)}`;
        } else if (type === 'exp') {
          d = `M ${minX.toFixed(1)},${minY.toFixed(1)} C ${(minX + 0.30 * dx).toFixed(1)},${(minY + 0.65 * dy).toFixed(1)} ${(minX + 0.60 * dx).toFixed(1)},${maxY.toFixed(1)} ${maxX.toFixed(1)},${maxY.toFixed(1)}`;
        }
        if (d) curveEl.setAttribute('d', d);
        window.PicEditor.tools.showCurveHandles(curveEl);
        window.PicEditor.inspector.syncUItoSelected();
        if (window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 1-C. 원(Circle) 중심 빨간 점 드래그 이동
      if (state.isDraggingCircleCenter && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const circleEl = state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(circleEl);
        const rad = (t.r || 0) * Math.PI / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const lx = (pt.x - t.x) / (t.sx || 1);
        const ly = (pt.y - t.y) / (t.sy || 1);
        const localX = lx * cos - ly * sin;
        const localY = lx * sin + ly * cos;

        circleEl.setAttribute('cx', localX.toFixed(1));
        circleEl.setAttribute('cy', localY.toFixed(1));
        if (window.PicEditor.tools) window.PicEditor.tools.showCircleHandles(circleEl);
        return;
      }

      // 1-T. 삼각형(Triangle) 꼭짓점(파란 점) 드래그 이동 (자유 이동)
      if ((state.isDraggingTriangleP1 || state.isDraggingTriangleP2 || state.isDraggingTriangleP3) && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const triEl = state.selectedElement;
        const pts = window.PicEditor.tools.getTrianglePoints(triEl);
        if (pts) {
          const t = window.PicEditor.utils.parseTransform(triEl);
          const rad = (t.r || 0) * Math.PI / 180;
          const cos = Math.cos(-rad);
          const sin = Math.sin(-rad);
          const lx = (pt.x - t.x) / (t.sx || 1);
          const ly = (pt.y - t.y) / (t.sy || 1);
          const localX = lx * cos - ly * sin;
          const localY = lx * sin + ly * cos;

          if (state.isDraggingTriangleP1) pts[0] = { x: localX, y: localY };
          else if (state.isDraggingTriangleP2) pts[1] = { x: localX, y: localY };
          else if (state.isDraggingTriangleP3) pts[2] = { x: localX, y: localY };

          triEl.setAttribute('points', `${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} ${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)} ${pts[2].x.toFixed(1)},${pts[2].y.toFixed(1)}`);
          if (window.PicEditor.tools) window.PicEditor.tools.showTriangleHandles(triEl);
          if (window.PicEditor.inspector) window.PicEditor.inspector.syncUItoSelected();
        }
        return;
      }

      // 1-R. 직사각형(Rectangle) 꼭짓점(파란 점) 드래그 이동 (직사각형 정의 유지, 점 한 쌍 함께 이동)
      if (state.isDraggingRectCorner && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const rectEl = state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(rectEl);
        const rad = (t.r || 0) * Math.PI / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const lx = (pt.x - t.x) / (t.sx || 1);
        const ly = (pt.y - t.y) / (t.sy || 1);
        const localX = lx * cos - ly * sin;
        const localY = lx * sin + ly * cos;

        const ax = state.rectAnchor ? state.rectAnchor.x : 0;
        const ay = state.rectAnchor ? state.rectAnchor.y : 0;

        const newX = Math.min(ax, localX);
        const newY = Math.min(ay, localY);
        const newW = Math.max(3, Math.abs(localX - ax));
        const newH = Math.max(3, Math.abs(localY - ay));

        rectEl.setAttribute('x', newX.toFixed(1));
        rectEl.setAttribute('y', newY.toFixed(1));
        rectEl.setAttribute('width', newW.toFixed(1));
        rectEl.setAttribute('height', newH.toFixed(1));

        if (window.PicEditor.tools) window.PicEditor.tools.showRectHandles(rectEl);
        if (window.PicEditor.inspector) window.PicEditor.inspector.syncUItoSelected();
        return;
      }

      // 1-P. 포물선(Parabola) 꼭짓점(붉은 점) 및 끝점(파란 점) 드래그 이동
      if ((state.isDraggingParabolaV || state.isDraggingParabolaP1 || state.isDraggingParabolaP2) && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const parabolaEl = state.selectedElement;
        const data = window.PicEditor.tools.getParabolaData(parabolaEl);
        if (data) {
          const t = window.PicEditor.utils.parseTransform(parabolaEl);
          const rad = (t.r || 0) * Math.PI / 180;
          const cos = Math.cos(-rad);
          const sin = Math.sin(-rad);
          const lx = (pt.x - t.x) / (t.sx || 1);
          const ly = (pt.y - t.y) / (t.sy || 1);
          const localX = lx * cos - ly * sin;
          const localY = lx * sin + ly * cos;

          if (data.type === 'parabola3') {
            if (state.isDraggingParabolaV) {
              const currentMidX = (data.p1.x + data.p2.x) / 2;
              const dx = localX - currentMidX;
              data.p1.x += dx;
              data.p2.x += dx;
              data.v.x = localX;
              data.v.y = localY;
              const a = (data.p1.y - data.v.y) / Math.max(1, Math.pow(data.p1.x - data.v.x, 2));
              data.a = a;
              const cx = (data.p1.x + data.p2.x) / 2;
              const cy = a * (data.p1.x - data.v.x) * (data.p2.x - data.v.x) + data.v.y;
              const d = `M ${data.p1.x.toFixed(1)},${data.p1.y.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${data.p2.x.toFixed(1)},${data.p2.y.toFixed(1)}`;
              parabolaEl.setAttribute('d', d);
              parabolaEl.setAttribute('data-vx', data.v.x.toFixed(1));
              parabolaEl.setAttribute('data-vy', data.v.y.toFixed(1));
              parabolaEl.setAttribute('data-a', a.toString());
            } else if (state.isDraggingParabolaP1) {
              // 시작점(P1): 기존 포물선의 궤적 y = a*(x - vx)^2 + vy 상에서만 이동
              const proj = window.PicEditor.tools.projectOntoParabola(localX, localY, data.v.x, data.v.y, data.a);
              const isP1Left = data.p1.x <= data.v.x;
              if (isP1Left) {
                if (proj.x > data.v.x - 2) proj.x = data.v.x - 2;
              } else {
                if (proj.x < data.v.x + 2) proj.x = data.v.x + 2;
              }
              proj.y = data.v.y + data.a * Math.pow(proj.x - data.v.x, 2);
              data.p1.x = proj.x;
              data.p1.y = proj.y;
              const cx = (data.p1.x + data.p2.x) / 2;
              const cy = data.a * (data.p1.x - data.v.x) * (data.p2.x - data.v.x) + data.v.y;
              const d = `M ${data.p1.x.toFixed(1)},${data.p1.y.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${data.p2.x.toFixed(1)},${data.p2.y.toFixed(1)}`;
              parabolaEl.setAttribute('d', d);
              parabolaEl.setAttribute('data-vx', data.v.x.toFixed(1));
              parabolaEl.setAttribute('data-vy', data.v.y.toFixed(1));
              parabolaEl.setAttribute('data-a', data.a.toString());
            } else if (state.isDraggingParabolaP2) {
              // 종점(P2): 기존 포물선의 궤적 y = a*(x - vx)^2 + vy 상에서만 이동
              const proj = window.PicEditor.tools.projectOntoParabola(localX, localY, data.v.x, data.v.y, data.a);
              const isP2Right = data.p2.x >= data.v.x;
              if (isP2Right) {
                if (proj.x < data.v.x + 2) proj.x = data.v.x + 2;
              } else {
                if (proj.x > data.v.x - 2) proj.x = data.v.x - 2;
              }
              proj.y = data.v.y + data.a * Math.pow(proj.x - data.v.x, 2);
              data.p2.x = proj.x;
              data.p2.y = proj.y;
              const cx = (data.p1.x + data.p2.x) / 2;
              const cy = data.a * (data.p1.x - data.v.x) * (data.p2.x - data.v.x) + data.v.y;
              const d = `M ${data.p1.x.toFixed(1)},${data.p1.y.toFixed(1)} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${data.p2.x.toFixed(1)},${data.p2.y.toFixed(1)}`;
              parabolaEl.setAttribute('d', d);
              parabolaEl.setAttribute('data-vx', data.v.x.toFixed(1));
              parabolaEl.setAttribute('data-vy', data.v.y.toFixed(1));
              parabolaEl.setAttribute('data-a', data.a.toString());
            }
          } else {
            if (state.isDraggingParabolaV) {
              data.v.x = localX;
              data.v.y = localY;
            } else if (state.isDraggingParabolaP1) {
              data.p1.x = localX;
              data.p1.y = localY;
            }
            const d = `M ${data.v.x.toFixed(1)},${data.v.y.toFixed(1)} Q ${data.p1.x.toFixed(1)},${data.v.y.toFixed(1)} ${data.p1.x.toFixed(1)},${data.p1.y.toFixed(1)}`;
            parabolaEl.setAttribute('d', d);
          }
          if (window.PicEditor.tools) window.PicEditor.tools.showParabolaHandles(parabolaEl);
          if (window.PicEditor.inspector) window.PicEditor.inspector.syncUItoSelected();
        }
        return;
      }

      // 1-A. 직교 좌표계 X축 / Y축 조절점 드래그
      if ((state.isDraggingAxesX || state.isDraggingAxesY) && state.selectedElement) {
        state.hasDragged = true;
        if (e.cancelable) e.preventDefault();
        const axesWrap = window.PicEditor.tools.getAxesElement(state.selectedElement);
        if (axesWrap) {
          const t = window.PicEditor.utils.parseTransform(axesWrap);
          const rad = -(t.r || 0) * Math.PI / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const unrotX = (pt.x - t.x) / (t.sx || 1);
          const unrotY = (pt.y - t.y) / (t.sy || 1);
          const localX = unrotX * cos - unrotY * sin;
          const localY = unrotX * sin + unrotY * cos;

          const lineX = axesWrap.querySelector('.axis-x');
          const lineY = axesWrap.querySelector('.axis-y');
          const lblX = axesWrap.querySelector('.axis-label-x');
          const lblY = axesWrap.querySelector('.axis-label-y');

          const hitX = axesWrap.querySelector('.axis-hit-x');
          const hitY = axesWrap.querySelector('.axis-hit-y');
          const hitArrX = axesWrap.querySelector('.axis-arrow-hit-x');
          const hitArrY = axesWrap.querySelector('.axis-arrow-hit-y');

          if (state.isDraggingAxesX && lineX) {
            lineX.setAttribute('x2', localX.toFixed(1));
            if (hitX) hitX.setAttribute('x2', localX.toFixed(1));
            if (hitArrX) hitArrX.setAttribute('cx', localX.toFixed(1));
            if (lblX) {
              lblX.setAttribute('x', (localX >= 0 ? localX + 6 : localX - 14).toFixed(1));
            }
          } else if (state.isDraggingAxesY && lineY) {
            lineY.setAttribute('y2', localY.toFixed(1));
            if (hitY) hitY.setAttribute('y2', localY.toFixed(1));
            if (hitArrY) hitArrY.setAttribute('cy', localY.toFixed(1));
            if (lblY) {
              lblY.setAttribute('y', (localY <= 0 ? localY - 6 : localY + 15).toFixed(1));
            }
          }
          window.PicEditor.tools.showAxesHandles(axesWrap);
          window.PicEditor.inspector.syncUItoSelected();
          if (window.PicEditor.sync) window.PicEditor.sync.markModified();
        }
        return;
      }

      // 2. 작도 모드 드로잉
      if (state.isDrawMode && state.isDrawing && state.tempShape) {
        if (e.cancelable) e.preventDefault();
        const tool = (window.PicEditor.tools && window.PicEditor.tools.getCurrentTool) 
          ? window.PicEditor.tools.getCurrentTool() 
          : (document.getElementById('toolSelect') ? document.getElementById('toolSelect').value : 'line');

        if (tool === 'line' || tool === 'arrow') {
          state.tempShape.setAttribute("x2", pt.x);
          state.tempShape.setAttribute("y2", pt.y);
          const arrowDirEl = document.getElementById('arrowDirSelect');
          const arrowDir = arrowDirEl ? arrowDirEl.value : 'end';
          if (tool === 'arrow' && (arrowDir === 'mid-right' || arrowDir === 'mid-left')) {
            window.PicEditor.tools.applyArrowMarkers(state.tempShape, arrowDir, 1);
          }
        } else if (tool === 'arc') {
          const mid = { x: (state.drawStart.x + pt.x) / 2, y: (state.drawStart.y + pt.y) / 2 };
          window.PicEditor.tools.updateArcPath(state.tempShape, state.drawStart, pt, mid);
        } else if (tool === 'triangle') {
          const x0 = state.drawStart.x;
          const y0 = state.drawStart.y;
          const x1 = pt.x;
          const y1 = pt.y;
          const p1x = ((x0 + x1) / 2).toFixed(1);
          const p1y = Math.min(y0, y1).toFixed(1);
          const p2x = Math.min(x0, x1).toFixed(1);
          const p2y = Math.max(y0, y1).toFixed(1);
          const p3x = Math.max(x0, x1).toFixed(1);
          const p3y = Math.max(y0, y1).toFixed(1);
          state.tempShape.setAttribute("points", `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`);
        } else if (tool === 'rect') {
          const x = Math.min(state.drawStart.x, pt.x);
          const y = Math.min(state.drawStart.y, pt.y);
          const w = Math.abs(pt.x - state.drawStart.x);
          const h = Math.abs(pt.y - state.drawStart.y);
          state.tempShape.setAttribute("x", x.toFixed(1));
          state.tempShape.setAttribute("y", y.toFixed(1));
          state.tempShape.setAttribute("width", Math.max(1, w).toFixed(1));
          state.tempShape.setAttribute("height", Math.max(1, h).toFixed(1));
        } else if (tool === 'circle') {
          const r = Math.hypot(pt.x - state.drawStart.x, pt.y - state.drawStart.y);
          state.tempShape.setAttribute("cx", state.drawStart.x.toFixed(1));
          state.tempShape.setAttribute("cy", state.drawStart.y.toFixed(1));
          state.tempShape.setAttribute("r", Math.max(1, r).toFixed(1));
        } else if (tool === 'parabola2') {
          // 꼭짓점(vertex) = drawStart, 끝점 = pt
          const x0 = state.drawStart.x, y0 = state.drawStart.y;
          const x1 = pt.x, y1 = pt.y;
          const d = `M ${x0.toFixed(1)},${y0.toFixed(1)} Q ${x1.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
          state.tempShape.setAttribute("d", d);
        } else if (tool === 'parabola3') {
          // 좌측 시점 = drawStart, 우측 낙하지점 = (pt.x, drawStart.y), 최고점 높이 = pt.y
          const x1 = Math.min(state.drawStart.x, pt.x);
          const x2 = Math.max(state.drawStart.x, pt.x);
          const y1 = state.drawStart.y;
          const y2 = pt.y;
          const xv = (x1 + x2) / 2;
          const yc = 2 * y2 - y1;
          const d = `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${xv.toFixed(1)},${yc.toFixed(1)} ${x2.toFixed(1)},${y1.toFixed(1)}`;
          state.tempShape.setAttribute("d", d);
          const a = (y1 - y2) / Math.max(1, Math.pow(x1 - xv, 2));
          state.tempShape.setAttribute("data-vx", xv.toFixed(1));
          state.tempShape.setAttribute("data-vy", y2.toFixed(1));
          state.tempShape.setAttribute("data-a", a.toString());
        } else if (tool === 'hyperbola') {
          // 반비례 곡선 y=k/x: 바운딩 영역 내 매끄러운 쌍곡선
          const x1 = Math.min(state.drawStart.x, pt.x);
          const x2 = Math.max(state.drawStart.x, pt.x);
          const y1 = Math.min(state.drawStart.y, pt.y);
          const y2 = Math.max(state.drawStart.y, pt.y);
          const dx = x2 - x1, dy = y2 - y1;
          const d = `M ${x1.toFixed(1)},${y1.toFixed(1)} C ${x1.toFixed(1)},${(y1 + 0.60 * dy).toFixed(1)} ${(x1 + 0.40 * dx).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
          state.tempShape.setAttribute("d", d);
        } else if (tool === 'sqrt') {
          // 무리함수 y=√x: 원점(하단)에서 출발하여 상단으로 완만해지는 곡선
          const x1 = Math.min(state.drawStart.x, pt.x);
          const x2 = Math.max(state.drawStart.x, pt.x);
          const y1 = Math.min(state.drawStart.y, pt.y);
          const y2 = Math.max(state.drawStart.y, pt.y);
          const d = `M ${x1.toFixed(1)},${y2.toFixed(1)} Q ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y1.toFixed(1)}`;
          state.tempShape.setAttribute("d", d);
        } else if (tool === 'exp') {
          // 지수함수 y=e⁻ˣ: 좌상단에서 우하단 수평 점근선으로 감쇠하는 곡선
          const x1 = Math.min(state.drawStart.x, pt.x);
          const x2 = Math.max(state.drawStart.x, pt.x);
          const y1 = Math.min(state.drawStart.y, pt.y);
          const y2 = Math.max(state.drawStart.y, pt.y);
          const dx = x2 - x1, dy = y2 - y1;
          const d = `M ${x1.toFixed(1)},${y1.toFixed(1)} C ${(x1 + 0.30 * dx).toFixed(1)},${(y1 + 0.65 * dy).toFixed(1)} ${(x1 + 0.60 * dx).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
          state.tempShape.setAttribute("d", d);
        } else if (tool === 'axes') {
          const dx = pt.x - state.drawStart.x;
          const dy = pt.y - state.drawStart.y;
          const lineX = state.tempShape.querySelector('.axis-x');
          const lineY = state.tempShape.querySelector('.axis-y');
          const lblX = state.tempShape.querySelector('.axis-label-x');
          const lblY = state.tempShape.querySelector('.axis-label-y');
          const lblO = state.tempShape.querySelector('.axis-label-o');

          const hitX = state.tempShape.querySelector('.axis-hit-x');
          const hitY = state.tempShape.querySelector('.axis-hit-y');
          const hitArrX = state.tempShape.querySelector('.axis-arrow-hit-x');
          const hitArrY = state.tempShape.querySelector('.axis-arrow-hit-y');
          if (lineX) {
            lineX.setAttribute('x2', dx.toFixed(1));
            lineX.setAttribute('y2', '0');
          }
          if (hitX) { hitX.setAttribute('x2', dx.toFixed(1)); hitX.setAttribute('y2', '0'); }
          if (hitArrX) { hitArrX.setAttribute('cx', dx.toFixed(1)); hitArrX.setAttribute('cy', '0'); }

          if (lineY) {
            lineY.setAttribute('x2', '0');
            lineY.setAttribute('y2', dy.toFixed(1));
          }
          if (hitY) { hitY.setAttribute('x2', '0'); hitY.setAttribute('y2', dy.toFixed(1)); }
          if (hitArrY) { hitArrY.setAttribute('cx', '0'); hitArrY.setAttribute('cy', dy.toFixed(1)); }
          if (lblX) {
            lblX.setAttribute('x', (dx >= 0 ? dx + 6 : dx - 14).toFixed(1));
            lblX.setAttribute('y', '5');
          }
          if (lblY) {
            lblY.setAttribute('x', '-5');
            lblY.setAttribute('y', (dy <= 0 ? dy - 6 : dy + 15).toFixed(1));
          }
          if (lblO) {
            const ox = dx >= 0 ? -12 : 6;
            const oy = dy <= 0 ? 14 : -6;
            lblO.setAttribute('x', ox.toString());
            lblO.setAttribute('y', oy.toString());
          }
        }
        return;
      }

      // 3. 선택 모드 요소 드래그 이동
      if (!state.isDrawMode && state.isDragging && state.selectedElement) {
        const dx = pt.x - state.startX;
        const dy = pt.y - state.startY;
        if (Math.hypot(dx, dy) > 2) {
          state.hasDragged = true;
        }
        if (e.cancelable) e.preventDefault();
        state.startX = pt.x;
        state.startY = pt.y;

        const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(target);
        t.x += dx;
        t.y += dy;
        window.PicEditor.utils.setTransform(target, t);

        if (window.PicEditor.tools) {
          if (window.PicEditor.tools.updateGizmosTransform) {
            window.PicEditor.tools.updateGizmosTransform(target);
          }
          if (target.id) {
            const midG = svg.querySelector(`g.mid-arrow[data-for="${target.id}"]`);
            if (midG) {
              const mt = window.PicEditor.utils.parseTransform(midG);
              mt.x += dx;
              mt.y += dy;
              window.PicEditor.utils.setTransform(midG, mt);
            }
          }
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });

    // 마우스/터치 뗌 (mouseup 및 touchend)
    const handlePointerUp = () => {
      const svg = window.PicEditor.utils.getActiveSvg();

      // 호의 중심 또는 양 끝점 드래그 종료
      if (state.isDraggingArcCenter || state.isDraggingArcP1 || state.isDraggingArcP2) {
        state.isDraggingArcCenter = false;
        state.isDraggingArcP1 = false;
        state.isDraggingArcP2 = false;
        if (svg) {
          const centerH = svg.querySelector('#arc-center-handle-wrap');
          if (centerH) centerH.style.cursor = 'grab';
          const p1H = svg.querySelector('#arc-p1-handle-wrap');
          if (p1H) p1H.style.cursor = 'grab';
          const p2H = svg.querySelector('#arc-p2-handle-wrap');
          if (p2H) p2H.style.cursor = 'grab';
        }
        if (state.hasDragged && window.PicEditor.sync) {
          window.PicEditor.sync.markModified();
        }
        return;
      }

      // 직선 및 화살표 양 끝점 드래그 종료
      if (state.isDraggingLineP1 || state.isDraggingLineP2) {
        state.isDraggingLineP1 = false;
        state.isDraggingLineP2 = false;
        if (svg) {
          const p1H = svg.querySelector('#line-p1-handle-wrap');
          if (p1H) p1H.style.cursor = 'grab';
          const p2H = svg.querySelector('#line-p2-handle-wrap');
          if (p2H) p2H.style.cursor = 'grab';
        }
        if (state.hasDragged && window.PicEditor.sync) {
          window.PicEditor.sync.markModified();
        }
        return;
      }

      // 원 중심 드래그 종료
      if (state.isDraggingCircleRadius) {
        state.isDraggingCircleRadius = false;
        const gizmo = svg.querySelector('#circle-handle-group');
        if (gizmo) {
          const rH = gizmo.querySelector('#circle-radius-handle-wrap');
          if (rH) rH.style.cursor = 'ew-resize';
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      if (state.isDraggingCurveP1 || state.isDraggingCurveP2) {
        state.isDraggingCurveP1 = false;
        state.isDraggingCurveP2 = false;
        const gizmo = svg.querySelector('#curve-handle-group');
        if (gizmo) {
          const h1 = gizmo.querySelector('#curve-p1-handle-wrap');
          const h2 = gizmo.querySelector('#curve-p2-handle-wrap');
          if (h1) h1.style.cursor = 'grab';
          if (h2) h2.style.cursor = 'grab';
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      if (state.isDraggingCircleCenter) {
        state.isDraggingCircleCenter = false;
        if (svg) {
          const cH = svg.querySelector('#circle-center-handle-wrap');
          if (cH) cH.style.cursor = 'grab';
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 삼각형 꼭짓점 드래그 종료
      if (state.isDraggingTriangleP1 || state.isDraggingTriangleP2 || state.isDraggingTriangleP3) {
        state.isDraggingTriangleP1 = false;
        state.isDraggingTriangleP2 = false;
        state.isDraggingTriangleP3 = false;
        if (svg) {
          [1, 2, 3].forEach(idx => {
            const h = svg.querySelector(`#triangle-p${idx}-handle-wrap`);
            if (h) h.style.cursor = 'grab';
          });
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 직사각형 꼭짓점 드래그 종료
      if (state.isDraggingRectCorner) {
        state.isDraggingRectCorner = false;
        state.rectCornerIndex = -1;
        if (svg) {
          [0, 1, 2, 3].forEach(idx => {
            const h = svg.querySelector(`#rect-v${idx}-handle-wrap`);
            if (h) h.style.cursor = 'grab';
          });
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 포물선 꼭짓점 및 끝점 드래그 종료
      if (state.isDraggingParabolaV || state.isDraggingParabolaP1 || state.isDraggingParabolaP2) {
        state.isDraggingParabolaV = false;
        state.isDraggingParabolaP1 = false;
        state.isDraggingParabolaP2 = false;
        if (svg) {
          const vH = svg.querySelector('#parabola-v-handle-wrap');
          if (vH) vH.style.cursor = 'grab';
          const p1H = svg.querySelector('#parabola-p1-handle-wrap');
          if (p1H) p1H.style.cursor = 'grab';
          const p2H = svg.querySelector('#parabola-p2-handle-wrap');
          if (p2H) p2H.style.cursor = 'grab';
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 직교 좌표계 X축 / Y축 조절점 드래그 종료
      if (state.isDraggingAxesX || state.isDraggingAxesY) {
        state.isDraggingAxesX = false;
        state.isDraggingAxesY = false;
        if (svg) {
          const hX = svg.querySelector('#axes-x-handle-wrap');
          if (hX) hX.style.cursor = 'ew-resize';
          const hY = svg.querySelector('#axes-y-handle-wrap');
          if (hY) hY.style.cursor = 'ns-resize';
        }
        if (state.hasDragged && window.PicEditor.sync) window.PicEditor.sync.markModified();
        return;
      }

      // 작도 완료
      if (state.isDrawMode && state.isDrawing) {
        state.isDrawing = false;
        if (state.tempShape) {
          const created = state.tempShape;
          window.PicEditor.interaction.initMovableEvents();
          state.tempShape = null;

          const tool = (window.PicEditor.tools && window.PicEditor.tools.getCurrentTool)
            ? window.PicEditor.tools.getCurrentTool()
            : (document.getElementById('toolSelect') ? document.getElementById('toolSelect').value : 'line');
          if (tool === 'line' || tool === 'arrow') {
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showLineHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          } else if (['hyperbola', 'sqrt', 'exp'].includes(tool)) {
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showCurveHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          } else if (tool === 'arc') {
            // 호(arc) 작도 완료 즉시 선택 모드로 전환하고 붉은 중심점 핸들 노출
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showArcCenterHandle(created);
          } else if (tool === 'axes') {
            const lineX = created.querySelector('.axis-x');
            const lineY = created.querySelector('.axis-y');
            const x2 = parseFloat(lineX ? lineX.getAttribute('x2') : 0) || 0;
            const y2 = parseFloat(lineY ? lineY.getAttribute('y2') : 0) || 0;
            if (Math.abs(x2) < 5 && Math.abs(y2) < 5) {
              if (lineX) lineX.setAttribute('x2', '120');
              if (lineY) lineY.setAttribute('y2', '-120');
              const lblX = created.querySelector('.axis-label-x');
              const lblY = created.querySelector('.axis-label-y');
              if (lblX) { lblX.setAttribute('x', '126'); lblX.setAttribute('y', '5'); }
              if (lblY) { lblY.setAttribute('x', '-5'); lblY.setAttribute('y', '-126'); }
            }
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showAxesHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          } else if (tool === 'triangle') {
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showTriangleHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          } else if (tool === 'rect') {
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showRectHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          } else if (tool === 'circle') {
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showCircleHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          } else if (tool === 'parabola2' || tool === 'parabola3') {
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showParabolaHandles(created);
            window.PicEditor.inspector.syncUItoSelected();
          }

          if (window.PicEditor.sync) window.PicEditor.sync.markModified();
        }
      }
      if (state.isDragging) {
        state.isDragging = false;
        if (state.hasDragged && window.PicEditor.sync) {
          window.PicEditor.sync.markModified();
        }
      }
    };

    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    // ESC 키, Enter 키, 삭제 키 및 방향키(Arrow Keys) 이동
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          if (state.selectedElement) {
            const wrap = state.selectedElement.closest ? state.selectedElement.closest('.text-wrap') : null;
            const textEl = state.selectedElement.classList.contains('text-el') ? state.selectedElement : (wrap ? wrap.querySelector('.text-el') : null);
            if (textEl) {
              e.preventDefault();
              window.PicEditor.inspector.startInlineTextEdit(textEl);
              return;
            }
          }
        }
      }
      if (e.key === 'Escape') {
        window.PicEditor.storage.closeHtmlModal();
        window.PicEditor.utils.deselectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          if (state.selectedElement) {
            window.PicEditor.inspector.deleteSelected();
          }
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // 입력 필드(input, textarea)에서 타이핑 중일 때는 텍스트 커서 이동 허용
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') return;

        // 선택된 객체가 있을 경우 방향키로 미세 이동
        if (state.selectedElement) {
          e.preventDefault(); // 브라우저 창 스크롤 방지
          const step = e.shiftKey ? 10 : 1; // Shift 키 누르면 10px씩 고속 이동, 기본 1px 정밀 미세 이동
          let dx = 0;
          let dy = 0;

          if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          else if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;

          const target = state.selectedElement.closest('.axes-wrap') || state.selectedElement.closest('.text-wrap') || state.selectedElement;
          const t = window.PicEditor.utils.parseTransform(target);
          t.x += dx;
          t.y += dy;
          window.PicEditor.utils.setTransform(target, t);

          if (window.PicEditor.tools) {
            if (window.PicEditor.tools.updateGizmosTransform) {
              window.PicEditor.tools.updateGizmosTransform(target);
            }
            if (target.id) {
              const svg = window.PicEditor.utils.getActiveSvg();
              const midG = svg ? svg.querySelector(`g.mid-arrow[data-for="${target.id}"]`) : null;
              if (midG) {
                const mt = window.PicEditor.utils.parseTransform(midG);
                mt.x += dx;
                mt.y += dy;
                window.PicEditor.utils.setTransform(midG, mt);
              }
            }
          }

          if (window.PicEditor.sync) {
            window.PicEditor.sync.markModified();
          }
        }
      }
    });
  }
};

// 전역 단축 참조
window.toggleMode = () => window.PicEditor.interaction.toggleMode();
window.initMovableEvents = () => window.PicEditor.interaction.initMovableEvents();
