# Documentação Técnica e Especificação ER — SAM v1.0

Este documento apresenta a especificação conceitual do **SAM (Sistema Acadêmico de Matrículas v1.0)**, detalhando o mapeamento da descrição textual do minimundo para a notação de **Peter Chen** e fornecendo o código ER pronto para execução no **DER Builder**.

---

## 1. Mapeamento Minimundo → Notação Peter Chen

### 1.1 Entidades Fortes (Regulares)

| Entidade | Atributo Chave (`*`) | Atributos Simples | Atributos Especiais |
|---|---|---|---|
| **Area** | `*Sigla` | `Nome` | — |
| **Curso** | `*Sigla` | `Nome`, `Custo` | `~Horas` (Derivado do total de horas dos tópicos) |
| **Aluno** | `*CPF` | `PrimeiroNome`, `Sobrenome`, `Sexo`, `DataNascimento` | `Nome` (Composto — conectar subatributos via UI) |
| **Professor** | `*CPF` | `Nome` | — |

---

### 1.2 Entidades Fracas & Relacionamentos Identificadores

| Entidade Fraca | Discriminador (`_..._`) | Entidade Identificadora | Relacionamento Identificador |
|---|---|---|---|
| **Modulo** | `_Sigla_` | **Curso** | `compoe_curso` (1:N, Participação Total de Módulo) |
| **Topico** | `_Sigla_` | **Modulo** | `compoe_modulo` (1:N, Participação Total de Tópico) |

---

### 1.3 Relacionamentos e Cardinalidades

| Relacionamento | Tipo / Entidades | Cardinalidade | Papéis (Roles) | Atributos de Relacionamento |
|---|---|---|---|---|
| `pertence` | Binário (Curso ↔ Area) | N : 1 | — | — |
| `integra` | **Recursivo** (Area ↔ Area) | N : 1 | `[integrante]` / `[integrada]` | — |
| `ministra` | Binário (Professor ↔ Curso) | N : N | — | — |
| `matricula` | Binário (Aluno ↔ Curso) | N : N | — | `DataMatricula`, `Pago` |
| `compoe_curso` | **Identificador** (Curso ↔ Modulo) | 1 : N | — | — |
| `compoe_modulo` | **Identificador** (Modulo ↔ Topico) | 1 : N | — | — |

---

## 2. Pseudo-Código Completo para o DER Builder

Cole o código abaixo diretamente no painel de texto do **DER Builder** e clique em **"Executar Código"**:

```
// ============================================================
// SAM — Sistema Acadêmico de Matrículas v1.0
// Modelo Entidade-Relacionamento (Notação Peter Chen / EER)
// ============================================================

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
  Nome (PrimeiroNome, Sobrenome),
  Sexo,
  DataNascimento
}

Curso {
  *Sigla,
  Nome,
  Custo,
  ~Horas,
  ++Professores (CPF_Professor, Nome_Professor)
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

// Curso pertence obrigatoriamente a uma Área
pertence (Curso N : 1 Area)

// Relacionamento Recursivo com Papéis
integra (Area [integrante] N : 1 Area [integrada])

// Professor ministra Cursos
ministra (Professor N : N Curso)

// Matrícula de Aluno em Curso (com atributos do relacionamento)
matricula (Aluno N : N Curso) {
  DataMatricula,
  Pago
}

// Relacionamentos Identificadores (Entidades Fracas)
relacionamento fraco compoe_curso (Curso 1 : N Modulo)
relacionamento fraco compoe_modulo (Modulo 1 : N Topico)
```

---

## 3. Instruções de Ajuste Visual e Conexões Manuais

Após a geração automática do diagrama:

1. **Atributo Composto (`Nome` de Aluno)**:
   - No canvas, utilize a ferramenta **Conectar (tecla `C`)** para ligar o atributo `Nome` a `PrimeiroNome` e `Sobrenome`.
2. **Auto-Layout**:
   - Clique em **"Auto-Layout"** na barra superior se desejar reorganizar os nós.
3. **Exportação Acadêmica**:
   - Utilize a opção **Exportar → PNG** ou **SVG** no menu principal para gerar a versão formal em **preto e branco (Notação Peter Chen)** ideal para relatórios acadêmicos e documentação de software.

---

## 4. Matriz de Rastreabilidade (Minimundo vs. Modelo ER)

- **"Cursos categorizados por áreas... curso obrigatoriamente pertence a uma área"**: Relacionamento `pertence (Curso N : 1 Area)` com cardinalidade (1,1) no lado do Curso.
- **"Uma área pode ser integrada por outras áreas... integrante de uma única área"**: Auto-relacionamento `integra (Area [integrante] N : 1 Area [integrada])`.
- **"Módulos não existem sem vínculo a um curso"**: Entidade Fraca `Modulo` com relacionamento identificador fraco `compoe_curso`.
- **"Tópico só existe em função de um módulo"**: Entidade Fraca `Topico` encadeada ao `Modulo` com relacionamento identificador fraco `compoe_modulo`.
- **"Data e se o aluno pagou a matrícula"**: Atributos `DataMatricula` e `Pago` anexados ao losango `MATRICULA`.
- **"Horas do curso derivadas da totalização"**: Atributo derivado `~Horas` em `Curso` (elipse tracejada).
