/**
 * Gerenciador de Menus de Navegação (Menubar)
 * Lida com dropdowns, submenus aninhados, detecção de bordas da tela e suporte mobile/acessibilidade.
 */
class MenuManager {
  constructor() {
    this.navMenus = document.querySelectorAll('.nav-menu');
    this.navBtns = document.querySelectorAll('.nav-btn');
    this.submenus = document.querySelectorAll('.has-submenu');
    
    this.init();
  }

  init() {
    // 1. Abrir/Fechar Menus Principais
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = btn.closest('.nav-menu');
        const content = parent.querySelector('.dropdown-content');
        const isOpen = content.classList.contains('show');

        this.closeAllMenus();

        if (!isOpen) {
          content.classList.add('show');
          btn.setAttribute('aria-expanded', 'true');
          this.checkEdgeCollision(content);
        }
      });
      
      // Hover para trocar de menu rapidamente se algum já estiver aberto (estilo Windows/Mac)
      btn.addEventListener('mouseenter', () => {
        const anyOpen = Array.from(document.querySelectorAll('.dropdown-content')).some(m => m.classList.contains('show'));
        if (anyOpen && btn.getAttribute('aria-expanded') !== 'true') {
          btn.click();
        }
      });
    });

    // 2. Submenus Aninhados
    this.submenus.forEach(item => {
      const btn = item.querySelector('button');
      const submenu = item.querySelector('.submenu');

      // Mouse entra (Desktop)
      item.addEventListener('mouseenter', () => {
        this.closeSiblingSubmenus(item);
        submenu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
        this.checkEdgeCollision(submenu, true);
      });

      // Mouse sai (Desktop)
      item.addEventListener('mouseleave', () => {
        submenu.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
      });

      // Clique (Mobile/Acessibilidade)
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que clique no submenu feche o menu pai
        const isOpen = submenu.classList.contains('show');
        
        // No mobile, clica pra abrir. Se já ta aberto, deixa o evento propagar (pode ser um link)
        if (!isOpen) {
          e.preventDefault();
          this.closeSiblingSubmenus(item);
          submenu.classList.add('show');
          btn.setAttribute('aria-expanded', 'true');
          this.checkEdgeCollision(submenu, true);
        }
      });
    });

    // 3. Fechar tudo ao clicar fora
    document.addEventListener('click', () => {
      this.closeAllMenus();
    });

    // Impede que clique dentro do menu o feche imediatamente
    document.querySelectorAll('.dropdown-content').forEach(content => {
      content.addEventListener('click', (e) => {
        // Se clicou em um botão final (que não é submenu), deixa propagar e fechar
        if (e.target.closest('button') && !e.target.closest('.has-submenu')) {
          // Deixa propagar pro document e fechar
        } else {
          e.stopPropagation();
        }
      });
    });

    // 4. Navegação por Teclado (Esc para fechar)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllMenus();
      }
    });
  }

  closeAllMenus() {
    document.querySelectorAll('.dropdown-content, .submenu').forEach(menu => {
      menu.classList.remove('show');
      menu.classList.remove('align-right');
      menu.classList.remove('align-left');
    });
    document.querySelectorAll('.nav-btn, .has-submenu > button').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  closeSiblingSubmenus(activeItem) {
    const siblings = activeItem.parentElement.querySelectorAll(':scope > .has-submenu');
    siblings.forEach(sibling => {
      if (sibling !== activeItem) {
        const sub = sibling.querySelector('.submenu');
        const btn = sibling.querySelector('button');
        if (sub) sub.classList.remove('show');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  checkEdgeCollision(menu, isSubmenu = false) {
    // Reset classes para cálculo limpo
    menu.classList.remove('align-right');
    menu.classList.remove('align-left');
    
    // Pequeno timeout para o navegador calcular o layout se estiver sendo revelado agora
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Se ultrapassar a tela pela direita
      if (rect.right > viewportWidth) {
        if (isSubmenu) {
          menu.classList.add('align-left'); // Submenu abre pra esquerda do pai
        } else {
          menu.classList.add('align-right'); // Dropdown principal alinha na direita do pai
        }
      }
    }, 10);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.menuManager = new MenuManager();
});
