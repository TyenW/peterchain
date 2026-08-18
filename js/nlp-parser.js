/**
 * DER Builder — Parser Determinístico de Pseudo-Código ER/EER
 * Transforma pseudo-código em estruturas de Entidades, Atributos e Relacionamentos (Notação Peter Chen)
 *
 * Sintaxe suportada:
 *   - Blocos de entidade:        NomeEntidade { *Chave, Atributo, ~Derivado, ++Multi }
 *   - Entidade fraca:            entidade fraca Nome { _ChaveParcial_, Atrib }
 *   - Relacionamento em linha:   nomeRel (Ent1 N : N Ent2)
 *   - Relacionamento fraco:      relacionamento fraco nomeRel (EntForte 1 : N EntFraca)
 *   - Rel. com atributos:        nomeRel (Ent1 N : N Ent2) { Atrib1, Atrib2 }
 *   - Rel. recursivo (roles):    nomeRel (Ent [papel1] 1 : N Ent [papel2])
 *   - Especialização EER:        especializacao d|o (Super -> Sub1, Sub2)
 *   - Categoria EER:             categoria u (Sub -> Super1, Super2)
 *   - Comentários:               // comentário  ou  # comentário
 *   - Comandos incrementais:     criar entidade X, adicionar atributo Y em X, etc.
 */
class NLPParser {
  constructor(diagramModel) {
    this.model = diagramModel;
    this.logEntries = [];
  }

  log(msg, type = 'info') {
    this.logEntries.push({ msg, type, timestamp: new Date().toLocaleTimeString() });
  }

  // ======================================================================
  //  NORMALIZAÇÃO DE TEXTO
  // ======================================================================

  normalizeText(text) {
    if (!text) return '';

    // Normalizar quebras de linha e BOM
    let normalized = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');

    // Substituir → por ->
    normalized = normalized.replace(/→/g, '->');

    // Processar linha por linha: remover comentários e cercas markdown
    const lines = normalized.split('\n');
    const cleanedLines = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Ignorar cercas de bloco de código markdown (```)
      if (/^```/.test(trimmed)) continue;

      // Ignorar linhas de comentário inteiro: // ou #
      if (/^\/\//.test(trimmed) || /^#/.test(trimmed)) continue;

      // Remover comentário inline (// precedido de espaço, não dentro de URL)
      const noInlineComment = line.replace(/\s\/\/.*$/, '');
      cleanedLines.push(noInlineComment);
    }

    return cleanedLines.join('\n').trim();
  }

  // ======================================================================
  //  SINGULARIZAÇÃO SIMPLES (PT-BR)
  // ======================================================================

