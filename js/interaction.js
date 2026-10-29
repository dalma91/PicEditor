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

        const wrap = el.closest('.text-wrap') || el.closest('.mid-arrow') || el;
        const textEl = wrap.querySelector('.text-el') || el;

        // 선택해제를 누르지 않으면 다른 객체가 선택되지 않도록 차단
        if (state.selectedElement && state.selectedElement !== textEl && state.selectedElement !== wrap) {
          e.stopPropagation();
          return;
        }

        e.stopPropagation();

        state.selectedElement = textEl;

        svg.querySelectorAll('.movable').forEach(elem => {
          const w = elem.closest('.text-wrap') || elem.closest('.mid-arrow') || elem;
          w.classList.remove('selected');
        });
        wrap.classList.add('selected');
        
        window.PicEditor.inspector.syncUItoSelected();

        if (window.PicEditor.tools.isArcElement(el)) {
          window.PicEditor.tools.showArcCenterHandle(el);
          window.PicEditor.tools.hideLineHandles();
        } else if (window.PicEditor.tools.isLineElement(el)) {
          window.PicEditor.tools.showLineHandles(el);
          window.PicEditor.tools.hideArcCenterHandle();
        } else {
          window.PicEditor.tools.hideArcCenterHandle();
          window.PicEditor.tools.hideLineHandles();
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
          if (e.target.closest && (e.target.closest('#arc-center-handle-group') || e.target.closest('#line-handle-group'))) {
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

        const tool = document.getElementById('toolSelect').value;
        const strokeStyle = document.getElementById('strokeStyleSelect').value;
        const arrowDir = document.getElementById('arrowDirSelect').value;
        let mainGrp = svg.querySelector('.main-diagram');

        if (!mainGrp) {
          mainGrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
          mainGrp.setAttribute('class', 'main-diagram');
          svg.appendChild(mainGrp);
        }

        if (tool === 'line' || tool === 'arrow') {
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

      // 2. 작도 모드 드로잉
      if (state.isDrawMode && state.isDrawing && state.tempShape) {
        if (e.cancelable) e.preventDefault();
        const tool = document.getElementById('toolSelect').value;
        if (tool === 'line' || tool === 'arrow') {
          state.tempShape.setAttribute("x2", pt.x);
          state.tempShape.setAttribute("y2", pt.y);
          const arrowDir = document.getElementById('arrowDirSelect').value;
          if (tool === 'arrow' && (arrowDir === 'mid-right' || arrowDir === 'mid-left')) {
            window.PicEditor.tools.applyArrowMarkers(state.tempShape, arrowDir, 1);
          }
        } else if (tool === 'arc') {
          const mid = { x: (state.drawStart.x + pt.x) / 2, y: (state.drawStart.y + pt.y) / 2 };
          window.PicEditor.tools.updateArcPath(state.tempShape, state.drawStart, pt, mid);
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

        const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(target);
        t.x += dx;
        t.y += dy;
        window.PicEditor.utils.setTransform(target, t);

        if (window.PicEditor.tools.isArcElement(target)) {
          window.PicEditor.tools.updateArcGizmoTransform(target);
        } else if (window.PicEditor.tools.isLineElement(target)) {
          window.PicEditor.tools.updateLineGizmoTransform(target);
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

      // 작도 완료
      if (state.isDrawMode && state.isDrawing) {
        state.isDrawing = false;
        if (state.tempShape) {
          const created = state.tempShape;
          window.PicEditor.interaction.initMovableEvents();
          state.tempShape = null;

          const tool = document.getElementById('toolSelect').value;
          if (tool === 'arc') {
            // 호(arc) 작도 완료 즉시 선택 모드로 전환하고 붉은 중심점 핸들 노출
            window.PicEditor.interaction.toggleMode();
            window.PicEditor.utils.deselectAll();
            state.selectedElement = created;
            created.classList.add('selected');
            window.PicEditor.tools.showArcCenterHandle(created);
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

    // ESC 키 및 삭제 키
    window.addEventListener('keydown', (e) => {
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
      }
    });
  }
};

// 전역 단축 참조
window.toggleMode = () => window.PicEditor.interaction.toggleMode();
window.initMovableEvents = () => window.PicEditor.interaction.initMovableEvents();
