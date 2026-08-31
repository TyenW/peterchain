/**
 * DER Builder — Inspetor de Propriedades do Elemento Selecionado (Notação Peter Chen & EER)
 */
class PropertyEditor {
  constructor(model, renderer) {
    this.model = model;
    this.renderer = renderer;
    this.panel = document.getElementById('property-inspector');
    this.titleEl = document.getElementById('inspector-title');
    this.bodyEl = document.getElementById('inspector-body');

    this.init();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init() {
    this.renderer.onSelectElement = (id, type, selectedSet) => {
      if (!id && (!selectedSet || selectedSet.size === 0)) {
        this.hide();
      } else if (selectedSet && selectedSet.size > 1) {
        this.showMultiSelection(selectedSet.size);
      } else if (id) {
        this.show(id, type);
      }
    };

    document.getElementById('btn-close-inspector').addEventListener('click', () => this.hide());
  }

  show(id, selectionType) {
    this.bodyEl.innerHTML = '';
    this.panel.classList.remove('hidden');
    if (this.titleEl) this.titleEl.textContent = 'Propriedades do Elemento';

    if (selectionType === 'element') {
      const elem = this.model.getElementById(id);
      if (!elem) return;

      if (elem.type === 'entity') this.renderEntityEditor(elem);
      else if (elem.type === 'attribute') this.renderAttributeEditor(elem);
      else if (elem.type === 'relationship') this.renderRelationshipEditor(elem);
      else if (elem.type === 'specialization') this.renderSpecializationEditor(elem);
    } else if (selectionType === 'connection') {
      const conn = this.model.connections.find(c => c.id === id);
      if (conn) this.renderConnectionEditor(conn);
    }
  }

  showMultiSelection(count) {
    this.bodyEl.innerHTML = '';
    this.panel.classList.remove('hidden');
    if (this.titleEl) this.titleEl.textContent = 'Seleção Múltipla';

    const div = document.createElement('div');
    div.style.padding = '12px 16px';
    div.style.fontSize = '13px';
    div.style.color = '#334155';
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <span style="background:#0284c7; color:#ffffff; font-weight:bold; font-size:12px; padding:2px 8px; border-radius:12px;">${count}</span>
        <strong style="color:#0f172a;">Elementos Selecionados</strong>
      </div>
      <p style="margin-bottom:8px; line-height:1.4;">Você pode arrastar qualquer um dos elementos selecionados para mover o grupo inteiro pelo canvas mantendo o alinhamento relativo.</p>
      <p style="margin-bottom:14px; line-height:1.4;">Pressione a tecla <kbd style="background:#e2e8f0; color:#334155; padding:2px 6px; border-radius:4px; font-family:monospace;">Delete</kbd> ou clique no botão abaixo para excluir todos.</p>
      <button id="btn-delete-multi" class="btn btn-danger btn-block" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 12px; font-weight:600;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        Excluir ${count} Elementos
      </button>
    `;
    this.bodyEl.appendChild(div);

    const deleteBtn = div.querySelector('#btn-delete-multi');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.renderer.selectedElementIds && this.renderer.selectedElementIds.size > 0) {
          const idsToRemove = Array.from(this.renderer.selectedElementIds);
          idsToRemove.forEach(id => this.model.removeElement(id));
          this.renderer.clearSelection();
        }
      });
    }
  }

  hide() {
    this.panel.classList.add('hidden');
  }

  // --- ENTIDADE ---
  renderEntityEditor(entity) {
    this.titleEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg> Entidade`;

    const html = `
      <div class="form-group">
        <label>Nome da Entidade</label>
        <input type="text" id="prop-name" value="${this.escapeHtml(entity.name)}">
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-weak" ${entity.isWeak ? 'checked' : ''}>
          <span>Entidade Fraca (Borda Dupla)</span>
        </label>
      </div>
      
      <div class="form-group" style="margin-top: 10px;">
        <button id="prop-btn-delete" class="btn btn-secondary danger" style="width:100%; justify-content:center;">Excluir Entidade</button>
      </div>
    `;
    this.bodyEl.innerHTML = html;

    const nameInput = document.getElementById('prop-name');
    nameInput.addEventListener('change', (e) => {
      entity.name = e.target.value.toUpperCase();
      entity.width = Math.max(120, entity.name.length * 10 + 30);
      this.model.notify();
    });

    document.getElementById('prop-is-weak').addEventListener('change', (e) => {
      entity.isWeak = e.target.checked;
      this.model.notify();
    });

    document.getElementById('prop-btn-delete').addEventListener('click', () => {
      this.model.removeElement(entity.id);
      this.renderer.clearSelection();
    });
  }

  // --- ATRIBUTO ---
  renderAttributeEditor(attr) {
    this.titleEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg> Atributo`;

    // Sub-atributos atualmente vinculados a este atributo
    const childAttrs = this.model.attributes.filter(a => a.parentId === attr.id);
    
    // Atributos candidatos que podem ser vinculados como sub-atributos
    const candidateAttrs = this.model.attributes.filter(a => a.id !== attr.id && a.parentId !== attr.id);
    const candidateOptions = candidateAttrs.map(a => 
      `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`
    ).join('');

    // Opções de Elemento Pai (Entidade, Relacionamento ou outro Atributo)
    const parentEntityOptions = this.model.entities.map(e => 
      `<option value="${e.id}" ${attr.parentId === e.id ? 'selected' : ''}>Entidade: ${this.escapeHtml(e.name)}</option>`
    ).join('');

    const parentRelOptions = this.model.relationships.map(r => 
      `<option value="${r.id}" ${attr.parentId === r.id ? 'selected' : ''}>Relacionamento: ${this.escapeHtml(r.name)}</option>`
    ).join('');
    
    const parentAttrOptions = this.model.attributes
      .filter(a => a.id !== attr.id && a.parentId !== attr.id)
      .map(a => `<option value="${a.id}" ${attr.parentId === a.id ? 'selected' : ''}>Atributo Pai: ${this.escapeHtml(a.name)}</option>`)
      .join('');

    const html = `
      <div class="form-group">
        <label>Nome do Atributo</label>
        <input type="text" id="prop-name" value="${this.escapeHtml(attr.name)}">
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-key" ${attr.isKey ? 'checked' : ''}>
          <span>Chave Primária (Sublinhado Sólido)</span>
        </label>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-partial-key" ${attr.isPartialKey ? 'checked' : ''}>
          <span>Chave Parcial / Discriminador (Sublinhado Tracejado)</span>
        </label>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-multivalued" ${attr.isMultivalued ? 'checked' : ''}>
          <span>Multivalorado (Borda Dupla)</span>
        </label>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-derived" ${attr.isDerived ? 'checked' : ''}>
          <span>Derivado (Borda Tracejada)</span>
        </label>
      </div>

      <div class="form-group">
        <label>Vínculo Superior (Pai)</label>
        <select id="prop-parent">
          <option value="">-- Sem Vinculo --</option>
          ${parentEntityOptions ? `<optgroup label="Entidades">${parentEntityOptions}</optgroup>` : ''}
          ${parentRelOptions ? `<optgroup label="Relacionamentos">${parentRelOptions}</optgroup>` : ''}
          ${parentAttrOptions ? `<optgroup label="Atributos Compostos">${parentAttrOptions}</optgroup>` : ''}
        </select>
      </div>

      <!-- Seção de Atributo Composto (Sub-atributos) -->
      <div class="form-group" style="border-top:1px solid rgba(0, 240, 255, 0.15); padding-top:12px; margin-top:8px;">
        <label style="color:var(--accent-light); font-weight:700;">Sub-atributos (Atributo Composto)</label>
        
        ${childAttrs.length === 0 ? '<p style="font-size:11px; color:var(--text-muted); margin:4px 0;">Nenhum sub-atributo associado.</p>' : ''}
        ${childAttrs.map(child => `
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(4,7,17,0.7); border:1px solid rgba(0,240,255,0.2); border-radius:6px; padding:6px 10px; margin-bottom:4px;">
            <span style="font-size:12px; color:var(--text-main); font-weight:600;">${this.escapeHtml(child.name)}</span>
            <button class="btn btn-secondary danger prop-child-remove" data-child-id="${child.id}" style="padding:2px 6px; font-size:10px;" title="Desvincular Sub-atributo">&times;</button>
          </div>
        `).join('')}

        <!-- Criar Novo Sub-atributo -->
        <div style="display:flex; gap:6px; margin-top:8px;">
          <input type="text" id="prop-new-subattr-name" placeholder="Novo sub-atributo..." style="flex:1; padding:6px 8px; font-size:12px;">
          <button id="prop-btn-add-subattr" class="btn btn-primary" style="padding:6px 10px; font-size:11px;">+ Criar</button>
        </div>

        <!-- Vincular Atributo Existente -->
        ${candidateAttrs.length > 0 ? `
          <div style="display:flex; gap:6px; margin-top:6px;">
            <select id="prop-link-subattr-select" style="flex:1; padding:6px 8px; font-size:12px;">
              <option value="">-- Vincular Existente --</option>
              ${candidateOptions}
            </select>
            <button id="prop-btn-link-subattr" class="btn btn-secondary" style="padding:6px 10px; font-size:11px;">+ Vincular</button>
          </div>
        ` : ''}
      </div>

      <div class="form-group" style="margin-top: 12px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px;">
        <button id="prop-btn-delete" class="btn btn-secondary danger" style="width:100%; justify-content:center;">Excluir Atributo</button>
      </div>
    `;
    this.bodyEl.innerHTML = html;

    document.getElementById('prop-name').addEventListener('change', (e) => {
      attr.name = e.target.value;
      attr.width = Math.max(90, attr.name.length * 8 + 24);
      this.model.notify();
    });

    document.getElementById('prop-is-key').addEventListener('change', (e) => {
      attr.isKey = e.target.checked;
      if (attr.isKey) attr.isPartialKey = false;
      this.model.notify();
    });

    document.getElementById('prop-is-partial-key').addEventListener('change', (e) => {
      attr.isPartialKey = e.target.checked;
      if (attr.isPartialKey) attr.isKey = false;
      this.model.notify();
    });

    document.getElementById('prop-is-multivalued').addEventListener('change', (e) => {
      attr.isMultivalued = e.target.checked;
      this.model.notify();
    });

    document.getElementById('prop-is-derived').addEventListener('change', (e) => {
      attr.isDerived = e.target.checked;
      this.model.notify();
    });

    document.getElementById('prop-parent').addEventListener('change', (e) => {
      const newParentId = e.target.value || null;
      if (attr.parentId !== newParentId) {
        if (attr.parentId) {
          const oldConn = this.model.connections.find(c => (c.sourceId === attr.id && c.targetId === attr.parentId) || (c.sourceId === attr.parentId && c.targetId === attr.id));
          if (oldConn) this.model.removeConnection(oldConn.id);
        }
        attr.parentId = newParentId;
        if (newParentId) {
          this.model.addConnection(attr.id, newParentId);
        }
        this.model.notify();
      }
    });

    // Handler para criar novo sub-atributo
    const btnAddSub = document.getElementById('prop-btn-add-subattr');
    const inputNewSub = document.getElementById('prop-new-subattr-name');
    if (btnAddSub && inputNewSub) {
      const createSub = () => {
        const subName = inputNewSub.value.trim();
        if (subName) {
          this.model.addAttribute(subName, attr.id);
          this.renderAttributeEditor(attr);
        }
      };
      btnAddSub.addEventListener('click', createSub);
      inputNewSub.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          createSub();
        }
      });
    }

    // Handler para vincular atributo existente
    const btnLinkSub = document.getElementById('prop-btn-link-subattr');
    const selectLinkSub = document.getElementById('prop-link-subattr-select');
    if (btnLinkSub && selectLinkSub) {
      btnLinkSub.addEventListener('click', () => {
        const childId = selectLinkSub.value;
        if (childId) {
          const child = this.model.attributes.find(a => a.id === childId);
          if (child) {
            if (child.parentId) {
              const oldConn = this.model.connections.find(c => (c.sourceId === child.id && c.targetId === child.parentId) || (c.sourceId === child.parentId && c.targetId === child.id));
              if (oldConn) this.model.removeConnection(oldConn.id);
            }
            child.parentId = attr.id;
            this.model.addConnection(child.id, attr.id);
            this.model.notify();
            this.renderAttributeEditor(attr);
          }
        }
      });
    }

    // Handler para remover vínculo de sub-atributo
    this.bodyEl.querySelectorAll('.prop-child-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const childId = e.currentTarget.getAttribute('data-child-id');
        const child = this.model.attributes.find(a => a.id === childId);
        if (child) {
          const oldConn = this.model.connections.find(c => (c.sourceId === child.id && c.targetId === attr.id) || (c.sourceId === attr.id && c.targetId === child.id));
          if (oldConn) this.model.removeConnection(oldConn.id);
          child.parentId = null;
          this.model.notify();
          this.renderAttributeEditor(attr);
        }
      });
    });

    document.getElementById('prop-btn-delete').addEventListener('click', () => {
      this.model.removeElement(attr.id);
      this.renderer.clearSelection();
    });
  }

  // --- RELACIONAMENTO ---
  renderRelationshipEditor(rel) {
    this.titleEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 22 12 12 21 2 12"/></svg> Relacionamento`;

    const relConns = this.model.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
    const participantConns = relConns
      .map(conn => {
        const otherId = conn.sourceId === rel.id ? conn.targetId : conn.sourceId;
        const entity = this.model.entities.find(e => e.id === otherId);
        if (!entity) return null;

        const entityIsSource = conn.sourceId === entity.id;
        const cardVal = entityIsSource ? (conn.cardinalitySource || '') : (conn.cardinalityTarget || '');
        const roleVal = entityIsSource ? (conn.roleSource || '') : (conn.roleTarget || '');
        const totalVal = entityIsSource
          ? (conn.isTotalSource !== undefined ? Boolean(conn.isTotalSource) : Boolean(conn.isTotal))
          : (conn.isTotalTarget !== undefined ? Boolean(conn.isTotalTarget) : Boolean(conn.isTotal));

        return { conn, entity, entityIsSource, cardVal, roleVal, totalVal };
      })
      .filter(Boolean);

    // Atributos vinculados a este relacionamento
    const relAttrs = this.model.attributes.filter(a => a.parentId === rel.id);
    
    // Atributos sem pai que podem ser vinculados ao relacionamento
    const candidateRelAttrs = this.model.attributes.filter(a => !a.parentId);
    const candidateRelOptions = candidateRelAttrs.map(a => 
      `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`
    ).join('');

    const availableEntities = this.model.entities;
    const addEntityOptions = availableEntities
      .map(e => `<option value="${e.id}">${this.escapeHtml(e.name)}</option>`)
      .join('');

    const html = `
      <div class="form-group">
        <label>Nome do Relacionamento</label>
        <input type="text" id="prop-name" value="${this.escapeHtml(rel.name)}">
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-weak-rel" ${rel.isWeak ? 'checked' : ''}>
          <span>Relacionamento Identificador / Fraco (Losango Duplo)</span>
        </label>
      </div>

      <div class="form-group">
        <label>Participantes do Relacionamento</label>
        ${participantConns.length === 0 ? '<p style="font-size:11px; color:var(--text-muted);">Nenhuma entidade conectada.</p>' : ''}
        ${participantConns.map((item) => `
          <div style="background:rgba(4,7,17,0.8); border:1px solid rgba(0,240,255,0.25); border-radius:10px; padding:10px 12px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
              <span style="font-size:13px; font-weight:700; color:var(--accent-light);">${this.escapeHtml(item.entity.name)}</span>
              <button class="btn btn-secondary danger prop-rel-remove" data-conn-id="${item.conn.id}" style="padding:3px 8px; font-size:11px; flex-shrink:0;">Remover</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:11px; font-weight:600; color:var(--text-muted); width:80px; flex-shrink:0; text-transform:uppercase;">Cardinalidade:</label>
                <select class="prop-rel-card" data-conn-id="${item.conn.id}" data-entity-source="${item.entityIsSource}" title="Cardinalidade" style="flex:1; padding:6px 8px; font-size:12px;">
                  <option value="">-- Sem Cardinalidade --</option>
                  <option value="1" ${item.cardVal === '1' ? 'selected' : ''}>1</option>
                  <option value="N" ${item.cardVal === 'N' || item.cardVal === 'M' ? 'selected' : ''}>N</option>
                </select>
              </div>

              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:11px; font-weight:600; color:var(--text-muted); width:80px; flex-shrink:0; text-transform:uppercase;">Papel / Role:</label>
                <input type="text" class="prop-rel-role" data-conn-id="${item.conn.id}" data-entity-source="${item.entityIsSource}" placeholder="Ex.: supervisor, item..." value="${this.escapeHtml(item.roleVal)}" style="flex:1; min-width:0; padding:6px 8px; font-size:12px;">
              </div>
            </div>

            <label class="checkbox-label" style="font-size:12px; margin:0;">
              <input type="checkbox" class="prop-rel-total" data-conn-id="${item.conn.id}" data-entity-source="${item.entityIsSource}" ${item.totalVal ? 'checked' : ''}>
              <span>Participação Total em ${this.escapeHtml(item.entity.name)}</span>
            </label>
          </div>
        `).join('')}
      </div>

      <div class="form-group">
        <label>Adicionar Participante</label>
        <div style="display:flex; gap:6px;">
          <select id="prop-add-entity" style="flex:1; min-width:0;" ${availableEntities.length === 0 ? 'disabled' : ''}>
            <option value="">-- Selecionar entidade --</option>
            ${addEntityOptions}
          </select>
          <button id="prop-btn-add-entity" class="btn btn-secondary" style="flex-shrink:0; padding:6px 12px;" ${availableEntities.length === 0 ? 'disabled' : ''}>Adicionar</button>
        </div>
      </div>

      <!-- Seção de Atributos do Relacionamento -->
      <div class="form-group" style="border-top:1px solid rgba(0, 240, 255, 0.15); padding-top:12px; margin-top:12px;">
        <label style="color:var(--accent-light); font-weight:700;">Atributos do Relacionamento</label>
        
        ${relAttrs.length === 0 ? '<p style="font-size:11px; color:var(--text-muted); margin:4px 0;">Nenhum atributo associado.</p>' : ''}
        ${relAttrs.map(child => `
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(4,7,17,0.7); border:1px solid rgba(0,240,255,0.2); border-radius:6px; padding:6px 10px; margin-bottom:4px;">
            <span style="font-size:12px; color:var(--text-main); font-weight:600;">${this.escapeHtml(child.name)}</span>
            <button class="btn btn-secondary danger prop-rel-attr-remove" data-attr-id="${child.id}" style="padding:2px 6px; font-size:10px;" title="Desvincular Atributo">&times;</button>
          </div>
        `).join('')}

        <!-- Criar Novo Atributo no Relacionamento -->
        <div style="display:flex; gap:6px; margin-top:8px;">
          <input type="text" id="prop-new-rel-attr-name" placeholder="Novo atributo (ex: Data, Horas)..." style="flex:1; padding:6px 8px; font-size:12px;">
          <button id="prop-btn-add-rel-attr" class="btn btn-primary" style="padding:6px 10px; font-size:11px;">+ Criar</button>
        </div>

        <!-- Vincular Atributo Existente -->
        ${candidateRelAttrs.length > 0 ? `
          <div style="display:flex; gap:6px; margin-top:6px;">
            <select id="prop-link-rel-attr-select" style="flex:1; padding:6px 8px; font-size:12px;">
              <option value="">-- Vincular Existente --</option>
              ${candidateRelOptions}
            </select>
            <button id="prop-btn-link-rel-attr" class="btn btn-secondary" style="padding:6px 10px; font-size:11px;">+ Vincular</button>
          </div>
        ` : ''}
      </div>

      <div class="form-group" style="margin-top: 12px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px;">
        <button id="prop-btn-delete" class="btn btn-secondary danger" style="width:100%; justify-content:center;">Excluir Relacionamento</button>
      </div>
    `;
    this.bodyEl.innerHTML = html;

    document.getElementById('prop-name').addEventListener('change', (e) => {
      rel.name = e.target.value.toUpperCase();
      rel.width = Math.max(110, rel.name.length * 10 + 40);
      this.model.notify();
    });

    document.getElementById('prop-is-weak-rel').addEventListener('change', (e) => {
      rel.isWeak = e.target.checked;
      this.model.notify();
    });

    // Handlers para Atributos do Relacionamento
    const btnAddRelAttr = document.getElementById('prop-btn-add-rel-attr');
    const inputNewRelAttr = document.getElementById('prop-new-rel-attr-name');
    if (btnAddRelAttr && inputNewRelAttr) {
      const createRelAttr = () => {
        const attrName = inputNewRelAttr.value.trim();
        if (attrName) {
          this.model.addAttribute(attrName, rel.id);
          this.renderRelationshipEditor(rel);
        }
      };
      btnAddRelAttr.addEventListener('click', createRelAttr);
      inputNewRelAttr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          createRelAttr();
        }
      });
    }

    const btnLinkRelAttr = document.getElementById('prop-btn-link-rel-attr');
    const selectLinkRelAttr = document.getElementById('prop-link-rel-attr-select');
    if (btnLinkRelAttr && selectLinkRelAttr) {
      btnLinkRelAttr.addEventListener('click', () => {
        const targetAttrId = selectLinkRelAttr.value;
        const targetAttr = this.model.attributes.find(a => a.id === targetAttrId);
        if (targetAttr) {
          targetAttr.parentId = rel.id;
          this.model.addConnection(targetAttr.id, rel.id);
          this.model.notify();
          this.renderRelationshipEditor(rel);
        }
      });
    }

    this.bodyEl.querySelectorAll('.prop-rel-attr-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const attrId = e.currentTarget.getAttribute('data-attr-id');
        const child = this.model.attributes.find(a => a.id === attrId);
        if (child) {
          const oldConn = this.model.connections.find(c => (c.sourceId === child.id && c.targetId === rel.id) || (c.sourceId === rel.id && c.targetId === child.id));
          if (oldConn) this.model.removeConnection(oldConn.id);
          child.parentId = null;
          this.model.notify();
          this.renderRelationshipEditor(rel);
        }
      });
    });

    document.querySelectorAll('.prop-rel-card').forEach(select => {
      select.addEventListener('change', (e) => {
        const connId = e.target.getAttribute('data-conn-id');
        const entityIsSource = e.target.getAttribute('data-entity-source') === 'true';
        const conn = this.model.connections.find(c => c.id === connId);
        if (!conn) return;

        if (entityIsSource) conn.cardinalitySource = e.target.value;
        else conn.cardinalityTarget = e.target.value;
        this.model.notify();
      });
    });

    document.querySelectorAll('.prop-rel-role').forEach(input => {
      input.addEventListener('change', (e) => {
        const connId = e.target.getAttribute('data-conn-id');
        const entityIsSource = e.target.getAttribute('data-entity-source') === 'true';
        const conn = this.model.connections.find(c => c.id === connId);
        if (!conn) return;

        if (entityIsSource) conn.roleSource = e.target.value;
        else conn.roleTarget = e.target.value;
        this.model.notify();
      });
    });

    document.querySelectorAll('.prop-rel-total').forEach(check => {
      check.addEventListener('change', (e) => {
        const connId = e.target.getAttribute('data-conn-id');
        const entityIsSource = e.target.getAttribute('data-entity-source') === 'true';
        const conn = this.model.connections.find(c => c.id === connId);
        if (!conn) return;

        if (entityIsSource) conn.isTotalSource = e.target.checked;
        else conn.isTotalTarget = e.target.checked;
        conn.isTotal = Boolean(conn.isTotalSource || conn.isTotalTarget);
        this.model.notify();
      });
    });

    document.querySelectorAll('.prop-rel-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const connId = e.target.getAttribute('data-conn-id');
        this.model.removeConnection(connId);
        this.renderRelationshipEditor(rel);
      });
    });

    const btnAddEntity = document.getElementById('prop-btn-add-entity');
    if (btnAddEntity) {
      btnAddEntity.addEventListener('click', () => {
        const entityId = document.getElementById('prop-add-entity').value;
        if (!entityId) return;

        const entity = this.model.getElementById(entityId);
        const isTotalSource = Boolean(rel.isWeak && entity && entity.isWeak);
        this.model.addConnection(rel.id, entityId, '', 'N', { isTotalTarget: isTotalSource, forceNew: true });
        this.renderRelationshipEditor(rel);
      });
    }

    document.getElementById('prop-btn-delete').addEventListener('click', () => {
      this.model.removeElement(rel.id);
      this.renderer.clearSelection();
    });
  }

  // --- ESPECIALIZAÇÃO EER (d, o, u) ---
  renderSpecializationEditor(spec) {
    this.titleEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg> Herança / Especialização EER`;

    // Buscar superentidade e subentidades
    const superEnt = spec.superEntityId ? this.model.entities.find(e => e.id === spec.superEntityId) : null;
    const subEnts  = (spec.subEntityIds || [])
      .map(id => this.model.entities.find(e => e.id === id))
      .filter(Boolean);

    // Opções de Super-entidade
    const superOptions = this.model.entities.map(e =>
      `<option value="${e.id}" ${e.id === spec.superEntityId ? 'selected' : ''}>Entidade: ${this.escapeHtml(e.name)}</option>`
    ).join('');

    // Opções de Sub-entidades candidatas a adicionar
    const candidateSubs = this.model.entities.filter(e => e.id !== spec.superEntityId && !(spec.subEntityIds || []).includes(e.id));
    const candidateSubOptions = candidateSubs.map(e =>
      `<option value="${e.id}">${this.escapeHtml(e.name)}</option>`
    ).join('');

    const html = `
      <!-- Tipo d/o/u -->
      <div class="form-group">
        <label>Tipo de Especialização / Categoria</label>
        <select id="prop-spec-type">
          <option value="d" ${spec.specType === 'd' ? 'selected' : ''}>d — Disjunta (Mutuamente Exclusiva)</option>
          <option value="o" ${spec.specType === 'o' ? 'selected' : ''}>o — Sobreposta (Overlapping / Overload)</option>
          <option value="u" ${spec.specType === 'u' ? 'selected' : ''}>u — União / Categoria</option>
        </select>
      </div>

      <!-- Totalidade -->
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-spec-total" ${spec.isTotal ? 'checked' : ''}>
          <span>Especialização Total (Linha Dupla)</span>
        </label>
        <small style="font-size:11px;color:var(--text-dim);margin-top:2px;">Toda entidade em <strong>${superEnt ? this.escapeHtml(superEnt.name) : '?'}</strong> deve pertencer a ao menos uma subclasse.</small>
      </div>

      <!-- Atributo Definidor -->
      <div class="form-group">
        <label>Atributo Definidor <span style="color:var(--text-dim);font-weight:400;">(opcional)</span></label>
        <input type="text" id="prop-spec-defining-attr" placeholder="Ex: TipoContrato, Titulação..." value="${this.escapeHtml(spec.definingAttribute || '')}">
      </div>

      <!-- Superclasse -->
      <div class="form-group">
        <label>Superclasse (Entidade Pai)</label>
        <select id="prop-spec-super">
          <option value="">-- Selecione a Superclasse --</option>
          ${superOptions}
        </select>
      </div>

      <!-- Subclasses conectadas -->
      <div class="form-group" style="border-top:1px solid rgba(147, 51, 234, 0.2); padding-top:12px; margin-top:8px;">
        <label style="color:var(--accent-light); font-weight:700;">Subclasses Conectadas</label>

        ${subEnts.length === 0 ? '<p style="font-size:11px; color:var(--text-muted); margin:4px 0;">Nenhuma subclasse vinculada.</p>' : ''}
        ${subEnts.map(sub => `
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(4,7,17,0.7); border:1px solid rgba(147,51,234,0.3); border-radius:6px; padding:6px 10px; margin-bottom:4px;">
            <span style="font-size:12px; color:var(--text-main); font-weight:600;">${this.escapeHtml(sub.name)}</span>
            <button class="btn btn-secondary danger prop-spec-sub-remove" data-sub-id="${sub.id}" style="padding:2px 6px; font-size:10px;" title="Remover Subclasse">&times;</button>
          </div>
        `).join('')}

        <!-- Adicionar Subclasse -->
        <div style="display:flex; gap:6px; margin-top:8px;">
          <select id="prop-spec-add-sub-select" style="flex:1; padding:6px; font-size:12px;">
            <option value="">-- Adicionar Subclasse --</option>
            ${candidateSubOptions}
          </select>
          <button id="prop-spec-btn-add-sub" class="btn btn-primary btn-sm" style="padding:6px 10px; font-size:12px;">+</button>
        </div>
      </div>

      <!-- Excluir -->
      <div class="form-group" style="margin-top: 14px;">
        <button id="prop-btn-delete" class="btn btn-secondary danger" style="width:100%; justify-content:center;">Excluir Herança</button>
      </div>
    `;
    this.bodyEl.innerHTML = html;

    // Tipo d/o/u
    document.getElementById('prop-spec-type').addEventListener('change', (e) => {
      spec.specType = e.target.value;
      spec.name = spec.specType.toUpperCase();
      this.model.notify();
    });

    // Totalidade
    document.getElementById('prop-spec-total').addEventListener('change', (e) => {
      spec.isTotal = e.target.checked;
      const superConn = this.model.connections.find(
        c => (c.sourceId === spec.superEntityId && c.targetId === spec.id) || (c.sourceId === spec.id && c.targetId === spec.superEntityId)
      );
      if (superConn) {
        superConn.isTotalSource = spec.isTotal;
        superConn.isTotal       = spec.isTotal;
      }
      this.model.notify();
    });

    // Atributo Definidor
    document.getElementById('prop-spec-defining-attr').addEventListener('change', (e) => {
      spec.definingAttribute = e.target.value.trim();
      this.model.notify();
    });

    // Alterar Superclasse
    document.getElementById('prop-spec-super').addEventListener('change', (e) => {
      const newSuperId = e.target.value || null;
      if (spec.superEntityId !== newSuperId) {
        if (spec.superEntityId) {
          const oldConn = this.model.connections.find(c => (c.sourceId === spec.superEntityId && c.targetId === spec.id) || (c.sourceId === spec.id && c.targetId === spec.superEntityId));
          if (oldConn) this.model.removeConnection(oldConn.id);
        }
        spec.superEntityId = newSuperId;
        if (newSuperId) {
          this.model.addConnection(newSuperId, spec.id, '', '', {
            isTotalSource: Boolean(spec.isTotal),
            isTotal: Boolean(spec.isTotal)
          });
        }
        this.model.notify();
        this.renderSpecializationEditor(spec);
      }
    });

    // Remover Subclasse
    this.bodyEl.querySelectorAll('.prop-spec-sub-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subId = e.currentTarget.getAttribute('data-sub-id');
        if (subId) {
          spec.subEntityIds = (spec.subEntityIds || []).filter(id => id !== subId);
          const conn = this.model.connections.find(c => (c.sourceId === spec.id && c.targetId === subId) || (c.sourceId === subId && c.targetId === spec.id));
          if (conn) this.model.removeConnection(conn.id);
          this.model.notify();
          this.renderSpecializationEditor(spec);
        }
      });
    });

    // Adicionar Subclasse
    const btnAddSub = document.getElementById('prop-spec-btn-add-sub');
    const selectAddSub = document.getElementById('prop-spec-add-sub-select');
    if (btnAddSub && selectAddSub) {
      btnAddSub.addEventListener('click', () => {
        const subId = selectAddSub.value;
        if (subId && !spec.subEntityIds.includes(subId)) {
          spec.subEntityIds.push(subId);
          this.model.addConnection(spec.id, subId);
          this.model.notify();
          this.renderSpecializationEditor(spec);
        }
      });
    }

    // Excluir
    document.getElementById('prop-btn-delete').addEventListener('click', () => {
      this.model.removeElement(spec.id);
      this.renderer.clearSelection();
    });
  }

  // --- CONEXÃO ---
  renderConnectionEditor(conn) {
    this.titleEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg> Conexão`;

    const sourceElem = this.model.getElementById(conn.sourceId);
    const targetElem = this.model.getElementById(conn.targetId);
    const totalSource = conn.isTotalSource !== undefined ? conn.isTotalSource : Boolean(conn.isTotal);
    const totalTarget = conn.isTotalTarget !== undefined ? conn.isTotalTarget : Boolean(conn.isTotal);

    // Se uma das pontas for um atributo, a conexão não carrega cardinalidade
    const isAttributeConn = (sourceElem && sourceElem.type === 'attribute') || (targetElem && targetElem.type === 'attribute');

    const html = `
      <div class="form-group">
        <label>Ligação</label>
        <p style="font-size:12px; font-weight:600; color:#38bdf8;">
          ${sourceElem ? this.escapeHtml(sourceElem.name) : '?'} &rarr; ${targetElem ? this.escapeHtml(targetElem.name) : '?'}
        </p>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-total-source" ${totalSource ? 'checked' : ''}>
          <span>Participação Total em ${sourceElem ? this.escapeHtml(sourceElem.name) : 'Origem'}</span>
        </label>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="prop-is-total-target" ${totalTarget ? 'checked' : ''}>
          <span>Participação Total em ${targetElem ? this.escapeHtml(targetElem.name) : 'Destino'}</span>
        </label>
      </div>

      ${!isAttributeConn ? `
        <div class="form-group">
          <label>Cardinalidade em ${sourceElem ? this.escapeHtml(sourceElem.name) : 'Origem'}</label>
          <select id="prop-card-source">
            <option value="">-- Sem Cardinalidade --</option>
            <option value="1" ${conn.cardinalitySource === '1' ? 'selected' : ''}>1</option>
            <option value="N" ${(conn.cardinalitySource === 'N' || conn.cardinalitySource === 'M') ? 'selected' : ''}>N</option>
          </select>
        </div>

        <div class="form-group">
          <label>Cardinalidade em ${targetElem ? this.escapeHtml(targetElem.name) : 'Destino'}</label>
          <select id="prop-card-target">
            <option value="">-- Sem Cardinalidade --</option>
            <option value="1" ${conn.cardinalityTarget === '1' ? 'selected' : ''}>1</option>
            <option value="N" ${(conn.cardinalityTarget === 'N' || conn.cardinalityTarget === 'M') ? 'selected' : ''}>N</option>
          </select>
        </div>

        <div class="form-group">
          <label>Nome do Papel (Role)</label>
          <input type="text" id="prop-role-source" placeholder="Ex: supervisor" value="${this.escapeHtml(conn.roleSource || '')}">
        </div>

        <div class="form-group">
          <label>Nome do Papel no Destino</label>
          <input type="text" id="prop-role-target" placeholder="Ex: subordinado" value="${this.escapeHtml(conn.roleTarget || '')}">
        </div>
      ` : ''}

      <div class="form-group" style="border-top:1px solid var(--border-color); pt:10px; margin-top:10px;">
        <label>🔒 Trava de Aresta de Origem (Entrada/Saída)</label>
        <select id="prop-face-source">
          <option value="auto" ${(!conn.faceSource || conn.faceSource === 'auto') ? 'selected' : ''}>Automático (Auto-orientado)</option>
          <option value="east" ${conn.faceSource === 'east' ? 'selected' : ''}>Leste / Direita (East)</option>
          <option value="west" ${conn.faceSource === 'west' ? 'selected' : ''}>Oeste / Esquerda (West)</option>
          <option value="north" ${conn.faceSource === 'north' ? 'selected' : ''}>Norte / Cima (North)</option>
          <option value="south" ${conn.faceSource === 'south' ? 'selected' : ''}>Sul / Baixo (South)</option>
        </select>
      </div>

      <div class="form-group">
        <label>🔒 Trava de Aresta de Destino (Entrada/Saída)</label>
        <select id="prop-face-target">
          <option value="auto" ${(!conn.faceTarget || conn.faceTarget === 'auto') ? 'selected' : ''}>Automático (Auto-orientado)</option>
          <option value="east" ${conn.faceTarget === 'east' ? 'selected' : ''}>Leste / Direita (East)</option>
          <option value="west" ${conn.faceTarget === 'west' ? 'selected' : ''}>Oeste / Esquerda (West)</option>
          <option value="north" ${conn.faceTarget === 'north' ? 'selected' : ''}>Norte / Cima (North)</option>
          <option value="south" ${conn.faceTarget === 'south' ? 'selected' : ''}>Sul / Baixo (South)</option>
        </select>
      </div>

      <div class="form-group" style="margin-top: 10px;">
        <button id="prop-btn-delete" class="btn btn-secondary danger" style="width:100%; justify-content:center;">Excluir Conexão</button>
      </div>
    `;
    this.bodyEl.innerHTML = html;

    document.getElementById('prop-is-total-source').addEventListener('change', (e) => {
      conn.isTotalSource = e.target.checked;
      conn.isTotal = Boolean(conn.isTotalSource || conn.isTotalTarget);
      this.model.notify();
    });

    document.getElementById('prop-is-total-target').addEventListener('change', (e) => {
      conn.isTotalTarget = e.target.checked;
      conn.isTotal = Boolean(conn.isTotalSource || conn.isTotalTarget);
      this.model.notify();
    });

    if (!isAttributeConn) {
      document.getElementById('prop-card-source').addEventListener('change', (e) => {
        conn.cardinalitySource = e.target.value;
        this.model.notify();
      });

      document.getElementById('prop-card-target').addEventListener('change', (e) => {
        conn.cardinalityTarget = e.target.value;
        this.model.notify();
      });

      document.getElementById('prop-role-source').addEventListener('change', (e) => {
        conn.roleSource = e.target.value;
        this.model.notify();
      });

      document.getElementById('prop-role-target').addEventListener('change', (e) => {
        conn.roleTarget = e.target.value;
        this.model.notify();
      });
    }

    document.getElementById('prop-face-source').addEventListener('change', (e) => {
      conn.faceSource = e.target.value;
      this.model.notify();
    });

    document.getElementById('prop-face-target').addEventListener('change', (e) => {
      conn.faceTarget = e.target.value;
      this.model.notify();
    });

    document.getElementById('prop-btn-delete').addEventListener('click', () => {
      this.model.removeConnection(conn.id);
      this.renderer.clearSelection();
    });
  }
}

