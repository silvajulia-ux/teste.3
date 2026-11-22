/* =============================================================================
   PORTFÓLIO DE REDAÇÕES — ENSINO MÉDIO
   JavaScript puro (sem bibliotecas). Organizado em módulos independentes:

   00. Configuração rápida (nome, e-mail, GitHub)
   01. Cabeçalho: sombra ao rolar e menu responsivo
   02. Navegação: destaque da seção visível
   03. Animações de revelação ao rolar
   04. Linha do tempo: barra de progresso
   04.1 Linha do tempo: textos editáveis (salvos no navegador)
   05. Redações: busca + filtro por tema
   06. Redações: janela modal de leitura completa
   07. Botão voltar ao topo
   ============================================================================= */

'use strict';

/* =============================================================================
   00. CONFIGURAÇÃO RÁPIDA
   -----------------------------------------------------------------------------
   Edite apenas este objeto para atualizar os dados que aparecem no site todo.
   Os elementos do HTML com atributo data-config="chave" são preenchidos aqui.
   ============================================================================= */
const CONFIG = {
  nome: 'Lucas Marcelo de Freitas', // seu nome completo ou como quer ser chamado
  iniciais: 'LM',                    // iniciais exibidas no logotipo do cabeçalho
  anoConclusao: '2026',              // ano de conclusão do Ensino Médio
  email: 'seu.email@exemplo.com',
  github: 'https://github.com/seu-usuario',
};

/* =============================================================================
   00.1 UTILITÁRIOS
   ============================================================================= */
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

/** Remove acentos e coloca em minúsculas — usado na busca. */
const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Evita executar a função a cada milissegundo do evento. */
function debounce(fn, delay = 150) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* Aplica a configuração nos elementos marcados com data-config. */
function aplicarConfig() {
  $$('[data-config]').forEach((el) => {
    const chave = el.dataset.config;
    if (CONFIG[chave]) el.textContent = CONFIG[chave];
  });

  if (CONFIG.nome) {
    document.title = `${CONFIG.nome} — Portfólio de Redações | Ensino Médio`;
  }

  const linkEmail = $('a[href^="mailto:"]');
  if (linkEmail) linkEmail.href = `mailto:${CONFIG.email}`;

  const linkGithub = $('a[href*="github.com"]');
  if (linkGithub) linkGithub.href = CONFIG.github;
}

/* =============================================================================
   01. CABEÇALHO: SOMBRA AO ROLAR E MENU RESPONSIVO
   ============================================================================= */
function iniciarCabecalho() {
  const header = $('#topo');
  const toggle = $('#nav-toggle');
  const nav = $('#menu-principal');
  if (!header || !toggle || !nav) return;

  /* Sombra suave quando a página não está no topo */
  const aoRolar = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  const fecharMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const aberto = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(aberto));
  });

  /* Fecha ao clicar em um link do menu */
  $$('a', nav).forEach((link) => link.addEventListener('click', fecharMenu));

  /* Fecha com Esc */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      fecharMenu();
      toggle.focus();
    }
  });

  /* Fecha ao clicar fora do menu */
  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    fecharMenu();
  });

  /* Se a tela crescer, o menu mobile deixa de existir */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) fecharMenu();
  });
}

/* =============================================================================
   02. NAVEGAÇÃO: DESTAQUE DA SEÇÃO VISÍVEL
   ============================================================================= */
function iniciarScrollSpy() {
  const links = $$('.site-nav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const porId = new Map();
  links.forEach((link) => {
    const secao = document.getElementById(link.getAttribute('href').slice(1));
    if (secao) porId.set(secao, link);
  });

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        const link = porId.get(entrada.target);
        if (link) link.classList.add('is-active');
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );

  porId.forEach((_, secao) => observer.observe(secao));
}

/* =============================================================================
   03. ANIMAÇÕES DE REVELAÇÃO AO ROLAR
   ============================================================================= */
