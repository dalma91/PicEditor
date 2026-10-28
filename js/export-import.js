/**
 * export-import.js - 고해상도 PNG 다운로드 및 외부 HTML 도면 불러오기
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.storage = {
  /**
   * 외부 HTML 파일에서 SVG 도면 요소 불러오기
   */
  loadExternalHTML(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, 'text/html');
        const importedSvg = doc.querySelector('svg');
        
        if (importedSvg) {
          const svg = window.PicEditor.utils.getActiveSvg();
          const mainGrp = svg.querySelector('.main-diagram');
          
          importedSvg.querySelectorAll('g, line, path, circle, rect').forEach(node => {
            node.classList.add('movable');
            mainGrp.appendChild(node.cloneNode(true));
          });
          
          window.PicEditor.interaction.initMovableEvents();
          alert('외부 HTML 도면 요소가 성공적으로 불러와졌습니다!');
        } else {
          alert('선택한 파일에서 유효한 SVG 요소를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('HTML 불러오기 오류:', err);
        alert('파일을 불러오는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  },

  /**
   * 현재 캔버스 화면을 3배율 고해상도 PNG로 다운로드
   */
  downloadPNG() {
    const state = window.PicEditor.state;
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    window.PicEditor.utils.deselectAll();

    const svgStr = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const vb = svg.viewBox.baseVal;
    const width = vb.width || 650;
    const height = vb.height || 420;

    canvas.width = width * 3;
    canvas.height = height * 3;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = function() {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const a = document.createElement('a');
      a.download = `physics_diagram_tab_${state.activeTab}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  }
};

// 전역 단축 참조
window.loadExternalHTML = (e) => window.PicEditor.storage.loadExternalHTML(e);
window.downloadPNG = () => window.PicEditor.storage.downloadPNG();
