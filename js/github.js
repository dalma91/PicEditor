/**
 * github.js - 깃허브 파일 저장(HTML/썸네일/manifest) 및 실시간 갤러리 불러오기 연동 모듈
 * (Fastly CDN 및 브라우저 디스크 캐시 완전 우회, 한글 파일명 URL 인코딩, 기존 파일 덮어쓰기 지원)
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.github = {
  // 로컬 캐시 목록
  cachedItems: [],

  /**
   * 깃허브 설정 조회 (기본값: dalma91 / PicEditor / main / saved)
   */
  getConfig() {
    return {
      owner: localStorage.getItem('pic_gh_owner') || 'dalma91',
      repo: localStorage.getItem('pic_gh_repo') || 'PicEditor',
      branch: localStorage.getItem('pic_gh_branch') || 'main',
      folder: localStorage.getItem('pic_gh_folder') || 'saved',
      token: localStorage.getItem('pic_gh_token') || ''
    };
  },

  /**
   * 깃허브 설정 저장
   */
  saveConfig(cfg) {
    if (cfg.owner !== undefined) localStorage.setItem('pic_gh_owner', cfg.owner.trim());
    if (cfg.repo !== undefined) localStorage.setItem('pic_gh_repo', cfg.repo.trim());
    if (cfg.branch !== undefined) localStorage.setItem('pic_gh_branch', cfg.branch.trim());
    if (cfg.folder !== undefined) localStorage.setItem('pic_gh_folder', cfg.folder.trim());
    if (cfg.token !== undefined) localStorage.setItem('pic_gh_token', cfg.token.trim());
  },

  /**
   * 설정 모달 열기
   */
  openConfigModal() {
    const cfg = this.getConfig();
    const ownerInput = document.getElementById('ghConfigOwner');
    const repoInput = document.getElementById('ghConfigRepo');
    const branchInput = document.getElementById('ghConfigBranch');
    const folderInput = document.getElementById('ghConfigFolder');
    const tokenInput = document.getElementById('ghConfigToken');

    if (ownerInput) ownerInput.value = cfg.owner;
    if (repoInput) repoInput.value = cfg.repo;
    if (branchInput) branchInput.value = cfg.branch;
    if (folderInput) folderInput.value = cfg.folder;
    if (tokenInput) tokenInput.value = cfg.token;

    const modal = document.getElementById('githubConfigModal');
    if (modal) modal.style.display = 'flex';
  },

  closeConfigModal() {
    const modal = document.getElementById('githubConfigModal');
    if (modal) modal.style.display = 'none';
  },

  saveConfigFromUI() {
    const owner = document.getElementById('ghConfigOwner')?.value || 'dalma91';
    const repo = document.getElementById('ghConfigRepo')?.value || 'PicEditor';
    const branch = document.getElementById('ghConfigBranch')?.value || 'main';
    const folder = document.getElementById('ghConfigFolder')?.value || 'saved';
    const token = document.getElementById('ghConfigToken')?.value || '';

    this.saveConfig({ owner, repo, branch, folder, token });
    alert('깃허브 연동 설정이 성공적으로 저장되었습니다!');
    this.closeConfigModal();
  },

  /**
   * GitHub API 경로 세그먼트별 URL 인코딩 (한글 및 특수문자 파일명 안전 처리)
   */
  encodeApiPath(path) {
    if (!path) return '';
    return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  },

  /**
   * UTF-8 문자열을 Base64로 안전하게 인코딩 (한글 깨짐 방지)
   */
  utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Base64를 UTF-8 문자열로 디코딩
   */
  base64ToUtf8(b64) {
    const binary = atob(b64.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  },

  /**
   * 캔버스 썸네일 PNG Base64 생성 (최대 폭 400px, 독립 SVG 렌더링 지원)
   */
  async generateThumbnailBase64(maxWidth = 400) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return null;

    window.PicEditor.utils.deselectAll();

    // SVG 복제 및 네임스페이스 보장
    const cloneSvg = svg.cloneNode(true);
    const gizmo = cloneSvg.querySelector('#arc-center-handle-group');
    if (gizmo) gizmo.remove();
    cloneSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloneSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // 독립 이미지 렌더링 시 텍스트 및 기본 스타일 누락 방지 인라인 스타일 삽입
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `
      text { font-family: 'Batang', 'Times New Roman', serif; }
      .text-bg-rect { fill: #ffffff; stroke: #cccccc; stroke-width: 0.5px; }
      .text-wrap.bg-box-white .text-bg-rect { display: block; }
    `;
    cloneSvg.insertBefore(styleEl, cloneSvg.firstChild);

    const svgStr = new XMLSerializer().serializeToString(cloneSvg);
    const vb = svg.viewBox.baseVal;
    const origW = (vb && vb.width > 0) ? vb.width : (parseFloat(svg.getAttribute('width')) || 800);
    const origH = (vb && vb.height > 0) ? vb.height : (parseFloat(svg.getAttribute('height')) || 600);

    const scale = Math.min(1.0, maxWidth / origW);
    const tw = Math.max(50, Math.round(origW * scale));
    const th = Math.max(50, Math.round(origH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');

    return new Promise((resolve) => {
      const img = new Image();
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(url);
        console.warn('썸네일 생성 타임아웃');
        resolve(null);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeoutId);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tw, th);
        ctx.drawImage(img, 0, 0, tw, th);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/png');
        const b64 = dataUrl.split(',')[1];
        resolve(b64);
      };

      img.onerror = (err) => {
        clearTimeout(timeoutId);
        console.error('썸네일 캔버스 렌더링 실패:', err);
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  },

  /**
   * 깃허브 API 호출 공통 헤더
   */
  getHeaders(token) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    return headers;
  },

  /**
   * 기존 파일의 SHA 조회 (업데이트 시 필수, 캐시 완전 무효화)
   */
  async getFileSha(owner, repo, path, branch, token) {
    try {
      const encodedPath = this.encodeApiPath(path);
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}&_t=${Date.now()}`;
      const res = await fetch(url, {
        headers: this.getHeaders(token),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return data.sha || null;
      }
    } catch (e) {
      console.warn('기존 SHA 조회 중 오류 (신규 파일로 간주):', e);
    }
    return null;
  },

  /**
   * [저장] 모달 열기 (현재 로드된 도면명 자동 기본값 반영)
   */
  openSaveModal() {
    const cfg = this.getConfig();
    if (!cfg.token) {
      if (confirm('깃허브에 파일을 저장하려면 GitHub Personal Access Token(PAT) 설정이 필요합니다.\n지금 설정 창을 여시겠습니까?')) {
        this.openConfigModal();
      }
      return;
    }

    const modal = document.getElementById('githubSaveModal');
    const nameInput = document.getElementById('ghSaveFileName');
    const msgInput = document.getElementById('ghSaveCommitMsg');
    const targetPathDisplay = document.getElementById('ghSaveTargetDisplay');
    const hintEl = document.getElementById('ghSaveModeHint');

    // 현재 로드되어 작업 중인 도면명이 있으면 해당 도면명으로 자동 채움
    const currentName = window.PicEditor.state.currentDiagramName || '';
    const defaultName = currentName || `diagram_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;

    if (nameInput) nameInput.value = defaultName;
    if (msgInput) {
      msgInput.value = currentName ? `도면 수정 업데이트: ${currentName}` : `물리 도면 저장: ${defaultName}`;
    }
    if (targetPathDisplay) {
      targetPathDisplay.textContent = `${cfg.owner}/${cfg.repo}/${cfg.folder}/`;
    }

    if (hintEl) {
      if (currentName) {
        hintEl.innerHTML = `📌 <b>기존 도면 수정 모드:</b> <b>[${currentName}]</b> 도면을 편집 중입니다.<br>이 이름 그대로 저장하면 깃허브의 원본 파일과 썸네일이 새 내용으로 즉시 덮어쓰기(업데이트)됩니다.`;
        hintEl.style.display = 'block';
      } else {
        hintEl.innerHTML = `💡 신규 도면으로 저장하거나 원하는 파일 이름을 입력하세요.`;
        hintEl.style.display = 'block';
      }
    }

    const statusEl = document.getElementById('ghSaveStatus');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.style.display = 'none';
    }

    if (modal) modal.style.display = 'flex';
  },

  closeSaveModal() {
    const modal = document.getElementById('githubSaveModal');
    if (modal) modal.style.display = 'none';
  },

  /**
   * [저장 실행] 깃허브에 HTML, 썸네일 PNG 및 manifest.json 동기화 커밋
   */
  async executeSaveToGitHub() {
    const cfg = this.getConfig();
    if (!cfg.token) {
      alert('GitHub Personal Access Token이 설정되어 있지 않습니다.');
      this.openConfigModal();
      return;
    }

    let fileName = document.getElementById('ghSaveFileName')?.value.trim();
    if (!fileName) {
      alert('저장할 파일 이름을 입력해 주세요.');
      return;
    }
    if (fileName.endsWith('.html')) {
      fileName = fileName.slice(0, -5);
    }

    const commitMsg = document.getElementById('ghSaveCommitMsg')?.value.trim() || `도면 저장: ${fileName}`;
    const statusEl = document.getElementById('ghSaveStatus');
    const saveBtn = document.getElementById('ghSaveSubmitBtn');

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = '⏳ 깃허브에 도면 코드(HTML) 업로드 중...';
      statusEl.className = 'gh-status-info';
    }
    if (saveBtn) saveBtn.disabled = true;
    if (window.PicEditor.sync) window.PicEditor.sync.markSyncing('깃허브에 저장 중...');

    try {
      const activeSvg = window.PicEditor.utils.getActiveSvg();
      if (!activeSvg) throw new Error('SVG 캔버스를 찾을 수 없습니다.');

      const svgStr = window.PicEditor.utils.getCleanSvgString(activeSvg);

      const vb = activeSvg.viewBox.baseVal;
      const origW = (vb && vb.width > 0) ? vb.width : (parseFloat(activeSvg.getAttribute('width')) || 800);
      const origH = (vb && vb.height > 0) ? vb.height : (parseFloat(activeSvg.getAttribute('height')) || 600);

      const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
</head>
<body>
${svgStr}
</body>
</html>`;

      const htmlB64 = this.utf8ToBase64(htmlContent);
      const htmlPath = `${cfg.folder}/${fileName}.html`;

      // 1. HTML 파일 SHA 조회 (존재 시 업데이트)
      const htmlSha = await this.getFileSha(cfg.owner, cfg.repo, htmlPath, cfg.branch, cfg.token);

      const htmlBody = {
        message: commitMsg,
        content: htmlB64,
        branch: cfg.branch
      };
      if (htmlSha) htmlBody.sha = htmlSha;

      const encodedHtmlPath = this.encodeApiPath(htmlPath);
      const htmlRes = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedHtmlPath}`, {
        method: 'PUT',
        headers: this.getHeaders(cfg.token),
        body: JSON.stringify(htmlBody)
      });

      if (!htmlRes.ok) {
        const errJson = await htmlRes.json().catch(() => ({}));
        throw new Error(`HTML 업로드 실패 (${htmlRes.status}): ${errJson.message || htmlRes.statusText}`);
      }

      const htmlResultData = await htmlRes.json().catch(() => ({}));
      const newHtmlSha = htmlResultData.content?.sha || null;

      // 2. 썸네일 PNG 생성 및 업로드
      let newThumbSha = null;
      if (statusEl) statusEl.textContent = '⏳ 썸네일 이미지(PNG) 생성 및 저장 중...';
      const thumbB64 = await this.generateThumbnailBase64(400);

      if (thumbB64) {
        const thumbPath = `${cfg.folder}/${fileName}.png`;
        const thumbSha = await this.getFileSha(cfg.owner, cfg.repo, thumbPath, cfg.branch, cfg.token);

        const thumbBody = {
          message: `썸네일 저장: ${fileName}`,
          content: thumbB64,
          branch: cfg.branch
        };
        if (thumbSha) thumbBody.sha = thumbSha;

        const encodedThumbPath = this.encodeApiPath(thumbPath);
        const thumbRes = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedThumbPath}`, {
          method: 'PUT',
          headers: this.getHeaders(cfg.token),
          body: JSON.stringify(thumbBody)
        });

        if (thumbRes.ok) {
          const thumbResultData = await thumbRes.json().catch(() => ({}));
          newThumbSha = thumbResultData.content?.sha || null;
        } else {
          const errData = await thumbRes.json().catch(() => ({}));
          console.warn('썸네일 업로드 응답 경고:', thumbRes.status, errData);
        }
      }

      // 3. saved/manifest.json 자동 업데이트 및 커밋
      if (statusEl) statusEl.textContent = '⏳ 보관함 목록(manifest.json) 동기화 중...';
      await this.updateManifestOnGitHub(cfg, fileName, origW, origH);

      // 4. 로컬 상태 및 캐시 즉시 업데이트
      window.PicEditor.state.currentDiagramName = fileName;
      window.PicEditor.state.currentDiagramSha = newHtmlSha;
      window.PicEditor.state.currentThumbSha = newThumbSha;

      // 로컬 캐시 목록 실시간 반영
      const existingIdx = this.cachedItems.findIndex(it => it.name === fileName);
      const updatedItem = {
        name: fileName,
        filename: `${fileName}.html`,
        download_url: `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.folder}/${fileName}.html`,
        thumb_url: `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.folder}/${fileName}.png?v=${newThumbSha || Date.now()}`,
        size: htmlContent.length,
        sha: newHtmlSha
      };

      if (existingIdx >= 0) {
        this.cachedItems[existingIdx] = updatedItem;
      } else {
        this.cachedItems.unshift(updatedItem);
      }

      if (statusEl) {
        statusEl.textContent = '✅ 깃허브 저장 및 동기화 완료!';
        statusEl.className = 'gh-status-success';
      }
      if (window.PicEditor.sync) {
        window.PicEditor.sync.markSaved('저장됨 (GitHub 동기화)');
      }

      alert(`도면 "${fileName}"이(가) 깃허브에 성공적으로 저장되었습니다!\n\n저장 경로: ${cfg.owner}/${cfg.repo}/${htmlPath}\n브랜치: ${cfg.branch}\n\n이제 보관함에서 새로 바뀐 썸네일과 수정본 코드를 즉시 확인할 수 있습니다.`);
      this.closeSaveModal();

    } catch (err) {
      console.error('깃허브 저장 오류:', err);
      if (statusEl) {
        statusEl.textContent = `❌ 오류: ${err.message}`;
        statusEl.className = 'gh-status-error';
      }
      if (window.PicEditor.sync) {
        window.PicEditor.sync.markError('저장 실패 (확인 필요)');
      }
      alert(`깃허브 저장 중 오류가 발생했습니다:\n${err.message}`);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  },

  /**
   * 깃허브 saved/manifest.json 자동 갱신 및 커밋
   */
  async updateManifestOnGitHub(cfg, fileName, w, h) {
    try {
      const manifestPath = `${cfg.folder}/manifest.json`;
      const encodedPath = this.encodeApiPath(manifestPath);
      const getUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedPath}?ref=${encodeURIComponent(cfg.branch)}&_t=${Date.now()}`;

      let manifestList = [];
      let manifestSha = null;

      const res = await fetch(getUrl, {
        headers: this.getHeaders(cfg.token),
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        manifestSha = data.sha;
        const decoded = this.base64ToUtf8(data.content);
        manifestList = JSON.parse(decoded);
      }

      // 기존 항목 갱신 또는 신규 항목 추가
      const existingIdx = manifestList.findIndex(m => m.name === fileName || m.filename === `${fileName}.html`);
      const tw = 400;
      const th = Math.max(50, Math.round(400 * (h || 600) / (w || 800)));

      const newItem = {
        name: fileName,
        filename: `${fileName}.html`,
        thumb: `${fileName}.png`,
        width: tw,
        height: th
      };

      if (existingIdx >= 0) {
        manifestList[existingIdx] = newItem;
      } else {
        manifestList.unshift(newItem);
      }

      const updatedJsonStr = JSON.stringify(manifestList, null, 2);
      const manifestB64 = this.utf8ToBase64(updatedJsonStr);

      const putBody = {
        message: `도면 목록(manifest.json) 업데이트: ${fileName}`,
        content: manifestB64,
        branch: cfg.branch
      };
      if (manifestSha) putBody.sha = manifestSha;

      await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedPath}`, {
        method: 'PUT',
        headers: this.getHeaders(cfg.token),
        body: JSON.stringify(putBody)
      });
      console.log('manifest.json 깃허브 동기화 완료');
    } catch (e) {
      console.warn('manifest.json 동기화 중 경고 (도면 저장은 완료됨):', e);
    }
  },

  /**
   * [불러오기 / 갤러리] 모달 열기
   */
  async openGalleryModal() {
    const modal = document.getElementById('githubGalleryModal');
    if (modal) modal.style.display = 'flex';

    const searchInput = document.getElementById('ghGallerySearchInput');
    if (searchInput) searchInput.value = '';

    await this.loadGalleryList();
  },

  closeGalleryModal() {
    const modal = document.getElementById('githubGalleryModal');
    if (modal) modal.style.display = 'none';
  },

  /**
   * 갤러리 도면 목록 불러오기 (캐시 완전 무효화 파라미터 적용)
   */
  async loadGalleryList() {
    const gridEl = document.getElementById('ghGalleryGrid');
    const countEl = document.getElementById('ghGalleryCount');
    if (!gridEl) return;

    gridEl.innerHTML = '<div class="gh-gallery-loading">🔄 깃허브 보관함에서 최신 도면 목록을 불러오는 중...</div>';
    if (countEl) countEl.textContent = '로딩 중...';

    const cfg = this.getConfig();
    let items = [];

    // 1차 시도: 깃허브 REST API contents 조회 (캐시 무효화)
    try {
      const encodedFolder = this.encodeApiPath(cfg.folder);
      const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedFolder}?ref=${encodeURIComponent(cfg.branch)}&_t=${Date.now()}`;
      const res = await fetch(url, {
        headers: this.getHeaders(cfg.token),
        cache: 'no-store'
      });

      if (res.ok) {
        const fileList = await res.json();
        if (Array.isArray(fileList)) {
          const htmlFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.html'));
          const pngFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.png'));
          const pngMap = {};
          pngFiles.forEach(f => {
            const base = f.name.slice(0, -4);
            pngMap[base] = {
              download_url: f.download_url,
              sha: f.sha
            };
          });

          items = htmlFiles.map(h => {
            const base = h.name.slice(0, -5);
            const pngInfo = pngMap[base];
            const rawThumb = pngInfo ? pngInfo.download_url : `./${cfg.folder}/${base}.png`;
            const thumbSha = pngInfo ? pngInfo.sha : h.sha;
            return {
              name: base,
              filename: h.name,
              download_url: h.download_url,
              thumb_url: rawThumb,
              size: h.size,
              sha: h.sha,
              thumb_sha: thumbSha
            };
          });
        }
      }
    } catch (err) {
      console.warn('GitHub API contents 조회 실패, 로컬 manifest 폴백 시도:', err);
    }

    // 2차 폴백: 저장소의 saved/manifest.json 조회
    if (items.length === 0) {
      try {
        const manifestRes = await fetch(`./${cfg.folder}/manifest.json?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (manifestRes.ok) {
          const mList = await manifestRes.json();
          items = mList.map(m => ({
            name: m.name,
            filename: m.filename,
            download_url: `./${cfg.folder}/${m.filename}`,
            thumb_url: `./${cfg.folder}/${m.thumb}`,
            size: 0,
            sha: null,
            thumb_sha: null
          }));
        }
      } catch (err2) {
        console.warn('로컬 manifest 조회 실패:', err2);
      }
    }

    this.cachedItems = items;
    this.renderGalleryGrid(items);
  },

  /**
   * 갤러리 그리드 렌더링 (썸네일 캐시 버스팅 적용)
   */
  renderGalleryGrid(items, filterKeyword = '') {
    const gridEl = document.getElementById('ghGalleryGrid');
    const countEl = document.getElementById('ghGalleryCount');
    if (!gridEl) return;

    let filtered = items;
    if (filterKeyword.trim()) {
      const kw = filterKeyword.trim().toLowerCase();
      filtered = items.filter(it => it.name.toLowerCase().includes(kw));
    }

    if (countEl) {
      countEl.textContent = `총 ${filtered.length}개 도면`;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="gh-gallery-empty">
          <p>🔍 검색 결과 또는 저장된 도면이 없습니다.</p>
          <small>상단에서 <b>[☁️ 깃허브에 저장]</b>을 실행하거나 다른 검색어를 입력해 보세요.</small>
        </div>`;
      return;
    }

    gridEl.innerHTML = '';

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gh-card';

      // 썸네일 박스
      const thumbBox = document.createElement('div');
      thumbBox.className = 'gh-card-thumb-wrap';

      // 썸네일 이미지에 SHA/타임스탬프 쿼리 붙여 브라우저 디스크 캐시 완전 무효화
      const img = document.createElement('img');
      const vTag = item.thumb_sha || item.sha || Date.now();
      const sep = item.thumb_url.includes('?') ? '&' : '?';
      img.src = `${item.thumb_url}${sep}v=${vTag}`;
      img.alt = item.name;
      img.loading = 'lazy';
      img.onerror = () => {
        thumbBox.innerHTML = `
          <div class="gh-thumb-placeholder">
            <span style="font-size:28px;">📐</span>
            <span style="font-size:11px; color:#888;">도면 미리보기</span>
          </div>`;
      };
      thumbBox.appendChild(img);

      // 본문 정보
      const infoBox = document.createElement('div');
      infoBox.className = 'gh-card-info';

      const title = document.createElement('div');
      title.className = 'gh-card-title';
      title.title = item.name;
      title.textContent = item.name;

      const btnRow = document.createElement('div');
      btnRow.className = 'gh-card-actions';

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'gh-card-load-btn';
      loadBtn.innerHTML = '📥 캔버스에 불러오기';
      loadBtn.onclick = (e) => {
        e.stopPropagation();
        this.selectDiagramItem(item);
      };

      btnRow.appendChild(loadBtn);

      infoBox.appendChild(title);
      infoBox.appendChild(btnRow);

      card.appendChild(thumbBox);
      card.appendChild(infoBox);

      // 카드 클릭 시 바로 불러오기
      card.onclick = () => this.selectDiagramItem(item);

      gridEl.appendChild(card);
    });
  },

  /**
   * 실시간 검색 필터
   */
  onSearchInput(val) {
    this.renderGalleryGrid(this.cachedItems, val);
  },

  /**
   * 도면 선택 시 캔버스에 로드 (Fastly CDN 및 브라우저 캐시 무효화, 실시간 원격 Git 본문 우선 로드)
   */
  async selectDiagramItem(item) {
    if (!item) return;

    const cfg = this.getConfig();
    let htmlCode = null;

    try {
      // 1순위: GitHub REST API contents 엔드포인트 직접 호출 (Fastly CDN 300초 캐시 0초 즉시 우회, 실시간 Base64 수신)
      try {
        const filePath = `${cfg.folder}/${item.filename}`;
        const encodedFilePath = this.encodeApiPath(filePath);
        const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodedFilePath}?ref=${encodeURIComponent(cfg.branch)}&_t=${Date.now()}`;
        const apiRes = await fetch(apiUrl, {
          headers: this.getHeaders(cfg.token),
          cache: 'no-store'
        });

        if (apiRes.ok) {
          const fileData = await apiRes.json();
          if (fileData.content && fileData.encoding === 'base64') {
            htmlCode = this.base64ToUtf8(fileData.content);
            window.PicEditor.state.currentDiagramSha = fileData.sha || null;
            console.log('GitHub API contents 실시간 최신 버전 로드 성공 (0초 지연):', item.name);
          }
        }
      } catch (apiErr) {
        console.warn('GitHub API contents 직접 조회 폴백:', apiErr);
      }

      // 2순위: GitHub API 실패 시 download_url에 엄격한 캐시 무효화 파라미터 및 헤더 적용
      if (!htmlCode) {
        const sep = item.download_url.includes('?') ? '&' : '?';
        const freshUrl = `${item.download_url}${sep}_t=${Date.now()}`;
        const res = await fetch(freshUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (!res.ok) {
          throw new Error(`파일 다운로드 실패 (${res.status}): ${res.statusText}`);
        }
        htmlCode = await res.text();
      }

      // 3단계: 캔버스에 SVG 주입 및 작업 상태 저장
      const success = window.PicEditor.storage.importHtmlCode(htmlCode, false);
      if (success) {
        window.PicEditor.state.currentDiagramName = item.name;
        if (item.sha) window.PicEditor.state.currentDiagramSha = item.sha;

        if (window.PicEditor.sync) {
          window.PicEditor.sync.markSaved('저장됨 (GitHub 최신본)');
        }

        this.closeGalleryModal();
        alert(`도면 "${item.name}"을(를) 캔버스에 최신 상태로 불러왔습니다!\n\n이제 도면을 자유롭게 편집한 후 [☁️ 깃허브에 저장]을 누르면 이 도면에 바로 덮어쓰기 저장됩니다.`);
      }
    } catch (err) {
      console.error('도면 불러오기 실패:', err);
      if (window.PicEditor.sync) {
        window.PicEditor.sync.markError('불러오기 오류');
      }
      alert(`도면 코드를 불러오는 도중 오류가 발생했습니다:\n${err.message}`);
    }
  }
};

/**
 * 실시간 저장/동기화 상태 관리 및 로컬 자동 백업(Auto-Save)
 */
window.PicEditor.sync = {
  status: 'saved',
  autoSaveTimer: null,

  setStatus(status, message) {
    this.status = status;
    const badge = document.getElementById('syncStatusBadge');
    const textEl = document.getElementById('syncStatusText');
    if (!badge || !textEl) return;

    badge.className = `sync-badge sync-${status}`;
    if (status === 'saved') {
      textEl.textContent = message || '저장됨 (GitHub 동기화)';
      badge.title = '모든 변경 사항이 깃허브에 최신 버전으로 저장되었습니다.';
    } else if (status === 'modified') {
      textEl.textContent = message || '수정됨 (미저장)';
      badge.title = '미저장 변경 사항이 있습니다. [☁️ 깃허브에 저장]을 눌러 커밋하세요.';
    } else if (status === 'syncing') {
      textEl.textContent = message || '동기화 중...';
      badge.title = '깃허브와 데이터를 송수신하는 중입니다.';
    } else if (status === 'error') {
      textEl.textContent = message || '저장 오류';
      badge.title = '저장에 실패했습니다. 토큰이나 네트워크를 확인하세요.';
    }
  },

  markModified() {
    this.setStatus('modified');

    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.executeAutoSave();
    }, 600);
  },

  markSaved(msg) {
    this.setStatus('saved', msg);
    localStorage.removeItem('pic_autosave_svg');
    const restoreBtn = document.getElementById('autoRestoreBtn');
    if (restoreBtn) restoreBtn.style.display = 'none';
  },

  markSyncing(msg) {
    this.setStatus('syncing', msg);
  },

  markError(msg) {
    this.setStatus('error', msg);
  },

  executeAutoSave() {
    try {
      const activeSvg = window.PicEditor.utils.getActiveSvg();
      if (!activeSvg) return;
      const svgStr = window.PicEditor.utils.getCleanSvgString(activeSvg);
      localStorage.setItem('pic_autosave_svg', svgStr);
      localStorage.setItem('pic_autosave_time', String(Date.now()));
      localStorage.setItem('pic_autosave_name', window.PicEditor.state.currentDiagramName || '');

      const restoreBtn = document.getElementById('autoRestoreBtn');
      if (restoreBtn) restoreBtn.style.display = 'inline-flex';
    } catch (e) {
      console.warn('로컬 자동 백업 중 경고:', e);
    }
  },

  checkAutoSaveOnLoad() {
    const savedSvg = localStorage.getItem('pic_autosave_svg');
    const savedTime = localStorage.getItem('pic_autosave_time');
    const restoreBtn = document.getElementById('autoRestoreBtn');
    if (savedSvg && savedTime && restoreBtn) {
      restoreBtn.style.display = 'inline-flex';
      const timeStr = new Date(parseInt(savedTime)).toLocaleTimeString();
      restoreBtn.title = `최근 미저장 임시저장본(${timeStr})을 복원합니다.`;
    }
  },

  restoreAutoSaved() {
    const savedSvg = localStorage.getItem('pic_autosave_svg');
    const savedName = localStorage.getItem('pic_autosave_name');
    if (!savedSvg) {
      alert('복원할 임시저장본이 없습니다.');
      return;
    }
    if (confirm('최근 미저장 작업 내용을 캔버스에 복원하시겠습니까?')) {
      const success = window.PicEditor.storage.importHtmlCode(savedSvg, false);
      if (success) {
        if (savedName) window.PicEditor.state.currentDiagramName = savedName;
        this.setStatus('modified', '임시저장본 복구됨 (미저장)');
        alert('최근 작업 내용이 성공적으로 복구되었습니다!\n수정 완료 후 [☁️ 깃허브에 저장]을 눌러주세요.');
      }
    }
  }
};

window.restoreAutoSaved = () => window.PicEditor.sync.restoreAutoSaved();

// 전역 단축 함수
window.openGitHubSaveModal = () => window.PicEditor.github.openSaveModal();
window.closeGitHubSaveModal = () => window.PicEditor.github.closeSaveModal();
window.executeSaveToGitHub = () => window.PicEditor.github.executeSaveToGitHub();
window.openGitHubGalleryModal = () => window.PicEditor.github.openGalleryModal();
window.closeGitHubGalleryModal = () => window.PicEditor.github.closeGalleryModal();
window.openGitHubConfigModal = () => window.PicEditor.github.openConfigModal();
window.closeGitHubConfigModal = () => window.PicEditor.github.closeConfigModal();
window.saveGitHubConfigFromUI = () => window.PicEditor.github.saveConfigFromUI();
window.onGallerySearchInput = (val) => window.PicEditor.github.onSearchInput(val);
window.refreshGalleryList = () => window.PicEditor.github.loadGalleryList();