function iniciarRevelacoes() {
  const elementos = $$('[data-reveal]');
  if (!elementos.length) return;

  /* Escalonamento suave entre cards vizinhos */
  elementos.forEach((el) => {
    const irmaos = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
    const indice = irmaos.indexOf(el);
    if (indice > 0) el.style.setProperty('--reveal-delay', `${Math.min(indice, 6) * 60}ms`);
  });

  if (!('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          obs.unobserve(entrada.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  elementos.forEach((el) => observer.observe(el));
}

/* =============================================================================
   04. LINHA DO TEMPO: BARRA DE PROGRESSO
   ============================================================================= */
function iniciarProgressoLinhaDoTempo() {
  const timeline = $('.timeline');
  if (!timeline) return;

  const barra = document.createElement('span');
  barra.className = 'timeline-progress';
  barra.setAttribute('aria-hidden', 'true');
  timeline.appendChild(barra);

  const atualizar = () => {
    const rect = timeline.getBoundingClientRect();
    const alturaVisivel = window.innerHeight;
    /* Quanto da linha já passou pelo meio da tela */
    const progresso = Math.min(Math.max(alturaVisivel * 0.55 - rect.top, 0), rect.height);
    barra.style.height = `${progresso}px`;
  };

  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });
  window.addEventListener('resize', atualizar);
}

/* =============================================================================
   04.1 LINHA DO TEMPO: TEXTOS EDITÁVEIS
   -----------------------------------------------------------------------------
   Os relatos de cada fase podem ser escritos direto no site. O rascunho fica
   salvo no localStorage do navegador (nada é enviado para nenhum servidor) e
   pode ser restaurado para os textos de exemplo com um clique.
   ============================================================================= */
const CHAVE_LINHA_DO_TEMPO = 'portfolio-redacoes:linha-do-tempo';

