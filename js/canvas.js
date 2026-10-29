/**
 * canvas.js - 캔버스 크기 조절, 텍스트 배경 박스 계산
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.canvas = {
  /**
   * 모든 텍스트의 배경 박스 크기(BBox)를 계산하여 갱신
   */
  updateAllTextBgBoxes() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;
    
    svg.querySelectorAll('.text-wrap').forEach(wrap => {
      const textEl = wrap.querySelector('.text-el');
      const bgRect = wrap.querySelector('.text-bg-rect');
      if (textEl && bgRect) {
        try {
          const bbox = textEl.getBBox();
          bgRect.setAttribute('x', bbox.x - 4);
          bgRect.setAttribute('y', bbox.y - 3);
          bgRect.setAttribute('width', bbox.width + 8);
          bgRect.setAttribute('height', bbox.height + 6);
          bgRect.setAttribute('fill', '#ffffff');
          bgRect.setAttribute('stroke', 'none');
          bgRect.setAttribute('stroke-width', '0');
        } catch (e) {
          // BBox calculation fallback
        }
      }
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
window.updateAllTextBgBoxes = window.PicEditor.canvas.updateAllTextBgBoxes;
window.updateCanvasInfo = window.PicEditor.canvas.updateCanvasInfo;
window.resizeCanvas = window.PicEditor.canvas.resizeCanvas;
