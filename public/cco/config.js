// Painel CCO · configuração
// Edite aqui. Nada neste arquivo é segredo (o token do Notion fica só no servidor).

window.CCO_CONFIG = {
  // ID do cliente OAuth do Google (Google Cloud Console > Credenciais), tipo "Aplicativo da Web".
  GOOGLE_CLIENT_ID: 'COLE_AQUI.apps.googleusercontent.com',

  // Endereço da função que lê o Notion.
  API_URL: '/api/cco-data',

  // Atualiza sozinho a cada 5 minutos. Há também o botão "Atualizar".
  REFRESH_MS: 5 * 60 * 1000,

  // Metas de AuA da Telos (em reais), pelo mês de fechamento.
  METAS: [
    { mes: '2026-12', meta: 700000000 },
    { mes: '2027-12', meta: 1000000000 }
  ],

  // BP 2027, aba AuA Growth: Additional esperado em 2027 por banker, em R$ mi.
  // Alimenta o "Ritmo do BP 2027" no card Captado (esperado / 12 meses).
  // Banker sem número aqui aparece como "—".
  BP_ADDITIONAL: [
    { banker: 'Tax', esperado_mi: null },
    { banker: 'Fernando', esperado_mi: null },
    { banker: 'Gabe', esperado_mi: null },
    { banker: 'Ian', esperado_mi: null },
    { banker: 'Renato', esperado_mi: null },
    { banker: 'Rodrigo', esperado_mi: null }
  ]
};