/** Lê o rascunho salvo; devolve null quando não existe ou está corrompido. */
function lerRascunho() {
  try {
    const bruto = localStorage.getItem(CHAVE_LINHA_DO_TEMPO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    return dados && typeof dados === 'object' ? dados : null;
  } catch (erro) {
    return null; /* navegador sem localStorage ou JSON inválido */
  }
}

/** Tenta salvar; devolve false quando o navegador bloqueia o armazenamento. */
function gravarRascunho(dados) {
  try {
    localStorage.setItem(CHAVE_LINHA_DO_TEMPO, JSON.stringify(dados));
    return true;
  } catch (erro) {
    return false;
  }
}

function apagarRascunho() {
  try {
    localStorage.removeItem(CHAVE_LINHA_DO_TEMPO);
  } catch (erro) {
    /* sem localStorage: nada a apagar */
  }
}

function iniciarEdicaoTimeline() {
  const secao = $('#trajetoria');
  const campos = $$('[data-edit]', secao || document);
  const botao = $('#tl-toggle');
  const rotulo = $('#tl-toggle-label');
  const restaurar = $('#tl-reset');
  const status = $('#tl-status');
  const caixa = $('.tl-tools');
  if (!secao || !campos.length || !botao) return;

  /* Guarda o HTML original de cada campo — serve para "Restaurar exemplos". */
  const originais = new Map(campos.map((campo) => [campo.dataset.edit, campo.innerHTML]));
  let editando = false;
  let avisoTimer = null;

  const avisar = (mensagem) => {
    if (!status) return;
    status.textContent = mensagem;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => {
      status.textContent = '';
    }, 4000);
  };

  const coletar = () => {
    const dados = {};
    campos.forEach((campo) => {
      dados[campo.dataset.edit] = campo.innerHTML;
    });
    return dados;
  };

  const salvar = () => {
    const ok = gravarRascunho(coletar());
    if (ok) {
      if (caixa) caixa.dataset.pendente = 'nao';
      avisar('Rascunho salvo neste navegador.');
    } else {
      avisar('O navegador bloqueou o armazenamento: o texto pode ser editado, mas não será salvo.');
    }
    return ok;
  };

  const salvarComAtraso = debounce(salvar, 600);

  /* 1) Aplica o rascunho salvo (se existir) ao abrir a página. */
  const rascunho = lerRascunho();
  if (rascunho) {
    let aplicados = 0;
    campos.forEach((campo) => {
      const valor = rascunho[campo.dataset.edit];
      if (typeof valor === 'string' && valor.trim()) {
        campo.innerHTML = valor;
        aplicados += 1;
      }
    });
    if (aplicados && restaurar) {
      restaurar.hidden = false;
      if (caixa) caixa.dataset.pendente = 'sim';
    }
  }

  /* 2) Liga e desliga o modo de edição. */
  const definirModo = (ligado) => {
    editando = ligado;
    secao.classList.toggle('is-editing', ligado);
    botao.setAttribute('aria-pressed', String(ligado));
    if (rotulo) rotulo.textContent = ligado ? 'Concluir edição' : 'Editar textos';

    campos.forEach((campo) => {
      campo.contentEditable = ligado ? 'true' : 'false';
      if (ligado) campo.setAttribute('spellcheck', 'true');
    });

    if (ligado) {
      avisar('Modo de edição ativado: clique em um texto e escreva. As alterações são salvas automaticamente.');
      const primeiro = campos[0];
      if (primeiro) {
        primeiro.focus({ preventScroll: true });
        /* Coloca o cursor no fim do texto, sem selecionar tudo */
        const selecao = window.getSelection();
        if (selecao) {
          const intervalo = document.createRange();
          intervalo.selectNodeContents(primeiro);
          intervalo.collapse(false);
          selecao.removeAllRanges();
          selecao.addRange(intervalo);
        }
      }
    } else {
      const ok = salvar();
      avisar(ok ? 'Edição concluída — rascunho salvo neste navegador.' : 'Edição concluída.');
    }
  };

  botao.addEventListener('click', () => definirModo(!editando));

  /* 3) Salva enquanto digita (com atraso) e ao sair do campo. */
  campos.forEach((campo) => {
    campo.addEventListener('input', () => {
      if (!editando) return;
      if (caixa) caixa.dataset.pendente = 'sim';
      salvarComAtraso();
    });
    campo.addEventListener('blur', () => {
      if (editando) salvar();
    });
    /* Colar sempre como texto puro evita trazer estilos de fora */
    campo.addEventListener('paste', (event) => {
      if (!editando) return;
      event.preventDefault();
      const texto = (event.clipboardData || window.clipboardData).getData('text/plain');
      try {
        document.execCommand('insertText', false, texto);
      } catch (erro) {
        campo.textContent += texto;
      }
    });
  });

  /* 4) Restaura os textos de exemplo do HTML. */
  if (restaurar) {
    restaurar.addEventListener('click', () => {
      const confirmar = window.confirm(
        'Restaurar os textos de exemplo? O rascunho salvo neste navegador será apagado.',
      );
      if (!confirmar) return;

      campos.forEach((campo) => {
        const original = originais.get(campo.dataset.edit);
        if (typeof original === 'string') campo.innerHTML = original;
      });
      apagarRascunho();
      restaurar.hidden = true;
      if (caixa) caixa.dataset.pendente = 'nao';
      if (editando) definirModo(false);
      avisar('Textos de exemplo restaurados.');
    });
  }

  /* 5) Avisa antes de sair com alterações ainda não gravadas. */
  window.addEventListener('beforeunload', (event) => {
    if (caixa && caixa.dataset.pendente === 'sim' && editando) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

/* =============================================================================
   05. REDAÇÕES: BUSCA E FILTRO POR TEMA
   ============================================================================= */
const estado = {
  termo: '',
  categoria: 'todas',
  visiveis: [],
};

function iniciarBuscaEFiltros() {
  const grid = $('#lista-redacoes');
  const input = $('#busca-redacoes');
  const limpar = $('#limpar-busca');
  const info = $('#resultado-busca');
  const vazio = $('#sem-resultados');
  const resetar = $('#reset-filtros');
  const chips = $$('.chip');
  if (!grid || !input) return;

  const cards = $$('.essay-card', grid);
  const total = cards.length;

  /* Pré-carrega o texto integral de cada redação (para a busca funcionar
     também em palavras que aparecem no meio do texto). */
  cards.forEach((card) => {
    const template = document.getElementById(`redacao-${card.dataset.num}`);
    card.dataset.busca = normalizar(
      [
        $('.card-title', card)?.textContent ?? '',
        $('.card-cat', card)?.textContent ?? '',
        $('.card-preview', card)?.textContent ?? '',
        template ? template.content.textContent : '',
      ].join(' '),
    );
  });

  const aplicar = () => {
    const termo = normalizar(estado.termo);
    let mostradas = 0;

    cards.forEach((card) => {
      const combinaCategoria = estado.categoria === 'todas' || card.dataset.cat === estado.categoria;
      const combinaTermo = !termo || card.dataset.busca.includes(termo);
      const visivel = combinaCategoria && combinaTermo;
      card.hidden = !visivel;
      if (visivel) mostradas += 1;
    });

    /* Lista de redações visíveis, na ordem atual (usada pela modal) */
    estado.visiveis = cards.filter((card) => !card.hidden).map((card) => card.dataset.num);

    /* Contador acessível */
    if (info) {
      info.textContent =
        mostradas === total
          ? `${total} redações disponíveis`
          : `${mostradas} de ${total} redações encontradas`;
    }

    /* Estado vazio */
    if (vazio) vazio.hidden = mostradas !== 0;
    if (limpar) limpar.hidden = !estado.termo;

    /* Chips */
    chips.forEach((chip) => {
      const ativo = chip.dataset.filter === estado.categoria;
      chip.classList.toggle('is-active', ativo);
      chip.setAttribute('aria-pressed', String(ativo));
    });
  };

  /* Busca com debounce */
  const aoDigitar = debounce(() => {
    estado.termo = input.value;
    aplicar();
  }, 140);

  input.addEventListener('input', aoDigitar);

  /* Botão de limpar do campo */
  if (limpar) {
    limpar.addEventListener('click', () => {
      input.value = '';
      estado.termo = '';
      aplicar();
      input.focus();
    });
  }

  /* Filtros por tema */
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      estado.categoria = chip.dataset.filter;
      aplicar();
    });
  });

  /* Limpar tudo pelo estado vazio */
  if (resetar) {
    resetar.addEventListener('click', () => {
      estado.categoria = 'todas';
      estado.termo = '';
      input.value = '';
      aplicar();
      input.focus();
    });
  }

  /* Atalho "/" para focar a busca */
  document.addEventListener('keydown', (event) => {
    const modalAberta = !document.getElementById('modal-redacao')?.hidden;
    if (event.key === '/' && !modalAberta && document.activeElement !== input) {
      const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (!digitando) {
        event.preventDefault();
        input.focus();
      }
    }
  });

  aplicar();
}

