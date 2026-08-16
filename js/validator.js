/**
 * DER Builder — Validador de Regras Estruturais do DER
 */
class DERValidator {
  constructor(model) {
    this.model = model;
  }

  validate() {
    const issues = []; // { type: 'error'|'warning'|'success', message: string, elementId?: string }

    if (this.model.entities.length === 0) {
      return {
        isValid: true,
        status: 'valid',
        statusText: 'Diagrama vazio',
        issues: [{ type: 'info', message: 'Nenhum elemento no diagrama.' }]
      };
    }

    // --- REGRA 1: Entidades sem atributo identificador (Chave Primária ou Parcial) ---
    this.model.entities.forEach(entity => {
      const entityAttrs = this.model.attributes.filter(a => a.parentId === entity.id);
      const hasKey = entityAttrs.some(a => a.isKey || a.isPartialKey);

      if (entityAttrs.length === 0) {
        issues.push({
          type: 'warning',
          message: `A entidade [${entity.name}] não possui atributos cadastrados.`,
          elementId: entity.id
        });
      } else if (!hasKey) {
        issues.push({
          type: 'warning',
          message: `A entidade [${entity.name}] não possui atributo identificador (Chave Primária ou Parcial). Na notação de Chen, toda entidade deve ser identificável.`,
          elementId: entity.id
        });
      }

      // Regra 1b: Entidade Fraca sem Relacionamento Identificador / Chave Parcial
      if (entity.isWeak) {
        const hasPartialKey = entityAttrs.some(a => a.isPartialKey);
        const relConns = this.model.connections.filter(c => c.sourceId === entity.id || c.targetId === entity.id);
        const hasWeakRel = relConns.some(c => {
          const otherId = c.sourceId === entity.id ? c.targetId : c.sourceId;
          const rel = this.model.relationships.find(r => r.id === otherId);
          return rel && rel.isWeak;
        });

        if (!hasWeakRel && !hasPartialKey) {
          issues.push({
            type: 'warning',
            message: `A Entidade Fraca [${entity.name}] deve estar conectada a um Relacionamento Identificador (Losango Duplo) ou possuir uma Chave Parcial / Discriminador (_nome_).`,
            elementId: entity.id
          });
        }
      }
    });

    // --- REGRA 2: Relacionamentos sem 2 entidades conectadas ---
    this.model.relationships.forEach(rel => {
      const relConns = this.model.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const connectedEntityIds = new Set();

      relConns.forEach(c => {
        const otherId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        if (this.model.entities.some(e => e.id === otherId)) {
          connectedEntityIds.add(otherId);
        }
      });

      if (connectedEntityIds.size < 2) {
        issues.push({
          type: 'error',
          message: `O relacionamento [${rel.name}] precisa estar conectado a pelo menos duas entidades. Na notação de Chen, relacionamentos associam duas ou mais entidades.`,
          elementId: rel.id
        });
      }
    });

    // --- REGRA 3: Atributos órfãos (sem entidade ou relacionamento pai) ---
    this.model.attributes.forEach(attr => {
      if (!attr.parentId) {
        issues.push({
          type: 'warning',
          message: `O atributo [${attr.name}] está desconectado de qualquer entidade ou relacionamento.`,
          elementId: attr.id
        });
      }
    });

    // --- REGRA 4: Nomes duplicados entre categorias diferentes (Entidade X e Relacionamento X) ---
    this.model.entities.forEach(ent => {
      const dupRel = this.model.relationships.find(r => r.name.toLowerCase() === ent.name.toLowerCase());
      if (dupRel) {
        issues.push({
          type: 'warning',
          message: `A Entidade [${ent.name}] e o Relacionamento [${dupRel.name}] possuem o mesmo nome. Recomenda-se usar substantivos no singular para Entidades e verbos para Relacionamentos.`,
          elementId: ent.id
        });
      }
    });

    // --- REGRA 5: Cardinalidade atribuída indevidamente a atributo ---
    this.model.connections.forEach(conn => {
      const src = this.model.getElementById(conn.sourceId);
      const tgt = this.model.getElementById(conn.targetId);
      if ((src && src.type === 'attribute') || (tgt && tgt.type === 'attribute')) {
        if (conn.cardinalitySource || conn.cardinalityTarget) {
          issues.push({
            type: 'warning',
            message: `Atributos não carregam cardinalidade. Remova a cardinalidade da ligação de [${src ? src.name : ''}].`,
            elementId: conn.id
          });
        }
      }
    });

    // Determinar status geral
    const hasError = issues.some(i => i.type === 'error');
    const hasWarning = issues.some(i => i.type === 'warning');

    let status = 'valid';
    let statusText = 'Diagrama estruturalmente válido';

    if (hasError) {
      status = 'invalid';
      statusText = 'Inconsistências encontradas no diagrama';
    } else if (hasWarning) {
      status = 'warning';
      statusText = 'Avisos estruturais pendentes';
    }

    if (issues.length === 0) {
      issues.push({ type: 'success', message: 'Todas as regras estruturais de Peter Chen foram atendidas.' });
    }

    return {
      isValid: !hasError,
      status,
      statusText,
      issues
    };
  }
}
