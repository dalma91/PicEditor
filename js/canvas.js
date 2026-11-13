/**
 * canvas.js - 캔버스 크기 조절, 텍스트 배경 박스 계산
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.canvas = {
  /**
   * 단일 텍스트 요소의 배경 박스 크기(BBox) 계산 및 갱신
   */
  updateSingleTextBgBox(wrap) {
    if (!wrap) return;
    const textEl = wrap.querySelector('.text-el') || wrap.querySelector('text');
    if (!textEl) return;

    let bgRect = wrap.querySelector('.text-bg-rect');

    // 만약 bg-box-white 클래스가 켜져 있는데 bgRect가 없다면 자동 생성
    if (!bgRect && wrap.classList.contains('bg-box-white')) {
      bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute('class', 'text-bg-rect');
      bgRect.setAttribute('rx', '3');
      bgRect.setAttribute('ry', '3');
      wrap.insertBefore(bgRect, textEl);
    }

    if (bgRect) {
      // bgRect가 항상 textEl 뒤(SVG 기준 앞 순서)에 오도록 보장 (글자가 가려지는 현상 원천 방지)
      if (textEl.previousElementSibling !== bgRect) {
        wrap.insertBefore(bgRect, textEl);
      }

      try {
        let bbox = null;
        try {
          bbox = textEl.getBBox();
        } catch (e) {
          bbox = null;
        }

        const padX = 6;
        const padY = 4;
        const fs = parseInt(textEl.getAttribute('font-size')) || 24;
        const txt = textEl.textContent || '';
        const fallbackW = Math.max(16, txt.length * (fs * 0.55));
        const fallbackH = fs * 1.15;

        const w = (bbox && bbox.width > 0) ? bbox.width : fallbackW;
        const h = (bbox && bbox.height > 0) ? bbox.height : fallbackH;
        const x = (bbox && bbox.width > 0) ? bbox.x : (parseFloat(textEl.getAttribute('x')) || 0);
        const y = (bbox && bbox.height > 0) ? bbox.y : ((parseFloat(textEl.getAttribute('y')) || 0) - h);

        bgRect.setAttribute('x', Math.round(x - padX));
        bgRect.setAttribute('y', Math.round(y - padY));
        bgRect.setAttribute('width', Math.round(Math.max(12, w + padX * 2)));
        bgRect.setAttribute('height', Math.round(Math.max(12, h + padY * 2)));
        bgRect.setAttribute('fill', '#ffffff');
        bgRect.setAttribute('fill-opacity', '1');
        bgRect.setAttribute('stroke', 'none');
        bgRect.setAttribute('stroke-width', '0');
        bgRect.setAttribute('rx', '3');
        bgRect.setAttribute('ry', '3');

        if (wrap.classList.contains('bg-box-white')) {
          bgRect.removeAttribute('display');
          bgRect.style.display = 'inline';
        } else {
          bgRect.setAttribute('display', 'none');
          bgRect.style.display = 'none';
        }
      } catch (e) {
        console.warn('updateSingleTextBgBox fallback error:', e);
      }
    }
  },

  /**
   * 모든 텍스트의 배경 박스 크기(BBox)를 계산하여 갱신
   */
  updateAllTextBgBoxes() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    
    svg.querySelectorAll('.text-wrap').forEach(wrap => {
      this.updateSingleTextBgBox(wrap);
    });
  },

  /**
   * 상단 인포 바 및 입력 칸에 현재 활성 캔버스의 viewBox 크기 동기화
   */
  updateCanvasInfo() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    const vb = svg.viewBox.baseVal;
    const w = vb.width || 800;
    const h = vb.height || 600;
    
    const wInput = document.getElementById('canvasWidthInput');
    const hInput = document.getElementById('canvasHeightInput');
    const sizeDisplay = document.getElementById('canvasSizeDisplay');
    
    if (wInput) wInput.value = w;
    if (hInput) hInput.value = h;
    if (sizeDisplay) sizeDisplay.textContent = `${w} × ${h} px`;
  },

  /**
   * 입력된 가로/세로 값으로 현재 SVG viewBox 크기 변경
   */
  resizeCanvas() {
    const w = parseInt(document.getElementById('canvasWidthInput').value) || 800;
    const h = parseInt(document.getElementById('canvasHeightInput').value) || 600;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      window.PicEditor.canvas.updateCanvasInfo();
    }
  }
};

// 전역 단축 참조
window.updateSingleTextBgBox = (wrap) => window.PicEditor.canvas.updateSingleTextBgBox(wrap);
window.updateAllTextBgBoxes = () => window.PicEditor.canvas.updateAllTextBgBoxes();
window.updateCanvasInfo = () => window.PicEditor.canvas.updateCanvasInfo();
window.resizeCanvas = () => window.PicEditor.canvas.resizeCanvas;
