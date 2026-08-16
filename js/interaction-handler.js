/**
 * DER Builder — Manipulador de Interações com o Canvas (Ferramentas, Drag & Drop, Conexão e Zoom)
 */
class InteractionHandler {
  constructor(model, renderer) {
    this.model = model;
    this.renderer = renderer;
    this.container = renderer.container;
    this.svg = renderer.svg;

    // Ferramenta Ativa ('select', 'entity', 'attribute', 'relationship', 'connect', 'delete')
    this.activeTool = 'select';

    // Estados de Drag & Drop
    this.isDraggingElement = false;
    this.draggedElement = null;
    this.dragStartPos = { x: 0, y: 0 };
    this.elementStartPos = { x: 0, y: 0 };

    // Estados de Pan do Canvas
    this.isPanningCanvas = false;
    this.panStartPos = { x: 0, y: 0 };
    this.spacePressed = false;

    // Estado de Conexão entre Elementos
    this.connectSourceId = null;
    this.tempLine = null;

    this.initEventListeners();
  }

  setTool(toolName) {
    this.activeTool = toolName;
    this.cancelConnection();

    // Atualizar UI dos botões de ferramenta
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tool-${toolName}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Cursor feedback
    if (toolName === 'select') {
      this.container.style.cursor = 'default';
    } else if (toolName === 'delete') {
      this.container.style.cursor = 'crosshair';
    } else {
      this.container.style.cursor = 'pointer';
    }
  }