  toSingular(word) {
    if (!word) return '';
    let w = word.trim().replace(/^[!*#~_+]+|[!*#~_+]+$/g, '').trim().toLowerCase();
    if (w.length <= 3) return w;
    if (w.endsWith('ões')) return w.slice(0, -3) + 'ão';
    if (w.endsWith('ães')) return w.slice(0, -3) + 'ão';
    if (w.endsWith('res') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('ses') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('ns')) return w.slice(0, -2) + 'm';
    if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  }

  // ======================================================================
  //  PONTO DE ENTRADA PRINCIPAL
  // ======================================================================

  parse(text, appendOnly = false) {
    this.logEntries = [];

    if (!appendOnly) {
      this.model.clear();
      this.log('Diagrama reinicializado para novo processamento.', 'info');
    }

    const cleanText = this.normalizeText(text);
    if (!cleanText) {
      this.log('Texto de entrada vazio.', 'warning');
      return { success: false, log: this.logEntries };
    }

    // PASSO 1: Extrair especializações / categorias
    let remaining = this.extractSpecializations(cleanText);

    // PASSO 2: Extrair blocos de entidade: Nome { atrib1, atrib2 }
    remaining = this.extractEntityBlocks(remaining);

    // PASSO 3: Extrair relacionamentos com atributos: nome (Ent1 N:N Ent2) { attr1, attr2 }
    remaining = this.extractRelationshipsWithAttributes(remaining);

    // PASSO 4: Extrair relacionamentos em linha: nome (Ent1 N : N Ent2)
    remaining = this.extractInlineRelationships(remaining);

    // PASSO 5: Processar linhas restantes como comandos incrementais
    const lines = remaining
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (lines.length > 0) {
      lines.forEach(line => {
        this.processSentence(line);
      });
    }

    // Auto-layout apenas na geração completa
    if (!appendOnly) {
      this.model.autoLayout();
    }

    const summary = `${this.model.entities.length} Entidades, ${this.model.attributes.length} Atributos, ${this.model.relationships.length} Relacionamentos`;
    this.log(`Concluído: ${summary}`, 'success');

    return { success: true, summary, log: this.logEntries };
  }

  // ======================================================================
  //  PASSO 1: ESPECIALIZAÇÕES / CATEGORIAS EER
  // ======================================================================

  extractSpecializations(text) {
    // especializacao|herança d|o (Super -> Sub1, Sub2)
    // categoria u (Sub -> Super1, Super2)
    const regex = /(?:especializacao|especializacão|especialização|herança|categoria)\s+([dou])\s*\(\s*([^)]+?)\s*->\s*([^)]+)\s*\)/gi;
    let result = text;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const specType = match[1].toLowerCase();
      const superName = match[2].trim();
      const subNamesRaw = match[3].trim();

      const superEntName = this.toSingular(superName);
      const subNames = subNamesRaw.split(',').map(n => this.toSingular(n.trim())).filter(Boolean);

      const superEntRes = this.model.addEntity(superEntName);
      const superEnt = superEntRes.element || superEntRes;

      const subEntIds = subNames.map(name => {
        const subRes = this.model.addEntity(name);
        return (subRes.element || subRes).id;
      });

      this.model.addSpecialization(specType, superEnt.id, subEntIds);
      this.log(`EER: Especialização [${specType.toUpperCase()}] — ${superEnt.name} → ${subNames.join(', ')}`, 'success');

      result = result.replace(match[0], '');
    }

