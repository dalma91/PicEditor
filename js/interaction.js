/**
 * interaction.js - 마우스 드래그, 이동, 작도/선택 모드 전환, 드래그앤드롭 파일 업로드 이벤트 처리
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

      el.onclick = (e) => {
        if (state.isDrawMode) return;
        e.stopPropagation();

        if (state.selectedElement) {
          const prevWrap = state.selectedElement.closest('.text-wrap') || state.selectedElement;
          prevWrap.classList.remove('selected');
        }

        const wrap = el.closest('.text-wrap') || el;
        const textEl = wrap.querySelector('.text-el') || el;
        state.selectedElement = textEl;
        wrap.classList.add('selected');
        
        window.PicEditor.inspector.syncUItoSelected();

        const inspector = document.getElementById('textInspector');
        if (wrap.classList.contains('text-wrap')) {
          if (inspector) inspector.classList.add('active');
          window.PicEditor.inspector.syncTextInspector();
        } else {
          if (inspector) inspector.classList.remove('active');
        }
      };

      el.onmousedown = (e) => {
        if (state.isDrawMode) return;
        const wrap = el.closest('.text-wrap') || el;
        const textEl = wrap.querySelector('.text-el') || el;
        state.selectedElement = textEl;

        svg.querySelectorAll('.movable').forEach(elem => {
          const w = elem.closest('.text-wrap') || elem;
          w.classList.remove('selected');
        });
        wrap.classList.add('selected');
        
        window.PicEditor.inspector.syncUItoSelected();

        const inspector = document.getElementById('textInspector');
        if (wrap.classList.contains('text-wrap')) {
          if (inspector) inspector.classList.add('active');
          window.PicEditor.inspector.syncTextInspector();
        } else {
          if (inspector) inspector.classList.remove('active');
        }

        state.isDragging = true;
        const pt = window.PicEditor.utils.getSvgPoint(e, svg);
        state.startX = pt.x;
        state.startY = pt.y;
      };
    });
  },

  /**
   * 전역 마우스 이벤트 및 SVG 캔버스 작도/드래그앤드롭 이벤트 초기화
   */
  initGlobalEvents() {
    const state = window.PicEditor.state;

    // SVG 캔버스 작도 시작 (mousedown)
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
      svg.addEventListener('mousedown', (e) => {
        if (!state.isDrawMode) return;
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
          window.PicEditor.tools.updateArcPath(state.tempShape, state.drawStart, pt);
        }

        if (state.tempShape) {
          state.tempShape.classList.add('movable');
          mainGrp.appendChild(state.tempShape);
        }
      });
    });

    // 드래그앤드롭 파일 업로드 (HTML 파일을 캔버스에 직접 끌어다 놓기)
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
          const reader = new FileReader();
          reader.onload = (re) => {
            window.PicEditor.storage.importHtmlCode(re.target.result, false);
            alert(`"${file.name}" 파일을 캔버스에 성공적으로 올렸습니다!`);
          };
          reader.readAsText(file);
        }
      });
    }

    // 마우스 이동 (mousemove)
    window.addEventListener('mousemove', (e) => {
      const svg = window.PicEditor.utils.getActiveSvg();
      if (!svg) return;
      const pt = window.PicEditor.utils.getSvgPoint(e, svg);

      // 작도 모드 드로잉
      if (state.isDrawMode && state.isDrawing && state.tempShape) {
        const tool = document.getElementById('toolSelect').value;
        if (tool === 'line' || tool === 'arrow') {
          state.tempShape.setAttribute("x2", pt.x);
          state.tempShape.setAttribute("y2", pt.y);
          const arrowDir = document.getElementById('arrowDirSelect').value;
          if (tool === 'arrow' && (arrowDir === 'mid-right' || arrowDir === 'mid-left')) {
            window.PicEditor.tools.applyArrowMarkers(state.tempShape, arrowDir, 1);
          }
        } else if (tool === 'arc') {
          window.PicEditor.tools.updateArcPath(state.tempShape, state.drawStart, pt);
        }
        return;
      }

      // 선택 모드 요소 드래그 이동
      if (!state.isDrawMode && state.isDragging && state.selectedElement) {
        const dx = pt.x - state.startX;
        const dy = pt.y - state.startY;
        state.startX = pt.x;
        state.startY = pt.y;

        const target = state.selectedElement.closest('.text-wrap') || state.selectedElement;
        const t = window.PicEditor.utils.parseTransform(target);
        t.x += dx;
        t.y += dy;
        window.PicEditor.utils.setTransform(target, t);
      }
    });

    // 마우스 뗌 (mouseup)
    window.addEventListener('mouseup', () => {
      if (state.isDrawMode && state.isDrawing) {
        state.isDrawing = false;
        if (state.tempShape) {
          window.PicEditor.interaction.initMovableEvents();
          state.tempShape = null;
        }
      }
      state.isDragging = false;
    });

    // ESC 키로 모달 닫기 및 선택 해제
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
