// Configuração
const WHATSAPP_NUMBER = '5585989656293';
let cardapio = [];
let carrinho = [];
let precosMarmitas = { pequena: 15.00, grande: 20.00 };
let contadorMarmitas = 0;
let nomeCliente = '';
let nomeMarmitaCallback = null;
let confirmacaoCallback = null;
let dataCardapio = '';

// Sistema de Empresas
let empresas = [];
let trabalhadores = [];
let pedidoEmpresa = {
    empresaId: null,
    empresaNome: '',
    trabalhadorId: null,
    trabalhadorNome: ''
};
let callbackTipoPagamento = null;

// Variáveis temporárias do fluxo de pagamento/entrega
let pagamentoTemp = '';
let entregaTemp = '';
let taxaEntregaTemp = 0;
let enderecoTemp = '';
let marmitasParaEnviar = [];

// ========== CARREGAR DADOS ==========
function carregarDados() {
    try {
        const dataSalva = localStorage.getItem('dataCardapio');
        const hoje = new Date().toISOString().split('T')[0];
        
        if (dataSalva) {
            dataCardapio = dataSalva;
            document.getElementById('data-display').textContent = formatarData(dataSalva);
        } else {
            dataCardapio = hoje;
            localStorage.setItem('dataCardapio', hoje);
            document.getElementById('data-display').textContent = formatarData(hoje);
        }
        
        const chave = 'cardapio_' + dataCardapio;
        const dadosCardapio = localStorage.getItem(chave);
        
        if (dadosCardapio) {
            cardapio = JSON.parse(dadosCardapio);
            cardapio = cardapio.map(function(item) {
                if (item.categoria === 'bebidas' && !item.preco) {
                    item.preco = 0;
                }
                return item;
            });
        } else {
            cardapio = [];
            localStorage.setItem(chave, JSON.stringify([]));
        }
        
        const dadosPrecos = localStorage.getItem('precosMarmitas');
        if (dadosPrecos) {
            precosMarmitas = JSON.parse(dadosPrecos);
            document.getElementById('preco-pequena-display').textContent = precosMarmitas.pequena.toFixed(2).replace('.', ',');
            document.getElementById('preco-grande-display').textContent = precosMarmitas.grande.toFixed(2).replace('.', ',');
        }
        
        renderizarCardapio();
        atualizarCarrinho();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const container = document.getElementById('cardapio-container');
        if (container) {
            container.innerHTML = '<div class="cardapio-vazio-cliente"><p>⚠️ Erro ao carregar o cardápio</p><p style="font-size:0.9rem;color:#999;">Tente recarregar a página.</p></div>';
        }
    }
}

// Formatar data
function formatarData(data) {
    if (!data || data === 'undefined') return 'Data inválida';
    const partes = data.split('-');
    if (partes.length < 3) return 'Data inválida';
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return parseInt(partes[2]) + ' de ' + meses[parseInt(partes[1]) - 1] + ' de ' + partes[0];
}

// ========== SALVAR NOME DO CLIENTE ==========
function salvarNome() {
    const input = document.getElementById('input-nome');
    const nome = input.value.trim();
    
    if (!nome) {
        alert('Por favor, digite seu nome!');
        input.focus();
        return;
    }
    
    nomeCliente = nome;
    sessionStorage.setItem('nomeCliente', nome);
    
    const modal = document.getElementById('modal-nome');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        document.getElementById('conteudo-principal').style.display = 'block';
        document.getElementById('site-footer').style.display = 'block';
        document.getElementById('nome-cliente-header').textContent = nome;
        mostrarToast('Bem-vindo(a), ' + nome + '! Monte suas marmitas 😊');
        carregarDados();
    }, 300);
}

// ========== MODAL DE CONFIRMAÇÃO ==========
function mostrarConfirmacao(titulo, mensagem, callbackSim, callbackNao) {
    const modal = document.getElementById('modal-confirmacao');
    document.getElementById('confirmacao-titulo').textContent = titulo;
    document.getElementById('confirmacao-mensagem').textContent = mensagem;
    
    const btnSim = document.getElementById('confirmacao-sim');
    const btnNao = document.getElementById('confirmacao-nao');
    
    const novoBtnSim = btnSim.cloneNode(true);
    const novoBtnNao = btnNao.cloneNode(true);
    btnSim.parentNode.replaceChild(novoBtnSim, btnSim);
    btnNao.parentNode.replaceChild(novoBtnNao, btnNao);
    
    novoBtnSim.addEventListener('click', function() {
        fecharModalConfirmacao();
        if (callbackSim) callbackSim();
    });
    
    novoBtnNao.addEventListener('click', function() {
        fecharModalConfirmacao();
        if (callbackNao) callbackNao();
    });
    
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 50);
}

function fecharModalConfirmacao() {
    const modal = document.getElementById('modal-confirmacao');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 300);
}

// ========== MODAL NOME MARMITA ==========
function abrirModalNomeMarmita(callback) {
    nomeMarmitaCallback = callback;
    const modal = document.getElementById('modal-nome-marmita');
    const input = document.getElementById('input-nome-marmita');
    
    contadorMarmitas++;
    input.value = nomeCliente + ' - Marmita ' + contadorMarmitas;
    
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
        input.focus();
        input.select();
    }, 50);
}

