// Content Script para sugestões automáticas
class WordSuggestionExtension {
    constructor() {
        this.suggestionsContainer = null;
        this.currentHints = [];
        this.currentTotalLetters = 0;
        this.observer = null;
        this.init();
    }

    init() {
        // Espera o DOM carregar completamente
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupExtension());
        } else {
            this.setupExtension();
        }
    }

    setupExtension() {
        console.log('🎯 Iniciando extensão de sugestões de palavras...');
        this.createSuggestionsContainer();
        this.startObserving();
        this.updateSuggestions(); // Primeira verificação
    }

    createSuggestionsContainer() {
        // Remove container existente se houver
        const existing = document.getElementById('word-suggestions-extension');
        if (existing) {
            existing.remove();
        }

        // Cria container para sugestões
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.id = 'word-suggestions-extension';
        this.suggestionsContainer.innerHTML = `
            <div class="suggestions-header">
                <h3>🎯 Sugestões Automáticas</h3>
                <button class="toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('minimized')">−</button>
            </div>
            <div class="suggestions-content">
                <div class="pattern-info">
                    <span class="pattern-display">Aguardando dicas...</span>
                </div>
                <div class="suggestions-list">
                    <p class="no-suggestions">Nenhuma dica encontrada ainda.</p>
                </div>
            </div>
        `;

        // Insere no body
        document.body.appendChild(this.suggestionsContainer);
    }

    startObserving() {
        // Observa mudanças na div dicaAtual
        this.observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                // Verifica se houve mudanças em elementos relacionados às dicas
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const target = mutation.target;
                    if (target.closest && (
                        target.closest('.dicaAtual') || 
                        target.closest('.contentSpan') ||
                        target.classList.contains('traco')
                    )) {
                        shouldUpdate = true;
                    }
                }
            });

            if (shouldUpdate) {
                setTimeout(() => this.updateSuggestions(), 100);
            }
        });

        // Observa todo o documento
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    extractGameInfo() {
        const dicaAtual = document.querySelector('.dicaAtual');
        if (!dicaAtual) {
            return { totalLetters: 0, hints: [] };
        }

        // Extrai número de letras do h2
        const h2 = dicaAtual.querySelector('h2');
        let totalLetters = 0;
        if (h2) {
            const match = h2.textContent.match(/\((\d+)\s*letras?\)/i);
            if (match) {
                totalLetters = parseInt(match[1]);
            }
        }

        // Extrai as dicas dos spans
        const tracos = dicaAtual.querySelectorAll('.traco');
        const hints = [];
        
        tracos.forEach((traco) => {
            const text = traco.textContent.trim();
            if (text === '\u00A0' || text === '' || text === ' ') {
                hints.push('');
            } else {
                hints.push(text);
            }
        });

        return { totalLetters, hints };
    }

    updateSuggestions() {
        const { totalLetters, hints } = this.extractGameInfo();
        
        if (totalLetters === 0) {
            this.showNoHints();
            return;
        }

        // Verifica se mudou
        if (totalLetters === this.currentTotalLetters && 
            JSON.stringify(hints) === JSON.stringify(this.currentHints)) {
            return;
        }

        this.currentTotalLetters = totalLetters;
        this.currentHints = hints;

        console.log('📝 Dicas extraídas:', { totalLetters, hints });

        // Busca palavras correspondentes
        const matchingWords = findMatchingWords(hints, totalLetters);
        
        this.displaySuggestions(hints, totalLetters, matchingWords);
    }

    displaySuggestions(hints, totalLetters, matchingWords) {
        const patternDisplay = this.suggestionsContainer.querySelector('.pattern-display');
        const suggestionsList = this.suggestionsContainer.querySelector('.suggestions-list');

        // Mostra padrão atual
        const pattern = hints.map(h => h || '_').join('');
        patternDisplay.innerHTML = `
            <strong>Padrão:</strong> ${pattern} 
            <span class="letter-count">(${totalLetters} letras)</span>
        `;

        // Mostra sugestões
        if (matchingWords.length === 0) {
            suggestionsList.innerHTML = '<p class="no-suggestions">❌ Nenhuma palavra encontrada para este padrão.</p>';
        } else {
            const wordsHtml = matchingWords.slice(0, 10).map((word, index) => {
                const highlightedWord = this.highlightPattern(word, hints);
                return `
                    <div class="suggestion-item" onclick="navigator.clipboard.writeText('${word}')">
                        <span class="word">${highlightedWord}</span>
                        <span class="copy-hint">📋</span>
                    </div>
                `;
            }).join('');

            const moreText = matchingWords.length > 10 ? 
                `<p class="more-results">... e mais ${matchingWords.length - 10} resultado(s)</p>` : '';

            suggestionsList.innerHTML = `
                <p class="results-count">✅ ${matchingWords.length} palavra(s) encontrada(s):</p>
                ${wordsHtml}
                ${moreText}
            `;
        }
    }

    highlightPattern(word, hints) {
        const normalizedWord = normalizeText(word);
        let result = '';
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const normalizedChar = normalizeText(char);
            const hintChar = hints[i] ? normalizeText(hints[i]) : '';
            
            if (hintChar && normalizedChar === hintChar) {
                result += `<span class="highlight">${char}</span>`;
            } else {
                result += char;
            }
        }
        
        return result;
    }

    showNoHints() {
        const patternDisplay = this.suggestionsContainer.querySelector('.pattern-display');
        const suggestionsList = this.suggestionsContainer.querySelector('.suggestions-list');
        
        patternDisplay.textContent = 'Aguardando dicas do jogo...';
        suggestionsList.innerHTML = '<p class="no-suggestions">🎮 Procurando por dicas na página...</p>';
    }
}

// Inicializa a extensão
const extension = new WordSuggestionExtension();

console.log('🚀 Extensão de sugestões de palavras carregada!');