/* =========================================================
   ECOS DE AURORA — script.js
   Interatividade em JavaScript puro (sem bibliotecas):

     1. Menu hambúrguer (celular/tablet)
     2. Modo claro/escuro
     3. Filtro de personagens por classe
     4. Galeria com lightbox (anterior, próximo, fechar, Esc, deslize)
     5. Validação do formulário de contato
     6. Rolagem suave + destaque do item ativo no menu
     7. Botão "Voltar ao topo"
     8. Animação de entrada com IntersectionObserver
     +  Ano automático no rodapé

   O arquivo é carregado com "defer": quando roda, o HTML
   já está pronto, então os elementos podem ser buscados
   diretamente. Tudo fica dentro de uma função isolada para
   não criar variáveis globais.
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     UTILITÁRIOS COMPARTILHADOS
     ------------------------------------------------------- */
  const raiz = document.documentElement;
  const header = document.querySelector('.site-header');
  const consultaMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const consultaDesktop = window.matchMedia('(min-width: 1025px)');

  /**
   * Indica se o usuário pediu, nas configurações do sistema,
   * para reduzir animações. Nesse caso, rolagens e efeitos
   * acontecem de forma instantânea.
   */
  function prefereMenosMovimento() {
    return consultaMenosMovimento.matches;
  }

  /** Retorna "smooth" ou "auto" conforme a preferência de movimento. */
  function comportamentoRolagem() {
    return prefereMenosMovimento() ? 'auto' : 'smooth';
  }

  /** Altura atual do cabeçalho fixo (muda entre celular e desktop). */
  function alturaHeader() {
    return header ? header.offsetHeight : 0;
  }

  /**
   * Registra um "ouvinte" para mudanças de media query.
   * Navegadores antigos (Safari < 14) usam addListener.
   */
  function aoMudarConsulta(consulta, funcao) {
    if (typeof consulta.addEventListener === 'function') {
      consulta.addEventListener('change', funcao);
    } else if (typeof consulta.addListener === 'function') {
      consulta.addListener(funcao);
    }
  }


  /* =======================================================
     1. MENU HAMBÚRGUER
     Abre/fecha o painel de navegação no celular e tablet.
     Fecha sozinho ao tocar num link, ao tocar fora do menu,
     ao pressionar Esc ou ao ampliar a tela para desktop.
     ======================================================= */
  const botaoMenu = document.querySelector('.menu-toggle');
  const listaMenu = document.getElementById('menu-principal');
  const linksMenu = document.querySelectorAll('.nav-link');

  /** Informa se o painel do menu está aberto no momento. */
  function menuEstaAberto() {
    return listaMenu.classList.contains('aberto');
  }

  /** Abre o menu e atualiza os atributos de acessibilidade. */
  function abrirMenu() {
    listaMenu.classList.add('aberto');
    botaoMenu.setAttribute('aria-expanded', 'true');
    botaoMenu.setAttribute('aria-label', 'Fechar menu');
  }

  /** Fecha o menu e atualiza os atributos de acessibilidade. */
  function fecharMenu() {
    listaMenu.classList.remove('aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
  }

  /** Alterna entre aberto e fechado (usado pelo botão hambúrguer). */
  function alternarMenu() {
    if (menuEstaAberto()) fecharMenu();
    else abrirMenu();
  }

  if (botaoMenu && listaMenu) {
    botaoMenu.addEventListener('click', alternarMenu);

    // Fecha automaticamente ao escolher uma seção
    linksMenu.forEach(function (link) {
      link.addEventListener('click', fecharMenu);
    });

    // Fecha ao tocar/clicar fora do menu
    document.addEventListener('click', function (evento) {
      if (!menuEstaAberto()) return;
      const clicouDentro = listaMenu.contains(evento.target) || botaoMenu.contains(evento.target);
      if (!clicouDentro) fecharMenu();
    });

    // Fecha com Esc e devolve o foco ao botão
    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && menuEstaAberto()) {
        fecharMenu();
        botaoMenu.focus();
      }
    });

    // Se a tela crescer até o layout desktop, o painel mobile é desfeito
    aoMudarConsulta(consultaDesktop, function (evento) {
      if (evento.matches) fecharMenu();
    });
  }


  /* =======================================================
     2. MODO CLARO / ESCURO
     O botão troca o atributo data-theme do <html>. O CSS
     redefine todas as variáveis de cor para cada tema.
     A escolha fica salva no navegador (localStorage).
     ======================================================= */
  const CHAVE_TEMA = 'ecos-tema';
  const botaoTema = document.getElementById('theme-toggle');
  const metaCorTema = document.querySelector('meta[name="theme-color"]');
  const COR_BARRA_NAVEGADOR = { dark: '#0B0F2A', light: '#F5F2FB' };

  /**
   * Salva o tema escolhido. O try/catch evita erro em
   * navegação privada, onde o armazenamento pode falhar.
   */
  function salvarTema(tema) {
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch (erro) {
      /* sem armazenamento: o tema vale só nesta visita */
    }
  }

  /**
   * Aplica um tema ("dark" ou "light"): atualiza o <html>,
   * o texto do botão para leitores de tela e a cor da barra
   * do navegador no celular (meta theme-color).
   */
  function aplicarTema(tema) {
    const claro = tema === 'light';
    raiz.setAttribute('data-theme', claro ? 'light' : 'dark');

    if (botaoTema) {
      const rotulo = claro ? 'Ativar modo escuro' : 'Ativar modo claro';
      botaoTema.setAttribute('aria-label', rotulo);
      botaoTema.setAttribute('title', rotulo);
    }
    if (metaCorTema) {
      metaCorTema.setAttribute('content', COR_BARRA_NAVEGADOR[claro ? 'light' : 'dark']);
    }
  }

  /** Inverte o tema atual e guarda a escolha. */
  function alternarTema() {
    const novoTema = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    aplicarTema(novoTema);
    salvarTema(novoTema);
  }

  // Sincroniza botão e meta com o tema já aplicado no <head>
  aplicarTema(raiz.getAttribute('data-theme') || 'dark');

  if (botaoTema) {
    botaoTema.addEventListener('click', alternarTema);
  }


  /* =======================================================
     3. FILTRO DE PERSONAGENS
     Cada card tem data-classe ("guerreiro", "mago" ou
     "explorador"). O botão clicado mostra só os cards da
     classe escolhida; "Todos" mostra todos.
     ======================================================= */
  const botoesFiltro = document.querySelectorAll('.filtro-btn');
  const cardsPersonagens = document.querySelectorAll('.personagem-card');
  const statusFiltro = document.getElementById('filtro-status');
  const NOMES_CLASSES = { guerreiro: 'Guerreiro', mago: 'Mago', explorador: 'Explorador' };

  /**
   * Monta a frase de resumo do filtro, anunciada por
   * leitores de tela (ex.: "Mostrando 2 personagens da classe Mago.").
   */
  function textoStatusFiltro(filtro, quantidade) {
    if (filtro === 'todos') return 'Mostrando todos os ' + quantidade + ' personagens.';
    const palavra = quantidade === 1 ? 'personagem' : 'personagens';
    return 'Mostrando ' + quantidade + ' ' + palavra + ' da classe ' + NOMES_CLASSES[filtro] + '.';
  }

  /**
   * Aplica o filtro: esconde (atributo hidden) os cards de
   * outras classes, anima os que continuam visíveis e marca
   * o botão ativo com aria-pressed="true".
   */
  function filtrarPersonagens(filtro) {
    let visiveis = 0;

    cardsPersonagens.forEach(function (card) {
      const mostrar = filtro === 'todos' || card.dataset.classe === filtro;
      card.hidden = !mostrar;
      card.classList.remove('surgindo');

      if (mostrar) {
        visiveis++;
        if (!prefereMenosMovimento()) {
          void card.offsetWidth;            // reinicia a animação CSS
          card.classList.add('surgindo');
        }
      }
    });

    botoesFiltro.forEach(function (botao) {
      botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtro));
    });

    if (statusFiltro) statusFiltro.textContent = textoStatusFiltro(filtro, visiveis);
  }

  botoesFiltro.forEach(function (botao) {
    botao.addEventListener('click', function () {
      filtrarPersonagens(botao.dataset.filtro);
    });
  });

  // Ao fim da animação, remove a classe para o efeito de
  // elevação no hover voltar a funcionar normalmente
  cardsPersonagens.forEach(function (card) {
    card.addEventListener('animationend', function () {
      card.classList.remove('surgindo');
    });
  });


  /* =======================================================
     4. GALERIA COM LIGHTBOX
     Ao tocar numa imagem, abre um modal (<dialog>) com a
     imagem ampliada, legenda e contador. Navegação:
       • botões ‹ e › ou setas do teclado
       • deslizar o dedo para os lados (celular)
     Fechamento: botão ×, tecla Esc ou toque fora da imagem.
     ======================================================= */
  const itensGaleria = Array.prototype.slice.call(document.querySelectorAll('.galeria-item'));
  const lightbox = document.getElementById('lightbox');
  const lbImagem = document.getElementById('lightbox-img');
  const lbLegenda = document.getElementById('lightbox-legenda');
  const lbContador = document.getElementById('lightbox-contador');
  const lbPalco = document.getElementById('lightbox-palco');
  const lbFechar = document.getElementById('lightbox-fechar');
  const lbAnterior = document.getElementById('lightbox-anterior');
  const lbProximo = document.getElementById('lightbox-proximo');

  let indiceAtual = 0;      // imagem exibida no momento
  let itemDeOrigem = null;  // item clicado (recebe o foco de volta ao fechar)

  /** Informa se o lightbox está aberto. */
  function lightboxEstaAberto() {
    return lightbox.hasAttribute('open');
  }

  /**
   * Exibe a imagem de índice informado. O índice "dá a volta":
   * depois da última vem a primeira e vice-versa.
   * Com o modal aberto, faz um rápido fade entre as imagens.
   */
  function mostrarImagem(indice) {
    const total = itensGaleria.length;
    indiceAtual = (indice + total) % total;

    const item = itensGaleria[indiceAtual];
    const imagem = item.querySelector('img');
    const legenda = item.querySelector('figcaption');

    function trocar() {
      lbImagem.src = imagem.currentSrc || imagem.src;
      lbImagem.alt = imagem.alt;
      lbLegenda.textContent = legenda ? legenda.textContent : '';
      lbContador.textContent = (indiceAtual + 1) + ' / ' + total;
      lbImagem.classList.remove('trocando');
    }

    if (lightboxEstaAberto() && !prefereMenosMovimento()) {
      lbImagem.classList.add('trocando');
      setTimeout(trocar, 150);
    } else {
      trocar();
    }
  }

  /** Avança para a próxima imagem. */
  function proximaImagem() {
    mostrarImagem(indiceAtual + 1);
  }

  /** Volta para a imagem anterior. */
  function imagemAnterior() {
    mostrarImagem(indiceAtual - 1);
  }

  /**
   * Abre o lightbox na imagem escolhida, trava a rolagem do
   * fundo e coloca o foco no botão de fechar (acessibilidade).
   */
  function abrirLightbox(indice) {
    itemDeOrigem = itensGaleria[indice];
    mostrarImagem(indice);

    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');   // navegadores muito antigos
    }

    raiz.classList.add('sem-rolagem');
    lbFechar.focus();
  }

  /** Fecha o lightbox (a limpeza acontece em aoFecharLightbox). */
  function fecharLightbox() {
    if (!lightboxEstaAberto()) return;

    if (typeof lightbox.close === 'function') {
      lightbox.close();                     // dispara o evento "close"
    } else {
      lightbox.removeAttribute('open');
      aoFecharLightbox();
    }
  }

  /** Destrava a rolagem e devolve o foco à imagem que foi aberta. */
  function aoFecharLightbox() {
    raiz.classList.remove('sem-rolagem');
    if (itemDeOrigem) itemDeOrigem.focus({ preventScroll: true });
  }

  if (lightbox && itensGaleria.length) {
    // Torna cada imagem "clicável" também pelo teclado
    itensGaleria.forEach(function (item, indice) {
      const legenda = item.querySelector('figcaption');
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-haspopup', 'dialog');
      item.setAttribute('aria-label', 'Ampliar imagem: ' + (legenda ? legenda.textContent : 'galeria'));

      item.addEventListener('click', function () {
        abrirLightbox(indice);
      });

      item.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          abrirLightbox(indice);
        }
      });
    });

    lbFechar.addEventListener('click', fecharLightbox);
    lbAnterior.addEventListener('click', imagemAnterior);
    lbProximo.addEventListener('click', proximaImagem);

    // O <dialog> dispara "close" ao fechar (inclusive pelo Esc nativo)
    lightbox.addEventListener('close', aoFecharLightbox);

    // Toque/clique no fundo escurecido (fora do conteúdo) fecha
    lightbox.addEventListener('click', function (evento) {
      if (evento.target === lightbox) fecharLightbox();
    });

    // Teclado dentro do modal: setas navegam, Esc fecha
    lightbox.addEventListener('keydown', function (evento) {
      if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        proximaImagem();
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        imagemAnterior();
      } else if (evento.key === 'Escape') {
        evento.preventDefault();
        fecharLightbox();
      }
    });

    // Deslizar o dedo (swipe) para trocar de imagem no celular
    let toqueInicialX = null;
    let toqueInicialY = null;

    lbPalco.addEventListener('touchstart', function (evento) {
      const toque = evento.changedTouches[0];
      toqueInicialX = toque.clientX;
      toqueInicialY = toque.clientY;
    }, { passive: true });

    lbPalco.addEventListener('touchend', function (evento) {
      if (toqueInicialX === null) return;

      const toque = evento.changedTouches[0];
      const distanciaX = toque.clientX - toqueInicialX;
      const distanciaY = toque.clientY - toqueInicialY;
      toqueInicialX = null;

      // Só conta como deslize se for mais horizontal que vertical
      const DESLIZE_MINIMO = 50;
      if (Math.abs(distanciaX) > DESLIZE_MINIMO && Math.abs(distanciaX) > Math.abs(distanciaY)) {
        if (distanciaX < 0) proximaImagem();
        else imagemAnterior();
      }
    }, { passive: true });
  }


  /* =======================================================
     5. VALIDAÇÃO DO FORMULÁRIO DE CONTATO
     Verifica campos vazios e formato de e-mail, mostrando
     a mensagem de erro logo abaixo de cada campo.
       • Ao sair de um campo preenchido, ele é validado.
       • Enquanto o usuário corrige, o erro some sozinho.
       • No envio, todos são validados e o foco vai para
         o primeiro campo com problema.
     O envio é simulado (não há servidor ainda).
     ======================================================= */
  const formulario = document.getElementById('contato-form');
  const mensagemSucesso = document.getElementById('form-sucesso');
  const botaoEnviar = document.getElementById('btn-enviar');
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /**
   * Regras de cada campo. Cada função recebe o valor (sem
   * espaços nas pontas) e devolve a mensagem de erro, ou
   * uma string vazia quando o valor está correto.
   */
  const regrasFormulario = {
    nome: function (valor) {
      if (!valor) return 'Por favor, informe seu nome.';
      if (valor.length < 2) return 'O nome precisa ter pelo menos 2 letras.';
      return '';
    },
    email: function (valor) {
      if (!valor) return 'Por favor, informe seu e-mail.';
      if (!REGEX_EMAIL.test(valor)) return 'Formato de e-mail inválido. Exemplo: nome@exemplo.com';
      return '';
    },
    mensagem: function (valor) {
      if (!valor) return 'Por favor, escreva sua mensagem.';
      if (valor.length < 10) {
        return 'A mensagem precisa ter pelo menos 10 caracteres (faltam ' + (10 - valor.length) + ').';
      }
      return '';
    }
  };

  /**
   * Mostra (ou limpa) a mensagem de erro abaixo do campo e
   * marca o campo como inválido para o CSS e para leitores
   * de tela (aria-invalid).
   */
  function exibirErro(campo, mensagem) {
    const elementoErro = document.getElementById('erro-' + campo.name);
    if (elementoErro) elementoErro.textContent = mensagem;

    campo.classList.toggle('invalido', Boolean(mensagem));
    if (mensagem) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
  }

  /** Valida um campo e devolve true se estiver correto. */
  function validarCampo(campo) {
    const mensagem = regrasFormulario[campo.name](campo.value.trim());
    exibirErro(campo, mensagem);
    return !mensagem;
  }

  /** Simula o envio: estado "Enviando...", depois sucesso e limpeza. */
  function enviarFormulario() {
    const textoOriginal = botaoEnviar.textContent;
    const primeiroNome = formulario.elements.nome.value.trim().split(/\s+/)[0];
    const assinouNewsletter = formulario.elements.newsletter.checked;

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = 'Enviando...';
    formulario.setAttribute('aria-busy', 'true');

    // Substituir este setTimeout pela integração real (API, serviço de e-mail etc.)
    setTimeout(function () {
      mensagemSucesso.textContent = assinouNewsletter
        ? 'Obrigado, ' + primeiroNome + '! Sua mensagem foi enviada e você entrou para a newsletter.'
        : 'Obrigado, ' + primeiroNome + '! Sua mensagem foi enviada.';

      formulario.reset();  // a caixa da newsletter volta ao padrão (marcada)
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = textoOriginal;
      formulario.removeAttribute('aria-busy');
    }, 900);
  }

  if (formulario) {
    const camposValidados = Object.keys(regrasFormulario).map(function (nome) {
      return formulario.elements[nome];
    });

    camposValidados.forEach(function (campo) {
      // Ao sair do campo: valida só se já foi preenchido ou já tinha erro
      // (evita "brigar" com quem apenas passou pelo campo no celular)
      campo.addEventListener('blur', function () {
        if (campo.value.trim() || campo.classList.contains('invalido')) validarCampo(campo);
      });

      // Enquanto digita: atualiza o erro em tempo real e some a mensagem de sucesso antiga
      campo.addEventListener('input', function () {
        mensagemSucesso.textContent = '';
        if (campo.classList.contains('invalido')) validarCampo(campo);
      });
    });

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      mensagemSucesso.textContent = '';

      // map() valida TODOS os campos (mostra todos os erros de uma vez)
      const resultados = camposValidados.map(validarCampo);
      const tudoCerto = resultados.every(Boolean);

      if (!tudoCerto) {
        const primeiroInvalido = camposValidados[resultados.indexOf(false)];
        primeiroInvalido.focus();
        return;
      }

      enviarFormulario();
    });
  }


  /* =======================================================
     6. ROLAGEM SUAVE + ITEM ATIVO NO MENU
     a) Todo link interno (href="#...") rola suavemente até a
        seção, descontando a altura do cabeçalho fixo.
     b) Um IntersectionObserver percebe qual seção está no
        meio da tela e destaca o link correspondente.
     ======================================================= */

  /**
   * Rola a página até o elemento de destino e move o foco
   * para ele (importante para quem navega por teclado ou
   * leitor de tela), sem provocar um segundo "pulo".
   */
  function rolarAte(destino) {
    const ehTopo = destino === header || destino.id === 'inicio';
    const posicao = ehTopo
      ? 0
      : destino.getBoundingClientRect().top + window.pageYOffset - alturaHeader();

    window.scrollTo({ top: Math.max(0, posicao), behavior: comportamentoRolagem() });

    if (!destino.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(destino.tagName)) {
      destino.setAttribute('tabindex', '-1');
    }
    destino.focus({ preventScroll: true });
  }

  // Delegação de eventos: um único ouvinte cuida de todos os links internos
  document.addEventListener('click', function (evento) {
    const link = evento.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (hash === '#') {                 // links provisórios (redes sociais)
      evento.preventDefault();
      return;
    }

    const destino = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!destino) return;

    evento.preventDefault();
    rolarAte(destino);

    // Atualiza o endereço sem pular a página (permite compartilhar o link da seção)
    if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState(null, '', hash);
    }
  });

  /** Marca como ativo o link do menu que aponta para a seção informada. */
  function marcarLinkAtivo(idSecao) {
    linksMenu.forEach(function (link) {
      const ativo = link.getAttribute('href') === '#' + idSecao;
      link.classList.toggle('ativo', ativo);
      if (ativo) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  const secoesDoMenu = document.querySelectorAll('main section[id]');

  if ('IntersectionObserver' in window && secoesDoMenu.length) {
    // A "faixa de detecção" é uma linha no meio da tela:
    // a seção que cruza essa faixa é a seção atual.
    const observadorSecoes = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) marcarLinkAtivo(entrada.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    secoesDoMenu.forEach(function (secao) {
      observadorSecoes.observe(secao);
    });
  }


  /* =======================================================
     7. BOTÃO "VOLTAR AO TOPO" (+ cabeçalho ao rolar)
     Um único ouvinte de rolagem, limitado a uma execução
     por quadro de animação (requestAnimationFrame), para
     não pesar no celular. Ele:
       • mostra o botão depois de rolar ~60% da tela;
       • deixa o cabeçalho mais opaco após sair do topo.
     ======================================================= */
  const botaoTopo = document.getElementById('btn-topo');
  let atualizacaoAgendada = false;

  /** Atualiza cabeçalho e botão conforme a posição da rolagem. */
  function atualizarAoRolar() {
    const rolagem = window.pageYOffset;

    if (header) header.classList.toggle('rolado', rolagem > 24);
    if (botaoTopo) botaoTopo.classList.toggle('visivel', rolagem > window.innerHeight * 0.6);

    atualizacaoAgendada = false;
  }

  window.addEventListener('scroll', function () {
    if (!atualizacaoAgendada) {
      atualizacaoAgendada = true;
      window.requestAnimationFrame(atualizarAoRolar);
    }
  }, { passive: true });

  atualizarAoRolar(); // estado inicial (ex.: página recarregada no meio)

  if (botaoTopo) {
    botaoTopo.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: comportamentoRolagem() });

      // Leva o foco ao logo para o teclado recomeçar do topo
      const logo = document.querySelector('.site-header .logo');
      if (logo) logo.focus({ preventScroll: true });

      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  }


  /* =======================================================
     8. ANIMAÇÃO DE ENTRADA (IntersectionObserver)
     Os elementos começam levemente abaixo e transparentes
     (classe .reveal) e "surgem" quando entram na tela
     (classe .visivel). Irmãos lado a lado recebem um pequeno
     atraso em cascata. Depois da animação, as classes são
     removidas para não interferir em outros efeitos (hover).
     Não roda se o usuário prefere menos movimento.
     ======================================================= */

  /** Prepara os elementos e começa a observá-los. */
  function iniciarAnimacoesDeEntrada() {
    if (prefereMenosMovimento() || !('IntersectionObserver' in window)) return;

    const seletores = [
      '.section-title',
      '.section-intro',
      '.sobre-historia',
      '.sobre-ficha',
      '.filtros',
      '.personagem-card',
      '.regiao',
      '.galeria-item',
      '.noticia-card',
      '.contato-form',
      '.footer-inner'
    ];
    const elementos = document.querySelectorAll(seletores.join(','));

    /** Remove as classes de animação quando a transição termina. */
    function limparAnimacao(evento) {
      if (evento.target !== evento.currentTarget || evento.propertyName !== 'opacity') return;
      const elemento = evento.currentTarget;
      elemento.classList.remove('reveal', 'visivel');
      elemento.style.removeProperty('--atraso');
      elemento.removeEventListener('transitionend', limparAnimacao);
    }

    const observadorEntrada = new IntersectionObserver(function (entradas, observador) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target); // anima só uma vez
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    elementos.forEach(function (elemento) {
      // Atraso em cascata: 0, 90, 180 ou 270 ms conforme a posição entre os irmãos
      const posicao = Array.prototype.indexOf.call(elemento.parentElement.children, elemento);
      elemento.style.setProperty('--atraso', ((posicao % 4) * 90) + 'ms');

      elemento.classList.add('reveal');
      elemento.addEventListener('transitionend', limparAnimacao);
      observadorEntrada.observe(elemento);
    });
  }

  iniciarAnimacoesDeEntrada();


  /* -------------------------------------------------------
     EXTRA: ANO AUTOMÁTICO NO RODAPÉ
     ------------------------------------------------------- */
  const anoAtual = document.getElementById('ano-atual');
  if (anoAtual) anoAtual.textContent = new Date().getFullYear();

})();