function confirmarNomeMarmita() {
    const input = document.getElementById('input-nome-marmita');
    const nome = input.value.trim();
    
    if (!nome) {
        alert('Por favor, digite um nome para a marmita!');
        input.focus();
        return;
    }
    
    if (nomeMarmitaCallback) {
        nomeMarmitaCallback(nome);
        nomeMarmitaCallback = null;
    }
    
    fecharModalNomeMarmita();
}

function fecharModalNomeMarmita() {
    const modal = document.getElementById('modal-nome-marmita');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
        nomeMarmitaCallback = null;
    }, 300);
}

// ========== TOAST ==========
function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-mensagem';
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.classList.add('show'); }, 100);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function mostrarToastErro(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-mensagem erro';
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.classList.add('show'); }, 100);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ========== PROTEÍNAS ==========
function contarProteinas(marmita) {
    if (!marmita) return 0;
    let count = 0;
    marmita.itens.forEach(function(id) {
        const item = cardapio.find(function(i) { return i.id === id; });
        if (item && item.categoria === 'proteinas') {
            count++;
        }
    });
    return count;
}

function podeAdicionarProteina(marmita) {
    if (!marmita) return false;
    
    let temGuarnicao = false;
    let temSalada = false;
    
    marmita.itens.forEach(function(id) {
        const item = cardapio.find(function(i) { return i.id === id; });
        if (item) {
            if (item.categoria === 'guarnicao') temGuarnicao = true;
            if (item.categoria === 'saladas') temSalada = true;
        }
    });
    
    return temGuarnicao || temSalada;
}

