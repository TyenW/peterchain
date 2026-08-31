/**
 * DER Builder — RelationalMapper (Motor de Conversão DER Conceitual -> Esquema Lógico Relacional)
 * Aplica rigorosamente as 7 Etapas Formais de Mapeamento EER para Relacional (Elmasri & Navathe).
 */
class RelationalMapper {
  constructor(model) {
    this.model = model;
  }

  /**
   * Converte o modelo conceitual atual em tabelas relacionais com PKs, FKs e referências cruzadas
   */
  mapToRelationalSchema() {
    const tables = [];
    const fkReferences = []; // { sourceTable, sourceCol, targetTable, targetCol }

    if (!this.model) return { tables, fkReferences };

    const entities = this.model.entities || [];
    const relationships = this.model.relationships || [];
    const attributes = this.model.attributes || [];
    const connections = this.model.connections || [];

    // Helper: Buscar atributos diretos de uma entidade ou relacionamento
    const getDirectAttrs = (parentId) => attributes.filter(a => a.parentId === parentId);

    // Helper: Formatar tipo de dado padrão baseado no nome e propriedades
    const inferDataType = (attr) => {
      const nameUpper = (attr.name || '').toUpperCase();
      if (attr.isKey || attr.isPartialKey || nameUpper.includes('ID') || nameUpper.includes('COD')) return 'INT';
      if (nameUpper.includes('DATA') || nameUpper.includes('DATE') || nameUpper.includes('NASC')) return 'DATE';
      if (nameUpper.includes('VALOR') || nameUpper.includes('SALARIO') || nameUpper.includes('PRECO') || nameUpper.includes('NOTA')) return 'DECIMAL(10,2)';
      if (nameUpper.includes('HORA') || nameUpper.includes('QUANT') || nameUpper.includes('NUMERO')) return 'INT';
      return 'VARCHAR(100)';
    };

    // Helper: Mapear atributos simples e compostos de uma entidade/relacionamento
    const processAttributes = (parentId, isWeak = false) => {
      const directAttrs = getDirectAttrs(parentId);
      const columns = [];
      const pkColNames = [];

      directAttrs.forEach(attr => {
        // Atributos Multivalorados são mapeados na Etapa 6 (nova relação)
        if (attr.isMultivalued) return;

        // Atributos Compostos: inclui apenas os atributos simples que o compõem
        const subAttrs = attributes.filter(sub => sub.parentId === attr.id);
        if (subAttrs.length > 0) {
          subAttrs.forEach(sub => {
            const colName = `${attr.name.toLowerCase()}_${sub.name.toLowerCase()}`;
            const isPk = Boolean(sub.isKey || (isWeak && sub.isPartialKey));
            columns.push({
              name: colName,
              dataType: inferDataType(sub),
              isPk: isPk,
              isFk: false,
              isNullable: !isPk,
              attrId: sub.id
            });
            if (isPk) pkColNames.push(colName);
          });
          return;
        }

        const isPk = Boolean(attr.isKey || (isWeak && attr.isPartialKey));
        const colName = attr.name;

        columns.push({
          name: colName,
          dataType: inferDataType(attr),
          isPk: isPk,
          isFk: false,
          isNullable: !isPk,
          attrId: attr.id
        });

        if (isPk) {
          pkColNames.push(colName);
        }
      });

      return { columns, pkColNames };
    };

    // =========================================================================
    // ETAPA 1: Mapeamento de Entidades Fortes
    // =========================================================================
    // Crie uma relação para cada entidade forte e inclua todos os seus atributos simples.
    // Para atributos compostos, inclua apenas os componentes simples.
    // Escolha os atributos chave como Chave Primária.
    entities.filter(e => !e.isWeak).forEach(ent => {
      const { columns, pkColNames } = processAttributes(ent.id, false);

      // Se a entidade não tiver nenhuma chave definida, gera chave primária 'id_[ent]'
      if (pkColNames.length === 0) {
        const defaultPkName = `id_${ent.name.toLowerCase()}`;
        columns.unshift({
          name: defaultPkName,
          dataType: 'INT',
          isPk: true,
          isFk: false,
          isNullable: false
        });
        pkColNames.push(defaultPkName);
      }

      tables.push({
        id: `tbl_${ent.id}`,
        entityId: ent.id,
        name: ent.name.toUpperCase(),
        isWeak: false,
        isAssociative: false,
        columns: columns,
        pkColNames: pkColNames,
        x: ent.x || 100,
        y: ent.y || 100
      });
    });

    // =========================================================================
    // ETAPA 2: Mapeamento de Entidades Fracas
    // =========================================================================
    // Crie uma relação para cada entidade fraca incluindo atributos simples.
    // Adicione a chave primária da entidade proprietária como Chave Estrangeira.
    // A Chave Primária será a combinação da FK proprietária com o atributo chave parcial.
    entities.filter(e => e.isWeak).forEach(weakEnt => {
      const { columns, pkColNames } = processAttributes(weakEnt.id, true);

      // Criar a tabela base para a entidade fraca
      const weakTbl = {
        id: `tbl_${weakEnt.id}`,
        entityId: weakEnt.id,
        name: weakEnt.name.toUpperCase(),
        isWeak: true,
        isAssociative: false,
        columns: columns,
        pkColNames: pkColNames,
        x: weakEnt.x || 100,
        y: weakEnt.y || 100
      };

      // Buscar entidade proprietária através de relacionamentos conectados
      const conns = connections.filter(c => c.sourceId === weakEnt.id || c.targetId === weakEnt.id);
      conns.forEach(c => {
        const relId = c.sourceId === weakEnt.id ? c.targetId : c.sourceId;
        const rel = relationships.find(r => r.id === relId);
        if (rel) {
          const relConns = connections.filter(rc => rc.sourceId === rel.id || rc.targetId === rel.id);
          relConns.forEach(rc => {
            const otherEntId = rc.sourceId === rel.id ? rc.targetId : rc.sourceId;
            const parentEnt = entities.find(e => e.id === otherEntId && !e.isWeak);
            if (parentEnt) {
              const parentTbl = tables.find(t => t.entityId === parentEnt.id);
              if (parentTbl) {
                parentTbl.pkColNames.forEach(pkName => {
                  const fkName = `${parentEnt.name.toLowerCase()}_${pkName}`;
                  if (!weakTbl.columns.some(col => col.name === fkName)) {
                    // Injetar FK como parte da Chave Primária Composta da Entidade Fraca
                    weakTbl.columns.unshift({
                      name: fkName,
                      dataType: 'INT',
                      isPk: true,
                      isFk: true,
                      isNullable: false,
                      fkTargetTable: parentTbl.name,
                      fkTargetCol: pkName
                    });
                    weakTbl.pkColNames.unshift(fkName);

                    fkReferences.push({
                      sourceTable: weakTbl.name,
                      sourceCol: fkName,
                      targetTable: parentTbl.name,
                      targetCol: pkName
                    });
                  }
                });
              }
            }
          });
        }
      });

      tables.push(weakTbl);
    });

    // Processar os relacionamentos (Etapas 3, 4, 5 e 7)
    relationships.forEach(rel => {
      const relConns = connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id);
      const participantEnts = relConns.map(c => {
        const entId = c.sourceId === rel.id ? c.targetId : c.sourceId;
        const ent = entities.find(e => e.id === entId);
        const card = (c.sourceId === rel.id ? c.cardinalityTarget : c.cardinalitySource) || 'N';
        const isTotal = Boolean(c.sourceId === rel.id ? c.isTotalTarget : c.isTotalSource || c.isTotal);
        return { conn: c, entity: ent, cardinality: card.toUpperCase(), isTotal };
      }).filter(item => Boolean(item.entity));

      if (participantEnts.length === 0) return;

      // =======================================================================
      // ETAPA 7: Relacionamentos de Alto Grau (n > 2)
      // =======================================================================
      // Crie uma nova relação (R3) para cada relacionamento n-ário.
      // Inclua como FKs as PKs de todas as relações participantes.
      // A PK de R3 será a combinação de todas essas chaves estrangeiras.
      if (participantEnts.length > 2) {
        const assocColumns = [];
        const assocPkColNames = [];

        participantEnts.forEach(part => {
          const partTbl = tables.find(t => t.entityId === part.entity.id);
          if (partTbl) {
            partTbl.pkColNames.forEach(pkName => {
              const fkName = `${partTbl.name.toLowerCase()}_${pkName}`;
              assocColumns.push({
                name: fkName,
                dataType: 'INT',
                isPk: true,
                isFk: true,
                isNullable: false,
                fkTargetTable: partTbl.name,
                fkTargetCol: pkName
              });
              assocPkColNames.push(fkName);

              fkReferences.push({
                sourceTable: rel.name.toUpperCase(),
                sourceCol: fkName,
                targetTable: partTbl.name,
                targetCol: pkName
              });
            });
          }
        });

        // Atributos próprios do relacionamento n-ário
        const relAttrs = getDirectAttrs(rel.id);
        relAttrs.forEach(attr => {
          assocColumns.push({
            name: attr.name.toLowerCase(),
            dataType: inferDataType(attr),
            isPk: false,
            isFk: false,
            isNullable: true
          });
        });

        tables.push({
          id: `tbl_${rel.id}`,
          relId: rel.id,
          name: rel.name.toUpperCase(),
          isWeak: Boolean(rel.isWeak),
          isAssociative: true,
          columns: assocColumns,
          pkColNames: assocPkColNames,
          x: rel.x || 450,
          y: rel.y || 250
        });
        return;
      }

      // Relacionamentos Binários (n = 2)
      if (participantEnts.length === 2) {
        const oneSides = participantEnts.filter(p => p.cardinality === '1');
        const manySides = participantEnts.filter(p => p.cardinality === 'N' || p.cardinality === 'M');

        // =====================================================================
        // ETAPA 5: Relacionamentos Binários 1:1
        // =====================================================================
        // Estratégia de Chave Estrangeira: Identifique as relações correspondentes
        // e inclua a PK de uma como FK na outra (preferindo a que possui participação total).
        // =====================================================================
        // ETAPA 5: Relacionamentos Binarios 1:1
        // =====================================================================
        if (oneSides.length === 2) {
          const [p1, p2] = participantEnts;
          const isRecursive = p1.entity.id === p2.entity.id;

          let targetEntSide = p1;
          let sourceEntSide = p2;

          if (p2.isTotal && !p1.isTotal) {
            targetEntSide = p2;
            sourceEntSide = p1;
          }

          const targetTbl = tables.find(t => t.entityId === targetEntSide.entity.id);
          const sourceTbl = tables.find(t => t.entityId === sourceEntSide.entity.id);

          if (targetTbl && sourceTbl) {
            sourceTbl.pkColNames.forEach((pkName, pkIdx) => {
              // Em relacionamentos recursivos, usar o nome do relacionamento ou papel para evitar nomes duplicados
              const roleName = targetEntSide.conn.role || rel.name.toLowerCase();
              let fkName = isRecursive ? `${roleName}_${pkName}` : `${sourceTbl.name.toLowerCase()}_${pkName}`;

              // Garantir unicidade absoluta de nome de coluna
              let suffixCounter = 1;
              const baseFkName = fkName;
              while (targetTbl.columns.some(col => col.name === fkName)) {
                fkName = `${baseFkName}_${suffixCounter++}`;
              }

              targetTbl.columns.push({
                name: fkName,
                dataType: 'INT',
                isPk: false,
                isFk: true,
                isNullable: !targetEntSide.isTotal,
                fkTargetTable: sourceTbl.name,
                fkTargetCol: pkName
              });

              fkReferences.push({
                sourceTable: targetTbl.name,
                sourceCol: fkName,
                targetTable: sourceTbl.name,
                targetCol: pkName
              });
            });

            // Atributos do relacionamento 1:1 migram para a tabela receptora
            const relAttrs = getDirectAttrs(rel.id);
            relAttrs.forEach(attr => {
              const colName = attr.name.toLowerCase();
              if (!targetTbl.columns.some(c => c.name === colName)) {
                targetTbl.columns.push({
                  name: colName,
                  dataType: inferDataType(attr),
                  isPk: false,
                  isFk: false,
                  isNullable: true
                });
              }
            });
          }
          return;
        }

        // =====================================================================
        // ETAPA 3: Relacionamentos Binarios 1:N (e Recursivos 1:N)
        // =====================================================================
        if (oneSides.length === 1 && manySides.length === 1 && !rel.isWeak) {
          const oneSide = oneSides[0];
          const manySide = manySides[0];
          const isRecursive = oneSide.entity.id === manySide.entity.id;

          const oneTbl = tables.find(t => t.entityId === oneSide.entity.id);
          const manyTbl = tables.find(t => t.entityId === manySide.entity.id);

          if (oneTbl && manyTbl) {
            oneTbl.pkColNames.forEach((pkName, pkIdx) => {
              // Em relacionamentos recursivos 1:N (ex: EMPREGADO gerencia EMPREGADO), usar o papel ou nome do relacionamento
              const roleName = oneSide.conn.role || manySide.conn.role || rel.name.toLowerCase();
              let fkName = isRecursive ? `${roleName}_${pkName}` : `${oneTbl.name.toLowerCase()}_${pkName}`;

              // Garantir que nao haja colisao com nenhuma coluna existente (nem com a propria PK)
              let suffixCounter = 1;
              const baseFkName = fkName;
              while (manyTbl.columns.some(col => col.name === fkName)) {
                fkName = `${baseFkName}_${suffixCounter++}`;
              }

              manyTbl.columns.push({
                name: fkName,
                dataType: 'INT',
                isPk: false,
                isFk: true,
                isNullable: true,
                fkTargetTable: oneTbl.name,
                fkTargetCol: pkName
              });

              fkReferences.push({
                sourceTable: manyTbl.name,
                sourceCol: fkName,
                targetTable: oneTbl.name,
                targetCol: pkName
              });
            });

            // Injetar atributos proprios do relacionamento no lado N
            const relAttrs = getDirectAttrs(rel.id);
            relAttrs.forEach(attr => {
              const colName = attr.name.toLowerCase();
              if (!manyTbl.columns.some(c => c.name === colName)) {
                manyTbl.columns.push({
                  name: colName,
                  dataType: inferDataType(attr),
                  isPk: false,
                  isFk: false,
                  isNullable: true
                });
              }
            });
            return;
          }
        }

        // =====================================================================
        // ETAPA 4: Relacionamentos Binarios N:N (e Recursivos N:N)
        // =====================================================================
        if (manySides.length === 2 || (manySides.length === 1 && oneSides.length === 0)) {
          const assocColumns = [];
          const assocPkColNames = [];
          const isRecursive = participantEnts[0].entity.id === participantEnts[1]?.entity.id;

          participantEnts.forEach((part, partIdx) => {
            const partTbl = tables.find(t => t.entityId === part.entity.id);
            if (partTbl) {
              partTbl.pkColNames.forEach((pkName) => {
                let fkName;
                if (isRecursive) {
                  // Em relacionamentos recursivos N:M (ex: PECA composta de PECA), diferenciar explicitamente os papeis
                  const roleName = part.conn.role || (partIdx === 0 ? 'origem' : 'destino');
                  fkName = `${partTbl.name.toLowerCase()}_${pkName}_${roleName}`;
                } else {
                  fkName = `${partTbl.name.toLowerCase()}_${pkName}`;
                }

                // Garantir unicidade de nome dentro da tabela associativa
                let suffixCounter = 1;
                const baseFkName = fkName;
                while (assocColumns.some(col => col.name === fkName)) {
                  fkName = `${baseFkName}_${suffixCounter++}`;
                }

                assocColumns.push({
                  name: fkName,
                  dataType: 'INT',
                  isPk: true,
                  isFk: true,
                  isNullable: false,
                  fkTargetTable: partTbl.name,
                  fkTargetCol: pkName
                });
                assocPkColNames.push(fkName);

                fkReferences.push({
                  sourceTable: rel.name.toUpperCase(),
                  sourceCol: fkName,
                  targetTable: partTbl.name,
                  targetCol: pkName
                });
              });
            }
          });

          // Atributos proprios do relacionamento N:N
          const relAttrs = getDirectAttrs(rel.id);
          relAttrs.forEach(attr => {
            assocColumns.push({
              name: attr.name.toLowerCase(),
              dataType: inferDataType(attr),
              isPk: false,
              isFk: false,
              isNullable: true
            });
          });

          tables.push({
            id: `tbl_${rel.id}`,
            relId: rel.id,
            name: rel.name.toUpperCase(),
            isWeak: Boolean(rel.isWeak),
            isAssociative: true,
            columns: assocColumns,
            pkColNames: assocPkColNames,
            x: rel.x || 450,
            y: rel.y || 250
          });
        }
      }
    });

