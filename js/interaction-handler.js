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
    this.draggedElements = [];
    this.dragStartPos = { x: 0, y: 0 };

    // Estados de Seleção por Caixa (Marquee Selection)
    this.isBoxSelecting = false;
    this.boxSelectStartPos = { x: 0, y: 0 };
    this.boxSelectInitialSelection = new Set();
    this.selectionBoxRect = null;

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
    // --- EVENTOS DE PONTEIRO (SUPORTE A MOUSE E TOUCH) ---
    this.svg.addEventListener('pointerdown', (e) => this.handleMouseDown(e));
    window.addEventListener('pointermove', (e) => this.handleMouseMove(e));
    window.addEventListener('pointerup', (e) => this.handleMouseUp(e));
    window.addEventListener('pointercancel', (e) => this.handleMouseUp(e));

    // --- MOUSE WHEEL (ZOOM) ---
    this.svg.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // --- TECLAS ATALHO (SPACEBAR, DELETE, CTRL+Z UNDO, CTRL+Y REDO) ---
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  createSelectionBoxOverlay() {
    this.removeSelectionBoxOverlay();
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', 'selection-marquee-box');
    rect.setAttribute('fill', 'rgba(2, 132, 199, 0.12)');
    rect.setAttribute('stroke', '#0284c7');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('stroke-dasharray', '4 3');
    rect.setAttribute('rx', '2');
    rect.setAttribute('pointer-events', 'none');
    
    const layer = this.renderer.tempLayer || this.renderer.svg;
    layer.appendChild(rect);
    this.selectionBoxRect = rect;
  }

  removeSelectionBoxOverlay() {
    if (this.selectionBoxRect) {
      this.selectionBoxRect.remove();
      this.selectionBoxRect = null;
    }
    const oldBox = document.getElementById('selection-marquee-box');
    if (oldBox) oldBox.remove();
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

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const canvasCoords = this.renderer.screenToCanvasCoordinates(e.clientX, e.clientY);
    const targetElementG = e.target.closest('.der-element, .canvas-element');
    const targetConnLine = e.target.closest('.connection-line, .connection-line');

    // --- FERRAMENTA SELECIONAR ---
    if (this.activeTool === 'select') {
      const isToggle = e.shiftKey || e.ctrlKey || e.metaKey;

      if (targetElementG) {
        const id = targetElementG.getAttribute('data-id');
        if (isToggle) {
          this.renderer.selectElement(id, true);
        } else {
          if (!this.renderer.isElementSelected(id)) {
            this.renderer.selectElement(id, false);
          }
        }

        const selectedElems = this.renderer.getSelectedElements();
        if (selectedElems.length > 0) {
          this.isDraggingElement = true;
          this.draggedElements = selectedElems.map(el => ({
            element: el,
            startPos: { x: el.x, y: el.y }
          }));
          this.dragStartPos = canvasCoords;
        }
      } else if (targetConnLine) {
        const connId = targetConnLine.getAttribute('data-conn-id');
        this.renderer.selectConnection(connId);

        // Arrasto direto da Linha para determinar a Face
        this.isDraggingConnection = true;
        this.draggedConnection = this.model.connections.find(c => c.id === connId);
        this.dragStartPos = canvasCoords;
      } else {
        // Clicou no fundo do canvas
        if (!isToggle) {
          this.renderer.clearSelection();
        }

        // Iniciar seleção por caixa (Marquee)
        this.isBoxSelecting = true;
        this.boxSelectStartPos = canvasCoords;
        this.boxSelectInitialSelection = new Set(this.renderer.selectedElementIds);
        this.createSelectionBoxOverlay();
      }
      e.preventDefault();
    }

    // --- FERRAMENTA ENTIDADE ---
    else if (this.activeTool === 'entity') {
      const name = prompt('Nome da nova Entidade:', 'ENTIDADE');
      if (name && name.trim()) {
        const res = this.model.addEntity(name, canvasCoords.x, canvasCoords.y);
        const entity = res.element || res;
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
        const res = this.model.addRelationship(name, canvasCoords.x, canvasCoords.y);
        const rel = res.element || res;
        this.renderer.selectElement(rel.id);
        this.setTool('select');
      }
    }

    // --- FERRAMENTA CONECTAR COM VALIDAÇÃO SEMÂNTICA ---
    else if (this.activeTool === 'connect') {
      if (targetElementG) {
        const id = targetElementG.getAttribute('data-id');
        if (!this.connectSourceId) {
          this.connectSourceId = id;
          this.showConnectionHint(true);
        } else {
          if (this.connectSourceId !== id) {
            const src = this.model.getElementById(this.connectSourceId);
            const tgt = this.model.getElementById(id);

            // Validação semântica das conexões na notação de Chen
            if (src && tgt) {
              if (src.type === 'entity' && tgt.type === 'entity') {
                alert('Na notação de Peter Chen, Entidades não se conectam diretamente. Crie um Relacionamento (Losango) entre elas.');
              } else {
                // Atributos conectados a outros Atributos são permitidos (Atributos Compostos)
                if (src.type === 'attribute' && tgt.type === 'attribute') {
                  tgt.parentId = src.id; // Vincula como sub-atributo
                  this.model.addConnection(this.connectSourceId, id);
                  this.cancelConnection();
                  this.setTool('select');
                  return;
                }

                // Padronização: ao conectar Entidade <-> Relacionamento, sempre gravar como Entidade -> Relacionamento
                if (src.type === 'entity' && tgt.type === 'relationship') {
                  const isTotalSource = Boolean(tgt.isWeak && src.isWeak);
                  const connExists = this.model.connections.some(c => (c.sourceId === src.id && c.targetId === tgt.id) || (c.sourceId === tgt.id && c.targetId === src.id));
                  this.model.addConnection(src.id, tgt.id, 'N', '', { isTotalSource, forceNew: connExists });

                  // Modo n-ário: mantém o relacionamento como âncora para conectar outras entidades
                  this.connectSourceId = tgt.id;
                  this.showConnectionHint(true);
                  return;
                }

                if (src.type === 'relationship' && tgt.type === 'entity') {
                  const isTotalSource = Boolean(src.isWeak && tgt.isWeak);
                  const connExists = this.model.connections.some(c => (c.sourceId === src.id && c.targetId === tgt.id) || (c.sourceId === tgt.id && c.targetId === src.id));
                  this.model.addConnection(tgt.id, src.id, 'N', '', { isTotalSource, forceNew: connExists });

                  // Modo n-ário: mantém o relacionamento como âncora para conectar outras entidades
                  this.connectSourceId = src.id;
                  this.showConnectionHint(true);
                  return;
                }

                // Demais combinações seguem fluxo original
                this.model.addConnection(this.connectSourceId, id);
              }
            }
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
    if (this.isBoxSelecting && this.selectionBoxRect) {
      const canvasCoords = this.renderer.screenToCanvasCoordinates(e.clientX, e.clientY);
      const x = Math.min(this.boxSelectStartPos.x, canvasCoords.x);
      const y = Math.min(this.boxSelectStartPos.y, canvasCoords.y);
      const width = Math.abs(canvasCoords.x - this.boxSelectStartPos.x);
      const height = Math.abs(canvasCoords.y - this.boxSelectStartPos.y);

      this.selectionBoxRect.setAttribute('x', x);
      this.selectionBoxRect.setAttribute('y', y);
      this.selectionBoxRect.setAttribute('width', width);
      this.selectionBoxRect.setAttribute('height', height);

      if (width > 3 || height > 3) {
        const intersectedIds = [];
        const allElements = this.model.getAllElements();

        allElements.forEach(el => {
          let elW = el.width || 90;
          let elH = el.height || 50;
          if (el.type === 'specialization') {
            elW = 36;
            elH = 36;
          }

          const elMinX = el.x - elW / 2;
          const elMaxX = el.x + elW / 2;
          const elMinY = el.y - elH / 2;
          const elMaxY = el.y + elH / 2;

          const boxMinX = x;
          const boxMaxX = x + width;
          const boxMinY = y;
          const boxMaxY = y + height;

          const intersects = (elMinX <= boxMaxX && elMaxX >= boxMinX && elMinY <= boxMaxY && elMaxY >= boxMinY);
          if (intersects) {
            intersectedIds.push(el.id);
          }
        });

        const isAppend = e.shiftKey || e.ctrlKey || e.metaKey;
        if (isAppend) {
          const combined = new Set(this.boxSelectInitialSelection);
          intersectedIds.forEach(id => combined.add(id));
          this.renderer.selectMultipleElements(Array.from(combined));
        } else {
          this.renderer.selectMultipleElements(intersectedIds);
        }
      }
      return;
    }

    if (this.isDraggingElement && this.draggedElements && this.draggedElements.length > 0) {
      const canvasCoords = this.renderer.screenToCanvasCoordinates(e.clientX, e.clientY);
      const dx = canvasCoords.x - this.dragStartPos.x;
      const dy = canvasCoords.y - this.dragStartPos.y;

      const anchor = this.draggedElements[0];
      let anchorTargetX = Math.round((anchor.startPos.x + dx) / 10) * 10;
      let anchorTargetY = Math.round((anchor.startPos.y + dy) / 10) * 10;

      const selectedIds = new Set(this.draggedElements.map(item => item.element.id));
      const allOtherElements = this.model.getAllElements().filter(el => !selectedIds.has(el.id));
      
      const snapThreshold = 8;
      let alignedX = null;
      let alignedY = null;

      for (const other of allOtherElements) {
        if (Math.abs(anchorTargetX - other.x) < snapThreshold) {
          anchorTargetX = other.x;
          alignedX = other.x;
        }
        if (Math.abs(anchorTargetY - other.y) < snapThreshold) {
          anchorTargetY = other.y;
          alignedY = other.y;
        }
      }

      const finalDx = anchorTargetX - anchor.startPos.x;
      const finalDy = anchorTargetY - anchor.startPos.y;

      this.draggedElements.forEach(item => {
        item.element.x = Math.round((item.startPos.x + finalDx) / 10) * 10;
        item.element.y = Math.round((item.startPos.y + finalDy) / 10) * 10;
      });

      this.renderer.render();
      this.model.notify();
      this.renderAlignmentGuides(alignedX, alignedY, anchor.element);
      return;
    }

    // --- ARRASTO DIRETO DA LINHA DE CONEXÃO ---
    if (this.isDraggingConnection && this.draggedConnection) {
      const canvasCoords = this.renderer.screenToCanvasCoordinates(e.clientX, e.clientY);
      const sourceElem = this.model.getElementById(this.draggedConnection.sourceId);
      const targetElem = this.model.getElementById(this.draggedConnection.targetId);

      if (sourceElem && targetElem) {
        const isAttr = sourceElem.type === 'attribute' || targetElem.type === 'attribute';

        if (!isAttr) {
          const distSource = Math.hypot(canvasCoords.x - sourceElem.x, canvasCoords.y - sourceElem.y);
          const distTarget = Math.hypot(canvasCoords.x - targetElem.x, canvasCoords.y - targetElem.y);

          if (distSource < 70) {
            const dx = canvasCoords.x - sourceElem.x;
            const dy = canvasCoords.y - sourceElem.y;
            this.draggedConnection.faceSource = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north');
          } else if (distTarget < 70) {
            const dx = canvasCoords.x - targetElem.x;
            const dy = canvasCoords.y - targetElem.y;
            this.draggedConnection.faceTarget = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'east' : 'west') : (dy >= 0 ? 'south' : 'north');
          } else {
            const dxTotal = targetElem.x - sourceElem.x;
            const dyTotal = targetElem.y - sourceElem.y;

            if (Math.abs(dxTotal) >= Math.abs(dyTotal) && Math.abs(dxTotal) > 20) {
              const dragRelX = (canvasCoords.x - sourceElem.x) / dxTotal;
              this.draggedConnection.midOffset = Math.max(0.05, Math.min(0.95, dragRelX));
            } else if (Math.abs(dyTotal) > 20) {
              const dragRelY = (canvasCoords.y - sourceElem.y) / dyTotal;
              this.draggedConnection.midOffset = Math.max(0.05, Math.min(0.95, dragRelY));
            }
          }
        }
      }

      this.renderer.render();
      return;
    }

    if (this.isPanningCanvas) {
      const dx = e.clientX - this.panStartPos.x;
      const dy = e.clientY - this.panStartPos.y;
      this.renderer.setPan(dx, dy);
      this.panStartPos = { x: e.clientX, y: e.clientY };
      return;
    }
  }

  renderAlignmentGuides(alignX, alignY, activeElem) {
    this.removeAlignmentGuides();

    if (alignX === null && alignY === null) return;

    const svgLayer = this.renderer.labelsLayer || this.renderer.svg;

    if (alignX !== null) {
      const lineX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineX.setAttribute('x1', alignX);
      lineX.setAttribute('y1', activeElem.y - 1000);
      lineX.setAttribute('x2', alignX);
      lineX.setAttribute('y2', activeElem.y + 1000);
      lineX.setAttribute('stroke', '#38bdf8');
      lineX.setAttribute('stroke-width', '1.5');
      lineX.setAttribute('stroke-dasharray', '4 3');
      lineX.setAttribute('class', 'alignment-guide-line');
      svgLayer.appendChild(lineX);
    }

    if (alignY !== null) {
      const lineY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineY.setAttribute('x1', activeElem.x - 1000);
      lineY.setAttribute('y1', alignY);
      lineY.setAttribute('x2', activeElem.x + 1000);
      lineY.setAttribute('y2', alignY);
      lineY.setAttribute('stroke', '#38bdf8');
      lineY.setAttribute('stroke-width', '1.5');
      lineY.setAttribute('stroke-dasharray', '4 3');
      lineY.setAttribute('class', 'alignment-guide-line');
      svgLayer.appendChild(lineY);
    }
  }

  removeAlignmentGuides() {
    document.querySelectorAll('.alignment-guide-line').forEach(el => el.remove());
  }

  handleMouseUp(e) {
    this.removeAlignmentGuides();
    this.removeSelectionBoxOverlay();

    this.isBoxSelecting = false;

    if (this.isDraggingConnection && this.draggedConnection) {
      this.model.notify();
    }

    this.isDraggingConnection = false;
    this.draggedConnection = null;

    if (this.isDraggingElement && this.draggedElements && this.draggedElements.length > 0) {
      let moved = false;
      for (const item of this.draggedElements) {
        if (item.element.x !== item.startPos.x || item.element.y !== item.startPos.y) {
          moved = true;
          break;
        }
      }
      if (moved) {
        this.model.notify();
      }
    }

    this.isDraggingElement = false;
    this.draggedElements = [];

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
    // Atalhos globais Ctrl+Z / Ctrl+Y (mesmo com foco fora de inputs)
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'z') {
        if (e.shiftKey) {
          if (window.appHistoryManager) window.appHistoryManager.redo();
        } else {
          if (window.appHistoryManager) window.appHistoryManager.undo();
        }
        e.preventDefault();
        return;
      } else if (key === 'y') {
        if (window.appHistoryManager) window.appHistoryManager.redo();
        e.preventDefault();
        return;
      }
    }

    // Ignorar outros atalhos simples se o foco estiver num input ou textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space' && !this.spacePressed) {
      this.spacePressed = true;
      this.container.style.cursor = 'grab';
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.renderer.selectedElementIds && this.renderer.selectedElementIds.size > 0) {
        const idsToRemove = Array.from(this.renderer.selectedElementIds);
        idsToRemove.forEach(id => this.model.removeElement(id));
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