// ========== RENDERIZAR CARDÁPIO ==========
function renderizarCardapio() {
    const container = document.getElementById('cardapio-container');
    const categorias = ['guarnicao', 'saladas', 'proteinas', 'bebidas'];
    const nomesCategorias = {
        'guarnicao': '🍚 Guarnições',
        'saladas': '🥗 Saladas',
        'proteinas': '🥩 Proteínas (máx. 2)',
        'bebidas': '🥤 Bebidas'
    };
    
    const marmitaAtual = carrinho.find(function(m) { return !m.finalizada; });
    const qtdProteinas = contarProteinas(marmitaAtual);
    const limiteAtingido = qtdProteinas >= 2;
    const temGuarnicaoOuSalada = podeAdicionarProteina(marmitaAtual);
    const proteinaBloqueada = !temGuarnicaoOuSalada;
    
    let html = '<div class="aviso-marmita">';
    html += '<p>💡 Clique nos itens para montar suas marmitas!</p>';
    html += '<p>🔄 Cada marmita é montada separadamente com seu próprio nome.</p>';
    html += '<p>⚠️ <strong>Escolha uma guarnição ou salada ANTES de escolher a proteína!</strong></p>';
    html += '<p>🥩 <strong>Limite de 2 proteínas por marmita!</strong></p>';
    html += '<p>🥤 Bebidas têm preço individual e são adicionadas separadamente.</p>';
    html += '</div>';
    
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    if (marmitasFinalizadas.length > 0) {
        html += '<div class="banner-marmitas">';
        html += '<h3>📦 Marmitas no Carrinho (' + marmitasFinalizadas.length + ')</h3>';
        html += '<div class="lista-marmitas-mini">';
        marmitasFinalizadas.forEach(function(m, i) {
            html += '<span class="mini-marmita" onclick="editarMarmitaCarrinho(' + i + ')">🍱 ' + m.nome + ' <small>(' + m.itens.length + ' itens)</small></span>';
        });
        html += '</div>';
        html += '<button onclick="abrirCarrinho()" class="btn-ver-carrinho">🛒 Ver Carrinho</button>';
        html += '</div>';
    }
    
    if (marmitaAtual) {
        const itensNomes = marmitaAtual.itens.map(function(id) {
            const item = cardapio.find(function(i) { return i.id === id; });
            return item ? item.nome : '';
        }).filter(function(nome) { return nome; });
        
        const proteinasNaMarmita = contarProteinas(marmitaAtual);
        const limiteAtingidoMsg = proteinasNaMarmita >= 2;
        
        html += '<div class="marmita-atual">';
        html += '<div class="marmita-header">';
        html += '<h3>🍱 ' + marmitaAtual.nome + '</h3>';
        html += '<button onclick="editarNomeMarmita()" class="btn-editar-nome" title="Editar nome">✏️</button>';
        html += '<span class="badge-proteinas ' + (limiteAtingidoMsg ? 'limite-atingido' : 'limite-normal') + '">🥩 ' + proteinasNaMarmita + '/2 proteínas</span>';
        html += '</div>';
        html += '<div class="itens-marmita-atual">';
        if (itensNomes.length > 0) {
            itensNomes.forEach(function(nome) {
                html += '<span class="badge-item">' + nome + '</span>';
            });
        } else {
            html += '<span style="color:#999;">Nenhum item selecionado</span>';
        }
        html += '</div>';
        html += '<div class="marmita-acoes">';
        html += '<button onclick="finalizarMarmita()" class="btn-finalizar-marmita" ' + (itensNomes.length === 0 ? 'disabled' : '') + '>✅ Finalizar Marmita</button>';
        html += '<button onclick="cancelarMarmita()" class="btn-cancelar-marmita">🗑️ Cancelar</button>';
        html += '</div>';
        html += '</div>';
    } else {
        html += '<div class="btn-criar-marmita">';
        html += '<button onclick="criarNovaMarmita()" class="btn-nova-marmita">➕ Criar Nova Marmita</button>';
        html += '</div>';
    }
    
    categorias.forEach(function(cat) {
        const itensCat = cardapio.filter(function(item) { return item.categoria === cat; });
        if (itensCat.length === 0) return;
        
        const isProteina = cat === 'proteinas';
        const limiteAtingidoCat = isProteina && limiteAtingido;
        const proteinaBloqueadaCat = isProteina && proteinaBloqueada;
        
        html += '<div class="categoria-section">';
        html += '<h2 class="categoria-titulo ' + cat + '">' + nomesCategorias[cat] + '</h2>';
        
        if (proteinaBloqueadaCat) {
            html += '<div class="aviso-limite" style="background:#fff3cd;border-color:#ffc107;color:#856404;">⚠️ Escolha uma guarnição ou salada primeiro para liberar as proteínas!</div>';
        }
        if (limiteAtingidoCat && !proteinaBloqueadaCat) {
            html += '<div class="aviso-limite">⚠️ Limite de 2 proteínas atingido! Remova uma para adicionar outra.</div>';
        }
        
        html += '<div class="cardapio-grid">';
        
        itensCat.forEach(function(item) {
            const estaNaMarmita = marmitaAtual && marmitaAtual.itens.includes(item.id);
            const isProteinaItem = item.categoria === 'proteinas';
            
            let estaBloqueado = false;
            let motivoBloqueio = '';
            
            if (isProteinaItem && !estaNaMarmita) {
                if (proteinaBloqueada) {
                    estaBloqueado = true;
                    motivoBloqueio = '🔒 Escolha guarnição/salada primeiro';
                } else if (limiteAtingido) {
                    estaBloqueado = true;
                    motivoBloqueio = '🔒 Limite atingido';
                }
            }
            
            const precoDisplay = item.categoria === 'bebidas' && item.preco > 0 ? 'R$ ' + item.preco.toFixed(2) : '';
            
            html += '<div class="card-item ' + item.categoria + ' ' + (estaNaMarmita ? 'selecionado' : '') + ' ' + (estaBloqueado ? 'bloqueado' : '') + '" ';
            html += 'onclick="' + (estaBloqueado ? '' : 'adicionarItemMarmita(' + item.id + ')') + '">';
            html += '<span class="categoria-label">' + item.categoria + '</span>';
            html += '<h3>' + item.nome + '</h3>';
            html += '<p class="descricao">' + (item.descricao || '') + '</p>';
            if (precoDisplay) {
                html += '<p class="preco-item">' + precoDisplay + '</p>';
            }
            html += '<div class="check-indicator">';
            if (estaNaMarmita) {
                html += '✅ Adicionado';
            } else if (estaBloqueado) {
                html += motivoBloqueio;
            } else {
                html += '➕ Clique para adicionar';
            }
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div></div>';
    });
    
    if (cardapio.length === 0) {
        html = '<div class="cardapio-vazio-cliente"><p>📭 Cardápio vazio para hoje!</p><p style="font-size:0.9rem;color:#999;">Volte mais tarde para ver as opções.</p></div>';
    }
    
    container.innerHTML = html;
}

// ========== CRIAR/EDITAR MARMITA ==========
function criarNovaMarmita() {
    const existeAberta = carrinho.some(function(m) { return !m.finalizada; });
    if (existeAberta) {
        mostrarConfirmacao(
            '⚠️ Marmita em aberto',
            'Você tem uma marmita em aberto. Deseja finalizá-la?',
            function() {
                const marmitaAberta = carrinho.find(function(m) { return !m.finalizada; });
                if (marmitaAberta && marmitaAberta.itens.length > 0) {
                    marmitaAberta.finalizada = true;
                    mostrarToast('✅ "' + marmitaAberta.nome + '" finalizada!');
                    setTimeout(function() { criarNovaMarmita(); }, 300);
                } else {
                    const index = carrinho.indexOf(marmitaAberta);
                    if (index > -1) carrinho.splice(index, 1);
                    setTimeout(function() { criarNovaMarmita(); }, 300);
                }
            },
            function() {
                mostrarToast('📝 Continuando com a marmita atual');
            }
        );
        return;
    }
    
    abrirModalNomeMarmita(function(nome) {
        const novaMarmita = {
            id: Date.now(),
            nome: nome,
            itens: [],
            tamanho: 'pequena',
            preco: precosMarmitas.pequena,
            finalizada: false
        };
        carrinho.push(novaMarmita);
        renderizarCardapio();
        atualizarCarrinho();
        mostrarToast('🍱 Nova marmita "' + novaMarmita.nome + '" criada!');
    });
}

function editarNomeMarmita() {
    const marmitaAtual = carrinho.find(function(m) { return !m.finalizada; });
    if (!marmitaAtual) return;
    
    const modal = document.getElementById('modal-nome-marmita');
    const input = document.getElementById('input-nome-marmita');
    input.value = marmitaAtual.nome;
    
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
        input.focus();
        input.select();
    }, 50);
    
    nomeMarmitaCallback = function(nome) {
        marmitaAtual.nome = nome;
        renderizarCardapio();
        mostrarToast('✏️ Nome alterado para "' + marmitaAtual.nome + '"');
        nomeMarmitaCallback = null;
    };
}

