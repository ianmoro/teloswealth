// Painel CCO · consultas
// As mesmas consultas do painel no Claude, rodando no navegador (SQLite) sobre as linhas lidas do Notion.
// Os números por período (Resumo, Pipeline, Time, Revisão) são calculados em painel.js a partir de negocios_vivo.
(function () {
  const NEG = '"collection://64185fc0-0f6d-4a37-97d8-a7bdbd02bbf8"';
  const CLI = '"collection://cd7bb274-6af0-4108-9038-2615e798d3ac"';
  const HIST = '"collection://55a1ec62-4aee-4f77-9387-dafc210a3f4b"';
  const REUN = '"collection://9c525742-03e2-4f75-9a00-34701e5092f2"';
  const TAR = '"collection://0948b0bf-d9ba-4573-b8df-c6648f62714a"';
  const PAR = '"collection://e4461531-ec61-4a8d-b7df-ef3a77a14103"';

  const bk = col => `CASE WHEN ${col} LIKE '%3acd872b-594c-811f-bcc0-0002743a3b96%' THEN 'Tax' WHEN ${col} LIKE '%3acd872b-594c-8164-b874-0002361e3807%' THEN 'Fernando' WHEN ${col} LIKE '%3acd872b-594c-81d2-8372-00024a1bb6a6%' THEN 'Gabe' WHEN ${col} LIKE '%3acd872b-594c-81ea-9e9b-00028c10d912%' THEN 'Ian' WHEN ${col} LIKE '%3acd872b-594c-8131-8828-00025eea3ff5%' THEN 'Renato' WHEN ${col} LIKE '%3acd872b-594c-818f-8a71-0002213e347e%' THEN 'Rodrigo' ELSE 'Sem banker' END`;
  const ID = col => `replace(replace(${col}, 'https://app.notion.com/p/', ''), 'https://app.notion.com/', '')`;

  const Q = {};

  // Todos os negócios (menos Originação), com marca de valor vazio, cliente, origem e motivo de perda.
  Q.negocios_vivo = `WITH r AS (
SELECT ${bk('t."Banker"')} AS banker, t.url AS url, t."Negócio" AS negocio, COALESCE(t."Tipo",'Sem tipo') AS tipo, t."Tipo" AS tipo_raw, t."Etapa" AS etapa, t."Temperatura" AS temperatura, COALESCE(t."Valor",0) AS valor, CASE WHEN t."Valor" IS NULL THEN 1 ELSE 0 END AS valor_vazio, date(t."date:Previsão de fechamento:start") AS previsao, date(COALESCE(t."date:Início real:start", t."Criado em")) AS inicio, date(t."date:Concluído em:start") AS concluido, COALESCE(t."Origem",'Sem origem') AS origem, COALESCE(t."Motivo de perda",'Sem motivo') AS motivo, (SELECT group_concat(c."Nome do cliente", ', ') FROM json_each(t."Cliente") AS j JOIN ${CLI} AS c ON c.url = j.value) AS cliente FROM ${NEG} AS t WHERE t."Tipo" IS NULL OR t."Tipo" <> 'Originação')
SELECT ${ID('url')} AS id, url, banker, negocio, tipo, CASE WHEN tipo_raw IN ('Conta nova','Aporte adicional','Previdência') THEN 'Captação' WHEN tipo_raw = 'Indicação' THEN 'Indicação' WHEN tipo_raw = 'Resgate' THEN 'Saída' WHEN tipo_raw IS NULL THEN 'Sem tipo' ELSE 'Receita' END AS linha, etapa, temperatura, valor, valor_vazio, previsao, concluido, inicio, CASE WHEN etapa IN ('Ganho','Perdido') THEN 0 ELSE 1 END AS aberto, CAST(julianday('now') - julianday(inicio) AS INTEGER) AS idade_dias, origem, motivo, COALESCE(cliente, 'Sem cliente') AS cliente FROM r ORDER BY banker, negocio, url`;

  // Originações, com o banker e a etapa do negócio ligado em "Deal conduzido".
  Q.originacao = `WITH r AS (SELECT ${bk('t."Banker"')} AS banker, t.url AS url, t."Negócio" AS negocio, t."Etapa" AS etapa, t."Temperatura" AS temperatura, COALESCE(t."Valor",0) AS valor, date(t."date:Previsão de fechamento:start") AS previsao, date(t."date:Concluído em:start") AS concluido,
(SELECT group_concat(${bk('d."Banker"')}, ', ') FROM json_each(t."Deal conduzido") AS j JOIN ${NEG} AS d ON d.url = j.value) AS conduzido,
(SELECT group_concat(d."Etapa", ', ') FROM json_each(t."Deal conduzido") AS j JOIN ${NEG} AS d ON d.url = j.value) AS etapa_conduzido
FROM ${NEG} AS t WHERE t."Tipo" = 'Originação')
SELECT ${ID('url')} AS id, banker, negocio, etapa, temperatura, valor, previsao, concluido, COALESCE(conduzido, 'Não vinculado') AS conduzido, etapa_conduzido FROM r ORDER BY banker, negocio, id`;

  // Uma linha por reunião com data.
  Q.reunioes = `SELECT ${bk('"Banker"')} AS banker, date("date:Data da reunião:start") AS data FROM ${REUN} WHERE "date:Data da reunião:start" IS NOT NULL ORDER BY data, banker`;

  Q.historico = `WITH h AS (SELECT date("date:Semana:start") AS semana, date("date:Data da foto:start") AS data_foto, ${ID('"ID do negócio"')} AS id, "Banker" AS banker, "Negócio" AS negocio, "Tipo" AS tipo, "Etapa" AS etapa, "Temperatura" AS temperatura, COALESCE("Valor", 0) AS valor, date("date:Previsão de fechamento:start") AS previsao, date("date:Concluído em:start") AS concluido FROM ${HIST}),
w AS (SELECT DISTINCT semana FROM h),
k AS (SELECT semana FROM w WHERE semana >= date((SELECT MAX(semana) FROM w), '-56 days') OR semana = (SELECT MAX(w2.semana) FROM w AS w2 WHERE substr(w2.semana, 1, 7) = substr(w.semana, 1, 7)))
SELECT * FROM h WHERE semana IN (SELECT semana FROM k) ORDER BY semana, banker, id`;

  Q.params = `SELECT "Linha" AS linha, "Tipo" AS tipo, "AuA inicial" AS aua_inicial, date("date:Data de referência:start") AS data_ref, "Ano" AS ano, "Ganho de capital (% a.a.)" AS ganho_aa FROM ${PAR} ORDER BY "Tipo", "Linha"`;

  Q.tarefas_abertas = `SELECT DISTINCT ${ID('j.value')} AS negocio_id FROM ${TAR} AS t, json_each(t."Negócio") AS j WHERE t."Status" IS NULL OR t."Status" <> 'Concluído' ORDER BY negocio_id`;

  window.CCO_QUERIES = Q;
})();
