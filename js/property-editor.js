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
    this.renderer.onSelectElement = (id, type) => {
      if (!id) {
        this.hide();
      } else {
        this.show(id, type);
      }
    };

    document.getElementById('btn-close-inspector').addEventListener('click', () => this.hide());
  }

  show(id, selectionType) {
    this.bodyEl.innerHTML = '';
    this.panel.classList.remove('hidden');

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

    // Lista de entidades para alterar o pai
    const entityOptions = this.model.entities.map(e => 
      `<option value="${e.id}" ${attr.parentId === e.id ? 'selected' : ''}>${this.escapeHtml(e.name)}</option>`
    ).join('');

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
        <label>Entidade / Pai Vinculado</label>
        <select id="prop-parent">
          <option value="">-- Sem Vinculo --</option>
          ${entityOptions}
        </select>
      </div>

      <div class="form-group" style="margin-top: 10px;">
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

    const connectedIds = new Set(participantConns.map(item => item.entity.id));
    const availableEntities = this.model.entities.filter(e => !connectedIds.has(e.id));
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
        ${participantConns.length === 0 ? '<p style="font-size:11px; color:#64748b;">Nenhuma entidade conectada.</p>' : ''}
        ${participantConns.map((item) => `
          <div style="border:1px solid #334155; border-radius:8px; padding:8px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
              <span style="font-size:12px; font-weight:600; color:#38bdf8;">${this.escapeHtml(item.entity.name)}</span>
              <button class="btn btn-secondary danger prop-rel-remove" data-conn-id="${item.conn.id}" style="padding:4px 8px; font-size:11px;">Remover</button>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:6px;">
              <select class="prop-rel-card" data-conn-id="${item.conn.id}" data-entity-source="${item.entityIsSource}" title="Cardinalidade">
                <option value="">-- Cardinalidade --</option>
                <option value="1" ${item.cardVal === '1' ? 'selected' : ''}>1</option>
                <option value="N" ${item.cardVal === 'N' ? 'selected' : ''}>N</option>
                <option value="M" ${item.cardVal === 'M' ? 'selected' : ''}>M</option>
              </select>
              <input type="text" class="prop-rel-role" data-conn-id="${item.conn.id}" data-entity-source="${item.entityIsSource}" placeholder="Papel (ex.: supervisor)" value="${this.escapeHtml(item.roleVal)}">
            </div>

            <label class="checkbox-label" style="margin:0;">
              <input type="checkbox" class="prop-rel-total" data-conn-id="${item.conn.id}" data-entity-source="${item.entityIsSource}" ${item.totalVal ? 'checked' : ''}>
              <span>Participação Total em ${this.escapeHtml(item.entity.name)}</span>
            </label>
          </div>
        `).join('')}
      </div>

      <div class="form-group">
        <label>Adicionar Participante</label>
        <div style="display:flex; gap:6px;">
          <select id="prop-add-entity" style="flex:1;" ${availableEntities.length === 0 ? 'disabled' : ''}>
            <option value="">-- Selecionar entidade --</option>
            ${addEntityOptions}
          </select>
          <button id="prop-btn-add-entity" class="btn btn-secondary" ${availableEntities.length === 0 ? 'disabled' : ''}>Adicionar</button>
        </div>
      </div>

      <div class="form-group" style="margin-top: 10px;">
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
        this.model.addConnection(entityId, rel.id, 'N', '', { isTotalSource });
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
    this.titleEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg> Herança EER`;

    const html = `
      <div class="form-group">
        <label>Tipo de Especialização / Categoria</label>
        <select id="prop-spec-type">
          <option value="d" ${spec.specType === 'd' ? 'selected' : ''}>d - Disjunta (Mutuamente Exclusiva)</option>
          <option value="o" ${spec.specType === 'o' ? 'selected' : ''}>o - Sobreposta (Overlapping)</option>
          <option value="u" ${spec.specType === 'u' ? 'selected' : ''}>u - União / Categoria</option>
        </select>
      </div>

      <div class="form-group" style="margin-top: 10px;">
        <button id="prop-btn-delete" class="btn btn-secondary danger" style="width:100%; justify-content:center;">Excluir Herança</button>
      </div>
    `;
    this.bodyEl.innerHTML = html;

    document.getElementById('prop-spec-type').addEventListener('change', (e) => {
      spec.specType = e.target.value;
      spec.name = spec.specType.toUpperCase();
      this.model.notify();
    });

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
            <option value="">-- Nenhuma --</option>
            <option value="1" ${conn.cardinalitySource === '1' ? 'selected' : ''}>1</option>
            <option value="N" ${conn.cardinalitySource === 'N' ? 'selected' : ''}>N</option>
            <option value="M" ${conn.cardinalitySource === 'M' ? 'selected' : ''}>M</option>
            <option value="1..1" ${conn.cardinalitySource === '1..1' ? 'selected' : ''}>1..1</option>
            <option value="1..n" ${conn.cardinalitySource === '1..n' ? 'selected' : ''}>1..n</option>
            <option value="n..n" ${conn.cardinalitySource === 'n..n' ? 'selected' : ''}>n..n</option>
          </select>
        </div>

        <div class="form-group">
          <label>Cardinalidade em ${targetElem ? this.escapeHtml(targetElem.name) : 'Destino'}</label>
          <select id="prop-card-target">
            <option value="">-- Nenhuma --</option>
            <option value="1" ${conn.cardinalityTarget === '1' ? 'selected' : ''}>1</option>
            <option value="N" ${conn.cardinalityTarget === 'N' ? 'selected' : ''}>N</option>
            <option value="M" ${conn.cardinalityTarget === 'M' ? 'selected' : ''}>M</option>
            <option value="1..1" ${conn.cardinalityTarget === '1..1' ? 'selected' : ''}>1..1</option>
            <option value="1..n" ${conn.cardinalityTarget === '1..n' ? 'selected' : ''}>1..n</option>
            <option value="n..n" ${conn.cardinalityTarget === 'n..n' ? 'selected' : ''}>n..n</option>
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

    document.getElementById('prop-btn-delete').addEventListener('click', () => {
      this.model.removeConnection(conn.id);
      this.renderer.clearSelection();
    });
  }
}