function adicionarItemMarmita(itemId) {
    let marmitaAtual = carrinho.find(function(m) { return !m.finalizada; });
    
    const item = cardapio.find(function(i) { return i.id === itemId; });
    const isProteina = item && item.categoria === 'proteinas';
    
    if (!marmitaAtual) {
        if (isProteina) {
            mostrarToastErro('⚠️ Escolha uma guarnição ou salada primeiro!');
            return;
        }
        
        abrirModalNomeMarmita(function(nome) {
            marmitaAtual = {
                id: Date.now(),
                nome: nome,
                itens: [itemId],
                tamanho: 'pequena',
                preco: precosMarmitas.pequena,
                finalizada: false
            };
            carrinho.push(marmitaAtual);
            renderizarCardapio();
            atualizarCarrinho();
            mostrarToast('🍱 Nova marmita "' + marmitaAtual.nome + '" criada!');
        });
        return;
    }
    
    const index = marmitaAtual.itens.indexOf(itemId);
    
    if (isProteina && index === -1) {
        if (!podeAdicionarProteina(marmitaAtual)) {
            mostrarToastErro('⚠️ Escolha uma guarnição ou salada primeiro!');
            return;
        }
        
        const qtdProteinas = contarProteinas(marmitaAtual);
        if (qtdProteinas >= 2) {
            mostrarToastErro('⚠️ Limite de 2 proteínas por marmita!');
            return;
        }
    }
    
    if (index > -1) {
        marmitaAtual.itens.splice(index, 1);
        if (marmitaAtual.itens.length === 0) {
            mostrarConfirmacao(
                '🗑️ Marmita vazia',
                'A marmita "' + marmitaAtual.nome + '" está vazia. Deseja removê-la?',
                function() {
                    const idx = carrinho.indexOf(marmitaAtual);
                    if (idx > -1) carrinho.splice(idx, 1);
                    renderizarCardapio();
                    atualizarCarrinho();
                    mostrarToast('🗑️ Marmita removida');
                },
                function() {
                    renderizarCardapio();
                }
            );
        }
    } else {
        marmitaAtual.itens.push(itemId);
    }
    
    renderizarCardapio();
    atualizarCarrinho();
}

function finalizarMarmita() {
    const marmitaAtual = carrinho.find(function(m) { return !m.finalizada; });
    if (!marmitaAtual) return;
    
    if (marmitaAtual.itens.length === 0) {
        alert('Adicione pelo menos um item à marmita!');
        return;
    }
    
    marmitaAtual.finalizada = true;
    renderizarCardapio();
    atualizarCarrinho();
    mostrarToast('✅ "' + marmitaAtual.nome + '" finalizada!');
    
    setTimeout(function() {
        mostrarConfirmacao(
            '🍱 Criar outra marmita?',
            'Deseja criar uma nova marmita agora?',
            function() {
                criarNovaMarmita();
            },
            function() {
                mostrarToast('👍 Pedido finalizado!');
            }
        );
    }, 500);
}

function cancelarMarmita() {
    const marmitaAtual = carrinho.find(function(m) { return !m.finalizada; });
    if (!marmitaAtual) return;
    
    mostrarConfirmacao(
        '🗑️ Cancelar marmita',
        'Deseja cancelar a marmita "' + marmitaAtual.nome + '"?',
        function() {
            const index = carrinho.indexOf(marmitaAtual);
            if (index > -1) carrinho.splice(index, 1);
            renderizarCardapio();
            atualizarCarrinho();
            mostrarToast('🗑️ Marmita cancelada');
        },
        function() {
            mostrarToast('👍 Mantendo a marmita');
        }
    );
}

function editarMarmitaCarrinho(index) {
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    if (index < 0 || index >= marmitasFinalizadas.length) return;
    
    const marmita = marmitasFinalizadas[index];
    const indexReal = carrinho.indexOf(marmita);
    
    if (indexReal === -1) return;
    
    carrinho[indexReal].finalizada = false;
    const marmitaMovida = carrinho.splice(indexReal, 1)[0];
    carrinho.push(marmitaMovida);
    
    fecharCarrinho();
    renderizarCardapio();
    atualizarCarrinho();
    mostrarToast('✏️ Editando "' + marmita.nome + '"');
}

// ========== CARRINHO ==========
function atualizarCarrinho() {
    const count = carrinho.filter(function(m) { return m.finalizada; }).length;
    const countElement = document.getElementById('carrinho-count');
    if (countElement) {
        countElement.textContent = count;
    }
    
    const totalFloat = calcularTotalCarrinho();
    const totalFloatElement = document.getElementById('total-carrinho-float');
    if (totalFloatElement) {
        totalFloatElement.textContent = totalFloat.toFixed(2);
    }
    
    // Mostrar/ocultar carrinho flutuante
    const carrinhoFlutuante = document.getElementById('carrinho-flutuante');
    if (carrinhoFlutuante) {
        if (count > 0) {
            carrinhoFlutuante.style.display = 'flex';
        } else {
            carrinhoFlutuante.style.display = 'none';
        }
    }
    
    const modal = document.getElementById('modal-carrinho');
    if (modal && modal.classList.contains('ativo')) {
        renderizarCarrinhoModal();
    }
}

