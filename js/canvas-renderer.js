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
    // 1. Entidades (Retângulos)
    this.model.entities.forEach(entity => {
      const g = this.createGroup(entity.id, 'entity');
      const isSelected = this.selectedElementId === entity.id;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', entity.x - entity.width / 2);
      rect.setAttribute('y', entity.y - entity.height / 2);
      rect.setAttribute('width', entity.width);
      rect.setAttribute('height', entity.height);
      rect.setAttribute('class', 'entity-rect');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', entity.x);
      text.setAttribute('y', entity.y);
      text.setAttribute('class', 'element-text entity-text');
      text.textContent = entity.name;

      g.appendChild(rect);
      g.appendChild(text);
      if (isSelected) g.classList.add('selected');

      this.elementsLayer.appendChild(g);
    });

    // 2. Atributos (Elipses)
    this.model.attributes.forEach(attr => {
      const g = this.createGroup(attr.id, 'attribute');
      const isSelected = this.selectedElementId === attr.id;

      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('cx', attr.x);
      ellipse.setAttribute('cy', attr.y);
      ellipse.setAttribute('rx', attr.width / 2);
      ellipse.setAttribute('ry', attr.height / 2);
      ellipse.setAttribute('class', 'attribute-ellipse');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', attr.x);
      text.setAttribute('y', attr.y);
      text.setAttribute('class', `element-text attribute-text ${attr.isKey ? 'key-attribute' : ''}`);
      text.textContent = attr.name;

      g.appendChild(ellipse);
      g.appendChild(text);
      if (isSelected) g.classList.add('selected');

      this.elementsLayer.appendChild(g);
    });

    // 3. Relacionamentos (Losangos / Rhombus)
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

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', rel.x);
      text.setAttribute('y', rel.y);
      text.setAttribute('class', 'element-text relationship-text');
      text.textContent = rel.name;

      g.appendChild(polygon);
      g.appendChild(text);
      if (isSelected) g.classList.add('selected');

      this.elementsLayer.appendChild(g);
    });
  }

  createGroup(id, type) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `der-element der-${type}`);
    g.setAttribute('data-id', id);
    return g;
  }

  // --- RENDERIZAR CONEXÕES E CARDINALIDADES ---
  renderConnections() {
    this.model.connections.forEach(conn => {
      const source = this.model.getElementById(conn.sourceId);
      const target = this.model.getElementById(conn.targetId);

      if (!source || !target) return;

      const isSelected = this.selectedConnectionId === conn.id;

      // Calcular pontos de ancoragem nas bordas das formas
      const startPt = this.calculateEdgeIntersection(source, target);
      const endPt = this.calculateEdgeIntersection(target, source);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', startPt.x);
      line.setAttribute('y1', startPt.y);
      line.setAttribute('x2', endPt.x);
      line.setAttribute('y2', endPt.y);
      line.setAttribute('class', `connection-line ${isSelected ? 'selected' : ''}`);
      line.setAttribute('data-conn-id', conn.id);

      this.connectionsLayer.appendChild(line);

      // Renderizar rótulos de cardinalidade (ex: 1, N, M)
      if (conn.cardinalitySource) {
        this.renderCardinalityBadge(conn.cardinalitySource, startPt, endPt, 0.25);
      }
      if (conn.cardinalityTarget) {
        this.renderCardinalityBadge(conn.cardinalityTarget, startPt, endPt, 0.75);
      }
    });
  }

  renderCardinalityBadge(label, startPt, endPt, t) {
    // Ponto interpolado ao longo da linha
    const x = startPt.x + (endPt.x - startPt.x) * t;
    const y = startPt.y + (endPt.y - startPt.y) * t;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const badgeWidth = Math.max(22, label.length * 9 + 8);
    const badgeHeight = 20;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - badgeWidth / 2);
    rect.setAttribute('y', y - badgeHeight / 2);
    rect.setAttribute('width', badgeWidth);
    rect.setAttribute('height', badgeHeight);
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

  // --- CÁLCULO DE INTERSEÇÃO DE BORDAS DAS FORMAS ---
  calculateEdgeIntersection(elem, target) {
    const dx = target.x - elem.x;
    const dy = target.y - elem.y;
    const angle = Math.atan2(dy, dx);

    if (elem.type === 'entity') {
      // Retângulo
      const w = elem.width / 2;
      const h = elem.height / 2;
      const tanTheta = Math.abs(Math.tan(angle));

      let x, y;
      if (tanTheta * w <= h) {
        x = Math.sign(dx) * w;
        y = Math.sign(dx) * w * Math.tan(angle);
      } else {
        y = Math.sign(dy) * h;
        x = Math.sign(dy) * (h / Math.tan(angle));
      }
      return { x: elem.x + x, y: elem.y + y };
    } else if (elem.type === 'attribute') {
      // Elipse
      const rx = elem.width / 2;
      const ry = elem.height / 2;
      const x = (rx * ry) / Math.sqrt(ry * ry + rx * rx * Math.tan(angle) * Math.tan(angle));
      const y = x * Math.tan(angle);
      return {
        x: elem.x + Math.sign(dx) * Math.abs(x),
        y: elem.y + Math.sign(dy) * Math.abs(y)
      };
    } else if (elem.type === 'relationship') {
      // Losango (Rhombus)
      const a = elem.width / 2;
      const b = elem.height / 2;
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      const r = (a * b) / (b * absCos + a * absSin);
      return {
        x: elem.x + r * Math.cos(angle),
        y: elem.y + r * Math.sin(angle)
      };
    }

    return { x: elem.x, y: elem.y };
  }
}
