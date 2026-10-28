/**
 * export-import.js - 그림(이미지) 업로드, HTML/SVG 코드 올리기, 외부 파일 불러오기, 코드 복사 및 PNG 다운로드
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.storage = {
  /**
   * 그림(PNG, JPG, WebP, SVG 등) 파일을 캔버스에 <image> 요소로 올리기
   * @param {File|Blob} file - 이미지 파일 객체
   * @param {boolean} autoResizeCanvas - 캔버스 크기를 이미지에 맞출지 여부
   */
  loadImageFile(file, autoResizeCanvas = true) {
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = (err) => {
      console.error('FileReader 오류:', err);
      alert('이미지 파일을 읽는 중 오류가 발생했습니다.');
    };

    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      
      img.onerror = (err) => {
        console.error('Image 디코딩 오류:', err);
        alert('이미지를 디코딩할 수 없습니다. 유효한 이미지 파일인지 확인해 주세요.');
      };

      img.onload = () => {
        const activeSvg = window.PicEditor.utils.getActiveSvg();
        if (!activeSvg) {
          alert('SVG 캔버스를 찾을 수 없습니다.');
          return;
        }

        let mainGrp = activeSvg.querySelector('.main-diagram');
        if (!mainGrp) {
          mainGrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
          mainGrp.setAttribute('class', 'main-diagram');
          activeSvg.appendChild(mainGrp);
        }

        const imgW = img.naturalWidth || img.width || 800;
        const imgH = img.naturalHeight || img.height || 600;

        // 1. 캔버스 해상도를 이미지 원본 크기에 맞춤
        if (autoResizeCanvas) {
          activeSvg.setAttribute('viewBox', `0 0 ${imgW} ${imgH}`);
          const wInput = document.getElementById('canvasWidthInput');
          const hInput = document.getElementById('canvasHeightInput');
          const sizeDisplay = document.getElementById('canvasSizeDisplay');
          if (wInput) wInput.value = imgW;
          if (hInput) hInput.value = imgH;
          if (sizeDisplay) sizeDisplay.textContent = `${imgW} × ${imgH} px`;
        }

        // 2. 초기 기본 샘플(천장 실과 질점계)이 남아있다면 깨끗하게 비우기
        const existingSample = mainGrp.querySelector('rect[fill="#E0E0E0"]');
        if (existingSample) {
          mainGrp.innerHTML = '';
          const textLayer = activeSvg.querySelector('.text-layer');
          if (textLayer) textLayer.innerHTML = '';
        }

        // 3. SVG <image> 요소 생성 및 모든 호환 속성 부여
        const svgImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
        svgImg.setAttribute('href', dataUrl);
        svgImg.setAttribute('xlink:href', dataUrl);
        svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
        svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
        svgImg.setAttribute('x', '0');
        svgImg.setAttribute('y', '0');
        svgImg.setAttribute('width', String(imgW));
        svgImg.setAttribute('height', String(imgH));
        svgImg.setAttribute('class', 'movable image-el');
        svgImg.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');
        svgImg.setAttribute('opacity', '1');
        svgImg.style.pointerEvents = 'auto';

        // 캔버스에 추가 (화면 맨 앞에 바로 보이도록 추가)
        mainGrp.appendChild(svgImg);

        // 4. 이벤트 등록 및 선택 상태 활성화
        window.PicEditor.interaction.initMovableEvents();

        window.PicEditor.utils.deselectAll();
        window.PicEditor.state.selectedElement = svgImg;
        svgImg.classList.add('selected');
        window.PicEditor.inspector.syncUItoSelected();

        console.log(`그림 파일 로드 성공: ${imgW}x${imgH}px`);
        alert(`그림("${file.name || '이미지'}")이 캔버스에 성공적으로 표시되었습니다!\n(해상도: ${imgW} × ${imgH} px)`);
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  },

  /**
   * 그림 파일 인풋 변경 이벤트 핸들러
   */
  onImageFileInput(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.loadImageFile(file, true);
    }
  },

  /**
   * HTML 또는 SVG 문자열을 파싱하여 캔버스에 직접 올리기
   * @param {string} htmlStr - HTML 또는 SVG 코드
   * @param {boolean} isAppend - true면 기존 내용에 추가, false면 새로 교체
   */
  importHtmlCode(htmlStr, isAppend = false) {
    if (!htmlStr || !htmlStr.trim()) {
      alert('붙여넣을 HTML 코드가 비어 있습니다.');
      return false;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlStr, 'text/html');
      const importedSvg = doc.querySelector('svg');
      const activeSvg = window.PicEditor.utils.getActiveSvg();
      if (!activeSvg) return false;

      let mainGrp = activeSvg.querySelector('.main-diagram');
      let textLayer = activeSvg.querySelector('.text-layer');
      let defs = activeSvg.querySelector('defs');

      if (!mainGrp) {
        mainGrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mainGrp.setAttribute('class', 'main-diagram');
        activeSvg.appendChild(mainGrp);
      }
      if (!textLayer) {
        textLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        textLayer.setAttribute('class', 'text-layer');
        activeSvg.appendChild(textLayer);
      }
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        activeSvg.insertBefore(defs, activeSvg.firstChild);
      }

      // 새로 교체하는 경우 기존 요소 비우기
      if (!isAppend) {
        mainGrp.innerHTML = '';
        textLayer.innerHTML = '';
      }

      if (importedSvg) {
        // 1. viewBox 및 캔버스 크기 동기화
        if (!isAppend) {
          const vb = importedSvg.getAttribute('viewBox');
          if (vb) {
            activeSvg.setAttribute('viewBox', vb);
          } else {
            const w = importedSvg.getAttribute('width') || 800;
            const h = importedSvg.getAttribute('height') || 600;
            activeSvg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
          }
          window.PicEditor.canvas.updateCanvasInfo();
        }

        // 2. defs 복사 (마커, 그라디언트 등)
        const importedDefs = importedSvg.querySelectorAll('defs > *');
        importedDefs.forEach(item => {
          defs.appendChild(item.cloneNode(true));
        });

        // 3. 텍스트 레이어 및 일반 그래픽 요소 분리 가져오기
        const existingTextLayer = importedSvg.querySelector('.text-layer');
        if (existingTextLayer) {
          existingTextLayer.querySelectorAll('.text-wrap').forEach(node => {
            const clone = node.cloneNode(true);
            clone.classList.add('movable');
            textLayer.appendChild(clone);
          });
        }

        // 일반 노드 탐색
        const targetContainer = importedSvg.querySelector('.main-diagram') || importedSvg;
        const nodes = targetContainer.children;

        Array.from(nodes).forEach(node => {
          const tag = node.tagName.toLowerCase();
          if (tag === 'defs' || tag === 'style' || node.classList.contains('text-layer')) return;

          // 배경 흰색 rect는 메인 다이어그램에 중복 추가하지 않음
          if (tag === 'rect' && node.getAttribute('width') === '100%' && node.getAttribute('height') === '100%') {
            return;
          }

          if (tag === 'text') {
            const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
            wrap.setAttribute('class', 'movable text-wrap');
            wrap.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');

            const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bgRect.setAttribute('class', 'text-bg-rect');
            bgRect.setAttribute('rx', '2');

            const textClone = node.cloneNode(true);
            textClone.classList.add('text-el');

            wrap.appendChild(bgRect);
            wrap.appendChild(textClone);
            textLayer.appendChild(wrap);
          } else {
            const clone = node.cloneNode(true);
            clone.classList.add('movable');
            if (!clone.getAttribute('transform')) {
              clone.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');
            }
            mainGrp.appendChild(clone);
          }
        });

      } else {
        // SVG 태그가 없는 경우 이미지 및 도형 태그 파싱
        const allGraphics = doc.querySelectorAll('g, line, path, rect, circle, polygon, image, text');
        if (allGraphics.length === 0) {
          alert('붙여넣은 HTML에서 편집 가능한 요소를 찾을 수 없습니다.');
          return false;
        }

        allGraphics.forEach(node => {
          const tag = node.tagName.toLowerCase();
          if (tag === 'text') {
            const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
            wrap.setAttribute('class', 'movable text-wrap');
            wrap.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');
            const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bgRect.setAttribute('class', 'text-bg-rect');
            bgRect.setAttribute('rx', '2');
            const textClone = node.cloneNode(true);
            textClone.classList.add('text-el');
            wrap.appendChild(bgRect);
            wrap.appendChild(textClone);
            textLayer.appendChild(wrap);
          } else {
            const clone = node.cloneNode(true);
            clone.classList.add('movable');
            if (!clone.getAttribute('transform')) {
              clone.setAttribute('transform', 'translate(0,0) scale(1,1) rotate(0)');
            }
            mainGrp.appendChild(clone);
          }
        });
      }

      window.PicEditor.interaction.initMovableEvents();
      setTimeout(window.PicEditor.canvas.updateAllTextBgBoxes, 80);
      window.PicEditor.utils.deselectAll();

      return true;
    } catch (err) {
      console.error('HTML 파싱 오류:', err);
      alert('HTML 코드를 파싱하는 도중 오류가 발생했습니다: ' + err.message);
      return false;
    }
  },

  /**
   * 외부 파일에서 HTML/SVG 불러오기
   */
  loadExternalHTML(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // 만약 이미지 파일인 경우 이미지 로더로 자동 전환
    if (file.type && file.type.startsWith('image/')) {
      this.loadImageFile(file, true);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = this.importHtmlCode(e.target.result, false);
      if (success) {
        alert('파일에서 HTML 코드를 성공적으로 불러왔습니다!');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  /**
   * 모달 열기 / 닫기
   */
  openHtmlModal() {
    const modal = document.getElementById('htmlModal');
    if (modal) {
      modal.style.display = 'flex';
      const ta = document.getElementById('htmlCodeInput');
      if (ta) ta.focus();
    }
  },

  closeHtmlModal() {
    const modal = document.getElementById('htmlModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  applyPastedHtml(isAppend) {
    const ta = document.getElementById('htmlCodeInput');
    if (!ta) return;
    const code = ta.value;
    const success = this.importHtmlCode(code, isAppend);
    if (success) {
      this.closeHtmlModal();
      ta.value = '';
    }
  },

  /**
   * 캔버스 전체 비우기
   */
  clearCanvas() {
    if (confirm('캔버스의 모든 요소를 비우시겠습니까?')) {
      const activeSvg = window.PicEditor.utils.getActiveSvg();
      if (!activeSvg) return;
      const mainGrp = activeSvg.querySelector('.main-diagram');
      const textLayer = activeSvg.querySelector('.text-layer');
      if (mainGrp) mainGrp.innerHTML = '';
      if (textLayer) textLayer.innerHTML = '';
      window.PicEditor.utils.deselectAll();
    }
  },

  /**
   * 편집된 현재 캔버스의 HTML/SVG 코드를 클립보드에 복사
   */
  copyHtmlCode() {
    const activeSvg = window.PicEditor.utils.getActiveSvg();
    if (!activeSvg) return;

    window.PicEditor.utils.deselectAll();
    const svgStr = new XMLSerializer().serializeToString(activeSvg);

    navigator.clipboard.writeText(svgStr).then(() => {
      alert('현재 편집된 캔버스의 HTML(SVG) 코드가 클립보드에 복사되었습니다!\n원하는 곳에 바로 붙여넣기(Ctrl+V)하여 사용하세요.');
    }).catch(err => {
      const ta = document.getElementById('htmlCodeInput');
      if (ta) {
        ta.value = svgStr;
        this.openHtmlModal();
        alert('클립보드 자동 복사가 제한되어 모달에 코드를 표시했습니다. 복사(Ctrl+C)하여 사용하세요.');
      }
    });
  },

  /**
   * 현재 캔버스 화면을 3배율 고해상도 PNG로 다운로드 (업로드된 그림 배경 포함)
   */
  downloadPNG() {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return;

    window.PicEditor.utils.deselectAll();

    const svgStr = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const vb = svg.viewBox.baseVal;
    const width = vb.width || 800;
    const height = vb.height || 600;

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
      a.download = `physics_diagram_${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  }
};

// 전역 단축 참조
window.loadImageFile = (f, auto) => window.PicEditor.storage.loadImageFile(f, auto);
window.onImageFileInput = (e) => window.PicEditor.storage.onImageFileInput(e);
window.loadExternalHTML = (e) => window.PicEditor.storage.loadExternalHTML(e);
window.downloadPNG = () => window.PicEditor.storage.downloadPNG();
window.openHtmlModal = () => window.PicEditor.storage.openHtmlModal();
window.closeHtmlModal = () => window.PicEditor.storage.closeHtmlModal();
window.applyPastedHtml = (append) => window.PicEditor.storage.applyPastedHtml(append);
window.clearCanvas = () => window.PicEditor.storage.clearCanvas();
window.copyHtmlCode = () => window.PicEditor.storage.copyHtmlCode();
