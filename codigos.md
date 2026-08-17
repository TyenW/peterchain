# Guia Prático de Pseudo-Código — DER Builder

Este documento ensina **como escrever código ER/EER** no editor do DER Builder. Cada construção é mostrada com a **sintaxe exata**, **exemplos copiáveis** e **notas sobre o comportamento do parser e da notação visual de Peter Chen**.

---

## Índice

1. [Regras Gerais](#1-regras-gerais)
2. [Comentários](#2-comentários)
3. [Entidades Fortes](#3-entidades-fortes)
4. [Entidades Fracas](#4-entidades-fracas)
5. [Tipos de Atributo (Prefixos)](#5-tipos-de-atributo-prefixos)
6. [Relacionamentos Simples](#6-relacionamentos-simples)
7. [Relacionamentos Fracos (Identificadores)](#7-relacionamentos-fracos-identificadores)
8. [Relacionamentos com Atributos](#8-relacionamentos-com-atributos)
9. [Relacionamentos Recursivos e Role Names](#9-relacionamentos-recursivos-e-role-names)
10. [Especialização e Generalização EER](#10-especialização-e-generalização-eer)
11. [Categorias / Uniões EER](#11-categorias--uniões-eer)
12. [Comandos Incrementais (modo console)](#12-comandos-incrementais-modo-console)
13. [Comandos de Exclusão](#13-comandos-de-exclusão)
14. [Atributos Compostos (manual)](#14-atributos-compostos-manual)
15. [Exemplo Completo: SAM v1.0](#15-exemplo-completo-sam-v10)
16. [Erros Comuns e Como Evitá-los](#16-erros-comuns-e-como-evitá-los)

---

## 1. Regras Gerais

- O código é **case-insensitive** para palavras-chave (`entidade fraca`, `Entidade Fraca` e `ENTIDADE FRACA` têm o mesmo efeito).
- Atributos dentro de chaves `{ }` podem ser separados por **vírgula**, **ponto e vírgula** ou **quebra de linha**.
- Cada **bloco** (entidade, relacionamento ou especialização) é processado independentemente.
- Linhas que não casarem com nenhum padrão válido geram um aviso no terminal: `Aviso: Linha não reconhecida`.
- Linhas que iniciam com `//` ou `#` são **comentários** e são desconsideradas.

---

## 2. Comentários

```
// Isto é um comentário (ignorado pelo parser)
# Isto também é um comentário de linha inteira
Aluno {
  *CPF, // Comentário inline ao lado do atributo
  Nome
}
```

---

## 3. Entidades Fortes

**Sintaxe:**
```
NomeDaEntidade {
  atributo1,
  atributo2
}
```

**Exemplo:**
```
Aluno {
  *Matricula,
  Nome,
  Sexo,
  DataNascimento
}
```

**Representação Visual (Peter Chen):**
- **Retângulo simples** com nome em caixa alta.
- **Elipses simples** para atributos comuns.
- **Elipse com texto sublinhado sólido** para a chave primária (`*Matricula`).

---

## 4. Entidades Fracas

**Sintaxe:**
```
entidade fraca NomeDaEntidade {
  _ChaveParcial_,
  Atributo
}
```

**Exemplo:**
```
entidade fraca Dependente {
  _NomeDependente_,
  Parentesco
}
```

**Representação Visual (Peter Chen):**
- **Retângulo de borda dupla** para a entidade fraca.
- **Elipse com texto sublinhado tracejado** para a chave parcial / discriminador (`_NomeDependente_`).

> **Importante:** A chave parcial deve começar e terminar com underscore: `_NomeDependente_` ou `_Sigla_`.

---

## 5. Tipos de Atributo (Prefixos)

Dentro das chaves `{ }`, cada atributo pode utilizar um prefixo para determinar seu tipo:

| Prefixo | Tipo ER | Representação Gráfica | Exemplo |
|---|---|---|---|
| *(nenhum)* | Atributo simples | Elipse simples | `Nome` |
| `*` ou `#` | **Chave Primária** | Elipse com sublinhado sólido | `*CPF` |
| `_nome_` | **Chave Parcial** | Elipse com sublinhado tracejado | `_Sigla_` |
| `++` | **Multivalorado** | Elipse de borda dupla | `++Telefones` |
| `[]` (sufixo) | **Multivalorado** (alt.) | Elipse de borda dupla | `Telefones[]` |
| `~` | **Derivado** | Elipse de borda tracejada | `~Idade` |

**Exemplo com todos os tipos:**
```
Funcionario {
  *CPF,
  Nome,
  ~Idade,
  ++Telefones,
  Emails[]
}
```

---

## 6. Relacionamentos Simples

**Sintaxe:**
```
nomeRelacionamento (Entidade1 CARD : CARD Entidade2)
```

Onde `CARD` pode ser `1`, `N` ou `M`.

**Exemplos:**
```
// Um para Muitos (1:N)
pertence (Curso N : 1 Area)

// Muitos para Muitos (N:N)
matricula (Aluno N : N Curso)

// Um para Um (1:1)
possui (Pessoa 1 : 1 Passaporte)
```

**Representação Visual (Peter Chen):**
- **Losango simples** contendo o nome do relacionamento.
- Conexões com linhas simples indicando a cardinalidade (`1`, `N`, `M`).

---

## 7. Relacionamentos Fracos (Identificadores)

**Sintaxe:**
```
relacionamento fraco nomeRel (EntidadeForte 1 : N EntidadeFraca)
```

**Exemplo:**
```
relacionamento fraco compoe_curso (Curso 1 : N Modulo)
```

**Representação Visual (Peter Chen):**
- **Losango de borda dupla** indicando relacionamento identificador.
- A linha de conexão com a entidade fraca é desenhada com **linha dupla (participação total)**.

---

## 8. Relacionamentos com Atributos

Em relacionamentos N:N, atributos específicos da associação podem ser informados em chaves `{ }` logo após a declaração:

**Sintaxe:**
```
nomeRel (Entidade1 N : N Entidade2) {
  Atributo1,
  Atributo2
}
```

**Exemplo:**
```
matricula (Aluno N : N Curso) {
  DataMatricula,
  Pago
}
```

**Representação Visual (Peter Chen):**
- Elipses de atributos conectadas diretamente ao **losango do relacionamento**.

---

## 9. Relacionamentos Recursivos e Role Names

Quando uma entidade se relaciona com ela mesma, utilize papéis entre colchetes `[papel]` para diferenciar as pontas:

**Sintaxe:**
```
nomeRel (Entidade [papel1] CARD : CARD Entidade [papel2])
```

**Exemplo:**
```
integra (Area [integrante] N : 1 Area [integrada])
supervisiona (Funcionario [supervisor] 1 : N Funcionario [subordinado])
```

**Representação Visual (Peter Chen):**
- Duas linhas ligando a mesma entidade ao losango.
- Rótulos textuais (`[integrante]`, `[integrada]`) posicionados sobre as linhas de conexão.

---

## 10. Especialização e Generalização EER

**Sintaxe:**
```
especializacao TIPO (SuperEntidade -> SubEntidade1, SubEntidade2)
```

Onde `TIPO` pode ser:
- `d` = **Disjunta** (mutuamente exclusiva)
- `o` = **Sobreposta** (pode pertencer a mais de uma)

**Exemplo:**
```
especializacao d (Pessoa -> Aluno, Professor)
especializacao o (Funcionario -> Engenheiro, Gerente)
```

**Representação Visual (EER):**
- Um **círculo** intermediário contendo a letra `d` ou `o` interligando a superentidade às subentidades.

---

## 11. Categorias / Uniões EER

**Sintaxe:**
```
categoria u (SubClasse -> SuperClasse1, SuperClasse2)
```

**Exemplo:**
```
categoria u (Proprietario -> Pessoa, Empresa)
```

---

## 12. Comandos Incrementais (modo console)

Você pode enviar comandos de uma linha no terminal inferior para alterar o diagrama existente:

```
criar entidade Professor
criar entidade fraca Dependente
adicionar atributo Email em Aluno
adicionar atributo chave CRM em Medico
criar relacionamento ministra entre Professor e Curso (1:N)
criar relacionamento fraco possui entre Funcionario e Dependente
```

---

## 13. Comandos de Exclusão

```
deletar entidade Curso
excluir atributo Email
remover relacionamento Ministra
limpar
```

---

## 14. Atributos Compostos

Atributos compostos (ex: `Nome` formado por `PrimeiroNome` e `Sobrenome`) podem ser declarados diretamente no pseudo-código usando a sintaxe de parênteses ou seta:

**Sintaxe no Código:**
```
Aluno {
  *CPF,
  Nome (PrimeiroNome, Sobrenome),
  Sexo
}
```

O parser criará automaticamente a elipse pai `Nome` ligada à entidade `Aluno` e conectará as elipses filhas `PrimeiroNome` e `Sobrenome` diretamente a `Nome`.

---

## 15. Exemplo Completo: SAM v1.0

```
// =============================================
// SAM — Sistema Acadêmico de Matrículas v1.0
// =============================================

Area {
  *Sigla,
  Nome
}

Curso {
  *Sigla,
  Nome,
  Custo,
  ~Horas,
  ++Professores (CPF_Professor, Nome_Professor)
}

Aluno {
  *CPF,
  Nome (PrimeiroNome, Sobrenome),
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
  DataMatricula,
  Pago
}

relacionamento fraco compoe_curso (Curso 1 : N Modulo)
relacionamento fraco compoe_modulo (Modulo 1 : N Topico)
```

---

## 16. Erros Comuns e Como Evitá-los

| ❌ Errado | ✅ Correto | Motivo |
|---|---|---|
| `Aluno { CPF chave }` | `Aluno { *CPF }` | Use o prefixo `*` para declarar chave primária. |
| `_NomeDependente` | `_NomeDependente_` | Chave parcial precisa de underscore no início e no fim. |
| `matricula (Aluno Curso)` | `matricula (Aluno N : N Curso)` | Cardinalidade é obrigatória em relacionamentos. |
| `entidadefraca Dep { }` | `entidade fraca Dep { }` | É necessário o espaço entre `entidade` e `fraca`. |
| `especializacao d Pessoa -> Aluno` | `especializacao d (Pessoa -> Aluno, Professor)` | Parênteses são obrigatórios em especializações. |
