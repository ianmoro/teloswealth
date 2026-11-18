# Painel CCO no site da Telos

Versão ao vivo do Painel CCO para `www.teloswealth.com.br/cco`. Lê as bases centrais do Telos CRM no Notion a cada acesso (e a cada 5 minutos com a página aberta). Só entra quem faz login Google com e-mail @teloswealth.com.br.

Esta versão substitui o pacote anterior e já inclui tudo o que mudou no painel desde então: Revisão semanal com cascata, cards clicáveis e tabela Por banker, Originação separada de captação, Resgate como capital em risco, Saúde do pipeline, Precisão das previsões e leitura completa do Notion (sem o limite de 100 linhas).

## Como ficou neste repositório (Vercel + Vite)

- A página está em `public/cco/` (o Vite só publica o que está em `public/`). Endereço: `/cco/`.
- A função está em `api/cco-data.mjs` e usa `cco-server/core.mjs`. As versões de Netlify e Cloudflare não foram incluídas.
- `vercel.json` manda `/cco` para `/cco/` e adiciona cabeçalhos de segurança (bloqueio de iframe, `noindex`).
- O servidor agora recusa o acesso se `GOOGLE_CLIENT_ID` não estiver configurado na Vercel. Assim, só valem logins feitos no app do Google da Telos.
- O Client ID vai em `public/cco/config.js`.

## O que tem no pacote

| Arquivo | Para que serve |
|---|---|
| `cco/index.html` | A página do painel |
| `cco/painel.js` | Gráficos, tabelas e cálculos (os mesmos do painel no Claude) |
| `cco/queries.js` | As consultas do painel |
| `cco/runtime.js` | Login Google, leitura dos dados e motor das consultas |
| `cco/config.js` | O que você edita: Client ID do Google, metas e BP |
| `cco-server/core.mjs` | Servidor: confere o login e lê o Notion |
| `api/cco-data.mjs` | Função para Vercel |
| `netlify/functions/cco-data.mjs` | Função para Netlify |
| `functions/api/cco-data.js` | Função para Cloudflare Pages |

Fique só com a função da sua hospedagem e apague as outras duas. GitHub Pages não roda função de servidor: nesse caso, o site precisa ir para Vercel, Netlify ou Cloudflare Pages.

## Passo a passo

**1. Integração do Notion (só leitura).** Em notion.so/profile/integrations, crie uma integração interna da Telos com permissão apenas de "Ler conteúdo". Copie o token. Na página **Telos CRM · Bases**, abra o menu `...` > Conexões e adicione a integração. Confira se a tabela **Parâmetros do painel** e o **Histórico do pipeline** também ficam conectados (se estiverem fora dessa página, conecte nelas também). Se você já criou essa integração no pacote anterior, pode reaproveitar.

**2. Login Google.** No Google Cloud Console, com a conta da Telos:
- Tela de consentimento OAuth: tipo **Interno** (só contas da Telos conseguem entrar).
- Credenciais > Criar ID do cliente OAuth > **Aplicativo da Web**.
- Origens JavaScript autorizadas: `https://www.teloswealth.com.br` (e `https://teloswealth.com.br`, se o site abre sem www).
- Copie o Client ID.

**3. Configurar.** Em `cco/config.js`, cole o Client ID em `GOOGLE_CLIENT_ID`. Na hospedagem, crie as variáveis de ambiente:
- `NOTION_TOKEN` = token do passo 1 (fica só no servidor, nunca vai para o navegador)
- `GOOGLE_CLIENT_ID` = o mesmo Client ID

**4. Publicar.** Copie as pastas para a raiz do repositório do site e publique. O painel fica em `/cco/` e os dados em `/api/cco-data`.

**5. Testar.**
- Janela anônima com Gmail pessoal: tem que ser barrado.
- Com o e-mail da Telos: o painel abre e o rodapé da barra lateral mostra "Atualizado em".
- Abra `/api/cco-data` direto no navegador: tem que responder "Faça login com o Google".

## Ajustes do dia a dia

- **AuA inicial e ganho de capital:** continuam na tabela Parâmetros do painel, no Notion.
- **Metas de AuA:** em `config.js` (`METAS`).
- **Ritmo do BP 2027** (card Captado): preencha `BP_ADDITIONAL` em `config.js` com o Additional esperado de cada banker em R$ mi. Enquanto estiver vazio, o card mostra "—".
- **Novo banker (ex.: Alexia):** o painel segue com os seis bankers do painel no Claude. Para incluir alguém, é preciso adicionar o ID do usuário dela no Notion em `queries.js` e o nome em `painel.js`.

## Segurança

- O token do Notion fica só no servidor. O navegador recebe as linhas do CRM depois que o Google confirma o e-mail @teloswealth.com.br.
- A integração do Notion é só leitura: o painel não altera nada no CRM.
- O servidor guarda os dados por 1 minuto para não repetir leituras quando várias pessoas abrem ao mesmo tempo.
