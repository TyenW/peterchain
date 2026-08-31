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
      .subset-symbol { stroke: #000000; stroke-width: 2px; stroke-linecap: round; fill: none; }
      .defining-attribute-label { font-family: 'Times New Roman', Times, serif; font-size: 11px; font-style: italic; fill: #000000; }
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
      .subset-symbol { stroke: #9333ea; stroke-width: 2.2px; stroke-linecap: round; fill: none; }
      .defining-attribute-label { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; font-style: italic; fill: #7e22ce; }
    `;
  }

  // --- OBTER CONTAGEM DE ELEMENTOS ATIVOS PARA CÁLCULO DE ALTURA ---
  getActiveLegendItemCount() {
    let count = 0;
    if (this.model.entities.some(e => !e.isWeak)) count++;
    if (this.model.entities.some(e => e.isWeak)) count++;
    if (this.model.relationships.some(r => !r.isWeak)) count++;
    if (this.model.relationships.some(r => r.isWeak)) count++;
    if (this.model.connections.some(c => !c.isTotal)) count++;
    if (this.model.connections.some(c => c.isTotal)) count++;

    if (this.model.attributes.some(a => !a.isKey && !a.isPartialKey && !a.isMultivalued && !a.isDerived)) count++;
    if (this.model.attributes.some(a => a.isKey)) count++;
    if (this.model.attributes.some(a => a.isPartialKey)) count++;
    if (this.model.attributes.some(a => a.isMultivalued)) count++;
    if (this.model.attributes.some(a => a.isDerived)) count++;
    if (this.model.attributes.some(a => a.parentId && this.model.attributes.some(p => p.id === a.parentId))) count++;

    if (this.model.connections.some(c => (c.cardinalitySource || c.cardinalityTarget || '').trim() !== '')) count++;
    if (this.model.specializations.length > 0) count++;
    return count;
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

    const activeItemCount = addLegend ? this.getActiveLegendItemCount() : 0;
    const cols = Math.min(4, Math.max(2, Math.ceil(activeItemCount / 2)));
    const rows = Math.ceil(activeItemCount / cols);
    const legendExtraHeight = addLegend && activeItemCount > 0 ? (45 + rows * 32) : 0;
    
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

    // Injetar Título no topo do Canvas Exportado: "DER [Nome do Projeto]"
    const rawProjName = (document.getElementById('project-title-input')?.value || 'Projeto').trim();
    const formattedTitle = rawProjName.toUpperCase().startsWith('DER') ? rawProjName : `DER ${rawProjName}`;

    if (cloneViewport) {
      const headerTitleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      headerTitleGroup.setAttribute('id', 'export-header-title');

      const titleBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      titleBg.setAttribute('x', minX + 20);
      titleBg.setAttribute('y', minY + 15);
      titleBg.setAttribute('width', Math.min(width - 40, formattedTitle.length * 11 + 32));
      titleBg.setAttribute('height', 34);
      titleBg.setAttribute('rx', 6);
      titleBg.setAttribute('fill', isColored ? '#0284c7' : '#000000');
      headerTitleGroup.appendChild(titleBg);

      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', minX + 32);
      titleText.setAttribute('y', minY + 37);
      titleText.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      titleText.setAttribute('font-size', '15');
      titleText.setAttribute('font-weight', '800');
      titleText.setAttribute('letter-spacing', '0.5px');
      titleText.setAttribute('fill', '#ffffff');
      titleText.textContent = formattedTitle;
      headerTitleGroup.appendChild(titleText);

      cloneViewport.appendChild(headerTitleGroup);
    }

    // Adicionar Legenda Responsiva & Dinâmica se solicitado
    if (addLegend && activeItemCount > 0 && cloneViewport) {
      const legendX = minX + Math.max(20, (width - (cols * 205 + 30)) / 2);
      const legendY = minY + height - legendExtraHeight - 10;
      const legendGroup = this.createLegendGroup(legendX, legendY, isColored, cols, rows);
      cloneViewport.appendChild(legendGroup);
    }

    return { clone, width, height, minX, minY };
  }

  // --- GERAR GRUPO DE LEGENDA DIDÁTICA (APENAS ELEMENTOS PRESENTES NO DIAGRAMA) ---
  createLegendGroup(x, y, isColored, cols, rows) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'export-legend');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const activeItems = [];

    const hasStrongEntity = this.model.entities.some(e => !e.isWeak);
    const hasWeakEntity = this.model.entities.some(e => e.isWeak);
    const hasRel = this.model.relationships.some(r => !r.isWeak);
    const hasWeakRel = this.model.relationships.some(r => r.isWeak);
    const hasTotalConn = this.model.connections.some(c => c.isTotal);
    const hasPartialConn = this.model.connections.some(c => !c.isTotal);

    const hasSimpleAttr = this.model.attributes.some(a => !a.isKey && !a.isPartialKey && !a.isMultivalued && !a.isDerived);
    const hasKeyAttr = this.model.attributes.some(a => a.isKey);
    const hasPartialKeyAttr = this.model.attributes.some(a => a.isPartialKey);
    const hasMultiAttr = this.model.attributes.some(a => a.isMultivalued);
    const hasDerivedAttr = this.model.attributes.some(a => a.isDerived);
    const hasCompositeAttr = this.model.attributes.some(a => a.parentId && this.model.attributes.some(p => p.id === a.parentId));

    const hasCardinality = this.model.connections.some(c => (c.cardinalitySource || c.cardinalityTarget || '').trim() !== '');
    const hasSpecialization = this.model.specializations.length > 0;

    if (hasStrongEntity) activeItems.push({ type: 'rect', fill: isColored ? '#eff6ff' : '#ffffff', stroke: isColored ? '#0284c7' : '#000000', label: 'Entidade Forte' });
    if (hasWeakEntity) activeItems.push({ type: 'weak-rect', fill: isColored ? '#f5f3ff' : '#ffffff', stroke: isColored ? '#7c3aed' : '#000000', label: 'Entidade Fraca' });
    if (hasRel) activeItems.push({ type: 'poly', fill: isColored ? '#ecfdf5' : '#ffffff', stroke: isColored ? '#059669' : '#000000', label: 'Relacionamento' });
    if (hasWeakRel) activeItems.push({ type: 'weak-poly', fill: isColored ? '#fffbeb' : '#ffffff', stroke: isColored ? '#d97706' : '#000000', label: 'Relacionamento Fraco' });
    if (hasPartialConn) activeItems.push({ type: 'single-line', color: isColored ? '#64748b' : '#000000', label: 'Participação Parcial' });
    if (hasTotalConn) activeItems.push({ type: 'double-line', color: isColored ? '#2563eb' : '#000000', label: 'Participação Total' });

    if (hasSimpleAttr) activeItems.push({ type: 'ellipse', fill: isColored ? '#ffffff' : '#ffffff', stroke: isColored ? '#475569' : '#000000', label: 'Atributo Simples' });
    if (hasKeyAttr) activeItems.push({ type: 'ellipse', fill: isColored ? '#fefce8' : '#ffffff', stroke: isColored ? '#ca8a04' : '#000000', label: 'Chave Primária', u: true });
    if (hasPartialKeyAttr) activeItems.push({ type: 'ellipse', fill: isColored ? '#fff7ed' : '#ffffff', stroke: isColored ? '#ea580c' : '#000000', label: 'Chave Parcial', uDotted: true });
    if (hasMultiAttr) activeItems.push({ type: 'multi-ellipse', fill: isColored ? '#f0fdf4' : '#ffffff', stroke: isColored ? '#0d9488' : '#000000', label: 'Atributo Multivalorado' });
    if (hasDerivedAttr) activeItems.push({ type: 'deriv-ellipse', fill: isColored ? '#fff1f2' : '#ffffff', stroke: isColored ? '#e11d48' : '#000000', label: 'Atributo Derivado' });
    if (hasCompositeAttr) activeItems.push({ type: 'composite-attribute', label: 'Atributo Composto' });

    if (hasCardinality) activeItems.push({ type: 'cardinality', label: 'Cardinalidade (1 / N)' });
    if (hasSpecialization) activeItems.push({ type: 'specialization', label: 'Especialização (d/o/u)' });

    if (activeItems.length === 0) return g;

    const colWidth = 205;
    const boxW = Math.max(420, cols * colWidth + 20);
    const rowHeight = 32;
    const boxH = 35 + rows * rowHeight + 10;

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
    title.textContent = 'LEGENDA DO DIAGRAMA (ELEMENTOS PRESENTES)';
    g.appendChild(title);

    activeItems.forEach((it, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const startX = 15 + col * colWidth;
      const startY = 32 + row * rowHeight;

      if (it.type === 'rect') {
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', startX); r.setAttribute('y', startY); r.setAttribute('width', 22); r.setAttribute('height', 14);
        r.setAttribute('fill', it.fill); r.setAttribute('stroke', it.stroke); r.setAttribute('stroke-width', '1.5'); r.setAttribute('rx', 2);
        g.appendChild(r);
      } else if (it.type === 'weak-rect') {
        const r1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r1.setAttribute('x', startX); r1.setAttribute('y', startY); r1.setAttribute('width', 22); r1.setAttribute('height', 14);
        r1.setAttribute('fill', it.fill); r1.setAttribute('stroke', it.stroke); r1.setAttribute('stroke-width', '1.5'); r1.setAttribute('rx', 2);
        g.appendChild(r1);
        const r2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r2.setAttribute('x', startX + 2); r2.setAttribute('y', startY + 2); r2.setAttribute('width', 18); r2.setAttribute('height', 10);
        r2.setAttribute('fill', 'none'); r2.setAttribute('stroke', it.stroke); r2.setAttribute('stroke-width', '1'); r2.setAttribute('rx', 1);
        g.appendChild(r2);
      } else if (it.type === 'poly') {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        p.setAttribute('points', `${startX},${startY+7} ${startX+11},${startY} ${startX+22},${startY+7} ${startX+11},${startY+14}`);
        p.setAttribute('fill', it.fill); p.setAttribute('stroke', it.stroke); p.setAttribute('stroke-width', '1.5');
        g.appendChild(p);
      } else if (it.type === 'weak-poly') {
        const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        p1.setAttribute('points', `${startX},${startY+7} ${startX+11},${startY} ${startX+22},${startY+7} ${startX+11},${startY+14}`);
        p1.setAttribute('fill', it.fill); p1.setAttribute('stroke', it.stroke); p1.setAttribute('stroke-width', '1.5');
        g.appendChild(p1);
        const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        p2.setAttribute('points', `${startX+3},${startY+7} ${startX+11},${startY+2} ${startX+19},${startY+7} ${startX+11},${startY+12}`);
        p2.setAttribute('fill', 'none'); p2.setAttribute('stroke', it.stroke); p2.setAttribute('stroke-width', '1');
        g.appendChild(p2);
      } else if (it.type === 'single-line') {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', startX); l.setAttribute('y1', startY + 7);
        l.setAttribute('x2', startX + 22); l.setAttribute('y2', startY + 7);
        l.setAttribute('stroke', it.color); l.setAttribute('stroke-width', '1.5');
        g.appendChild(l);
      } else if (it.type === 'double-line') {
        const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l1.setAttribute('x1', startX); l1.setAttribute('y1', startY + 5); l1.setAttribute('x2', startX + 22); l1.setAttribute('y2', startY + 5);
        l1.setAttribute('stroke', it.color); l1.setAttribute('stroke-width', '1.5');
        g.appendChild(l1);
        const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l2.setAttribute('x1', startX); l2.setAttribute('y1', startY + 9); l2.setAttribute('x2', startX + 22); l2.setAttribute('y2', startY + 9);
        l2.setAttribute('stroke', it.color); l2.setAttribute('stroke-width', '1.5');
        g.appendChild(l2);
      } else if (it.type === 'ellipse') {
        const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e.setAttribute('cx', startX + 11); e.setAttribute('cy', startY + 7); e.setAttribute('rx', 11); e.setAttribute('ry', 7);
        e.setAttribute('fill', it.fill); e.setAttribute('stroke', it.stroke); e.setAttribute('stroke-width', '1.5');
        g.appendChild(e);
      } else if (it.type === 'multi-ellipse') {
        const e1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e1.setAttribute('cx', startX + 11); e1.setAttribute('cy', startY + 7); e1.setAttribute('rx', 11); e1.setAttribute('ry', 7);
        e1.setAttribute('fill', it.fill); e1.setAttribute('stroke', it.stroke); e1.setAttribute('stroke-width', '1.5');
        g.appendChild(e1);
        const e2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e2.setAttribute('cx', startX + 11); e2.setAttribute('cy', startY + 7); e2.setAttribute('rx', 8); e2.setAttribute('ry', 5);
        e2.setAttribute('fill', 'none'); e2.setAttribute('stroke', it.stroke); e2.setAttribute('stroke-width', '1');
        g.appendChild(e2);
      } else if (it.type === 'deriv-ellipse') {
        const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e.setAttribute('cx', startX + 11); e.setAttribute('cy', startY + 7); e.setAttribute('rx', 11); e.setAttribute('ry', 7);
        e.setAttribute('fill', it.fill); e.setAttribute('stroke', it.stroke); e.setAttribute('stroke-width', '1.5'); e.setAttribute('stroke-dasharray', '3 2');
        g.appendChild(e);
      } else if (it.type === 'composite-attribute') {
        const pE = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        pE.setAttribute('cx', startX + 11); pE.setAttribute('cy', startY + 3); pE.setAttribute('rx', 6); pE.setAttribute('ry', 3);
        pE.setAttribute('fill', isColored ? '#f8fafc' : '#ffffff'); pE.setAttribute('stroke', isColored ? '#475569' : '#000000'); pE.setAttribute('stroke-width', '1.2');
        g.appendChild(pE);

        const b1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        b1.setAttribute('x1', startX + 7); b1.setAttribute('y1', startY + 6); b1.setAttribute('x2', startX + 4); b1.setAttribute('y2', startY + 11);
        b1.setAttribute('stroke', isColored ? '#475569' : '#000000'); b1.setAttribute('stroke-width', '1');
        g.appendChild(b1);

        const b2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        b2.setAttribute('x1', startX + 15); b2.setAttribute('y1', startY + 6); b2.setAttribute('x2', startX + 18); b2.setAttribute('y2', startY + 11);
        b2.setAttribute('stroke', isColored ? '#475569' : '#000000'); b2.setAttribute('stroke-width', '1');
        g.appendChild(b2);
      } else if (it.type === 'cardinality') {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', startX); l.setAttribute('y1', startY + 7); l.setAttribute('x2', startX + 22); l.setAttribute('y2', startY + 7);
        l.setAttribute('stroke', isColored ? '#64748b' : '#000000'); l.setAttribute('stroke-width', '1.5');
        g.appendChild(l);

        const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t1.setAttribute('x', startX + 3); t1.setAttribute('y', startY + 3);
        t1.setAttribute('font-family', 'Inter, system-ui, sans-serif'); t1.setAttribute('font-size', '9');
        t1.setAttribute('font-weight', 'bold'); t1.setAttribute('fill', isColored ? '#2563eb' : '#000000');
        t1.textContent = '1';
        g.appendChild(t1);

        const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t2.setAttribute('x', startX + 16); t2.setAttribute('y', startY + 3);
        t2.setAttribute('font-family', 'Inter, system-ui, sans-serif'); t2.setAttribute('font-size', '9');
        t2.setAttribute('font-weight', 'bold'); t2.setAttribute('fill', isColored ? '#2563eb' : '#000000');
        t2.textContent = 'N';
        g.appendChild(t2);
      } else if (it.type === 'specialization') {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', startX + 11); c.setAttribute('cy', startY + 7); c.setAttribute('r', 6);
        c.setAttribute('fill', isColored ? '#faf5ff' : '#ffffff'); c.setAttribute('stroke', isColored ? '#9333ea' : '#000000'); c.setAttribute('stroke-width', '1.5');
        g.appendChild(c);

        const st = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        st.setAttribute('x', startX + 11); st.setAttribute('y', startY + 7);
        st.setAttribute('font-family', 'Inter, system-ui, sans-serif'); st.setAttribute('font-size', '8');
        st.setAttribute('font-weight', 'bold'); st.setAttribute('fill', isColored ? '#6b21a8' : '#000000');
        st.setAttribute('text-anchor', 'middle'); st.setAttribute('dominant-baseline', 'central');
        st.textContent = 'd';
        g.appendChild(st);
      }

      // Rótulo do item
      if (it.label) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', startX + 28); txt.setAttribute('y', startY + 11);
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
    const scale = 3; // Alta definição (3x = ~300 DPI)

    const svgData = new XMLSerializer().serializeToString(clone);
    const encodedSvgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

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

      try {
        canvas.toBlob((blob) => {
          if (blob) {
            this.downloadBlob(blob, filename);
            if (window.showToast) window.showToast(`Imagem ${filename} exportada com sucesso!`, 'success');
          } else {
            if (window.showToast) window.showToast('Não foi possível gerar a imagem PNG.', 'error');
          }
        }, 'image/png');
      } catch (e) {
        console.error('[StorageExportManager] Erro toBlob:', e);
        if (window.showToast) window.showToast('Erro ao processar imagem PNG.', 'error');
      }
    };

    image.onerror = (err) => {
      console.error('[StorageExportManager] Erro ao carregar SVG:', err);
      if (window.showToast) window.showToast('Erro ao carregar o diagrama para PNG. Tente exportar em SVG.', 'error');
    };

    image.src = encodedSvgData;
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
