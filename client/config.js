// Configuração do MMORPG - Modos de Jogo
const Config = {
  // Define o modo de jogo
  GAME_MODE: 'CLIENT_OFFLINE', // 'CLIENT_OFFLINE' | 'SERVER_ONLINE'

  // Endereço do servidor (selecionado pelo modo)
  SERVER_ADDRESS: () => {
    return Config.GAME_MODE === 'SERVER_ONLINE'
      ? 'http://localhost:3000'  // ou seu servidor de produção
      : null;
  },

  // Configurações adicionais baseadas no modo
  isOnline: () => Config.GAME_MODE === 'SERVER_ONLINE',
  isOffline: () => Config.GAME_MODE === 'CLIENT_OFFLINE',

  // Configurações de desenvolvimento
  DEBUG: true,
  LOG_LEVEL: 'INFO', // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

  // Configurações de gameplay
  GAME_CONFIG: {
    TILE_SIZE: 32,
    WORLD_WIDTH: 50,
    WORLD_HEIGHT: 50,
    PLAYER_SPEED: 3,
    MOB_SPEED: 1,
    ATTACK_RANGE: 50,
    RESPAWN_TIME: 5000 // 5 segundos
  }
};

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
} else if (typeof window !== 'undefined') {
  window.Config = Config;
}

export default Config;
