/**
 * DER Builder — Tabular Visual Manager
 * Renders an interactive table/list for entities, attributes, and relationships,
 * and updates the diagram model when edited using custom modals instead of native prompts.
 */
class TabularManager {
  constructor(model, containerId) {
    this.model = model;
    this.container = document.getElementById(containerId);
    this.lastSignature = "";
  }

  getStructureSignature() {
    const entStr = this.model.entities.map(e => `${e.id}:${e.name}:${e.isWeak}`).join('|');
    const attrStr = this.model.attributes.map(a => `${a.id}:${a.name}:${a.parentId}:${a.isKey}:${a.isPartialKey}:${a.isMultivalued}:${a.isDerived}`).join('|');
    const relStr = this.model.relationships.map(r => `${r.id}:${r.name}:${r.isWeak}`).join('|');
    const connStr = this.model.connections.map(c => `${c.id}:${c.sourceId}:${c.targetId}:${c.cardinalitySource}:${c.cardinalityTarget}`).join('|');
    return `${entStr}#${attrStr}#${relStr}#${connStr}`;
  }

  render(force = false) {
    if (!this.container) return;
    
    // Prevent unneeded re-renders when only coordinates (x,y) change (e.g. during dragging)
    const currentSignature = this.getStructureSignature();
    if (!force && this.lastSignature === currentSignature) {
      return;
    }
    this.lastSignature = currentSignature;

    // Save scroll position
    const scrollParent = document.getElementById('panel-visual');
    const savedScrollTop = scrollParent ? scrollParent.scrollTop : 0;

    // Build HTML
    let html = `
      <div class="tabular-section">
        <div class="tabular-header">
          <h3>Entidades</h3>
          <button class="btn btn-sm btn-primary" onclick="window.tabularManager.addEntity()">+ Entidade</button>
        </div>
        <div class="tabular-list">
    `;

    if (this.model.entities.length === 0) {
      html += `<div class="tabular-empty">Nenhuma entidade cadastrada.</div>`;
    }

    this.model.entities.forEach(ent => {
      html += `
        <div class="tabular-item entity-item">
          <div class="item-info">
            <span class="item-name" title="${ent.name}">${ent.name}</span> 
            <span class="badge-sm ${ent.isWeak ? 'weak' : 'strong'}">${ent.isWeak ? 'Fraca' : 'Forte'}</span>
          </div>
          <div class="item-actions">
            <button class="btn-icon btn-sm" onclick="window.tabularManager.addAttribute('${ent.id}')" title="Adicionar Atributo">+</button>
            <button class="btn-icon btn-sm" onclick="window.tabularManager.editEntity('${ent.id}')" title="Editar">&#9998;</button>
            <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${ent.id}')" title="Excluir">&times;</button>
          </div>
        </div>
      `;

      // List attributes of this entity
      const renderAttributes = (parentId, depth = 1) => {
        const attrs = this.model.attributes.filter(a => a.parentId === parentId);
        if (attrs.length === 0) return '';
        
        let htmlSnippet = `<div class="tabular-sublist" style="padding-left: ${depth * 10}px;">`;
        attrs.forEach(attr => {
          let typeLabel = "Simples";
          let badgeClass = "";
          if (attr.isKey) { typeLabel = "PK"; badgeClass = "badge-pk"; }
          else if (attr.isPartialKey) { typeLabel = "PPK"; badgeClass = "badge-ppk"; }
          else if (attr.isMultivalued) { typeLabel = "Multi"; badgeClass = "badge-multi"; }
          else if (attr.isDerived) { typeLabel = "Deriv"; badgeClass = "badge-deriv"; }

          htmlSnippet += `
            <div class="tabular-item subitem">
              <div class="item-info">
                <span class="item-name" title="${attr.name}">${attr.name}</span>
                <span class="badge-sm ${badgeClass}">${typeLabel}</span>
              </div>
              <div class="item-actions">
                <button class="btn-icon btn-sm" onclick="window.tabularManager.addAttribute('${attr.id}')" title="Adicionar Sub-atributo">+</button>
                <button class="btn-icon btn-sm" onclick="window.tabularManager.editAttribute('${attr.id}')" title="Editar">&#9998;</button>
                <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${attr.id}')" title="Excluir">&times;</button>
              </div>
            </div>
          `;
          htmlSnippet += renderAttributes(attr.id, depth + 1);
        });
        htmlSnippet += `</div>`;
        return htmlSnippet;
      };

      html += renderAttributes(ent.id);
    });

    html += `
        </div>
      </div>
      
      <div class="tabular-divider"></div>
      
      <div class="tabular-section">
        <div class="tabular-header">
          <h3>Relacionamentos</h3>
          <button class="btn btn-sm btn-primary" onclick="window.tabularManager.addRelationship()">+ Relacionamento</button>
        </div>
        <div class="tabular-list">
    `;

    if (this.model.relationships.length === 0) {
      html += `<div class="tabular-empty">Nenhum relacionamento cadastrado.</div>`;
    }

    this.model.relationships.forEach(rel => {
      // Find connections for this relationship
      const conns = this.model.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      let connDesc = "";
      conns.forEach(c => {
        const entId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        const ent = this.model.entities.find(e => e.id === entId);
        if (ent) {
          const card = c.sourceId === rel.id ? c.cardinalityTarget : c.cardinalitySource;
          connDesc += `${ent.name} (${card || '?'}) `;
        }
      });

      html += `
        <div class="tabular-item rel-item">
          <div class="item-info">
            <span class="item-name" title="${rel.name}">${rel.name}</span>
            ${connDesc ? `<div class="rel-conn-desc">${connDesc}</div>` : ''}
          </div>
          <div class="item-actions">
            <button class="btn-icon btn-sm" onclick="window.tabularManager.editRelationship('${rel.id}')" title="Editar">&#9998;</button>
            <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${rel.id}')" title="Excluir">&times;</button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Restore scroll position
    if (scrollParent) {
      scrollParent.scrollTop = savedScrollTop;
    }
  }

  // --- CUSTOM MODAL SYSTEM ---

  openModal(title, fields, onConfirm) {
    const modal = document.getElementById('modal-custom');
    const modalTitle = document.getElementById('modal-custom-title');
    const modalBody = document.getElementById('modal-custom-body');
    const btnCancel = document.getElementById('btn-cancel-modal-custom');
    const btnConfirm = document.getElementById('btn-confirm-modal-custom');
    const btnClose = document.getElementById('btn-close-modal-custom');

    modalTitle.textContent = title;
    
    // Generate fields HTML
    let html = '';
    fields.forEach((f, idx) => {
      html += `<div style="margin-bottom: 16px;">`;
      if (f.label && f.type !== 'message') html += `<label class="form-label" for="modal-input-${idx}">${f.label}</label>`;
      
      if (f.type === 'text') {
        html += `<input type="text" class="form-control" id="modal-input-${idx}" value="${f.value || ''}" placeholder="${f.placeholder || ''}">`;
      } else if (f.type === 'checkbox') {
        html += `<label class="checkbox-label" style="margin-top: 6px;"><input type="checkbox" id="modal-input-${idx}" ${f.value ? 'checked' : ''}> ${f.text || 'Sim'}</label>`;
      } else if (f.type === 'select') {
        html += `<select class="form-control" id="modal-input-${idx}">`;
        f.options.forEach(opt => {
          html += `<option value="${opt.value}" ${f.value === opt.value ? 'selected' : ''}>${opt.text}</option>`;
        });
        html += `</select>`;
      } else if (f.type === 'message') {
        html += `<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">${f.value}</p>`;
      }
      html += `</div>`;
    });
    modalBody.innerHTML = html;

