const fs = require('fs');

class DummyModel {
  constructor() {
    this.entities = [];
    this.attributes = [];
    this.relationships = [];
    this.connections = [];
  }
  clear() {}
  autoLayout() {}
  addEntity(name) {
    const e = { id: name, name: name, type: 'entity' };
    this.entities.push(e);
    return e;
  }
  addAttribute(name, parentId, opts) {
    const a = { id: name, name: name, parentId: parentId, ...opts, type: 'attribute' };
    this.attributes.push(a);
    return a;
  }
  addRelationship(name) {
    const r = { id: name, name: name, type: 'relationship' };
    this.relationships.push(r);
    return r;
  }
  addConnection(sourceId, targetId, cardSource, cardTarget, opts) {
    const c = { sourceId, targetId, cardSource, cardTarget, ...opts };
    this.connections.push(c);
    return c;
  }
}

const parserCode = fs.readFileSync('js/nlp-parser.js', 'utf8');
const code = parserCode.replace('class NLPParser {', 'class NLPParser {').replace('export default NLPParser;', '');

eval(code);

const model = new DummyModel();
const parser = new NLPParser(model);

parser.parse("possui(+Curso N:1 Area)");
console.log(JSON.stringify(model.connections, null, 2));
