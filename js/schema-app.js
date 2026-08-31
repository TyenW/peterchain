/**
 * DER Builder — SchemaApp (Inicializador da Página de Esquema Relacional Lógico schema.html)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar DiagramModel
  const model = new DiagramModel();

  // Carregar Rascunho Automático de localStorage ou Modelo Padrão
  const autoDraft = localStorage.getItem('peterchain_auto_draft');
  if (autoDraft) {
    try {
      const data = JSON.parse(autoDraft);
      model.fromJSON(data);
    } catch (e) {
      console.error('Erro ao carregar rascunho:', e);
      if (model.loadDefaultPreset) model.loadDefaultPreset();
    }
  } else {
    if (model.loadDefaultPreset) model.loadDefaultPreset();
  }

  // Restaurar Título do Projeto
  const savedTitle = localStorage.getItem('peterchain_project_title');
  const titleInput = document.getElementById('project-title-input');
  if (titleInput && savedTitle) {
    titleInput.value = savedTitle;
  }

  // Instanciar Mapeador, Canvas e Gerador SQL
  const mapper = new RelationalMapper(model);
  const canvas = new RelationalCanvas('relational-canvas-area', 'der-canvas');
  
  let currentRelationalData = { tables: [], fkReferences: [] };
  let currentDialect = 'postgres';

  function refreshSchema() {
    currentRelationalData = mapper.mapToRelationalSchema();
    canvas.setData(currentRelationalData.tables, currentRelationalData.fkReferences);
    updateSQLOutput();
  }

  function updateSQLOutput() {
    const sqlCodeArea = document.getElementById('sql-ddl-output');
    if (sqlCodeArea) {
      const sql = SQLGenerator.generateDDL(canvas.tables, canvas.fkReferences, currentDialect);
      sqlCodeArea.textContent = sql;
    }
  }

  // Atualizar DDL quando o esquema muda manualmente no canvas
  canvas.onSchemaChange = () => {
    updateSQLOutput();
  };

  // 2. Controlar Abas da Sidebar Esquerda (Mapeamento / Script SQL)
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-muted)';
        b.style.borderBottom = 'none';
      });
      tabPanes.forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      btn.style.color = 'var(--accent)';
      btn.style.borderBottom = '2px solid var(--accent)';
      const pane = document.getElementById(`tab-pane-${tabId}`);
      if (pane) pane.style.display = 'flex';
    });
  });

  // 2b. Selecao de Dialetos SQL
  const dialectButtons = document.querySelectorAll('.dialect-btn');
  const dialectIndicator = document.getElementById('dialect-indicator-label');
  const dialectLabels = {
    postgres: 'PostgreSQL (ANSI)',
    mysql: 'MySQL / MariaDB',
    sqlite: 'SQLite 3',
    sqlserver: 'SQL Server (T-SQL)'
  };

  dialectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dialectButtons.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'none';
        b.style.color = 'var(--text-muted)';
      });
      btn.classList.add('active');
      btn.style.background = 'rgba(0,240,255,0.15)';
      btn.style.color = 'var(--accent)';
      currentDialect = btn.getAttribute('data-dialect') || 'postgres';
      if (dialectIndicator) dialectIndicator.textContent = dialectLabels[currentDialect] || currentDialect.toUpperCase();
      updateSQLOutput();
    });
  });

  // 2c. Filtro Interativo de Regras Formais
  const ruleCards = document.querySelectorAll('.rule-card');
  const btnResetRuleFilter = document.getElementById('btn-reset-rule-filter');

  ruleCards.forEach(card => {
    card.addEventListener('click', () => {
      const rule = card.getAttribute('data-rule');
      ruleCards.forEach(c => {
        c.style.borderColor = 'rgba(0,240,255,0.2)';
        c.style.background = 'rgba(8,13,26,0.6)';
      });
      card.style.borderColor = 'var(--accent)';
      card.style.background = 'rgba(0,240,255,0.1)';
      canvas.highlightByRule(rule);
    });
  });

  if (btnResetRuleFilter) {
    btnResetRuleFilter.addEventListener('click', () => {
      ruleCards.forEach(c => {
        c.style.borderColor = 'rgba(0,240,255,0.2)';
        c.style.background = 'rgba(8,13,26,0.6)';
      });
      canvas.resetHighlighting();
    });
  }

  // 3. Botao Copiar SQL e Baixar .sql
  const btnCopySQL = document.getElementById('btn-copy-sql');
  if (btnCopySQL) {
    btnCopySQL.addEventListener('click', () => {
      const sqlCodeArea = document.getElementById('sql-ddl-output');
      if (sqlCodeArea && sqlCodeArea.textContent) {
        navigator.clipboard.writeText(sqlCodeArea.textContent).then(() => {
          if (window.showToast) window.showToast('Script DDL SQL copiado para a area de transferencia!', 'success');
          else alert('SQL Copiado!');
        }).catch(err => {
          console.error('Erro ao copiar:', err);
        });
      }
    });
  }

  const btnDownloadSQL = document.getElementById('btn-download-sql');
  if (btnDownloadSQL) {
    btnDownloadSQL.addEventListener('click', () => {
      const sqlCodeArea = document.getElementById('sql-ddl-output');
      if (sqlCodeArea && sqlCodeArea.textContent) {
        const projName = (titleInput?.value || 'schema').toLowerCase().replace(/\s+/g, '_');
        const blob = new Blob([sqlCodeArea.textContent], { type: 'text/sql;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${projName}_${currentDialect}.sql`;
        link.click();
        URL.revokeObjectURL(link.href);
        if (window.showToast) window.showToast(`Arquivo ${projName}_${currentDialect}.sql baixado!`, 'success');
      }
    });
  }

  // 4. Alternador de Modo: Automatico vs Edicao Manual (Logisim)
  const btnModeAuto = document.getElementById('btn-mode-auto');
  const btnModeManual = document.getElementById('btn-mode-manual');
  const manualToolsGroup = document.getElementById('manual-tools-group');

  if (btnModeAuto && btnModeManual) {
    btnModeAuto.addEventListener('click', () => {
      btnModeAuto.classList.add('active');
      btnModeAuto.style.background = 'rgba(0,240,255,0.15)';
      btnModeAuto.style.color = 'var(--accent)';
      
      btnModeManual.classList.remove('active');
      btnModeManual.style.background = 'none';
      btnModeManual.style.color = 'var(--text-muted)';
      
      if (manualToolsGroup) manualToolsGroup.style.display = 'none';
      canvas.setMode('auto');
      refreshSchema();
    });

    btnModeManual.addEventListener('click', () => {
      btnModeManual.classList.add('active');
      btnModeManual.style.background = 'rgba(0,240,255,0.15)';
      btnModeManual.style.color = 'var(--accent)';
      
      btnModeAuto.classList.remove('active');
      btnModeAuto.style.background = 'none';
      btnModeAuto.style.color = 'var(--text-muted)';
      
      if (manualToolsGroup) manualToolsGroup.style.display = 'flex';
      canvas.setMode('manual');
      if (window.showToast) window.showToast('Modo Edicao Manual ativado! Selecione Auto Celula ou Ponto a Ponto para desenhar.', 'info');
    });
  }

  // 4b. Alternador de Submodo: Auto Celula vs Ponto a Ponto
  const btnDrawDirect = document.getElementById('btn-draw-direct');
  const btnDrawFreeline = document.getElementById('btn-draw-freeline');

  if (btnDrawDirect && btnDrawFreeline) {
    btnDrawDirect.addEventListener('click', () => {
      btnDrawDirect.classList.add('active');
      btnDrawDirect.style.background = 'rgba(0,240,255,0.15)';
      btnDrawDirect.style.color = 'var(--accent)';

      btnDrawFreeline.classList.remove('active');
      btnDrawFreeline.style.background = 'none';
      btnDrawFreeline.style.color = 'var(--text-muted)';

      canvas.setDrawSubMode('cell');
      if (window.showToast) window.showToast('Modo Auto Celula: Clique na celula de origem e depois na de destino.', 'info');
    });

    btnDrawFreeline.addEventListener('click', () => {
      btnDrawFreeline.classList.add('active');
      btnDrawFreeline.style.background = 'rgba(0,240,255,0.15)';
      btnDrawFreeline.style.color = 'var(--accent)';

      btnDrawDirect.classList.remove('active');
      btnDrawDirect.style.background = 'none';
      btnDrawDirect.style.color = 'var(--text-muted)';

      canvas.setDrawSubMode('freeline');
      if (window.showToast) window.showToast('Modo Ponto a Ponto: Clique no canvas ou celula para posicionar vertices. Enter ou duplo clique conclui.', 'info');
    });
  }

  // 5. Paleta de Cores de Linha estilo Logisim
  const swatches = document.querySelectorAll('.color-swatch-picker .color-swatch');
  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const selectedColor = sw.getAttribute('data-color');
      canvas.setActiveColor(selectedColor);
      if (window.showToast) window.showToast(`Cor da linha ajustada para ${selectedColor}`, 'info');
    });
  });

  // 5b. Botao Limpar Tela
  const btnClearCanvas = document.getElementById('btn-clear-canvas');
  if (btnClearCanvas) {
    btnClearCanvas.addEventListener('click', () => {
      if (confirm('Deseja realmente limpar toda a tela e remover todas as tabelas e linhas?')) {
        canvas.clearAll();
        updateSQLOutput();
        if (window.showToast) window.showToast('Tela limpa com sucesso.', 'info');
      }
    });
  }

  // 6. Modal de Criar / Editar Tabela
  const modalEditor = document.getElementById('modal-table-editor');
  const btnAddTable = document.getElementById('btn-add-table');
  const btnCloseModal = document.getElementById('btn-close-table-modal');
  const btnCancelModal = document.getElementById('btn-cancel-table-modal');
  const btnSaveModal = document.getElementById('btn-save-table-modal');
  const btnAddColRow = document.getElementById('btn-add-col-row');
  const modalTblName = document.getElementById('modal-tbl-name');
  const colRowsList = document.getElementById('modal-col-rows-list');

  let editingTableName = null;

  function createColumnRowHtml(name = '', dataType = 'INT', isPk = false, isFk = false) {
    const row = document.createElement('div');
    row.className = 'col-edit-row';
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.alignItems = 'center';

    row.innerHTML = `
      <input type="text" class="col-name-input" placeholder="Nome Coluna" value="${name}" style="flex:1; background:rgba(4,7,17,0.8); border:1px solid rgba(0,240,255,0.3); border-radius:4px; padding:4px 8px; font-size:11px; color:var(--text-main);">
      <select class="col-type-select" style="background:rgba(4,7,17,0.8); border:1px solid rgba(0,240,255,0.3); border-radius:4px; padding:4px 6px; font-size:11px; color:var(--accent-light);">
        <option value="INT" ${dataType === 'INT' ? 'selected' : ''}>INT</option>
        <option value="VARCHAR(100)" ${dataType.includes('VARCHAR') ? 'selected' : ''}>VARCHAR</option>
        <option value="DATE" ${dataType === 'DATE' ? 'selected' : ''}>DATE</option>
        <option value="DECIMAL(10,2)" ${dataType.includes('DECIMAL') ? 'selected' : ''}>DECIMAL</option>
        <option value="BOOLEAN" ${dataType === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
      </select>
      <label style="font-size:10px; font-weight:700; color:#fde047; display:flex; align-items:center; gap:2px; cursor:pointer;" title="Chave Primaria">
        <input type="checkbox" class="col-pk-check" ${isPk ? 'checked' : ''}> PK
      </label>
      <label style="font-size:10px; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:2px; cursor:pointer;" title="Chave Estrangeira">
        <input type="checkbox" class="col-fk-check" ${isFk ? 'checked' : ''}> FK
      </label>
      <button type="button" class="btn-remove-col-row" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-size:14px; padding:0 4px;">✕</button>
    `;

    row.querySelector('.btn-remove-col-row').addEventListener('click', () => row.remove());
    return row;
  }

  function openTableModal(tblName = null) {
    editingTableName = tblName;
    colRowsList.innerHTML = '';

    if (tblName) {
      document.getElementById('modal-table-editor-title').textContent = `Editar Tabela: ${tblName}`;
      modalTblName.value = tblName;
      const tbl = canvas.tables.find(t => t.name === tblName);
      if (tbl && tbl.columns) {
        tbl.columns.forEach(c => {
          colRowsList.appendChild(createColumnRowHtml(c.name, c.dataType, c.isPk, c.isFk));
        });
      }
    } else {
      document.getElementById('modal-table-editor-title').textContent = 'Criar Nova Tabela Relacional';
      modalTblName.value = '';
      colRowsList.appendChild(createColumnRowHtml('id_tabela', 'INT', true, false));
      colRowsList.appendChild(createColumnRowHtml('nome', 'VARCHAR(100)', false, false));
    }

    modalEditor.style.display = 'flex';
  }

  window.openTableEditorModal = openTableModal;

  if (btnAddTable) btnAddTable.addEventListener('click', () => openTableModal(null));
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalEditor.style.display = 'none');
  if (btnCancelModal) btnCancelModal.addEventListener('click', () => modalEditor.style.display = 'none');
  if (btnAddColRow) btnAddColRow.addEventListener('click', () => colRowsList.appendChild(createColumnRowHtml()));

  if (btnSaveModal) {
    btnSaveModal.addEventListener('click', () => {
      const name = modalTblName.value.trim().toUpperCase();
      if (!name) {
        alert('Informe o nome da tabela!');
        return;
      }

      const rows = colRowsList.querySelectorAll('.col-edit-row');
      const columns = [];
      const pkColNames = [];

      rows.forEach(r => {
        const cName = r.querySelector('.col-name-input').value.trim();
        const cType = r.querySelector('.col-type-select').value;
        const isPk = r.querySelector('.col-pk-check').checked;
        const isFk = r.querySelector('.col-fk-check').checked;

        if (cName) {
          columns.push({ name: cName, dataType: cType, isPk, isFk, isNullable: !isPk });
          if (isPk) pkColNames.push(cName);
        }
      });

      if (columns.length === 0) {
        alert('Adicione pelo menos uma coluna!');
        return;
      }

      if (editingTableName) {
        // Atualizar tabela existente
        const tbl = canvas.tables.find(t => t.name === editingTableName);
        if (tbl) {
          tbl.name = name;
          tbl.columns = columns;
          tbl.pkColNames = pkColNames;
        }
      } else {
        // Adicionar nova tabela
        canvas.addCustomTable(name, columns);
      }

      canvas.render();
      updateSQLOutput();
      modalEditor.style.display = 'none';
      if (window.showToast) window.showToast(`Tabela "${name}" salva com sucesso!`, 'success');
    });
  }

  // 7. Auto-Layout, Fit View & Controles de Zoom
  const btnAutoLayout = document.getElementById('btn-auto-layout');
  if (btnAutoLayout) {
    btnAutoLayout.addEventListener('click', () => {
      canvas.autoLayoutTables();
      canvas.render();
      if (window.showToast) window.showToast('Organização automática de tabelas concluída!', 'info');
    });
  }

  const btnFitView = document.getElementById('btn-fit-view');
  if (btnFitView) {
    btnFitView.addEventListener('click', () => {
      canvas.fitToView();
      if (window.showToast) window.showToast('Visualização ajustada e centralizada!', 'info');
    });
  }

  const btnZoomIn = document.getElementById('btn-zoom-in');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => canvas.setScale(canvas.scale + 0.15));
  }

  const btnZoomOut = document.getElementById('btn-zoom-out');
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => canvas.setScale(canvas.scale - 0.15));
  }

  const btnZoomReset = document.getElementById('btn-zoom-reset');
  if (btnZoomReset) {
    btnZoomReset.addEventListener('click', () => {
      canvas.panX = 0;
      canvas.panY = 0;
      canvas.setScale(1.0);
    });
  }

  // 8. Botoes de Exportacao de Imagem com Cores Distintas por Linha
  const btnExportPNG = document.getElementById('btn-export-png');
  if (btnExportPNG) {
    btnExportPNG.addEventListener('click', () => {
      const projName = (titleInput?.value || 'projeto').toLowerCase().replace(/\s+/g, '_');
      canvas.exportPNG(`esquema_relacional_${projName}.png`, 2);
    });
  }

  const btnExportSVG = document.getElementById('btn-export-svg');
  if (btnExportSVG) {
    btnExportSVG.addEventListener('click', () => {
      const projName = (titleInput?.value || 'projeto').toLowerCase().replace(/\s+/g, '_');
      canvas.exportSVG(`esquema_relacional_${projName}.svg`);
    });
  }

  // Auto-Save do Titulo
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      localStorage.setItem('peterchain_project_title', titleInput.value.trim());
    });
  }

  // Renderizar Esquema Inicial e Enquadrar
  refreshSchema();
  setTimeout(() => {
    canvas.fitToView();
  }, 100);
});

