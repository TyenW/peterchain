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
      .connection-line { fill: none; stroke: #000000; stroke-width: 1.5px; stroke-linecap: round; stroke-linejoin: round; }
      .connection-line.total { stroke: #000000; stroke-width: 1.5px; }
      .cardinality-bg { fill: #ffffff; stroke: #000000; stroke-width: 1px; rx: 3px; }
      .cardinality-badge { font-family: 'Times New Roman', Times, serif; font-size: 13px; font-weight: 700; fill: #000000; text-anchor: middle; dominant-baseline: central; }
      .role-text { font-family: 'Times New Roman', Times, serif; font-size: 12px; font-weight: 600; fill: #000000; text-anchor: middle; }
    `;
  }

  // --- ESTILOS COLORIDOS DIDÁTICOS DE ALTA PERFORMANCE ---
  getColoredChenStylesheet() {
    return `
      .entity-rect { fill: #eff6ff; stroke: #0284c7; stroke-width: 2px; rx: 4px; }
      .entity-rect.inner { fill: none; stroke: #0284c7; stroke-width: 1.5px; rx: 2px; }
      .entity-rect.weak-entity { fill: #f5f3ff; stroke: #7c3aed; stroke-width: 2px; }
      .entity-rect.inner.weak-entity { stroke: #a855f7; }
      
      .attribute-ellipse { fill: #ffffff; stroke: #475569; stroke-width: 1.5px; }
      .attribute-ellipse.key-attribute { fill: #fefce8; stroke: #ca8a04; stroke-width: 2px; }
      .attribute-ellipse.key-partial-attribute { fill: #fff7ed; stroke: #ea580c; stroke-width: 2px; }
      .attribute-ellipse.inner { fill: none; stroke: #0d9488; stroke-width: 1.2px; }
      .attribute-ellipse.multivalued { fill: #f0fdf4; stroke: #0d9488; stroke-width: 2px; }
      .attribute-ellipse.derived { fill: #fff1f2; stroke: #e11d48; stroke-width: 1.5px; stroke-dasharray: 5 3; }
      
      .relationship-polygon { fill: #ecfdf5; stroke: #059669; stroke-width: 2px; }
      .relationship-polygon.inner { fill: none; stroke: #059669; stroke-width: 1.5px; }
      .relationship-polygon.weak-relationship { fill: #fffbeb; stroke: #d97706; stroke-width: 2px; }
      .relationship-polygon.inner.weak-relationship { stroke: #f59e0b; }
      
      .specialization-circle { fill: #faf5ff; stroke: #9333ea; stroke-width: 2px; }
      .specialization-text { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 700; fill: #6b21a8; text-anchor: middle; dominant-baseline: central; }
      
      .element-text { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; fill: #1e293b; text-anchor: middle; dominant-baseline: central; }
      .entity-text { font-weight: 700; font-size: 14px; fill: #0369a1; letter-spacing: 0.5px; }
      .entity-text.weak-entity { fill: #5b21b6; }
      .relationship-text { font-weight: 700; font-size: 13px; fill: #047857; letter-spacing: 0.5px; }
      .relationship-text.weak-relationship { fill: #b45309; }
      
      .attribute-text.key-attribute { text-decoration: underline; font-weight: 700; fill: #854d0e; }
      .attribute-text.key-partial-attribute { text-decoration: underline dotted; font-weight: 600; fill: #c2410c; }
      
      .connection-line { fill: none; stroke: #64748b; stroke-width: 1.8px; stroke-linecap: round; stroke-linejoin: round; }
      .connection-line.total { stroke: #2563eb; stroke-width: 2px; }
      
      .cardinality-bg { fill: #ffffff; stroke: #cbd5e1; stroke-width: 1px; rx: 4px; }
      .cardinality-badge { font-family: 'Inter', system-ui, sans-serif; font-size: 12px; font-weight: 700; fill: #0f172a; text-anchor: middle; dominant-baseline: central; }
      .role-text { font-family: 'Inter', system-ui, sans-serif; font-size: 12px; font-weight: 600; fill: #475569; text-anchor: middle; }
    `;
  }

  // --- PREPARAR CLONE SVG LIMPO PARA EXPORTAÇÃO ---
  prepareExportClone(opts = {}) {
    const isColored = Boolean(opts.isColored);
    const addLegend = Boolean(opts.addLegend);

    const svgElement = document.getElementById('der-svg-canvas') || document.getElementById('der-canvas');
    if (!svgElement) return null;

    const viewportGroup = document.getElementById('viewport-group');
    const bbox = viewportGroup ? viewportGroup.getBBox() : { x: 0, y: 0, width: 800, height: 600 };
    const padding = 80;
    const legendExtraHeight = addLegend ? 165 : 0;
    
    const width = Math.max(900, bbox.width + padding * 2);
    const height = Math.max(600, bbox.height + padding * 2 + legendExtraHeight);
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

    // Injetar estilos (Coloridos ou P&B)
    const styleElement = document.createElement('style');
    styleElement.textContent = isColored ? this.getColoredChenStylesheet() : this.getChenStylesheet();
    clone.prepend(styleElement);

    // Adicionar fundo branco puro
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', minX);
    bg.setAttribute('y', minY);
    bg.setAttribute('width', width);
    bg.setAttribute('height', height);
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.children[1]);

    // Adicionar Legenda se solicitado
    if (addLegend && cloneViewport) {
      const legendX = minX + Math.max(20, (width - 860) / 2);
      const legendY = minY + height - legendExtraHeight - 10;
      const legendGroup = this.createLegendGroup(legendX, legendY, isColored);
      cloneViewport.appendChild(legendGroup);
    }

    return { clone, width, height, minX, minY };
  }

  // --- GERAR GRUPO DE LEGENDA DIDÁTICA ---
  createLegendGroup(x, y, isColored) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'export-legend');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const boxW = 860;
    const boxH = 140;

    // Fundo do Card da Legenda
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    box.setAttribute('x', 0);
    box.setAttribute('y', 0);
    box.setAttribute('width', boxW);
    box.setAttribute('height', boxH);
    box.setAttribute('rx', 8);
    box.setAttribute('fill', '#ffffff');
    box.setAttribute('stroke', isColored ? '#cbd5e1' : '#000000');
    box.setAttribute('stroke-width', '1.5');
    g.appendChild(box);

    // Título da Legenda
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', 15);
    title.setAttribute('y', 20);
    title.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    title.setAttribute('font-size', '12');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', isColored ? '#1e293b' : '#000000');
    title.textContent = 'LEGENDA DO DIAGRAMA (NOTAÇÃO PETER CHEN)';
    g.appendChild(title);

    // Items
    const items = [
      // Linha 1: Entidades & Conexões
      { type: 'rect', x: 15, y: 31, w: 22, h: 14, fill: isColored ? '#eff6ff' : '#f4f4f5', stroke: isColored ? '#0284c7' : '#000000', label: 'Entidade Forte', lx: 43, ly: 42 },
      { type: 'weak-rect', x: 145, y: 31, w: 22, h: 14, fill: isColored ? '#f5f3ff' : '#f4f4f5', stroke: isColored ? '#7c3aed' : '#000000', label: 'Entidade Fraca', lx: 173, ly: 42 },
      { type: 'poly', pts: '275,38 286,31 297,38 286,45', fill: isColored ? '#ecfdf5' : '#e4e4e7', stroke: isColored ? '#059669' : '#000000', label: 'Relacionamento', lx: 303, ly: 42 },
      { type: 'weak-poly', pts: '410,38 421,31 432,38 421,45', fill: isColored ? '#fffbeb' : '#e4e4e7', stroke: isColored ? '#d97706' : '#000000', label: 'Relac. Fraco', lx: 438, ly: 42 },
      { type: 'single-line', x1: 535, y1: 38, x2: 557, y2: 38, color: isColored ? '#64748b' : '#000000', label: 'Participação Parcial', lx: 563, ly: 42 },
      { type: 'double-line', x1: 695, y1: 38, x2: 717, y2: 38, color: isColored ? '#2563eb' : '#000000', label: 'Participação Total', lx: 723, ly: 42 },

      // Linha 2: Tipos de Atributos & Chaves
      { type: 'ellipse', cx: 26, cy: 74, rx: 11, ry: 7, fill: isColored ? '#ffffff' : '#ffffff', stroke: isColored ? '#475569' : '#000000', label: 'Atributo Simples', lx: 43, ly: 77 },
      { type: 'ellipse', cx: 156, cy: 74, rx: 11, ry: 7, fill: isColored ? '#fefce8' : '#ffffff', stroke: isColored ? '#ca8a04' : '#000000', label: 'Chave Primária', lx: 173, ly: 77, u: true },
      { type: 'ellipse', cx: 286, cy: 74, rx: 11, ry: 7, fill: isColored ? '#fff7ed' : '#ffffff', stroke: isColored ? '#ea580c' : '#000000', label: 'Chave Parcial', lx: 303, ly: 77, uDotted: true },
      { type: 'multi-ellipse', cx: 416, cy: 74, rx: 11, ry: 7, fill: isColored ? '#f0fdf4' : '#ffffff', stroke: isColored ? '#0d9488' : '#000000', label: 'Multivalorado', lx: 433, ly: 77 },
      { type: 'deriv-ellipse', cx: 535, cy: 74, rx: 11, ry: 7, fill: isColored ? '#fff1f2' : '#ffffff', stroke: isColored ? '#e11d48' : '#000000', label: 'Derivado', lx: 552, ly: 77 },
      { type: 'composite-attribute', lx: 716, ly: 77, label: 'Atributo Composto' },

      // Linha 3: Cardinalidades & Notação
      { type: 'cardinality', lx: 48, ly: 113, label: 'Cardinalidade (ex: 1, N, 0..N)' },
      { type: 'specialization', cx: 250, cy: 110, lx: 263, ly: 113, label: 'Especialização (d/o)' },
      { type: 'notation-note', x: 410, y: 113 }
    ];

    items.forEach(it => {
      if (it.type === 'rect') {
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', it.x); r.setAttribute('y', it.y); r.setAttribute('width', it.w); r.setAttribute('height', it.h);
        r.setAttribute('fill', it.fill); r.setAttribute('stroke', it.stroke); r.setAttribute('stroke-width', '1.5'); r.setAttribute('rx', 2);
        g.appendChild(r);
      } else if (it.type === 'weak-rect') {
        const r1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r1.setAttribute('x', it.x); r1.setAttribute('y', it.y); r1.setAttribute('width', it.w); r1.setAttribute('height', it.h);
        r1.setAttribute('fill', it.fill); r1.setAttribute('stroke', it.stroke); r1.setAttribute('stroke-width', '1.5'); r1.setAttribute('rx', 2);
        g.appendChild(r1);
        const r2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r2.setAttribute('x', it.x + 2); r2.setAttribute('y', it.y + 2); r2.setAttribute('width', it.w - 4); r2.setAttribute('height', it.h - 4);
        r2.setAttribute('fill', 'none'); r2.setAttribute('stroke', it.stroke); r2.setAttribute('stroke-width', '1'); r2.setAttribute('rx', 1);
        g.appendChild(r2);
      } else if (it.type === 'poly') {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        p.setAttribute('points', it.pts); p.setAttribute('fill', it.fill); p.setAttribute('stroke', it.stroke); p.setAttribute('stroke-width', '1.5');
        g.appendChild(p);
      } else if (it.type === 'weak-poly') {
        const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        p1.setAttribute('points', it.pts); p1.setAttribute('fill', it.fill); p1.setAttribute('stroke', it.stroke); p1.setAttribute('stroke-width', '1.5');
        g.appendChild(p1);
        const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        p2.setAttribute('points', '413,38 421,33 429,38 421,43'); p2.setAttribute('fill', 'none'); p2.setAttribute('stroke', it.stroke); p2.setAttribute('stroke-width', '1');
        g.appendChild(p2);
      } else if (it.type === 'single-line') {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', it.x1); l.setAttribute('y1', it.y1);
        l.setAttribute('x2', it.x2); l.setAttribute('y2', it.y2);
        l.setAttribute('stroke', it.color); l.setAttribute('stroke-width', '1.5');
        g.appendChild(l);
      } else if (it.type === 'double-line') {
        const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l1.setAttribute('x1', it.x1); l1.setAttribute('y1', it.y1 - 2); l1.setAttribute('x2', it.x2); l1.setAttribute('y2', it.y2 - 2);
        l1.setAttribute('stroke', it.color); l1.setAttribute('stroke-width', '1.5');
        g.appendChild(l1);
        const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l2.setAttribute('x1', it.x1); l2.setAttribute('y1', it.y1 + 2); l2.setAttribute('x2', it.x2); l2.setAttribute('y2', it.y2 + 2);
        l2.setAttribute('stroke', it.color); l2.setAttribute('stroke-width', '1.5');
        g.appendChild(l2);
      } else if (it.type === 'ellipse') {
        const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e.setAttribute('cx', it.cx); e.setAttribute('cy', it.cy); e.setAttribute('rx', it.rx); e.setAttribute('ry', it.ry);
        e.setAttribute('fill', it.fill); e.setAttribute('stroke', it.stroke); e.setAttribute('stroke-width', '1.5');
        g.appendChild(e);
      } else if (it.type === 'multi-ellipse') {
        const e1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e1.setAttribute('cx', it.cx); e1.setAttribute('cy', it.cy); e1.setAttribute('rx', it.rx); e1.setAttribute('ry', it.ry);
        e1.setAttribute('fill', it.fill); e1.setAttribute('stroke', it.stroke); e1.setAttribute('stroke-width', '1.5');
        g.appendChild(e1);
        const e2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e2.setAttribute('cx', it.cx); e2.setAttribute('cy', it.cy); e2.setAttribute('rx', it.rx - 3); e2.setAttribute('ry', it.ry - 2);
        e2.setAttribute('fill', 'none'); e2.setAttribute('stroke', it.stroke); e2.setAttribute('stroke-width', '1');
        g.appendChild(e2);
      } else if (it.type === 'deriv-ellipse') {
        const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e.setAttribute('cx', it.cx); e.setAttribute('cy', it.cy); e.setAttribute('rx', it.rx); e.setAttribute('ry', it.ry);
        e.setAttribute('fill', it.fill); e.setAttribute('stroke', it.stroke); e.setAttribute('stroke-width', '1.5'); e.setAttribute('stroke-dasharray', '3 2');
        g.appendChild(e);
      } else if (it.type === 'composite-attribute') {
        const pE = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        pE.setAttribute('cx', 695); pE.setAttribute('cy', 69); pE.setAttribute('rx', 7); pE.setAttribute('ry', 4);
        pE.setAttribute('fill', isColored ? '#f8fafc' : '#ffffff'); pE.setAttribute('stroke', isColored ? '#475569' : '#000000'); pE.setAttribute('stroke-width', '1.2');
        g.appendChild(pE);

        const b1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        b1.setAttribute('x1', 691); b1.setAttribute('y1', 72); b1.setAttribute('x2', 687); b1.setAttribute('y2', 77);
        b1.setAttribute('stroke', isColored ? '#475569' : '#000000'); b1.setAttribute('stroke-width', '1');
        g.appendChild(b1);

        const b2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        b2.setAttribute('x1', 699); b2.setAttribute('y1', 72); b2.setAttribute('x2', 703); b2.setAttribute('y2', 77);
        b2.setAttribute('stroke', isColored ? '#475569' : '#000000'); b2.setAttribute('stroke-width', '1');
        g.appendChild(b2);

        const cE1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        cE1.setAttribute('cx', 686); cE1.setAttribute('cy', 79); cE1.setAttribute('rx', 5); cE1.setAttribute('ry', 3);
        cE1.setAttribute('fill', isColored ? '#ffffff' : '#ffffff'); cE1.setAttribute('stroke', isColored ? '#475569' : '#000000'); cE1.setAttribute('stroke-width', '1');
        g.appendChild(cE1);

        const cE2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        cE2.setAttribute('cx', 704); cE2.setAttribute('cy', 79); cE2.setAttribute('rx', 5); cE2.setAttribute('ry', 3);
        cE2.setAttribute('fill', isColored ? '#ffffff' : '#ffffff'); cE2.setAttribute('stroke', isColored ? '#475569' : '#000000'); cE2.setAttribute('stroke-width', '1');
        g.appendChild(cE2);
      } else if (it.type === 'cardinality') {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', 15); l.setAttribute('y1', 110); l.setAttribute('x2', 38); l.setAttribute('y2', 110);
        l.setAttribute('stroke', isColored ? '#64748b' : '#000000'); l.setAttribute('stroke-width', '1.5');
        g.appendChild(l);

        const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t1.setAttribute('x', 17); t1.setAttribute('y', 105);
        t1.setAttribute('font-family', 'Inter, system-ui, sans-serif'); t1.setAttribute('font-size', '9');
        t1.setAttribute('font-weight', 'bold'); t1.setAttribute('fill', isColored ? '#2563eb' : '#000000');
        t1.textContent = '1';
        g.appendChild(t1);

        const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t2.setAttribute('x', 33); t2.setAttribute('y', 105);
        t2.setAttribute('font-family', 'Inter, system-ui, sans-serif'); t2.setAttribute('font-size', '9');
        t2.setAttribute('font-weight', 'bold'); t2.setAttribute('fill', isColored ? '#2563eb' : '#000000');
        t2.textContent = 'N';
        g.appendChild(t2);
      } else if (it.type === 'specialization') {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', it.cx); c.setAttribute('cy', it.cy); c.setAttribute('r', 7);
        c.setAttribute('fill', isColored ? '#faf5ff' : '#ffffff'); c.setAttribute('stroke', isColored ? '#9333ea' : '#000000'); c.setAttribute('stroke-width', '1.5');
        g.appendChild(c);

        const st = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        st.setAttribute('x', it.cx); st.setAttribute('y', it.cy);
        st.setAttribute('font-family', 'Inter, system-ui, sans-serif'); st.setAttribute('font-size', '9');
        st.setAttribute('font-weight', 'bold'); st.setAttribute('fill', isColored ? '#6b21a8' : '#000000');
        st.setAttribute('text-anchor', 'middle'); st.setAttribute('dominant-baseline', 'central');
        st.textContent = 'd';
        g.appendChild(st);
      } else if (it.type === 'notation-note') {
        const note = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        note.setAttribute('x', it.x); note.setAttribute('y', it.y);
        note.setAttribute('font-family', 'Inter, system-ui, sans-serif');
        note.setAttribute('font-size', '10');
        note.setAttribute('font-style', 'italic');
        note.setAttribute('fill', isColored ? '#64748b' : '#3f3f46');
        note.textContent = '* Regra de Notação: Sublinhado Sólido = Chave Primária | Sublinhado Pontilhado = Chave Parcial (Discriminador)';
        g.appendChild(note);
      }

      // Rótulo de cada item
      if (it.label) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', it.lx); txt.setAttribute('y', it.ly);
        txt.setAttribute('font-family', 'Inter, system-ui, sans-serif'); txt.setAttribute('font-size', '11');
        txt.setAttribute('fill', isColored ? '#334155' : '#000000');
        if (it.u) txt.setAttribute('text-decoration', 'underline');
        if (it.uDotted) txt.setAttribute('style', 'text-decoration: underline dotted; font-weight: 600;');
        txt.textContent = it.label;
        g.appendChild(txt);
      }
    });

    return g;
  }

  // --- EXPORTAR SVG (P&B OU COLORIDO COM LEGENDA) ---
  exportSVG(filename = 'diagrama_der.svg', opts = {}) {
    const result = this.prepareExportClone(opts);
    if (!result) return;

    const svgData = new XMLSerializer().serializeToString(result.clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  // --- EXPORTAR PNG (P&B OU COLORIDO COM LEGENDA — ULTRA ALTA RESOLUÇÃO 4X) ---
  exportPNG(filename = 'diagrama_der.png', opts = {}) {
    const result = this.prepareExportClone(opts);
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
