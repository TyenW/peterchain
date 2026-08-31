/**
 * DER Builder — RelationalCanvas (Renderizador Lógico com Modo Automático, Conexão Direta e Desenho Ponto a Ponto estilo Logisim)
 */
class RelationalCanvas {
  constructor(containerId, svgCanvasId) {
    this.container = document.getElementById(containerId);
    this.svgCanvas = document.getElementById(svgCanvasId);
    this.tables = [];
    this.fkReferences = [];
    this.freeformLines = []; // Linhas traçadas ponto a ponto: [{ id, points: [{x,y},...], color }]

    this.mode = 'auto'; // 'auto' | 'manual'
    this.drawSubMode = 'cell'; // 'cell' (Conectar Células) | 'freeline' (Desenho Ponto a Ponto)
    this.activeColor = '#00f0ff';
    this.connectingSource = null;
    this.selectedLineIndex = null;
    this.selectedFreeformIndex = null;

    // Estado do desenho ponto a ponto em andamento
    this.currentWaypoints = [];
    this.previewMousePos = null;

    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startPanX = 0;
    this.startPanY = 0;

    this.onSchemaChange = null;

    this.initZoomAndPan();
    this.initGlobalClickHandlers();
    this.initPointToPointDrawingHandlers();
  }

  setMode(newMode) {
    this.mode = newMode;
    this.connectingSource = null;
    this.currentWaypoints = [];
    this.previewMousePos = null;
    this.selectedLineIndex = null;
    this.selectedFreeformIndex = null;
    this.hidePopover();
    
    if (this.container) {
      if (newMode === 'manual') {
        this.container.classList.add('manual-mode-active');
      } else {
        this.container.classList.remove('manual-mode-active');
      }
    }
    this.render();
  }

  setDrawSubMode(subMode) {
    this.drawSubMode = subMode;
    this.connectingSource = null;
    this.currentWaypoints = [];
    this.previewMousePos = null;
    this.render();
  }

  setActiveColor(colorHex) {
    this.activeColor = colorHex;
  }

  setData(tables, fkReferences) {
    this.tables = tables || [];
    this.fkReferences = fkReferences || [];
    if (this.mode === 'auto') {
      this.autoLayoutTables();
    }
    this.render();
  }

