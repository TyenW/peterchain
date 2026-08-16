# Guia Prático de Pseudo-Código — DER Builder

Este documento ensina **como escrever código ER** no editor do DER Builder. Cada construção é mostrada com a **sintaxe exata**, **exemplos copiáveis** e **notas sobre o que acontece por baixo dos panos**.

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

- O código é **case-insensitive** para palavras-chave (`entidade fraca`, `Entidade Fraca` e `ENTIDADE FRACA` funcionam igual).
- Atributos dentro de chaves `{ }` são separados por **vírgula**, **ponto e vírgula** ou **quebra de linha**.
- Cada **bloco** (entidade ou relacionamento) é processado na ordem em que aparece.
- Linhas que não casarem com nenhum padrão reconhecido geram um aviso amarelo no terminal: `"Linha não reconhecida"`.
- Linhas começando com `//` ou `#` são **comentários** e são ignoradas.

---

## 2. Comentários

```
// Isto é um comentário (ignorado pelo parser)
# Isto também é um comentário
```

Use comentários para anotar decisões de modelagem, separar seções ou desabilitar trechos temporariamente.

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

**O que acontece:**
- Cria a entidade `ALUNO` (retângulo simples).
- Cria cada atributo listado (elipses conectadas ao retângulo).
- O prefixo `*` marca `Matricula` como **chave primária** (texto sublinhado).

---

## 4. Entidades Fracas

**Sintaxe:**
```
entidade fraca NomeDaEntidade {
  atributo1,
  atributo2
}
```

**Exemplo:**
```
entidade fraca Dependente {
  _NomeDependente_,
  Parentesco
}
```

**O que acontece:**
- Cria a entidade `DEPENDENTE` com **retângulo de borda dupla**.
- O prefixo `_..._` marca `NomeDependente` como **chave parcial/discriminador** (sublinhado tracejado).

---

## 5. Tipos de Atributo (Prefixos)

Dentro das chaves `{ }`, cada atributo pode ser precedido por um **prefixo** que define seu tipo:

| Prefixo | Tipo | Representação Gráfica | Exemplo |
|---|---|---|---|
| *(nenhum)* | Atributo simples | Elipse simples | `Nome` |
| `*` ou `#` | **Chave primária** | Elipse com sublinhado sólido | `*CPF` |
| `_nome_` | **Chave parcial** (discriminador) | Elipse com sublinhado tracejado | `_Sigla_` |
| `++` | **Multivalorado** | Elipse de borda dupla | `++Telefones` |
| `[]` (sufixo) | **Multivalorado** (alternativo) | Elipse de borda dupla | `Telefones[]` |
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

**Notas importantes:**
- `*` e `#` são equivalentes: ambos marcam chave primária.
- Para **chave parcial**, o nome deve estar envolvido por underscores: `_NomeDependente_`.
- Palavras como `(chave)`, `(pk)`, `(key)`, `(id)`, `(identificador)` no final do nome também ativam a flag de chave: `CPF (chave)`.
- Nomes que contenham `cpf`, `codigo`, `matricula`, `id`, `crm` ou `numero` são automaticamente reconhecidos como chave.

---

## 6. Relacionamentos Simples

**Sintaxe:**
```
nomeRelacionamento (Entidade1 CARD : CARD Entidade2)
```

Onde `CARD` pode ser `1`, `N` ou `M`.

**Exemplos:**
```
// Um para Muitos
pertence (Curso N : 1 Area)

// Muitos para Muitos
matricula (Aluno N : N Curso)

// Um para Um
possui (Pessoa 1 : 1 Passaporte)
```

**O que acontece:**
- Cria o relacionamento (losango simples).
- Cria automaticamente as entidades se elas ainda não existirem.
- Conecta tudo com as cardinalidades especificadas.

**Variações aceitas de separador:**
```
matricula (Aluno N : N Curso)      // dois pontos
matricula (Aluno N - N Curso)      // hífen
matricula (Aluno (N) <-> (N) Curso)  // parênteses + setas
```

