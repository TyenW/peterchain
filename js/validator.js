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

    // --- REGRA 1: Entidades sem atributo identificador (Chave) ---
    this.model.entities.forEach(entity => {
      const entityAttrs = this.model.attributes.filter(a => a.parentId === entity.id);
      const hasKey = entityAttrs.some(a => a.isKey);

      if (entityAttrs.length === 0) {
        issues.push({
          type: 'warning',
          message: `A entidade [${entity.name}] não possui atributos cadastrados.`,
          elementId: entity.id
        });
      } else if (!hasKey) {
        issues.push({
          type: 'warning',
          message: `A entidade [${entity.name}] não possui atributo identificador (Chave).`,
          elementId: entity.id
        });
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
          message: `O relacionamento [${rel.name}] precisa estar conectado a pelo menos duas entidades (conectado a ${connectedEntityIds.size}).`,
          elementId: rel.id
        });
      }
    });

    // --- REGRA 3: Atributos órfãos (sem entidade ou relacionamento pai) ---
    this.model.attributes.forEach(attr => {
      if (!attr.parentId) {
        issues.push({
          type: 'warning',
          message: `O atributo [${attr.name}] está desconectado de qualquer entidade.`,
          elementId: attr.id
        });
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
