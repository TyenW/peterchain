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
    this.selectedElementId = null;
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

  // --- SELEÇÃO ---
  selectElement(id) {
    this.selectedElementId = id;
    this.selectedConnectionId = null;
    this.render();
    if (this.onSelectElement) this.onSelectElement(id, 'element');
  }

  selectConnection(id) {
    this.selectedConnectionId = id;
    this.selectedElementId = null;
    this.render();
    if (this.onSelectElement) this.onSelectElement(id, 'connection');
  }

  clearSelection() {
    this.selectedElementId = null;
    this.selectedConnectionId = null;
    this.render();
    if (this.onSelectElement) this.onSelectElement(null, null);
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
      const isSelected = this.selectedElementId === entity.id;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', entity.x - entity.width / 2);
      rect.setAttribute('y', entity.y - entity.height / 2);
      rect.setAttribute('width', entity.width);
      rect.setAttribute('height', entity.height);
      rect.setAttribute('class', 'entity-rect');

      g.appendChild(rect);

      // Entidade Fraca: Borda Dupla (Retângulo Interno)
      if (entity.isWeak) {
        const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        innerRect.setAttribute('x', entity.x - entity.width / 2 + 4);
        innerRect.setAttribute('y', entity.y - entity.height / 2 + 4);
        innerRect.setAttribute('width', Math.max(10, entity.width - 8));
        innerRect.setAttribute('height', Math.max(10, entity.height - 8));
        innerRect.setAttribute('class', 'entity-rect inner');
        g.appendChild(innerRect);
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', entity.x);
      text.setAttribute('y', entity.y);
      text.setAttribute('class', 'element-text entity-text');
      text.textContent = entity.name;
      g.appendChild(text);

      if (isSelected) g.classList.add('selected');
      this.elementsLayer.appendChild(g);
    });

    // 2. Atributos (Elipses simples, duplas ou tracejadas)
    this.model.attributes.forEach(attr => {
      const g = this.createGroup(attr.id, 'attribute');
      const isSelected = this.selectedElementId === attr.id;

      const ellipseClass = `attribute-ellipse ${attr.isDerived ? 'derived' : ''}`;
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
        innerEllipse.setAttribute('class', 'attribute-ellipse inner');
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
      const isSelected = this.selectedElementId === rel.id;

      const halfW = rel.width / 2;
      const halfH = rel.height / 2;

      // 4 pontos do losango: topo, direita, baixo, esquerda
      const points = `${rel.x},${rel.y - halfH} ${rel.x + halfW},${rel.y} ${rel.x},${rel.y + halfH} ${rel.x - halfW},${rel.y}`;

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', points);
      polygon.setAttribute('class', 'relationship-polygon');
      g.appendChild(polygon);

      // Relacionamento Fraco / Identificador: Borda Dupla (Losango Interno)
      if (rel.isWeak) {
        const innerW = Math.max(10, halfW - 5);
        const innerH = Math.max(10, halfH - 5);
        const innerPoints = `${rel.x},${rel.y - innerH} ${rel.x + innerW},${rel.y} ${rel.x},${rel.y + innerH} ${rel.x - innerW},${rel.y}`;

        const innerPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        innerPoly.setAttribute('points', innerPoints);
        innerPoly.setAttribute('class', 'relationship-polygon inner');
        g.appendChild(innerPoly);
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', rel.x);
      text.setAttribute('y', rel.y);
      text.setAttribute('class', 'element-text relationship-text');
      text.textContent = rel.name;
      g.appendChild(text);

      if (isSelected) g.classList.add('selected');
      this.elementsLayer.appendChild(g);
    });

    // 4. Especializações EER (Círculo intermediário d, o, u)
    if (this.model.specializations) {
      this.model.specializations.forEach(spec => {
        const g = this.createGroup(spec.id, 'specialization');
        const isSelected = this.selectedElementId === spec.id;

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

    pairGroups.forEach((conns) => {
      const count = conns.length;

      conns.forEach((conn, index) => {
        const source = this.model.getElementById(conn.sourceId);
        const target = this.model.getElementById(conn.targetId);

        if (!source || !target) return;

        const isSelected = this.selectedConnectionId === conn.id;

        // Calcular pontos de ancoragem nas bordas das formas
        const startPt = this.calculateEdgeIntersection(source, target);
        const endPt = this.calculateEdgeIntersection(target, source);

        const dx = endPt.x - startPt.x;
        const dy = endPt.y - startPt.y;
        const len = Math.hypot(dx, dy) || 1;

        // Calcular Ponto de Controle (P1) para curva Bezier
        let ctrl;
        if (count === 1) {
          ctrl = { x: (startPt.x + endPt.x) / 2, y: (startPt.y + endPt.y) / 2 };
        } else {
          // Múltiplas conexões entre o mesmo par de elementos: deslocamento perpendicular
          const offsetStep = 50; // Deslocamento de 50px por linha
          const offset = (index - (count - 1) / 2) * offsetStep;

          const nx = -dy / len;
          const ny = dx / len;

          ctrl = {
            x: (startPt.x + endPt.x) / 2 + nx * offset,
            y: (startPt.y + endPt.y) / 2 + ny * offset
          };
        }

        const hasTotalLegacy = Boolean(conn.isTotal);
        const hasTotalSource = conn.isTotalSource !== undefined ? Boolean(conn.isTotalSource) : hasTotalLegacy;
        const hasTotalTarget = conn.isTotalTarget !== undefined ? Boolean(conn.isTotalTarget) : hasTotalLegacy;
        const lineClass = `connection-line ${hasTotalLegacy ? 'total' : ''} ${isSelected ? 'selected' : ''}`;

        // Renderizar caminho da conexão (Reta ou Curva Bezier Quadrática)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${startPt.x} ${startPt.y} Q ${ctrl.x} ${ctrl.y} ${endPt.x} ${endPt.y}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('class', lineClass);
        path.setAttribute('data-conn-id', conn.id);

        this.connectionsLayer.appendChild(path);

        // Participação total por lado: linha paralela ao longo da curva
        if (hasTotalSource) {
          this.renderTotalParticipationCurve(startPt, ctrl, endPt, 0.0, 0.55, isSelected, conn.id);
        }
        if (hasTotalTarget) {
          this.renderTotalParticipationCurve(startPt, ctrl, endPt, 0.45, 1.0, isSelected, conn.id);
        }

        // Renderizar rótulo de cardinalidade formatado como par (ex: 1:N, N:N, 1:1, N:1)
        const formattedCard = this.getFormattedCardinality(conn);
        if (formattedCard) {
          const pt = this.getQuadraticBezierPoint(startPt, ctrl, endPt, 0.3);
          this.renderCardinalityBadgeAt(formattedCard, pt.x, pt.y);
        }

        // Renderizar rótulos de Papel (Role names) nas conexões se definidos
        if (conn.roleSource) {
          const pt = this.getQuadraticBezierPoint(startPt, ctrl, endPt, 0.5);
          this.renderRoleLabelAt(conn.roleSource, pt.x, pt.y - 14);
        }
        if (conn.roleTarget) {
          const pt = this.getQuadraticBezierPoint(startPt, ctrl, endPt, 0.7);
          this.renderRoleLabelAt(conn.roleTarget, pt.x, pt.y - 14);
        }
      });
    });
  }

  // --- OBTENÇÃO DE RATIO DE CARDINALIDADE FORMATADO (1:N, N:N, 1:1, N:1) ---
  getFormattedCardinality(conn) {
    if (conn.cardinalitySource && conn.cardinalityTarget) {
      return `${conn.cardinalitySource}:${conn.cardinalityTarget}`;
    }

    const primaryCard = conn.cardinalitySource || conn.cardinalityTarget;
    if (!primaryCard) return null;

    // Se já for um par (ex: "1:N")
    if (primaryCard.includes(':')) return primaryCard;

    // Buscar a conexão irmã no mesmo relacionamento para formar o par (ex: 1:N, N:1)
    const relId = [conn.sourceId, conn.targetId].find(id => {
      const elem = this.model.getElementById(id);
      return elem && elem.type === 'relationship';
    });

    if (relId) {
      const siblingConns = this.model.connections.filter(c => c.id !== conn.id && (c.sourceId === relId || c.targetId === relId));
      for (const sib of siblingConns) {
        const sibCard = sib.cardinalitySource || sib.cardinalityTarget;
        if (sibCard) {
          const cleanSibCard = sibCard.includes(':') ? sibCard.split(':')[0] : sibCard;
          return `${primaryCard}:${cleanSibCard}`;
        }
      }
    }

    // Formato padrão em dupla
    if (primaryCard === 'N' || primaryCard === 'M') return `${primaryCard}:1`;
    if (primaryCard === '1') return `1:N`;

    return primaryCard;
  }

  getQuadraticBezierPoint(p0, p1, p2, t) {
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
      y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y
    };
  }

  renderTotalParticipationCurve(p0, p1, p2, tStart, tEnd, isSelected, connId) {
    const steps = 8;
    let d = '';
    const offsetDistance = 3;

    for (let i = 0; i <= steps; i++) {
      const t = tStart + (tEnd - tStart) * (i / steps);
      const pt = this.getQuadraticBezierPoint(p0, p1, p2, t);

      // Tangente da curva
      const oneMinusT = 1 - t;
      const tx = 2 * oneMinusT * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
      const ty = 2 * oneMinusT * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
      const tLen = Math.hypot(tx, ty) || 1;

      // Normal da curva
      const nx = -ty / tLen;
      const ny = tx / tLen;

      const ox = pt.x + nx * offsetDistance;
      const oy = pt.y + ny * offsetDistance;

      if (i === 0) d += `M ${ox} ${oy}`;
      else d += ` L ${ox} ${oy}`;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('class', `connection-line total-side ${isSelected ? 'selected' : ''}`);
    path.setAttribute('data-conn-id', connId);
    this.connectionsLayer.appendChild(path);
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

  // --- CÁLCULO DE INTERSEÇÃO DE BORDAS DAS FORMAS (ROBUSTO E SEM NaN) ---
  calculateEdgeIntersection(elem, target) {
    const dx = target.x - elem.x;
    const dy = target.y - elem.y;

    // Casos particulares quando dx === 0 ou dy === 0
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return { x: elem.x, y: elem.y };
    }
    if (Math.abs(dx) < 0.001) {
      const signY = Math.sign(dy) || 1;
      const h = (elem.height || 40) / 2;
      return { x: elem.x, y: elem.y + signY * h };
    }
    if (Math.abs(dy) < 0.001) {
      const signX = Math.sign(dx) || 1;
      const w = (elem.width || 80) / 2;
      return { x: elem.x + signX * w, y: elem.y };
    }

    const angle = Math.atan2(dy, dx);
    const absCos = Math.abs(Math.cos(angle));
    const absSin = Math.abs(Math.sin(angle));

    if (elem.type === 'entity') {
      const w = elem.width / 2;
      const h = elem.height / 2;

      let x, y;
      if (absSin * w <= absCos * h) {
        x = Math.sign(dx) * w;
        y = Math.sign(dx) * w * Math.tan(angle);
      } else {
        y = Math.sign(dy) * h;
        x = Math.sign(dy) * (h / Math.tan(angle));
      }
      return { x: elem.x + x, y: elem.y + y };
    } else if (elem.type === 'attribute') {
      const rx = elem.width / 2;
      const ry = elem.height / 2;
      const tanA = Math.tan(angle);
      const x = (rx * ry) / Math.sqrt(ry * ry + rx * rx * tanA * tanA);
      const y = x * tanA;
      return {
        x: elem.x + Math.sign(dx) * Math.abs(x),
        y: elem.y + Math.sign(dy) * Math.abs(y)
      };
    } else if (elem.type === 'relationship') {
      const a = elem.width / 2;
      const b = elem.height / 2;
      const r = (a * b) / (b * absCos + a * absSin);
      return {
        x: elem.x + r * Math.cos(angle),
        y: elem.y + r * Math.sin(angle)
      };
    } else if (elem.type === 'specialization') {
      const r = 18;
      return {
        x: elem.x + r * Math.cos(angle),
        y: elem.y + r * Math.sin(angle)
      };
    }

    return { x: elem.x, y: elem.y };
  }
}