/* =============================================================================
   06. REDAÇÕES: JANELA MODAL DE LEITURA
   ============================================================================= */
const modal = {
  el: null,
  conteudo: null,
  contador: null,
  btnPrev: null,
  btnNext: null,
  origem: null,
};

function iniciarModalLeitura() {
  const el = $('#modal-redacao');
  const conteudo = $('#modal-conteudo');
  if (!el || !conteudo) return;

  modal.el = el;
  modal.conteudo = conteudo;
  modal.contador = $('#modal-contador');
  modal.btnPrev = $('[data-nav="prev"]', el);
  modal.btnNext = $('[data-nav="next"]', el);

  /* Abrir ao clicar em "Ler redação completa" */
  document.addEventListener('click', (event) => {
    const gatilho = event.target.closest('[data-open]');
    if (!gatilho) return;
    abrirRedacao(gatilho.dataset.open, gatilho);
  });

  /* Fechar */
  $$('[data-close]', el).forEach((btn) => {
    btn.addEventListener('click', fecharModal);
  });

  /* Navegação anterior / próxima */
  if (modal.btnPrev) modal.btnPrev.addEventListener('click', () => navegar(-1));
  if (modal.btnNext) modal.btnNext.addEventListener('click', () => navegar(1));

  /* Teclado */
  document.addEventListener('keydown', (event) => {
    if (el.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      fecharModal();
    } else if (event.key === 'Tab') {
      manterFocoNoModal(event);
    } else if (event.key === 'ArrowLeft') {
      navegar(-1);
    } else if (event.key === 'ArrowRight') {
      navegar(1);
    }
  });

  /* Link direto: site.com/#redacao-7 abre a redação 7 */
  if (location.hash.startsWith('#redacao-')) {
    const num = location.hash.replace('#redacao-', '');
    if (document.getElementById(`redacao-${num}`)) {
      setTimeout(() => abrirRedacao(num, null), 120);
    }
  }
}

