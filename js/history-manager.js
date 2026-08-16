/**
 * DER Builder — Gerenciador de Histórico (Undo / Redo)
 */
class HistoryManager {
  constructor(model, maxHistory = 50) {
    this.model = model;
    this.maxHistory = maxHistory;
    this.undoStack = [];
    this.redoStack = [];
    this.isApplyingState = false;

    // Registrar estado inicial
    this.pushState();

    // Inscrever-se a alterações do modelo
    this.model.subscribe(() => {
      if (!this.isApplyingState) {
        this.pushState();
      }
    });
  }

  pushState() {
    const currentState = JSON.stringify(this.model.toJSON());
    
    // Evitar salvar duplicados se o estado for idêntico ao topo
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === currentState) {
      return;
    }

    this.undoStack.push(currentState);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    
    // Ao realizar nova ação, limpa a pilha de refazer
    this.redoStack = [];
    this.updateUIButtons();
  }

  undo() {
    if (this.undoStack.length <= 1) return false; // Deve manter pelo menos o estado inicial

    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);

    const previousState = this.undoStack[this.undoStack.length - 1];
    
    this.isApplyingState = true;
    this.model.fromJSON(JSON.parse(previousState));
    this.isApplyingState = false;

    this.updateUIButtons();
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;

    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);

    this.isApplyingState = true;
    this.model.fromJSON(JSON.parse(nextState));
    this.isApplyingState = false;

    this.updateUIButtons();
    return true;
  }

  updateUIButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    if (btnUndo) {
      btnUndo.disabled = this.undoStack.length <= 1;
      btnUndo.style.opacity = this.undoStack.length <= 1 ? '0.4' : '1';
    }

    if (btnRedo) {
      btnRedo.disabled = this.redoStack.length === 0;
      btnRedo.style.opacity = this.redoStack.length === 0 ? '0.4' : '1';
    }
  }
}
