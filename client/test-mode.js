// Test Mode - Modo de Teste Rápido para Desenvolvimento
class TestMode {
  static enabled = true;

  static startQuickTest() {
    if (!window._gameplayEngine) {
      window._gameplayEngine = new GameplayEngine();
    }

    const quickCharacter = {
      name: 'Testador',
      level: 5,
      race: 'human',
      class: 'warrior',
      id: 'test-123',
      x: 400,
      y: 300
    };

    window._gameplayEngine.startGame(quickCharacter);

    // Se você quiser, mostrar um botão para sair do teste
    const exitBtn = document.createElement('button');
    exitBtn.textContent = 'Sair do modo teste';
    exitBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      background: #ff4444;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      border: none;
      cursor: pointer;
      font-weight: bold;
    `;
    exitBtn.onclick = () => {
      if (window._gameplayEngine) {
        window._gameplayEngine.stopGame();
        location.reload();
      }
    };
    document.body.appendChild(exitBtn);

    console.log('🚀 Modo de teste rápido iniciado!');
  }
}

export default TestMode;
