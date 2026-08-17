/**
 * DER Builder — Controlador Principal da Aplicação
 * Integração entre Modelo, Parser NLP, SVG Canvas, Histórico, Validação e Persistência
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Instanciar Módulos Core
  const model = new DiagramModel();
  const renderer = new CanvasRenderer(model);
  const handler = new InteractionHandler(model, renderer);
  const parser = new NLPParser(model);
  const historyManager = new HistoryManager(model);
  const validator = new DERValidator(model);
  const storageManager = new StorageExportManager(model);
  window.appHistoryManager = historyManager;

  // Mapeamento de Elementos da Interface DOM
  const nlpInput = document.getElementById('nlp-input');
  const btnGenerate = document.getElementById('btn-generate-diagram');
  const btnAppend = document.getElementById('btn-append-command');
  const btnClearText = document.getElementById('btn-clear-text');
  const terminalLog = document.getElementById('terminal-log');
  const parsedSummary = document.getElementById('parsed-summary');
  const projectTitleInput = document.getElementById('project-title-input');

  // 2. Função de Atualização de Logs no Terminal
  function renderTerminalLog(logEntries) {
    terminalLog.innerHTML = '';
    logEntries.forEach(entry => {
      const div = document.createElement('div');
      div.className = `log-entry ${entry.type}`;
      div.textContent = `> [${entry.timestamp}] ${entry.msg}`;
      terminalLog.appendChild(div);
    });
    terminalLog.scrollTop = terminalLog.scrollHeight;
  }

  // 3. Execução do Parser de Linguagem Natural & Modo SQL Console Incremental
  let isDiagramGenerated = false;

  function executeNLP(appendOnly = false) {
    let text = nlpInput.value;
    if (!text.trim()) return;

    // Se o texto for apenas uma linha de comando começando com '>', limpar o prefixo
    text = text.replace(/^>\s*/, '');

    const result = parser.parse(text, appendOnly);
    renderTerminalLog(result.log);
    
    if (parsedSummary && result.summary) {
      parsedSummary.textContent = result.summary;
    }

    if (!appendOnly) {
      setTimeout(() => renderer.zoomToFit(), 50);
      isDiagramGenerated = true;
    }
  }

  btnGenerate.addEventListener('click', () => executeNLP(false));
  btnAppend.addEventListener('click', () => executeNLP(true));

  btnClearText.addEventListener('click', () => {
    nlpInput.value = '';
    renderTerminalLog([{ msg: 'Terminal de console limpo.', type: 'info', timestamp: new Date().toLocaleTimeString() }]);
  });

  // Atalhos de teclado no Terminal:
  // Enter normal só executa se a linha começar com '>'; caso contrário insere quebra de linha normal.
  nlpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        executeNLP(false);
      } else if (!e.shiftKey) {
        const val = nlpInput.value.trim();
        if (val.startsWith('>')) {
          e.preventDefault();
          executeNLP(true);
        }
      }
    }
  });

  // 4. Carregar Preset Inicial (Modelo EER Estendido Completo)
  if (DERPresets && DERPresets.eer) {
    nlpInput.value = DERPresets.eer.text;
    executeNLP(false);
  } else if (DERPresets && DERPresets.academico) {
    nlpInput.value = DERPresets.academico.text;
    executeNLP(false);
  }

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
    valResult.issues.forEach(issue => {
      const div = document.createElement('div');
      div.className = `val-item ${issue.type}`;
      div.textContent = issue.message;
      valList.appendChild(div);
    });
  }

  model.subscribe(() => updateValidationStatus());
  updateValidationStatus();

  // Toggle Drawer de Validação
  const btnToggleVal = document.getElementById('btn-toggle-validator');
  const valDrawer = document.getElementById('validation-drawer');
  btnToggleVal.addEventListener('click', () => valDrawer.classList.toggle('hidden'));
  document.getElementById('btn-close-validation').addEventListener('click', () => valDrawer.classList.add('hidden'));

  // 6. Botões da Toolbar
  document.getElementById('tool-select').addEventListener('click', () => handler.setTool('select'));
  document.getElementById('tool-entity').addEventListener('click', () => handler.setTool('entity'));
  document.getElementById('tool-attribute').addEventListener('click', () => handler.setTool('attribute'));
  document.getElementById('tool-relationship').addEventListener('click', () => handler.setTool('relationship'));
  document.getElementById('tool-connect').addEventListener('click', () => handler.setTool('connect'));
  document.getElementById('tool-delete').addEventListener('click', () => {
    if (renderer.selectedElementId) {
      model.removeElement(renderer.selectedElementId);
      renderer.clearSelection();
    } else if (renderer.selectedConnectionId) {
      model.removeConnection(renderer.selectedConnectionId);
      renderer.clearSelection();
    }
  });

  document.getElementById('btn-undo').addEventListener('click', () => historyManager.undo());
  document.getElementById('btn-redo').addEventListener('click', () => historyManager.redo());
  document.getElementById('btn-zoom-in').addEventListener('click', () => renderer.setZoom(renderer.zoomScale * 1.2));
  document.getElementById('btn-zoom-out').addEventListener('click', () => renderer.setZoom(renderer.zoomScale / 1.2));
  document.getElementById('btn-zoom-reset').addEventListener('click', () => renderer.resetZoomAndPan());
  document.getElementById('btn-auto-layout').addEventListener('click', () => model.autoLayout());
  document.getElementById('btn-clear-canvas').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todo o diagrama?')) {
      model.clear();
      renderer.clearSelection();
    }
  });

  // 7. Header Actions (Novo, Salvar, Abrir, Presets, Exportar)
  document.getElementById('btn-new-diagram').addEventListener('click', () => {
    if (confirm('Criar um novo diagrama em branco?')) {
      model.clear();
      nlpInput.value = '';
      projectTitleInput.value = 'Novo Diagrama';
      renderTerminalLog([{ msg: 'Novo diagrama iniciado.', type: 'info', timestamp: new Date().toLocaleTimeString() }]);
    }
  });

  document.getElementById('btn-save-local').addEventListener('click', () => {
    const title = projectTitleInput.value.trim() || 'Sistema Acadêmico';
    const saved = storageManager.saveProject(title);
    if (saved) {
      alert(`Projeto "${title}" salvo com sucesso no navegador!`);
    }
  });

  // Dropdown Exportar
  const btnExportDropdown = document.getElementById('btn-export-dropdown');
  const exportMenu = document.getElementById('export-menu');
  btnExportDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => exportMenu.classList.remove('show'));

  document.getElementById('export-png').addEventListener('click', () => {
    const title = projectTitleInput.value.trim().toLowerCase().replace(/\s+/g, '_');
    storageManager.exportPNG(`${title}_der.png`);
  });

  document.getElementById('export-svg').addEventListener('click', () => {
    const title = projectTitleInput.value.trim().toLowerCase().replace(/\s+/g, '_');
    storageManager.exportSVG(`${title}_der.svg`);
  });

  document.getElementById('export-json').addEventListener('click', () => {
    const title = projectTitleInput.value.trim().toLowerCase().replace(/\s+/g, '_');
    storageManager.exportJSON(`${title}_der.json`);
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

  // Modais (Presets & Meus Diagramas)
  const modalPresets = document.getElementById('modal-presets');
  const btnPresetMenu = document.getElementById('btn-preset-menu');
  btnPresetMenu.addEventListener('click', () => modalPresets.classList.remove('hidden'));
  document.getElementById('btn-close-modal-presets').addEventListener('click', () => modalPresets.classList.add('hidden'));

  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-preset');
      if (DERPresets[key]) {
        projectTitleInput.value = DERPresets[key].title;
        nlpInput.value = DERPresets[key].text;
        executeNLP(false);
        modalPresets.classList.add('hidden');
      }
    });
  });

  // Modal de Guia de Comandos Suportados
  const modalCommands = document.getElementById('modal-commands');
  const btnCmdHelp = document.getElementById('btn-cmd-help');
  if (btnCmdHelp) {
    btnCmdHelp.addEventListener('click', () => modalCommands.classList.remove('hidden'));
  }
  document.getElementById('btn-close-modal-commands').addEventListener('click', () => modalCommands.classList.add('hidden'));

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

  // 9. Atalhos Globais de Salvamento (Ctrl + S)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      const title = projectTitleInput.value.trim() || 'Sistema Acadêmico';
      storageManager.saveProject(title);
      alert(`Projeto "${title}" salvo!`);
    }
  });
});
