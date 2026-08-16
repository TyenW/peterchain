/**
 * DER Builder — Presets de Exemplos (Linguagem Natural e Sintaxe de Blocos)
 */
const DERPresets = {
  blocos: {
    title: 'Sintaxe de Blocos { }',
    text: `// Exemplo no formato compacto Entidade { atributos... }
// Atributos com * ou palavras como cpf/codigo são marcados automaticamente como CHAVE (sublinhados)

aluno {
  *cpf,
  nome,
  matricula
}

curso {
  *codigo,
  nome,
  carga_horaria
}

professor {
  *crm,
  nome,
  especialidade
}

// Relacionamentos e Cardinalidades no formato bloco
matricula (aluno N : N curso)
ministra (professor 1 : N curso)`
  },

  academico: {
    title: 'Sistema Acadêmico',
    text: `Um sistema acadêmico possui alunos e cursos. Cada aluno pode estar matriculado em vários cursos e cada curso pode possuir vários alunos.

O aluno possui matrícula, nome e CPF.
O curso possui código, nome e carga horária.
O professor possui código, nome e especialidade.

Cada curso pode ser ministrado por um professor e um professor pode ministrar vários cursos.
A disciplina possui código e nome. Cada curso possui várias disciplinas.`
  },

  loja: {
    title: 'Loja Virtual',
    text: `Uma loja virtual possui clientes, pedidos e produtos.

O cliente possui CPF, nome, email e telefone.
O pedido possui número, data e valor total.
O produto possui código, nome e preço.
A categoria possui código e nome.

Cada cliente realiza vários pedidos. Cada pedido pertence a um cliente.
Um pedido pode conter vários produtos e cada produto pode estar em vários pedidos.
Cada produto pertence a uma categoria e uma categoria possui vários produtos.`
  },

  biblioteca: {
    title: 'Sistema de Biblioteca',
    text: `Um sistema de biblioteca controla leitores, livros e empréstimos.

O leitor possui código, nome, CPF e telefone.
O livro possui código, título, ano e editora.
O autor possui código e nome.

Um leitor realiza vários empréstimos e cada empréstimo pertence a um leitor.
Um empréstimo pode conter vários livros.
Um livro pode ser escrito por vários autores e cada autor pode escrever vários livros.`
  },

  hospital: {
    title: 'Gestão Hospitalar',
    text: `Um hospital gerencia pacientes, médicos e consultas.

O paciente possui CPF, nome, data nascimento e telefone.
O médico possui CRM, nome e especialidade.
A consulta possui código, data e horário.

Cada paciente agenda várias consultas e cada consulta pertence a um paciente.
Cada médico realiza várias consultas e cada consulta é atendida por um médico.
O medicamento possui código e nome. Uma consulta pode prescrever vários medicamentos.`
  }
};