function calcularTotalCarrinho() {
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    let total = 0;
    
    marmitasFinalizadas.forEach(function(marmita) {
        total += marmita.preco;
        marmita.itens.forEach(function(id) {
            const item = cardapio.find(function(i) { return i.id === id; });
            if (item && item.categoria === 'bebidas' && item.preco > 0) {
                total += item.preco;
            }
        });
    });
    
    return total;
}

function abrirCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        renderizarCarrinhoModal();
        modal.classList.add('ativo');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    if (modal) {
        modal.classList.remove('ativo');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========== RENDERIZAR CARRINHO (ESTILO APP) ==========
function renderizarCarrinhoModal() {
    const container = document.getElementById('carrinho-itens');
    const totalElement = document.getElementById('total-carrinho');
    const subtotalElement = document.getElementById('subtotal-carrinho');
    const countElement = document.getElementById('carrinho-app-count');
    
    if (!container) return;
    
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    
    if (countElement) {
        const totalItens = marmitasFinalizadas.length;
        countElement.textContent = totalItens === 0 ? 'Nenhum item' : 
                                    totalItens === 1 ? '1 marmita' : 
                                    totalItens + ' marmitas';
    }
    
    if (marmitasFinalizadas.length === 0) {
        container.innerHTML = `
            <div class="carrinho-app-vazio">
                <div class="carrinho-app-vazio-icone">🛒</div>
                <h3>Seu carrinho está vazio</h3>
                <p>Monte sua marmita clicando nos itens do cardápio</p>
            </div>
        `;
        if (totalElement) totalElement.textContent = '0.00';
        if (subtotalElement) subtotalElement.textContent = '0.00';
        return;
    }
    
    let html = '';
    let totalGeral = 0;
    
    marmitasFinalizadas.forEach(function(marmita, index) {
        const nomeTamanho = marmita.tamanho === 'pequena' ? 'Pequena' : 'Grande';
        let acompanhamentos = [];
        let proteinasNomes = [];
        let bebidasNomes = [];
        let totalBebidas = 0;
        
        marmita.itens.forEach(function(id) {
            const item = cardapio.find(function(i) { return i.id === id; });
            if (item) {
                if (item.categoria === 'bebidas' && item.preco > 0) {
                    bebidasNomes.push({ nome: item.nome, preco: item.preco });
                    totalBebidas += item.preco;
                } else if (item.categoria === 'proteinas') {
                    proteinasNomes.push(item.nome);
                } else {
                    acompanhamentos.push(item.nome);
                }
            }
        });
        
        const totalMarmita = marmita.preco + totalBebidas;
        totalGeral += totalMarmita;
        
        html += '<div class="app-marmita-card">';
        html += '<div class="app-marmita-header">';
        html += '<div class="app-marmita-nome">';
        html += '<h4>🍱 ' + marmita.nome + '</h4>';
        html += '<span class="app-marmita-tamanho">' + nomeTamanho + '</span>';
        html += '</div>';
        html += '<div class="app-marmita-acoes">';
        html += '<button class="app-btn-icon edit" onclick="editarMarmitaCarrinho(' + index + ')" title="Editar">✏️</button>';
        html += '<button class="app-btn-icon delete" onclick="removerMarmita(' + index + ')" title="Remover">🗑️</button>';
        html += '</div>';
        html += '</div>';
        
        if (acompanhamentos.length > 0) {
            html += '<div class="app-marmita-secao">';
            html += '<div class="app-marmita-secao-titulo">📋 Acompanhamentos</div>';
            html += '<div class="app-marmita-itens">';
            acompanhamentos.forEach(function(nome) {
                html += '<span class="app-item-badge">' + nome + '</span>';
            });
            html += '</div>';
            html += '</div>';
        }
        
        if (proteinasNomes.length > 0) {
            html += '<div class="app-marmita-secao">';
            html += '<div class="app-marmita-secao-titulo proteinas">🥩 Proteínas (' + proteinasNomes.length + '/2)</div>';
            html += '<div class="app-marmita-itens">';
            proteinasNomes.forEach(function(nome) {
                html += '<span class="app-item-badge proteina">' + nome + '</span>';
            });
            html += '</div>';
            html += '</div>';
        }
        
        if (bebidasNomes.length > 0) {
            html += '<div class="app-marmita-secao">';
            html += '<div class="app-marmita-secao-titulo bebidas">🥤 Bebidas</div>';
            html += '<div class="app-marmita-itens">';
            bebidasNomes.forEach(function(bebida) {
                html += '<span class="app-item-badge bebida">' + bebida.nome + ' (R$ ' + bebida.preco.toFixed(2) + ')</span>';
            });
            html += '</div>';
            html += '</div>';
        }
        
        html += '<div class="app-marmita-footer">';
        html += '<div class="app-tamanho-select">';
        html += '<label>Tam:</label>';
        html += '<select onchange="alterarTamanhoMarmita(' + index + ', this.value)">';
        html += '<option value="pequena" ' + (marmita.tamanho === 'pequena' ? 'selected' : '') + '>Pequena - R$ ' + precosMarmitas.pequena.toFixed(2) + '</option>';
        html += '<option value="grande" ' + (marmita.tamanho === 'grande' ? 'selected' : '') + '>Grande - R$ ' + precosMarmitas.grande.toFixed(2) + '</option>';
        html += '</select>';
        html += '</div>';
        html += '<div class="app-marmita-preco">R$ ' + totalMarmita.toFixed(2) + '</div>';
        html += '</div>';
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    if (totalElement) totalElement.textContent = totalGeral.toFixed(2);
    if (subtotalElement) subtotalElement.textContent = totalGeral.toFixed(2);
}

// ========== LIMPAR CARRINHO ==========
function limparCarrinho() {
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    
    if (marmitasFinalizadas.length === 0) {
        mostrarToast('🛒 O carrinho já está vazio');
        return;
    }
    
    mostrarConfirmacao(
        '🗑️ Limpar carrinho',
        'Deseja remover TODAS as marmitas do carrinho?',
        function() {
            carrinho = [];
            contadorMarmitas = 0;
            atualizarCarrinho();
            renderizarCarrinhoModal();
            renderizarCardapio();
            mostrarToast('🗑️ Carrinho limpo');
        },
        function() {
            mostrarToast('👍 Mantendo o carrinho');
        }
    );
}

// ========== ALTERAR TAMANHO ==========
function alterarTamanhoMarmita(index, novoTamanho) {
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    if (index < 0 || index >= marmitasFinalizadas.length) return;
    
    const marmita = marmitasFinalizadas[index];
    const indexReal = carrinho.indexOf(marmita);
    
    if (indexReal === -1) return;
    
    carrinho[indexReal].tamanho = novoTamanho;
    carrinho[indexReal].preco = precosMarmitas[novoTamanho];
    renderizarCarrinhoModal();
    atualizarCarrinho();
}

// ========== REMOVER MARMITA ==========
function removerMarmita(index) {
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    if (index < 0 || index >= marmitasFinalizadas.length) return;
    
    const marmita = marmitasFinalizadas[index];
    
    mostrarConfirmacao(
        '🗑️ Remover marmita',
        'Deseja remover "' + marmita.nome + '" do carrinho?',
        function() {
            const indexReal = carrinho.indexOf(marmita);
            if (indexReal !== -1) {
                carrinho.splice(indexReal, 1);
                atualizarCarrinho();
                renderizarCarrinhoModal();
                mostrarToast('🗑️ "' + marmita.nome + '" removida');
            }
        },
        function() {
            mostrarToast('👍 Mantendo a marmita');
        }
    );
}

// ========== SISTEMA DE EMPRESAS ==========
function carregarEmpresasCliente() {
    const dadosEmpresas = localStorage.getItem('empresas');
    empresas = dadosEmpresas ? JSON.parse(dadosEmpresas) : [];
    
    const dadosTrabalhadores = localStorage.getItem('trabalhadores');
    trabalhadores = dadosTrabalhadores ? JSON.parse(dadosTrabalhadores) : [];
}

function perguntarTipoPagamento(callback) {
    carregarEmpresasCliente();
    
    if (empresas.length === 0) {
        callback('pessoa');
        return;
    }
    
    callbackTipoPagamento = callback;
    
    const modal = document.getElementById('modal-identificacao');
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 50);
}

function selecionarTipoPagamento(tipo) {
    const modal = document.getElementById('modal-identificacao');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        
        if (tipo === 'pessoa') {
            pedidoEmpresa = {
                empresaId: null,
                empresaNome: '',
                trabalhadorId: null,
                trabalhadorNome: ''
            };
            if (callbackTipoPagamento) {
                callbackTipoPagamento('pessoa');
                callbackTipoPagamento = null;
            }
        } else {
            abrirModalEmpresa();
        }
    }, 300);
}

