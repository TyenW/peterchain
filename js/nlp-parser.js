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
    return text.trim().replace(/\r\n/g, '\n');
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
      .split(/[\n.]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (lines.length > 0) {
      this.log(`Interpretação de ${lines.length} comandos/sentenças adicionais...`, 'cmd');
      lines.forEach(sentence => {
        this.processSentence(sentence);
      });
    }

    // Executar auto-layout para posicionar o diagrama de forma organizada
    this.model.autoLayout();

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
    // Regex para encontrar padroes tipo: ALUNO { *cpf, nome, matricula } ou ALUNO { ... }
    const blockRegex = /([a-záàâãéèêíóòôõúç0-9_\-\s]+)\s*\{([^}]+)\}/gi;
    let match;
    let modifiedText = text;

    while ((match = blockRegex.exec(text)) !== null) {
      const rawName = match[1].trim();
      const body = match[2].trim();

      // Verificar se o nome indica um relacionamento tipo "matricula(aluno N:N curso)" ou se é uma Entidade
      if (body.includes(':') || body.includes('<->') || body.includes('-')) {
        this.processBlockRelationship(rawName, body);
      } else {
        this.processBlockEntity(rawName, body);
      }

      // Remover o bloco processado do texto principal
      modifiedText = modifiedText.replace(match[0], '');
    }

    // Processar também sintaxe de relacionamento tipo: matricula (aluno N : N curso) ou (aluno N <-> N curso)
    const relParenRegex = /([a-záàâãéèêíóòôõúç0-9_\-\s]+)\s*\(([^)]+)\)/gi;
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
    const entityName = this.toSingular(entityRawName);
    if (!entityName) return;

    const entity = this.model.addEntity(entityName);
    this.log(`Bloco: Entidade [${entity.name}] identificada.`, 'success');

    // Separar atributos por vírgula, quebra de linha ou vírgula e ponto
    const attrTokens = bodyText
      .split(/[\n,;]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    attrTokens.forEach(token => {
      let isKey = false;
      let cleanToken = token;

      // Atributos chave podem ser prefixados com '*' ou '#' ou seguidos de '(chave)', '(pk)', '(key)', '(id)'
      if (cleanToken.startsWith('*') || cleanToken.startsWith('#')) {
        isKey = true;
        cleanToken = cleanToken.slice(1).trim();
      } else if (/\((?:chave|pk|key|id|identificador)\)/i.test(cleanToken)) {
        isKey = true;
        cleanToken = cleanToken.replace(/\((?:chave|pk|key|id|identificador)\)/i, '').trim();
      } else if (this.isKeyAttributeName(cleanToken)) {
        isKey = true;
      }

      if (cleanToken.length > 0) {
        const attr = this.model.addAttribute(cleanToken, entity.id, isKey);
        this.log(`  └─ Atributo [${attr.name}] ${isKey ? '(CHAVE)' : ''} adicionado a [${entity.name}].`, 'info');
      }
    });
  }

  processBlockRelationship(relRawName, bodyText) {
    const relName = relRawName.trim().toUpperCase() || 'RELACIONA';

    // Formato ex: "aluno N : N curso" ou "aluno (1) - curso (N)" ou "aluno N <-> N curso"
    const match = bodyText.match(/([a-záàâãéèêíóòôõúç0-9_\s]+)\s*\(?([1nm])\)?\s*[:\-<>\s]+\s*\(?([1nm])\)?\s*([a-záàâãéèêíóòôõúç0-9_\s]+)/i);

    if (match) {
      const entity1Name = this.toSingular(match[1]);
      const cardSource = match[2].toUpperCase();
      const cardTarget = match[3].toUpperCase();
      const entity2Name = this.toSingular(match[4]);

      const ent1 = this.model.addEntity(entity1Name);
      const ent2 = this.model.addEntity(entity2Name);
      const rel = this.model.addRelationship(relName);

      this.model.addConnection(ent1.id, rel.id, cardSource, '');
      this.model.addConnection(rel.id, ent2.id, '', cardTarget);

      this.log(`Bloco: Relacionamento [${rel.name}] (${cardSource}:${cardTarget}) entre [${ent1.name}] e [${ent2.name}].`, 'success');
    }
  }

  // --- PROCESSAMENTO DE FRASES INDIVIDUAIS / COMANDOS ---
  processSentence(sentence) {
    const s = sentence.toLowerCase();

    // Comandos diretos de criação
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

    // Frases em linguagem natural
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
  }

  // --- COMANDOS INCREMENTAIS ---
  handleCommandCreateEntity(sentence) {
    const match = sentence.match(/(?:criar|nova)?\s*entidade\s+([a-záàâãéèêíóòôõúç0-9_\-\s]+)/i);
    if (match && match[1]) {
      const name = this.toSingular(match[1].trim());
      const entity = this.model.addEntity(name);
      this.log(`Comando: Entidade [${entity.name}] criada.`, 'success');
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
