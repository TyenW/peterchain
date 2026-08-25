# Guia de Especificação e Geração de JSON — DER / EER Builder

Este documento apresenta o guia completo e padronizado para criar, editar e importar arquivos **JSON** no **DER / EER Builder** (Notação de Peter Chen & EER Estendido).

---

## 1. Visão Geral das Especializações EER (`d`, `o`, `u`)

No Modelo Entidade-Relacionamento Estendido (EER), os círculos de especialização/categoria são representados por letras específicas:

| Símbolo | Nome | Descrição & Regra de Negócio | Exemplo Prático |
| :---: | :--- | :--- | :--- |
| **`d`** | **Disjunta** (*Disjoint*) | As sub-classes são **mutuamente exclusivas**. Uma entidade pode pertencer a no máximo **uma** das sub-classes por vez. | Um `Funcionario` pode ser `Mensalista` **OU** `Horista` (nunca os dois). |
| **`o`** | **Sobreposta** (*Overlapping*) | As sub-classes podem se **sobrepor**. Uma entidade pode pertencer **simultaneamente** a duas ou mais sub-classes. | Uma `Pessoa` pode ser `Aluno` **E** `Professor` ao mesmo tempo. |
| **`u`** | **União / Categoria** (*Union*) | A super-classe é uma **União/Categoria** composta pela combinação das sub-classes. | Um `Veiculo` pode ser a união das sub-classes `Carro` e `Moto`. |

### 1.1 Linha Dupla vs. Linha Simples na Especialização
- **Participação Total (`"total": true`)**: Indica especialização total. Toda instância da super-entidade obrigatoriamente pertence a uma sub-classe. A linha conectando a super-entidade ao círculo **`d` / `o` / `u`** é exibida como **linha dupla**.
- **Participação Parcial (`"total": false`)**: A linha conectando a super-entidade ao círculo é exibida como **linha simples**.

### 1.2 Atributo Definidor (`definingAttribute`)
Permite especificar o atributo da super-entidade que define a especialização (ex: `TipoContrato`). O nome do atributo definidor é renderizado ao lado da linha que liga a super-entidade ao círculo.

---

## 2. Estrutura do JSON

O arquivo JSON pode ser fornecido no formato declarativo de alto nível. Abaixo está o esquema básico:

```json
{
  "project": "Nome do Projeto",
  "version": "1.0",
  "entities": [ ... ],
  "relationships": [ ... ],
  "specializations": [ ... ]
}
```

---

## 3. Especificação dos Componentes

### 3.1 Entidades (`entities`)
- **`name`**: Nome da entidade (ex: `"Funcionario"`, `"Dependente"`).
- **`type`**: `"strong"` (Entidade Forte / Retângulo simples) ou `"weak"` (Entidade Fraca / Retângulo duplo).
- **`attributes`**: Lista de atributos da entidade.

```json
{
  "name": "Dependente",
  "type": "weak",
  "attributes": [
    { "name": "NomeDependente", "type": "partial_key" },
    { "name": "Parentesco", "type": "simple" }
  ]
}
```

### 3.2 Atributos (`attributes`)
Tipos de atributos suportados:
- **`"key"`**: Chave Primária `*` (Texto com sublinhado sólido).
- **`"partial_key"`**: Chave Parcial / Discriminador `_` (Texto com sublinhado tracejado).
- **`"simple"`**: Atributo simples (Elipse com borda simples).
- **`"multivalued"`**: Multivalorado `++` (Elipse com borda dupla).
- **`"derived"`**: Derivado `~` (Elipse com borda tracejada).

### 3.3 Relacionamentos (`relationships`)
- **`name`**: Nome do relacionamento (ex: `"matricula"`, `"supervisao"`, `"compoe"`).
- **`type`**:
  - `"regular"`: Relacionamento Normal (Losango simples).
  - `"identifying"`: Relacionamento Identificador Fraco (Losango duplo).
  - `"recursive"`: Auto-relacionamento recursivo (duas conexões com a mesma entidade).
- **`participants`**: Lista de entidades participantes com cardinalidade e papel (`role`).