---

## 7. Relacionamentos Fracos (Identificadores)

**Sintaxe:**
```
relacionamento fraco nomeRel (EntidadeForte 1 : N EntidadeFraca)
```

**Exemplo:**
```
relacionamento fraco possui (Funcionario 1 : N Dependente)
```

**O que acontece:**
- Cria o relacionamento com **losango de borda dupla**.
- A conexão com a entidade fraca recebe automaticamente **participação total** (linha dupla).

---

## 8. Relacionamentos com Atributos

Em relacionamentos N:N é comum que a associação possua atributos próprios (ex: data, nota). O DER Builder permite definir atributos logo após a declaração de cardinalidade, dentro de chaves `{ }`.

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

**O que acontece:**
- Cria o relacionamento `MATRICULA` (losango).
- Cria os atributos `DataMatricula` e `Pago` ligados diretamente ao losango.

---

## 9. Relacionamentos Recursivos e Role Names

Quando a **mesma entidade** participa duas vezes no mesmo relacionamento, use **nomes de papel** entre colchetes `[papel]` para distinguir os dois lados.

**Sintaxe:**
```
nomeRel (Entidade [papel1] CARD : CARD Entidade [papel2])
```

**Exemplo:**
```
supervisiona (Funcionario [supervisor] 1 : N Funcionario [subordinado])
```

**O que acontece:**
- Cria duas conexões da mesma entidade ao losango.
- Cada conexão exibe o rótulo do papel (`[supervisor]`, `[subordinado]`) sobre a linha.

---

## 10. Especialização e Generalização EER

**Sintaxe:**
```
especializacao TIPO (SuperEntidade -> SubEntidade1, SubEntidade2, ...)
```

Onde `TIPO` é:
- `d` = **Disjunta** (mutuamente exclusiva)
- `o` = **Sobreposta** (pode pertencer a mais de uma)

**Exemplos:**
```
// Disjunta: Pessoa é OU Aluno OU Professor, nunca ambos
especializacao d (Pessoa -> Aluno, Professor)

// Sobreposta: Funcionário pode ser Engenheiro E Gerente ao mesmo tempo
especializacao o (Funcionario -> Engenheiro, Gerente)
```

**Sinônimos aceitos:** `herança` funciona no lugar de `especializacao`.

**O que acontece:**
- Cria a superentidade e as subentidades (se não existirem).
- Desenha um **círculo intermediário** com a letra `d` ou `o`.
- Conecta o círculo à superentidade e a cada subentidade.

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

**O que acontece:**
- Cria a subclasse-categoria e as superclasses.
- Desenha um **círculo com a letra `u`** interligando-as.

---

## 12. Comandos Incrementais (modo console)

Depois de gerar o diagrama pela primeira vez (botão "Executar Código"), você pode modificar o diagrama com **comandos de uma linha**:

### Criar entidade
```
criar entidade Professor
nova entidade Departamento
```

### Adicionar atributo
```
adicionar atributo Email em Aluno
adicionar atributo chave CRM em Medico
criar atributo Telefone em Cliente
```

### Criar relacionamento
```
criar relacionamento ministra entre Professor e Curso
criar relacionamento ministra entre Professor e Curso (cardinalidade 1:N)
criar relacionamento fraco possui entre Funcionario e Dependente
```

**Dica:** digite o comando e pressione Enter para executar diretamente (somente se a linha **não** estiver em um bloco multilinha).

---

## 13. Comandos de Exclusão

```
// Excluir uma entidade e todas as suas conexões
deletar entidade Curso
excluir entidade Aluno
remover entidade Professor
drop entidade Departamento

// Excluir um atributo
deletar atributo Email
excluir atributo Telefone

// Excluir um relacionamento
deletar relacionamento Matricula
excluir relacionamento Ministra

// Limpar o diagrama inteiro
limpar
limpar diagrama
clear
```

---

## 14. Atributos Compostos (manual)

Atributos compostos (ex: `Endereco` → `Rua`, `CEP`, `Cidade`) não possuem uma sintaxe de bloco específica. Para criá-los:

