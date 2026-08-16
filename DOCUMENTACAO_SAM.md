# Documentacao SAM v1.0 para DER Builder

## Objetivo
Este documento traduz o minimundo textual do SAM para uma estrutura de modelagem ER/EER alinhada com a notacao Peter Chen e com o parser do DER Builder.

## Resultado da Analise

### Entidades Fortes
- Area
  - Chave: Sigla
  - Atributos: Nome
- Curso
  - Chave: Sigla
  - Atributos: Nome, Custo, Horas (derivado)
- Aluno
  - Chave: CPF
  - Atributos: Nome (composto por PrimeiroNome e Sobrenome), Sexo, DataNascimento
- Professor
  - Chave: CPF
  - Atributos: Nome

### Entidades Fracas
- Modulo (fraca)
  - Chave parcial: Sigla
  - Atributos: Nome
- Topico (fraca)
  - Chave parcial: Sigla
  - Atributos: Nome, Horas

### Relacionamentos
- pertence: Curso N : 1 Area
  - Regra de negocio: Curso participa obrigatoriamente de Area
- integra (recursivo em Area): Area [integrante] N : 1 Area [integrada]
  - Regra: cada Area integrante participa de no maximo uma Area integrada
- ministra: Professor N : N Curso
- matricula: Aluno N : N Curso
  - Atributos de relacionamento: Data, Pago
- compoe_curso (fraco): Curso 1 : N Modulo
  - Modulo depende de Curso
- compoe_modulo (fraco): Modulo 1 : N Topico
  - Topico depende de Modulo

## Notas de Fidelidade ao Minimundo
- Horas de Curso sao derivadas do total de Horas de Topicos.
- Nomes de papel no relacionamento recursivo integra estao explicitos.
- Modulo e Topico sao modelados como entidades fracas com relacionamentos identificadores.
- Nome composto de Aluno deve ser representado ligando PrimeiroNome e Sobrenome ao atributo pai Nome via conexoes atributo-atributo.

## Script Recomendado para o Editor

Area {
  *Sigla,
  Nome
}

Curso {
  *Sigla,
  Nome,
  Custo,
  ~Horas
}

Aluno {
  *CPF,
  Nome,
  PrimeiroNome,
  Sobrenome,
  Sexo,
  DataNascimento
}

Professor {
  *CPF,
  Nome
}

entidade fraca Modulo {
  _Sigla_,
  Nome
}

entidade fraca Topico {
  _Sigla_,
  Nome,
  Horas
}

pertence (Curso N : 1 Area)
integra (Area [integrante] N : 1 Area [integrada])
ministra (Professor N : N Curso)

matricula (Aluno N : N Curso) {
  Data,
  Pago
}

relacionamento fraco compoe_curso (Curso 1 : N Modulo)
relacionamento fraco compoe_modulo (Modulo 1 : N Topico)

## Escrita Recomendada (Parser-Friendly)
- Escreva um bloco por vez e evite frases longas no mesmo trecho do script ER.
- Para entidade fraca, mantenha o padrao: entidade fraca Nome { ... }.
- Para relacionamento identificador, mantenha o padrao: relacionamento fraco Nome (A 1 : N B).
- Em relacionamentos recursivos, sempre explicite papeis com [papel].
- Em relacionamentos com atributos, use: NomeRel (...) { Atributo1, Atributo2 }.
- Para n-ario, use separacao por dois pontos: Rel (A N : B 1 : C N).

## Checklist de Validacao
- Toda entidade forte possui chave primaria.
- Toda entidade fraca possui chave parcial e relacionamento identificador.
- Relacionamentos possuem no minimo duas entidades conectadas.
- Relacionamento recursivo integra possui papeis definidos.
- Relacionamento matricula possui atributos de relacionamento.
- Participacao total das entidades fracas pode ser marcada no inspetor por lado.