#### Exemplo de Auto-Relacionamento Recursivo (Supervisão):
```json
{
  "name": "supervisao",
  "type": "recursive",
  "description": "Auto-relacionamento recursivo entre Empregados",
  "participants": [
    {
      "entity": "Empregado",
      "role": "É supervisionado",
      "cardinality": "1"
    },
    {
      "entity": "Empregado",
      "role": "Supervisiona",
      "cardinality": "N"
    }
  ]
}
```

### 3.4 Especializações EER (`specializations`)
- **`type`**: `"d"` (Disjunta), `"o"` (Sobreposta) ou `"u"` (União/Categoria).
- **`superEntity`**: Nome da entidade pai (super-classe).
- **`subEntities`**: Array com os nomes das entidades filho (sub-classes).
- **`total`**: `true` (linha dupla / total) ou `false` (linha simples / parcial).
- **`definingAttribute`** *(opcional)*: Nome do atributo definidor.

```json
{
  "type": "d",
  "superEntity": "Funcionario",
  "subEntities": ["Mensalista", "Horista"],
  "total": false,
  "definingAttribute": "TipoContrato"
}
```

---

## 4. Exemplo Completo Prático (EER com `d`, `o`, `u`)

Você pode copiar o código JSON abaixo e colar diretamente no **Editor JSON** do sistema:

```json
{
  "project": "SISTEMA EER COMPLETO COM ESPECIALIZAÇÕES D, O, U",
  "version": "1.0",
  "entities": [
    {
      "name": "Funcionario",
      "type": "strong",
      "attributes": [
        { "name": "CPF", "type": "key" },
        { "name": "Nome", "type": "simple" },
        { "name": "Telefones", "type": "multivalued" }
      ]
    },
    {
      "name": "Mensalista",
      "type": "strong",
      "attributes": [
        { "name": "SalarioMensal", "type": "simple" }
      ]
    },
    {
      "name": "Horista",
      "type": "strong",
      "attributes": [
        { "name": "ValorHora", "type": "simple" }
      ]
    },
    {
      "name": "Pessoa",
      "type": "strong",
      "attributes": [
        { "name": "CPF", "type": "key" },
        { "name": "Nome", "type": "simple" }
      ]
    },
    {
      "name": "Aluno",
      "type": "strong",
      "attributes": [
        { "name": "Matricula", "type": "key" }
      ]
    },
    {
      "name": "Professor",
      "type": "strong",
      "attributes": [
        { "name": "Titulacao", "type": "simple" }
      ]
    },
    {
      "name": "Veiculo",
      "type": "strong",
      "attributes": [
        { "name": "Placa", "type": "key" }
      ]
    },
    {
      "name": "Carro",
      "type": "strong",
      "attributes": [
        { "name": "NumPortas", "type": "simple" }
      ]
    },
    {
      "name": "Moto",
      "type": "strong",
      "attributes": [
        { "name": "Cilindradas", "type": "simple" }
      ]
    }
  ],
  "relationships": [],
  "specializations": [
    {
      "type": "d",
      "superEntity": "Funcionario",
      "subEntities": ["Mensalista", "Horista"],
      "total": false,
      "definingAttribute": "TipoContrato"
    },
    {
      "type": "o",
      "superEntity": "Pessoa",
      "subEntities": ["Aluno", "Professor"],
      "total": true
    },
    {
      "type": "u",
      "superEntity": "Veiculo",
      "subEntities": ["Carro", "Moto"],
      "total": false
    }
  ]
}
```

---

## 5. Como Sincronizar o JSON no Aplicativo

1. Abra a aba **Editor JSON** no painel esquerdo da aplicação.
2. Cole o código JSON desejado na caixa de texto.
3. O diagrama será atualizado automaticamente em **tempo real**. Caso prefira sincronização manual, clique no botão **"Sincronizar JSON para Diagrama"** ou pressione `Ctrl + Enter`.
4. Clique no botão **"Auto-Layout"** na barra superior se quiser reorganizar o diagrama automaticamente no grid.
