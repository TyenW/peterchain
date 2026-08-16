/**
 * DER Builder — Presets de Exemplos (Notação Peter Chen & Pseudo-Comandos)
 */
const DERPresets = {
  eer: {
    title: '1. Modelo EER Estendido Completo',
    text: `// 1. Entidade Forte e Atributos:
Funcionario {
  *CPF,
  Nome,
  ~Idade,
  ++Telefones
}

// 2. Entidade Fraca e Chave Parcial:
entidade fraca Dependente {
  _Nome_dependente,
  Parentesco
}

// 3. Relacionamento Fraco (Identificador):
relacionamento fraco possui (Funcionario 1:N Dependente)

// 4. Herança EER (Disjunta / Sobreposta / União):
especializacao d (Pessoa -> Aluno, Professor)`
  },

  academico: {
    title: '2. Sistema Acadêmico Completo',
    text: `// Entidades e Atributos:
Aluno {
  *Matricula,
  Nome,
  *CPF
}

Curso {
  *Codigo,
  Nome,
  CargaHoraria
}

Professor {
  *Matricula,
  Nome,
  Especialidade
}

Disciplina {
  *Codigo,
  Nome
}

// Relacionamentos e Cardinalidades:
matricula (Aluno N : N Curso)
ministra (Professor 1 : N Curso)
compoe (Curso 1 : N Disciplina)`
  },

  loja: {
    title: '3. Loja Virtual / E-commerce',
    text: `Cliente {
  *CPF,
  Nome,
  Email,
  ++Telefones
}

Pedido {
  *Numero,
  Data,
  ValorTotal
}

Produto {
  *Codigo,
  Nome,
  Preco
}

Categoria {
  *Codigo,
  Nome
}

realiza (Cliente 1 : N Pedido)
contem (Pedido N : N Produto)
pertence (Produto N : 1 Categoria)`
  },

  biblioteca: {
    title: '4. Sistema de Biblioteca',
    text: `Leitor {
  *Codigo,
  Nome,
  *CPF,
  Telefone
}

Livro {
  *ISBN,
  Titulo,
  Ano,
  Editora
}

Autor {
  *Codigo,
  Nome
}

empresta (Leitor 1 : N Livro)
escreve (Autor N : N Livro)`
  }
};
