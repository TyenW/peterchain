/**
 * DER Builder — Modelo Lógico de Dados do Diagrama ER (Peter Chen)
 */
class DiagramModel {
  constructor() {
    this.entities = [];      // { id, name, type: 'entity', x, y, width, height }
    this.attributes = [];    // { id, name, type: 'attribute', parentId, isKey, x, y, width, height }
    this.relationships = []; // { id, name, type: 'relationship', x, y, width, height }
    this.connections = [];   // { id, sourceId, targetId, cardinalitySource: '1'|'N', cardinalityTarget: '1'|'N' }
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  generateId(prefix = 'elem') {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clear() {
    this.entities = [];
    this.attributes = [];
    this.relationships = [];
    this.connections = [];
    this.notify();
  }

  // --- ENTIDADES ---
  addEntity(name, x = 200, y = 200) {
    const formattedName = name.trim().toUpperCase();
    let existing = this.entities.find(e => e.name === formattedName);
    if (existing) return existing;

    const entity = {
      id: this.generateId('entity'),
      name: formattedName,
      type: 'entity',
      x,
      y,
      width: Math.max(120, formattedName.length * 10 + 30),
      height: 50
    };

    this.entities.push(entity);
    this.notify();
    return entity;
  }

  // --- ATRIBUTOS ---
  addAttribute(name, parentId = null, isKey = false, x = 0, y = 0) {
    const formattedName = name.trim();
    if (!formattedName) return null;

    // Evitar atributos duplicados no mesmo pai
    if (parentId) {
      const dup = this.attributes.find(a => a.parentId === parentId && a.name.toLowerCase() === formattedName.toLowerCase());
      if (dup) {
        if (isKey) dup.isKey = true;
        this.notify();
        return dup;
      }
    }

    const attribute = {
      id: this.generateId('attr'),
      name: formattedName,
      type: 'attribute',
      parentId: parentId,
      isKey: Boolean(isKey),
      x,
      y,
      width: Math.max(90, formattedName.length * 8 + 24),
      height: 40
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
  addRelationship(name, x = 400, y = 200) {
    const formattedName = name.trim().toUpperCase();
    let existing = this.relationships.find(r => r.name === formattedName);
    if (existing) return existing;

    const relationship = {
      id: this.generateId('rel'),
      name: formattedName,
      type: 'relationship',
      x,
      y,
      width: Math.max(110, formattedName.length * 10 + 40),
      height: 65
    };

    this.relationships.push(relationship);
    this.notify();
    return relationship;
  }

  // --- CONEXÕES ---
  addConnection(sourceId, targetId, cardinalitySource = '', cardinalityTarget = '') {
    if (!sourceId || !targetId || sourceId === targetId) return null;

    // Verificar se já existe conexão entre os dois elementos
    const existing = this.connections.find(
      c => (c.sourceId === sourceId && c.targetId === targetId) ||
           (c.sourceId === targetId && c.targetId === sourceId)
    );

    if (existing) {
      if (cardinalitySource) existing.cardinalitySource = cardinalitySource;
      if (cardinalityTarget) existing.cardinalityTarget = cardinalityTarget;
      this.notify();
      return existing;
    }

    const conn = {
      id: this.generateId('conn'),
      sourceId,
      targetId,
      cardinalitySource,
      cardinalityTarget
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
    
    // Remover conexões vinculadas ao elemento
    this.connections = this.connections.filter(c => c.sourceId !== id && c.targetId !== id);
    
    // Desvincular atributos se a entidade pai foi removida
    this.attributes.forEach(a => {
      if (a.parentId === id) a.parentId = null;
    });

    this.notify();
  }

  removeConnection(connId) {
    this.connections = this.connections.filter(c => c.id !== connId);
    this.notify();
  }

  // --- BUSCA E BUSCA POR NOME ---
  getElementById(id) {
    return this.entities.find(e => e.id === id) ||
           this.attributes.find(a => a.id === id) ||
           this.relationships.find(r => r.id === id);
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
    return [...this.entities, ...this.attributes, ...this.relationships];
  }

  // --- ARRANJO AUTOMÁTICO DE LAYOUT (AUTO-LAYOUT) ---
  autoLayout() {
    if (this.entities.length === 0) return;

    const startX = 300;
    const startY = 300;
    const entitySpacingX = 320;
    const entitySpacingY = 280;

    const cols = Math.ceil(Math.sqrt(this.entities.length));
    
    // Posicionar Entidades numa Grade Organizada
    this.entities.forEach((entity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      entity.x = startX + col * entitySpacingX;
      entity.y = startY + row * entitySpacingY;

      // Distribuir os atributos ao redor da entidade em órbita radial
      const entityAttrs = this.attributes.filter(a => a.parentId === entity.id);
      if (entityAttrs.length > 0) {
        const radius = 130;
        const angleStep = (2 * Math.PI) / entityAttrs.length;
        // Iniciar ângulo apontando para cima/esquerda
        const startAngle = -Math.PI / 2;

        entityAttrs.forEach((attr, aIdx) => {
          const angle = startAngle + aIdx * angleStep;
          attr.x = entity.x + radius * Math.cos(angle);
          attr.y = entity.y + radius * Math.sin(angle);
        });
      }
    });

    // Posicionar Relacionamentos no ponto médio das entidades que conectam
    this.relationships.forEach((rel, rIdx) => {
      const relConns = this.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const connectedEntities = relConns.map(c => {
        const otherId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        return this.entities.find(e => e.id === otherId);
      }).filter(Boolean);

      if (connectedEntities.length >= 2) {
        // Ponto médio das entidades conectadas
        const avgX = connectedEntities.reduce((sum, e) => sum + e.x, 0) / connectedEntities.length;
        const avgY = connectedEntities.reduce((sum, e) => sum + e.y, 0) / connectedEntities.length;
        rel.x = avgX;
        rel.y = avgY;
      } else if (connectedEntities.length === 1) {
        // Ao lado da única entidade conectada
        rel.x = connectedEntities[0].x + 180;
        rel.y = connectedEntities[0].y;
      } else {
        // Posição padrão
        rel.x = startX + rIdx * 200;
        rel.y = startY + 400;
      }

      // Distribuir atributos do relacionamento se houver
      const relAttrs = this.attributes.filter(a => a.parentId === rel.id);
      if (relAttrs.length > 0) {
        const radius = 110;
        const angleStep = (2 * Math.PI) / relAttrs.length;
        relAttrs.forEach((attr, aIdx) => {
          const angle = aIdx * angleStep;
          attr.x = rel.x + radius * Math.cos(angle);
          attr.y = rel.y + radius * Math.sin(angle);
        });
      }
    });

    // Atributos órfãos (sem pai)
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
      connections: this.connections
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.entities = data.entities || [];
    this.attributes = data.attributes || [];
    this.relationships = data.relationships || [];
    this.connections = data.connections || [];
    this.notify();
  }
}
