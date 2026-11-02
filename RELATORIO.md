# Relatório de progresso: Egg Hopper (server hopper para "Steal an Egg")

Data: 02/11/2026 · Pasta do projeto: `steal-egg-hopper/`

## 1. Objetivo
App de celular (Android/iOS) que lista servidores públicos do jogo "Roube um Ovo" (Steal an Egg) no Roblox, priorizando servidores com 1 ou 2 jogadores, e entra neles com um toque ("server hopping").

## 2. Estado atual: PRIMEIRA VERSÃO COMPLETA, AINDA NÃO TESTADA EM APARELHO
| Arquivo | Função | Status |
|---|---|---|
| `package.json`, `app.json`, `babel.config.js`, `index.js` | Configuração Expo SDK 54 / React Native 0.81 | Pronto |
| `src/config.js` | placeIds pré-definidos, padrões (mín 1, máx 2, 5 páginas) | Pronto, IDs a confirmar |
| `src/robloxApi.js` | Busca de servidores, validação do jogo, links de entrada, retry em 429 | Pronto, não testado contra a API real |
| `src/storage.js` | Guarda histórico de servidores visitados e configurações (AsyncStorage) | Pronto |
| `App.js` | Tela única: Place ID, faixa de jogadores, buscar, validar, próximo servidor, lista | Pronto |

Nada foi executado em celular nem em emulador (o ambiente de criação não tem acesso à API da Roblox).

## 3. Como funciona
1. Chama `GET https://games.roblox.com/v1/games/{placeId}/servers/Public?sortOrder=Asc&excludeFullGames=true&limit=100` (paginado por cursor).
2. Filtra por `playing` entre mín e máx; para de paginar quando passa da faixa.
3. Ordena por menos jogadores e menor ping.
4. "Entrar" abre `roblox://experiences/start?placeId=X&gameInstanceId=Y` (fallback: `https://www.roblox.com/games/start?...`).
5. Servidores já abertos ficam marcados e são pulados no botão "Próximo servidor".

## 4. Decisões e premissas
- **Não há injeção, script nem modificação do cliente Roblox.** O app só consulta a API pública e abre links de entrada. Isso evita risco de banimento por exploit.
- Expo foi escolhido para rodar no celular sem Android Studio/Xcode (via app Expo Go).
- Mínimo padrão de 1 jogador: servidores com 0 costumam estar fechando.

## 5. Pontos em aberto (verificar primeiro)
1. **Place ID correto.** A pesquisa trouxe 3 candidatos:
   - `107778070777162`: citado como "ID raiz verificado" do Steal An Egg (guias allthings.how).
   - `10563114921`: aparece em rowatcher/rotrends para "Steal An Egg" (275,9M visitas).
   - `7861158392`: "Steal a Egg" de outro criador (Crazay Minds), jogo diferente.
   Use o botão **Validar** e confira o nome. Se necessário, abra o jogo em roblox.com e leia o número após `/games/` na URL. Os dois primeiros podem ser um o place inicial e outro o universo/place principal.
2. **Ordem do `sortOrder=Asc`**: assumido como "menos jogadores primeiro". Se a lista vier invertida, trocar para `Desc` em `src/robloxApi.js` ou remover o early-break.
3. **Deep link** `roblox://experiences/start` no iOS/Android: confirmar que abre o app e entra no servidor exato.
4. **Rate limit (429)**: há retry com backoff, mas pode ser necessário aumentar o intervalo entre páginas.
5. Servidores com 1-2 jogadores podem estar em encerramento; o ping/fps na lista ajuda a escolher.
6. Ícones/splash do app não foram criados.

## 6. Próximos passos sugeridos
1. `npm install` (ou `npx expo install`) dentro da pasta, depois `npx expo start` e abrir no Expo Go.
2. Testar Validar → Buscar → Entrar com o Place ID certo.
3. Ajustar pontos 5.2 e 5.3 conforme o resultado.
4. Melhorias: ordenar por ping, auto-refresh, notificação quando surgir servidor com 1 jogador, contagem de servidores visitados, tema claro.
5. Gerar APK pelo GitHub Actions (ver seção 7). Alternativa: `eas build -p android --profile preview` (exige conta Expo).

## 7. Geração do APK pelo GitHub (atualizado 02/11/2026)
**Arquivos novos:** `.github/workflows/build-apk.yml` e `.gitignore`.

**O workflow** (Ubuntu, Node 20, Java 17): `npm install` → `npx expo install --fix` (alinha versões ao SDK 54) → `npx expo prebuild --platform android` → `./gradlew assembleRelease` só para arm64-v8a → publica o APK como artefato `egg-hopper-apk`.

**Passo a passo para o usuário:**
1. Criar um repositório novo no GitHub (pode ser privado).
2. Subir o conteúdo da pasta `steal-egg-hopper/` na raiz do repositório (a pasta `.github` precisa ficar na raiz). Pelo site: "Add file → Upload files" arrastando tudo, inclusive `.github`. Se o navegador não enviar pastas ocultas, criar o arquivo `.github/workflows/build-apk.yml` manualmente pelo botão "Create new file".
3. Aba **Actions** → "Build Android APK" → **Run workflow** (ou basta dar push na branch main).
4. Esperar cerca de 10-20 min. Abrir a execução concluída → seção **Artifacts** → baixar `egg-hopper-apk` (zip contendo `app-release.apk`).
5. No celular: transferir o APK, permitir "instalar apps desconhecidos" e instalar.

**Observações e riscos:**
- O APK sai assinado com a chave de debug que o template Expo gera (serve para uso pessoal; não serve para publicar na Play Store).
- Só arm64-v8a: funciona na grande maioria dos celulares atuais. Em aparelhos muito antigos (32 bits) ou emuladores x86, remover `-PreactNativeArchitectures=arm64-v8a` do workflow.
- Esse workflow NÃO foi executado ainda. Se falhar, copiar o log do passo que ficou vermelho e usar na retomada. Pontos prováveis: versões de dependências (`expo install --fix`), memória do Gradle, ou caminho do APK.
- Sem `package-lock.json`, por isso o cache do npm está desligado. Depois do primeiro `npm install` local, vale commitar o lock e reativar `cache: npm`.
- Nenhum repositório foi criado por mim: não tenho acesso à conta GitHub do usuário.

## 8. Como retomar em um novo chat
Envie este arquivo (e o log de erro do GitHub Actions, se houver) e diga: "continue a partir do RELATORIO.md". Se o build do APK já funcionou, o próximo passo é 6.2 (testar o app no celular).
