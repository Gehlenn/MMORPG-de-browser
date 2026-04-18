// Network Events - Constantes padronizadas para eventos de rede
// Formato: dominio:acao

window.NET_EVENTS = {
  // Autenticação
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGIN_SUCCESS: 'auth:login-success',
  AUTH_LOGIN_ERROR: 'auth:login-error',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_VALIDATE: 'auth:validate',
  AUTH_VALIDATE_SUCCESS: 'auth:validate-success',
  AUTH_VALIDATE_ERROR: 'auth:validate-error',

  // Contas
  ACCOUNT_CREATE: 'account:create',
  ACCOUNT_CREATE_SUCCESS: 'account:create-success',
  ACCOUNT_CREATE_ERROR: 'account:create-error',
  ACCOUNT_LOAD: 'account:load',
  ACCOUNT_UPDATE: 'account:update',

  // Personagens
  CHARACTER_CREATE: 'character:create',
  CHARACTER_CREATE_SUCCESS: 'character:create-success',
  CHARACTER_CREATE_ERROR: 'character:create-error',
  CHARACTER_DELETE: 'character:delete',
  CHARACTER_DELETE_SUCCESS: 'character:delete-success',
  CHARACTER_SELECT: 'character:select',
  CHARACTER_SELECTED: 'character:selected',
  CHARACTER_LOAD: 'character:load',
  CHARACTER_UPDATE: 'character:update',
  CHARACTER_SAVE: 'character:save',

  // Mundo
  WORLD_INIT_REQUEST: 'world:init-request',
  WORLD_INIT: 'world:init',
  WORLD_UPDATE: 'world:update',
  WORLD_JOIN: 'world:join',
  WORLD_LEAVE: 'world:leave',

  // Jogador
  PLAYER_SPAWN: 'player:spawn',
  PLAYER_MOVE: 'player:move',
  PLAYER_MOVED: 'player:moved',
  PLAYER_STOP: 'player:stop',
  PLAYER_ATTACK: 'player:attack',
  PLAYER_ATTACKED: 'player:attacked',
  PLAYER_SKILL: 'player:skill',
  PLAYER_DAMAGE: 'player:damage',
  PLAYER_HEAL: 'player:heal',
  PLAYER_DIE: 'player:die',
  PLAYER_RESPAWN: 'player:respawn',
  PLAYER_LEVEL_UP: 'player:level-up',
  PLAYER_CHAT: 'player:chat',
  PLAYER_EMOTE: 'player:emote',
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',

  // Entidades
  ENTITY_SPAWN: 'entity:spawn',
  ENTITY_DESPAWN: 'entity:despawn',
  ENTITY_UPDATE: 'entity:update',
  ENTITY_MOVE: 'entity:move',
  ENTITY_ATTACK: 'entity:attack',
  ENTITY_DAMAGE: 'entity:damage',
  ENTITY_DIE: 'entity:die',

  // Mobs
  MOB_SPAWN: 'mob:spawn',
  MOB_DESPAWN: 'mob:despawn',
  MOB_MOVE: 'mob:move',
  MOB_ATTACK: 'mob:attack',
  MOB_DIE: 'mob:die',
  MOB_DIED: 'mob:died',
  MOB_UPDATE: 'mob:update',
  MOB_AGGRO: 'mob:aggro',
  MOB_DEAGGRO: 'mob:deaggro',

  // Combate
  COMBAT_ATTACK: 'combat:attack',
  COMBAT_ATTACK_RESULT: 'combat:attack-result',
  COMBAT_DAMAGE: 'combat:damage',
  COMBAT_HEAL: 'combat:heal',

  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_GLOBAL: 'chat:global',
  CHAT_LOCAL: 'chat:local',
  CHAT_WHISPER: 'chat:whisper',
  CHAT_CHANNEL: 'chat:channel',

  // Sistema
  SYSTEM_ERROR: 'system:error',
  SYSTEM_MESSAGE: 'system:message',
  SYSTEM_PING: 'system:ping',
  SYSTEM_PONG: 'system:pong',
  SYSTEM_DISCONNECT: 'system:disconnect',
  CONNECTION_LOST: 'connection:lost',
  CONNECTION_RESTORED: 'connection:restored',

  // Inventário
  INVENTORY_GET: 'inventory:get',
  INVENTORY_ADD: 'inventory:add',
  INVENTORY_REMOVE: 'inventory:remove',
  INVENTORY_EQUIP: 'inventory:equip',
  INVENTORY_UNEQUIP: 'inventory:unequip',
  INVENTORY_USE: 'inventory:use',
  INVENTORY_SYNC: 'inventory:sync',

  // Equipamento
  EQUIPMENT_EQUIP: 'equipment:equip',
  EQUIPMENT_UNEQUIP: 'equipment:unequip',
  EQUIPMENT_SYNC: 'equipment:sync',

  // Stats do jogador
  PLAYER_STATS_SYNC: 'player:stats-sync',
  PLAYER_XP_GAIN: 'player:xp-gain',

  // Progressão (XP/Level)
  PLAYER_XP_GAINED: 'player:xp-gained',
  PLAYER_LEVEL_UP: 'player:level-up',
  PLAYER_PROGRESSION_SYNC: 'player:progression-sync',
  LOOT_DROP_CREATED: 'loot:drop-created',
  LOOT_COLLECT: 'loot:collect',
  LOOT_COLLECTED: 'loot:collected',

  // Skills
  SKILL_USE: 'skill:use',
  SKILL_CAST: 'skill:cast',
  SKILL_CAST_SUCCESS: 'skill:cast-success',
  SKILL_CAST_ERROR: 'skill:cast-error',
  SKILL_COOLDOWN: 'skill:cooldown',
  SKILL_LEARN: 'skill:learn',

  // Quests
  QUEST_GIVER_INTERACT: 'quest-giver:interact',
  QUEST_LIST: 'quest:list',
  QUEST_ACCEPT: 'quest:accept',
  QUEST_ACCEPTED: 'quest:accepted',
  QUEST_PROGRESS: 'quest:progress',
  QUEST_UPDATE: 'quest:update',
  QUEST_COMPLETE: 'quest:complete',
  QUEST_COMPLETED: 'quest:completed',
  QUEST_SYNC: 'quest:sync',
  
  // NOVOS: Quest System v2
  QUEST_GIVE: 'quest:give',
  QUEST_PROGRESS_SYNC: 'quest:progress-sync',
  QUEST_REWARD: 'quest:reward',

  // NOVOS: Talent System (BLOCO 13)
  TALENT_TREE_REQUEST: 'talent:tree-request',
  TALENT_TREE_DATA: 'talent:tree-data',
  TALENT_SELECT: 'talent:select',
  TALENT_SELECT_RESULT: 'talent:select-result',
  PLAYER_TALENTS_SYNC: 'player:talents-sync',
  TALENT_POINTS_AVAILABLE: 'talent:points-available',
  PROFESSION_GATHER_REQUEST: 'profession:gather-request',
  PROFESSION_GATHER_RESULT: 'profession:gather-result',
  CRAFT_REQUEST: 'craft:request',
  CRAFT_RESULT: 'craft:result'
};

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.NET_EVENTS;
}

export default window.NET_EVENTS;