    return result;
  }

  // ======================================================================
  //  PASSO 2: RELACIONAMENTOS COM ATRIBUTOS { ... }
  // ======================================================================

  extractRelationshipsWithAttributes(text) {
    // nome (Ent1 N : N Ent2) { Atrib1, Atrib2 }
    const regex = /((?:relacionamento\s+fraco\s+|relacionamento\s+obrigatorio\s+|relacionamento\s+obrigatório\s+|relacionamento\s+total\s+|fraco\s+|obrigatorio\s+|obrigatório\s+|total\s+)?[a-záàâãéèêíóòôõúç0-9_]+)\s*\(\s*([^)]+)\s*\)\s*\{([^}]+)\}/gi;
    let result = text;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const rawName = match[1].trim();
      const signature = match[2].trim();
      const attrsBody = match[3].trim();

      const rel = this.processRelationshipSignature(rawName, signature);
      if (rel) {
        this.addRelationshipAttributes(rel, attrsBody);
      }

      result = result.replace(match[0], '');
    }

    return result;
  }

  // ======================================================================
  //  PASSO 3: BLOCOS DE ENTIDADE { ... }
  // ======================================================================

  extractEntityBlocks(text) {
    // Entidade fraca ou normal: [entidade fraca] NomeEntidade { atributos }
    const regex = /((?:entidade\s+fraca\s+)?[a-záàâãéèêíóòôõúç0-9_]+)\s*\{([^}]+)\}/gi;
    let result = text;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const rawName = match[1].trim();
      const body = match[2].trim();

      this.processBlockEntity(rawName, body);
      result = result.replace(match[0], '');
    }

    return result;
  }

  // ======================================================================
  //  PASSO 4: RELACIONAMENTOS EM LINHA (SEM CHAVES)
  // ======================================================================

  extractInlineRelationships(text) {
    // nome (Ent1 [papel] N : N Ent2 [papel])
    // total nome (Ent1 1 : N Ent2)
    // obrigatorio nome (Ent1 1 : N Ent2)
    // parcialobrigatorio nome (Ent1 1 : N Ent2)
    const regex = /((?:relacionamento\s+fraco\s+|relacionamento\s+obrigatorio\s+|relacionamento\s+obrigatório\s+|relacionamento\s+total\s+|parcialobrigatorio\s+|parcialobrigatório\s+|parcial_obrigatorio\s+|fraco\s+|obrigatorio\s+|obrigatório\s+|total\s+|obrig\s+)?[a-záàâãéèêíóòôõúç0-9_]+)\s*\(\s*([^)]+)\s*\)/gi;
    let result = text;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const rawName = match[1].trim();
      const signature = match[2].trim();

      // Verificar se realmente parece uma assinatura de relacionamento (tem cardinalidade)
      if (/[1nm]/i.test(signature) && /[:–\-]/.test(signature)) {
        this.processRelationshipSignature(rawName, signature);
        result = result.replace(match[0], '');
      }
    }

    return result;
  }

  // ======================================================================
  //  PROCESSAMENTO DE BLOCO DE ENTIDADE
  // ======================================================================

  processBlockEntity(entityRawName, bodyText) {
    let cleanRaw = entityRawName.trim();
    let isWeak = false;

    // Detectar "entidade fraca"
    if (/^entidade\s+fraca\s+/i.test(cleanRaw)) {
      isWeak = true;
      cleanRaw = cleanRaw.replace(/^entidade\s+fraca\s+/i, '').trim();
    }

    const entityName = this.toSingular(cleanRaw);
    if (!entityName) return;

    const res = this.model.addEntity(entityName, 200, 200, isWeak);
    const entity = res.element || res;
    this.log(`Entidade [${entity.name}] ${isWeak ? '(FRACA)' : ''} criada.`, 'success');

    // Separar atributos ignorando vírgulas/ponto-e-vírgula dentro de () ou []
    const attrTokens = [];
    let currentToken = '';
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < bodyText.length; i++) {
      const char = bodyText[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);

      if ((char === ',' || char === ';' || char === '\n') && parenDepth === 0 && bracketDepth === 0) {
        if (currentToken.trim().length > 0) {
          attrTokens.push(currentToken.trim());
        }
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    if (currentToken.trim().length > 0) {
      attrTokens.push(currentToken.trim());
    }

    attrTokens.forEach(token => {
      // Ignorar comentários dentro de blocos
      if (token.startsWith('//') || token.startsWith('#')) return;

      this.parseAttributeToken(token, entity);
    });
  }

  // ======================================================================
  //  PARSER DE TOKEN DE ATRIBUTO (com prefixos)
  // ======================================================================

  parseAttributeToken(token, parentElement, isSubAttribute = false) {
    let isKey = false;
    let isPartialKey = false;
    let isMultivalued = false;
    let isDerived = false;
    let cleanToken = token.trim();

    // 0. Atributo Composto: Nome (PrimeiroNome, Sobrenome) ou Nome[PrimeiroNome; Sobrenome] ou Nome -> PrimeiroNome, Sobrenome
    const compMatch = cleanToken.match(/^([^\(\[\->\{]+)\s*(?:\(|\[|->|\{)\s*([^\]\)]+?)\s*(?:\)|\]|\})?$/);
    if (compMatch && !cleanToken.toLowerCase().includes('(chave)') && !cleanToken.toLowerCase().includes('(pk)') && !cleanToken.toLowerCase().includes('(key)')) {
      const parentName = compMatch[1].trim();
      const subTokensText = compMatch[2].trim();

      const parentAttr = this.parseAttributeToken(parentName, parentElement, isSubAttribute);
      if (parentAttr) {
        const subTokens = subTokensText.split(/[,;]/).map(t => t.trim()).filter(Boolean);
        subTokens.forEach(sub => {
          this.parseAttributeToken(sub, parentAttr, true); // passa isSubAttribute = true
        });
      }
      return parentAttr;
    }

    // 1. Chave Parcial / Discriminador: _nome_ ou _nome_algo_
    if (/^_.+_$/.test(cleanToken)) {
      isPartialKey = true;
      cleanToken = cleanToken.slice(1, -1).trim();
    }
    // 2. Multivalorado: ++telefones ou telefones[]
    else if (cleanToken.startsWith('++')) {
      isMultivalued = true;
      cleanToken = cleanToken.slice(2).trim();
    } else if (cleanToken.endsWith('[]')) {
      isMultivalued = true;
      cleanToken = cleanToken.slice(0, -2).trim();
    }
    // 3. Derivado: ~idade
    else if (cleanToken.startsWith('~')) {
      isDerived = true;
      cleanToken = cleanToken.slice(1).trim();
    }
    // 4. Chave Primária: *cpf ou #id
    else if (cleanToken.startsWith('*') || cleanToken.startsWith('#')) {
      isKey = true;
      cleanToken = cleanToken.slice(1).trim();
    }
    // 5. Chave por sufixo: CPF (chave), ID (pk), etc.
    else if (/\((?:chave|pk|key|id|identificador)\)/i.test(cleanToken)) {
      isKey = true;
      cleanToken = cleanToken.replace(/\s*\((?:chave|pk|key|id|identificador)\)/i, '').trim();
    }
    // 6. Chave por nome reconhecido (apenas se NÃO for um sub-atributo de um composto)
    else if (!isSubAttribute && this.isKeyAttributeName(cleanToken)) {
      isKey = true;
    }

    if (cleanToken.length === 0) return null;

    const opts = { isKey, isPartialKey, isMultivalued, isDerived };
    const attr = this.model.addAttribute(cleanToken, parentElement.id, opts);

    let tag = '';
    if (isKey) tag = '(CHAVE)';
    else if (isPartialKey) tag = '(PARCIAL)';
    else if (isMultivalued) tag = '(MULTI)';
    else if (isDerived) tag = '(DERIVADO)';

    this.log(`  └─ Atributo [${attr.name}] ${tag} adicionado a [${parentElement.name}].`, 'info');
    return attr;
  }

  // ======================================================================
  //  PROCESSAMENTO DE ASSINATURA DE RELACIONAMENTO
  // ======================================================================

  processRelationshipSignature(relRawName, signatureText) {
    let cleanRaw = relRawName.trim();
    let isWeak = false;
    let isTotalBoth = false;
    let isTotalSide1Only = false;

    // Detectar "relacionamento fraco" / "fraco"
    if (/^(?:relacionamento\s+fraco|fraco)\s+/i.test(cleanRaw)) {
      isWeak = true;
      cleanRaw = cleanRaw.replace(/^(?:relacionamento\s+fraco|fraco)\s+/i, '').trim();
    }
    // Detectar "relacionamento total" / "total" (DOIS LADOS)
    else if (/^(?:relacionamento\s+total|total)\s*/i.test(cleanRaw)) {
      isTotalBoth = true;
      cleanRaw = cleanRaw.replace(/^(?:relacionamento\s+total|total)\s*/i, '').trim();
    }
    // Detectar "obrigatorio" / "parcialobrigatorio" (LADO 1 OBRIGATÓRIO NA PRIMEIRA ENTIDADE)
    else if (/^(?:relacionamento\s+obrigat[óo]rio|parcialobrigat[óo]rio|parcial_obrigat[óo]rio|obrigat[óo]rio|parcialobrig|obrig)\s*/i.test(cleanRaw)) {
      isTotalSide1Only = true;
      cleanRaw = cleanRaw.replace(/^(?:relacionamento\s+obrigat[óo]rio|parcialobrigat[óo]rio|parcial_obrigat[óo]rio|obrigat[óo]rio|parcialobrig|obrig)\s*/i, '').trim();
    }

    if (cleanRaw.toLowerCase().startsWith('obrig') && cleanRaw.length > 5 && !isTotalBoth && !isTotalSide1Only) {
      isTotalSide1Only = true;
      cleanRaw = cleanRaw.replace(/^obrig/i, '').trim();
    }

    const relName = cleanRaw.toUpperCase() || 'RELACIONA';

    // Tentar formato n-ário: Ent1 N : Ent2 M : Ent3 1
    const participants = this.parseParticipants(signatureText);

    if (participants && participants.length >= 2) {
      const rel = this.createRelFromParticipants(relName, participants, isWeak);
      if (isTotalBoth && rel) {
        this.model.connections.filter(c => c.sourceId === rel.id || c.targetId === rel.id).forEach(conn => {
          conn.isTotalSource = true;
          conn.isTotalTarget = true;
          conn.isTotal = true;
        });
      } else if (isTotalSide1Only && rel) {
        const firstConn = this.model.connections.find(c => c.sourceId === participants[0].entity.id || c.targetId === participants[0].entity.id);
        if (firstConn) {
          firstConn.isTotalSource = true;
          firstConn.isTotal = true;
        }
      }
      return rel;
    }

    // Tentar formato binário com roles e marcadores:
    // Ent1 [papel1] N : N Ent2 [papel2]
    const binMatch = signatureText.match(
      /^\s*([^\(\[\:–\-]+?)\s*(?:\[([^\]]+)\])?\s*\(?\s*([1nmNM])\s*\)?\s*(?::|\-|–)\s*\(?\s*([1nmNM])\s*\)?\s*([^\(\[\:–\-]+?)\s*(?:\[([^\]]+)\])?\s*$/i
    );

    if (binMatch) {
      let ent1TextRaw = binMatch[1].trim();
      let role1 = (binMatch[2] || '').trim();
      const card1 = binMatch[3].toUpperCase();
      const card2 = binMatch[4].toUpperCase();
      let ent2TextRaw = binMatch[5].trim();
      let role2 = (binMatch[6] || '').trim();

      // Checa se o usuário colocou +, ++, ! ou palavras-chave indicando obrigatoriedade em apenas um lado
      const isMandatoryPrefix = isTotalBoth || isTotalSide1Only;
      let isTotal1 = isMandatoryPrefix || /^[\s\+!]+|[\+!]+$/i.test(ent1TextRaw) || /obrigat[óo]rio|total/i.test(ent1TextRaw);
      let isTotal2 = isWeak || isMandatoryPrefix || /^[\s\+!]+|[\+!]+$/i.test(ent2TextRaw) || /obrigat[óo]rio|total/i.test(ent2TextRaw);

      // Fallback robusto à prova de falhas de regex
      if (ent1TextRaw.includes('+') || ent1TextRaw.includes('!')) isTotal1 = true;
      if (ent2TextRaw.includes('+') || ent2TextRaw.includes('!')) isTotal2 = true;

      console.group(`[Relacionamento] Analisando: ${relName}`);
      console.log(`Entidade 1: "${ent1TextRaw}" -> isTotal: ${isTotal1} (Possui '+' ou '!': ${ent1TextRaw.includes('+') || ent1TextRaw.includes('!')})`);
      console.log(`Entidade 2: "${ent2TextRaw}" -> isTotal: ${isTotal2} (Possui '+' ou '!': ${ent2TextRaw.includes('+') || ent2TextRaw.includes('!')})`);

      // Limpar marcadores de nome de entidade (+, ++, !)
      const ent1Text = ent1TextRaw.replace(/[\+!]+/g, '').replace(/obrigat[óo]rio|total/gi, '').trim();
      const ent2Text = ent2TextRaw.replace(/[\+!]+/g, '').replace(/obrigat[óo]rio|total/gi, '').trim();

      const entity1Name = this.toSingular(ent1Text);
      const entity2Name = this.toSingular(ent2Text);

      const res1 = this.model.addEntity(entity1Name);
      const res2 = this.model.addEntity(entity2Name);
      const ent1 = res1.element || res1;
      const ent2 = res2.element || res2;

      const relRes = this.model.addRelationship(relName, 400, 200, isWeak);
      const rel = relRes.element || relRes;

      // Adiciona conexões marcando a obrigatoriedade (linha dupla) no lado correto
      if (ent2.isWeak) isTotal2 = true;

      this.model.addConnection(ent1.id, rel.id, card1, '', { roleSource: role1, isTotalSource: isTotal1, isTotalTarget: false, isTotal: isTotal1, forceNew: true });
      this.model.addConnection(rel.id, ent2.id, '', card2, { roleSource: role2, isTotalSource: false, isTotalTarget: isTotal2, isTotal: isTotal2, forceNew: true });

      this.log(`Relacionamento [${rel.name}] ${isWeak ? '(FRACO) ' : ''}${isMandatoryPrefix ? '(OBRIGATÓRIO) ' : ''}(${card1}:${card2}) — ${ent1.name} (Total: ${isTotal1}) ↔ ${ent2.name} (Total: ${isTotal2})`, 'success');

      if (role1 || role2) {
        this.log(`  └─ Papéis: ${role1 || '—'} / ${role2 || '—'}`, 'info');
      }

      console.groupEnd();
      return rel;
    }

    this.log(`Aviso: Assinatura de relacionamento não reconhecida: "${signatureText}"`, 'warning');
    return null;
  }

  // ======================================================================
  //  PARSER DE PARTICIPANTES N-ÁRIOS
  // ======================================================================

  parseParticipants(bodyText) {
    if (!bodyText || !bodyText.trim()) return null;

    console.log(`[DEBUG] parseParticipants recebeu o texto: "${bodyText}"`);

    // Dividir por : mas respeitando roles [...]
    const rawParts = bodyText.split(/\s*:\s*/);
    if (rawParts.length < 2) return null;

    const participants = [];

    for (const raw of rawParts) {
      const part = raw.trim();
      if (!part) return null;

      const parsed = this.parseParticipantPart(part);
      if (!parsed) return null;

      const res = this.model.addEntity(parsed.entityName);
      const entity = res.element || res;
      participants.push({ entity, role: parsed.role, card: parsed.card, isTotal: parsed.isTotal });
    }

    return participants.length >= 2 ? participants : null;
  }

  parseParticipantPart(raw) {
    if (!raw) return null;

    // Detectar + ou ! para obrigatoriedade
    const isTotal = raw.includes('+') || raw.includes('!') || /obrigat[óo]rio|total/i.test(raw);

    // Formato: Entidade [papel] N  ou  Entidade N  ou  N Entidade [papel]
    let m;

    // Tentar: NomeEntidade [papel] N
    m = raw.match(/^(.+?)\s*(?:\[([^\]]+)\])?\s*\(?\s*([1nmNM])\s*\)?\s*$/i);
    if (m && m[1].trim()) {
      const cleanEnt = m[1].trim().replace(/[\+!]+|obrigat[óo]rio|obrig|total/gi, '').trim();
      return {
        entityName: this.toSingular(cleanEnt),
        role: (m[2] || '').trim(),
        card: m[3].toUpperCase(),
        isTotal
      };
    }

    // Tentar: N NomeEntidade [papel]
    m = raw.match(/^\(?\s*([1nmNM])\s*\)?\s+(.+?)\s*(?:\[([^\]]+)\])?\s*$/i);
    if (m && m[2].trim()) {
      const cleanEnt = m[2].trim().replace(/[\+!]+|obrigat[óo]rio|obrig|total/gi, '').trim();
      return {
        entityName: this.toSingular(cleanEnt),
        role: (m[3] || '').trim(),
        card: m[1].toUpperCase(),
        isTotal
      };
    }

    return null;
  }

  createRelFromParticipants(relName, participants, isWeak) {
    if (!participants || participants.length < 2) return null;

    const relRes = this.model.addRelationship(relName, 400, 200, isWeak);
    const rel = relRes.element || relRes;

    // Se for rel. fraco, marcar entidades fracas automaticamente
    if (isWeak) {
      const nonOne = participants.filter(p => p.card !== '1');
      if (nonOne.length > 0) {
        nonOne.forEach(p => { p.entity.isWeak = true; });
      } else {
        participants[participants.length - 1].entity.isWeak = true;
      }
    }

    const weakParticipants = participants.filter(p => p.entity.isWeak);

    console.group(`[Relacionamento] Analisando: ${rel.name} (via parseParticipants)`);

    participants.forEach((p, idx) => {
      const isWeakSide = weakParticipants.includes(p);
      const isTotalSource = p.isTotal || isWeakSide || (isWeak && idx === participants.length - 1 && weakParticipants.length === 0);

      console.log(`Participante: "${p.entity.name}" -> isTotal: ${isTotalSource}`);

      this.model.addConnection(p.entity.id, rel.id, p.card, '', {
        roleSource: p.role,
        isTotalSource,
        isTotalTarget: false,
        isTotal: isTotalSource,
        forceNew: true
      });
    });

    const cards = participants.map(p => p.card).join(':');
    const names = participants.map(p => p.entity.name).join(' ↔ ');
    this.log(`Relacionamento [${rel.name}] ${isWeak ? '(FRACO) ' : ''}(${cards}) — ${names}`, 'success');

    console.groupEnd();
    return rel;
  }

  // ======================================================================
  //  ATRIBUTOS DE RELACIONAMENTO
  // ======================================================================

  addRelationshipAttributes(relationship, attrsText) {
    if (!attrsText || !attrsText.trim()) return;

    const tokens = attrsText
      .split(/[\n,;]/)
      .map(t => t.trim())
      .filter(t => t.length > 0 && !t.startsWith('//') && !t.startsWith('#'));

    tokens.forEach(token => {
      const attr = this.model.addAttribute(token, relationship.id);
      if (attr) {
        this.log(`  └─ Atrib. de Rel. [${attr.name}] → [${relationship.name}]`, 'info');
      }
    });
  }

  // ======================================================================
  //  PROCESSAMENTO DE LINHAS RESTANTES (COMANDOS INCREMENTAIS)
  // ======================================================================

  processSentence(sentence) {
    const s = sentence.trim();
    if (!s) return;
    const lower = s.toLowerCase();

    // Comentários (segurança dupla — já removidos em normalizeText)
    if (lower.startsWith('//') || lower.startsWith('#')) return;

    // --- COMANDOS DE CRIAÇÃO ---

    // Entidade fraca (antes de entidade normal para não ser engolida)
    if (/^(?:criar\s+|nova\s+)?entidade\s+fraca\s+/i.test(s)) {
      this.handleCommandCreateEntity(s, true);
      return;
    }

    // Entidade forte
    if (/^(?:criar\s+|nova\s+)?entidade\s+/i.test(s)) {
      this.handleCommandCreateEntity(s, false);
      return;
    }

    // Atributo
    if (/^(?:adicionar\s+|criar\s+)?atributo\s+/i.test(s)) {
      this.handleCommandAddAttribute(s);
      return;
    }

    // Relacionamento
    if (/^(?:criar\s+|novo\s+)?relacionamento\s+/i.test(s)) {
      this.handleCommandCreateRelationship(s);
      return;
    }

    // --- COMANDOS DE EXCLUSÃO ---
    if (/^(?:deletar|excluir|remover|drop|limpar|clear)\b/i.test(s)) {
      this.handleCommandDelete(s);
      return;
    }

    // Linha não reconhecida — avisar
    this.log(`Aviso: Linha não reconhecida: "${s}"`, 'warning');
  }

  // ======================================================================
  //  COMANDOS INCREMENTAIS
  // ======================================================================

  handleCommandCreateEntity(sentence, forceWeak = false) {
    const isWeak = forceWeak || /entidade\s+fraca/i.test(sentence);
    const match = sentence.match(/(?:criar\s+|nova\s+)?entidade\s+(?:fraca\s+)?([a-záàâãéèêíóòôõúç0-9_\-\s]+)/i);
    if (match && match[1]) {
      const name = this.toSingular(match[1].trim());
      const res = this.model.addEntity(name, 200, 200, isWeak);
      const entity = res.element || res;
      this.log(`Comando: Entidade [${entity.name}] criada ${isWeak ? '(FRACA)' : ''}.`, 'success');
    }
  }

  handleCommandAddAttribute(sentence) {
    const match = sentence.match(
      /(?:adicionar|criar)?\s*atributo\s+(?:(chave|identificador)\s+)?([a-záàâãéèêíóòôõúç0-9_\s]+)\s+(?:em|na|no|para|de)\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i
    );
    if (match) {
      const isKey = Boolean(match[1]);
      const attrName = match[2].trim();
      const entityName = this.toSingular(match[3].trim());

      let entity = this.model.findEntityByName(entityName);
      if (!entity) {
        const res = this.model.addEntity(entityName);
        entity = res.element || res;
        this.log(`Entidade [${entity.name}] criada automaticamente.`, 'info');
      }

      const attr = this.model.addAttribute(attrName, entity.id, isKey);
      this.log(`Comando: Atributo [${attr.name}] ${isKey ? '(CHAVE)' : ''} → [${entity.name}].`, 'success');
    }
  }

  handleCommandCreateRelationship(sentence) {
    const isWeak = /fraco|weak/i.test(sentence);
    const match = sentence.match(
      /(?:criar|novo)?\s*relacionamento\s*(?:fraco\s+)?([a-záàâãéèêíóòôõúç0-9_\s]+)\s+(?:entre|com)\s+([a-záàâãéèêíóòôõúç0-9_\s]+)\s+e\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i
    );

    if (match) {
      const relName = match[1].trim().toUpperCase() || 'RELACIONA';
      const entity1Name = this.toSingular(match[2].trim());
      const entity2Name = this.toSingular(match[3].trim());

      const ent1Res = this.model.addEntity(entity1Name);
      const ent2Res = this.model.addEntity(entity2Name);
      const ent1 = ent1Res.element || ent1Res;
      const ent2 = ent2Res.element || ent2Res;

      let card1 = '1';
      let card2 = 'N';
      const cardMatch = sentence.match(/\(?\s*(?:cardinalidade|card)?\s*([1nm])\s*[:\-]\s*([1nm])\s*\)?/i);
      if (cardMatch) {
        card1 = cardMatch[1].toUpperCase();
        card2 = cardMatch[2].toUpperCase();
      }

      const participants = [
        { entity: ent1, role: '', card: card1 },
        { entity: ent2, role: '', card: card2 }
      ];
      const rel = this.createRelFromParticipants(relName, participants, isWeak);
      if (!rel) return;

      this.log(`Comando: Relacionamento [${rel.name}] (${card1}:${card2}) — ${ent1.name} ↔ ${ent2.name}.`, 'success');
    }
  }

  handleCommandDelete(sentence) {
    const s = sentence.toLowerCase().trim();

    // Limpar tudo
    if (s === 'limpar' || s === 'limpar diagrama' || s === 'clear' || s.startsWith('limpar tudo')) {
      this.model.clear();
      this.log('Comando: Diagrama limpo.', 'warning');
      return;
    }

    // Excluir entidade
    const entMatch = sentence.match(/(?:deletar|excluir|remover|drop)\s+entidade\s+([a-záàâãéèêíóòôõúç0-9_\-\s]+)/i);
    if (entMatch) {
      const entName = this.toSingular(entMatch[1].trim());
      const entity = this.model.findEntityByName(entName);
      if (entity) {
        this.model.removeElement(entity.id);
        this.log(`Comando: Entidade [${entity.name}] excluída.`, 'warning');
      } else {
        this.log(`Erro: Entidade "${entName}" não encontrada.`, 'error');
      }
      return;
    }

    // Excluir atributo
    const attrMatch = sentence.match(/(?:deletar|excluir|remover|drop)\s+atributo\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i);
    if (attrMatch) {
      const attrName = attrMatch[1].trim();
      const attr = this.model.attributes.find(a => a.name.toLowerCase() === attrName.toLowerCase());
      if (attr) {
        this.model.removeElement(attr.id);
        this.log(`Comando: Atributo [${attr.name}] excluído.`, 'warning');
      } else {
        this.log(`Erro: Atributo "${attrName}" não encontrado.`, 'error');
      }
      return;
    }

    // Excluir relacionamento
    const relMatch = sentence.match(/(?:deletar|excluir|remover|drop)\s+relacionamento\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i);
    if (relMatch) {
      const relName = relMatch[1].trim();
      const rel = this.model.findRelationshipByName(relName);
      if (rel) {
        this.model.removeElement(rel.id);
        this.log(`Comando: Relacionamento [${rel.name}] excluído.`, 'warning');
      } else {
        this.log(`Erro: Relacionamento "${relName}" não encontrado.`, 'error');
      }
      return;
    }
  }

  // ======================================================================
  //  DETECÇÃO DE CHAVE POR NOME (SEM FALSOS POSITIVOS)
  // ======================================================================

  isKeyAttributeName(name) {
    const n = name.toLowerCase().trim();

    // Match exato
    const exactMatches = ['id', 'cpf', 'cnpj', 'crm', 'isbn', 'rg', 'cep'];
    if (exactMatches.includes(n)) return true;

    // Prefixos/sufixos seguros (não pega "Valido", "Tecido", etc.)
    if (n.startsWith('cod_') || n.startsWith('cod ') || n.startsWith('código') || n.startsWith('codigo')) return true;
    if (n.startsWith('num_') || n.startsWith('num ') || n.startsWith('número') || n.startsWith('numero')) return true;
    if (n.startsWith('matricula') || n.startsWith('matrícula')) return true;
    if (n.startsWith('id_') || n === 'id') return true;
    if (n.endsWith('_id') || n.endsWith('_pk')) return true;

    return false;
  }
}
