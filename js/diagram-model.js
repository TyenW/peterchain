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

    // Reaproveita conexão existente apenas se for para a mesma perna/papel e não exigir forceNew
    const existing = this.connections.find(
      c => (c.sourceId === sourceId && c.targetId === targetId) &&
           (!opts.roleSource || c.roleSource === opts.roleSource) &&
           (!opts.forceNew)
    );

    if (existing && !opts.forceNew) {
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

  // --- ARRANJO AUTOMÁTICO DE LAYOUT INTELIGENTE (ORIENTADO A GRAFO) ---
  autoLayout() {
    if (this.entities.length === 0) return;

    // 1. ORGANIZAR ENTIDADES EM CAMADAS/GRAFO
    // Identificar super-entidades, entidades fracas e conectividade
    const entityDegree = new Map();
    this.entities.forEach(e => entityDegree.set(e.id, 0));

    this.connections.forEach(c => {
      if (entityDegree.has(c.sourceId)) entityDegree.set(c.sourceId, entityDegree.get(c.sourceId) + 1);
      if (entityDegree.has(c.targetId)) entityDegree.set(c.targetId, entityDegree.get(c.targetId) + 1);
    });

    // Separar entidades por níveis (super-entidades no topo, normais no centro, sub-entidades e fracas abaixo)
    const superEntityIds = new Set(this.specializations.map(s => s.superEntityId));
    const subEntityIds = new Set(this.specializations.flatMap(s => s.subEntityIds));

    // Determinar colunas e linhas
    const cols = Math.max(2, Math.ceil(Math.sqrt(this.entities.length * 1.3)));
    const spacingX = 380;
    const spacingY = 280;
    const startX = 140;
    const startY = 120;

    // Ordenar entidades: Super-entidades primeiro, depois por grau de conexão, sub-entidades por último
    const sortedEntities = [...this.entities].sort((a, b) => {
      if (superEntityIds.has(a.id) && !superEntityIds.has(b.id)) return -1;
      if (!superEntityIds.has(a.id) && superEntityIds.has(b.id)) return 1;
      if (subEntityIds.has(a.id) && !subEntityIds.has(b.id)) return 1;
      if (!subEntityIds.has(a.id) && subEntityIds.has(b.id)) return -1;
      return (entityDegree.get(b.id) || 0) - (entityDegree.get(a.id) || 0);
    });

    // Posicionar Entidades
    sortedEntities.forEach((entity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      entity.x = Math.round((startX + col * spacingX) / 20) * 20;
      entity.y = Math.round((startY + row * spacingY) / 20) * 20;
    });

    // 2. POSICIONAR RELACIONAMENTOS NO CENTROIDE DAS ENTIDADES CONECTADAS
    this.relationships.forEach((rel, rIdx) => {
      const relConns = this.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const connectedEntities = relConns.map(c => {
        const otherId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        return this.entities.find(e => e.id === otherId);
      }).filter(Boolean);

      if (connectedEntities.length >= 2) {
        // Ponto médio / centroide
        const avgX = connectedEntities.reduce((sum, e) => sum + e.x, 0) / connectedEntities.length;
        const avgY = connectedEntities.reduce((sum, e) => sum + e.y, 0) / connectedEntities.length;

        // Se for auto-relacionamento (mesma entidade)
        if (connectedEntities.length === 2 && connectedEntities[0].id === connectedEntities[1].id) {
          rel.x = connectedEntities[0].x + 180;
          rel.y = connectedEntities[0].y;
        } else {
          rel.x = Math.round(avgX / 20) * 20;
          rel.y = Math.round(avgY / 20) * 20;
        }
      } else if (connectedEntities.length === 1) {
        rel.x = connectedEntities[0].x + 180;
        rel.y = connectedEntities[0].y;
      } else {
        rel.x = startX + rIdx * 200;
        rel.y = startY + 400;
      }
    });

    // 3. POSICIONAR ESPECIALIZAÇÕES EER ENTRE SUPER E SUB-ENTIDADES
    this.specializations.forEach(spec => {
      const superEnt = this.entities.find(e => e.id === spec.superEntityId);
      const subEnts = spec.subEntityIds.map(id => this.entities.find(e => e.id === id)).filter(Boolean);

      if (superEnt && subEnts.length > 0) {
        const avgSubX = subEnts.reduce((sum, e) => sum + e.x, 0) / subEnts.length;
        const avgSubY = subEnts.reduce((sum, e) => sum + e.y, 0) / subEnts.length;
        spec.x = Math.round(((superEnt.x + avgSubX) / 2) / 20) * 20;
        spec.y = Math.round(((superEnt.y + avgSubY) / 2) / 20) * 20;
      } else if (superEnt) {
        spec.x = superEnt.x;
        spec.y = superEnt.y + 100;
      }
    });

    // 4. DISTRIBUIR ATRIBUTOS DAS ENTIDADES EM LEQUE (LEAVING INNER PATHS CLEAR)
    this.entities.forEach(entity => {
      const entityAttrs = this.attributes.filter(a => a.parentId === entity.id);
      if (entityAttrs.length === 0) return;

      // Encontrar direção dos relacionamentos conectados para evitar colisão
      const connectedRelConns = this.connections.filter(c => c.sourceId === entity.id || c.targetId === entity.id);
      let dxSum = 0;
      let dySum = 0;

      connectedRelConns.forEach(conn => {
        const otherId = conn.sourceId === entity.id ? conn.targetId : conn.sourceId;
        const otherElem = this.getElementById(otherId);
        if (otherElem) {
          dxSum += (otherElem.x - entity.x);
          dySum += (otherElem.y - entity.y);
        }
      });

      // Ângulo para onde apontam os relacionamentos
      let freeAngleStart, freeAngleEnd;

      if (dxSum === 0 && dySum === 0) {
        // Sem conexões: 360° em volta da entidade
        freeAngleStart = -Math.PI / 2;
        freeAngleEnd = freeAngleStart + 2 * Math.PI;
      } else {
        // Apontar atributos no sentido OPOSTO aos relacionamentos!
        const connAngle = Math.atan2(dySum, dxSum);
        const oppositeAngle = connAngle + Math.PI;

        // Leque de 180° centrado no ângulo oposto
        const span = Math.min(Math.PI * 1.4, Math.PI * 0.4 + entityAttrs.length * 0.25);
        freeAngleStart = oppositeAngle - span / 2;
        freeAngleEnd = oppositeAngle + span / 2;
      }

      const radius = Math.max(130, entityAttrs.length * 20);
      const count = entityAttrs.length;

      entityAttrs.forEach((attr, aIdx) => {
        const step = count > 1 ? (freeAngleEnd - freeAngleStart) / (count - 1) : 0;
        const angle = count === 1 ? (freeAngleStart + freeAngleEnd) / 2 : freeAngleStart + aIdx * step;

        attr.x = Math.round((entity.x + radius * Math.cos(angle)) / 10) * 10;
        attr.y = Math.round((entity.y + radius * Math.sin(angle)) / 10) * 10;
      });
    });

    // 5. DISTRIBUIR ATRIBUTOS DE RELACIONAMENTOS
    this.relationships.forEach(rel => {
      const relAttrs = this.attributes.filter(a => a.parentId === rel.id);
      if (relAttrs.length === 0) return;

      const radius = 100;
      const angleStep = (Math.PI * 1.2) / Math.max(1, relAttrs.length);
      const startAngle = -Math.PI * 0.6;

      relAttrs.forEach((attr, aIdx) => {
        const angle = startAngle + aIdx * angleStep;
        attr.x = Math.round((rel.x + radius * Math.cos(angle)) / 10) * 10;
        attr.y = Math.round((rel.y + radius * Math.sin(angle)) / 10) * 10;
      });
    });

    // 6. ATRIBUTOS ÓRFÃOS
    const orphanAttrs = this.attributes.filter(a => !a.parentId);
    orphanAttrs.forEach((attr, idx) => {
      attr.x = 100;
      attr.y = 100 + idx * 50;
    });

    // 7. PASSO DE RESOLUÇÃO DE COLISÕES (ZERO SOBREPOSIÇÃO)
    const allElements = this.getAllElements();
    const iterations = 8;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < allElements.length; i++) {
        for (let j = i + 1; j < allElements.length; j++) {
          const e1 = allElements[i];
          const e2 = allElements[j];

          // Se um for atributo do outro, mantemos o raio em vez de repelir desordenadamente
          if (e1.parentId === e2.id || e2.parentId === e1.id) continue;

          // Distância mínima necessária para não sobrepor
          let minDist = 120;
          if (e1.type === 'entity' && e2.type === 'entity') minDist = 220;
          else if (e1.type === 'entity' || e2.type === 'entity') minDist = 160;
          else if (e1.type === 'relationship' && e2.type === 'relationship') minDist = 160;
          else if (e1.type === 'attribute' && e2.type === 'attribute') minDist = 110;

          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            // Se apenas um for atributo, movemos apenas o atributo para preservar a grade de entidades
            if (e1.type === 'attribute' && e2.type !== 'attribute') {
              e1.x -= nx * overlap * 2;
              e1.y -= ny * overlap * 2;
            } else if (e2.type === 'attribute' && e1.type !== 'attribute') {
              e2.x += nx * overlap * 2;
              e2.y += ny * overlap * 2;
            } else {
              e1.x -= nx * overlap;
              e1.y -= ny * overlap;
              e2.x += nx * overlap;
              e2.y += ny * overlap;
            }
          }
        }
      }
    }

    // Arredondar posições finais à grade
    allElements.forEach(elem => {
      elem.x = Math.round(elem.x / 10) * 10;
      elem.y = Math.round(elem.y / 10) * 10;
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
