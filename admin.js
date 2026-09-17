// Configuração
const WHATSAPP_NUMBER = '5585989133731';
let itens = [];
let editandoId = null;
let dataAtual = '';
let empresas = [];
let trabalhadores = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('preco-item-container').style.display = 'none';
    
    document.getElementById('categoria').addEventListener('change', function() {
        const precoContainer = document.getElementById('preco-item-container');
        const precoInput = document.getElementById('preco-item');
        
        if (this.value === 'bebidas') {
            precoContainer.style.display = 'block';
            precoInput.required = true;
            precoInput.placeholder = 'Ex: 6.00';
        } else {
            precoContainer.style.display = 'none';
            precoInput.required = false;
            precoInput.value = '';
            precoInput.placeholder = 'Ex: 6.00';
        }
    });
    
    document.getElementById('data-cardapio').addEventListener('change', function() {
        mudarDataAutomatico();
    });
    
    document.querySelector('.form-section button[type="submit"]').addEventListener('click', function() {
        if (!document.getElementById('item-id').value) {
            document.querySelector('.form-section h2').textContent = 'Adicionar Novo Item';
            this.textContent = 'Salvar Item';
        }
    });
    
    // Formulários de empresa
    document.getElementById('empresa-form').addEventListener('submit', salvarEmpresa);
    document.getElementById('trabalhador-form').addEventListener('submit', salvarTrabalhador);
    
    carregarDados();
    carregarEmpresas();
});

// ========== SISTEMA DE ABAS ==========
function mudarAba(aba) {
    document.querySelectorAll('.aba-conteudo').forEach(function(el) {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn').forEach(function(el) {
        el.classList.remove('active');
    });
    
    document.getElementById('aba-' + aba).style.display = 'block';
    event.target.classList.add('active');
    
    if (aba === 'empresas') {
        carregarEmpresas();
    }
}

// ========== CARREGAR DADOS DO CARDÁPIO ==========
function carregarDados() {
    limparCardapiosAntigos();
    
    const dataSalva = localStorage.getItem('dataCardapio');
    const hoje = new Date().toISOString().split('T')[0];
    
    if (dataSalva) {
        dataAtual = dataSalva;
        document.getElementById('data-cardapio').value = dataSalva;
        carregarCardapioDoDia(dataSalva);
    } else {
        dataAtual = hoje;
        localStorage.setItem('dataCardapio', hoje);
        document.getElementById('data-cardapio').value = hoje;
        itens = [];
        localStorage.setItem('cardapio_' + hoje, JSON.stringify([]));
        document.getElementById('data-atual-display').textContent = '📅 Cardápio do dia: ' + formatarData(hoje) + ' - Novo dia! Preencha o cardápio.';
    }
    
    renderizarLista();
    
    const precos = localStorage.getItem('precosMarmitas');
    if (precos) {
        const dadosPrecos = JSON.parse(precos);
        document.getElementById('preco-pequena').value = dadosPrecos.pequena;
        document.getElementById('preco-grande').value = dadosPrecos.grande;
    }
}

function limparCardapiosAntigos() {
    const hoje = new Date();
    const chaves = Object.keys(localStorage);
    const cardapios = chaves.filter(function(key) {
        return key.startsWith('cardapio_');
    });
    
    cardapios.forEach(function(chave) {
        const dataStr = chave.replace('cardapio_', '');
        const partes = dataStr.split('-');
        if (partes.length < 3) return;
        const dataCardapio = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        
        const diffTime = hoje.getTime() - dataCardapio.getTime();
        const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDias > 7) {
            localStorage.removeItem(chave);
        }
    });
}

function carregarCardapioDoDia(data) {
    const chave = 'cardapio_' + data;
    const dados = localStorage.getItem(chave);
    
    if (dados) {
        itens = JSON.parse(dados);
        document.getElementById('data-atual-display').textContent = '📅 Cardápio do dia: ' + formatarData(data) + ' - ' + itens.length + ' itens';
    } else {
        itens = [];
        localStorage.setItem(chave, JSON.stringify([]));
        document.getElementById('data-atual-display').textContent = '📅 Cardápio do dia: ' + formatarData(data) + ' - Novo dia! Preencha o cardápio.';
    }
    
    renderizarLista();
}

function formatarData(data) {
    if (!data || data === 'undefined') return 'Data inválida';
    const partes = data.split('-');
    if (partes.length < 3) return 'Data inválida';
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return parseInt(partes[2]) + ' de ' + meses[parseInt(partes[1]) - 1] + ' de ' + partes[0];
}

