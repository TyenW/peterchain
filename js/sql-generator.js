/**
 * DER Builder — SQLGenerator (Gerador de Script DDL SQL Multi-Dialetos)
 * Converte o Esquema Relacional em instrucoes DDL compativeis com PostgreSQL, MySQL, SQLite e SQL Server.
 */
class SQLGenerator {
  static mapDataType(type, dialect) {
    const t = (type || 'VARCHAR').toUpperCase();
    
    if (dialect === 'mysql') {
      if (t.includes('INT') || t === 'SERIAL') return 'INT';
      if (t.includes('FLOAT') || t.includes('DOUBLE')) return 'DECIMAL(10,2)';
      if (t.includes('BOOL')) return 'TINYINT(1)';
      if (t.includes('DATE') || t.includes('TIME')) return 'DATETIME';
      if (t.includes('TEXT')) return 'TEXT';
      return t.includes('VARCHAR') ? t : 'VARCHAR(255)';
    }
    
    if (dialect === 'sqlite') {
      if (t.includes('INT') || t === 'SERIAL') return 'INTEGER';
      if (t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('NUMERIC')) return 'REAL';
      if (t.includes('BOOL')) return 'INTEGER';
      if (t.includes('DATE') || t.includes('TIME')) return 'TEXT';
      return 'TEXT';
    }

    if (dialect === 'sqlserver') {
      if (t.includes('INT') || t === 'SERIAL') return 'INT';
      if (t.includes('FLOAT') || t.includes('DOUBLE')) return 'DECIMAL(18,2)';
      if (t.includes('BOOL')) return 'BIT';
      if (t.includes('DATE') || t.includes('TIME')) return 'DATETIME2';
      if (t.includes('TEXT')) return 'NVARCHAR(MAX)';
      return t.includes('VARCHAR') ? t.replace('VARCHAR', 'NVARCHAR') : 'NVARCHAR(255)';
    }

    // Default: PostgreSQL
    if (t === 'SERIAL' || t === 'BIGSERIAL') return t;
    if (t.includes('INT')) return 'INTEGER';
    if (t.includes('FLOAT') || t.includes('DOUBLE')) return 'NUMERIC(10,2)';
    if (t.includes('BOOL')) return 'BOOLEAN';
    if (t.includes('TIME')) return 'TIMESTAMPTZ';
    if (t.includes('DATE')) return 'DATE';
    if (t.includes('TEXT')) return 'TEXT';
    return t.includes('VARCHAR') ? t : 'VARCHAR(255)';
  }

  static generateDDL(tables, fkReferences, dialect = 'postgres') {
    if (!tables || tables.length === 0) {
      return '-- Nenhum elemento encontrado no esquema relacional.\n-- Crie entidades e relacionamentos no diagrama para gerar o DDL SQL.';
    }

    const dUpper = (dialect || 'postgres').toLowerCase();
    const dialectNames = {
      postgres: 'PostgreSQL (ANSI SQL)',
      mysql: 'MySQL / MariaDB',
      sqlite: 'SQLite 3',
      sqlserver: 'Microsoft SQL Server (T-SQL)'
    };

    let sql = `-- ==========================================================================\n`;
    sql += `-- SCRIPT DDL GERADO PELO PETERCHAIN DER BUILDER\n`;
    sql += `-- SGBD / Dialeto: ${dialectNames[dUpper] || 'PostgreSQL'}\n`;
    sql += `-- Modelo: Logico Relacional (Elmasri & Navathe)\n`;
    sql += `-- Gerado em: ${new Date().toLocaleString()}\n`;
    sql += `-- ==========================================================================\n\n`;

    if (dUpper === 'sqlite') {
      sql += `-- Ativar suporte a Chaves Estrangeiras no SQLite\nPRAGMA foreign_keys = ON;\n\n`;
    }

    // 1. Instrucoes CREATE TABLE
    tables.forEach(tbl => {
      sql += `CREATE TABLE ${tbl.name} (\n`;

      const colDefs = tbl.columns.map(col => {
        const mappedType = this.mapDataType(col.dataType, dUpper);
        let def = `  ${col.name} ${mappedType}`;
        if (!col.isNullable) def += ` NOT NULL`;
        return def;
      });

      // Constraint PRIMARY KEY
      if (tbl.pkColNames && tbl.pkColNames.length > 0) {
        if (dUpper === 'sqlite' && tbl.pkColNames.length === 1 && tbl.columns.some(c => c.name === tbl.pkColNames[0] && (c.dataType || '').toUpperCase().includes('INT'))) {
          // No SQLite single primary key integer
          colDefs.push(`  PRIMARY KEY (${tbl.pkColNames.join(', ')})`);
        } else {
          colDefs.push(`  CONSTRAINT pk_${tbl.name.toLowerCase()} PRIMARY KEY (${tbl.pkColNames.join(', ')})`);
        }
      }

      // SQLite foreign keys inside CREATE TABLE
      if (dUpper === 'sqlite' && fkReferences && fkReferences.length > 0) {
        const tblFks = fkReferences.filter(r => r.sourceTable === tbl.name);
        tblFks.forEach(ref => {
          colDefs.push(`  FOREIGN KEY (${ref.sourceCol}) REFERENCES ${ref.targetTable}(${ref.targetCol}) ON DELETE CASCADE ON UPDATE CASCADE`);
        });
      }

      sql += colDefs.join(',\n');
      
      if (dUpper === 'mysql') {
        sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
      } else {
        sql += `\n);\n\n`;
      }
    });

    // 2. Instrucoes ALTER TABLE ADD CONSTRAINT FOREIGN KEY (para postgres, mysql, sqlserver)
    if (dUpper !== 'sqlite' && fkReferences && fkReferences.length > 0) {
      sql += `-- ==========================================================================\n`;
      sql += `-- RESTRICOES DE CHAVE ESTRANGEIRA (FOREIGN KEYS)\n`;
      sql += `-- ==========================================================================\n\n`;

      fkReferences.forEach(ref => {
        const constraintName = `fk_${ref.sourceTable.toLowerCase()}_${ref.targetTable.toLowerCase()}_${ref.sourceCol.toLowerCase()}`;
        sql += `ALTER TABLE ${ref.sourceTable}\n`;
        sql += `  ADD CONSTRAINT ${constraintName}\n`;
        sql += `  FOREIGN KEY (${ref.sourceCol})\n`;
        sql += `  REFERENCES ${ref.targetTable} (${ref.targetCol})\n`;
        sql += `  ON DELETE CASCADE ON UPDATE CASCADE;\n\n`;
      });
    }

    return sql;
  }
}

if (typeof window !== 'undefined') {
  window.SQLGenerator = SQLGenerator;
}
