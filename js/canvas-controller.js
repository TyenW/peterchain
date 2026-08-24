/**
 * DER Builder — Controlador de Interação do Canvas (Pan, Zoom, Drag, Select)
 */
class CanvasController {
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

    this.layers = {
      connectionsLayer: this.connectionsLayer,
      elementsLayer: this.elementsLayer,
      labelsLayer: this.labelsLayer
    };
    this.renderer = null;

    // Callbacks
    this.onSelectElement = null;

    // Inicialização
    this.initViewportTransform();
    this.model.subscribe(() => this.render());
  }

  setRenderer(renderer) {
    this.renderer = renderer;
    this.render();
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
    if (this.renderer) {
      this.renderer.setSelectionState(this.selectedElementIds, this.selectedConnectionId);
      this.renderer.setInvalidState(this.model.invalidIds);
      this.renderer.render();
    }
    this.updateElementCountDisplay();
  }

  updateElementCountDisplay() {
    const countEl = document.getElementById('info-elements-count');
    if (countEl) {
      const total = this.model.entities.length + this.model.attributes.length + this.model.relationships.length;
      countEl.textContent = `${total} elementos (${this.model.entities.length} E, ${this.model.attributes.length} A, ${this.model.relationships.length} R)`;
    }
  }

}
window.CanvasController = CanvasController;