function mudarDataAutomatico() {
    const data = document.getElementById('data-cardapio').value;
    if (!data) return;
    
    if (data !== dataAtual) {
        if (itens.length > 0) {
            const chaveAntiga = 'cardapio_' + dataAtual;
            localStorage.setItem(chaveAntiga, JSON.stringify(itens));
        }
        
        dataAtual = data;
        localStorage.setItem('dataCardapio', data);
        
        carregarCardapioDoDia(data);
        
        const seletor = document.getElementById('seletor-datas');
        if (seletor) seletor.style.display = 'none';
        
        mostrarToastAdmin('📋 Cardápio de ' + formatarData(data) + ' carregado!', 'info');
    }
}

function mostrarSeletorDatas() {
    const seletor = document.getElementById('seletor-datas');
    const lista = document.getElementById('lista-datas');
    
    const chaves = Object.keys(localStorage);
    const cardapios = chaves.filter(function(key) {
        return key.startsWith('cardapio_');
    });
    
    if (cardapios.length === 0) {
        lista.innerHTML = '<p style="color:#666;">Nenhum cardápio salvo no histórico.</p>';
        seletor.style.display = 'block';
        return;
    }
    
    cardapios.sort(function(a, b) {
        return b.replace('cardapio_', '').localeCompare(a.replace('cardapio_', ''));
    });
    
    var html = '';
    cardapios.forEach(function(chave) {
        const data = chave.replace('cardapio_', '');
        const dados = JSON.parse(localStorage.getItem(chave));
        const qtd = dados ? dados.length : 0;
        const isHoje = data === dataAtual;
        const dataFormatada = formatarData(data);
        
        if (dataFormatada !== 'Data inválida') {
            html += '<button onclick="carregarCardapioDeData(\'' + data + '\')" style="padding:10px 20px; border:2px solid ' + (isHoje ? '#27ae60' : '#8e44ad') + '; border-radius:8px; background:' + (isHoje ? '#d4edda' : 'white') + '; cursor:pointer; font-weight:' + (isHoje ? 'bold' : 'normal') + ';">📅 ' + dataFormatada + (isHoje ? ' (HOJE)' : '') + '<br><small style="color:#666;">' + qtd + ' itens</small></button>';
        }
    });
    
    lista.innerHTML = html;
    seletor.style.display = 'block';
}

function fecharSeletorDatas() {
    document.getElementById('seletor-datas').style.display = 'none';
}

function carregarCardapioDeData(data) {
    if (!data || data === 'undefined') {
        mostrarToastAdmin('❌ Data inválida!', 'erro');
        return;
    }
    
    if (itens.length > 0) {
        const chaveAntiga = 'cardapio_' + dataAtual;
        localStorage.setItem(chaveAntiga, JSON.stringify(itens));
    }
    
    dataAtual = data;
    localStorage.setItem('dataCardapio', data);
    document.getElementById('data-cardapio').value = data;
    
    carregarCardapioDoDia(data);
    fecharSeletorDatas();
    
    mostrarToastAdmin('📋 Cardápio de ' + formatarData(data) + ' carregado!', 'info');
}

function salvarDataCardapio() {
    const data = document.getElementById('data-cardapio').value;
    if (!data) {
        mostrarToastAdmin('❌ Por favor, selecione uma data!', 'erro');
        return;
    }
    
    if (itens.length > 0) {
        const chaveAntiga = 'cardapio_' + dataAtual;
        localStorage.setItem(chaveAntiga, JSON.stringify(itens));
    }
    
    dataAtual = data;
    localStorage.setItem('dataCardapio', data);
    
    itens = [];
    localStorage.setItem('cardapio_' + data, JSON.stringify([]));
    document.getElementById('data-atual-display').textContent = '📅 Cardápio do dia: ' + formatarData(data) + ' - Novo dia! Preencha o cardápio.';
    renderizarLista();
    
    limparCardapiosAntigos();
    
    mostrarToastAdmin('✅ Cardápio de ' + formatarData(data) + ' resetado!', 'sucesso');
}

function salvarPrecos() {
    const pequena = parseFloat(document.getElementById('preco-pequena').value);
    const grande = parseFloat(document.getElementById('preco-grande').value);
    
    if (isNaN(pequena) || isNaN(grande) || pequena <= 0 || grande <= 0) {
        mostrarToastAdmin('❌ Insira valores válidos para os preços.', 'erro');
        return;
    }
    
    localStorage.setItem('precosMarmitas', JSON.stringify({ pequena: pequena, grande: grande }));
    mostrarToastAdmin('✅ Preços atualizados!', 'sucesso');
}