function abrirModalEmpresa() {
    carregarEmpresasCliente();
    
    const modal = document.getElementById('modal-empresa');
    const select = document.getElementById('select-empresa-cliente');
    
    var html = '<option value="">Selecione sua empresa</option>';
    empresas.forEach(function(emp) {
        html += '<option value="' + emp.id + '">' + emp.nome + '</option>';
    });
    select.innerHTML = html;
    
    document.getElementById('input-nome-trabalhador').value = nomeCliente;
    
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 50);
}

function fecharModalEmpresa() {
    const modal = document.getElementById('modal-empresa');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        callbackTipoPagamento = null;
    }, 300);
}

function confirmarEmpresa() {
    const empresaId = parseInt(document.getElementById('select-empresa-cliente').value);
    const nomeTrabalhador = document.getElementById('input-nome-trabalhador').value.trim();
    
    if (!empresaId) {
        alert('Por favor, selecione uma empresa!');
        return;
    }
    
    if (!nomeTrabalhador) {
        alert('Por favor, digite seu nome!');
        return;
    }
    
    const empresa = empresas.find(function(e) {
        return e.id === empresaId;
    });
    
    if (!empresa) {
        alert('Empresa não encontrada!');
        return;
    }
    
    pedidoEmpresa = {
        empresaId: empresaId,
        empresaNome: empresa.nome,
        trabalhadorId: null,
        trabalhadorNome: nomeTrabalhador
    };
    
    fecharModalEmpresa();
    
    if (callbackTipoPagamento) {
        callbackTipoPagamento('empresa');
        callbackTipoPagamento = null;
    }
}

