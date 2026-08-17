/**
 * DER Builder — Gerenciamento de Armazenamento Local e Exportação (PNG, SVG, JSON)
 */
class StorageExportManager {
  constructor(model) {
    this.model = model;
    this.storageKey = 'der_builder_projects_v1';
  }

  // --- LOCAL STORAGE ---
  getProjects() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
      return [];
    }
  }

  saveProject(title = 'Sistema Acadêmico') {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex(p => p.title.toLowerCase() === title.toLowerCase());

    const projectData = {
      id: existingIndex >= 0 ? projects[existingIndex].id : 'proj_' + Date.now(),
      title,
      updatedAt: new Date().toISOString(),
      data: this.model.toJSON()
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = projectData;
    } else {
      projects.push(projectData);
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
      return projectData;
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      alert('Erro ao salvar o projeto no navegador.');
      return null;
    }
  }

  loadProject(id) {
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === id);
    if (proj) {
      this.model.fromJSON(proj.data);
      return proj;
    }
    return null;
  }

  deleteProject(id) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  // --- EXPORTAR JSON ---
  exportJSON(filename = 'diagrama_der.json') {
    const jsonStr = JSON.stringify(this.model.toJSON(), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  // --- IMPORTAR JSON ---
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && (parsed.entities || parsed.attributes || parsed.relationships)) {
        this.model.fromJSON(parsed);
        return true;
      }
    } catch (e) {
      console.error('JSON inválido:', e);
    }
    return false;
  }

  // --- ESTILOS PETER CHEN FORMAL (PRETO E BRANCO ACADÊMICO DE ALTA PRECISÃO) ---
  getChenStylesheet() {
    return `
      .entity-rect { fill: #f4f4f5; stroke: #000000; stroke-width: 2px; rx: 0; }
      .entity-rect.inner { fill: none; stroke: #000000; stroke-width: 1.5px; rx: 0; }
      .attribute-ellipse { fill: #ffffff; stroke: #000000; stroke-width: 1.5px; }
      .attribute-ellipse.inner { fill: none; stroke: #000000; stroke-width: 1.2px; }
      .attribute-ellipse.derived { stroke-dasharray: 6 4; }
      .relationship-polygon { fill: #e4e4e7; stroke: #000000; stroke-width: 2px; }
      .relationship-polygon.inner { fill: none; stroke: #000000; stroke-width: 1.5px; }
      .specialization-circle { fill: #ffffff; stroke: #000000; stroke-width: 2px; }
      .specialization-text { font-family: 'Times New Roman', Times, serif; font-size: 14px; font-weight: 700; fill: #000000; text-anchor: middle; dominant-baseline: central; }
      .element-text { font-family: 'Times New Roman', Times, serif; font-size: 13px; fill: #000000; text-anchor: middle; dominant-baseline: central; }
      .entity-text { font-weight: 700; font-size: 14px; letter-spacing: 0.5px; }
      .attribute-text.key-attribute { text-decoration: underline; font-weight: 700; fill: #000000; }
      .attribute-text.key-partial-attribute { text-decoration: underline dotted; font-weight: 600; fill: #000000; }
      .relationship-text { font-weight: 700; font-size: 13px; fill: #000000; letter-spacing: 0.5px; }
      .connection-line { fill: none; stroke: #000000; stroke-width: 1.8px; stroke-linecap: round; stroke-linejoin: round; }
      .connection-line.total { stroke-width: 4px; }
      .connection-line.total-side { stroke-width: 1.8px; }
      .cardinality-bg { fill: #ffffff; stroke: #000000; stroke-width: 1px; rx: 3px; }
      .cardinality-badge { font-family: 'Times New Roman', Times, serif; font-size: 13px; font-weight: 700; fill: #000000; text-anchor: middle; dominant-baseline: central; }
      .role-text { font-family: 'Times New Roman', Times, serif; font-size: 12px; font-weight: 600; fill: #000000; text-anchor: middle; }
    `;
  }

  // --- PREPARAR CLONE SVG LIMPO PARA EXPORTAÇÃO ---
  prepareExportClone() {
    const svgElement = document.getElementById('der-svg-canvas') || document.getElementById('der-canvas');
    if (!svgElement) return null;

    const viewportGroup = document.getElementById('viewport-group');
    const bbox = viewportGroup ? viewportGroup.getBBox() : { x: 0, y: 0, width: 800, height: 600 };
    const padding = 100;
    const width = Math.max(800, bbox.width + padding * 2);
    const height = Math.max(600, bbox.height + padding * 2);
    const minX = bbox.width > 0 ? bbox.x - padding : 0;
    const minY = bbox.height > 0 ? bbox.y - padding : 0;

    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);

    // Resetar transform de pan/zoom no clone
    const cloneViewport = clone.querySelector('#viewport-group');
    if (cloneViewport) {
      cloneViewport.setAttribute('transform', 'translate(0, 0) scale(1)');
    }

    // Remover seleção e bordas temporárias do clone
    clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

    // Remover grade de fundo se existir
    const grid = clone.querySelector('#grid-pattern');
    if (grid) grid.parentNode.removeChild(grid);
    const gridRect = clone.querySelector('[fill*="grid"]');
    if (gridRect) gridRect.parentNode.removeChild(gridRect);

    // Injetar estilos Peter Chen formais
    const styleElement = document.createElement('style');
    styleElement.textContent = this.getChenStylesheet();
    clone.prepend(styleElement);

    // Adicionar fundo branco puro
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', minX);
    bg.setAttribute('y', minY);
    bg.setAttribute('width', width);
    bg.setAttribute('height', height);
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.children[1]);

    return { clone, width, height, minX, minY };
  }

  // --- EXPORTAR SVG (PRETO E BRANCO — NOTAÇÃO PETER CHEN) ---
  exportSVG(filename = 'diagrama_der.svg') {
    const result = this.prepareExportClone();
    if (!result) return;

    const svgData = new XMLSerializer().serializeToString(result.clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  // --- EXPORTAR PNG (PRETO E BRANCO — NOTAÇÃO PETER CHEN, ULTRA ALTA RESOLUÇÃO 4X) ---
  exportPNG(filename = 'diagrama_der.png') {
    const result = this.prepareExportClone();
    if (!result) return;

    const { clone, width, height } = result;
    const scale = 4; // Ultra alta definição para publicação (4x = ~300 DPI)

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL_API = window.URL || window.webkitURL || window;
    const blobURL = URL_API.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      // Suavização e alta qualidade de renderização
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      // Fundo branco puro
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          this.downloadBlob(blob, filename);
        }
        URL_API.revokeObjectURL(blobURL);
      }, 'image/png');
    };

    image.src = blobURL;
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
