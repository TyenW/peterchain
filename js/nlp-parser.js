/**
 * DER Builder — Parser Determinístico de Linguagem Natural e Sintaxe de Bloco em Português
 * Transforma texto/comandos/blocos em estruturas de Entidades, Atributos e Relacionamentos (Notação Peter Chen)
 */
class NLPParser {
  constructor(diagramModel) {
    this.model = diagramModel;
    this.logEntries = [];
  }

  log(msg, type = 'info') {
    this.logEntries.push({ msg, type, timestamp: new Date().toLocaleTimeString() });
  }

  // Sanitização e utilitários de texto
  normalizeText(text) {
    if (!text) return '';

    const normalized = text.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
    const lines = normalized.split('\n');
    const cleanedLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();

      // Ignorar cercas markdown de bloco de código
      if (/^```/.test(trimmed)) return;

      // Ignorar comentários de linha inteira
      if (/^\/\//.test(trimmed)) return;

      // Remover comentário inline com //
      const noInlineComment = line.replace(/\s+\/\/.*$/, '');
      cleanedLines.push(noInlineComment);
    });

    return cleanedLines.join('\n').replace(/→/g, '->').trim();
  }

  // Singularização simples de palavras comuns em PT-BR para nomes de entidade
  toSingular(word) {
    const w = word.trim().toLowerCase();
    if (w.endsWith('res') || w.endsWith('ses')) return w.slice(0, -2);
    if (w.endsWith('ns')) return w.slice(0, -2) + 'm';
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
    return w;
  }

  // Processa o texto completo (parágrafos, comandos incrementais e modo de blocos aluno{atributos})
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

    // 1. PRIMEIRO PASSO: Extrair e processar blocos do tipo "Entidade { atributos... }"
    const textWithoutBlocks = this.extractAndProcessBlockSyntax(cleanText);

    // 2. SEGUNDO PASSO: Dividir o restante em sentenças ou comandos de linha
    const lines = textWithoutBlocks
      .split(/[\n;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (lines.length > 0) {
      this.log(`Interpretação de ${lines.length} comandos/sentenças adicionais...`, 'cmd');
      lines.forEach(sentence => {
        this.processSentence(sentence);
      });
    }

    // Executar auto-layout apenas na geração completa (preserva posição manual no incremental)
    if (!appendOnly) {
      this.model.autoLayout();
    }

    const summary = `${this.model.entities.length} Entidades, ${this.model.attributes.length} Atributos, ${this.model.relationships.length} Relacionamentos`;
    this.log(`Concluído: ${summary}`, 'success');

    return {
      success: true,
      summary,
      log: this.logEntries
    };
  }

  // --- PARSER DE SINTAXE DE BLOCO: NOME_ENTIDADE { ATRIBUTOS... } ---
  extractAndProcessBlockSyntax(text) {
    // 0. Processar Especializações / Categorias EER: especializacao d (Pessoa -> Aluno, Professor)
    const specRegex = /(?:especializacao|herança|categoria)\s+([dou])\s*\(([^->]+)->([^)]+)\)/gi;
    let specMatch;
    let modifiedText = text;

    while ((specMatch = specRegex.exec(text)) !== null) {
      const specType = specMatch[1].toLowerCase();
      const superName = this.toSingular(specMatch[2].trim());
      const subNamesRaw = specMatch[3].trim();

      const subNames = subNamesRaw.split(',').map(n => this.toSingular(n.trim())).filter(Boolean);

      const superEntRes = this.model.addEntity(superName);
      const superEnt = superEntRes.element || superEntRes;

      const subEntIds = subNames.map(name => {
        const subRes = this.model.addEntity(name);
        return (subRes.element || subRes).id;
      });

      const spec = this.model.addSpecialization(specType, superEnt.id, subEntIds);
      this.log(`EER: Especialização/Generalização [${specType.toUpperCase()}] criada para Super-entidade [${superEnt.name}] e Sub-entidades [${subNames.join(', ')}].`, 'success');

      modifiedText = modifiedText.replace(specMatch[0], '');
    }

    // 1. Regex para relacionamento com assinatura + bloco de atributos
    // Ex.: matricula (Aluno N : N Curso) { DataMatricula, Nota }
    const relWithAttrsRegex = /((?:relacionamento\s+fraco\s+)?[a-záàâãéèêíóòôõúç0-9_\-\s]+)\s*\(([^)]+)\)\s*\{([^}]+)\}/gi;
    let match;

    while ((match = relWithAttrsRegex.exec(modifiedText)) !== null) {
      const relName = match[1].trim();
      const relSignature = match[2].trim();
      const relAttrs = match[3].trim();
      this.processBlockRelationship(relName, relSignature, relAttrs);
      modifiedText = modifiedText.replace(match[0], '');
    }

    // 2. Regex para encontrar blocos tipo: ALUNO { *cpf, ~idade, ++telefones }
    const blockRegex = /((?:entidade\s+fraca\s+)?(?:relacionamento\s+fraco\s+)?[a-záàâãéèêíóòôõúç0-9_\-\s]+)\s*\{([^}]+)\}/gi;

    while ((match = blockRegex.exec(modifiedText)) !== null) {
      const rawName = match[1].trim();
      const body = match[2].trim();

      // Verificar se o nome indica um relacionamento ou uma Entidade
      if (body.includes(':') || body.includes('<->') || body.includes('-')) {
        this.processBlockRelationship(rawName, body);
      } else {
        this.processBlockEntity(rawName, body);
      }

      modifiedText = modifiedText.replace(match[0], '');
    }

    // 3. Sintaxe de relacionamento tipo: relacionamento fraco possui (Aluno 1:N Dependente) ou (Aluno N : N Curso)
    const relParenRegex = /((?:relacionamento\s+fraco\s+)?[a-záàâãéèêíóòôõúç0-9_\-\s]+)\s*\(([^)]+)\)/gi;
    while ((match = relParenRegex.exec(modifiedText)) !== null) {
      const name = match[1].trim();
      const body = match[2].trim();
      if (body.includes('1') || body.includes('n') || body.includes('m') || body.includes(':')) {
        this.processBlockRelationship(name, body);
        modifiedText = modifiedText.replace(match[0], '');
      }
    }

    return modifiedText;
  }

  processBlockEntity(entityRawName, bodyText) {
    let cleanRaw = entityRawName.trim();
    let isWeak = false;

    // Verificar se é Entidade Fraca
    if (/^entidade[\s_-]+fraca\s*:?\s+/i.test(cleanRaw)) {
      isWeak = true;
      cleanRaw = cleanRaw.replace(/^entidade[\s_-]+fraca\s*:?\s+/i, '').trim();
    }

    const entityName = this.toSingular(cleanRaw);
    if (!entityName) return;

    const res = this.model.addEntity(entityName, 200, 200, isWeak);
    const entity = res.element || res;
    this.log(`Bloco: Entidade [${entity.name}] ${isWeak ? '(FRACA)' : ''} identificada.`, 'success');

    // Separar atributos por vírgula, quebra de linha ou ponto e vírgula
    const attrTokens = bodyText
      .split(/[\n,;]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    attrTokens.forEach(token => {
      let isKey = false;
      let isPartialKey = false;
      let isMultivalued = false;
      let isDerived = false;
      let cleanToken = token;

      // 1. Chave Parcial / Discriminador: _nome_
      if (/^_[^_]+_$/.test(cleanToken)) {
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
      // 4. Chave Primária: *cpf ou #id ou (chave)
      else if (cleanToken.startsWith('*') || cleanToken.startsWith('#')) {
        isKey = true;
        cleanToken = cleanToken.slice(1).trim();
      } else if (/\((?:chave|pk|key|id|identificador)\)/i.test(cleanToken)) {
        isKey = true;
        cleanToken = cleanToken.replace(/\((?:chave|pk|key|id|identificador)\)/i, '').trim();
      } else if (this.isKeyAttributeName(cleanToken)) {
        isKey = true;
      }

      if (cleanToken.length > 0) {
        const opts = { isKey, isPartialKey, isMultivalued, isDerived };
        const attr = this.model.addAttribute(cleanToken, entity.id, opts);
        
        let labelTag = '';
        if (isKey) labelTag = '(CHAVE)';
        else if (isPartialKey) labelTag = '(CHAVE PARCIAL)';
        else if (isMultivalued) labelTag = '(MULTIVALORADO)';
        else if (isDerived) labelTag = '(DERIVADO)';

        this.log(`  └─ Atributo [${attr.name}] ${labelTag} adicionado a [${entity.name}].`, 'info');
      }
    });
  }

  processBlockRelationship(relRawName, bodyText, relationshipAttrsText = '') {
    let cleanRaw = relRawName.trim();
    let isWeak = false;

    // Verificar se é Relacionamento Fraco / Identificador
    if (/^relacionamento\s+fraco\s+/i.test(cleanRaw)) {
      isWeak = true;
      cleanRaw = cleanRaw.replace(/^relacionamento\s+fraco\s+/i, '').trim();
    }

    const relName = cleanRaw.toUpperCase() || 'RELACIONA';
    const participants = this.parseRelationshipParticipants(bodyText);

    if (participants.length >= 2) {
      const rel = this.createRelationshipFromParticipants(relName, participants, isWeak);
      if (!rel) return;

      const cards = participants.map(p => p.card).join(':');
      const entitiesList = participants.map(p => `[${p.entity.name}]`).join(', ');
      this.log(`Bloco: Relacionamento [${rel.name}] ${isWeak ? '(IDENTIFICADOR FRACO)' : ''} (${cards}) entre ${entitiesList}.`, 'success');

      const roles = participants.filter(p => p.role).map(p => `[${p.role}]`);
      if (roles.length > 0) {
        this.log(`  └─ Papéis: ${roles.join(', ')}.`, 'info');
      }

      this.parseRelationshipAttributes(rel, relationshipAttrsText);
      return;
    }

    // Formato binário com suporte a role names:
    // "Funcionario [supervisor] 1 : N Funcionario [subordinado]"
    const match = bodyText.match(/^(.+?)\s*(?:\[([^\]]+)\])?\s*\(?\s*([1nm])\s*\)?\s*(?::|-|<->)\s*\(?\s*([1nm])\s*\)?\s*(.+?)\s*(?:\[([^\]]+)\])?\s*$/i);

    if (match) {
      const entity1Name = this.toSingular(match[1]);
      const role1 = (match[2] || '').trim();
      const cardSource = match[3].toUpperCase();
      const cardTarget = match[4].toUpperCase();
      const entity2Name = this.toSingular(match[5]);
      const role2 = (match[6] || '').trim();

      const res1 = this.model.addEntity(entity1Name);
      const res2 = this.model.addEntity(entity2Name);
      const ent1 = res1.element || res1;
      const ent2 = res2.element || res2;

      const relRes = this.model.addRelationship(relName, 400, 200, isWeak);
      const rel = relRes.element || relRes;

      // Se for relacionamento fraco, a conexão com a entidade fraca é Total (linha dupla)
      const isTotalTarget = isWeak || ent2.isWeak;
      this.model.addConnection(ent1.id, rel.id, cardSource, '', { roleSource: role1 });
      this.model.addConnection(ent2.id, rel.id, cardTarget, '', { roleSource: role2, isTotalSource: isTotalTarget });

      this.log(`Bloco: Relacionamento [${rel.name}] ${isWeak ? '(IDENTIFICADOR FRACO)' : ''} (${cardSource}:${cardTarget}) entre [${ent1.name}] e [${ent2.name}].`, 'success');
      if (role1 || role2) {
        this.log(`  └─ Papéis: ${role1 ? `[${role1}]` : '[sem papel]'} e ${role2 ? `[${role2}]` : '[sem papel]'}.`, 'info');
      }

      this.parseRelationshipAttributes(rel, relationshipAttrsText);
    } else if (relationshipAttrsText) {
      // Cenário legado: quando bodyText era usado como bloco contendo assinatura na primeira linha
      const lines = bodyText.split(/[\n;]/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 0 && lines[0] !== bodyText.trim()) {
        this.processBlockRelationship(relRawName, lines[0], relationshipAttrsText || lines.slice(1).join(', '));
      }
    }
  }

  parseRelationshipParticipants(bodyText) {
    if (!bodyText || !bodyText.trim()) return [];

    // Relacionamentos n-ários usam ':' como separador entre participantes.
    // Ex.: Fornecedor N : Produto N : Projeto 1
    const rawParts = bodyText
      .split(/\s*:\s*/)
      .map(part => part.trim())
      .filter(Boolean);

    if (rawParts.length < 2) return [];

    const participants = [];
    for (const raw of rawParts) {
      const parsed = this.parseRelationshipParticipantPart(raw);
      if (!parsed) {
        return [];
      }

      const entityName = parsed.entityName;
      const role = parsed.role;
      const card = parsed.card;
      if (!entityName) return [];

      const res = this.model.addEntity(entityName);
      const entity = res.element || res;
      participants.push({ entity, role, card });
    }

    return participants;
  }

  parseRelationshipParticipantPart(raw) {
    if (!raw) return null;

    // Formato 1: Entidade [papel] N
    let partMatch = raw.match(/^(.+?)\s*(?:\[([^\]]+)\])?\s*\(?\s*(1|n|m)\s*\)?$/i);
    if (partMatch) {
      return {
        entityName: this.toSingular(partMatch[1]),
        role: (partMatch[2] || '').trim(),
        card: partMatch[3].toUpperCase()
      };
    }

    // Formato 2: 1 Entidade [papel]
    partMatch = raw.match(/^\(?\s*(1|n|m)\s*\)?\s*(.+?)\s*(?:\[([^\]]+)\])?\s*$/i);
    if (partMatch) {
      return {
        entityName: this.toSingular(partMatch[2]),
        role: (partMatch[3] || '').trim(),
        card: partMatch[1].toUpperCase()
      };
    }

    return null;
  }

  createRelationshipFromParticipants(relName, participants, isWeak) {
    if (!participants || participants.length < 2) return null;

    const relRes = this.model.addRelationship(relName, 400, 200, isWeak);
    const rel = relRes.element || relRes;

    if (isWeak) {
      this.markWeakParticipants(participants);
    }

    const weakParticipants = participants.filter(p => p.entity.isWeak);
    const shouldFallbackMarkLast = isWeak && weakParticipants.length === 0;

    participants.forEach((participant, idx) => {
      const isWeakSide = weakParticipants.includes(participant);
      const isTotalSource = isWeakSide || (shouldFallbackMarkLast && idx === participants.length - 1);

      this.model.addConnection(participant.entity.id, rel.id, participant.card, '', {
        roleSource: participant.role,
        isTotalSource
      });
    });

    return rel;
  }

  markWeakParticipants(participants) {
    if (!participants || participants.length === 0) return;

    // Regra prática: em relacionamento identificador, lados com cardinalidade
    // diferente de 1 são candidatos naturais a entidades fracas.
    const nonOne = participants.filter(p => p.card !== '1');
    if (nonOne.length > 0) {
      nonOne.forEach(p => {
        p.entity.isWeak = true;
      });
      return;
    }

    // Fallback conservador para 1:1: marca o último participante como fraco.
    participants[participants.length - 1].entity.isWeak = true;
  }

  parseRelationshipAttributes(relationship, attrsText) {
    if (!attrsText || !attrsText.trim()) return;

    const attrTokens = attrsText
      .split(/[\n,;]/)
      .map(token => token.trim())
      .filter(token => token.length > 0);

    attrTokens.forEach(token => {
      if (!token.includes(':') && !token.includes('->')) {
        const attr = this.model.addAttribute(token, relationship.id);
        if (attr) {
          this.log(`  └─ Atributo de Relacionamento [${attr.name}] adicionado a [${relationship.name}].`, 'info');
        }
      }
    });
  }

  // --- PROCESSAMENTO DE FRASES INDIVIDUAIS / COMANDOS ---
  processSentence(sentence) {
    const s = sentence.toLowerCase().trim();
    if (s.startsWith('//') || s.startsWith('#')) return; // Comentários

    // Comandos diretos de criação
    if (s.startsWith('criar entidade fraca') || s.startsWith('nova entidade fraca') || s.startsWith('entidade fraca ')) {
      this.handleCommandCreateEntity(sentence);
      return;
    }

    if (s.startsWith('criar entidade') || s.startsWith('nova entidade') || s.startsWith('entidade ')) {
      this.handleCommandCreateEntity(sentence);
      return;
    }

    if (s.startsWith('adicionar atributo') || s.startsWith('criar atributo') || s.startsWith('atributo ')) {
      this.handleCommandAddAttribute(sentence);
      return;
    }

    if (s.startsWith('criar relacionamento') || s.startsWith('novo relacionamento') || s.startsWith('relacionamento ')) {
      this.handleCommandCreateRelationship(sentence);
      return;
    }

    // Comandos diretos de exclusão/remoção (Estilo SQL)
    if (s.startsWith('deletar') || s.startsWith('excluir') || s.startsWith('remover') || s.startsWith('drop') || s.startsWith('limpar') || s === 'clear') {
      this.handleCommandDelete(sentence);
      return;
    }

    // Frases em linguagem natural / declarativas
    if (s.includes('possui') || s.includes('tem') || s.includes('existe') || s.includes('contém') || s.includes('gerencia')) {
      const handled = this.handleSentenceEntitiesAndAttributes(sentence);
      if (handled) return;
    }

    if (this.handleSentenceAttributesList(sentence)) {
      return;
    }

    if (this.handleSentenceRelationshipAndCardinality(sentence)) {
      return;
    }

    this.log(`Aviso: Linha não reconhecida: '${sentence}' — verifique a sintaxe.`, 'warning');
  }

  // --- COMANDOS INCREMENTAIS ---
  handleCommandCreateEntity(sentence) {
    const isWeak = /entidade\s+fraca/i.test(sentence);
    const match = sentence.match(/(?:criar|nova)?\s*entidade\s+(?:fraca\s+)?([a-záàâãéèêíóòôõúç0-9_\-\s]+)/i);
    if (match && match[1]) {
      const name = this.toSingular(match[1].trim());
      const res = this.model.addEntity(name, 200, 200, isWeak);
      const entity = res.element || res;
      this.log(`Comando: Entidade [${entity.name}] criada ${isWeak ? '(FRACA)' : ''}.`, 'success');
    }
  }

  handleCommandAddAttribute(sentence) {
    const match = sentence.match(/(?:adicionar|criar)?\s*atributo\s+(chave|identificador)?\s*([a-záàâãéèêíóòôõúç0-9_\s]+)\s+(?:em|na|no|para|de)\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i);
    if (match) {
      const isKey = Boolean(match[1]);
      const attrName = match[2].trim();
      const entityName = this.toSingular(match[3].trim());

      let entity = this.model.findEntityByName(entityName);
      if (!entity) {
        entity = this.model.addEntity(entityName);
        this.log(`Entidade [${entity.name}] criada automaticamente.`, 'info');
      }

      const attr = this.model.addAttribute(attrName, entity.id, isKey);
      this.log(`Comando: Atributo [${attr.name}] ${isKey ? '(CHAVE)' : ''} adicionado a [${entity.name}].`, 'success');
    }
  }

  handleCommandCreateRelationship(sentence) {
    const isWeak = /fraco|weak/i.test(sentence);
    const match = sentence.match(/(?:criar|novo)?\s*(?:relacionamento)?\s*(?:fraco)?\s*([a-záàâãéèêíóòôõúç0-9_\s]+)\s+(?:entre|com)\s+([a-záàâãéèêíóòôõúç0-9_\s]+)\s+e\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i);

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
      const cardMatch = sentence.match(/\(?(?:cardinalidade|card)?\s*([1nm])\s*[:\-]\s*([1nm])\)?/i);
      if (cardMatch) {
        card1 = cardMatch[1].toUpperCase();
        card2 = cardMatch[2].toUpperCase();
      }

      const participants = [
        { entity: ent1, role: '', card: card1 },
        { entity: ent2, role: '', card: card2 }
      ];
      const rel = this.createRelationshipFromParticipants(relName, participants, isWeak);
      if (!rel) return;

      this.log(`Comando: Relacionamento ${isWeak ? 'FRACO ' : ''}[${rel.name}] (${card1}:${card2}) criado entre [${ent1.name}] e [${ent2.name}].`, 'success');
    }
  }

  handleCommandDelete(sentence) {
    const s = sentence.toLowerCase().trim();

    // 0. Limpar todo o diagrama: "limpar" ou "limpar diagrama" ou "clear"
    if (s === 'limpar' || s === 'limpar diagrama' || s === 'clear' || s.startsWith('limpar tudo')) {
      this.model.clear();
      this.log('Comando: Todo o diagrama foi limpo.', 'warning');
      return;
    }

    // 1. Excluir Entidade: "deletar entidade aluno" ou "drop entidade aluno"
    const entMatch = sentence.match(/(?:deletar|excluir|remover|drop)\s+entidade\s+([a-záàâãéèêíóòôõúç0-9_\-\s]+)/i);
    if (entMatch) {
      const entName = this.toSingular(entMatch[1].trim());
      const entity = this.model.findEntityByName(entName);
      if (entity) {
        this.model.removeElement(entity.id);
        this.log(`Comando: Entidade [${entity.name}] excluída do diagrama.`, 'warning');
      } else {
        this.log(`Erro Comando: Entidade [${entName.toUpperCase()}] não encontrada.`, 'error');
      }
      return;
    }

    // 2. Excluir Atributo: "deletar atributo email [em aluno]"
    const attrMatch = sentence.match(/(?:deletar|excluir|remover|drop)\s+atributo\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i);
    if (attrMatch) {
      const attrName = attrMatch[1].trim();
      const attr = this.model.attributes.find(a => a.name.toLowerCase() === attrName.toLowerCase());
      if (attr) {
        this.model.removeElement(attr.id);
        this.log(`Comando: Atributo [${attr.name}] excluído do diagrama.`, 'warning');
      } else {
        this.log(`Erro Comando: Atributo [${attrName}] não encontrado.`, 'error');
      }
      return;
    }

    // 3. Excluir Relacionamento: "deletar relacionamento matricula"
    const relMatch = sentence.match(/(?:deletar|excluir|remover|drop)\s+relacionamento\s+([a-záàâãéèêíóòôõúç0-9_\s]+)/i);
    if (relMatch) {
      const relName = relMatch[1].trim();
      const rel = this.model.findRelationshipByName(relName);
      if (rel) {
        this.model.removeElement(rel.id);
        this.log(`Comando: Relacionamento [${rel.name}] excluído do diagrama.`, 'warning');
      } else {
        this.log(`Erro Comando: Relacionamento [${relName.toUpperCase()}] não encontrado.`, 'error');
      }
      return;
    }
  }

  handleSentenceEntitiesAndAttributes(sentence) {
    const posRegex = /(?:possui|possui vários|possui várias|tem|contém|gerencia|controla)\s+([a-záàâãéèêíóòôõúç0-9_,\s\e]+)/i;
    const match = sentence.match(posRegex);

    if (match && match[1]) {
      const itemsText = match[1];
      const items = itemsText
        .split(/,|\be\b/)
        .map(i => i.trim())
        .filter(i => i.length > 2 && !['um', 'uma', 'vários', 'várias', 'seus', 'suas'].includes(i));

      if (items.length > 0) {
        items.forEach(item => {
          const cleanItem = item.replace(/^(um|uma|vários|várias|os|as|seus|suas)\s+/i, '');
          const entityName = this.toSingular(cleanItem);
          if (entityName.length > 2) {
            const entity = this.model.addEntity(entityName);
            this.log(`Identificada Entidade: [${entity.name}]`, 'info');
          }
        });
        return true;
      }
    }
    return false;
  }

  handleSentenceAttributesList(sentence) {
    const match = sentence.match(/(?:o|a|cada)?\s*([a-záàâãéèêíóòôõúç0-9_\s]+)\s+(?:possui|tem|contém)\s+([a-záàâãéèêíóòôõúç0-9_,\s\e]+)/i);
    if (!match) return false;

    const rawEntityName = match[1].replace(/^(o|a|cada)\s+/i, '').trim();
    const attributesText = match[2].trim();

    const entityName = this.toSingular(rawEntityName);
    const entity = this.model.addEntity(entityName);

    const attrTokens = attributesText
      .split(/,|\be\b/)
      .map(a => a.trim())
      .filter(a => a.length > 0);

    attrTokens.forEach(token => {
      const cleanToken = token.replace(/^(um|uma|seu|sua|seus|suas|o|a)\s+/i, '');
      if (cleanToken.length < 2) return;

      const isKey = this.isKeyAttributeName(cleanToken) || sentence.toLowerCase().includes(`atributo chave ${cleanToken}`);

      const attr = this.model.addAttribute(cleanToken, entity.id, isKey);
      this.log(`Atributo [${attr.name}] ${isKey ? '(CHAVE)' : ''} atribuído a [${entity.name}]`, 'info');
    });

    return true;
  }

  handleSentenceRelationshipAndCardinality(sentence) {
    const s = sentence.toLowerCase();
    const entities = this.model.entities;
    let foundEntities = [];

    entities.forEach(ent => {
      const singular = ent.name.toLowerCase();
      if (s.includes(singular) || s.includes(singular + 's') || s.includes(singular + 'es')) {
        if (!foundEntities.includes(ent)) {
          foundEntities.push(ent);
        }
      }
    });

    if (foundEntities.length >= 2) {
      const ent1 = foundEntities[0];
      const ent2 = foundEntities[1];

      let relName = 'RELACIONA';
      if (s.includes('matriculado') || s.includes('matrícula') || s.includes('matricula')) relName = 'MATRICULA';
      else if (s.includes('compra') || s.includes('comprar')) relName = 'COMPRA';
      else if (s.includes('pertence') || s.includes('pertencem')) relName = 'PERTENCE';
      else if (s.includes('ministra') || s.includes('ministrado')) relName = 'MINISTRA';
      else if (s.includes('escreve') || s.includes('escrito')) relName = 'ESCREVE';
      else if (s.includes('prescreve') || s.includes('atendido')) relName = 'PRESCREVE';
      else if (s.includes('contém') || s.includes('possui')) relName = 'POSSUI';

      let card1 = '1';
      let card2 = 'N';

      if ((s.includes('vários') || s.includes('varios') || s.includes('muitos')) &&
          (s.includes('cada') || s.includes('vários') || s.includes('varios'))) {
        if (s.match(/cada\s+.*\s+(?:vários|varios).*\s+cada\s+.*\s+(?:vários|varios)/) || (s.includes('vários') && s.includes('vários'))) {
          card1 = 'N';
          card2 = 'N';
        } else {
          card1 = '1';
          card2 = 'N';
        }
      }

      const rel = this.model.addRelationship(relName);
      this.model.addConnection(ent1.id, rel.id, card1, '');
      this.model.addConnection(rel.id, ent2.id, '', card2);

      this.log(`Identificado Relacionamento [${rel.name}] (${card1}:${card2}) entre [${ent1.name}] e [${ent2.name}]`, 'info');
      return true;
    }

    return false;
  }

  isKeyAttributeName(name) {
    const n = name.toLowerCase().trim();
    return n.includes('codigo') || n.includes('código') ||
           n.includes('cpf') ||
           n.includes('matricula') || n.includes('matrícula') ||
           n.includes('id') || n === 'id' ||
           n.includes('crm') ||
           n.includes('numero') || n.includes('número');
  }
}
