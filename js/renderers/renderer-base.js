/**
 * DER Builder — Classe base para os renderizadores SVG.
 * 
 * Separa a lógica de desenho da lógica de interação (pan/zoom/drag)
 * que fica no CanvasController.
 */
class RendererBase {
  constructor(model, layers) {
    this.model = model;
    this.layers = layers; // { connectionsLayer, elementsLayer, labelsLayer }
    
    // Estado de seleção passado pelo CanvasController
    this.selectedElementIds = new Set();
    this.selectedConnectionId = null;
    this.invalidIds = new Set();
  }

  // Atualiza o estado visual para refletir a seleção sem precisar acoplar a lógica de interação
  setSelectionState(selectedElementIds, selectedConnectionId) {
    this.selectedElementIds = selectedElementIds;
    this.selectedConnectionId = selectedConnectionId;
  }

  setInvalidState(invalidIds) {
    this.invalidIds = invalidIds || new Set();
  }

  // Método principal chamado pelo Controller quando o modelo muda ou a tela precisa ser redesenhada
  render() {
    this.clearLayers();
    this.renderConnections();
    this.renderElements();
  }

  clearLayers() {
    if (this.layers.connectionsLayer) this.layers.connectionsLayer.innerHTML = '';
    if (this.layers.elementsLayer) this.layers.elementsLayer.innerHTML = '';
    if (this.layers.labelsLayer) this.layers.labelsLayer.innerHTML = '';
  }

  isElementSelected(id) {
    return this.selectedElementIds.has(id);
  }

  isConnectionSelected(id) {
    return this.selectedConnectionId === id;
  }
  
  isElementInvalid(id) {
    return this.invalidIds && this.invalidIds.has(id);
  }

  // Helper para SVG
  createSVGElement(tag, attributes = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const key in attributes) {
      if (attributes[key] !== undefined && attributes[key] !== null) {
        el.setAttribute(key, attributes[key]);
      }
    }
    return el;
  }

  // Helper para grupos
  createGroup(id, typeClass) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `der-element canvas-element ${typeClass}`);
    g.setAttribute('data-id', id);
    return g;
  }

  // --- Métodos Abstratos ---
  renderElements() {
    throw new Error('renderElements() não foi implementado pelo renderizador.');
  }

  renderConnections() {
    throw new Error('renderConnections() não foi implementado pelo renderizador.');
  }
}

// Export para não-módulos
window.RendererBase = RendererBase;
