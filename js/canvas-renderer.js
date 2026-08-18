/**
 * DER Builder — Renderizador SVG do Canvas Interativo (Notação Peter Chen)
 */
class CanvasRenderer {
  constructor(model, containerId = 'svg-container', svgId = 'der-canvas') {
    this.model = model;
    this.container = document.getElementById(containerId);
    this.svg = document.getElementById(svgId);
    this.viewportGroup = document.getElementById('viewport-group');
    this.connectionsLayer = document.getElementById('connections-layer');
    this.elementsLayer = document.getElementById('elements-layer');
    this.labelsLayer = document.getElementById('labels-layer');
    this.tempLayer = document.getElementById('temp-layer');

    // Pan & Zoom
    this.panX = 0;
    this.panY = 0;
    this.zoomScale = 1.0;
    this.minZoom = 0.2;
    this.maxZoom = 3.0;

    // Estado da seleção
    this.selectedElementIds = new Set();
    this.selectedConnectionId = null;

    // Callbacks
    this.onSelectElement = null;

    // Inicialização
    this.initViewportTransform();
    this.model.subscribe(() => this.render());
  }

  // --- PAN & ZOOM CONTROL ---
  initViewportTransform() {
    this.updateTransform();
  }

  setZoom(scale, centerX = null, centerY = null) {
    const newScale = Math.min(this.maxZoom, Math.max(this.minZoom, scale));
    if (centerX !== null && centerY !== null) {
      // Zoom em direção ao cursor do mouse
      const zoomRatio = newScale / this.zoomScale;
      this.panX = centerX - (centerX - this.panX) * zoomRatio;
      this.panY = centerY - (centerY - this.panY) * zoomRatio;
    }
    this.zoomScale = newScale;
    this.updateTransform();

    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) zoomText.textContent = `${Math.round(this.zoomScale * 100)}%`;
  }

  setPan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.updateTransform();
  }

  resetZoomAndPan() {
    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) zoomText.textContent = `100%`;
  }

  zoomToFit() {
    const bbox = this.viewportGroup.getBBox();
    if (!bbox || bbox.width === 0 || bbox.height === 0) {
      this.resetZoomAndPan();
      return;
    }
    const containerRect = this.container.getBoundingClientRect();
    const padding = 80;
    const scaleX = (containerRect.width - padding) / bbox.width;
    const scaleY = (containerRect.height - padding) / bbox.height;
    const fitScale = Math.min(1.5, Math.max(0.3, Math.min(scaleX, scaleY)));

    this.zoomScale = fitScale;
    this.panX = Math.round((containerRect.width - bbox.width * fitScale) / 2 - bbox.x * fitScale);
    this.panY = Math.round((containerRect.height - bbox.height * fitScale) / 2 - bbox.y * fitScale);
    this.updateTransform();
    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) zoomText.textContent = `${Math.round(this.zoomScale * 100)}%`;
  }

  updateTransform() {
    this.viewportGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoomScale})`);
  }

  // Converter coordenadas de Tela (Mouse) para Coordenadas do Canvas SVG
  screenToCanvasCoordinates(screenX, screenY) {
    const rect = this.svg.getBoundingClientRect();
    const x = (screenX - rect.left - this.panX) / this.zoomScale;
    const y = (screenY - rect.top - this.panY) / this.zoomScale;
    return { x, y };
  }

  // --- GETTER & SETTER RETROCOMPATÍVEL ---
  get selectedElementId() {
    if (this.selectedElementIds.size === 1) {
      return Array.from(this.selectedElementIds)[0];
    }
    return null;
  }

  set selectedElementId(id) {
    this.selectedElementIds.clear();
    if (id) this.selectedElementIds.add(id);
  }

  isElementSelected(id) {
    return this.selectedElementIds.has(id);
  }

  // --- SELEÇÃO ---
  selectElement(id, toggle = false) {
    this.selectedConnectionId = null;
    if (toggle) {
      if (this.selectedElementIds.has(id)) {
        this.selectedElementIds.delete(id);
      } else {
        this.selectedElementIds.add(id);
      }
    } else {
      this.selectedElementIds.clear();
      if (id) this.selectedElementIds.add(id);
    }
    this.render();
    if (this.onSelectElement) this.onSelectElement(this.selectedElementId, 'element', this.selectedElementIds);
  }

  selectMultipleElements(ids, append = false) {
    this.selectedConnectionId = null;
    if (!append) {
      this.selectedElementIds.clear();
    }
    if (Array.isArray(ids)) {
      ids.forEach(id => {
        if (id) this.selectedElementIds.add(id);
      });
    }
    this.render();
    if (this.onSelectElement) this.onSelectElement(this.selectedElementId, 'element', this.selectedElementIds);
  }

  getSelectedElements() {
    const list = [];
    this.selectedElementIds.forEach(id => {
      const elem = this.model.getElementById(id);
      if (elem) list.push(elem);
    });
    return list;
  }

  selectConnection(id) {
    this.selectedConnectionId = id;
    this.selectedElementIds.clear();
    this.render();
    if (this.onSelectElement) this.onSelectElement(id, 'connection', this.selectedElementIds);
  }

  clearSelection() {
    this.selectedElementIds.clear();
    this.selectedConnectionId = null;
    this.render();
    if (this.onSelectElement) this.onSelectElement(null, null, this.selectedElementIds);
  }

  // --- RENDERIZAÇÃO GERAL ---
  render() {
    this.clearLayers();
    this.renderConnections();
    this.renderElements();
    this.updateElementCountDisplay();
  }

  clearLayers() {
    this.connectionsLayer.innerHTML = '';
    this.elementsLayer.innerHTML = '';
    this.labelsLayer.innerHTML = '';
  }

  updateElementCountDisplay() {
    const countEl = document.getElementById('info-elements-count');
    if (countEl) {
      const total = this.model.entities.length + this.model.attributes.length + this.model.relationships.length;
      countEl.textContent = `${total} elementos (${this.model.entities.length} E, ${this.model.attributes.length} A, ${this.model.relationships.length} R)`;
    }
  }

  // --- RENDERIZAR ELEMENTOS PETER CHEN ---
  renderElements() {
    // 1. Entidades (Retângulos simples ou duplos)
    this.model.entities.forEach(entity => {
      const g = this.createGroup(entity.id, 'entity');
      const isSelected = this.isElementSelected(entity.id);

      const rectClass = `entity-rect ${entity.isWeak ? 'weak-entity' : ''}`;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', entity.x - entity.width / 2);
      rect.setAttribute('y', entity.y - entity.height / 2);
      rect.setAttribute('width', entity.width);
      rect.setAttribute('height', entity.height);
      rect.setAttribute('class', rectClass);

      g.appendChild(rect);

      // Entidade Fraca: Borda Dupla (Retângulo Interno)
      if (entity.isWeak) {
        const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        innerRect.setAttribute('x', entity.x - entity.width / 2 + 4);
        innerRect.setAttribute('y', entity.y - entity.height / 2 + 4);
        innerRect.setAttribute('width', Math.max(10, entity.width - 8));
        innerRect.setAttribute('height', Math.max(10, entity.height - 8));
        innerRect.setAttribute('class', 'entity-rect inner weak-entity');
        g.appendChild(innerRect);
      }

      const textClass = `element-text entity-text ${entity.isWeak ? 'weak-entity' : ''}`;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', entity.x);
      text.setAttribute('y', entity.y);
      text.setAttribute('class', textClass);
      text.textContent = entity.name;
      g.appendChild(text);

      if (isSelected) g.classList.add('selected');
      this.elementsLayer.appendChild(g);
    });

    // 2. Atributos (Elipses simples, duplas ou tracejadas)
    this.model.attributes.forEach(attr => {
      const g = this.createGroup(attr.id, 'attribute');
      const isSelected = this.isElementSelected(attr.id);

      let ellipseClass = `attribute-ellipse ${attr.isDerived ? 'derived' : ''}`;
      if (attr.isMultivalued) ellipseClass += ' multivalued';
      if (attr.isKey) ellipseClass += ' key-attribute';
      if (attr.isPartialKey) ellipseClass += ' key-partial-attribute';

      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('cx', attr.x);
      ellipse.setAttribute('cy', attr.y);
      ellipse.setAttribute('rx', attr.width / 2);
      ellipse.setAttribute('ry', attr.height / 2);
      ellipse.setAttribute('class', ellipseClass);
      g.appendChild(ellipse);

      // Atributo Multivalorado: Borda Dupla (Elipse Interna)
      if (attr.isMultivalued) {
        const innerEllipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        innerEllipse.setAttribute('cx', attr.x);
        innerEllipse.setAttribute('cy', attr.y);
        innerEllipse.setAttribute('rx', Math.max(5, attr.width / 2 - 4));
        innerEllipse.setAttribute('ry', Math.max(5, attr.height / 2 - 4));
        innerEllipse.setAttribute('class', 'attribute-ellipse inner multivalued');
        g.appendChild(innerEllipse);
      }

      // Estilo do texto (Chave Primária = Sublinhado Sólido, Chave Parcial = Sublinhado Tracejado)
      let textClass = 'element-text attribute-text';
      if (attr.isKey) textClass += ' key-attribute';
      else if (attr.isPartialKey) textClass += ' key-partial-attribute';

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', attr.x);
      text.setAttribute('y', attr.y);
      text.setAttribute('class', textClass);
      text.textContent = attr.name;
      g.appendChild(text);

      if (isSelected) g.classList.add('selected');
      this.elementsLayer.appendChild(g);
    });

    // 3. Relacionamentos (Losangos simples ou duplos)
    this.model.relationships.forEach(rel => {
      const g = this.createGroup(rel.id, 'relationship');
      const isSelected = this.isElementSelected(rel.id);

      const halfW = rel.width / 2;
      const halfH = rel.height / 2;

      // 4 pontos do losango: topo, direita, baixo, esquerda
      const points = `${rel.x},${rel.y - halfH} ${rel.x + halfW},${rel.y} ${rel.x},${rel.y + halfH} ${rel.x - halfW},${rel.y}`;

      const polyClass = `relationship-polygon ${rel.isWeak ? 'weak-relationship' : ''}`;
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', points);
      polygon.setAttribute('class', polyClass);
      g.appendChild(polygon);

      // Relacionamento Fraco / Identificador: Borda Dupla (Losango Interno)
      if (rel.isWeak) {
        const innerW = Math.max(10, halfW - 5);
        const innerH = Math.max(10, halfH - 5);
        const innerPoints = `${rel.x},${rel.y - innerH} ${rel.x + innerW},${rel.y} ${rel.x},${rel.y + innerH} ${rel.x - innerW},${rel.y}`;

        const innerPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        innerPoly.setAttribute('points', innerPoints);
        innerPoly.setAttribute('class', 'relationship-polygon inner weak-relationship');
        g.appendChild(innerPoly);
      }

      const relTextClass = `element-text relationship-text ${rel.isWeak ? 'weak-relationship' : ''}`;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', rel.x);
      text.setAttribute('y', rel.y);
      text.setAttribute('class', relTextClass);
      text.textContent = rel.name;
      g.appendChild(text);

      if (isSelected) g.classList.add('selected');
      this.elementsLayer.appendChild(g);
    });

    // 4. Especializações EER (Círculo intermediário d, o, u)
    if (this.model.specializations) {
      this.model.specializations.forEach(spec => {
        const g = this.createGroup(spec.id, 'specialization');
        const isSelected = this.isElementSelected(spec.id);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', spec.x);
        circle.setAttribute('cy', spec.y);
        circle.setAttribute('r', 18);
        circle.setAttribute('class', 'specialization-circle');
        g.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', spec.x);
        text.setAttribute('y', spec.y);
        text.setAttribute('class', 'element-text specialization-text');
        text.textContent = (spec.specType || 'd').toUpperCase();
        g.appendChild(text);

        if (isSelected) g.classList.add('selected');
        this.elementsLayer.appendChild(g);
      });
    }
  }

  createGroup(id, type) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `der-element der-${type}`);
    g.setAttribute('data-id', id);
    return g;
  }

  // --- RENDERIZAR CONEXÕES (COM SUPORTE A LINHAS CURVAS PARALELAS SEM SOBREPOSIÇÃO) ---
  renderConnections() {
    this.connectionsLayer.innerHTML = '';
    this.labelsLayer.innerHTML = '';

    // Mapear quantas conexões cada relacionamento possui por entidade para detectar auto-relacionamentos
    const relEntityConnCount = new Map();
    this.model.connections.forEach(conn => {
      const source = this.model.getElementById(conn.sourceId);
      const target = this.model.getElementById(conn.targetId);
      if (!source || !target) return;

      const relId = source.type === 'relationship' ? source.id : (target.type === 'relationship' ? target.id : null);
      const entId = source.type === 'entity' ? source.id : (target.type === 'entity' ? target.id : null);

      if (relId && entId) {
        const key = `${relId}___${entId}`;
        if (!relEntityConnCount.has(key)) relEntityConnCount.set(key, []);
        relEntityConnCount.get(key).push(conn);
      }
    });

    // Agrupar conexões pelo par de nós (sem ordem)
    const pairGroups = new Map();
    this.model.connections.forEach(conn => {
      const ids = [conn.sourceId, conn.targetId].sort();
      const pairKey = ids.join('___');
      if (!pairGroups.has(pairKey)) {
        pairGroups.set(pairKey, []);
      }
      pairGroups.get(pairKey).push(conn);
    });

    // Mapear quantas conexões chegam em cada face de cada elemento para Distribuição Dinâmica de Portas
    const elementFaceConns = new Map();
    this.model.connections.forEach(conn => {
      const source = this.model.getElementById(conn.sourceId);
      const target = this.model.getElementById(conn.targetId);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;

      const fSource = (conn.faceSource && conn.faceSource !== 'auto') ? conn.faceSource : ((Math.abs(dx) >= Math.abs(dy)) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north'));
      const fTarget = (conn.faceTarget && conn.faceTarget !== 'auto') ? conn.faceTarget : ((Math.abs(dx) >= Math.abs(dy)) ? (dx >= 0 ? 'west' : 'east') : (dy >= 0 ? 'north' : 'south'));

      const keyS = `${source.id}___${fSource}`;
      const keyT = `${target.id}___${fTarget}`;

      if (!elementFaceConns.has(keyS)) elementFaceConns.set(keyS, []);
      if (!elementFaceConns.has(keyT)) elementFaceConns.set(keyT, []);

      elementFaceConns.get(keyS).push({ conn, isSource: true });
      elementFaceConns.get(keyT).push({ conn, isSource: false });
    });

    pairGroups.forEach((conns) => {
      const count = conns.length;

      conns.forEach((conn, index) => {
        const source = this.model.getElementById(conn.sourceId);
        const target = this.model.getElementById(conn.targetId);

        if (!source || !target) return;

        const isSelected = this.selectedConnectionId === conn.id;

        // Calcular face de entrada e saída (especial para auto-relacionamentos estilo EMPREGADO supervisão)
        const lockSource = (conn.faceSource && conn.faceSource !== 'auto') ? conn.faceSource : null;
        const lockTarget = (conn.faceTarget && conn.faceTarget !== 'auto') ? conn.faceTarget : null;

        const dx = target.x - source.x;
        const dy = target.y - source.y;

        let fSource, fTarget;
        if (count > 1) {
          // No auto-relacionamento recursivo acadêmico (ex.: Empregado / Supervisão ou Área / Integra):
          // Cabo 1 sai pelo Topo (Norte) e Cabo 2 sai pela Base (Sul)
          fSource = lockSource || (index === 0 ? 'north' : 'south');
          fTarget = lockTarget || (index === 0 ? 'north' : 'south');
        } else {
          fSource = lockSource || ((Math.abs(dx) >= Math.abs(dy)) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north'));
          fTarget = lockTarget || ((Math.abs(dx) >= Math.abs(dy)) ? (dx >= 0 ? 'west' : 'east') : (dy >= 0 ? 'north' : 'south'));
        }

        // Obter offset de porta para esta face
        const sConns = elementFaceConns.get(`${source.id}___${fSource}`) || [];
        const tConns = elementFaceConns.get(`${target.id}___${fTarget}`) || [];

        const sPortIndex = sConns.findIndex(c => c.conn.id === conn.id);
        const tPortIndex = tConns.findIndex(c => c.conn.id === conn.id);

        const startPt = this.calculateEdgeIntersection(source, target, fSource, Math.max(0, sPortIndex), Math.max(1, sConns.length));
        const endPt = this.calculateEdgeIntersection(target, source, fTarget, Math.max(0, tPortIndex), Math.max(1, tConns.length));

        // Anexar face informada aos pontos para o A* saber o lado do Routing Stub
        startPt.face = fSource;
        endPt.face = fTarget;

        const dxPt = endPt.x - startPt.x;
        const dyPt = endPt.y - startPt.y;
        const len = Math.hypot(dxPt, dyPt) || 1;

        // Calcular Ponto de Controle para offsets
        let ctrl = { x: (startPt.x + endPt.x) / 2, y: (startPt.y + endPt.y) / 2 };

        const hasTotalLegacy = Boolean(conn.isTotal);
        const hasTotalSource = conn.isTotalSource !== undefined ? Boolean(conn.isTotalSource) : hasTotalLegacy;
        const hasTotalTarget = conn.isTotalTarget !== undefined ? Boolean(conn.isTotalTarget) : hasTotalLegacy;
        const lineClass = `connection-line ${hasTotalLegacy ? 'total' : ''} ${isSelected ? 'selected' : ''}`;

        // SEGUNDO A REGRA: Roteamento Inteligente (Auto-Relacionamento Recursivo em Barramento Limpo ou A*)
        const isAttrConn = source.type === 'attribute' || target.type === 'attribute';
        let pathPoints = [];

        if (!isAttrConn) {
          if (!this.orthogonalRouter) {
            this.orthogonalRouter = new OrthogonalRouter(this.model, 20);
          }

          // Se for conexões múltiplas do mesmo par (ex: auto-relacionamento recursivo)
          if (count > 1) {
            pathPoints = this.orthogonalRouter.findParallelPath(startPt, endPt, index, count);
          } else {
            pathPoints = this.orthogonalRouter.findPath(startPt, endPt, conn.id);
          }
        } else {
          // Apenas Atributos (Elipses) usam reta direta
          pathPoints = [startPt, endPt];
        }

        // Construir string de comando SVG d
        const d = pathPoints.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');

        // Caminho invisível largo de captura de clique (Hit Area de 20px)
        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitPath.setAttribute('d', d);
        hitPath.setAttribute('fill', 'none');
        hitPath.setAttribute('stroke', 'transparent');
        hitPath.setAttribute('stroke-width', '20');
        hitPath.setAttribute('class', 'connection-line connection-hitarea');
        hitPath.setAttribute('data-conn-id', conn.id);
        hitPath.style.cursor = 'pointer';
        this.connectionsLayer.appendChild(hitPath);

        const isTotal = Boolean(conn.isTotalSource || conn.isTotalTarget || conn.isTotal);
        console.log(`[CanvasRenderer] Desenhando conexão ${conn.id}: isTotal = ${isTotal}`);
        
        if (isTotal) {
          console.log(`[CanvasRenderer] -> Renderizando Linha Dupla (Masking) para ${conn.id}`);
          // Refazendo do ZERO: Se for obrigatório, desenha 2 linhas paralelas perfeitas
          this.renderTrueDoubleLine(pathPoints, 5, isSelected, conn.id);
          
          // Mantém a área de hit original invisível
          this.connectionsLayer.appendChild(hitPath);
        } else {
          // Caminho visual principal simples
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('fill', 'none');
          path.setAttribute('class', lineClass);
          path.setAttribute('data-conn-id', conn.id);
          path.style.cursor = 'pointer';
          this.connectionsLayer.appendChild(path);
          this.connectionsLayer.appendChild(hitPath);
        }

        // Renderizar cardinalidade individual perto do losango do relacionamento (máxima cardinalidade da ponta)
        const relIsTarget = target.type === 'relationship';
        const relIsSource = source.type === 'relationship';
        const cardValue = conn.cardinalitySource || conn.cardinalityTarget;

        if (cardValue) {
          // Ponto de ancoragem da cardinalidade no segmento final próximo ao losango do relacionamento
          const relPt = relIsTarget ? endPt : startPt;
          const neighborPt = relIsTarget ? pathPoints[pathPoints.length - 2] : pathPoints[1];

          // 25px antes de chegar no losango ao longo da reta final
          const segDx = relPt.x - neighborPt.x;
          const segDy = relPt.y - neighborPt.y;
          const segLen = Math.hypot(segDx, segDy) || 1;

          const cardX = relPt.x - (segDx / segLen) * 28 + (-segDy / segLen) * 14;
          const cardY = relPt.y - (segDy / segLen) * 28 + (segDx / segLen) * 14;

          this.renderCardinalityBadgeAt(cardValue, cardX, cardY);
        }

        // Renderizar rótulos de Papel (Role names) nas conexões se definidos (perto da entidade)
        const roleText = conn.roleSource || conn.roleTarget;
        if (roleText) {
          const entPt = relIsTarget ? startPt : endPt;
          const neighborPt = relIsTarget ? pathPoints[1] : pathPoints[pathPoints.length - 2];
          const segDx = neighborPt.x - entPt.x;
          const segDy = neighborPt.y - entPt.y;
          const segLen = Math.hypot(segDx, segDy) || 1;

          const roleX = entPt.x + (segDx / segLen) * 35;
          const roleY = entPt.y + (segDy / segLen) * 35 - 12;

          this.renderRoleLabelAt(roleText, roleX, roleY);
        }
      });
    });
  }

  // --- CÁLCULO MATEMÁTICO DE CAMINHOS PARALELOS (SEM MÁSCARA) ---
  computeParallelPaths(points, offset = 2.5) {
    if (!points || points.length < 2) return { d1: '', d2: '' };

    // Vetores normais para cada segmento
    const normals = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      normals.push({ nx: -dy / len, ny: dx / len });
    }

    const pts1 = [];
    const pts2 = [];

    for (let i = 0; i < points.length; i++) {
      let nx, ny;
      if (i === 0) {
        nx = normals[0].nx;
        ny = normals[0].ny;
      } else if (i === points.length - 1) {
        nx = normals[normals.length - 1].nx;
        ny = normals[normals.length - 1].ny;
      } else {
        // Miter join exato para quinas de 90° e ângulos diversos
        nx = normals[i - 1].nx + normals[i].nx;
        ny = normals[i - 1].ny + normals[i].ny;
      }

      pts1.push({
        x: points[i].x + nx * offset,
        y: points[i].y + ny * offset
      });

      pts2.push({
        x: points[i].x - nx * offset,
        y: points[i].y - ny * offset
      });
    }

    const d1 = pts1.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
    const d2 = pts2.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');

    return { d1, d2 };
  }

  // --- DESENHAR LINHA DUPLA VERDADEIRA (DUAS LINHAS PARALELAS SVG INDEPENDENTES) ---
  renderTrueDoubleLine(pathPoints, gapDistance, isSelected, connId) {
    if (!pathPoints || pathPoints.length < 2) return;

    const { d1, d2 } = this.computeParallelPaths(pathPoints, 2.5);
    const lineClass = `connection-line total ${isSelected ? 'selected' : ''}`;

    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', d1);
    path1.setAttribute('fill', 'none');
    path1.setAttribute('class', lineClass);
    path1.setAttribute('data-conn-id', connId);
    path1.style.cursor = 'pointer';

    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', d2);
    path2.setAttribute('fill', 'none');
    path2.setAttribute('class', lineClass);
    path2.setAttribute('data-conn-id', connId);
    path2.style.cursor = 'pointer';

    this.connectionsLayer.appendChild(path1);
    this.connectionsLayer.appendChild(path2);
  }

  renderCardinalityBadgeAt(label, x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const badgeWidth = Math.max(34, label.length * 9 + 10);
    const badgeHeight = 22;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - badgeWidth / 2);
    rect.setAttribute('y', y - badgeHeight / 2);
    rect.setAttribute('width', badgeWidth);
    rect.setAttribute('height', badgeHeight);
    rect.setAttribute('rx', 4);
    rect.setAttribute('class', 'cardinality-bg');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', 'cardinality-badge');
    text.textContent = label;

    g.appendChild(rect);
    g.appendChild(text);
    this.labelsLayer.appendChild(g);
  }

  renderRoleLabelAt(roleText, x, y) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', 'role-text');
    text.textContent = `[${roleText}]`;
    this.labelsLayer.appendChild(text);
  }

  // --- CÁLCULO DE PONTOS DE ANCORAGEM (COM DISTRIBUIÇÃO DINÂMICA DE PORTAS E DESLOCAMENTO) ---
  calculateEdgeIntersection(elem, target, preferredFace = null, portIndex = 0, totalPorts = 1) {
    const dx = target.x - elem.x;
    const dy = target.y - elem.y;

    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return { x: elem.x, y: elem.y };
    }

    // Calcular offset de distribuição da porta se houver mais de 1 cabo na mesma face
    const spacing = 18; // 18px entre cada cabo
    const portOffset = (totalPorts > 1) ? (portIndex - (totalPorts - 1) / 2) * spacing : 0;

    // 1. Entidades (Retângulo):
    if (elem.type === 'entity') {
      const w = elem.width / 2;
      const h = elem.height / 2;

      // Se for conexão com Atributo (Elipse), permite sair naturalmente em qualquer ponto/borda da Entidade (diagonal)
      if (target.type === 'attribute') {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx * h >= absDy * w) {
          // Interseca a borda Leste ou Oeste na altura y correspondente
          const edgeX = elem.x + Math.sign(dx) * w;
          const edgeY = elem.y + (dy * w) / (absDx || 1);
          return { x: edgeX, y: edgeY };
        } else {
          // Interseca a borda Norte ou Sul na largura x correspondente
          const edgeY = elem.y + Math.sign(dy) * h;
          const edgeX = elem.x + (dx * h) / (absDy || 1);
          return { x: edgeX, y: edgeY };
        }
      }

      let face = preferredFace;
      if (!face) {
        face = (Math.abs(dx) >= Math.abs(dy)) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north');
      }

      if (face === 'east') return { x: elem.x + w, y: elem.y + portOffset };
      if (face === 'west') return { x: elem.x - w, y: elem.y + portOffset };
      if (face === 'north') return { x: elem.x + portOffset, y: elem.y - h };
      if (face === 'south') return { x: elem.x + portOffset, y: elem.y + h };
    }

    // 2. Relacionamentos (Losango): Ancoragem nos 4 vértices das arestas
    if (elem.type === 'relationship') {
      const w = elem.width / 2;
      const h = elem.height / 2;

      let face = preferredFace;
      if (!face) {
        face = (Math.abs(dx) >= Math.abs(dy)) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north');
      }

      if (face === 'east') return { x: elem.x + w, y: elem.y + portOffset };
      if (face === 'west') return { x: elem.x - w, y: elem.y + portOffset };
      if (face === 'north') return { x: elem.x + portOffset, y: elem.y - h };
      if (face === 'south') return { x: elem.x + portOffset, y: elem.y + h };
    }

    // 3. Atributos (Elipse): Conexão direta na borda da elipse (Permite Diagonal)
    if (elem.type === 'attribute') {
      const angle = Math.atan2(dy, dx);
      const rx = elem.width / 2;
      const ry = elem.height / 2;
      const tanA = Math.tan(angle);
      const x = (rx * ry) / Math.sqrt(ry * ry + rx * rx * tanA * tanA);
      const y = x * tanA;
      return {
        x: elem.x + Math.sign(dx) * Math.abs(x),
        y: elem.y + Math.sign(dy) * Math.abs(y)
      };
    }

    // 4. Especializações EER (Círculo)
    if (elem.type === 'specialization') {
      const angle = Math.atan2(dy, dx);
      const r = 18;
      return {
        x: elem.x + r * Math.cos(angle),
        y: elem.y + r * Math.sin(angle)
      };
    }

    return { x: elem.x, y: elem.y };
  }
}