// ========== FINALIZAR PEDIDO ==========
function finalizarPedido() {
    const marmitasFinalizadas = carrinho.filter(function(m) { return m.finalizada; });
    
    if (marmitasFinalizadas.length === 0) {
        alert('Adicione pelo menos uma marmita ao carrinho!');
        return;
    }
    
    perguntarTipoPagamento(function(tipo) {
        if (tipo === 'pessoa') {
            continuarFinalizacao(marmitasFinalizadas, false);
        } else {
            continuarFinalizacao(marmitasFinalizadas, true);
        }
    });
}

function continuarFinalizacao(marmitasFinalizadas, isEmpresa) {
    // Reset das variáveis
    pagamentoTemp = '';
    entregaTemp = '';
    taxaEntregaTemp = 0;
    enderecoTemp = '';
    marmitasParaEnviar = marmitasFinalizadas;
    
    // Se for empresa, pula pagamento/entrega
    if (isEmpresa) {
        pagamentoTemp = 'Empresa (cobrança)';
        entregaTemp = 'retirada';
        taxaEntregaTemp = 0;
        enderecoTemp = '';
        montarMensagemEEnviar(marmitasFinalizadas, true);
        return;
    }
    
    // Abrir modal de pagamento
    abrirModalPagamento();
}

// ========== MODAL DE PAGAMENTO ==========
function abrirModalPagamento() {
    const modal = document.getElementById('modal-pagamento');
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 50);
}

function selecionarPagamento(forma) {
    pagamentoTemp = forma;
    
    const modal = document.getElementById('modal-pagamento');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        abrirModalEntrega();
    }, 300);
}

// ========== MODAL DE ENTREGA ==========
function abrirModalEntrega() {
    const modal = document.getElementById('modal-entrega');
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 50);
}

function selecionarEntrega(tipo) {
    entregaTemp = tipo;
    
    const modal = document.getElementById('modal-entrega');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        
        if (tipo === 'delivery') {
            taxaEntregaTemp = 3.00;
            abrirModalEndereco();
        } else {
            taxaEntregaTemp = 0;
            enderecoTemp = '';
            montarMensagemEEnviar(marmitasParaEnviar, false);
        }
    }, 300);
}

// ========== MODAL DE ENDEREÇO ==========
function abrirModalEndereco() {
    const modal = document.getElementById('modal-endereco');
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    document.getElementById('input-endereco').value = '';
    document.getElementById('input-bairro').value = '';
    document.getElementById('input-referencia').value = '';
    
    setTimeout(function() {
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
        document.getElementById('input-endereco').focus();
    }, 50);
}

function confirmarEndereco() {
    const endereco = document.getElementById('input-endereco').value.trim();
    const bairro = document.getElementById('input-bairro').value.trim();
    const referencia = document.getElementById('input-referencia').value.trim();
    
    if (!endereco) {
        mostrarToastErro('⚠️ Digite o endereço!');
        document.getElementById('input-endereco').focus();
        return;
    }
    
    if (!bairro) {
        mostrarToastErro('⚠️ Digite o bairro!');
        document.getElementById('input-bairro').focus();
        return;
    }
    
    enderecoTemp = endereco + ' - ' + bairro;
    if (referencia) {
        enderecoTemp += ' (Ref: ' + referencia + ')';
    }
    
    const modal = document.getElementById('modal-endereco');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        montarMensagemEEnviar(marmitasParaEnviar, false);
    }, 300);
}

function cancelarEndereco() {
    const modal = document.getElementById('modal-endereco');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(function() {
        modal.style.display = 'none';
        abrirModalEntrega();
    }, 300);
}

