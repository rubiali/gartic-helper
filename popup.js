// Elementos da interface
const statusElement = document.getElementById('status');
const wordCountElement = document.getElementById('word-count');
const pageStatusElement = document.getElementById('page-status');
const activateBtn = document.getElementById('activate-btn');
const settingsBtn = document.getElementById('settings-btn');
const helpBtn = document.getElementById('help-btn');
const aboutBtn = document.getElementById('about-btn');
const statsCard = document.getElementById('stats-card');

// Estado da extensão
let isActive = false;
let currentTab = null;

// Inicializar popup
document.addEventListener('DOMContentLoaded', async () => {
    await initializePopup();
    setupEventListeners();
    startStatusMonitoring();
});

// Inicializar estado do popup
async function initializePopup() {
    try {
        // Obter aba atual
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;

        // Verificar se é uma página válida
        updatePageStatus(tab.url);

        // Carregar configurações salvas
        const result = await chrome.storage.local.get(['isActive', 'stats']);
        isActive = result.isActive || false;
        
        updateStatus();
        updateWordCount();

        // Mostrar estatísticas se houver
        if (result.stats) {
            updateStats(result.stats);
            statsCard.style.display = 'block';
        }

    } catch (error) {
        console.error('Erro ao inicializar popup:', error);
        updateStatus('Erro');
    }
}

// Configurar event listeners
function setupEventListeners() {
    activateBtn.addEventListener('click', toggleAssistant);
    settingsBtn.addEventListener('click', openSettings);
    helpBtn.addEventListener('click', showHelp);
    aboutBtn.addEventListener('click', showAbout);
}

// Alternar estado do assistente
async function toggleAssistant() {
    try {
        if (!currentTab) return;

        isActive = !isActive;
        
        // Salvar estado
        await chrome.storage.local.set({ isActive });

        // Enviar mensagem para content script
        await chrome.tabs.sendMessage(currentTab.id, {
            action: isActive ? 'activate' : 'deactivate'
        });

        updateStatus();
        
    } catch (error) {
        console.error('Erro ao alternar assistente:', error);
        showNotification('Erro ao comunicar com a página', 'error');
    }
}

// Atualizar status visual
function updateStatus(status = null) {
    if (status) {
        statusElement.textContent = status;
        statusElement.className = 'status-value error';
        activateBtn.disabled = true;
        return;
    }

    if (isActive) {
        statusElement.textContent = 'Ativo';
        statusElement.className = 'status-value active';
        activateBtn.innerHTML = '<span class="btn-icon">💤</span>Desativar';
        activateBtn.className = 'control-btn deactivate';
    } else {
        statusElement.textContent = 'Desativado';
        statusElement.className = 'status-value inactive';
        activateBtn.innerHTML = '<span class="btn-icon">⚡</span>Ativar Assistente';
        activateBtn.className = 'control-btn activate';
    }
}

// Atualizar status da página
function updatePageStatus(url) {
    if (!url) {
        pageStatusElement.textContent = 'URL inválida';
        pageStatusElement.className = 'status-value error';
        return;
    }

    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        pageStatusElement.textContent = 'Página interna';
        pageStatusElement.className = 'status-value warning';
        activateBtn.disabled = true;
        showNotification('Não é possível usar em páginas internas do Chrome', 'warning');
        return;
    }

    pageStatusElement.textContent = 'Compatível';
    pageStatusElement.className = 'status-value active';
    activateBtn.disabled = false;
}

// Atualizar contagem de palavras
function updateWordCount() {
    // Número de palavras na base de dados
    const totalWords = 150; // Ajuste conforme sua lista
    wordCountElement.textContent = `${totalWords}`;
    wordCountElement.className = 'status-value active';
}

// Atualizar estatísticas
function updateStats(stats) {
    document.getElementById('suggestions-made').textContent = stats.suggestions || 0;
    document.getElementById('words-found').textContent = stats.wordsFound || 0;
    document.getElementById('accuracy').textContent = `${stats.accuracy || 0}%`;
}

// Monitorar status periodicamente
function startStatusMonitoring() {
    setInterval(async () => {
        if (currentTab) {
            try {
                const response = await chrome.tabs.sendMessage(currentTab.id, {
                    action: 'getStatus'
                });
                
                if (response && response.stats) {
                    updateStats(response.stats);
                    statsCard.style.display = 'block';
                }
            } catch (error) {
                // Ignorar erros silenciosamente (content script pode não estar carregado)
            }
        }
    }, 2000);
}

// Abrir configurações
function openSettings() {
    showNotification('Configurações em desenvolvimento', 'info');
}

// Mostrar ajuda
function showHelp() {
    const helpContent = `
        <div class="help-content">
            <h3>Como usar o Word Game Assistant:</h3>
            <ol>
                <li>Navegue até a página do jogo de palavras</li>
                <li>Clique em "Ativar Assistente" neste popup</li>
                <li>O assistente aparecerá no canto superior direito</li>
                <li>As sugestões serão mostradas automaticamente</li>
                <li>Clique em uma sugestão para copiá-la</li>
            </ol>
            
            <h3>Atalhos de teclado:</h3>
            <ul>
                <li><kbd>Ctrl+Shift+W</kbd> - Ativar/Desativar assistente</li>
            </ul>
            
            <h3>Recursos:</h3>
            <ul>
                <li>✅ Detecção automática de padrões</li>
                <li>✅ Sugestões em tempo real</li>
                <li>✅ Sistema de confiança das sugestões</li>
                <li>✅ Interface neon moderna</li>
                <li>✅ Cópia com um clique</li>
            </ul>
        </div>
    `;
    
    showModal('Ajuda', helpContent);
}

// Mostrar sobre
function showAbout() {
    const aboutContent = `
        <div class="about-content">
            <h3>Word Game Assistant v1.0</h3>
            <p>Uma extensão inteligente para ajudar em jogos de palavras, desenvolvida com tecnologias modernas e design neon futurista.</p>
            
            <h4>Características:</h4>
            <ul>
                <li>🚀 Detecção automática em tempo real</li>
                <li>🎯 Algoritmo de correspondência inteligente</li>
                <li>💎 Interface neon moderna e responsiva</li>
                <li>⚡ Performance otimizada</li>
                <li>🔒 Totalmente offline e privado</li>
            </ul>
            
            <h4>Tecnologias utilizadas:</h4>
            <ul>
                <li>Manifest V3</li>
                <li>JavaScript ES6+</li>
                <li>CSS3 com animações</li>
                <li>MutationObserver API</li>
                <li>Chrome Extension APIs</li>
            </ul>
            
            <div class="about-footer">
                <p>Desenvolvido com ❤️ para a comunidade de jogadores</p>
            </div>
        </div>
    `;
    
    showModal('Sobre', aboutContent);
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Obter ícone da notificação
function getNotificationIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    return icons[type] || icons.info;
}

// Mostrar modal
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer">
                <button class="modal-btn close-modal">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners para fechar modal
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Animar entrada
    setTimeout(() => modal.classList.add('show'), 100);
}

// Escutar mensagens do content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStats') {
        updateStats(message.stats);
        statsCard.style.display = 'block';
    }
});