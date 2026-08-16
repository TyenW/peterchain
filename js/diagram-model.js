/**
 * DER Builder — Modelo Lógico de Dados do Diagrama ER / EER (Peter Chen)
 */
class DiagramModel {
  constructor() {
    this.entities = [];       // { id, name, type: 'entity', isWeak, x, y, width, height }
    this.attributes = [];     // { id, name, type: 'attribute', parentId, isKey, isPartialKey, isMultivalued, isDerived, x, y, width, height }
    this.relationships = [];  // { id, name, type: 'relationship', isWeak, x, y, width, height }
    this.specializations = [];// { id, type: 'specialization', specType: 'd'|'o'|'u', superEntityId, subEntityIds: [], x, y, width: 36, height: 36 }
    this.connections = [];    // { id, sourceId, targetId, cardinalitySource, cardinalityTarget, isTotalSource, isTotalTarget, isTotal, roleSource, roleTarget }
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  generateId(prefix = 'elem') {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Dimensionamento centralizado e reutilizável de elementos
  calculateDimensions(type, name = '') {
    const len = name ? name.trim().length : 0;
    if (type === 'entity') {
      return { width: Math.max(120, len * 10 + 30), height: 50 };
    }
    if (type === 'attribute') {
      return { width: Math.max(90, len * 8 + 24), height: 40 };
    }
    if (type === 'relationship') {
      return { width: Math.max(110, len * 10 + 40), height: 65 };
    }
    if (type === 'specialization') {
      return { width: 36, height: 36 };
    }
    return { width: 100, height: 50 };
  }

  clear() {
    this.entities = [];
    this.attributes = [];
    this.relationships = [];
    this.specializations = [];
    this.connections = [];
    this.notify();
  }

  // --- ENTIDADES ---
  addEntity(name, x = 200, y = 200, isWeak = false) {
    const formattedName = name.trim().toUpperCase();
    let existing = this.entities.find(e => e.name === formattedName);
    if (existing) {
      if (isWeak) existing.isWeak = true;
      this.notify();
      return { element: existing, created: false };
    }

    const dims = this.calculateDimensions('entity', formattedName);
    const entity = {
      id: this.generateId('entity'),
      name: formattedName,
      type: 'entity',
      isWeak: Boolean(isWeak),
      x,
      y,
      width: dims.width,
      height: dims.height
    };

    this.entities.push(entity);
    this.notify();
    return { element: entity, created: true };
  }

  // --- ATRIBUTOS ---
  addAttribute(name, parentId = null, options = {}, x = 0, y = 0) {
    // Acepta booleano (para retrocompatibilidade com isKey) ou objeto options
    const opts = typeof options === 'boolean' ? { isKey: options } : (options || {});
    const formattedName = name.trim();
    if (!formattedName) return null;

    // Evitar atributos duplicados no mesmo pai
    if (parentId) {
      const dup = this.attributes.find(a => a.parentId === parentId && a.name.toLowerCase() === formattedName.toLowerCase());
      if (dup) {
        if (opts.isKey) dup.isKey = true;
        if (opts.isPartialKey) dup.isPartialKey = true;
        if (opts.isMultivalued) dup.isMultivalued = true;
        if (opts.isDerived) dup.isDerived = true;
        this.notify();
        return dup;
      }
    }

    const dims = this.calculateDimensions('attribute', formattedName);
    const attribute = {
      id: this.generateId('attr'),
      name: formattedName,
      type: 'attribute',
      parentId: parentId,
      isKey: Boolean(opts.isKey),
      isPartialKey: Boolean(opts.isPartialKey),
      isMultivalued: Boolean(opts.isMultivalued),
      isDerived: Boolean(opts.isDerived),
      x,
      y,
      width: dims.width,
      height: dims.height
    };

    this.attributes.push(attribute);

    // Se possui pai, conectar automaticamente
    if (parentId) {
      this.addConnection(attribute.id, parentId);
    }

    this.notify();
    return attribute;
  }

  // --- RELACIONAMENTOS ---
  addRelationship(name, x = 400, y = 200, isWeak = false) {
    const formattedName = name.trim().toUpperCase();
    let existing = this.relationships.find(r => r.name === formattedName);
    if (existing) {
      if (isWeak) existing.isWeak = true;
      this.notify();
      return { element: existing, created: false };
    }

    const dims = this.calculateDimensions('relationship', formattedName);
    const relationship = {
      id: this.generateId('rel'),
      name: formattedName,
      type: 'relationship',
      isWeak: Boolean(isWeak),
      x,
      y,
      width: dims.width,
      height: dims.height
    };

    this.relationships.push(relationship);
    this.notify();
    return { element: relationship, created: true };
  }

  // --- ESPECIALIZAÇÕES EER (d, o, u) ---
  addSpecialization(specType = 'd', superEntityId, subEntityIds = [], x = 300, y = 300) {
    const validTypes = ['d', 'o', 'u'];
    const type = validTypes.includes(specType.toLowerCase()) ? specType.toLowerCase() : 'd';

    const spec = {
      id: this.generateId('spec'),
      name: type.toUpperCase(),
      type: 'specialization',
      specType: type,
      superEntityId,
      subEntityIds,
      x,
      y,
      width: 36,
      height: 36
    };

    this.specializations.push(spec);

    // Conectar super-entidade e sub-entidades automaticamente
    if (superEntityId) {
      this.addConnection(superEntityId, spec.id);
    }
    subEntityIds.forEach(subId => {
      this.addConnection(spec.id, subId);
    });

    this.notify();
    return spec;
  }

  // --- CONEXÕES ---
  addConnection(sourceId, targetId, cardinalitySource = '', cardinalityTarget = '', options = {}) {
    if (!sourceId || !targetId || sourceId === targetId) return null;

    const opts = typeof options === 'boolean' ? { isTotal: options } : (options || {});
    const hasLegacyTotal = opts.isTotal !== undefined;
    const nextTotalSource = opts.isTotalSource !== undefined ? Boolean(opts.isTotalSource) : (hasLegacyTotal ? Boolean(opts.isTotal) : undefined);
    const nextTotalTarget = opts.isTotalTarget !== undefined ? Boolean(opts.isTotalTarget) : (hasLegacyTotal ? Boolean(opts.isTotal) : undefined);

    // Verificar se já existe conexão entre os dois elementos
    const existing = this.connections.find(
      c => (c.sourceId === sourceId && c.targetId === targetId) ||
           (c.sourceId === targetId && c.targetId === sourceId)
    );

    if (existing) {
      if (cardinalitySource) existing.cardinalitySource = cardinalitySource;
      if (cardinalityTarget) existing.cardinalityTarget = cardinalityTarget;
      if (nextTotalSource !== undefined) existing.isTotalSource = nextTotalSource;
      if (nextTotalTarget !== undefined) existing.isTotalTarget = nextTotalTarget;
      existing.isTotal = Boolean(existing.isTotalSource || existing.isTotalTarget);
      if (opts.roleSource) existing.roleSource = opts.roleSource;
      if (opts.roleTarget) existing.roleTarget = opts.roleTarget;
      this.notify();
      return existing;
    }

    const conn = {
      id: this.generateId('conn'),
      sourceId,
      targetId,
      cardinalitySource,
      cardinalityTarget,
      isTotalSource: Boolean(nextTotalSource),
      isTotalTarget: Boolean(nextTotalTarget),
      isTotal: Boolean(nextTotalSource || nextTotalTarget),
      roleSource: opts.roleSource || '',
      roleTarget: opts.roleTarget || ''
    };

    this.connections.push(conn);
    this.notify();
    return conn;
  }

  // --- REMOÇÃO ---
  removeElement(id) {
    this.entities = this.entities.filter(e => e.id !== id);
    this.attributes = this.attributes.filter(a => a.id !== id);
    this.relationships = this.relationships.filter(r => r.id !== id);
    this.specializations = this.specializations.filter(s => s.id !== id);
    
    // Remover conexões vinculadas ao elemento
    this.connections = this.connections.filter(c => c.sourceId !== id && c.targetId !== id);
    
    // Desvincular atributos se o pai foi removido
    this.attributes.forEach(a => {
      if (a.parentId === id) a.parentId = null;
    });

    this.notify();
  }

  removeConnection(connId) {
    this.connections = this.connections.filter(c => c.id !== connId);
    this.notify();
  }

  // --- BUSCA ---
  getElementById(id) {
    return this.entities.find(e => e.id === id) ||
           this.attributes.find(a => a.id === id) ||
           this.relationships.find(r => r.id === id) ||
           this.specializations.find(s => s.id === id);
  }

  findEntityByName(name) {
    const target = name.trim().toLowerCase();
    return this.entities.find(e => e.name.toLowerCase() === target);
  }

  findRelationshipByName(name) {
    const target = name.trim().toLowerCase();
    return this.relationships.find(r => r.name.toLowerCase() === target);
  }

  getAllElements() {
    return [...this.entities, ...this.attributes, ...this.relationships, ...this.specializations];
  }

  // --- ARRANJO AUTOMÁTICO DE LAYOUT (AUTO-LAYOUT) ---
  autoLayout() {
    if (this.entities.length === 0) return;

    const startX = 300;
    const startY = 300;
    const entitySpacingX = 340;
    const entitySpacingY = 300;

    const cols = Math.ceil(Math.sqrt(this.entities.length));
    
    // 1. Posicionar Entidades numa Grade Organizada
    this.entities.forEach((entity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      entity.x = startX + col * entitySpacingX;
      entity.y = startY + row * entitySpacingY;

      // Distribuir os atributos ao redor da entidade em órbita radial
      const entityAttrs = this.attributes.filter(a => a.parentId === entity.id);
      if (entityAttrs.length > 0) {
        const radius = 140;
        const angleStep = (2 * Math.PI) / entityAttrs.length;
        const startAngle = -Math.PI / 2;

        entityAttrs.forEach((attr, aIdx) => {
          const angle = startAngle + aIdx * angleStep;
          attr.x = Math.round(entity.x + radius * Math.cos(angle));
          attr.y = Math.round(entity.y + radius * Math.sin(angle));
        });
      }
    });

    // 2. Posicionar Relacionamentos no ponto médio das entidades que conectam
    this.relationships.forEach((rel, rIdx) => {
      const relConns = this.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const connectedEntities = relConns.map(c => {
        const otherId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        return this.entities.find(e => e.id === otherId);
      }).filter(Boolean);

      if (connectedEntities.length >= 2) {
        const avgX = connectedEntities.reduce((sum, e) => sum + e.x, 0) / connectedEntities.length;
        const avgY = connectedEntities.reduce((sum, e) => sum + e.y, 0) / connectedEntities.length;
        rel.x = Math.round(avgX);
        rel.y = Math.round(avgY);
      } else if (connectedEntities.length === 1) {
        rel.x = connectedEntities[0].x + 190;
        rel.y = connectedEntities[0].y;
      } else {
        rel.x = startX + rIdx * 200;
        rel.y = startY + 400;
      }

      // Atributos do relacionamento
      const relAttrs = this.attributes.filter(a => a.parentId === rel.id);
      if (relAttrs.length > 0) {
        const radius = 110;
        const angleStep = (2 * Math.PI) / relAttrs.length;
        relAttrs.forEach((attr, aIdx) => {
          const angle = aIdx * angleStep;
          attr.x = Math.round(rel.x + radius * Math.cos(angle));
          attr.y = Math.round(rel.y + radius * Math.sin(angle));
        });
      }
    });

    // 3. Posicionar Especializações EER entre a super-entidade e sub-entidades
    this.specializations.forEach((spec, sIdx) => {
      const superEnt = this.entities.find(e => e.id === spec.superEntityId);
      const subEnts = spec.subEntityIds.map(id => this.entities.find(e => e.id === id)).filter(Boolean);

      if (superEnt && subEnts.length > 0) {
        const avgSubX = subEnts.reduce((sum, e) => sum + e.x, 0) / subEnts.length;
        const avgSubY = subEnts.reduce((sum, e) => sum + e.y, 0) / subEnts.length;
        spec.x = Math.round((superEnt.x + avgSubX) / 2);
        spec.y = Math.round((superEnt.y + avgSubY) / 2);
      } else if (superEnt) {
        spec.x = superEnt.x;
        spec.y = superEnt.y + 120;
      }
    });

    // 4. Atributos órfãos (sem pai)
    const orphanAttrs = this.attributes.filter(a => !a.parentId);
    orphanAttrs.forEach((attr, idx) => {
      attr.x = 100;
      attr.y = 100 + idx * 60;
    });

    this.notify();
  }

  // --- SERIALIZAÇÃO ---
  toJSON() {
    return {
      entities: this.entities,
      attributes: this.attributes,
      relationships: this.relationships,
      specializations: this.specializations,
      connections: this.connections
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.entities = data.entities || [];
    this.attributes = data.attributes || [];
    this.relationships = data.relationships || [];
    this.specializations = data.specializations || [];
    this.connections = (data.connections || []).map(conn => {
      const totalSource = conn.isTotalSource !== undefined ? Boolean(conn.isTotalSource) : Boolean(conn.isTotal);
      const totalTarget = conn.isTotalTarget !== undefined ? Boolean(conn.isTotalTarget) : Boolean(conn.isTotal);
      return {
        ...conn,
        isTotalSource: totalSource,
        isTotalTarget: totalTarget,
        isTotal: Boolean(totalSource || totalTarget),
        roleSource: conn.roleSource || '',
        roleTarget: conn.roleTarget || ''
      };
    });
    this.notify();
  }
}