  initEventListeners() {
    // --- MOUSE DOWN ---
    this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));

    // --- MOUSE MOVE ---
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // --- MOUSE UP ---
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // --- MOUSE WHEEL (ZOOM) ---
    this.svg.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // --- TECLAS ATALHO (SPACEBAR, DELETE, UNDO, REDO) ---
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  handleMouseDown(e) {
    // Se o usuário clicar com o botão do meio ou estiver pressionando Espaço, inicia Pan do canvas
    if (e.button === 1 || this.spacePressed) {
      this.isPanningCanvas = true;
      this.panStartPos = { x: e.clientX, y: e.clientY };
      this.container.classList.add('panning');
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return; // Apenas clique esquerdo

    const canvasCoords = this.renderer.screenToCanvasCoordinates(e.clientX, e.clientY);
    const targetElementG = e.target.closest('.der-element');
    const targetConnLine = e.target.closest('.connection-line');

    // --- FERRAMENTA SELECIONAR ---
    if (this.activeTool === 'select') {
      if (targetElementG) {
        const id = targetElementG.getAttribute('data-id');
        this.renderer.selectElement(id);

        this.isDraggingElement = true;
        this.draggedElement = this.model.getElementById(id);
        this.dragStartPos = canvasCoords;
        this.elementStartPos = { x: this.draggedElement.x, y: this.draggedElement.y };
      } else if (targetConnLine) {
        const connId = targetConnLine.getAttribute('data-conn-id');
        this.renderer.selectConnection(connId);
      } else {
        // Clicou no fundo do canvas
        this.renderer.clearSelection();
        // Iniciar Pan do canvas se clicar no fundo limpo
        this.isPanningCanvas = true;
        this.panStartPos = { x: e.clientX, y: e.clientY };
        this.container.classList.add('panning');
      }
    }

    // --- FERRAMENTA ENTIDADE ---
    else if (this.activeTool === 'entity') {
      const name = prompt('Nome da nova Entidade:', 'ENTIDADE');
      if (name && name.trim()) {
        const entity = this.model.addEntity(name, canvasCoords.x, canvasCoords.y);
        this.renderer.selectElement(entity.id);
        this.setTool('select');
      }
    }

    // --- FERRAMENTA ATRIBUTO ---
    else if (this.activeTool === 'attribute') {
      const name = prompt('Nome do novo Atributo:', 'Nome');
      if (name && name.trim()) {
        let parentId = null;
        if (targetElementG) {
          parentId = targetElementG.getAttribute('data-id');
        }
        const attr = this.model.addAttribute(name, parentId, false, canvasCoords.x, canvasCoords.y);
        this.renderer.selectElement(attr.id);
        this.setTool('select');
      }
    }

    // --- FERRAMENTA RELACIONAMENTO ---
    else if (this.activeTool === 'relationship') {
      const name = prompt('Nome do novo Relacionamento:', 'RELACIONA');
      if (name && name.trim()) {
        const rel = this.model.addRelationship(name, canvasCoords.x, canvasCoords.y);
        this.renderer.selectElement(rel.id);
        this.setTool('select');
      }
    }

    // --- FERRAMENTA CONECTAR ---
    else if (this.activeTool === 'connect') {
      if (targetElementG) {
        const id = targetElementG.getAttribute('data-id');
        if (!this.connectSourceId) {
          // Primeiro elemento selecionado
          this.connectSourceId = id;
          this.showConnectionHint(true);
        } else {
          // Segundo elemento selecionado -> Conectar
          if (this.connectSourceId !== id) {
            this.model.addConnection(this.connectSourceId, id);
          }
          this.cancelConnection();
          this.setTool('select');
        }
      }
    }

    // --- FERRAMENTA EXCLUIR ---
    else if (this.activeTool === 'delete') {
      if (targetElementG) {
        const id = targetElementG.getAttribute('data-id');
        this.model.removeElement(id);
        this.renderer.clearSelection();
      } else if (targetConnLine) {
        const connId = targetConnLine.getAttribute('data-conn-id');
        this.model.removeConnection(connId);
        this.renderer.clearSelection();
      }
    }
  }

  handleMouseMove(e) {
    // 1. Arrastar elemento no canvas
    if (this.isDraggingElement && this.draggedElement) {
      const canvasCoords = this.renderer.screenToCanvasCoordinates(e.clientX, e.clientY);
      const dx = canvasCoords.x - this.dragStartPos.x;
      const dy = canvasCoords.y - this.dragStartPos.y;

      this.draggedElement.x = Math.round(this.elementStartPos.x + dx);
      this.draggedElement.y = Math.round(this.elementStartPos.y + dy);

      this.renderer.render();
      return;
    }

    // 2. Pan do Canvas
    if (this.isPanningCanvas) {
      const dx = e.clientX - this.panStartPos.x;
      const dy = e.clientY - this.panStartPos.y;
      this.renderer.setPan(dx, dy);
      this.panStartPos = { x: e.clientX, y: e.clientY };
      return;
    }
  }

  handleMouseUp(e) {
    this.isDraggingElement = false;
    this.draggedElement = null;

    if (this.isPanningCanvas) {
      this.isPanningCanvas = false;
      this.container.classList.remove('panning');
    }
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = this.svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.renderer.setZoom(this.renderer.zoomScale * zoomFactor, mouseX, mouseY);
  }

  cancelConnection() {
    this.connectSourceId = null;
    this.showConnectionHint(false);
  }

  showConnectionHint(show) {
    const hint = document.getElementById('connection-hint');
    if (hint) {
      if (show) hint.classList.remove('hidden');
      else hint.classList.add('hidden');
    }
  }

  handleKeyDown(e) {
    // Ignorar atalhos se o foco estiver num input ou textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space' && !this.spacePressed) {
      this.spacePressed = true;
      this.container.style.cursor = 'grab';
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.renderer.selectedElementId) {
        this.model.removeElement(this.renderer.selectedElementId);
        this.renderer.clearSelection();
      } else if (this.renderer.selectedConnectionId) {
        this.model.removeConnection(this.renderer.selectedConnectionId);
        this.renderer.clearSelection();
      }
    } else if (e.key === 'v' || e.key === 'V') {
      this.setTool('select');
    } else if (e.key === 'e' || e.key === 'E') {
      this.setTool('entity');
    } else if (e.key === 'a' || e.key === 'A') {
      this.setTool('attribute');
    } else if (e.key === 'r' || e.key === 'R') {
      this.setTool('relationship');
    } else if (e.key === 'c' || e.key === 'C') {
      this.setTool('connect');
    }
  }

  handleKeyUp(e) {
    if (e.code === 'Space') {
      this.spacePressed = false;
      this.container.style.cursor = 'default';
    }
  }
}