// ========== MONTAR MENSAGEM E ENVIAR ==========
function montarMensagemEEnviar(marmitasFinalizadas, isEmpresa) {
    let formaPagamento = pagamentoTemp || 'Não informado';
    let tipoEntrega = entregaTemp === 'delivery' ? 'Delivery' : 'Retirada no local';
    let taxaEntrega = taxaEntregaTemp || 0;
    let endereco = enderecoTemp || '';
    
    let mensagem = '🍽️ *' + nomeCliente + ', seu pedido está em produção!*\n\n';
    mensagem += '📦 *Itens:*\n';
    
    let totalGeral = 0;
    
    marmitasFinalizadas.forEach(function(marmita, index) {
        const nomeTamanho = marmita.tamanho === 'pequena' ? 'Pequena' : 'Grande';
        let itensNomes = [];
        let bebidasNomes = [];
        let proteinasNomes = [];
        let totalBebidas = 0;
        
        marmita.itens.forEach(function(id) {
            const item = cardapio.find(function(i) { return i.id === id; });
            if (item) {
                if (item.categoria === 'bebidas' && item.preco > 0) {
                    bebidasNomes.push(item.nome + ' (R$ ' + item.preco.toFixed(2) + ')');
                    totalBebidas += item.preco;
                } else if (item.categoria === 'proteinas') {
                    proteinasNomes.push(item.nome);
                } else {
                    itensNomes.push(item.nome);
                }
            }
        });
        
        const totalMarmita = marmita.preco + totalBebidas;
        totalGeral += totalMarmita;
        
        mensagem += '\n➡️ *' + marmita.nome + ' - ' + nomeTamanho + '*\n';
        mensagem += '     *Escolha sua opção*\n';
        
        if (proteinasNomes.length > 0) {
            proteinasNomes.forEach(function(nome) {
                mensagem += '          🔹 1x ' + nome + '\n';
            });
        }
        
        const acompanhamentos = itensNomes.filter(function(nome) {
            const item = cardapio.find(function(i) { return i.nome === nome; });
            return item && (item.categoria === 'guarnicao' || item.categoria === 'saladas');
        });
        
        if (acompanhamentos.length > 0) {
            mensagem += '     _Acompanhamentos_\n';
            acompanhamentos.forEach(function(nome) {
                mensagem += '          🔹 1x ' + nome + '\n';
            });
        }
        
        if (bebidasNomes.length > 0) {
            mensagem += '     _Bebidas_\n';
            bebidasNomes.forEach(function(nome) {
                mensagem += '          🔹 1x ' + nome + '\n';
            });
        }
        
        mensagem += '     💰 Subtotal: R$ ' + totalMarmita.toFixed(2) + '\n';
    });
    
    const totalFinal = totalGeral + taxaEntrega;
    
    mensagem += '\n💳 *Pagamento:* ' + formaPagamento + '\n';
    
    if (isEmpresa) {
        mensagem += '🏢 *Empresa:* ' + pedidoEmpresa.empresaNome + '\n';
        mensagem += '👷 *Trabalhador:* ' + pedidoEmpresa.trabalhadorNome + '\n';
        mensagem += '📌 *Cobrança será feita à empresa*\n';
    } else {
        mensagem += '🛵 *' + tipoEntrega + '*';
        if (taxaEntrega > 0) {
            mensagem += ' (taxa de: R$ ' + taxaEntrega.toFixed(2) + ')';
        }
        mensagem += '\n';
        
        if (endereco) {
            mensagem += '🏠 ' + endereco + '\n';
        } else {
            mensagem += '📍 *Retirada:* No local\n';
        }
    }
    
    mensagem += '\n💰 *Total: R$ ' + totalFinal.toFixed(2) + '*\n\n';
    mensagem += '🙏 Obrigado pela preferência, se precisar de algo é só chamar! 😉';
    
    if (isEmpresa) {
        salvarPedidoEmpresa(marmitasFinalizadas);
    }
    
    const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(mensagem);
    
    try {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('❌ Erro ao abrir WhatsApp:', error);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(mensagem).then(function() {
                alert('✅ Pedido copiado! Cole no WhatsApp:\n\nNúmero: ' + WHATSAPP_NUMBER);
            });
        } else {
            alert('📱 Envie para: ' + WHATSAPP_NUMBER + '\n\n' + mensagem);
        }
        return;
    }
    
    setTimeout(function() {
        carrinho = [];
        contadorMarmitas = 0;
        pedidoEmpresa = {
            empresaId: null,
            empresaNome: '',
            trabalhadorId: null,
            trabalhadorNome: ''
        };
        pagamentoTemp = '';
        entregaTemp = '';
        taxaEntregaTemp = 0;
        enderecoTemp = '';
        marmitasParaEnviar = [];
        atualizarCarrinho();
        fecharCarrinho();
        renderizarCardapio();
        mostrarToast('📱 Pedido enviado com sucesso!');
    }, 1000);
}

// ========== SALVAR PEDIDO DA EMPRESA ==========
function salvarPedidoEmpresa(marmitasFinalizadas) {
    const dadosTrabalhadores = localStorage.getItem('trabalhadores');
    let trabalhadoresAtuais = dadosTrabalhadores ? JSON.parse(dadosTrabalhadores) : [];
    
    marmitasFinalizadas.forEach(function(marmita) {
        let totalBebidas = 0;
        marmita.itens.forEach(function(id) {
            const item = cardapio.find(function(i) { return i.id === id; });
            if (item && item.categoria === 'bebidas' && item.preco > 0) {
                totalBebidas += item.preco;
            }
        });
        const valorMarmita = marmita.preco + totalBebidas;
        
        let nomeTrabalhador = marmita.nome;
        nomeTrabalhador = nomeTrabalhador.replace(/\s*-\s*Marmita\s*\d*\s*$/i, '').trim();
        
        if (!nomeTrabalhador) {
            nomeTrabalhador = pedidoEmpresa.trabalhadorNome;
        }
        
        let trabalhadorEncontrado = trabalhadoresAtuais.find(function(t) {
            return t.empresaId === pedidoEmpresa.empresaId && 
                   t.nome.toLowerCase() === nomeTrabalhador.toLowerCase();
        });
        
        if (trabalhadorEncontrado) {
            trabalhadorEncontrado.valor = parseFloat(trabalhadorEncontrado.valor || 0) + valorMarmita;
        } else {
            const novoTrabalhador = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                empresaId: pedidoEmpresa.empresaId,
                nome: nomeTrabalhador,
                valor: valorMarmita
            };
            trabalhadoresAtuais.push(novoTrabalhador);
        }
    });
    
    localStorage.setItem('trabalhadores', JSON.stringify(trabalhadoresAtuais));
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('modal-nome').style.display = 'flex';
    setTimeout(function() { document.getElementById('input-nome').focus(); }, 100);
    
    document.getElementById('input-nome').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') salvarNome();
    });
    
    document.getElementById('input-nome-marmita').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') confirmarNomeMarmita();
    });
    
    window.onclick = function(event) {
        const modal = document.getElementById('modal-carrinho');
        if (event.target === modal) fecharCarrinho();
    };
});