    // =========================================================================
    // ETAPA 6: Atributos Multivalorados
    // =========================================================================
    // Crie uma nova relação para cada atributo multivalorado.
    // Deve conter o atributo multivalorado + a PK da entidade proprietária como FK.
    // A PK será a combinação da FK da entidade + o próprio atributo multivalorado.
    attributes.filter(a => a.isMultivalued).forEach(multiAttr => {
      const parentEnt = entities.find(e => e.id === multiAttr.parentId);
      if (!parentEnt) return;

      const parentTbl = tables.find(t => t.entityId === parentEnt.id);
      if (!parentTbl) return;

      const tableName = `${parentEnt.name.toUpperCase()}_${multiAttr.name.toUpperCase()}`;
      const multiColumns = [];
      const multiPkColNames = [];

      // Chave Estrangeira do Proprietário (compõe a PK)
      parentTbl.pkColNames.forEach(pkName => {
        const fkName = `${parentEnt.name.toLowerCase()}_${pkName}`;
        multiColumns.push({
          name: fkName,
          dataType: 'INT',
          isPk: true,
          isFk: true,
          isNullable: false,
          fkTargetTable: parentTbl.name,
          fkTargetCol: pkName
        });
        multiPkColNames.push(fkName);

        fkReferences.push({
          sourceTable: tableName,
          sourceCol: fkName,
          targetTable: parentTbl.name,
          targetCol: pkName
        });
      });

      // Valor do Atributo Multivalorado (compõe a PK)
      const valColName = multiAttr.name.toLowerCase();
      multiColumns.push({
        name: valColName,
        dataType: inferDataType(multiAttr),
        isPk: true,
        isFk: false,
        isNullable: false
      });
      multiPkColNames.push(valColName);

      tables.push({
        id: `tbl_multi_${multiAttr.id}`,
        name: tableName,
        isWeak: false,
        isAssociative: false,
        columns: multiColumns,
        pkColNames: multiPkColNames,
        x: (parentTbl.x || 100) + 320,
        y: (parentTbl.y || 100) + 40
      });
    });

    return { tables, fkReferences };
  }
}

if (typeof window !== 'undefined') {
  window.RelationalMapper = RelationalMapper;
}
