/**
 * DER Builder — Tabular Visual Manager
 * Renders an interactive list for entities, attributes, relationships, and specializations,
 * with fluid, animated inline creation forms and custom toasts without native browser prompts/alerts.
 */
class TabularManager {
  constructor(model, containerId) {
    this.model = model;
    this.container = document.getElementById(containerId);
    this.lastSignature = "";
    this.activeInlineForm = null; // null | { type: 'entity'|'attribute'|'relationship'|'specialization'|'delete', parentId?: string, deleteId?: string }
  }

  getStructureSignature() {
    const entStr = this.model.entities.map(e => `${e.id}:${e.name}:${e.isWeak}`).join('|');
    const attrStr = this.model.attributes.map(a => `${a.id}:${a.name}:${a.parentId}:${a.isKey}:${a.isPartialKey}:${a.isMultivalued}:${a.isDerived}`).join('|');
    const relStr = this.model.relationships.map(r => `${r.id}:${r.name}:${r.isWeak}`).join('|');
    const specStr = (this.model.specializations || []).map(s => `${s.id}:${s.specType}:${s.superEntityId}:${(s.subEntityIds||[]).join(',')}:${s.isTotal}:${s.definingAttribute}`).join('|');
    const connStr = this.model.connections.map(c => `${c.id}:${c.sourceId}:${c.targetId}:${c.cardinalitySource}:${c.cardinalityTarget}`).join('|');
    const inlineStr = this.activeInlineForm ? `${this.activeInlineForm.type}:${this.activeInlineForm.parentId}:${this.activeInlineForm.deleteId}` : 'none';
    return `${entStr}#${attrStr}#${relStr}#${specStr}#${connStr}#${inlineStr}`;
  }

