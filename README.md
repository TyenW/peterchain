# DER Builder — Especificação de Modelagem, Notação de Peter Chen e Sintaxe do Editor

Bem-vindo à documentação oficial do **DER Builder**. Este documento é a **Especificação Técnica e Referência Definitiva** da aplicação, cobrindo a teoria dos modelos **ER (Entidade-Relacionamento)** e **EER (ER Estendido)**, a notação gráfica formal proposta por **Peter Chen** (1976), a **Sintaxe do Editor** e o conjunto rigoroso de **Regras de Validação** implementadas pelo software.

---

## 📚 Sumário Executivo

1. [Visão Geral do Modelo ER / EER](#1-visão-geral-do-modelo-er--eer)
2. [Notação Oficial de Peter Chen vs. Sintaxe do DER Builder](#2-notação-oficial-de-peter-chen-vs-sintaxe-do-der-builder)
3. [Entidades](#3-entidades)
   - 3.1 [Entidades Fortes (Regulares)](#31-entidades-fortes-regulares)
   - 3.2 [Entidades Fracas](#32-entidades-fracas)
   - 3.3 [Chaves Primárias e Chaves Compostas](#33-chaves-primárias-e-chaves-compostas)
4. [Atributos](#4-atributos)
   - 4.1 [Atributos Simples (Atômicos)](#41-atributos-simples-atômicos)
   - 4.2 [Atributos Compostos (Hierárquicos / Multinível)](#42-atributos-compostos-hierárquicos--multinível)
   - 4.3 [Atributos Multivalorados](#43-atributos-multivalorados)
   - 4.4 [Atributos Derivados](#44-atributos-derivados)
   - 4.5 [Atributos de Relacionamento](#45-atributos-de-relacionamento)
5. [Relacionamentos](#5-relacionamentos)
   - 5.1 [Relacionamentos Binários](#51-relacionamentos-binários)
   - 5.2 [Relacionamentos Recursivos (Auto-relacionamentos e Role Names)](#52-relacionamentos-recursivos-auto-relacionamentos-e-role-names)
   - 5.3 [Relacionamentos Ternários e N-ários](#53-relacionamentos-ternários-e-n-ários)
   - 5.4 [Cardinalidades em Relacionamentos N-ários](#54-cardinalidades-em-relacionamentos-n-ários)
   - 5.5 [Relacionamentos Identificadores (Fracos)](#55-relacionamentos-identificadores-fracos)
6. [Restrições Estruturais (Cardinalidade e Participação)](#6-restrições-estruturais-cardinalidade-e-participação)
   - 6.1 [Cardinalidade Máxima (1 e N)](#61-cardinalidade-máxima-1-e-n)
   - 6.2 [Participação Mínima (0 e 1 — Parcial vs. Total)](#62-participação-mínima-0-e-1--parcial-vs-total)
   - 6.3 [Notação de Intervalo Limite `(min, max)`](#63-notação-de-intervalo-limite-min-max)
   - 6.4 [Participação Especificada por Lado do Relacionamento](#64-participação-especificada-por-lado-do-relacionamento)
7. [Modelo ER Estendido (EER)](#7-modelo-er-estendido-eer)
   - 7.1 [Especialização vs. Generalização](#71-especialização-vs-generalização)
   - 7.2 [Herança de Atributos e Relacionamentos](#72-herança-de-atributos-e-relacionamentos)
   - 7.3 [Restrição de Disjunção (Disjunta `d` vs. Sobreposta `o`)](#73-restrição-de-disjunção-disjunta-d-vs-sobreposta-o)
   - 7.4 [Restrição de Completude (Total vs. Parcial)](#74-restrição-de-completude-total-vs-parcial)
   - 7.5 [Categorias / Uniões (`u`)](#75-categorias--uniões-u)
8. [Sintaxe e Convenções do DER Builder](#8-sintaxe-e-convenções-do-der-builder)
9. [Regras de Validação Estrutural do Software](#9-regras-de-validação-estrutural-do-software)
10. [Regras de Modelagem Conceitual (Entidade Associativa vs. Relacionamento)](#10-regras-de-modelagem-conceitual-entidade-associativa-vs-relacionamento)
11. [Exemplos Práticos e Scripts Completos](#11-exemplos-práticos-e-scripts-completos)
12. [Casos Inválidos e Erros Frequentes](#12-casos-inválidos-e-erros-frequentes)
13. [Tabela de Compatibilidade com a Notação de Peter Chen](#13-tabela-de-compatibilidade-com-a-notação-de-peter-chen)
14. [Limitações Conhecidas do DER Builder](#14-limitações-conhecidas-do-der-builder)

---

## 1. Visão Geral do Modelo ER / EER

O **Modelo Entidade-Relacionamento (DER)** foi introduzido por Peter Pin-Shan Chen em seu artigo seminal de 1976 (*"The Entity-Relationship Model — Toward a Unified View of Data"*). Trata-se de uma modelagem de nível conceitual alta, independente de implementação em bancos de dados relacionais ou NoSQL.

### Diferenciação entre ER Clássico e EER
- **ER Clássico de Chen**: Foca nos conceitos primitivos universais: Entidades (fortes e fracas), Atributos (simples, chave, multivalorados, derivados, compostos), Relacionamentos (binários, n-ários, identificadores), Cardinalidade e Participação.
- **EER (Extended Entity-Relationship)**: Expansão desenvolvida na década de 1980 para incorporar abstrações de Orientação a Objetos: **Especialização**, **Generalização**, **Herança de Atributos/Relacionamentos**, **Restrições de Disjunção/Completude** e **Categorias (Uniões)**.

---

## 2. Notação Oficial de Peter Chen vs. Sintaxe do DER Builder

É fundamental distinguir os **símbolos gráficos formais da notação Chen** das **palavras-chave e prefixos textuais** criados pelo DER Builder para permitir a geração de diagramas via código.

| Conceito | Notação Gráfica Oficial de Chen | Sintaxe Textual do DER Builder |
|---|---|---|
| **Entidade Forte** | Retângulo Simples | `Funcionario { ... }` |
| **Entidade Fraca** | Retângulo de Borda Dupla | `entidade fraca Dependente { ... }` |
| **Atributo Simples** | Elipse Simples | `Nome` |
| **Atributo Chave** | Elipse com texto **sublinhado sólido** | `*CPF` ou `#CPF` |
| **Chave Parcial** | Elipse com texto **sublinhado tracejado** | `_Nome_dependente_` |
| **Multivalorado** | Elipse de **Borda Dupla** | `++Telefones` ou `Telefones[]` |
| **Derivado** | Elipse de **Borda Tracejada** | `~Idade` |
| **Relacionamento Forte** | Losango Simples | `trabalha (Funcionario 1:N Departamento)` |
| **Relacionamento Fraco** | Losango de **Borda Dupla** | `relacionamento fraco possui (Funcionario 1:N Dependente)` |
| **Participação Total** | Linha Dupla | Checkbox no Inspetor / automático em relacionamentos fracos |
| **Papel (Role Name)** | Rótulo textual sobre a linha | `Professor [supervisor]` |
| **Especialização** | Círculo com `d`, `o` ou `u` | `especializacao d (Pessoa -> Aluno, Professor)` |

---

## 3. Entidades

### 3.1 Entidades Fortes (Regulares)
Uma entidade forte possui existência própria e autônoma no minimundo. É identificada por uma chave primária própria.
- **Gráfico**: Retângulo Simples.
- **Sintaxe**: `Aluno { *Matricula, Nome }`

### 3.2 Entidades Fracas
Uma entidade fraca **não pode ser identificada apenas por seus próprios atributos** e sua existência depende de uma entidade forte (entidade identificadora).
- **Gráfico**: Retângulo de Borda Dupla.
- **Sintaxe**: `entidade fraca Dependente { _Nome_dependente_, Parentesco }`

### 3.3 Chaves Primárias e Chaves Compostas
- **Chave Primária Simples**: Um único atributo exclusivo (`*CPF`).
- **Chave Primária Composta**: Formada pelo conjunto de dois ou mais atributos que, juntos, garantem a unicidade da entidade.
  - **Sintaxe**: `ItemPedido { *NumeroPedido, *CodigoProduto, Quantidade }`

---

## 4. Atributos

### 4.1 Atributos Simples (Atômicos)
Propriedade que não pode ser dividida em partes menores (ex: `Nome`, `Preco`). Representado por uma elipse simples.

### 4.2 Atributos Compostos (Hierárquicos / Multinível)
Atributo que pode ser desmembrado em subatributos componentes.
- **Gráfico**: Elipse do atributo pai conectada diretamente a elipses filhas dos subatributos.
- **Exemplo Multinível**: `Endereco` → `Rua`, `Numero`, `CEP`, `Localizacao` (`Latitude`, `Longitude`).
- **Uso no Builder**: Ferramenta Conectar ligando o Atributo pai ao Atributo filho.

### 4.3 Atributos Multivalorados
Pode conter um conjunto de valores para a mesma instância (ex: `Telefones`, `Emails`).
- **Gráfico**: Elipse de Borda Dupla.
- **Sintaxe**: `++Telefones` ou `Telefones[]`.

### 4.4 Atributos Derivados
Atributo cujo valor é calculado ou inferido a partir de outros atributos ou entidades (ex: `Idade` calculada pela `DataNascimento`).
- **Gráfico**: Elipse de Borda Tracejada (`stroke-dasharray: 5 4`).
- **Sintaxe**: `~Idade`.

### 4.5 Atributos de Relacionamento
Atributos que pertencem **diretamente a uma associação entre entidades**, e não a nenhuma das entidades isoladamente. Extremamente comuns em relacionamentos `N:N`.
- **Gráfico**: Elipse conectada diretamente ao losango do relacionamento.
- **Sintaxe**:
  ```
  matricula (Aluno N : N Curso) {
    DataMatricula,
    NotaFinal
  }
  ```

---

## 5. Relacionamentos

### 5.1 Relacionamentos Binários
Associação entre exatamente duas entidades (ex: `Aluno` cursa `Curso`).

### 5.2 Relacionamentos Recursivos (Auto-relacionamentos e Role Names)
Associação de uma entidade com ela mesma. Nesses casos, os **Nomes de Papel (Role Names)** são fundamentais para explicitar a função de cada participante.
- **Gráfico**: Duas linhas saindo da mesma entidade para o mesmo losango, com rótulos `[papel]` nas conexões.
- **Sintaxe**: `supervisiona (Professor [supervisor] 1 : N Professor [orientando])`

### 5.3 Relacionamentos Ternários e N-ários
Associação simultânea entre 3 ou mais entidades.
- **Conceito**: Um relacionamento ternário `A-B-C` **não é equivalente** a três relacionamentos binários `A-B`, `B-C` e `A-C`. Ele representa uma combinação indivisível das 3 instâncias.
- **Exemplo**: `fornece (Fornecedor N : Produto N : Projeto N)`

### 5.4 Cardinalidades em Relacionamentos N-ários
Em um relacionamento N-ário, a cardinalidade atribuída a uma entidade representa o número de instâncias que podem se associar à **combinação única das demais entidades**.
- Exemplo: `Fornecedor N : Produto N : Projeto 1` significa que para cada combinação de (Fornecedor, Produto), existe no máximo 1 Projeto associado.

### 5.5 Relacionamentos Identificadores (Fracos)
Conectam uma Entidade Fraca à sua Entidade Forte Identificadora.
- **Gráfico**: Losango de Borda Dupla.
- **Sintaxe**: `relacionamento fraco possui (Funcionario 1 : N Dependente)`

---

## 6. Restrições Estruturais (Cardinalidade e Participação)

### 6.1 Cardinalidade Máxima (1 e N)
Especifica a proporção máxima de mapeamento entre instâncias (`1:1`, `1:N`, `N:N`).

### 6.2 Participação Mínima (0 e 1 — Parcial vs. Total)
- **Participação Parcial (`min = 0`)**: A existência da entidade não depende do relacionamento (Linha Simples).
- **Participação Total (`min = 1`)**: A existência de toda instância da entidade exige participação no relacionamento (Linha Dupla).

### 6.3 Notação de Intervalo Limite `(min, max)`
Representação estruturada de limites exatos:
- `(0,1)`: Opcional, no máximo um.
- `(1,1)`: Obrigatório, exatamente um.
- `(0,N)`: Opcional, vários.
- `(1,N)`: Obrigatório, pelo menos um.

### 6.4 Participação Especificada por Lado do Relacionamento
A participação é avaliada **individualmente por ponta**:
- Exemplo `FUNCIONARIO ═══ trabalha ─── DEPARTAMENTO`:
  - Lado `FUNCIONARIO`: Participação Total (linha dupla) — todo funcionário deve estar alocado a um departamento.
  - Lado `DEPARTAMENTO`: Participação Parcial (linha simples) — pode existir um departamento novo sem funcionários ainda.

---

## 7. Modelo ER Estendido (EER)

### 7.1 Especialização vs. Generalização
- **Especialização**: Processo top-down. Define subclasses a partir de uma superclasse com base em características distintas.
- **Generalização**: Processo bottom-up. Sintetiza entidades com características comuns em uma superclasse generalizada.

### 7.2 Herança de Atributos e Relacionamentos
Toda subclasse herda **automaticamente todos os atributos e relacionamentos** de sua superclasse, além de possuir seus próprios atributos específicos.

### 7.3 Restrição de Disjunção (Disjunta `d` vs. Sobreposta `o`)
- **Disjunta (`d`)**: Uma instância da superclasse pode pertencer a no máximo uma subclasse.
- **Sobreposta (`o`)**: Uma instância da superclasse pode pertencer simultaneamente a múltiplas subclasses.

### 7.4 Restrição de Completude (Total vs. Parcial)
- **Completude Total**: Toda instância da superclasse DEVE pertencer a pelo menos uma subclasse.
- **Completude Parcial**: Uma instância da superclasse pode existir sem pertencer a nenhuma subclasse.

### 7.5 Categorias / Uniões (`u`)
Uma subclasse (categoria) que representa a **união de superclasses com tipos totalmente distintos**.
- **Símbolo**: Círculo com a letra `u`.
- **Sintaxe**: `categoria u (Proprietario -> Pessoa, Empresa)`

---

## 8. Sintaxe e Convenções do DER Builder

### Resumo das Palavras-Chave e Prefixo do Editor
- `*` ou `#` → Atributo Chave Primária.
- `_nome_` → Atributo Chave Parcial.
- `++` ou `[]` → Atributo Multivalorado.
- `~` → Atributo Derivado.
- `entidade fraca Nome { ... }` → Entidade Fraca.
- `relacionamento fraco Nome (...)` → Relacionamento Identificador.
- `especializacao d/o/u (Super -> Sub1, Sub2)` → Herança EER.
- `[papel]` → Nome de função no relacionamento.

---

## 9. Regras de Validação Estrutural do Software

O módulo `DERValidator` aplica as seguintes regras automáticas:

1. **Entidade**:
   - Deve possuir um nome válido.
   - Deve possuir pelo menos um atributo identificador (Chave Primária ou Parcial).
2. **Entidade Fraca**:
   - Deve estar vinculada a um Relacionamento Identificador (Losango Duplo) ou possuir uma Chave Parcial.
3. **Relacionamento**:
   - Deve estar conectado a pelo menos duas entidades.
   - Não pode ter o mesmo nome de uma Entidade no mesmo escopo.
4. **Atributos**:
   - Atributos não podem possuir cardinalidades.
   - Atributos órfãos (sem pai) são sinalizados com alerta.

---

## 10. Regras de Modelagem Conceitual (Entidade Associativa vs. Relacionamento)

Uma **Entidade Associativa** não é um símbolo primitivo extra de Chen, mas uma técnica conceitual para transformar um relacionamento `N:N` em uma entidade quando esse relacionamento precisa se conectar a outras entidades ou possui um ciclo de vida complexo.

---

## 11. Exemplos Práticos e Scripts Completos

### Script EER Completo
```
Funcionario {
  *CPF,
  Nome,
  ~Idade,
  ++Telefones
}

entidade fraca Dependente {
  _Nome_dependente_,
  Parentesco
}

relacionamento fraco possui (Funcionario 1:N Dependente)

especializacao d (Pessoa -> Aluno, Professor)

matricula (Aluno N : N Curso) {
  DataMatricula,
  NotaFinal
}
```

---

## 12. Casos Inválidos e Erros Frequentes

- ❌ Conectar duas entidades diretamente com uma linha sem usar losango.
- ❌ Atribuir cardinalidade `1:N` a um atributo.
- ❌ Criar entidade fraca sem chave parcial nem relacionamento fraco.
- ❌ Usar nomes idênticos para uma entidade e um relacionamento no mesmo projeto.

---

## 13. Tabela de Compatibilidade com a Notação de Peter Chen

- Entidade Forte (Retângulo Simples): **100% Suportado**
- Entidade Fraca (Retângulo Duplo): **100% Suportado**
- Atributo Chave (Sublinhado Sólido): **100% Suportado**
- Chave Parcial (Sublinhado Tracejado): **100% Suportado**
- Multivalorado (Borda Dupla): **100% Suportado**
- Derivado (Borda Tracejada): **100% Suportado**
- Atributo Composto (Atributo ↔ Atributo): **100% Suportado**
- Atributo de Relacionamento: **100% Suportado**
- Relacionamento Identificador (Losango Duplo): **100% Suportado**
- Participação Total (Linha Dupla): **100% Suportado**
- Role Names (`[papel]`): **100% Suportado**
- Especialização EER (`d`, `o`, `u`): **100% Suportado**

---

## 14. Limitações Conhecidas do DER Builder

1. **Auto-layout em Diagramas Ternários Extremos**: Relacionamentos com mais de 4 entidades conectadas podem necessitar de ajustes manuais de arraste.
2. **Seleção Múltipla**: Seleção de múltiplos elementos simultâneos via retângulo de seleção (*rubber-band*) está planejada para versões futuras.

---

*DER Builder — Especificação Técnica de Referência.*