    // Show modal
    modal.classList.remove('hidden');

    // Clean up old listeners by cloning the buttons
    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
    
    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

    const newBtnClose = btnClose.cloneNode(true);
    btnClose.parentNode.replaceChild(newBtnClose, btnClose);

    // Focus first input
    setTimeout(() => {
      const firstInput = document.getElementById('modal-input-0');
      if (firstInput && firstInput.focus) firstInput.focus();
    }, 100);

    const closeModal = () => modal.classList.add('hidden');

    newBtnCancel.addEventListener('click', closeModal);
    newBtnClose.addEventListener('click', closeModal);

    newBtnConfirm.addEventListener('click', () => {
      const results = fields.map((f, idx) => {
        const el = document.getElementById(`modal-input-${idx}`);
        if (!el) return null;
        if (f.type === 'checkbox') return el.checked;
        if (f.type === 'message') return null;
        return el.value;
      });
      onConfirm(results);
      closeModal();
    });

    // Keyboard support: Enter to confirm, Escape to cancel
    const handleKeyDown = (e) => {
      if (modal.classList.contains('hidden')) {
        document.removeEventListener('keydown', handleKeyDown);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        newBtnConfirm.click();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }

  // --- ACTIONS ---

  addEntity() {
    this.openModal('Criar Nova Entidade', [
      { type: 'text', label: 'Nome da Entidade', placeholder: 'Ex: Funcionario' },
      { type: 'checkbox', label: '', text: 'Esta entidade é fraca?' }
    ], (results) => {
      const name = results[0]?.trim();
      if (!name) return;
      const isWeak = results[1];
      const res = this.model.addEntity(name, 0, 0, isWeak);
      const ent = res.element || res;
      if (ent) {
        this.render();
        this.openPropertyInspector(ent.id);
      }
    });
  }

  addAttribute(parentId = null) {
    this.openModal('Criar Novo Atributo', [
      { type: 'text', label: 'Nome do Atributo', placeholder: 'Ex: Nome, CPF, Data' },
      { type: 'checkbox', label: '', text: 'Chave Primária?' },
      { type: 'checkbox', label: '', text: 'Multivalorado?' },
      { type: 'checkbox', label: '', text: 'Derivado?' }
    ], (results) => {
      const name = results[0]?.trim();
      if (!name) return;
      const isKey = Boolean(results[1]);
      const isMultivalued = Boolean(results[2]);
      const isDerived = Boolean(results[3]);
      const attr = this.model.addAttribute(name, parentId, { isKey, isMultivalued, isDerived }, 0, 0);
      if (attr) {
        this.render();
        this.openPropertyInspector(attr.id);
      }
    });
  }

  addRelationship() {
    this.openModal('Criar Novo Relacionamento', [
      { type: 'text', label: 'Nome do Relacionamento', placeholder: 'Ex: SUPERVISAO, PERTENCE' },
      { type: 'checkbox', label: '', text: 'Relacionamento Identificador / Fraco (Losango Duplo)?' }
    ], (results) => {
      const name = results[0]?.trim();
      if (!name) return;
      const isWeak = Boolean(results[1]);
      const res = this.model.addRelationship(name, 0, 0, isWeak);
      const rel = res.element || res;
      if (rel) {
        this.render();
        this.openPropertyInspector(rel.id);
      }
    });
  }

  openPropertyInspector(id) {
    if (window.appController) {
      window.appController.selectElement(id);
    } else if (window.appPropertyEditor) {
      window.appPropertyEditor.show(id, 'element');
    }
  }

  editEntity(id) {
    this.openPropertyInspector(id);
  }

  editAttribute(id) {
    this.openPropertyInspector(id);
  }

  editRelationship(id) {
    this.openPropertyInspector(id);
  }

  deleteElement(id) {
    this.openModal('Confirmar Exclusão', [
      { type: 'message', label: '', value: 'Tem certeza que deseja excluir este elemento do modelo? Esta ação atualizará o diagrama.' }
    ], () => {
      this.model.removeElement(id);
    });
  }
}

// Export for app.js
window.TabularManager = TabularManager;