function mostrarToastAdmin(mensagem, tipo) {
    if (tipo === undefined) tipo = 'sucesso';
    
    const toastExistente = document.querySelector('.toast-admin');
    if (toastExistente) toastExistente.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-admin ' + tipo;
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.classList.add('show'); }, 100);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function renderizarLista() {
    const container = document.getElementById('items-container');
    const categorias = ['guarnicao', 'saladas', 'proteinas', 'bebidas'];
    const nomesCategorias = {
        'guarnicao': '🍚 Guarnições',
        'saladas': '🥗 Saladas',
        'proteinas': '🥩 Proteínas',
        'bebidas': '🥤 Bebidas'
    };
    
    var html = '';
    
    if (itens.length === 0) {
        html = '<div class="cardapio-vazio"><p>📭 Nenhum item cadastrado para este dia.</p><p style="font-size:0.9rem;color:#999;">Adicione os itens do cardápio abaixo.</p></div>';
        container.innerHTML = html;
        return;
    }
    
    categorias.forEach(function(cat) {
        const itensCat = itens.filter(function(item) {
            return item.categoria === cat;
        });
        if (itensCat.length === 0) return;
        
        html += '<div class="admin-categoria"><h3>' + nomesCategorias[cat] + '</h3>';
        
        itensCat.forEach(function(item) {
            var precoDisplay = 'Incluso na marmita';
            if (item.categoria === 'bebidas' && item.preco > 0) {
                precoDisplay = 'R$ ' + item.preco.toFixed(2);
            }
            
            html += '<div class="admin-item"><div class="admin-item-info"><h4>' + item.nome + '</h4>';
            if (item.descricao) {
                html += '<p>' + item.descricao + '</p>';
            }
            html += '<p style="color:#3498db;font-weight:bold;">' + precoDisplay + '</p></div>';
            html += '<div class="admin-item-actions">';
            html += '<button class="edit-btn" onclick="editarItem(' + item.id + ')">✏️ Editar</button>';
            html += '<button onclick="excluirItem(' + item.id + ')">🗑️ Excluir</button>';
            html += '</div></div>';
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function salvarItens() {
    const chave = 'cardapio_' + dataAtual;
    localStorage.setItem(chave, JSON.stringify(itens));
    renderizarLista();
    document.getElementById('data-atual-display').textContent = '📅 Cardápio do dia: ' + formatarData(dataAtual) + ' - ' + itens.length + ' itens';
}

document.getElementById('item-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const categoria = document.getElementById('categoria').value;
    const precoInput = document.getElementById('preco-item').value.trim();
    const id = document.getElementById('item-id').value;
    
    if (!nome) {
        mostrarToastAdmin('❌ Digite o nome do item!', 'erro');
        return;
    }
    
    var preco = 0;
    if (categoria === 'bebidas') {
        if (!precoInput) {
            mostrarToastAdmin('❌ Insira o preço da bebida!', 'erro');
            return;
        }
        preco = parseFloat(precoInput);
        if (isNaN(preco) || preco <= 0) {
            mostrarToastAdmin('❌ Preço inválido!', 'erro');
            return;
        }
    }
    
    if (id) {
        const index = itens.findIndex(function(i) { return i.id === parseInt(id); });
        if (index !== -1) {
            itens[index] = { id: parseInt(id), nome: nome, descricao: descricao || '', categoria: categoria, preco: preco };
        }
        document.getElementById('item-id').value = '';
        document.querySelector('.form-section h2').textContent = 'Adicionar Novo Item';
        document.querySelector('.form-section button[type="submit"]').textContent = 'Salvar Item';
        mostrarToastAdmin('✅ Item atualizado!', 'sucesso');
    } else {
        itens.push({ id: Date.now(), nome: nome, descricao: descricao || '', categoria: categoria, preco: preco });
        mostrarToastAdmin('✅ Item adicionado!', 'sucesso');
    }
    
    salvarItens();
    document.getElementById('item-form').reset();
    document.getElementById('preco-item').value = '';
    document.getElementById('preco-item-container').style.display = 'none';
});

function editarItem(id) {
    const item = itens.find(function(i) { return i.id === id; });
    if (!item) return;
    
    document.getElementById('item-id').value = item.id;
    document.getElementById('nome').value = item.nome;
    document.getElementById('descricao').value = item.descricao || '';
    document.getElementById('categoria').value = item.categoria;
    
    if (item.categoria === 'bebidas') {
        document.getElementById('preco-item-container').style.display = 'block';
        document.getElementById('preco-item').value = item.preco;
        document.getElementById('preco-item').required = true;
    } else {
        document.getElementById('preco-item-container').style.display = 'none';
        document.getElementById('preco-item').value = '';
        document.getElementById('preco-item').required = false;
    }
    
    document.querySelector('.form-section h2').textContent = '✏️ Editar Item';
    document.querySelector('.form-section button[type="submit"]').textContent = 'Atualizar Item';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function excluirItem(id) {
    if (confirm('Excluir este item?')) {
        itens = itens.filter(function(i) { return i.id !== id; });
        salvarItens();
        mostrarToastAdmin('✅ Item excluído!', 'sucesso');
    }
}

// ========== SISTEMA DE EMPRESAS ==========
function carregarEmpresas() {
    const dadosEmpresas = localStorage.getItem('empresas');
    empresas = dadosEmpresas ? JSON.parse(dadosEmpresas) : [];
    
    const dadosTrabalhadores = localStorage.getItem('trabalhadores');
    trabalhadores = dadosTrabalhadores ? JSON.parse(dadosTrabalhadores) : [];
    
    renderizarEmpresas();
    atualizarSelectEmpresas();
}

function atualizarSelectEmpresas() {
    const select = document.getElementById('empresa-trabalhador');
    if (!select) return;
    
    var html = '<option value="">Selecione uma empresa</option>';
    empresas.forEach(function(emp) {
        html += '<option value="' + emp.id + '">' + emp.nome + '</option>';
    });
    select.innerHTML = html;
}

function renderizarEmpresas() {
    const container = document.getElementById('empresas-container');
    if (!container) return;
    
    if (empresas.length === 0) {
        container.innerHTML = '<div class="cardapio-vazio"><p>📭 Nenhuma empresa cadastrada.</p></div>';
        return;
    }
    
    var html = '';
    
    empresas.forEach(function(emp) {
        const trabalhadoresEmp = trabalhadores.filter(function(t) {
            return t.empresaId === emp.id;
        });
        
        var totalEmpresa = 0;
        trabalhadoresEmp.forEach(function(t) {
            totalEmpresa += parseFloat(t.valor) || 0;
        });
        
        const tipoPag = emp.tipoPagamento === 'semanal' ? '📅 Semanal (segunda)' : '📆 Mensal (fim do mês)';
        
        html += '<div class="empresa-card">';
        html += '<div class="empresa-header">';
        html += '<h3>🏢 ' + emp.nome + '</h3>';
        html += '<span class="empresa-tipo">' + tipoPag + '</span>';
        html += '</div>';
        
        html += '<div class="empresa-info">';
        html += '<p><strong>Total gasto:</strong> R$ ' + totalEmpresa.toFixed(2) + '</p>';
        html += '<p><strong>Trabalhadores:</strong> ' + trabalhadoresEmp.length + '</p>';
        html += '</div>';
        
        if (trabalhadoresEmp.length > 0) {
            html += '<div class="trabalhadores-lista">';
            trabalhadoresEmp.forEach(function(t) {
                html += '<div class="trabalhador-item">';
                html += '<span>👷 ' + t.nome + '</span>';
                html += '<span class="valor-trabalhador">R$ ' + parseFloat(t.valor).toFixed(2) + '</span>';
                html += '<button onclick="editarTrabalhador(' + t.id + ')" class="btn-mini-edit">✏️</button>';
                html += '<button onclick="excluirTrabalhador(' + t.id + ')" class="btn-mini-del">🗑️</button>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            html += '<p style="color:#999;font-size:0.9rem;">Nenhum trabalhador cadastrado.</p>';
        }
        
        html += '<div class="empresa-actions">';
        html += '<button onclick="editarEmpresa(' + emp.id + ')" class="btn-editar-empresa">✏️ Editar Empresa</button>';
        html += '<button onclick="excluirEmpresa(' + emp.id + ')" class="btn-excluir-empresa">🗑️ Excluir Empresa</button>';
        html += '</div>';
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function salvarEmpresa(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome-empresa').value.trim();
    const tipoPagamento = document.getElementById('tipo-pagamento').value;
    const id = document.getElementById('empresa-id').value;
    
    if (!nome) {
        mostrarToastAdmin('❌ Digite o nome da empresa!', 'erro');
        return;
    }
    
    if (id) {
        const index = empresas.findIndex(function(emp) { return emp.id === parseInt(id); });
        if (index !== -1) {
            empresas[index] = { id: parseInt(id), nome: nome, tipoPagamento: tipoPagamento };
        }
        document.getElementById('empresa-id').value = '';
        document.querySelector('#empresa-form button[type="submit"]').textContent = 'Salvar Empresa';
        mostrarToastAdmin('✅ Empresa atualizada!', 'sucesso');
    } else {
        empresas.push({ id: Date.now(), nome: nome, tipoPagamento: tipoPagamento });
        mostrarToastAdmin('✅ Empresa cadastrada!', 'sucesso');
    }
    
    localStorage.setItem('empresas', JSON.stringify(empresas));
    document.getElementById('empresa-form').reset();
    renderizarEmpresas();
    atualizarSelectEmpresas();
}

function editarEmpresa(id) {
    const emp = empresas.find(function(e) { return e.id === id; });
    if (!emp) return;
    
    document.getElementById('empresa-id').value = emp.id;
    document.getElementById('nome-empresa').value = emp.nome;
    document.getElementById('tipo-pagamento').value = emp.tipoPagamento;
    document.querySelector('#empresa-form button[type="submit"]').textContent = 'Atualizar Empresa';
    document.querySelector('#empresa-form').scrollIntoView({ behavior: 'smooth' });
}

function excluirEmpresa(id) {
    if (!confirm('Excluir esta empresa? Todos os trabalhadores serão removidos.')) return;
    
    empresas = empresas.filter(function(e) { return e.id !== id; });
    trabalhadores = trabalhadores.filter(function(t) { return t.empresaId !== id; });
    
    localStorage.setItem('empresas', JSON.stringify(empresas));
    localStorage.setItem('trabalhadores', JSON.stringify(trabalhadores));
    
    renderizarEmpresas();
    atualizarSelectEmpresas();
    mostrarToastAdmin('✅ Empresa excluída!', 'sucesso');
}

function salvarTrabalhador(e) {
    e.preventDefault();
    
    const empresaId = parseInt(document.getElementById('empresa-trabalhador').value);
    const nome = document.getElementById('nome-trabalhador').value.trim();
    const valor = parseFloat(document.getElementById('valor-trabalhador').value);
    const id = document.getElementById('trabalhador-id').value;
    
    if (!empresaId) {
        mostrarToastAdmin('❌ Selecione uma empresa!', 'erro');
        return;
    }
    
    if (!nome) {
        mostrarToastAdmin('❌ Digite o nome do trabalhador!', 'erro');
        return;
    }
    
    if (isNaN(valor) || valor < 0) {
        mostrarToastAdmin('❌ Insira um valor válido!', 'erro');
        return;
    }
    
    if (id) {
        const index = trabalhadores.findIndex(function(t) { return t.id === parseInt(id); });
        if (index !== -1) {
            trabalhadores[index] = { id: parseInt(id), empresaId: empresaId, nome: nome, valor: valor };
        }
        document.getElementById('trabalhador-id').value = '';
        document.querySelector('#trabalhador-form button[type="submit"]').textContent = 'Salvar Trabalhador';
        mostrarToastAdmin('✅ Trabalhador atualizado!', 'sucesso');
    } else {
        trabalhadores.push({ id: Date.now(), empresaId: empresaId, nome: nome, valor: valor });
        mostrarToastAdmin('✅ Trabalhador cadastrado!', 'sucesso');
    }
    
    localStorage.setItem('trabalhadores', JSON.stringify(trabalhadores));
    document.getElementById('trabalhador-form').reset();
    renderizarEmpresas();
}

function editarTrabalhador(id) {
    const t = trabalhadores.find(function(t) { return t.id === id; });
    if (!t) return;
    
    document.getElementById('trabalhador-id').value = t.id;
    document.getElementById('empresa-trabalhador').value = t.empresaId;
    document.getElementById('nome-trabalhador').value = t.nome;
    document.getElementById('valor-trabalhador').value = t.valor;
    document.querySelector('#trabalhador-form button[type="submit"]').textContent = 'Atualizar Trabalhador';
    document.querySelector('#trabalhador-form').scrollIntoView({ behavior: 'smooth' });
}

function excluirTrabalhador(id) {
    if (!confirm('Excluir este trabalhador?')) return;
    
    trabalhadores = trabalhadores.filter(function(t) { return t.id !== id; });
    localStorage.setItem('trabalhadores', JSON.stringify(trabalhadores));
    renderizarEmpresas();
    mostrarToastAdmin('✅ Trabalhador excluído!', 'sucesso');
}