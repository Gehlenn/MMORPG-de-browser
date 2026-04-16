// GameState - Estado centralizado do cliente
class GameState {
  constructor() {
    this.screen = 'login'; // login | character | game
    this.currentUser = null;
    this.currentCharacter = null;
    this.worldLoaded = false;
    this.connected = false;
    this.players = [];
    this.mobs = [];
    this.items = [];
  }

  setScreen(screen) {
    this.screen = screen;
    console.log('🧭 Screen atual:', screen);
  }

  setUser(user) {
    this.currentUser = user;
    console.log('👤 Usuário definido:', user?.username || 'null');
  }

  setCharacter(character) {
    this.currentCharacter = character;
    console.log('🎮 Personagem definido:', character?.name || 'null');
  }

  setConnected(connected) {
    this.connected = connected;
    console.log('🌐 Conexão:', connected ? 'conectado' : 'desconectado');
  }

  setWorldLoaded(loaded) {
    this.worldLoaded = loaded;
    console.log('🌍 Mundo:', loaded ? 'carregado' : 'não carregado');
  }

  updatePlayers(players) {
    this.players = players;
    console.log(`👥 Jogadores atualizados: ${players.length}`);
  }

  updateMobs(mobs) {
    this.mobs = mobs;
    console.log(`👾 Mobs atualizados: ${mobs.length}`);
  }

  updateItems(items) {
    this.items = items;
    console.log(`💎 Itens atualizados: ${items.length}`);
  }

  reset() {
    this.screen = 'login';
    this.currentUser = null;
    this.currentCharacter = null;
    this.worldLoaded = false;
    this.connected = false;
    this.players = [];
    this.mobs = [];
    this.items = [];
    console.log('🔄 GameState resetado');
  }

  getCurrentState() {
    return {
      screen: this.screen,
      user: this.currentUser,
      character: this.currentCharacter,
      worldLoaded: this.worldLoaded,
      connected: this.connected,
      playersCount: this.players.length,
      mobsCount: this.mobs.length,
      itemsCount: this.items.length
    };
  }
}

window.gameState = new GameState();

export default GameState;