1. Declare o atributo pai e os subatributos na entidade:
   ```
   Cliente {
     *CPF,
     Endereco,
     Rua,
     CEP,
     Cidade
   }
   ```

2. Após gerar o diagrama, use a **ferramenta Conectar** (tecla `C`) para ligar:
   - `Endereco` → `Rua`
   - `Endereco` → `CEP`
   - `Endereco` → `Cidade`

Graficamente, isso cria a hierarquia de elipses da notação de Peter Chen.

**Para múltiplos níveis** (ex: `Endereco` → `Localizacao` → `Latitude`, `Longitude`), repita o processo conectando atributo a atributo.

---

## 15. Exemplo Completo: SAM v1.0

```
// =============================================
// SAM — Sistema Acadêmico de Matrículas v1.0
// =============================================

// --- ENTIDADES FORTES ---

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

// --- ENTIDADES FRACAS ---

entidade fraca Modulo {
  _Sigla_,
  Nome
}

entidade fraca Topico {
  _Sigla_,
  Nome,
  Horas
}

// --- RELACIONAMENTOS ---

pertence (Curso N : 1 Area)
integra (Area [integrante] N : 1 Area [integrada])

matricula (Aluno N : N Curso) {
  DataMatricula,
  Pago
}

relacionamento fraco compoe_modulo (Curso 1 : N Modulo)
relacionamento fraco compoe_topico (Modulo 1 : N Topico)

// --- ESPECIALIZAÇÃO EER ---
// especializacao d (Pessoa -> Aluno, Professor)

// --- ATRIBUTOS COMPOSTOS (conectar manualmente) ---
// Nome (Aluno) → PrimeiroNome, Sobrenome
```

---

## 16. Erros Comuns e Como Evitá-los

| ❌ Errado | ✅ Correto | Por quê |
|---|---|---|
| `Aluno { CPF chave }` | `Aluno { *CPF }` | Use o prefixo `*` para marcar chave, não a palavra "chave" solta. |
| `Aluno { ~idade, ++tel }` → dentro de parênteses `()` | Manter em chaves `{}` | Parênteses `()` são reservados para relacionamentos. |
| `matricula (Aluno Curso)` | `matricula (Aluno N : N Curso)` | A cardinalidade é obrigatória no formato de bloco. |
| `entidadefraca Dep { }` | `entidade fraca Dep { }` | Precisa do espaço entre `entidade` e `fraca`. |
| `especializacao d Pessoa Aluno Professor` | `especializacao d (Pessoa -> Aluno, Professor)` | Parênteses e `->` são obrigatórios na sintaxe de especialização. |
| `_NomeDep` (sem fechar) | `_NomeDep_` | A chave parcial exige underscores nos dois lados. |
| Bloco com `{ }` vazio | Mínimo 1 atributo | Gera aviso de "entidade sem atributos" no validador. |

---

## Referência Rápida (Cola)

```
// Entidade forte
Nome { *Chave, Atributo, ~Derivado, ++Multivalorado }

// Entidade fraca
entidade fraca Nome { _ChaveParcial_, Atributo }

// Relacionamento (com cardinalidade)
nomeRel (Entidade1 CARD : CARD Entidade2)

// Relacionamento fraco
relacionamento fraco nomeRel (EntForte 1 : N EntFraca)

// Relacionamento com atributos
nomeRel (Ent1 N : N Ent2) { Atrib1, Atrib2 }

// Relacionamento recursivo com papéis
nomeRel (Ent [papel1] CARD : CARD Ent [papel2])

// Especialização EER
especializacao d|o (Super -> Sub1, Sub2)

// Categoria / União
categoria u (Sub -> Super1, Super2)

// Comentário
// texto ignorado

// Comandos incrementais
criar entidade NomeDaEntidade
adicionar atributo NomeAtrib em NomeEntidade
criar relacionamento NomeRel entre Ent1 e Ent2
deletar entidade NomeDaEntidade
limpar diagrama
```
