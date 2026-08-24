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

    // --- REGRA 2: Relacionamentos sem 2 entidades/participações conectadas ---
    this.model.relationships.forEach(rel => {
      const relConns = this.model.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const connectedEntityIds = new Set();
      let entityConnCount = 0;

      relConns.forEach(c => {
        const otherId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        if (this.model.entities.some(e => e.id === otherId)) {
          connectedEntityIds.add(otherId);
          entityConnCount++;
        }
      });

      if (entityConnCount < 2) {
        issues.push({
          type: 'error',
          message: `O relacionamento [${rel.name}] precisa estar conectado a pelo menos duas entidades (ou possuir duas participações em auto-relacionamento).`,
          elementId: rel.id
        });
      }

      if (rel.isWeak) {
        const connectedEntities = [...connectedEntityIds]
          .map(id => this.model.entities.find(e => e.id === id))
          .filter(Boolean);
        const hasWeakEntity = connectedEntities.some(e => e.isWeak);

        if (!hasWeakEntity) {
          issues.push({
            type: 'warning',
            message: `O relacionamento identificador [${rel.name}] não está conectado a nenhuma Entidade Fraca. Verifique se o Losango Duplo está sendo usado no contexto correto.`,
            elementId: rel.id
          });
        }
      }
    });

    // --- REGRA 2b: Especializações EER consistentes ---
    this.model.specializations.forEach(spec => {
      const validSpecTypes = ['d', 'o', 'u'];
      const type = (spec.specType || '').toLowerCase();

      if (!validSpecTypes.includes(type)) {
        issues.push({
          type: 'error',
          message: `A especialização [${spec.id}] possui tipo inválido. Use apenas d, o ou u.`,
          elementId: spec.id
        });
      }

      const superEnt = this.model.entities.find(e => e.id === spec.superEntityId);
      if (!superEnt) {
        issues.push({
          type: 'error',
          message: `A especialização [${spec.id}] não possui superentidade válida conectada.`,
          elementId: spec.id
        });
      }

      const subIds = Array.isArray(spec.subEntityIds) ? spec.subEntityIds : [];
      if (subIds.length === 0) {
        issues.push({
          type: 'error',
          message: `A especialização [${spec.id}] precisa de pelo menos uma subentidade.`,
          elementId: spec.id
        });
      }

      const uniqueSubIds = new Set();
      subIds.forEach(subId => {
        if (uniqueSubIds.has(subId)) {
          issues.push({
            type: 'warning',
            message: `A especialização [${spec.id}] possui subentidade repetida.`,
            elementId: spec.id
          });
        }
        uniqueSubIds.add(subId);

        const subEnt = this.model.entities.find(e => e.id === subId);
        if (!subEnt) {
          issues.push({
            type: 'error',
            message: `A especialização [${spec.id}] referencia subentidade inexistente.`,
            elementId: spec.id
          });
        }
        if (spec.superEntityId && subId === spec.superEntityId) {
          issues.push({
            type: 'error',
            message: `A especialização [${spec.id}] não pode usar a mesma entidade como superentidade e subentidade.`,
            elementId: spec.id
          });
        }

        // Regra de Projeto: subclasse sem atributos próprios é candidata a mesclagem
        if (subEnt) {
          const subAttrs = this.model.attributes.filter(a => a.parentId === subEnt.id);
          const subConns = this.model.connections.filter(c =>
            (c.sourceId === subEnt.id || c.targetId === subEnt.id) &&
            !this.model.specializations.some(s => s.id === c.sourceId || s.id === c.targetId)
          );
          if (subAttrs.length === 0 && subConns.length === 0) {
            issues.push({
              type: 'warning',
              message: `A subclasse [${subEnt.name}] não possui atributos nem relacionamentos próprios. Considere mesclá-la de volta à superclasse com um "atributo de tipo".`,
              elementId: subEnt.id
            });
          }
        }
      });

      // Regra de Uso Restrito: União (u) deve ser usada com cautela
      if (type === 'u') {
        issues.push({
          type: 'warning',
          message: `Aviso de Projeto: A construção de União [u] em [${superEnt ? superEnt.name : spec.id}] deve ser usada somente se as regras do minimundo definitivamente justificarem essa estrutura. Prefira Especialização simples quando possível.`,
          elementId: spec.id
        });
      }

      // Info: herança completa (informativo)
      if (superEnt && subIds.length > 0) {
        const superAttrs = this.model.attributes.filter(a => a.parentId === superEnt.id);
        if (superAttrs.length > 0) {
          const attrNames = superAttrs.map(a => a.name).join(', ');
          issues.push({
            type: 'info',
            message: `Herança completa: todas as subclasses de [${superEnt.name}] herdam automaticamente os atributos: ${attrNames}.`,
            elementId: spec.id
          });
        }
      }

      // Verifica conexões físicas do círculo de especialização para evitar artefatos quebrados.
      const specConns = this.model.connections.filter(c => c.sourceId === spec.id || c.targetId === spec.id);
      const entityConnCount = specConns.reduce((count, c) => {
        const otherId = c.sourceId === spec.id ? c.targetId : c.sourceId;
        return count + (this.model.entities.some(e => e.id === otherId) ? 1 : 0);
      }, 0);

      if (entityConnCount < 2) {
        issues.push({
          type: 'warning',
          message: `A especialização [${spec.id}] está com poucas conexões no diagrama. Verifique as ligações com super e subentidades.`,
          elementId: spec.id
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