  showInlineForm(type, parentId = null) {
    this.activeInlineForm = { type, parentId };
    this.render(true);
    setTimeout(() => {
      const input = document.getElementById('inline-create-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.confirmInlineAdd();
          } else if (e.key === 'Escape') {
            this.cancelInlineCreate();
          }
        });
      }
    }, 40);
  }

  cancelInlineCreate() {
    this.activeInlineForm = null;
    this.render(true);
  }

  confirmInlineAdd() {
    if (!this.activeInlineForm) return;
    const { type, parentId } = this.activeInlineForm;
    const input = document.getElementById('inline-create-input');
    const name = input ? input.value.trim() : '';

    if (!name && type !== 'specialization') {
      if (input) {
        input.style.borderColor = 'var(--danger)';
        input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
      }
      return;
    }

    if (type === 'entity') {
      const isWeak = Boolean(document.getElementById('inline-opt-weak')?.checked);
      const res = this.model.addEntity(name, 0, 0, isWeak);
      const ent = res.element || res;
      this.activeInlineForm = null;
      this.render(true);
      if (ent) this.openPropertyInspector(ent.id);
      if (window.showToast) window.showToast(`Entidade "${name.toUpperCase()}" criada!`, 'success');
    } else if (type === 'attribute') {
      const isKey = Boolean(document.getElementById('inline-opt-key')?.checked);
      const isMultivalued = Boolean(document.getElementById('inline-opt-multi')?.checked);
      const isDerived = Boolean(document.getElementById('inline-opt-derived')?.checked);
      const attr = this.model.addAttribute(name, parentId, { isKey, isMultivalued, isDerived }, 0, 0);
      this.activeInlineForm = null;
      this.render(true);
      if (attr) this.openPropertyInspector(attr.id);
      if (window.showToast) window.showToast(`Atributo "${name}" criado!`, 'success');
    } else if (type === 'relationship') {
      const isWeak = Boolean(document.getElementById('inline-opt-weak')?.checked);
      const res = this.model.addRelationship(name, 0, 0, isWeak);
      const rel = res.element || res;
      this.activeInlineForm = null;
      this.render(true);
      if (rel) this.openPropertyInspector(rel.id);
      if (window.showToast) window.showToast(`Relacionamento "${name.toUpperCase()}" criado!`, 'success');
    } else if (type === 'specialization') {
      const superId = document.getElementById('inline-opt-super')?.value;
      const specType = document.getElementById('inline-opt-spectype')?.value || 'd';
      const isTotal = Boolean(document.getElementById('inline-opt-total')?.checked);
      if (superId) {
        const candidateSubs = this.model.entities.filter(e => e.id !== superId).map(e => e.id);
        const spec = this.model.addSpecialization(specType, superId, candidateSubs.slice(0, 2), 0, 0, isTotal, '');
        this.activeInlineForm = null;
        this.render(true);
        if (spec) this.openPropertyInspector(spec.id);
        if (window.showToast) window.showToast(`Especialização criada!`, 'success');
      }
    }
  }

  confirmDeleteElement(id) {
    const elem = this.model.getElementById(id);
    const name = elem ? elem.name : 'elemento';
    this.model.removeElement(id);
    this.activeInlineForm = null;
    this.render(true);
    if (window.showToast) window.showToast(`"${name}" excluído.`, 'info');
  }

  // --- ACTIONS ---
  addEntity() {
    this.showInlineForm('entity');
  }

  addAttribute(parentId = null) {
    this.showInlineForm('attribute', parentId);
  }

  addRelationship() {
    this.showInlineForm('relationship');
  }

  addSpecialization() {
    if (this.model.entities.length < 2) {
      if (window.showToast) {
        window.showToast('É necessário ter pelo menos 2 entidades para criar especialização.', 'error');
      } else {
        alert('É necessário ter pelo menos 2 entidades no modelo para criar uma especialização.');
      }
      return;
    }
    this.showInlineForm('specialization');
  }

  deleteElement(id) {
    this.activeInlineForm = { type: 'delete', deleteId: id };
    this.render(true);
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

  editSpecialization(id) {
    this.openPropertyInspector(id);
  }

  render(force = false) {
    if (!this.container) return;

    const currentSignature = this.getStructureSignature();
    if (!force && this.lastSignature === currentSignature) {
      return;
    }
    this.lastSignature = currentSignature;

    const scrollParent = document.getElementById('panel-visual');
    const savedScrollTop = scrollParent ? scrollParent.scrollTop : 0;

    let html = `
      <div class="tabular-section">
        <div class="tabular-header">
          <h3>Entidades</h3>
          <button class="btn btn-sm btn-primary" onclick="window.tabularManager.addEntity()">+ Entidade</button>
        </div>
        <div class="tabular-list">
    `;

    // Inline Form for Entity Creation
    if (this.activeInlineForm?.type === 'entity') {
      html += `
        <div class="inline-create-card animated-fade-in">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:12px; color:var(--accent-light);">+ Nova Entidade</strong>
            <button class="btn-icon btn-sm" onclick="window.tabularManager.cancelInlineCreate()">&times;</button>
          </div>
          <input type="text" id="inline-create-input" placeholder="Nome da Entidade (ex: CLIENTE)" style="width:100%; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; color:var(--text-muted); cursor:pointer;"><input type="checkbox" id="inline-opt-weak"> Entidade Fraca</label>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Cancelar</button>
              <button class="btn btn-sm btn-primary" onclick="window.tabularManager.confirmInlineAdd()">+ Criar</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.model.entities.length === 0 && this.model.relationships.length === 0) {
      html += `
        <div class="empty-diagram-welcome" style="text-align:center; padding: 20px 14px; background: rgba(15, 23, 42, 0.6); border: 1px dashed rgba(0, 240, 255, 0.3); border-radius: 8px; margin-bottom: 16px;">
          <h4 style="margin-bottom: 6px; color: var(--text-main); font-size: 14px; font-weight: 600;">Diagrama Vazio</h4>
          <p style="margin-bottom: 12px; color: var(--text-muted); font-size: 12px; line-height: 1.4;">
            Crie sua primeira entidade para começar o diagrama visualmente!
          </p>
          <button class="btn btn-sm btn-primary" onclick="window.tabularManager.addEntity()" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-weight: 600;">
            + Criar Primeira Entidade
          </button>
        </div>
      `;
    } else if (this.model.entities.length === 0 && this.activeInlineForm?.type !== 'entity') {
      html += `
        <div class="tabular-empty" style="text-align: center; padding: 14px 10px; color: var(--text-muted);">
          <p style="margin-bottom: 8px; font-size: 12px;">Nenhuma entidade criada ainda.</p>
          <button class="btn btn-sm btn-primary" onclick="window.tabularManager.addEntity()" style="margin: 0 auto;">+ Criar Entidade</button>
        </div>
      `;
    }

    this.model.entities.forEach(ent => {
      const isDeleting = this.activeInlineForm?.type === 'delete' && this.activeInlineForm?.deleteId === ent.id;

      html += `
        <div class="tabular-item entity-item">
          <div class="item-info">
            <span class="item-name" title="${ent.name}">${ent.name}</span> 
            <span class="badge-sm ${ent.isWeak ? 'weak' : 'strong'}">${ent.isWeak ? 'Fraca' : 'Forte'}</span>
          </div>
          <div class="item-actions">
            ${isDeleting ? `
              <span style="font-size:11px; color:var(--danger); font-weight:600;">Excluir?</span>
              <button class="btn btn-sm btn-danger" onclick="window.tabularManager.confirmDeleteElement('${ent.id}')">Sim</button>
              <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Não</button>
            ` : `
              <button class="btn-icon btn-sm" onclick="window.tabularManager.addAttribute('${ent.id}')" title="Adicionar Atributo">+</button>
              <button class="btn-icon btn-sm" onclick="window.tabularManager.editEntity('${ent.id}')" title="Editar">&#9998;</button>
              <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${ent.id}')" title="Excluir">&times;</button>
            `}
          </div>
        </div>
      `;

      // Inline Attribute creation card for this entity
      if (this.activeInlineForm?.type === 'attribute' && this.activeInlineForm?.parentId === ent.id) {
        html += `
          <div class="inline-create-card animated-fade-in" style="margin-left: 10px; margin-top: 4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:12px; color:var(--accent-light);">+ Atributo em ${ent.name}</strong>
              <button class="btn-icon btn-sm" onclick="window.tabularManager.cancelInlineCreate()">&times;</button>
            </div>
            <input type="text" id="inline-create-input" placeholder="Nome do Atributo (ex: Nome, CPF)" style="width:100%; margin-bottom:8px;">
            <div style="display:flex; gap:10px; margin-bottom:8px; font-size:11px; color:var(--text-muted);">
              <label style="cursor:pointer;"><input type="checkbox" id="inline-opt-key"> PK</label>
              <label style="cursor:pointer;"><input type="checkbox" id="inline-opt-multi"> Multi</label>
              <label style="cursor:pointer;"><input type="checkbox" id="inline-opt-derived"> Derivado</label>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:4px;">
              <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Cancelar</button>
              <button class="btn btn-sm btn-primary" onclick="window.tabularManager.confirmInlineAdd()">+ Criar</button>
            </div>
          </div>
        `;
      }

      // List attributes of this entity
      const renderAttributes = (parentId, depth = 1) => {
        const attrs = this.model.attributes.filter(a => a.parentId === parentId);
        if (attrs.length === 0) return '';
        
        let htmlSnippet = `<div class="tabular-sublist" style="padding-left: ${depth * 10}px;">`;
        attrs.forEach(attr => {
          const isAttrDeleting = this.activeInlineForm?.type === 'delete' && this.activeInlineForm?.deleteId === attr.id;
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
                ${isAttrDeleting ? `
                  <span style="font-size:11px; color:var(--danger); font-weight:600;">Excluir?</span>
                  <button class="btn btn-sm btn-danger" onclick="window.tabularManager.confirmDeleteElement('${attr.id}')">Sim</button>
                  <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Não</button>
                ` : `
                  <button class="btn-icon btn-sm" onclick="window.tabularManager.addAttribute('${attr.id}')" title="Adicionar Sub-atributo">+</button>
                  <button class="btn-icon btn-sm" onclick="window.tabularManager.editAttribute('${attr.id}')" title="Editar">&#9998;</button>
                  <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${attr.id}')" title="Excluir">&times;</button>
                `}
              </div>
            </div>
          `;

          // Inline creation for sub-attributes
          if (this.activeInlineForm?.type === 'attribute' && this.activeInlineForm?.parentId === attr.id) {
            htmlSnippet += `
              <div class="inline-create-card animated-fade-in" style="margin-left: 10px; margin-top: 4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <strong style="font-size:12px; color:var(--accent-light);">+ Sub-atributo em ${attr.name}</strong>
                  <button class="btn-icon btn-sm" onclick="window.tabularManager.cancelInlineCreate()">&times;</button>
                </div>
                <input type="text" id="inline-create-input" placeholder="Nome do Sub-atributo" style="width:100%; margin-bottom:8px;">
                <div style="display:flex; justify-content:flex-end; gap:4px;">
                  <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Cancelar</button>
                  <button class="btn btn-sm btn-primary" onclick="window.tabularManager.confirmInlineAdd()">+ Criar</button>
                </div>
              </div>
            `;
          }

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

    // Inline Form for Relationship Creation
    if (this.activeInlineForm?.type === 'relationship') {
      html += `
        <div class="inline-create-card animated-fade-in">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:12px; color:var(--accent-light);">+ Novo Relacionamento</strong>
            <button class="btn-icon btn-sm" onclick="window.tabularManager.cancelInlineCreate()">&times;</button>
          </div>
          <input type="text" id="inline-create-input" placeholder="Nome do Relacionamento (ex: REALIZA)" style="width:100%; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; color:var(--text-muted); cursor:pointer;"><input type="checkbox" id="inline-opt-weak"> Relacionamento Fraco</label>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Cancelar</button>
              <button class="btn btn-sm btn-primary" onclick="window.tabularManager.confirmInlineAdd()">+ Criar</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.model.relationships.length === 0 && this.activeInlineForm?.type !== 'relationship') {
      html += `<div class="tabular-empty">Nenhum relacionamento cadastrado.</div>`;
    }

    this.model.relationships.forEach(rel => {
      const isRelDeleting = this.activeInlineForm?.type === 'delete' && this.activeInlineForm?.deleteId === rel.id;
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
            ${isRelDeleting ? `
              <span style="font-size:11px; color:var(--danger); font-weight:600;">Excluir?</span>
              <button class="btn btn-sm btn-danger" onclick="window.tabularManager.confirmDeleteElement('${rel.id}')">Sim</button>
              <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Não</button>
            ` : `
              <button class="btn-icon btn-sm" onclick="window.tabularManager.addAttribute('${rel.id}')" title="Adicionar Atributo ao Relacionamento">+</button>
              <button class="btn-icon btn-sm" onclick="window.tabularManager.editRelationship('${rel.id}')" title="Editar">&#9998;</button>
              <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${rel.id}')" title="Excluir">&times;</button>
            `}
          </div>
        </div>
      `;

      // Inline Attribute creation card for this relationship
      if (this.activeInlineForm?.type === 'attribute' && this.activeInlineForm?.parentId === rel.id) {
        html += `
          <div class="inline-create-card animated-fade-in" style="margin-left: 10px; margin-top: 4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:12px; color:var(--accent-light);">+ Atributo em ${rel.name}</strong>
              <button class="btn-icon btn-sm" onclick="window.tabularManager.cancelInlineCreate()">&times;</button>
            </div>
            <input type="text" id="inline-create-input" placeholder="Nome do Atributo (ex: Data, Horas, Nota)" style="width:100%; margin-bottom:8px;">
            <div style="display:flex; justify-content:flex-end; gap:4px;">
              <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Cancelar</button>
              <button class="btn btn-sm btn-primary" onclick="window.tabularManager.confirmInlineAdd()">+ Criar</button>
            </div>
          </div>
        `;
      }

      // List attributes of this relationship
      const renderRelAttributes = (parentId, depth = 1) => {
        const attrs = this.model.attributes.filter(a => a.parentId === parentId);
        if (attrs.length === 0) return '';
        
        let htmlSnippet = `<div class="tabular-sublist" style="padding-left: ${depth * 10}px;">`;
        attrs.forEach(attr => {
          const isAttrDeleting = this.activeInlineForm?.type === 'delete' && this.activeInlineForm?.deleteId === attr.id;

          htmlSnippet += `
            <div class="tabular-item subitem">
              <div class="item-info">
                <span class="item-name" title="${attr.name}">${attr.name}</span>
                <span class="badge-sm badge-multi">Atributo</span>
              </div>
              <div class="item-actions">
                ${isAttrDeleting ? `
                  <span style="font-size:11px; color:var(--danger); font-weight:600;">Excluir?</span>
                  <button class="btn btn-sm btn-danger" onclick="window.tabularManager.confirmDeleteElement('${attr.id}')">Sim</button>
                  <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Não</button>
                ` : `
                  <button class="btn-icon btn-sm" onclick="window.tabularManager.addAttribute('${attr.id}')" title="Adicionar Sub-atributo">+</button>
                  <button class="btn-icon btn-sm" onclick="window.tabularManager.editAttribute('${attr.id}')" title="Editar">&#9998;</button>
                  <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${attr.id}')" title="Excluir">&times;</button>
                `}
              </div>
            </div>
          `;
          htmlSnippet += renderRelAttributes(attr.id, depth + 1);
        });
        htmlSnippet += `</div>`;
        return htmlSnippet;
      };

      html += renderRelAttributes(rel.id);
    });

    html += `
        </div>
      </div>

      <div class="tabular-divider"></div>

      <div class="tabular-section">
        <div class="tabular-header">
          <h3>Especializações (EER)</h3>
          <button class="btn btn-sm btn-primary" onclick="window.tabularManager.addSpecialization()">+ Especialização</button>
        </div>
        <div class="tabular-list">
    `;

    // Inline Form for Specialization Creation
    if (this.activeInlineForm?.type === 'specialization') {
      html += `
        <div class="inline-create-card animated-fade-in">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:12px; color:var(--accent-light);">+ Nova Especialização (EER)</strong>
            <button class="btn-icon btn-sm" onclick="window.tabularManager.cancelInlineCreate()">&times;</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:8px;">
            <div>
              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Superclasse (Entidade Pai):</label>
              <select id="inline-opt-super" style="width:100%;">
                ${this.model.entities.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Tipo de Herança:</label>
              <select id="inline-opt-spectype" style="width:100%;">
                <option value="d">d — Disjunta (Mutuamente Exclusiva)</option>
                <option value="o">o — Sobreposta (Overlapping)</option>
                <option value="u">u — União / Categoria</option>
              </select>
            </div>
            <label style="font-size:11px; color:var(--text-muted); cursor:pointer;"><input type="checkbox" id="inline-opt-total"> Especialização Total (Linha Dupla)</label>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:4px;">
            <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Cancelar</button>
            <button class="btn btn-sm btn-primary" onclick="window.tabularManager.confirmInlineAdd()">+ Criar</button>
          </div>
        </div>
      `;
    }

    if ((!this.model.specializations || this.model.specializations.length === 0) && this.activeInlineForm?.type !== 'specialization') {
      html += `<div class="tabular-empty">Nenhuma especialização cadastrada.</div>`;
    } else if (this.model.specializations) {
      this.model.specializations.forEach(spec => {
        const isSpecDeleting = this.activeInlineForm?.type === 'delete' && this.activeInlineForm?.deleteId === spec.id;
        const superEnt = this.model.entities.find(e => e.id === spec.superEntityId);
        const subNames = (spec.subEntityIds || []).map(id => {
          const e = this.model.entities.find(ent => ent.id === id);
          return e ? e.name : '?';
        }).join(', ');

        const typeLabel = spec.specType === 'd' ? 'Disjunta (d)' : (spec.specType === 'o' ? 'Sobreposta (o)' : 'União (u)');

        html += `
          <div class="tabular-item rel-item">
            <div class="item-info">
              <span class="item-name" title="${typeLabel}">${typeLabel} ${spec.isTotal ? '[Total]' : ''}</span>
              <div class="rel-conn-desc">${superEnt ? superEnt.name : '?'} &rarr; [ ${subNames || 'sem subclasses'} ]</div>
            </div>
            <div class="item-actions">
              ${isSpecDeleting ? `
                <span style="font-size:11px; color:var(--danger); font-weight:600;">Excluir?</span>
                <button class="btn btn-sm btn-danger" onclick="window.tabularManager.confirmDeleteElement('${spec.id}')">Sim</button>
                <button class="btn btn-sm btn-secondary" onclick="window.tabularManager.cancelInlineCreate()">Não</button>
              ` : `
                <button class="btn-icon btn-sm" onclick="window.tabularManager.editSpecialization('${spec.id}')" title="Editar">&#9998;</button>
                <button class="btn-icon btn-sm danger" onclick="window.tabularManager.deleteElement('${spec.id}')" title="Excluir">&times;</button>
              `}
            </div>
          </div>
        `;
      });
    }

    this.container.innerHTML = html;

    if (scrollParent) {
      scrollParent.scrollTop = savedScrollTop;
    }
  }
}

// Export for app.js
window.TabularManager = TabularManager;
