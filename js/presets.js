/**
 * DER Builder — Presets e Modelos Prontos (Notação Peter Chen & EER)
 * Somente os arquivos .json presentes no diretório do projeto com seus nomes exatos.
 */
const DERPresets = {
  "eer_modelo_completo": {
    id: "eer_modelo_completo",
    title: "eer_modelo_completo",
    fileName: "eer_modelo_completo.json",
    badge: "EER Completo",
    category: "EER",
    icon: "🧬",
    description: "Modelo EER contendo especializações Disjuntas (d), Sobrepostas (o) e Categoria/União (u).",
    tags: ["eer_modelo_completo.json", "EER", "d/o/u", "Especialização"],
    stats: { entities: 10, relationships: 1, specializations: 3 },
    data: {
  "entities": [
    {
      "id": "entity_def385ed",
      "name": "FUNCIONARIO",
      "type": "entity",
      "isWeak": false,
      "x": 480,
      "y": 120,
      "width": 140,
      "height": 50
    },
    {
      "id": "entity_c1ab59f6",
      "name": "MENSALISTA",
      "type": "entity",
      "isWeak": false,
      "x": 310,
      "y": 400,
      "width": 130,
      "height": 50
    },
    {
      "id": "entity_cc402e54",
      "name": "HORISTA",
      "type": "entity",
      "isWeak": false,
      "x": 620,
      "y": 400,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_dc85a874",
      "name": "PESSOA",
      "type": "entity",
      "isWeak": false,
      "x": 1040,
      "y": 110,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_7f15457a",
      "name": "ALUNO",
      "type": "entity",
      "isWeak": false,
      "x": 880,
      "y": 380,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_162ef072",
      "name": "PROFESSOR",
      "type": "entity",
      "isWeak": false,
      "x": 1220,
      "y": 380,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_9a4416d1",
      "name": "VEICULO",
      "type": "entity",
      "isWeak": false,
      "x": 1690,
      "y": 140,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_648b4688",
      "name": "CARRO",
      "type": "entity",
      "isWeak": false,
      "x": 1510,
      "y": 360,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_fd349aa3",
      "name": "MOTO",
      "type": "entity",
      "isWeak": false,
      "x": 1850,
      "y": 360,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_9f6f0b07",
      "name": "DEPENDENTE",
      "type": "entity",
      "isWeak": true,
      "x": 160,
      "y": 120,
      "width": 130,
      "height": 50
    }
  ],
  "attributes": [
    {
      "id": "attr_73bc356e",
      "name": "CPF",
      "type": "attribute",
      "parentId": "entity_def385ed",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 590,
      "y": 40,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_e7bacd3f",
      "name": "Nome",
      "type": "attribute",
      "parentId": "entity_def385ed",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 450,
      "y": 40,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_d319d92d",
      "name": "Telefones",
      "type": "attribute",
      "parentId": "entity_def385ed",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": true,
      "isDerived": false,
      "x": 670,
      "y": 120,
      "width": 96,
      "height": 40
    },
    {
      "id": "attr_201593f4",
      "name": "SalarioMensal",
      "type": "attribute",
      "parentId": "entity_c1ab59f6",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 310,
      "y": 510,
      "width": 128,
      "height": 40
    },
    {
      "id": "attr_7a27060d",
      "name": "ValorHora",
      "type": "attribute",
      "parentId": "entity_cc402e54",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 620,
      "y": 500,
      "width": 96,
      "height": 40
    },
    {
      "id": "attr_035c8ee9",
      "name": "CPF",
      "type": "attribute",
      "parentId": "entity_dc85a874",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1050,
      "y": 0,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_d8012ad1",
      "name": "Nome",
      "type": "attribute",
      "parentId": "entity_dc85a874",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 940,
      "y": 20,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_73aa599f",
      "name": "DataNascimento",
      "type": "attribute",
      "parentId": "entity_dc85a874",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1130,
      "y": 40,
      "width": 136,
      "height": 40
    },
    {
      "id": "attr_7d00509f",
      "name": "Matricula",
      "type": "attribute",
      "parentId": "entity_7f15457a",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 860,
      "y": 490,
      "width": 96,
      "height": 40
    },
    {
      "id": "attr_2a7ac546",
      "name": "CR",
      "type": "attribute",
      "parentId": "entity_7f15457a",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 850,
      "y": 290,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_82344da3",
      "name": "Titulacao",
      "type": "attribute",
      "parentId": "entity_162ef072",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1270,
      "y": 480,
      "width": 96,
      "height": 40
    },
    {
      "id": "attr_541cd2fe",
      "name": "Placa",
      "type": "attribute",
      "parentId": "entity_9a4416d1",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1560,
      "y": 60,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_1fa7477a",
      "name": "Modelo",
      "type": "attribute",
      "parentId": "entity_9a4416d1",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1750,
      "y": 60,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_ea4c9bed",
      "name": "NumPortas",
      "type": "attribute",
      "parentId": "entity_648b4688",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1390,
      "y": 280,
      "width": 96,
      "height": 40
    },
    {
      "id": "attr_7a689b5b",
      "name": "Cilindradas",
      "type": "attribute",
      "parentId": "entity_fd349aa3",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 1800,
      "y": 460,
      "width": 112,
      "height": 40
    },
    {
      "id": "attr_155aa439",
      "name": "NomeDependente",
      "type": "attribute",
      "parentId": "entity_9f6f0b07",
      "isKey": false,
      "isPartialKey": true,
      "isMultivalued": false,
      "isDerived": false,
      "x": 30,
      "y": 60,
      "width": 136,
      "height": 40
    },
    {
      "id": "attr_022cc836",
      "name": "Parentesco",
      "type": "attribute",
      "parentId": "entity_9f6f0b07",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 10,
      "y": 160,
      "width": 104,
      "height": 40
    }
  ],
  "relationships": [
    {
      "id": "rel_5f0bd96c",
      "name": "POSSUI",
      "type": "relationship",
      "isWeak": true,
      "x": 310,
      "y": 120,
      "width": 110,
      "height": 65
    }
  ],
  "specializations": [
    {
      "id": "spec_9be323df",
      "name": "D",
      "type": "specialization",
      "specType": "d",
      "isTotal": false,
      "definingAttribute": "TipoContrato",
      "superEntityId": "entity_def385ed",
      "subEntityIds": [
        "entity_c1ab59f6",
        "entity_cc402e54"
      ],
      "x": 480,
      "y": 400,
      "width": 36,
      "height": 36
    },
    {
      "id": "spec_4a590f28",
      "name": "O",
      "type": "specialization",
      "specType": "o",
      "isTotal": true,
      "definingAttribute": "",
      "superEntityId": "entity_dc85a874",
      "subEntityIds": [
        "entity_7f15457a",
        "entity_162ef072"
      ],
      "x": 1040,
      "y": 380,
      "width": 36,
      "height": 36
    },
    {
      "id": "spec_57def5cc",
      "name": "U",
      "type": "specialization",
      "specType": "u",
      "isTotal": false,
      "definingAttribute": "",
      "superEntityId": "entity_9a4416d1",
      "subEntityIds": [
        "entity_648b4688",
        "entity_fd349aa3"
      ],
      "x": 1690,
      "y": 360,
      "width": 36,
      "height": 36
    }
  ],
  "connections": [
    {
      "id": "conn_2d425207",
      "sourceId": "attr_73bc356e",
      "targetId": "entity_def385ed",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_ac493dea",
      "sourceId": "attr_e7bacd3f",
      "targetId": "entity_def385ed",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_5919631d",
      "sourceId": "attr_d319d92d",
      "targetId": "entity_def385ed",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_c0d9c5a8",
      "sourceId": "attr_201593f4",
      "targetId": "entity_c1ab59f6",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_32a144bb",
      "sourceId": "attr_7a27060d",
      "targetId": "entity_cc402e54",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_e3a49adf",
      "sourceId": "attr_035c8ee9",
      "targetId": "entity_dc85a874",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_edcfea6e",
      "sourceId": "attr_d8012ad1",
      "targetId": "entity_dc85a874",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_539340f7",
      "sourceId": "attr_73aa599f",
      "targetId": "entity_dc85a874",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_34ad3057",
      "sourceId": "attr_7d00509f",
      "targetId": "entity_7f15457a",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_ee110dbc",
      "sourceId": "attr_2a7ac546",
      "targetId": "entity_7f15457a",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_a70c6098",
      "sourceId": "attr_82344da3",
      "targetId": "entity_162ef072",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_a46f7ce2",
      "sourceId": "attr_541cd2fe",
      "targetId": "entity_9a4416d1",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_5ad72078",
      "sourceId": "attr_1fa7477a",
      "targetId": "entity_9a4416d1",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_51db5450",
      "sourceId": "attr_ea4c9bed",
      "targetId": "entity_648b4688",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_0883408d",
      "sourceId": "attr_7a689b5b",
      "targetId": "entity_fd349aa3",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_eef967bd",
      "sourceId": "attr_155aa439",
      "targetId": "entity_9f6f0b07",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_2a8fa81d",
      "sourceId": "attr_022cc836",
      "targetId": "entity_9f6f0b07",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_2bf070b5",
      "sourceId": "rel_5f0bd96c",
      "targetId": "entity_def385ed",
      "cardinalitySource": "",
      "cardinalityTarget": "1",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_0e6edbd8",
      "sourceId": "rel_5f0bd96c",
      "targetId": "entity_9f6f0b07",
      "cardinalitySource": "",
      "cardinalityTarget": "N",
      "isTotalSource": false,
      "isTotalTarget": true,
      "isTotal": true,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_61895c25",
      "sourceId": "entity_def385ed",
      "targetId": "spec_9be323df",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_c3d7f223",
      "sourceId": "spec_9be323df",
      "targetId": "entity_c1ab59f6",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_e9da32fe",
      "sourceId": "spec_9be323df",
      "targetId": "entity_cc402e54",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_8fb31407",
      "sourceId": "entity_dc85a874",
      "targetId": "spec_4a590f28",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": true,
      "isTotalTarget": false,
      "isTotal": true,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_6d7156ee",
      "sourceId": "spec_4a590f28",
      "targetId": "entity_7f15457a",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_e4242849",
      "sourceId": "spec_4a590f28",
      "targetId": "entity_162ef072",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_7ce5f7b7",
      "sourceId": "entity_9a4416d1",
      "targetId": "spec_57def5cc",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_f44e0086",
      "sourceId": "spec_57def5cc",
      "targetId": "entity_648b4688",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_39c0573a",
      "sourceId": "spec_57def5cc",
      "targetId": "entity_fd349aa3",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    }
  ]
}
  },

  "sam_modelo": {
    id: "sam_modelo",
    title: "sam_modelo",
    fileName: "sam_modelo.json",
    badge: "SAM",
    category: "Acadêmico",
    icon: "🎓",
    description: "Modelo conceitual SAM contendo entidades fortes, fracas, chaves parciais, auto-relacionamento e papéis.",
    tags: ["sam_modelo.json", "SAM", "Auto-Relacionamento", "Entidades Fracas"],
    stats: { entities: 6, relationships: 6, specializations: 0 },
    data: {
  "project": "SAM — SISTEMA ACADÊMICO DE MATRÍCULAS",
  "version": "1.0",
  "description": "Notação de Peter Chen (DER / EER Builder) em formato JSON",
  "entities": [
    {
      "name": "Empregado",
      "type": "strong",
      "attributes": [
        {
          "name": "CPF",
          "type": "key"
        },
        {
          "name": "Nome",
          "type": "simple"
        },
        {
          "name": "Cargo",
          "type": "simple"
        }
      ]
    },
    {
      "name": "Area",
      "type": "strong",
      "attributes": [
        {
          "name": "Sigla",
          "type": "key"
        },
        {
          "name": "Nome",
          "type": "simple"
        }
      ]
    },
    {
      "name": "Curso",
      "type": "strong",
      "attributes": [
        {
          "name": "Sigla",
          "type": "key"
        },
        {
          "name": "Nome",
          "type": "simple"
        },
        {
          "name": "Custo",
          "type": "simple"
        },
        {
          "name": "Horas",
          "type": "derived"
        },
        {
          "name": "Professores",
          "type": "multivalued"
        }
      ]
    },
    {
      "name": "Aluno",
      "type": "strong",
      "attributes": [
        {
          "name": "CPF",
          "type": "key"
        },
        {
          "name": "Nome",
          "type": "simple"
        },
        {
          "name": "Sexo",
          "type": "simple"
        },
        {
          "name": "DataNascimento",
          "type": "simple"
        }
      ]
    },
    {
      "name": "Modulo",
      "type": "weak",
      "attributes": [
        {
          "name": "Sigla",
          "type": "partial_key"
        },
        {
          "name": "Nome",
          "type": "simple"
        }
      ]
    },
    {
      "name": "Topico",
      "type": "weak",
      "attributes": [
        {
          "name": "Sigla",
          "type": "partial_key"
        },
        {
          "name": "Nome",
          "type": "simple"
        },
        {
          "name": "Horas",
          "type": "simple"
        }
      ]
    }
  ],
  "relationships": [
    {
      "name": "supervisao",
      "type": "recursive",
      "description": "Auto-relacionamento recursivo entre Empregados (Supervisão)",
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
    },
    {
      "name": "pertence",
      "type": "regular",
      "description": "Curso pertence obrigatoriamente a uma Área",
      "participants": [
        {
          "entity": "Curso",
          "cardinality": "N"
        },
        {
          "entity": "Area",
          "cardinality": "1"
        }
      ]
    },
    {
      "name": "integra",
      "type": "recursive",
      "description": "Auto-relacionamento recursivo entre Áreas",
      "participants": [
        {
          "entity": "Area",
          "role": "integrante",
          "cardinality": "N"
        },
        {
          "entity": "Area",
          "role": "integrada",
          "cardinality": "1"
        }
      ]
    },
    {
      "name": "matricula",
      "type": "regular",
      "description": "Matrícula de Aluno em Curso",
      "participants": [
        {
          "entity": "Aluno",
          "cardinality": "N"
        },
        {
          "entity": "Curso",
          "cardinality": "N"
        }
      ],
      "attributes": [
        {
          "name": "DataMatricula",
          "type": "simple"
        },
        {
          "name": "Pago",
          "type": "simple"
        }
      ]
    },
    {
      "name": "compoe_curso",
      "type": "identifying",
      "description": "Relacionamento Identificador: Curso composto por Módulos",
      "participants": [
        {
          "entity": "Curso",
          "cardinality": "1"
        },
        {
          "entity": "Modulo",
          "cardinality": "N"
        }
      ]
    },
    {
      "name": "compoe_modulo",
      "type": "identifying",
      "description": "Relacionamento Identificador: Módulo composto por Tópicos",
      "participants": [
        {
          "entity": "Modulo",
          "cardinality": "1"
        },
        {
          "entity": "Topico",
          "cardinality": "N"
        }
      ]
    }
  ]
}
  },

  "CloudManager - Versão Simplificada": {
    id: "CloudManager - Versão Simplificada",
    title: "CloudManager - Versão Simplificada",
    fileName: "CloudManager - Versão Simplificada.json",
    badge: "Nouvem",
    category: "Cloud",
    icon: "☁️",
    description: "Modelo de infraestrutura em nuvem contendo Servidores, VMs, Clusters, Redes, Volumes e Containers.",
    tags: ["CloudManager - Versão Simplificada.json", "Nuvem", "Cloud", "Clusters"],
    stats: { entities: 8, relationships: 3, specializations: 2 },
    data: {
  "entities": [
    {
      "id": "entity_41d05c56",
      "name": "FATURA",
      "type": "entity",
      "isWeak": true,
      "x": 0,
      "y": 80,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_4f90fce2",
      "name": "CLIENTE",
      "type": "entity",
      "isWeak": false,
      "x": 420,
      "y": 80,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_d6ec08e2",
      "name": "PESSOAFISICA",
      "type": "entity",
      "isWeak": false,
      "x": 190,
      "y": -190,
      "width": 150,
      "height": 50
    },
    {
      "id": "entity_2de5d783",
      "name": "PESSOAJURIDICA",
      "type": "entity",
      "isWeak": false,
      "x": 650,
      "y": -190,
      "width": 170,
      "height": 50
    },
    {
      "id": "entity_708ce4a8",
      "name": "PROJETO",
      "type": "entity",
      "isWeak": false,
      "x": 220,
      "y": 400,
      "width": 120,
      "height": 50
    },
    {
      "id": "entity_3afd00aa",
      "name": "RECURSOCLOUD",
      "type": "entity",
      "isWeak": false,
      "x": -80,
      "y": 220,
      "width": 150,
      "height": 50
    },
    {
      "id": "entity_bd26e3c4",
      "name": "SERVIDORJOGO",
      "type": "entity",
      "isWeak": false,
      "x": -240,
      "y": 390,
      "width": 150,
      "height": 50
    },
    {
      "id": "entity_abe410de",
      "name": "BANCODEDADOS",
      "type": "entity",
      "isWeak": false,
      "x": -80,
      "y": 520,
      "width": 150,
      "height": 50
    }
  ],
  "attributes": [
    {
      "id": "attr_6452793a",
      "name": "NumFatura",
      "type": "attribute",
      "parentId": "entity_41d05c56",
      "isKey": false,
      "isPartialKey": true,
      "isMultivalued": false,
      "isDerived": false,
      "x": -100,
      "y": 20,
      "width": 96,
      "height": 40
    },
    {
      "id": "attr_0055e91e",
      "name": "ValorTotal",
      "type": "attribute",
      "parentId": "entity_41d05c56",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": -140,
      "y": 120,
      "width": 104,
      "height": 40
    },
    {
      "id": "attr_cebf319f",
      "name": "ID_Cliente",
      "type": "attribute",
      "parentId": "entity_4f90fce2",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 320,
      "y": -60,
      "width": 104,
      "height": 40
    },
    {
      "id": "attr_9bb496af",
      "name": "Email",
      "type": "attribute",
      "parentId": "entity_4f90fce2",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 270,
      "y": 0,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_cf01a9ec",
      "name": "CPF",
      "type": "attribute",
      "parentId": "entity_d6ec08e2",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 0,
      "y": -180,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_0f7afcd3",
      "name": "CNPJ",
      "type": "attribute",
      "parentId": "entity_2de5d783",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 820,
      "y": -260,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_aa3f4ed2",
      "name": "ID_Projeto",
      "type": "attribute",
      "parentId": "entity_708ce4a8",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 50,
      "y": 400,
      "width": 104,
      "height": 40
    },
    {
      "id": "attr_98b87f78",
      "name": "Nome",
      "type": "attribute",
      "parentId": "entity_708ce4a8",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 290,
      "y": 560,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_3b171c14",
      "name": "CodRecurso",
      "type": "attribute",
      "parentId": "entity_3afd00aa",
      "isKey": true,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": -320,
      "y": 200,
      "width": 104,
      "height": 40
    },
    {
      "id": "attr_3b3352aa",
      "name": "Tags",
      "type": "attribute",
      "parentId": "entity_3afd00aa",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": true,
      "isDerived": false,
      "x": -310,
      "y": 260,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_8a68b59a",
      "name": "EngineJogo",
      "type": "attribute",
      "parentId": "entity_bd26e3c4",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": -290,
      "y": 490,
      "width": 104,
      "height": 40
    },
    {
      "id": "attr_c281a005",
      "name": "TipoSGBD",
      "type": "attribute",
      "parentId": "entity_abe410de",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 30,
      "y": 620,
      "width": 90,
      "height": 40
    },
    {
      "id": "attr_bb013e5b",
      "name": "DataDeploy",
      "type": "attribute",
      "parentId": "rel_4e208955",
      "isKey": false,
      "isPartialKey": false,
      "isMultivalued": false,
      "isDerived": false,
      "x": 370,
      "y": 290,
      "width": 104,
      "height": 40
    }
  ],
  "relationships": [
    {
      "id": "rel_f8821b8c",
      "name": "INDICA",
      "type": "relationship",
      "isWeak": false,
      "x": 610,
      "y": 200,
      "width": 110,
      "height": 65
    },
    {
      "id": "rel_3729a8d9",
      "name": "GERA_COBRANCA",
      "type": "relationship",
      "isWeak": true,
      "x": 220,
      "y": 80,
      "width": 170,
      "height": 65
    },
    {
      "id": "rel_4e208955",
      "name": "DEPLOY_INFRA",
      "type": "relationship",
      "isWeak": false,
      "x": 210,
      "y": 220,
      "width": 160,
      "height": 65
    }
  ],
  "specializations": [
    {
      "id": "spec_25947dce",
      "name": "O",
      "type": "specialization",
      "specType": "o",
      "isTotal": false,
      "definingAttribute": "",
      "superEntityId": "entity_4f90fce2",
      "subEntityIds": [
        "entity_d6ec08e2",
        "entity_2de5d783"
      ],
      "x": 420,
      "y": -190,
      "width": 36,
      "height": 36
    },
    {
      "id": "spec_de81eff0",
      "name": "O",
      "type": "specialization",
      "specType": "o",
      "isTotal": false,
      "definingAttribute": "",
      "superEntityId": "entity_3afd00aa",
      "subEntityIds": [
        "entity_bd26e3c4",
        "entity_abe410de"
      ],
      "x": -80,
      "y": 390,
      "width": 36,
      "height": 36
    }
  ],
  "connections": [
    {
      "id": "conn_fe0ff677",
      "sourceId": "attr_6452793a",
      "targetId": "entity_41d05c56",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_56e81018",
      "sourceId": "attr_0055e91e",
      "targetId": "entity_41d05c56",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_dfe06ff6",
      "sourceId": "attr_cebf319f",
      "targetId": "entity_4f90fce2",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_f5166283",
      "sourceId": "attr_9bb496af",
      "targetId": "entity_4f90fce2",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_ad81be07",
      "sourceId": "attr_cf01a9ec",
      "targetId": "entity_d6ec08e2",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_6c11b3d6",
      "sourceId": "attr_0f7afcd3",
      "targetId": "entity_2de5d783",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_19e5c800",
      "sourceId": "attr_aa3f4ed2",
      "targetId": "entity_708ce4a8",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_b8c8e71f",
      "sourceId": "attr_98b87f78",
      "targetId": "entity_708ce4a8",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_27553666",
      "sourceId": "attr_3b171c14",
      "targetId": "entity_3afd00aa",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_21b850b9",
      "sourceId": "attr_3b3352aa",
      "targetId": "entity_3afd00aa",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_653ce1c0",
      "sourceId": "attr_8a68b59a",
      "targetId": "entity_bd26e3c4",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_35d7a969",
      "sourceId": "attr_c281a005",
      "targetId": "entity_abe410de",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_ed8314e4",
      "sourceId": "rel_f8821b8c",
      "targetId": "entity_4f90fce2",
      "cardinalitySource": "",
      "cardinalityTarget": "1",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "Patrocinador",
      "faceSource": "north",
      "faceTarget": "east"
    },
    {
      "id": "conn_2c9c978a",
      "sourceId": "rel_f8821b8c",
      "targetId": "entity_4f90fce2",
      "cardinalitySource": "",
      "cardinalityTarget": "N",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "Indicado",
      "faceSource": "west",
      "faceTarget": "auto",
      "midOffset": 0.95
    },
    {
      "id": "conn_456235ed",
      "sourceId": "rel_3729a8d9",
      "targetId": "entity_41d05c56",
      "cardinalitySource": "",
      "cardinalityTarget": "N",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_bf114c67",
      "sourceId": "rel_3729a8d9",
      "targetId": "entity_4f90fce2",
      "cardinalitySource": "",
      "cardinalityTarget": "1",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_4603330b",
      "sourceId": "attr_bb013e5b",
      "targetId": "rel_4e208955",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_5889898f",
      "sourceId": "rel_4e208955",
      "targetId": "entity_4f90fce2",
      "cardinalitySource": "",
      "cardinalityTarget": "M",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_7788d74a",
      "sourceId": "rel_4e208955",
      "targetId": "entity_708ce4a8",
      "cardinalitySource": "",
      "cardinalityTarget": "N",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_7d01e470",
      "sourceId": "rel_4e208955",
      "targetId": "entity_3afd00aa",
      "cardinalitySource": "",
      "cardinalityTarget": "P",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_e066792d",
      "sourceId": "entity_4f90fce2",
      "targetId": "spec_25947dce",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_205c436d",
      "sourceId": "spec_25947dce",
      "targetId": "entity_d6ec08e2",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_6449dceb",
      "sourceId": "spec_25947dce",
      "targetId": "entity_2de5d783",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_d580e118",
      "sourceId": "entity_3afd00aa",
      "targetId": "spec_de81eff0",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_44be1e3c",
      "sourceId": "spec_de81eff0",
      "targetId": "entity_bd26e3c4",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    },
    {
      "id": "conn_bbe1fc3d",
      "sourceId": "spec_de81eff0",
      "targetId": "entity_abe410de",
      "cardinalitySource": "",
      "cardinalityTarget": "",
      "isTotalSource": false,
      "isTotalTarget": false,
      "isTotal": false,
      "roleSource": "",
      "roleTarget": "",
      "faceSource": "auto",
      "faceTarget": "auto"
    }
  ]
}
  }
};

