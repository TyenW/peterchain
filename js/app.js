// Global Cyber Toast Notification System (Replaces native browser alert/prompt)
window.showToast = function(msg, type = 'info') {
  let container = document.getElementById('cyber-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'cyber-toast-container';
    container.className = 'cyber-toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `cyber-toast ${type}`;
  let icon = '⚡';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '⚠️';
  
  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Instanciar Módulos Core
  const model = new DiagramModel();
  const controller = new CanvasController(model);
  window.appController = controller;
  controller.setRenderer(new ChenRenderer(model, controller.layers));
  const handler = new InteractionHandler(model, controller);
  const propertyEditor = new PropertyEditor(model, controller);
  window.appPropertyEditor = propertyEditor;
  const tabularManager = new TabularManager(model, 'visual-manager-container');
  window.tabularManager = tabularManager;
  const historyManager = new HistoryManager(model);
  const validator = new DERValidator(model);
  const storageManager = new StorageExportManager(model);
  window.appHistoryManager = historyManager;

  const projectTitleInput = document.getElementById('project-title-input');

  // Auto-Restaurar rascunho automático e título do projeto do localStorage
  try {
    const savedTitle = localStorage.getItem('peterchain_project_title');
    if (savedTitle && projectTitleInput) {
      projectTitleInput.value = savedTitle;
      model.title = savedTitle;
    }
    const savedDraft = localStorage.getItem('peterchain_auto_draft');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      if (parsed) {
        if (parsed.title && projectTitleInput && !savedTitle) {
          projectTitleInput.value = parsed.title;
          model.title = parsed.title;
        }
        if (parsed.entities?.length > 0 || parsed.relationships?.length > 0) {
          model.fromJSON(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('Não foi possível carregar o rascunho automático:', err);
  }

  // Evento de salvamento automático ao alterar o nome do projeto
  if (projectTitleInput) {
    const autoSaveTitle = () => {
      const newTitle = projectTitleInput.value.trim() || 'Sistema';
      model.title = newTitle;
      localStorage.setItem('peterchain_project_title', newTitle);
      try {
        const json = model.toJSON();
        json.title = newTitle;
        localStorage.setItem('peterchain_auto_draft', JSON.stringify(json));
      } catch (e) {}
      model.notify();
    };

    projectTitleInput.addEventListener('input', autoSaveTitle);
    projectTitleInput.addEventListener('change', autoSaveTitle);
    projectTitleInput.addEventListener('blur', autoSaveTitle);
  }

  // Mapeamento de Elementos da Interface DOM
  const nlpInput = document.getElementById('nlp-input');
  if (nlpInput && !nlpInput.value.trim()) {
    nlpInput.value = JSON.stringify(model.toJSON(), null, 2);
  }
  const btnGenerate = document.getElementById('btn-generate-diagram');
  const btnAppend = document.getElementById('btn-append-command');
  const btnClearText = document.getElementById('btn-clear-text');
  const terminalLog = document.getElementById('terminal-log');
  const parsedSummary = document.getElementById('parsed-summary');

  // 2. Função de Atualização de Logs no Terminal
  function renderTerminalLog(logEntries) {
    if (!terminalLog) return;
    terminalLog.innerHTML = '';
    logEntries.forEach(entry => {
      const div = document.createElement('div');
      div.className = `log-entry ${entry.type}`;
      div.textContent = `> [${entry.timestamp}] ${entry.msg}`;
      terminalLog.appendChild(div);
    });
    terminalLog.scrollTop = terminalLog.scrollHeight;
  }

  // 3. Sincronização JSON -> Modelo
  let isDiagramGenerated = false;

  function syncJSONToModel() {
    let text = nlpInput.value;
    if (!text.trim()) return;

    try {
      const parsedData = JSON.parse(text);
      model.fromJSON(parsedData);
      renderTerminalLog([{ msg: 'JSON carregado com sucesso.', type: 'success', timestamp: new Date().toLocaleTimeString() }]);
      isDiagramGenerated = true;
      setTimeout(() => controller.zoomToFit(), 50);
    } catch (e) {
      renderTerminalLog([{ msg: 'Erro de Sintaxe JSON: ' + e.message, type: 'error', timestamp: new Date().toLocaleTimeString() }]);
    }
  }

  // Quando clicar no botão sincronizar
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => syncJSONToModel());
  }

  // Limpar texto
  if (btnClearText) {
    btnClearText.addEventListener('click', () => {
      nlpInput.value = '{\n  "entities": [],\n  "attributes": [],\n  "relationships": [],\n  "connections": []\n}';
      syncJSONToModel();
      if (terminalLog) renderTerminalLog([{ msg: 'Editor limpo.', type: 'info', timestamp: new Date().toLocaleTimeString() }]);
    });
  }

  function syncJSONToModelSilently() {
    let text = nlpInput.value;
    if (!text.trim()) return;

    try {
      const parsedData = JSON.parse(text);
      model.fromJSON(parsedData);
      renderTerminalLog([{ msg: 'JSON sincronizado com sucesso.', type: 'success', timestamp: new Date().toLocaleTimeString() }]);
    } catch (e) {
      // Ignora erros sintáticos intermediários enquanto o usuário digita
    }
  }

  let isTypingJSON = false;
  nlpInput.addEventListener('focus', () => isTypingJSON = true);
  nlpInput.addEventListener('blur', () => isTypingJSON = false);

  nlpInput.addEventListener('input', () => syncJSONToModelSilently());
  nlpInput.addEventListener('paste', () => {
    setTimeout(() => syncJSONToModelSilently(), 20);
  });

  model.subscribe(() => {
    if (!isTypingJSON) {
      nlpInput.value = JSON.stringify(model.toJSON(), null, 2);
    }
    tabularManager.render();
    
    // Auto-salva rascunho automático continuamente
    try {
      localStorage.setItem('peterchain_auto_draft', JSON.stringify(model.toJSON()));
    } catch (e) {}
  });

  // Tab Switching Logic
  const tabJson = document.getElementById('tab-json');
  const tabVisual = document.getElementById('tab-visual');
  const panelJson = document.getElementById('panel-json');
  const panelVisual = document.getElementById('panel-visual');

  tabJson.addEventListener('click', () => {
    tabJson.classList.add('active');
    tabVisual.classList.remove('active');
    tabJson.style.borderBottomColor = 'var(--primary)';
    tabJson.style.color = 'var(--text-main)';
    tabVisual.style.borderBottomColor = 'transparent';
    tabVisual.style.color = 'var(--text-muted)';
    panelJson.style.display = 'flex';
    panelVisual.style.display = 'none';
  });

  tabVisual.addEventListener('click', () => {
    tabVisual.classList.add('active');
    tabJson.classList.remove('active');
    tabVisual.style.borderBottomColor = 'var(--primary)';
    tabVisual.style.color = 'var(--text-main)';
    tabJson.style.borderBottomColor = 'transparent';
    tabJson.style.color = 'var(--text-muted)';
    panelVisual.style.display = 'flex';
    panelJson.style.display = 'none';
    tabularManager.render(true);
  });

  // 4. Inicializar Tabular
  tabularManager.render();

  // 5. Conectar Validador de Regras e Barra de Status
  function updateValidationStatus() {
    const valResult = validator.validate();
    const statusBox = document.getElementById('validation-status');
    const indicator = statusBox.querySelector('.status-indicator');
    const statusText = document.getElementById('status-text');

    indicator.className = `status-indicator ${valResult.status}`;
    statusText.textContent = valResult.statusText;

    // Atualizar Drawer de Validação
    const valList = document.getElementById('validation-list');
    valList.innerHTML = '';
    const invalidIds = new Set();

    valResult.issues.forEach(issue => {
      if (issue.elementId && (issue.type === 'error' || issue.type === 'warning')) {
        invalidIds.add(issue.elementId);
      }
      const div = document.createElement('div');
      div.className = `val-item ${issue.type}`;
      div.textContent = issue.message;
      valList.appendChild(div);
    });

    // Repassar ids inválidos ao modelo para pintar no Canvas
    model.invalidIds = invalidIds;
    
    // Atualiza a renderização apenas se o controller já estiver inicializado
    if (typeof controller !== 'undefined' && controller.render) {
      controller.render();
    }
  }

  model.subscribe(() => updateValidationStatus());
  updateValidationStatus();

  // Toggle Drawer de Validação
  const btnToggleVal = document.getElementById('btn-toggle-validator');
  const valDrawer = document.getElementById('validation-drawer');
  btnToggleVal.addEventListener('click', () => valDrawer.classList.toggle('hidden'));
  document.getElementById('btn-close-validation').addEventListener('click', () => valDrawer.classList.add('hidden'));

  // 6. Botões da Toolbar
  const notationSelector = document.getElementById('notation-selector');
  if (notationSelector) {
    notationSelector.addEventListener('change', (e) => {
      const notation = e.target.value;
      if (notation === 'chen') {
        controller.setRenderer(new ChenRenderer(model, controller.layers));
      }
      renderTerminalLog([{ msg: `Notação alterada para: ${notation}`, type: 'info', timestamp: new Date().toLocaleTimeString() }]);
    });
  }

  const btnSelect = document.getElementById('tool-select');
  if (btnSelect) btnSelect.addEventListener('click', () => handler.setTool('select'));
  const btnEntity = document.getElementById('tool-entity');
  if (btnEntity) btnEntity.addEventListener('click', () => handler.setTool('entity'));
  const btnAttr = document.getElementById('tool-attribute');
  if (btnAttr) btnAttr.addEventListener('click', () => handler.setTool('attribute'));
  const btnRel = document.getElementById('tool-relationship');
  if (btnRel) btnRel.addEventListener('click', () => handler.setTool('relationship'));
  const btnConnect = document.getElementById('tool-connect');
  if (btnConnect) btnConnect.addEventListener('click', () => handler.setTool('connect'));
  document.getElementById('tool-delete').addEventListener('click', () => {
    if (controller.selectedElementId) {
      model.removeElement(controller.selectedElementId);
      controller.clearSelection();
    } else if (controller.selectedConnectionId) {
      model.removeConnection(controller.selectedConnectionId);
      controller.clearSelection();
    }
  });

  document.getElementById('btn-undo').addEventListener('click', () => historyManager.undo());
  document.getElementById('btn-redo').addEventListener('click', () => historyManager.redo());
  document.getElementById('btn-zoom-in').addEventListener('click', () => controller.setZoom(controller.zoomScale * 1.2));
  document.getElementById('btn-zoom-out').addEventListener('click', () => controller.setZoom(controller.zoomScale / 1.2));
  document.getElementById('btn-zoom-reset').addEventListener('click', () => controller.resetZoomAndPan());
  document.getElementById('btn-auto-layout').addEventListener('click', () => model.autoLayout());
  document.getElementById('btn-clear-canvas').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todo o diagrama?')) {
      model.clear();
      try { localStorage.removeItem('peterchain_auto_draft'); } catch(e){}
      controller.clearSelection();
      if (window.showToast) window.showToast('Diagrama limpo com sucesso.', 'info');
    }
  });

  // 7. Header Actions (Novo, Salvar, Abrir, Presets, Exportar)
  document.getElementById('btn-new-diagram').addEventListener('click', () => {
    if (confirm('Criar um novo diagrama em branco?')) {
      model.clear();
      try { localStorage.removeItem('peterchain_auto_draft'); } catch(e){}
      nlpInput.value = '';
      projectTitleInput.value = 'Novo Diagrama';
      renderTerminalLog([{ msg: 'Novo diagrama iniciado.', type: 'info', timestamp: new Date().toLocaleTimeString() }]);
      if (window.showToast) window.showToast('Novo diagrama em branco iniciado.', 'info');
    }
  });

  document.getElementById('btn-save-local').addEventListener('click', () => {
    const title = projectTitleInput.value.trim() || 'Sistema Acadêmico';
    const saved = storageManager.saveProject(title);
    if (saved) {
      if (window.showToast) {
        window.showToast(`Projeto "${title}" salvo com sucesso!`, 'success');
      }
    }
  });

  // Dropdown Exportar
  // Dropdown Exportar (Legado - Mantido com proteção caso volte)
  const btnExportDropdown = document.getElementById('btn-export-dropdown');
  const exportMenu = document.getElementById('export-menu');
  if (btnExportDropdown && exportMenu) {
    btnExportDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => exportMenu.classList.remove('show'));
  }

  // Validate before export
  function checkExportValidation() {
    if (window.menuManager) window.menuManager.closeAllMenus();
    const valResult = validator.validate();
    const errors = valResult.issues.filter(i => i.type === 'error');
    if (errors.length > 0) {
      if (window.tabularManager) {
        const errorList = errors.map(e => `• ${e.message}`).join('\n\n');
        window.tabularManager.openModal('Exportação Bloqueada', [
          { type: 'message', label: 'Não é possível exportar o diagrama pois ele possui erros estruturais críticos:', value: errorList }
        ], () => {});
      } else {
        alert('Não é possível exportar: O diagrama possui erros estruturais críticos.');
      }
      return false;
    }
    return true;
  }

  const getFormattedFilename = (ext, suffix = '') => {
    const raw = (projectTitleInput.value.trim() || 'Projeto').replace(/\s+/g, '_').toLowerCase();
    const clean = raw.startsWith('der_') ? raw : `der_${raw}`;
    return `${clean}${suffix}.${ext}`;
  };

  document.getElementById('export-png').addEventListener('click', () => {
    if (!checkExportValidation()) return;
    storageManager.exportPNG(getFormattedFilename('png', '_pb'), { isColored: false, addLegend: false });
  });

  const exportPngColorBtn = document.getElementById('export-png-color');
  if (exportPngColorBtn) {
    exportPngColorBtn.addEventListener('click', () => {
      if (!checkExportValidation()) return;
      storageManager.exportPNG(getFormattedFilename('png', '_colorido'), { isColored: true, addLegend: true });
    });
  }

  document.getElementById('export-svg').addEventListener('click', () => {
    if (!checkExportValidation()) return;
    storageManager.exportSVG(getFormattedFilename('svg', '_pb'), { isColored: false, addLegend: false });
  });

  const exportSvgColorBtn = document.getElementById('export-svg-color');
  if (exportSvgColorBtn) {
    exportSvgColorBtn.addEventListener('click', () => {
      if (!checkExportValidation()) return;
      storageManager.exportSVG(getFormattedFilename('svg', '_colorido'), { isColored: true, addLegend: true });
    });
  }

  document.getElementById('export-json').addEventListener('click', () => {
    storageManager.exportJSON(getFormattedFilename('json'));
  });

  // Importar JSON
  const importBtn = document.getElementById('import-json-btn');
  const importFileInput = document.getElementById('import-json-file');
  importBtn.addEventListener('click', () => importFileInput.click());

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const success = storageManager.importJSON(evt.target.result);
        if (success) {
          alert('Diagrama JSON importado com sucesso!');
        } else {
          alert('Erro ao importar JSON. Verifique o formato do arquivo.');
        }
      };
      reader.readAsText(file);
    }
  });

  // Função Global de Carregamento de Modelos / Presets
  window.loadPreset = function(key) {
    const preset = DERPresets[key];
    if (!preset) return;

    const titleInput = document.getElementById('project-title-input');
    if (titleInput && preset.title) {
      titleInput.value = preset.title;
    }

    if (preset.data) {
      model.fromJSON(preset.data);
      nlpInput.value = JSON.stringify(model.toJSON(), null, 2);
    } else if (preset.text) {
      nlpInput.value = preset.text;
      try {
        const parsedData = JSON.parse(preset.text);
        model.fromJSON(parsedData);
      } catch (e) {}
    }

    tabularManager.render();
    setTimeout(() => controller.zoomToFit(), 100);

    const modalPresets = document.getElementById('modal-presets');
    if (modalPresets) modalPresets.classList.add('hidden');

    if (window.menuManager) {
      window.menuManager.closeAllMenus();
    }
  };

  // Modais (Presets / Galeria de Modelos)
  const modalPresets = document.getElementById('modal-presets');
  const btnPresetMenu = document.getElementById('btn-preset-menu');
  if (btnPresetMenu && modalPresets) {
    btnPresetMenu.addEventListener('click', () => {
      if (typeof renderPresetGallery === 'function') renderPresetGallery();
      modalPresets.classList.remove('hidden');
    });
  }
  const btnClosePresets = document.getElementById('btn-close-modal-presets');
  if (btnClosePresets && modalPresets) {
    btnClosePresets.addEventListener('click', () => modalPresets.classList.add('hidden'));
  }

  // Pesquisa na Galeria de Modelos
  const presetSearchInput = document.getElementById('preset-search-input');
  if (presetSearchInput) {
    presetSearchInput.addEventListener('input', (e) => {
      if (typeof renderPresetGallery === 'function') renderPresetGallery(e.target.value);
    });
  }

  // Modal de Guia de Comandos & Documentação JSON
  const modalCommands = document.getElementById('modal-commands');
  const btnCmdHelp = document.getElementById('btn-cmd-help');
  const btnCmdHelpNav = document.getElementById('btn-cmd-help-nav');
  const btnJsonDocNav = document.getElementById('btn-json-doc-nav');
  const tabHelpJsonBtn = document.getElementById('tab-help-json-btn');
  const tabHelpCmdBtn = document.getElementById('tab-help-cmd-btn');
  const helpPanelJson = document.getElementById('help-panel-json');
  const helpPanelCmd = document.getElementById('help-panel-cmd');

  function showHelpTab(tabName) {
    if (tabName === 'json') {
      if (helpPanelJson) helpPanelJson.classList.remove('hidden');
      if (helpPanelCmd) helpPanelCmd.classList.add('hidden');
      if (tabHelpJsonBtn) {
        tabHelpJsonBtn.classList.add('active');
        tabHelpJsonBtn.style.color = 'var(--accent-light)';
        tabHelpJsonBtn.style.borderBottomColor = 'var(--primary)';
      }
      if (tabHelpCmdBtn) {
        tabHelpCmdBtn.classList.remove('active');
        tabHelpCmdBtn.style.color = 'var(--text-muted)';
        tabHelpCmdBtn.style.borderBottomColor = 'transparent';
      }
    } else {
      if (helpPanelCmd) helpPanelCmd.classList.remove('hidden');
      if (helpPanelJson) helpPanelJson.classList.add('hidden');
      if (tabHelpCmdBtn) {
        tabHelpCmdBtn.classList.add('active');
        tabHelpCmdBtn.style.color = 'var(--accent-light)';
        tabHelpCmdBtn.style.borderBottomColor = 'var(--primary)';
      }
      if (tabHelpJsonBtn) {
        tabHelpJsonBtn.classList.remove('active');
        tabHelpJsonBtn.style.color = 'var(--text-muted)';
        tabHelpJsonBtn.style.borderBottomColor = 'transparent';
      }
    }
  }

  if (tabHelpJsonBtn) tabHelpJsonBtn.addEventListener('click', () => showHelpTab('json'));
  if (tabHelpCmdBtn) tabHelpCmdBtn.addEventListener('click', () => showHelpTab('cmd'));

  if (btnJsonDocNav && modalCommands) {
    btnJsonDocNav.addEventListener('click', () => {
      showHelpTab('json');
      modalCommands.classList.remove('hidden');
    });
  }
  if (btnCmdHelpNav && modalCommands) {
    btnCmdHelpNav.addEventListener('click', () => {
      showHelpTab('cmd');
      modalCommands.classList.remove('hidden');
    });
  }
  if (btnCmdHelp && modalCommands) {
    btnCmdHelp.addEventListener('click', () => {
      showHelpTab('json');
      modalCommands.classList.remove('hidden');
    });
  }
  const btnCloseModalCmds = document.getElementById('btn-close-modal-commands');
  if (btnCloseModalCmds && modalCommands) {
    btnCloseModalCmds.addEventListener('click', () => modalCommands.classList.add('hidden'));
  }

  // Copiar e Carregar trechos do Guia de Comandos
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = btn.getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = '✓ Copiado!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Erro ao copiar:', err);
        });
      }
    });
  });

  document.querySelectorAll('.btn-load-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = btn.getAttribute('data-code');
      if (code) {
        nlpInput.value = code;
        executeNLP(false);
        modalCommands.classList.add('hidden');
      }
    });
  });

  // Botões de Snippets / Auto-completar Rápidos
  document.querySelectorAll('.btn-insert-snippet').forEach(btn => {
    btn.addEventListener('click', () => {
      const rawSnippet = btn.getAttribute('data-snippet');
      if (!rawSnippet) return;

      const snippet = rawSnippet.replace(/\\n/g, '\n');
      const start = nlpInput.selectionStart;
      const end = nlpInput.selectionEnd;
      const text = nlpInput.value;

      let prefix = '';
      if (start > 0 && text[start - 1] !== '\n') {
        prefix = '\n\n';
      } else if (start === 0 && text.length > 0) {
        prefix = '';
      }

      const insertText = prefix + snippet + '\n';
      nlpInput.value = text.substring(0, start) + insertText + text.substring(end);
      nlpInput.focus();
      const newPos = start + insertText.length;
      nlpInput.setSelectionRange(newPos, newPos);
    });
  });

  const modalProjects = document.getElementById('modal-projects');
  const btnProjectsModal = document.getElementById('btn-projects-modal');
  btnProjectsModal.addEventListener('click', () => {
    renderSavedProjectsList();
    modalProjects.classList.remove('hidden');
  });
  document.getElementById('btn-close-modal-projects').addEventListener('click', () => modalProjects.classList.add('hidden'));

  function renderSavedProjectsList() {
    const listEl = document.getElementById('projects-list');
    const projects = storageManager.getProjects();
    listEl.innerHTML = '';

    if (projects.length === 0) {
      listEl.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center;">Nenhum diagrama salvo no navegador.</p>';
      return;
    }

    projects.forEach(proj => {
      const dateStr = new Date(proj.updatedAt).toLocaleString('pt-BR');
      const div = document.createElement('div');
      div.className = 'project-item';
      div.innerHTML = `
        <div>
          <div class="project-item-title">${proj.title}</div>
          <div class="project-item-date">Salvo em ${dateStr}</div>
        </div>
        <div class="project-item-actions">
          <button class="btn btn-secondary btn-load-proj" data-id="${proj.id}">Carregar</button>
          <button class="btn btn-secondary danger btn-del-proj" data-id="${proj.id}">Excluir</button>
        </div>
      `;
      listEl.appendChild(div);
    });

    document.querySelectorAll('.btn-load-proj').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const proj = storageManager.loadProject(id);
        if (proj) {
          projectTitleInput.value = proj.title;
          modalProjects.classList.add('hidden');
        }
      });
    });

    document.querySelectorAll('.btn-del-proj').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja excluir este diagrama salvo?')) {
          storageManager.deleteProject(id);
          renderSavedProjectsList();
        }
      });
    });
  }

  // 8. Resizer de Painéis Split Screen (Arrastar divisor)
  const resizer = document.getElementById('panel-resizer');
  const nlpPanel = document.getElementById('nlp-panel');
  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(650, e.clientX));
    nlpPanel.style.width = `${newWidth}px`;
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      resizer.classList.remove('active');
      document.body.style.cursor = 'default';
    }
  });

  // 9. Atalhos Globais de Salvamento (Ctrl + S) e Alternância de Painel (Ctrl + B)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const title = projectTitleInput.value.trim() || 'Sistema Acadêmico';
      storageManager.saveProject(title);
      alert(`Projeto "${title}" salvo!`);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      if (nlpPanel.classList.contains('collapsed')) {
        expandLeftPanel();
      } else {
        collapseLeftPanel();
      }
    }
  });

  // 10. Lógica de Painel Lateral e Barra de Ferramentas Retráteis (Animadas)
  const btnToggleLeftPanel = document.getElementById('btn-toggle-left-panel');
  const btnReopenLeftPanel = document.getElementById('btn-reopen-left-panel');

  let savedPanelWidth = '380px';

  function collapseLeftPanel() {
    if (!nlpPanel) return;
    savedPanelWidth = nlpPanel.style.width || '380px';
    nlpPanel.classList.add('collapsed');
    if (resizer) resizer.style.display = 'none';
    if (btnReopenLeftPanel) btnReopenLeftPanel.classList.remove('hidden');
  }

  function expandLeftPanel() {
    if (!nlpPanel) return;
    nlpPanel.classList.remove('collapsed');
    nlpPanel.style.width = savedPanelWidth;
    if (resizer) resizer.style.display = 'block';
    if (btnReopenLeftPanel) btnReopenLeftPanel.classList.add('hidden');
  }

  if (btnToggleLeftPanel) {
    btnToggleLeftPanel.addEventListener('click', collapseLeftPanel);
  }
  if (btnReopenLeftPanel) {
    btnReopenLeftPanel.addEventListener('click', expandLeftPanel);
  }

  const canvasToolbar = document.getElementById('canvas-toolbar');
  const btnToggleToolbar = document.getElementById('btn-toggle-toolbar');

  function toggleToolbar() {
    if (!canvasToolbar) return;
    const isCollapsed = canvasToolbar.classList.toggle('collapsed');
    if (btnToggleToolbar) {
      btnToggleToolbar.setAttribute('title', isCollapsed ? 'Expandir Barra de Ferramentas' : 'Recolher Barra de Ferramentas');
    }
  }

  if (btnToggleToolbar) {
    btnToggleToolbar.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleToolbar();
    });
  }

  if (canvasToolbar) {
    canvasToolbar.addEventListener('click', (e) => {
      if (canvasToolbar.classList.contains('collapsed')) {
        toggleToolbar();
      }
    });
  }
});
