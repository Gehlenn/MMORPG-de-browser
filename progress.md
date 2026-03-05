Original prompt: agora esta rodando, vamos reformular a gameplay, qu nao esta jogal, faça tudo e menu de inventario e de equipamentos novo, assim como na lateral esquerda os locais proximos para entrar, como ir para mais ao norte sul leste oeste, ao chegar proximo a uma entrada tipo, tudo sul, fica proximo das montanhas ao chegar opçao muda para entrar nas montanhas. torne tudo funcional. adicione quests, na cidade inicial taverna, quadro de missoes, local para descansar e mercado, e tudo muda realmente de local, podendo girar uma imagem fixa de cada ambiente assim como sprites das raças jogaveis e dos mobs e npcs. primeiamente uma tela de login, e tela de selecao de personagens onde voce vai criar sua classe. ai traga tudo que foi feito na ia blackbox, que la ja havia tudo definido, quest, classes e evoluçoes, alguns eventos etc.

- Concluido: Reestruturacao completa de interface (login, criacao de personagem, tela principal em 3 colunas).
- Concluido: Novo loop de gameplay com movimento local + viagem no mundo (N/S/L/O) e entradas dinamicas.
- Concluido: Novo sistema de inventario/equipamentos com uso, equipar e remover.
- Concluido: Sistema de quests com quadro de missoes e recompensa.
- Concluido: Servicos de cidade (taverna, descansar, mercado).
- Concluido: Classes, evolucoes e eventos aleatorios de rota.
- Concluido: Hooks de automacao `window.render_game_to_text` e `window.advanceTime`.
- Teste: cliente Playwright executado em `http://localhost:3000/?autoplay=1` com screenshots e state JSON em `output/web-game`.
- Teste: transicao validada de Cidade Inicial para Campos Centrais com mobs e NPCs no estado textual.
- TODO: Se houver pacote exportado da Blackbox, integrar quests/eventos/evolucoes especificos daquele material.

- Concluido: Integracao de sistema de conquistas (achievements) por combate, exploracao, quests, economia e nivel.
- Concluido: Sistema de titulos desbloqueaveis/equipaveis ligado a progresso.
- Concluido: Quadro de Hunt na cidade com progresso por monstro e recompensas.
- Concluido: Nova aba de Conquistas no painel direito.
- Teste: smoke test Playwright executado e estado JSON confirmou titulo e campos de achievements/hunt.

- Concluido: Tela de conta refeita com alternancia Login/Criar Conta (login, email, senha) e placeholder Google Account.
- Concluido: Friend list com adicao manual de amigos e convite para party.
- Concluido: Sistema de party com ate 4 membros, opcao party aberta/fechada e bonus de XP (+5% por membro ate 4 +10% party fechada).
- Concluido: Sistema de dungeon solo/grupo com progressao por andares e recompensa final.
- Teste: smoke test Playwright validou estado com campos de party/friends/dungeon no JSON.

- Concluido: Backend de autenticacao com SQLite (`accounts`) implementado em `/api/auth/register` e `/api/auth/login`.
- Concluido: Frontend de login/cadastro migrado de localStorage para API real.
- Concluido: Endpoint placeholder `/api/auth/google` para futura vinculacao.
- Teste: register/login confirmados via chamadas HTTP locais com persistencia em `database/mmorpg.db`.

- Concluido: Otimizacao de imagens runtime com script `scripts/optimize-images.js` (PNG recompress + geracao WEBP).
- Concluido: Referencias principais atualizadas para WEBP em `client/game.js`.
- Resultado: conjunto principal de runtime caiu de ~115.54 MB para ~6.86 MB em WEBP (mantendo PNGs comprimidos como fallback manual).
