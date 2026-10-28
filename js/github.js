/**
 * github.js - 깃허브 파일 저장 및 썸네일 갤러리 불러오기 연동 모듈
 */
window.PicEditor = window.PicEditor || {};

window.PicEditor.github = {
  // 로컬 캐시
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
   * 캔버스 썸네일 PNG Base64 생성 (최대 폭 400px)
   */
  async generateThumbnailBase64(maxWidth = 400) {
    const svg = window.PicEditor.utils.getActiveSvg();
    if (!svg) return null;

    window.PicEditor.utils.deselectAll();
    const svgStr = new XMLSerializer().serializeToString(svg);
    const vb = svg.viewBox.baseVal;
    const origW = vb.width || 800;
    const origH = vb.height || 600;

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
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tw, th);
        ctx.drawImage(img, 0, 0, tw, th);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/png');
        const b64 = dataUrl.split(',')[1];
        resolve(b64);
      };
      img.onerror = (err) => {
        console.error('썸네일 생성 실패:', err);
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
   * 기존 파일의 SHA 조회 (업데이트 시 필요)
   */
  async getFileSha(owner, repo, path, branch, token) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const res = await fetch(url, { headers: this.getHeaders(token) });
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
   * [저장] 모달 열기
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

    const defaultName = `diagram_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
    if (nameInput) nameInput.value = defaultName;
    if (msgInput) msgInput.value = `물리 도면 저장: ${defaultName}`;
    if (targetPathDisplay) {
      targetPathDisplay.textContent = `${cfg.owner}/${cfg.repo}/${cfg.folder}/`;
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
   * [저장 실행] 깃허브에 파일 및 썸네일 커밋 생성
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
      statusEl.textContent = '⏳ 깃허브에 도면 코드 업로드 중...';
      statusEl.className = 'gh-status-info';
    }
    if (saveBtn) saveBtn.disabled = true;

    try {
      const activeSvg = window.PicEditor.utils.getActiveSvg();
      if (!activeSvg) throw new Error('SVG 캔버스를 찾을 수 없습니다.');

      window.PicEditor.utils.deselectAll();
      const svgStr = new XMLSerializer().serializeToString(activeSvg);

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

      // 1. HTML 파일 SHA 조회 (존재 여부 확인)
      const htmlSha = await this.getFileSha(cfg.owner, cfg.repo, htmlPath, cfg.branch, cfg.token);

      const htmlBody = {
        message: commitMsg,
        content: htmlB64,
        branch: cfg.branch
      };
      if (htmlSha) htmlBody.sha = htmlSha;

      const htmlRes = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${htmlPath}`, {
        method: 'PUT',
        headers: this.getHeaders(cfg.token),
        body: JSON.stringify(htmlBody)
      });

      if (!htmlRes.ok) {
        const errJson = await htmlRes.json().catch(() => ({}));
        throw new Error(`HTML 업로드 실패 (${htmlRes.status}): ${errJson.message || htmlRes.statusText}`);
      }

      // 2. 썸네일 PNG 생성 및 업로드
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

        await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${thumbPath}`, {
          method: 'PUT',
          headers: this.getHeaders(cfg.token),
          body: JSON.stringify(thumbBody)
        }).catch(err => console.warn('썸네일 업로드 중 경고:', err));
      }

      if (statusEl) {
        statusEl.textContent = '✅ 깃허브 저장 완료!';
        statusEl.className = 'gh-status-success';
      }

      alert(`도면이 깃허브 저장소에 성공적으로 저장되었습니다!\n\n저장 경로: ${cfg.owner}/${cfg.repo}/${htmlPath}\n브랜치: ${cfg.branch}`);
      this.closeSaveModal();

    } catch (err) {
      console.error('깃허브 저장 오류:', err);
      if (statusEl) {
        statusEl.textContent = `❌ 오류: ${err.message}`;
        statusEl.className = 'gh-status-error';
      }
      alert(`깃허브 저장 중 오류가 발생했습니다:\n${err.message}`);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
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
   * 갤러리 도면 목록 불러오기 (GitHub API 또는 정적 manifest.json)
   */
  async loadGalleryList() {
    const gridEl = document.getElementById('ghGalleryGrid');
    const countEl = document.getElementById('ghGalleryCount');
    if (!gridEl) return;

    gridEl.innerHTML = '<div class="gh-gallery-loading">🔄 깃허브 보관함에서 도면 목록을 불러오는 중...</div>';
    if (countEl) countEl.textContent = '로딩 중...';

    const cfg = this.getConfig();
    let items = [];

    // 1차 시도: 깃허브 REST API contents 조회
    try {
      const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.folder}?ref=${cfg.branch}&_t=${Date.now()}`;
      const res = await fetch(url, { headers: this.getHeaders(cfg.token) });
      
      if (res.ok) {
        const fileList = await res.json();
        if (Array.isArray(fileList)) {
          const htmlFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.html'));
          const pngFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.png'));
          const pngMap = {};
          pngFiles.forEach(f => {
            const base = f.name.slice(0, -4);
            pngMap[base] = f.download_url;
          });

          items = htmlFiles.map(h => {
            const base = h.name.slice(0, -5);
            return {
              name: base,
              filename: h.name,
              download_url: h.download_url,
              thumb_url: pngMap[base] || `./${cfg.folder}/${base}.png`,
              size: h.size,
              sha: h.sha
            };
          });
        }
      }
    } catch (err) {
      console.warn('GitHub API contents 조회 실패, 로컬 manifest 폴백 시도:', err);
    }

    // 2차 폴백: 저장소 자체의 saved/manifest.json 조회
    if (items.length === 0) {
      try {
        const manifestRes = await fetch(`./${cfg.folder}/manifest.json?_t=${Date.now()}`);
        if (manifestRes.ok) {
          const mList = await manifestRes.json();
          items = mList.map(m => ({
            name: m.name,
            filename: m.filename,
            download_url: `./${cfg.folder}/${m.filename}`,
            thumb_url: `./${cfg.folder}/${m.thumb}`,
            size: 0,
            sha: null
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
   * 갤러리 그리드 렌더링
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

      const img = document.createElement('img');
      img.src = item.thumb_url;
      img.alt = item.name;
      img.loading = 'lazy';
      img.onerror = () => {
        // 썸네일 이미지 로드 실패 시 깔끔한 SVG 플레이스홀더 표시
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
   * 도면 선택 시 캔버스에 로드
   */
  async selectDiagramItem(item) {
    if (!item) return;

    try {
      const res = await fetch(item.download_url);
      if (!res.ok) {
        throw new Error(`파일 다운로드 실패 (${res.status}): ${res.statusText}`);
      }
      const htmlCode = await res.text();

      const success = window.PicEditor.storage.importHtmlCode(htmlCode, false);
      if (success) {
        this.closeGalleryModal();
        alert(`도면 "${item.name}"을(를) 캔버스에 성공적으로 불러왔습니다!\n이제 자유롭게 편집할 수 있습니다.`);
      }
    } catch (err) {
      console.error('도면 불러오기 실패:', err);
      alert(`도면 코드를 불러오는 도중 오류가 발생했습니다:\n${err.message}`);
    }
  }
};

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