// Renderizar Galeria de Modelos no Modal
function renderPresetGallery(filterText = '') {
  const container = document.getElementById('preset-grid-container');
  if (!container) return;

  const query = filterText.toLowerCase().trim();
  const keys = Object.keys(DERPresets);

  let html = '';
  keys.forEach(key => {
    const preset = DERPresets[key];
    const matchText = (preset.title + ' ' + preset.fileName + ' ' + preset.description + ' ' + (preset.tags || []).join(' ')).toLowerCase();
    
    if (query && !matchText.includes(query)) {
      return;
    }

    const tagsHtml = (preset.tags || []).map(t => 
      `<span style="display:inline-block; background:rgba(147,51,234,0.15); color:#c084fc; border:1px solid rgba(147,51,234,0.3); border-radius:4px; padding:2px 6px; font-size:10px; font-weight:600; margin-right:4px; margin-bottom:4px;">${t}</span>`
    ).join('');

    const stats = preset.stats || {};
    const entCount = stats.entities !== undefined ? stats.entities : (preset.data?.entities?.length || 0);
    const relCount = stats.relationships !== undefined ? stats.relationships : (preset.data?.relationships?.length || 0);
    const specCount = stats.specializations !== undefined ? stats.specializations : (preset.data?.specializations?.length || 0);

    // Escape single quotes for HTML inline handler
    const safeKey = key.replace(/'/g, "\\'");

    html += `
      <div class="preset-card-gallery" onclick="window.loadPreset('${safeKey}')" style="background: rgba(15, 23, 42, 0.85); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: space-between;" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none'">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span style="font-size: 24px; line-height: 1;">${preset.icon || '📊'}</span>
            <span style="background: rgba(37, 99, 235, 0.2); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.4); border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: 700;">${preset.fileName}</span>
          </div>

          <h4 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-family: var(--font-mono);">${preset.title}.json</h4>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${preset.description}</p>
        </div>

        <div>
          <div style="margin-bottom: 10px;">
            ${tagsHtml}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 6px;">
            <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-dim);">
              <span>📦 <strong>${entCount}</strong> Entidades</span>
              <span>🔗 <strong>${relCount}</strong> Relac.</span>
              ${specCount > 0 ? `<span style="color:#c084fc;">🧬 <strong>${specCount}</strong> EER</span>` : ''}
            </div>

            <button class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px; font-weight: 600;">▶ Carregar</button>
          </div>
        </div>
      </div>
    `;
  });

  if (!html) {
    html = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Nenhum arquivo JSON encontrado para "<strong>${filterText}</strong>".</div>`;
  }

  container.innerHTML = html;
}
