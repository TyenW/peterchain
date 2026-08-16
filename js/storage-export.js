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

  // --- EXPORTAR SVG ---
  exportSVG(filename = 'diagrama_der.svg') {
    const svgElement = document.getElementById('der-canvas');
    if (!svgElement) return;

    // Clonar nó SVG para exportação limpa
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Remover grade de fundo dinâmica se desejar ou manter com estilos explicitados
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .entity-rect { fill: #1e293b; stroke: #38bdf8; stroke-width: 2.5px; rx: 4px; }
      .attribute-ellipse { fill: #0f172a; stroke: #34d399; stroke-width: 2px; }
      .relationship-polygon { fill: #311b92; stroke: #a78bfa; stroke-width: 2.5px; }
      .element-text { font-family: 'Inter', sans-serif; font-size: 13px; fill: #f8fafc; text-anchor: middle; dominant-baseline: central; }
      .entity-text { font-weight: 700; }
      .attribute-text.key-attribute { text-decoration: underline; font-weight: 700; fill: #34d399; }
      .relationship-text { font-weight: 700; fill: #f3e8ff; }
      .connection-line { stroke: #64748b; stroke-width: 2px; }
      .cardinality-badge { font-family: monospace; font-size: 12px; font-weight: 700; fill: #38bdf8; text-anchor: middle; }
    `;
    clone.prepend(styleElement);

    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  // --- EXPORTAR PNG ---
  exportPNG(filename = 'diagrama_der.png') {
    const svgElement = document.getElementById('der-canvas');
    if (!svgElement) return;

    const bbox = document.getElementById('viewport-group').getBBox();
    const padding = 50;
    const width = Math.max(800, bbox.width + padding * 2);
    const height = Math.max(600, bbox.height + padding * 2);

    const clone = svgElement.cloneNode(true);
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // Alta resolução (2x scale)
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);

      // Fundo escuro elegante
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          this.downloadBlob(blob, filename);
        }
        URL.revokeObjectURL(blobURL);
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