/** Redações visíveis no momento (respeitando busca e filtro). */
function listaVisivel() {
  return estado.visiveis.length
    ? estado.visiveis
    : $$('.essay-card:not([hidden])').map((card) => card.dataset.num);
}

function abrirRedacao(num, gatilho) {
  const template = document.getElementById(`redacao-${num}`);
  if (!template) return;

  modal.origem = gatilho || document.activeElement;
  modal.conteudo.innerHTML = '';
  modal.conteudo.appendChild(template.content.cloneNode(true));
  modal.conteudo.scrollTop = 0;

  /* O título recebe o id usado por aria-labelledby da janela modal */
  const titulo = $('.reader-title', modal.conteudo);
  if (titulo) titulo.id = 'modal-titulo';

  modal.el.hidden = false;
  document.body.classList.add('modal-aberta');

  atualizarNavegacao(num);

  /* Foco vai para o botão de fechar (primeira ação esperada) */
  const fechar = $('.modal-close', modal.el);
  if (fechar) fechar.focus({ preventScroll: true });

  /* Guarda o número da redação aberta */
  modal.el.dataset.atual = num;

  /* Atualiza a URL sem recarregar nem pular a página
     (o try/catch evita erro quando o site é aberto direto do arquivo) */
  try {
    history.replaceState(null, '', `#redacao-${num}`);
  } catch (erro) {
    /* Protocolo file:// ou navegador restrito: segue sem alterar a URL */
  }
}

function fecharModal() {
  if (!modal.el || modal.el.hidden) return;

  modal.el.hidden = true;
  modal.el.dataset.atual = '';
  modal.conteudo.innerHTML = '';
  document.body.classList.remove('modal-aberta');

  /* Remove o hash da URL */
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch (erro) {
    /* idem acima */
  }

  /* Devolve o foco para quem abriu */
  if (modal.origem && typeof modal.origem.focus === 'function') {
    modal.origem.focus({ preventScroll: true });
  }
}

/** Atualiza contador e estado dos botões de navegação. */
function atualizarNavegacao(num) {
  const lista = listaVisivel();
  const indice = lista.indexOf(String(num));

  if (modal.contador) {
    modal.contador.textContent = `${indice + 1} de ${lista.length}`;
  }
  if (modal.btnPrev) modal.btnPrev.disabled = indice <= 0;
  if (modal.btnNext) modal.btnNext.disabled = indice === -1 || indice >= lista.length - 1;
}

/** Vai para a redação anterior (-1) ou seguinte (+1). */
function navegar(direcao) {
  if (!modal.el || modal.el.hidden) return;

  const atual = modal.el.dataset.atual;
  const lista = listaVisivel();
  const indice = lista.indexOf(String(atual));
  const proximo = lista[indice + direcao];
  if (!proximo) return;

  abrirRedacao(proximo, modal.origem);
}

/** Mantém o foco do teclado dentro da janela modal (acessibilidade). */
function manterFocoNoModal(event) {
  const focaveis = $$(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    modal.el,
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);

  if (!focaveis.length) return;

  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];

  if (event.shiftKey && document.activeElement === primeiro) {
    event.preventDefault();
    ultimo.focus();
  } else if (!event.shiftKey && document.activeElement === ultimo) {
    event.preventDefault();
    primeiro.focus();
  }
}

/* =============================================================================
   07. BOTÃO VOLTAR AO TOPO
   ============================================================================= */
function iniciarBotaoTopo() {
  const botao = $('#to-top');
  if (!botao) return;

  const atualizar = () => {
    const visivel = window.scrollY > 500;
    if (visivel && botao.hidden) botao.hidden = false;
    botao.classList.toggle('is-visible', visivel);
    if (!visivel) {
      /* Esconde de novo depois da transição, para não capturar cliques */
      setTimeout(() => {
        if (window.scrollY <= 500) botao.hidden = true;
      }, 320);
    }
  };

  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });

  botao.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =============================================================================
   INICIALIZAÇÃO
   ============================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  aplicarConfig();
  iniciarCabecalho();
  iniciarScrollSpy();
  iniciarRevelacoes();
  iniciarProgressoLinhaDoTempo();
  iniciarEdicaoTimeline();
  iniciarBuscaEFiltros();
  iniciarModalLeitura();
  iniciarBotaoTopo();
});