  initGlobalClickHandlers() {
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.line-edit-popover') && !e.target.closest('.fk-arrow-path')) {
        this.hidePopover();
      }
    });

    // Tecla ESC cancela traçado ponto a ponto atual
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.currentWaypoints.length > 0) {
          this.currentWaypoints = [];
          this.previewMousePos = null;
          this.updateDrawingBanner();
          this.render();
        }
      } else if (e.key === 'Enter') {
        // Tecla Enter finaliza o desenho da linha ponto a ponto
        if (this.currentWaypoints.length >= 2) {
          this.finishFreeformLine();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (this.selectedLineIndex !== null) {
          this.deleteFKReference(this.selectedLineIndex);
        } else if (this.selectedFreeformIndex !== null) {
          this.deleteFreeformLine(this.selectedFreeformIndex);
        }
      }
    });
  }

  fitToView() {
    if (!this.tables || this.tables.length === 0) {
      this.resetZoom();
      return;
    }

    const canvasPanel = document.getElementById('canvas-panel');
    if (!canvasPanel) return;
    const viewWidth = canvasPanel.clientWidth || 1000;
    const viewHeight = canvasPanel.clientHeight || 700;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.tables.forEach(tbl => {
      const card = document.getElementById(`tbl-card-${tbl.name}`);
      const width = card ? card.offsetWidth : (tbl.columns ? tbl.columns.length * 90 + 40 : 200);
      const height = card ? card.offsetHeight : 80;
      minX = Math.min(minX, tbl.x || 0);
      minY = Math.min(minY, tbl.y || 0);
      maxX = Math.max(maxX, (tbl.x || 0) + width);
      maxY = Math.max(maxY, (tbl.y || 0) + height);
    });

    if (this.freeformLines) {
      this.freeformLines.forEach(l => {
        if (l.points) {
          l.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        }
      });
    }

    const pad = 70;
    const contentW = Math.max(100, maxX - minX + pad * 2);
    const contentH = Math.max(100, maxY - minY + pad * 2);

    const scaleX = viewWidth / contentW;
    const scaleY = viewHeight / contentH;
    const targetScale = Math.min(1.3, Math.max(0.35, Math.min(scaleX, scaleY)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.scale = targetScale;
    this.panX = viewWidth / 2 - midX * this.scale;
    this.panY = viewHeight / 2 - midY * this.scale;

    this.updateTransform();
    this.renderFKLines();
  }

  // --- NAVEGAÇÃO / ZOOM / PAN ---
  initZoomAndPan() {
    const mainCanvas = document.getElementById('canvas-panel');
    if (!mainCanvas) return;

    mainCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.setScale(this.scale * zoomFactor);
    }, { passive: false });

    mainCanvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.target === this.svgCanvas && this.drawSubMode !== 'freeline')) {
        this.isPanning = true;
        this.startPanX = e.clientX - this.panX;
        this.startPanY = e.clientY - this.panY;
        mainCanvas.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.startPanX;
        this.panY = e.clientY - this.startPanY;
        this.updateTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        if (mainCanvas) mainCanvas.style.cursor = 'default';
      }
    });
  }

  // --- HANDLER DO MODO DESENHO PONTO A PONTO ---
  initPointToPointDrawingHandlers() {
    const mainCanvas = document.getElementById('canvas-panel');
    if (!mainCanvas) return;

    mainCanvas.addEventListener('click', (e) => {
      if (this.mode !== 'manual' || this.drawSubMode !== 'freeline') return;
      if (e.target.closest('.line-edit-popover') || e.target.closest('.tbl-action-btn')) return;

      const canvasArea = document.getElementById('relational-canvas-area');
      if (!canvasArea) return;
      const areaRect = canvasArea.getBoundingClientRect();

      let ptX, ptY;
      const hitCell = e.target.closest('.rel-cell');

      if (hitCell) {
        // Encaixe preciso na ancora central da celula de atributo clicada
        const cellRect = hitCell.getBoundingClientRect();
        ptX = (cellRect.left + cellRect.width / 2 - areaRect.left - this.panX) / this.scale;
        ptY = (cellRect.top + cellRect.height / 2 - areaRect.top - this.panY) / this.scale;
      } else {
        ptX = (e.clientX - areaRect.left - this.panX) / this.scale;
        ptY = (e.clientY - areaRect.top - this.panY) / this.scale;
      }

      this.currentWaypoints.push({ x: ptX, y: ptY });

      // Se clicou numa segunda celula (ou posterior) no canvas/celula, conclui a linha
      if (hitCell && this.currentWaypoints.length >= 2) {
        this.finishFreeformLine();
      } else {
        this.updateDrawingBanner();
        this.render();
      }
    });

    mainCanvas.addEventListener('mousemove', (e) => {
      if (this.mode !== 'manual' || this.drawSubMode !== 'freeline' || this.currentWaypoints.length === 0) return;

      const canvasArea = document.getElementById('relational-canvas-area');
      if (!canvasArea) return;
      const areaRect = canvasArea.getBoundingClientRect();

      this.previewMousePos = {
        x: (e.clientX - areaRect.left - this.panX) / this.scale,
        y: (e.clientY - areaRect.top - this.panY) / this.scale
      };
      this.renderFKLines();
    });

    mainCanvas.addEventListener('dblclick', (e) => {
      if (this.mode !== 'manual' || this.drawSubMode !== 'freeline') return;
      if (this.currentWaypoints.length >= 2) {
        this.finishFreeformLine();
      }
    });
  }

  updateDrawingBanner() {
    let banner = document.getElementById('freeline-drawing-banner');
    if (this.currentWaypoints.length > 0) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'freeline-drawing-banner';
        banner.className = 'freeline-drawing-banner';
        const canvasPanel = document.getElementById('canvas-panel');
        if (canvasPanel) canvasPanel.appendChild(banner);
      }
      banner.innerHTML = `
        <span>Modo Ponto a Ponto: ${this.currentWaypoints.length} vertice(s) colocado(s). Clique para adicionar pontos, Enter ou clique duplo para concluir.</span>
        <button id="btn-cancel-freeline">Cancelar (ESC)</button>
      `;
      const btnCancel = banner.querySelector('#btn-cancel-freeline');
      if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentWaypoints = [];
          this.previewMousePos = null;
          this.updateDrawingBanner();
          this.render();
        });
      }
    } else if (banner) {
      banner.remove();
    }
  }

  finishFreeformLine() {
    if (this.currentWaypoints.length >= 2) {
      this.freeformLines.push({
        id: `line_free_${Date.now()}`,
        points: [...this.currentWaypoints],
        color: this.activeColor
      });
      this.currentWaypoints = [];
      this.previewMousePos = null;
      this.updateDrawingBanner();
      this.render();
    }
  }

  // --- AUTO-LAYOUT COM OTIMIZACAO DE CRUZAMENTO DE LINHAS (BARYCENTRIC SORTING) ---
  autoLayoutTables() {
    if (!this.tables || this.tables.length === 0) return;

    const tableMap = new Map();
    this.tables.forEach(t => tableMap.set(t.name, t));

    // Mapear adjacencias de conexao (quem se conecta com quem)
    const adj = new Map();
    const parentsOf = new Map();
    const childrenOf = new Map();
    this.tables.forEach(t => {
      adj.set(t.name, new Set());
      parentsOf.set(t.name, new Set());
      childrenOf.set(t.name, new Set());
    });

    if (this.fkReferences) {
      this.fkReferences.forEach(ref => {
        if (tableMap.has(ref.sourceTable) && tableMap.has(ref.targetTable) && ref.sourceTable !== ref.targetTable) {
          parentsOf.get(ref.sourceTable).add(ref.targetTable);
          childrenOf.get(ref.targetTable).add(ref.sourceTable);
          adj.get(ref.sourceTable).add(ref.targetTable);
          adj.get(ref.targetTable).add(ref.sourceTable);
        }
      });
    }

    // 1. Determinar Nivel/Coluna (Ranking Topologico)
    const rankMap = new Map();
    this.tables.forEach(t => {
      // Tabelas sem dependencias (Entidades Fortes/Pais) comecam na coluna 0
      if (parentsOf.get(t.name).size === 0) rankMap.set(t.name, 0);
    });

    let changed = true, iter = 0;
    while (changed && iter++ < 20) {
      changed = false;
      this.tables.forEach(t => {
        if (parentsOf.get(t.name).size === 0) return;
        let maxR = -1;
        for (const p of parentsOf.get(t.name)) {
          if (rankMap.has(p)) maxR = Math.max(maxR, rankMap.get(p));
        }
        if (maxR >= 0) {
          const nr = maxR + 1;
          if (!rankMap.has(t.name) || rankMap.get(t.name) < nr) {
            rankMap.set(t.name, nr);
            changed = true;
          }
        }
      });
    }
    this.tables.forEach(t => { if (!rankMap.has(t.name)) rankMap.set(t.name, 0); });

    const maxRank = Math.max(0, ...Array.from(rankMap.values()));
    const cols = Array.from({ length: maxRank + 1 }, () => []);
    this.tables.forEach(t => cols[rankMap.get(t.name)].push(t));

    // 2. Calculo das Larguras de Coluna baseadas no numero de atributos
    const colWidths = cols.map(c => {
      if (c.length === 0) return 200;
      return Math.max(...c.map(t => (t.columns ? t.columns.length : 3) * 110 + 60));
    });

    const startX = 70;
    const startY = 60;
    const gutterX = 130;
    const tableHeight = 85;
    const gutterY = 130;

    // Posicionamento Inicial em Grid
    let currentX = startX;
    cols.forEach((colTbls, colIdx) => {
      colTbls.forEach((tbl, rowIdx) => {
        tbl.x = currentX;
        tbl.y = startY + rowIdx * (tableHeight + gutterY);
      });
      currentX += colWidths[colIdx] + gutterX;
    });

    // 3. Otimizacao Baricentrica (Barycentric Sweep) para minimizar cruzamento de linhas
    for (let sweep = 0; sweep < 5; sweep++) {
      // Varredura da esquerda para a direita
      for (let c = 1; c <= maxRank; c++) {
        cols[c].sort((a, b) => {
          const pA = Array.from(parentsOf.get(a.name) || []);
          const pB = Array.from(parentsOf.get(b.name) || []);
          const baryA = pA.length > 0 ? pA.reduce((sum, name) => sum + (tableMap.get(name)?.y || 0), 0) / pA.length : a.y;
          const baryB = pB.length > 0 ? pB.reduce((sum, name) => sum + (tableMap.get(name)?.y || 0), 0) / pB.length : b.y;
          return baryA - baryB;
        });

        cols[c].forEach((tbl, rowIdx) => {
          tbl.y = startY + rowIdx * (tableHeight + gutterY);
        });
      }

      // Varredura da direita para a esquerda
      for (let c = maxRank - 1; c >= 0; c--) {
        cols[c].sort((a, b) => {
          const chA = Array.from(childrenOf.get(a.name) || []);
          const chB = Array.from(childrenOf.get(b.name) || []);
          const baryA = chA.length > 0 ? chA.reduce((sum, name) => sum + (tableMap.get(name)?.y || 0), 0) / chA.length : a.y;
          const baryB = chB.length > 0 ? chB.reduce((sum, name) => sum + (tableMap.get(name)?.y || 0), 0) / chB.length : b.y;
          return baryA - baryB;
        });

        cols[c].forEach((tbl, rowIdx) => {
          tbl.y = startY + rowIdx * (tableHeight + gutterY);
        });
      }
    }
  }

  setScale(newScale) {
    this.scale = Math.max(0.4, Math.min(2.5, newScale));
    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) zoomText.textContent = `${Math.round(this.scale * 100)}%`;
    this.updateTransform();
  }

  updateTransform() {
    const viewportGroup = document.getElementById('viewport-group');
    if (viewportGroup) {
      viewportGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.scale})`);
    }

    const tablesLayer = document.getElementById('schema-tables-layer');
    if (tablesLayer) {
      tablesLayer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
      tablesLayer.style.transformOrigin = '0 0';
    }
  }

  render() {
    this.renderTables();
    requestAnimationFrame(() => {
      this.renderFKLines();
    });
    this.updateTransform();
  }

  renderTables() {
    let layer = document.getElementById('schema-tables-layer');
    if (!layer && this.container) {
      layer = document.createElement('div');
      layer.id = 'schema-tables-layer';
      layer.className = 'schema-tables-layer';
      this.container.appendChild(layer);
    }
    if (!layer) return;
    layer.innerHTML = '';

    this.tables.forEach(tbl => {
      const card = document.createElement('div');
      card.className = 'relational-table-card';
      card.id = `tbl-card-${tbl.name}`;
      card.style.left = `${tbl.x}px`;
      card.style.top = `${tbl.y}px`;

      let badgeHtml = '<span class="rel-table-badge badge-strong">Entidade</span>';
      if (tbl.isWeak) badgeHtml = '<span class="rel-table-badge badge-weak">Entidade Fraca</span>';
      else if (tbl.isAssociative) badgeHtml = '<span class="rel-table-badge badge-assoc">Associativa N:M</span>';

      let cellsHtml = '';
      tbl.columns.forEach(col => {
        const isPk = Boolean(col.isPk);
        const isFk = Boolean(col.isFk);
        let cellClass = 'rel-cell';
        if (isPk) cellClass += ' is-pk';
        if (isFk) cellClass += ' is-fk';

        if (this.connectingSource && this.connectingSource.tableName === tbl.name && this.connectingSource.colName === col.name) {
          cellClass += ' connecting-source';
        }

        cellsHtml += `
          <div class="${cellClass}" data-col-name="${col.name}" data-table-name="${tbl.name}" ${isFk ? `data-fk-target-table="${col.fkTargetTable}" data-fk-target-col="${col.fkTargetCol}"` : ''} title="${col.name} (${col.dataType})">
            <div class="cell-top-anchor"></div>
            <span class="cell-text">${col.name}</span>
            <div class="cell-bottom-anchor"></div>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="rel-table-title-area">
          <span class="rel-table-name">${tbl.name}</span>
          ${badgeHtml}
          <div class="table-actions-menu">
            <button class="tbl-action-btn edit" title="Editar / Adicionar Colunas" data-table="${tbl.name}">[Editar]</button>
            <button class="tbl-action-btn delete" title="Excluir Tabela" data-table="${tbl.name}">[Excluir]</button>
          </div>
        </div>
        <div class="rel-strip-row">
          ${cellsHtml}
        </div>
      `;

      const titleArea = card.querySelector('.rel-table-title-area');
      this.makeTableDraggable(card, titleArea, tbl);

      titleArea.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (window.openTableEditorModal) window.openTableEditorModal(tbl.name);
      });

      const btnEdit = card.querySelector('.tbl-action-btn.edit');
      const btnDelete = card.querySelector('.tbl-action-btn.delete');
      if (btnEdit) {
        btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.openTableEditorModal) window.openTableEditorModal(tbl.name);
        });
      }
      if (btnDelete) {
        btnDelete.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Deseja excluir a tabela "${tbl.name}"?`)) {
            this.deleteTable(tbl.name);
          }
        });
      }

      card.querySelectorAll('.rel-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
          if (this.mode === 'manual' && this.drawSubMode === 'cell') {
            e.stopPropagation();
            this.handleCellClickForConnection(cell);
          }
        });

        if (cell.classList.contains('is-fk')) {
          cell.addEventListener('mouseenter', () => {
            const fkTargetTable = cell.getAttribute('data-fk-target-table');
            const fkTargetCol = cell.getAttribute('data-fk-target-col');
            const sourceTable = cell.getAttribute('data-table-name');
            const sourceCol = cell.getAttribute('data-col-name');
            this.highlightFKReference(sourceTable, sourceCol, fkTargetTable, fkTargetCol);
          });

          cell.addEventListener('mouseleave', () => {
            this.resetHighlighting();
          });
        }
      });

      layer.appendChild(card);
    });
  }

  makeTableDraggable(card, handle, tblData) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    handle.style.cursor = 'move';
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tbl-action-btn')) return;
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = tblData.x;
      initialY = tblData.y;
      card.classList.add('selected');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - startX) / this.scale;
      const dy = (e.clientY - startY) / this.scale;
      tblData.x = initialX + dx;
      tblData.y = initialY + dy;
      card.style.left = `${tblData.x}px`;
      card.style.top = `${tblData.y}px`;
      this.renderFKLines();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        card.classList.remove('selected');
      }
    });
  }

  handleCellClickForConnection(cell) {
    const tableName = cell.getAttribute('data-table-name');
    const colName = cell.getAttribute('data-col-name');

    if (!this.connectingSource) {
      this.connectingSource = { tableName, colName, cell };
      this.renderTables();
    } else {
      const source = this.connectingSource;
      if (source.tableName === tableName && source.colName === colName) {
        this.connectingSource = null;
        this.renderTables();
        return;
      }

      this.addCustomFK(source.tableName, source.colName, tableName, colName, this.activeColor);
      this.connectingSource = null;
      this.renderTables();
    }
  }

  addCustomFK(sourceTable, sourceCol, targetTable, targetCol, color = '#00f0ff') {
    const srcTbl = this.tables.find(t => t.name === sourceTable);
    if (srcTbl) {
      const col = srcTbl.columns.find(c => c.name === sourceCol);
      if (col) {
        col.isFk = true;
        col.fkTargetTable = targetTable;
        col.fkTargetCol = targetCol;
      }
    }

    this.fkReferences.push({
      sourceTable,
      sourceCol,
      targetTable,
      targetCol,
      color: color || this.activeColor
    });

    this.render();
    if (this.onSchemaChange) this.onSchemaChange();
  }

  // --- RENDERIZAR SETAS FK E LINHAS PONTO A PONTO ---
  renderFKLines() {
    let svgLayer = document.getElementById('schema-fk-layer');
    const viewportGroup = document.getElementById('viewport-group');
    if (!svgLayer && viewportGroup) {
      svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svgLayer.setAttribute('id', 'schema-fk-layer');
      viewportGroup.appendChild(svgLayer);
    }
    if (!svgLayer) return;
    svgLayer.innerHTML = '';

    const layer = document.getElementById('schema-tables-layer');
    if (!layer) return;

    const layerRect = layer.getBoundingClientRect();
    if (layerRect.width === 0 || layerRect.height === 0) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgLayer.appendChild(defs);

    const getOrCreateMarkerId = (colorHex) => {
      const safeColor = (colorHex || '#00f0ff').replace('#', '');
      const markerId = `fk-arrowhead-${safeColor}`;
      if (!defs.querySelector(`#${markerId}`)) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', markerId);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '7');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '5');
        marker.setAttribute('markerHeight', '5');
        marker.setAttribute('orient', 'auto');
        marker.innerHTML = `<path d="M 1 1.5 L 8 5 L 1 8.5 L 3 5 Z" fill="${colorHex || '#00f0ff'}"/>`;
        defs.appendChild(marker);
      }
      return `url(#${markerId})`;
    };

    const DISTINCT_LINE_PALETTE = [
      '#00f0ff', '#f43f5e', '#10b981', '#f59e0b', '#a855f7',
      '#3b82f6', '#ec4899', '#14b8a6', '#84cc16', '#fb923c',
      '#6366f1', '#06b6d4'
    ];

    const PAD = 12;
    const obstacles = [];
    const cardBounds = new Map();
    this.tables.forEach(tbl => {
      const card = document.getElementById(`tbl-card-${tbl.name}`);
      if (!card) return;
      const r = card.getBoundingClientRect();
      const bounds = {
        name: tbl.name,
        left: (r.left - layerRect.left) / this.scale,
        right: (r.right - layerRect.left) / this.scale,
        top: (r.top - layerRect.top) / this.scale,
        bottom: (r.bottom - layerRect.top) / this.scale,
      };
      cardBounds.set(tbl.name, bounds);
      obstacles.push({
        name: tbl.name,
        left: bounds.left - PAD,
        right: bounds.right + PAD,
        top: bounds.top - PAD,
        bottom: bounds.bottom + PAD,
      });
    });

    if (obstacles.length > 0) {
      const xEdges = new Set();
      obstacles.forEach(o => { xEdges.add(o.left); xEdges.add(o.right); });
      const sortedXEdges = [...xEdges].sort((a, b) => a - b);
      const globalLeft = Math.min(...obstacles.map(o => o.left));
      const globalRight = Math.max(...obstacles.map(o => o.right));

      const corridors = [];
      corridors.push(globalLeft - 40);

      for (let i = 0; i < sortedXEdges.length - 1; i++) {
        const gap = sortedXEdges[i + 1] - sortedXEdges[i];
        if (gap > 20) {
          const midX = (sortedXEdges[i] + sortedXEdges[i + 1]) / 2;
          if (!obstacles.some(o => midX >= o.left && midX <= o.right)) {
            corridors.push(midX);
          }
        }
      }
      corridors.push(globalRight + 40);

      const segmentHitsObstacle = (ax, ay, bx, by, excludeNames) => {
        const minX = Math.min(ax, bx) - 1;
        const maxX = Math.max(ax, bx) + 1;
        const minY = Math.min(ay, by) - 1;
        const maxY = Math.max(ay, by) + 1;
        for (const o of obstacles) {
          if (excludeNames && excludeNames.includes(o.name)) continue;
          if (maxX >= o.left && minX <= o.right && maxY >= o.top && minY <= o.bottom) {
            return true;
          }
        }
        return false;
      };

      const sideSlots = new Map();
      const slotKey = (t, c, s) => `${t}|${c}|${s}`;
      const resolvedRefs = [];

      this.fkReferences.forEach((ref, refIndex) => {
        const sourceCard = document.getElementById(`tbl-card-${ref.sourceTable}`);
        const targetCard = document.getElementById(`tbl-card-${ref.targetTable}`);
        if (!sourceCard || !targetCard) return;

        const sourceCell = sourceCard.querySelector(`[data-col-name="${ref.sourceCol}"]`);
        const targetCell = targetCard.querySelector(`[data-col-name="${ref.targetCol}"]`);
        if (!sourceCell || !targetCell) return;

        const sB = cardBounds.get(ref.sourceTable);
        const tB = cardBounds.get(ref.targetTable);
        if (!sB || !tB) return;

        let sSide, tSide;
        if (tB.top > sB.bottom - 5) {
          sSide = 'bottom'; tSide = 'top';
        } else if (sB.top > tB.bottom - 5) {
          sSide = 'top'; tSide = 'bottom';
        } else {
          sSide = 'bottom'; tSide = 'bottom';
        }

        const sk = slotKey(ref.sourceTable, ref.sourceCol, sSide);
        const tk = slotKey(ref.targetTable, ref.targetCol, tSide);
        if (!sideSlots.has(sk)) sideSlots.set(sk, []);
        if (!sideSlots.has(tk)) sideSlots.set(tk, []);

        const srcCellR = sourceCell.getBoundingClientRect();
        const tgtCellR = targetCell.getBoundingClientRect();

        const srcCellCenter = (srcCellR.left + srcCellR.width / 2 - layerRect.left) / this.scale;
        const tgtCellCenter = (tgtCellR.left + tgtCellR.width / 2 - layerRect.left) / this.scale;

        const srcCellW = srcCellR.width / this.scale;
        const tgtCellW = tgtCellR.width / this.scale;

        resolvedRefs.push({
          ref,
          refIndex,
          sSide,
          tSide,
          sk,
          tk,
          srcCellCenter,
          tgtCellCenter,
          srcCellW,
          tgtCellW,
          sTop: sB.top,
          sBottom: sB.bottom,
          tTop: tB.top,
          tBottom: tB.bottom,
          srcOrderKey: srcCellCenter,
          tgtOrderKey: tgtCellCenter,
        });

        sideSlots.get(sk).push(refIndex);
        sideSlots.get(tk).push(refIndex);
      });

      const corridorUsage = new Map();

      resolvedRefs.forEach(({ ref, refIndex, sSide, tSide, sk, tk, srcCellCenter, tgtCellCenter, srcCellW, tgtCellW, sTop, sBottom, tTop, tBottom }) => {
        const sArr = sideSlots.get(sk) || [refIndex];
        const tArr = sideSlots.get(tk) || [refIndex];
        const sIdx = sArr.indexOf(refIndex);
        const tIdx = tArr.indexOf(refIndex);
        const sTotal = sArr.length;
        const tTotal = tArr.length;

        const calcOffset = (idx, total, cellW) => {
          if (total <= 1) return 0;
          const maxSpread = Math.min(cellW * 0.7, 30);
          const step = maxSpread / (total + 1);
          return (idx + 1) * step - maxSpread / 2;
        };

        const x1 = srcCellCenter + calcOffset(sIdx, sTotal, srcCellW);
        const x2 = tgtCellCenter + calcOffset(tIdx, tTotal, tgtCellW);

        const exitY = sSide === 'bottom' ? sBottom : sTop;
        const entryY = tSide === 'top' ? tTop : tBottom;
        const yMin = Math.min(exitY, entryY);
        const yMax = Math.max(exitY, entryY);

        const arrowPad = 2;
        const finalY = tSide === 'top' ? entryY + arrowPad : entryY - arrowPad;

        let d;

        // 0. Caso Especial: Auto-Relacionamento Recursivo (mesma tabela conectando em si mesma)
        if (ref.sourceTable === ref.targetTable) {
          const loopOffset = 18 + ((refIndex * 7) % 20);
          const loopY = sSide === 'top' ? exitY - loopOffset : exitY + loopOffset;
          d = `M ${x1} ${exitY} V ${loopY} H ${x2} V ${finalY}`;
        } else if (Math.abs(x1 - x2) < 6 && !segmentHitsObstacle(x1, yMin, x1, yMax, [ref.sourceTable, ref.targetTable])) {
          // 1. Verificar rota direta vertical (mesmo X sem obstaculos)
          d = `M ${x1} ${exitY} V ${finalY}`;
        } else {
          // 2. Tentar rota direta em Z / S pelo espaco intermediario (sem dar a volta)
          let directPathFound = false;

          if (sSide !== tSide) {
            // Uma tabela esta acima e a outra abaixo
            const laneShift = ((refIndex * 7) % 25) - 12;
            const midY = (exitY + entryY) / 2 + laneShift;

            const horizClear = !segmentHitsObstacle(Math.min(x1, x2) - 4, midY, Math.max(x1, x2) + 4, midY, [ref.sourceTable, ref.targetTable]);
            const vert1Clear = !segmentHitsObstacle(x1, Math.min(exitY, midY), x1, Math.max(exitY, midY), [ref.sourceTable]);
            const vert2Clear = !segmentHitsObstacle(x2, Math.min(entryY, midY), x2, Math.max(entryY, midY), [ref.targetTable]);

            if (horizClear && vert1Clear && vert2Clear) {
              d = `M ${x1} ${exitY} V ${midY} H ${x2} V ${finalY}`;
              directPathFound = true;
            }
          } else {
            // Ambas as saidas estao no mesmo lado (ex: ambas por baixo)
            const laneShift = 16 + ((refIndex * 8) % 30);
            const commonY = Math.max(exitY, entryY) + laneShift;

            const horizClear = !segmentHitsObstacle(Math.min(x1, x2) - 4, commonY, Math.max(x1, x2) + 4, commonY, [ref.sourceTable, ref.targetTable]);
            if (horizClear) {
              d = `M ${x1} ${exitY} V ${commonY} H ${x2} V ${finalY}`;
              directPathFound = true;
            }
          }

          // 3. Fallback: Se houver obstaculo no meio, desviar pelo corredor vertical mais proximo
          if (!directPathFound) {
            let bestCor = corridors[0], bestScore = Infinity;
            for (const cx of corridors) {
              let score = 0;
              score += Math.abs(cx - (x1 + x2) / 2) * 0.4;
              if (segmentHitsObstacle(cx, yMin - 5, cx, yMax + 5, [ref.sourceTable, ref.targetTable])) score += 100000;
              const testStubY1 = sSide === 'bottom' ? exitY + 14 : exitY - 14;
              if (segmentHitsObstacle(Math.min(x1, cx), testStubY1, Math.max(x1, cx), testStubY1, [ref.sourceTable])) score += 50000;
              const testStubY2 = tSide === 'top' ? entryY - 14 : entryY + 14;
              if (segmentHitsObstacle(Math.min(x2, cx), testStubY2, Math.max(x2, cx), testStubY2, [ref.targetTable])) score += 50000;

              if (score < bestScore) { bestScore = score; bestCor = cx; }
            }

            const ck = Math.round(bestCor);
            const laneIdx = corridorUsage.get(ck) || 0;
            corridorUsage.set(ck, laneIdx + 1);
            const channelX = bestCor + (laneIdx % 2 === 0 ? 1 : -1) * Math.ceil((laneIdx + 1) / 2) * 8;

            const stubY1 = sSide === 'bottom' ? exitY + 12 + laneIdx * 5 : exitY - 12 - laneIdx * 5;
            const stubY2 = tSide === 'top' ? entryY - 12 - laneIdx * 5 : entryY + 12 + laneIdx * 5;

            d = `M ${x1} ${exitY} V ${stubY1} H ${channelX} V ${stubY2} H ${x2} V ${finalY}`;
          }
        }

        const lineColor = ref.color || DISTINCT_LINE_PALETTE[refIndex % DISTINCT_LINE_PALETTE.length];
        const markerEnd = getOrCreateMarkerId(lineColor);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', `fk-arrow-path ${this.selectedLineIndex === refIndex ? 'selected-line' : ''}`);
        path.setAttribute('data-source-table', ref.sourceTable);
        path.setAttribute('data-source-col', ref.sourceCol);
        path.setAttribute('data-target-table', ref.targetTable);
        path.setAttribute('data-target-col', ref.targetCol);
        path.setAttribute('data-ref-index', refIndex);
        path.style.stroke = lineColor;
        path.setAttribute('marker-end', markerEnd);

        path.addEventListener('mouseenter', () => {
          this.highlightFKReference(ref.sourceTable, ref.sourceCol, ref.targetTable, ref.targetCol);
        });
        path.addEventListener('mouseleave', () => {
          this.resetHighlighting();
        });

        path.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showPopoverForLine(refIndex, e.clientX, e.clientY);
        });

        svgLayer.appendChild(path);
      });
    }

    this.freeformLines.forEach((fline, idx) => {
      if (!fline.points || fline.points.length < 2) return;

      const dStr = fline.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const fColor = fline.color || DISTINCT_LINE_PALETTE[(this.fkReferences.length + idx) % DISTINCT_LINE_PALETTE.length];
      const markerEnd = getOrCreateMarkerId(fColor);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', dStr);
      path.setAttribute('class', `fk-arrow-path ${this.selectedFreeformIndex === idx ? 'selected-line' : ''}`);
      path.style.stroke = fColor;
      path.setAttribute('marker-end', markerEnd);

      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPopoverForFreeformLine(idx, e.clientX, e.clientY);
      });

      fline.points.forEach((p) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', fColor);
        svgLayer.appendChild(circle);
      });

      svgLayer.appendChild(path);
    });

    if (this.currentWaypoints.length > 0) {
      let previewPoints = [...this.currentWaypoints];
      if (this.previewMousePos) {
        previewPoints.push(this.previewMousePos);
      }
      const dStr = previewPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      previewPath.setAttribute('d', dStr);
      previewPath.setAttribute('class', 'fk-arrow-path');
      previewPath.style.stroke = this.activeColor;
      previewPath.style.strokeDasharray = '5 5';
      previewPath.style.pointerEvents = 'none';

      previewPoints.forEach((p) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', this.activeColor);
        circle.style.pointerEvents = 'none';
        svgLayer.appendChild(circle);
      });

      svgLayer.appendChild(previewPath);
    }
  }

  // --- EXPORTACAO ULTRA-HD DO ESQUEMA RELACIONAL (PNG & SVG) ---
  exportPNG(filename = 'esquema_relacional.png', scale = 2) {
    if (!this.tables || this.tables.length === 0) {
      alert('Nenhuma tabela para exportar!');
      return;
    }

    const DISTINCT_PALETTE = [
      '#00f0ff', '#f43f5e', '#10b981', '#f59e0b', '#a855f7',
      '#3b82f6', '#ec4899', '#14b8a6', '#84cc16', '#fb923c'
    ];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.tables.forEach(tbl => {
      const card = document.getElementById(`tbl-card-${tbl.name}`);
      const width = card ? card.offsetWidth : (tbl.columns.length * 100 + 40);
      const height = card ? card.offsetHeight : 80;
      minX = Math.min(minX, tbl.x || 0);
      minY = Math.min(minY, tbl.y || 0);
      maxX = Math.max(maxX, (tbl.x || 0) + width);
      maxY = Math.max(maxY, (tbl.y || 0) + height);
    });

    if (this.freeformLines) {
      this.freeformLines.forEach(l => {
        if (l.points) {
          l.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        }
      });
    }

    const pad = 60;
    const exportW = Math.ceil(maxX - minX + pad * 2);
    const exportH = Math.ceil(maxY - minY + pad * 2);

    const canvas = document.createElement('canvas');
    canvas.width = exportW * scale;
    canvas.height = exportH * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const bgGrad = ctx.createLinearGradient(0, 0, exportW, exportH);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(1, '#090e1d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, exportW, exportH);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < exportW; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, exportH); ctx.stroke();
    }
    for (let y = 0; y < exportH; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(exportW, y); ctx.stroke();
    }

    const offsetX = -minX + pad;
    const offsetY = -minY + pad;

    const paths = document.querySelectorAll('#schema-fk-layer .fk-arrow-path');
    paths.forEach((p, idx) => {
      const d = p.getAttribute('d');
      if (!d) return;
      const strokeColor = p.style.stroke || DISTINCT_PALETTE[idx % DISTINCT_PALETTE.length];

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 6;

      const path2D = new Path2D(d);
      ctx.translate(offsetX, offsetY);
      ctx.stroke(path2D);
      ctx.restore();
    });

    this.tables.forEach(tbl => {
      const card = document.getElementById(`tbl-card-${tbl.name}`);
      const tx = (tbl.x || 0) + offsetX;
      const ty = (tbl.y || 0) + offsetY;
      const colWidth = 90;
      const numCols = Math.max(1, tbl.columns ? tbl.columns.length : 1);
      const tblW = card ? card.offsetWidth : (numCols * colWidth + 4);
      const tblH = card ? card.offsetHeight : 70;

      ctx.save();

      ctx.fillStyle = 'rgba(10, 16, 32, 0.95)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 12;

      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tblW, tblH, radius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(tx, ty, tblW, 26, [radius, radius, 0, 0]);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(tx, ty + 26);
      ctx.lineTo(tx + tblW, ty + 26);
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tbl.name, tx + 10, ty + 13);

      if (tbl.columns) {
        const cellW = (tblW - 2) / numCols;
        const cellH = tblH - 26;

        tbl.columns.forEach((col, cIdx) => {
          const cx = tx + 1 + cIdx * cellW;
          const cy = ty + 26;

          if (cIdx > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, cy + cellH);
            ctx.stroke();
          }

          ctx.fillStyle = col.isPk ? '#fde047' : (col.isFk ? '#00f0ff' : '#f8fafc');
          ctx.font = `${col.isPk ? 'bold' : 'normal'} 11px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(col.name, cx + cellW / 2, cy + 14);

          if (col.isPk) {
            const textMetrics = ctx.measureText(col.name);
            const textW = textMetrics.width;
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(cx + cellW / 2 - textW / 2, cy + 20);
            ctx.lineTo(cx + cellW / 2 + textW / 2, cy + 20);
            ctx.stroke();
          }

          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.font = '9px Fira Code, monospace';
          ctx.fillText(col.dataType || 'INT', cx + cellW / 2, cy + 28);
        });
      }

      ctx.restore();
    });

    canvas.toBlob(blob => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      if (window.showToast) window.showToast('Esquema Relacional exportado em PNG Ultra-HD!', 'success');
    }, 'image/png');
  }

  exportSVG(filename = 'esquema_relacional.svg') {
    if (!this.tables || this.tables.length === 0) {
      alert('Nenhuma tabela para exportar!');
      return;
    }

    const DISTINCT_PALETTE = [
      '#00f0ff', '#f43f5e', '#10b981', '#f59e0b', '#a855f7',
      '#3b82f6', '#ec4899', '#14b8a6', '#84cc16', '#fb923c'
    ];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.tables.forEach(tbl => {
      const card = document.getElementById(`tbl-card-${tbl.name}`);
      const width = card ? card.offsetWidth : (tbl.columns.length * 100 + 40);
      const height = card ? card.offsetHeight : 80;
      minX = Math.min(minX, tbl.x || 0);
      minY = Math.min(minY, tbl.y || 0);
      maxX = Math.max(maxX, (tbl.x || 0) + width);
      maxY = Math.max(maxY, (tbl.y || 0) + height);
    });

    const pad = 50;
    const exportW = Math.ceil(maxX - minX + pad * 2);
    const exportH = Math.ceil(maxY - minY + pad * 2);
    const offsetX = -minX + pad;
    const offsetY = -minY + pad;

    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${exportW} ${exportH}" width="${exportW}" height="${exportH}">\n`;
    svgStr += `  <style>\n`;
    svgStr += `    .tbl-bg { fill: #0a1020; stroke: #00f0ff; stroke-width: 1.5; rx: 8; }\n`;
    svgStr += `    .tbl-header { fill: rgba(0, 240, 255, 0.1); }\n`;
    svgStr += `    .tbl-title { font-family: sans-serif; font-size: 12px; font-weight: bold; fill: #00f0ff; }\n`;
    svgStr += `    .col-name { font-family: sans-serif; font-size: 11px; fill: #f8fafc; text-anchor: middle; }\n`;
    svgStr += `    .col-pk { font-family: sans-serif; font-size: 11px; font-weight: bold; fill: #fde047; text-anchor: middle; text-decoration: underline; }\n`;
    svgStr += `    .col-type { font-family: monospace; font-size: 9px; fill: #94a3b8; text-anchor: middle; }\n`;
    svgStr += `    .fk-line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }\n`;
    svgStr += `  </style>\n`;
    svgStr += `  <rect width="100%" height="100%" fill="#040711"/>\n`;

    const paths = document.querySelectorAll('#schema-fk-layer .fk-arrow-path');
    paths.forEach((p, idx) => {
      const d = p.getAttribute('d');
      if (!d) return;
      const strokeColor = p.style.stroke || DISTINCT_PALETTE[idx % DISTINCT_PALETTE.length];
      svgStr += `  <path d="${d}" class="fk-line" stroke="${strokeColor}" transform="translate(${offsetX}, ${offsetY})"/>\n`;
    });

    this.tables.forEach(tbl => {
      const card = document.getElementById(`tbl-card-${tbl.name}`);
      const tx = (tbl.x || 0) + offsetX;
      const ty = (tbl.y || 0) + offsetY;
      const numCols = Math.max(1, tbl.columns ? tbl.columns.length : 1);
      const tblW = card ? card.offsetWidth : (numCols * 90 + 4);
      const tblH = card ? card.offsetHeight : 70;

      svgStr += `  <g transform="translate(${tx}, ${ty})">\n`;
      svgStr += `    <rect width="${tblW}" height="${tblH}" rx="8" class="tbl-bg"/>\n`;
      svgStr += `    <path d="M 0 8 Q 0 0 8 0 L ${tblW - 8} 0 Q ${tblW} 0 ${tblW} 8 L ${tblW} 26 L 0 26 Z" class="tbl-header"/>\n`;
      svgStr += `    <text x="10" y="18" class="tbl-title">${tbl.name}</text>\n`;

      if (tbl.columns) {
        const cellW = (tblW - 2) / numCols;
        tbl.columns.forEach((col, cIdx) => {
          const cx = 1 + cIdx * cellW + cellW / 2;
          svgStr += `    <text x="${cx}" y="42" class="${col.isPk ? 'col-pk' : 'col-name'}">${col.name}</text>\n`;
          svgStr += `    <text x="${cx}" y="56" class="col-type">${col.dataType || 'INT'}</text>\n`;
        });
      }
      svgStr += `  </g>\n`;
    });

    svgStr += `</svg>`;

    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    if (window.showToast) window.showToast('Esquema Relacional exportado em SVG Vetor!', 'success');
  }
}

if (typeof window !== 'undefined') {
  window.RelationalCanvas = RelationalCanvas;
}

