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
   * 곡선(호) 경로 업데이트 (베지에 곡선)
   */
  updateArcPath(pathEl, p1, p2) {
    const arcDirSelect = document.getElementById('arcDirSelect');
    const arcDir = arcDirSelect ? arcDirSelect.value : 'right';
    
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const bulge = dist * 0.25; 
    let nx = -dy / (dist || 1);
    let ny = dx / (dist || 1);

    if (arcDir === 'left') {
      nx = -nx;
      ny = -ny;
    }

    const cx = mx + nx * bulge;
    const cy = my + ny * bulge;

    pathEl.setAttribute("d", `M ${p1.x},${p1.y} Q ${cx},${cy} ${p2.x},${p2.y}`);
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
    alert('선택한 직선이 화살표로 변경되었습니다!');
  }
};

// 전역 단축 참조
window.onToolChange = () => window.PicEditor.tools.onToolChange();
window.convertToArrow = () => window.PicEditor.tools.convertToArrow();
