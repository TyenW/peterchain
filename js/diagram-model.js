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
    if (this._suppressNotify) return;
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
  addSpecialization(specType = 'o', superEntityId, subEntityIds = [], x = 300, y = 300, isTotal = false, definingAttribute = '') {
    const validTypes = ['d', 'o', 'u'];
    const type = validTypes.includes(specType.toLowerCase()) ? specType.toLowerCase() : 'o';

    const spec = {
      id: this.generateId('spec'),
      name: type.toUpperCase(),
      type: 'specialization',
      specType: type,
      isTotal: Boolean(isTotal),          // true = linha dupla (especialização total), false = linha simples (parcial)
      definingAttribute: (definingAttribute || '').trim(), // atributo que define a divisão (ex: "Titulação")
      superEntityId,
      subEntityIds,
      x,
      y,
      width: 36,
      height: 36
    };

    this.specializations.push(spec);

    // Conectar super-entidade → círculo (linha dupla se isTotal = true)
    if (superEntityId) {
      this.addConnection(superEntityId, spec.id, '', '', {
        isTotalSource: Boolean(isTotal),
        isTotalTarget: false,
        isTotal: Boolean(isTotal)
      });
    }
    // Conectar círculo → sub-entidades (sempre linha simples com símbolo ⊂)
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
      roleTarget: opts.roleTarget || '',
      faceSource: opts.faceSource || 'auto',
      faceTarget: opts.faceTarget || 'auto'
    };

    console.log(`[DiagramModel] Criada conexão ${sourceId} -> ${targetId} | isTotal: ${conn.isTotal} (Source: ${conn.isTotalSource}, Target: ${conn.isTotalTarget})`);

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

  // --- ARRANJO AUTOMÁTICO DE LAYOUT INTELIGENTE (ORIENTADO A GRAFO ORTOGONAL & ESPARSO) ---
  autoLayout() {
    if (this.entities.length === 0) return;

    // 1. ORGANIZAR ENTIDADES EM CAMADAS/GRAFO ESPARSO
    const entityDegree = new Map();
    this.entities.forEach(e => entityDegree.set(e.id, 0));

    this.connections.forEach(c => {
      if (entityDegree.has(c.sourceId)) entityDegree.set(c.sourceId, entityDegree.get(c.sourceId) + 1);
      if (entityDegree.has(c.targetId)) entityDegree.set(c.targetId, entityDegree.get(c.targetId) + 1);
    });

    const superEntityIds = new Set(this.specializations.map(s => s.superEntityId));
    const subEntityIds = new Set(this.specializations.flatMap(s => s.subEntityIds));

    // Distribuir entidades em grade esparsa (espaçamento amplo)
    const cols = Math.max(2, Math.ceil(Math.sqrt(this.entities.length * 1.5)));
    const spacingX = 480; // Espaçamento amplo na horizontal
    const spacingY = 380; // Espaçamento amplo na vertical
    const startX = 200;
    const startY = 180;

    // Ordenar entidades por hierarquia e conectividade
    const sortedEntities = [...this.entities].sort((a, b) => {
      if (superEntityIds.has(a.id) && !superEntityIds.has(b.id)) return -1;
      if (!superEntityIds.has(a.id) && superEntityIds.has(b.id)) return 1;
      if (subEntityIds.has(a.id) && !subEntityIds.has(b.id)) return 1;
      if (!subEntityIds.has(a.id) && subEntityIds.has(b.id)) return -1;
      return (entityDegree.get(b.id) || 0) - (entityDegree.get(a.id) || 0);
    });

    // Posicionar Entidades alinhadas em grade ortogonal
    // Entidades participantes de especialização são puladas aqui e posicionadas pelo bloco EER abaixo
    const specParticipantIds = new Set([
      ...this.specializations.map(s => s.superEntityId),
      ...this.specializations.flatMap(s => s.subEntityIds)
    ].filter(Boolean));

    let gridIdx = 0;
    sortedEntities.forEach((entity) => {
      if (specParticipantIds.has(entity.id)) return; // Será posicionada pelo EER layout
      const col = gridIdx % cols;
      const row = Math.floor(gridIdx / cols);
      entity.x = Math.round((startX + col * spacingX) / 40) * 40;
      entity.y = Math.round((startY + row * spacingY) / 40) * 40;
      gridIdx++;
    });

    // 2. POSICIONAR RELACIONAMENTOS EM ÂNGULOS DE 90° (ORTOGONAIS) ENTRE AS ENTIDADES
    this.relationships.forEach((rel, rIdx) => {
      const relConns = this.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const connectedEntities = relConns.map(c => {
        const otherId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        return this.entities.find(e => e.id === otherId);
      }).filter(Boolean);

      if (connectedEntities.length >= 2) {
        // Se for entre 2 entidades: alinhar no ponto médio ortogonal
        const e1 = connectedEntities[0];
        const e2 = connectedEntities[1];

        if (e1.id === e2.id) {
          // Auto-relacionamento: colocar deslocado 90° à direita
          rel.x = e1.x + 220;
          rel.y = e1.y;
        } else {
          // Se estiverem mais alinhados na horizontal ou vertical, alinhar ortogonalmente a 90°
          const dx = Math.abs(e2.x - e1.x);
          const dy = Math.abs(e2.y - e1.y);

          if (dx > dy) {
            // Conexão predominantemente horizontal
            rel.x = Math.round(((e1.x + e2.x) / 2) / 20) * 20;
            rel.y = e1.y; // Mantém no mesmo alinhamento Y (90°)
          } else {
            // Conexão predominantemente vertical
            rel.x = e1.x; // Mantém no mesmo alinhamento X (90°)
            rel.y = Math.round(((e1.y + e2.y) / 2) / 20) * 20;
          }
        }
      } else if (connectedEntities.length === 1) {
        rel.x = connectedEntities[0].x + 220;
        rel.y = connectedEntities[0].y;
      } else {
        rel.x = startX + rIdx * 240;
        rel.y = startY + 500;
      }
    });

    // 3. POSICIONAR ESPECIALIZAÇÕES EER — Layout Idêntico à Notação Padrão (Imagem de Referência)
    // Estratégia:
    //   - Círculo (d/o/u): no centro (X, Y)
    //   - Superclasse:     diretamente ACIMA do círculo (X, Y - 180)
    //   - Subclasse 1:     à ESQUERDA do círculo, na MESMA altura (X - 260, Y)
    //   - Subclasse 2:     à DIREITA do círculo, na MESMA altura (X + 260, Y)
    //   - Subclasses N≥3:  abaixo do círculo (X, Y + 180)

    const positionedBySpec = new Set();
    let specGroupOffsetX = 0;

    this.specializations.forEach((spec) => {
      const superEnt = this.entities.find(e => e.id === spec.superEntityId);
      const subEnts  = spec.subEntityIds
        .map(id => this.entities.find(e => e.id === id))
        .filter(Boolean);

      if (subEnts.length === 0) return;

      const specX = startX + specGroupOffsetX + 260;
      const specY = startY + 180;

      spec.x = Math.round(specX / 40) * 40;
      spec.y = Math.round(specY / 40) * 40;

      // Superclasse diretamente acima do círculo
      if (superEnt) {
        superEnt.x = spec.x;
        superEnt.y = Math.round((spec.y - 180) / 40) * 40;
        positionedBySpec.add(superEnt.id);
      }

      if (subEnts.length === 1) {
        subEnts[0].x = spec.x;
        subEnts[0].y = Math.round((spec.y + 180) / 40) * 40;
        positionedBySpec.add(subEnts[0].id);
      } else if (subEnts.length === 2) {
        // Layout Padrão EER com 2 subclasses (Sub1 ← (d) → Sub2 na mesma linha horizontal Y)
        subEnts[0].x = Math.round((spec.x - 260) / 40) * 40;
        subEnts[0].y = spec.y; // Mesma altura Y do círculo!
        positionedBySpec.add(subEnts[0].id);

        subEnts[1].x = Math.round((spec.x + 260) / 40) * 40;
        subEnts[1].y = spec.y; // Mesma altura Y do círculo!
        positionedBySpec.add(subEnts[1].id);
      } else {
        // N >= 3 subclasses: Esquerda, Direita e as demais abaixo
        subEnts[0].x = Math.round((spec.x - 280) / 40) * 40;
        subEnts[0].y = spec.y;
        positionedBySpec.add(subEnts[0].id);

        subEnts[1].x = Math.round((spec.x + 280) / 40) * 40;
        subEnts[1].y = spec.y;
        positionedBySpec.add(subEnts[1].id);

        const remaining = subEnts.slice(2);
        const remGap = 240;
        const remStartX = spec.x - ((remaining.length - 1) * remGap) / 2;
        remaining.forEach((subEnt, rIdx) => {
          subEnt.x = Math.round((remStartX + rIdx * remGap) / 40) * 40;
          subEnt.y = Math.round((spec.y + 180) / 40) * 40;
          positionedBySpec.add(subEnt.id);
        });
      }

      specGroupOffsetX += 580;
    });


    // 4. DISTRIBUIR ATRIBUTOS DAS ENTIDADES EM ÂNGULOS DE 90° E 45° ESPARSOS
    this.entities.forEach(entity => {
      const entityAttrs = this.attributes.filter(a => a.parentId === entity.id);
      if (entityAttrs.length === 0) return;

      // Direção dos relacionamentos para evitar que os atributos fiquem no caminho dos cabos
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

      // Preferir direções cardinais de 90° (Cima, Baixo, Esquerda, Direita) e 45°
      const cardinalAngles = [
        -Math.PI / 2, // Cima (90°)
        Math.PI / 2,  // Baixo (90°)
        Math.PI,      // Esquerda (90°)
        0,            // Direita (90°)
        -Math.PI / 4, // Cima-Direita (45°)
        -3 * Math.PI / 4, // Cima-Esquerda (45°)
        3 * Math.PI / 4,  // Baixo-Esquerda (45°)
        Math.PI / 4   // Baixo-Direita (45°)
      ];

      // Filtrar ângulos para apontar longe das conexões
      let baseAngle = Math.PI / 2;
      if (dxSum !== 0 || dySum !== 0) {
        baseAngle = Math.atan2(-dySum, -dxSum); // Sentido oposto às conexões
      }

      // Ordenar ângulos cardinais pela proximidade do ângulo oposto
      const availableAngles = [...cardinalAngles].sort((a, b) => {
        const diffA = Math.abs(Math.atan2(Math.sin(a - baseAngle), Math.cos(a - baseAngle)));
        const diffB = Math.abs(Math.atan2(Math.sin(b - baseAngle), Math.cos(b - baseAngle)));
        return diffA - diffB;
      });

      const radius = Math.max(160, entityAttrs.length * 25); // Raio amplo para não encostar

      entityAttrs.forEach((attr, aIdx) => {
        const angle = availableAngles[aIdx % availableAngles.length];
        const distMult = 1 + Math.floor(aIdx / availableAngles.length) * 0.4;
        const finalRadius = radius * distMult;

        attr.x = Math.round((entity.x + finalRadius * Math.cos(angle)) / 20) * 20;
        attr.y = Math.round((entity.y + finalRadius * Math.sin(angle)) / 20) * 20;

        // Se o atributo for composto, posicionar sub-atributos radialmente a partir dele
        const subAttrs = this.attributes.filter(a => a.parentId === attr.id);
        if (subAttrs.length > 0) {
          subAttrs.forEach((sub, sIdx) => {
            const subAngle = angle + (sIdx - (subAttrs.length - 1) / 2) * 0.4;
            sub.x = Math.round((attr.x + 110 * Math.cos(subAngle)) / 10) * 10;
            sub.y = Math.round((attr.y + 110 * Math.sin(subAngle)) / 10) * 10;
          });
        }
      });
    });

    // 5. DISTRIBUIR ATRIBUTOS DE RELACIONAMENTOS EM ÂNGULOS DE 90°
    this.relationships.forEach(rel => {
      const relAttrs = this.attributes.filter(a => a.parentId === rel.id);
      if (relAttrs.length === 0) return;

      const radius = 130;
      const angles = [-Math.PI / 2, Math.PI / 2, -Math.PI / 4, Math.PI / 4];

      relAttrs.forEach((attr, aIdx) => {
        const angle = angles[aIdx % angles.length];
        attr.x = Math.round((rel.x + radius * Math.cos(angle)) / 20) * 20;
        attr.y = Math.round((rel.y + radius * Math.sin(angle)) / 20) * 20;
      });
    });

    // 6. ATRIBUTOS ÓRFÃOS
    const orphanAttrs = this.attributes.filter(a => !a.parentId);
    orphanAttrs.forEach((attr, idx) => {
      attr.x = 120;
      attr.y = 120 + idx * 60;
    });

    // 7. RESOLUÇÃO RIGOROSA DE SOBREPOSIÇÃO (GARANTINDO DISTÂNCIA ESPARSA)
    const allElements = this.getAllElements();
    const iterations = 12;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < allElements.length; i++) {
        for (let j = i + 1; j < allElements.length; j++) {
          const e1 = allElements[i];
          const e2 = allElements[j];

          // Se um for pai do outro (sub-atributo), respeitar o raio do pai
          if (e1.parentId === e2.id || e2.parentId === e1.id) continue;

          // Distância mínima generosa para nunca sobrepor nem cruzar
          let minDist = 160;
          if (e1.type === 'entity' && e2.type === 'entity') minDist = 300;
          else if (e1.type === 'entity' || e2.type === 'entity') minDist = 220;
          else if (e1.type === 'relationship' && e2.type === 'relationship') minDist = 220;
          else if (e1.type === 'attribute' && e2.type === 'attribute') minDist = 140;

          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

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

    // Auto-detect format: if first entity lacks an ID, or if 'connections' is missing but relationships have 'participants', it's the external DSL format
    const isExternalFormat = (data.entities && data.entities.length > 0 && !data.entities[0].id) ||
                             (data.relationships && data.relationships.length > 0 && data.relationships[0].participants);

    this._suppressNotify = true;
    try {
      if (isExternalFormat) {
        this._parseExternalJSON(data);
      } else {
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
      }
    } finally {
      this._suppressNotify = false;
    }

    if (isExternalFormat || this._positionsNeedAutoLayout()) {
      this.autoLayout();
    } else {
      this.notify();
    }
  }

  _positionsNeedAutoLayout() {
    const elements = this.getAllElements();
    if (elements.length === 0) return false;

    const missingCoords = elements.some(el => typeof el.x !== 'number' || typeof el.y !== 'number');
    if (missingCoords) return true;

    if (elements.length === 1) return false;

    const first = elements[0];
    return elements.every(el => el.x === first.x && el.y === first.y);
  }

  _parseExternalJSON(data) {
    this.entities = [];
    this.attributes = [];
    this.relationships = [];
    this.connections = [];
    this.specializations = [];

    const entityNameMap = new Map();

    // 1. Entities
    if (data.entities) {
      data.entities.forEach(entData => {
        const isWeak = entData.type === 'weak';
        const { element: ent } = this.addEntity(entData.name, 0, 0, isWeak);
        entityNameMap.set(entData.name, ent.id);

        if (entData.attributes) {
          entData.attributes.forEach(attrData => {
            const opts = {
              isKey: attrData.type === 'key',
              isPartialKey: attrData.type === 'partial_key',
              isMultivalued: attrData.type === 'multivalued',
              isDerived: attrData.type === 'derived'
            };
            this.addAttribute(attrData.name, ent.id, opts);
          });
        }
      });
    }

    // 2. Relationships
    if (data.relationships) {
      data.relationships.forEach(relData => {
        const isWeak = relData.type === 'identifying';
        const { element: rel } = this.addRelationship(relData.name, 0, 0, isWeak);

        if (relData.attributes) {
          relData.attributes.forEach(attrData => {
            const opts = {
              isKey: attrData.type === 'key',
              isPartialKey: attrData.type === 'partial_key',
              isMultivalued: attrData.type === 'multivalued',
              isDerived: attrData.type === 'derived'
            };
            this.addAttribute(attrData.name, rel.id, opts);
          });
        }

        if (relData.participants) {
          relData.participants.forEach(part => {
            const targetId = entityNameMap.get(part.entity);
            if (targetId) {
              this.addConnection(rel.id, targetId, '', part.cardinality || '', {
                isTotalTarget: Boolean(part.total),
                roleTarget: part.role || ''
              });
            }
          });
        }
      });
    }

    // 3. Specializations
    if (data.specializations) {
      data.specializations.forEach(specData => {
        const superId = entityNameMap.get(specData.superEntity);
        const subIds = (specData.subEntities || []).map(name => entityNameMap.get(name)).filter(Boolean);

        if (superId && subIds.length > 0) {
          this.addSpecialization(specData.type || 'd', superId, subIds, undefined, undefined, Boolean(specData.total));
        }
      });
    }
  }
}
