// Painel CCO · consultas
// As mesmas consultas do painel no Claude, rodando no navegador (SQLite) sobre as linhas lidas do Notion.
(function () {
  const NEG = '"collection://64185fc0-0f6d-4a37-97d8-a7bdbd02bbf8"';
  const CLI = '"collection://cd7bb274-6af0-4108-9038-2615e798d3ac"';
  const HIST = '"collection://55a1ec62-4aee-4f77-9387-dafc210a3f4b"';
  const REUN = '"collection://9c525742-03e2-4f75-9a00-34701e5092f2"';
  const TAR = '"collection://0948b0bf-d9ba-4573-b8df-c6648f62714a"';
  const PAR = '"collection://e4461531-ec61-4a8d-b7df-ef3a77a14103"';

  const BK = `CASE WHEN "Banker" LIKE '%3acd872b-594c-811f-bcc0-0002743a3b96%' THEN 'Tax' WHEN "Banker" LIKE '%3acd872b-594c-8164-b874-0002361e3807%' THEN 'Fernando' WHEN "Banker" LIKE '%3acd872b-594c-81d2-8372-00024a1bb6a6%' THEN 'Gabe' WHEN "Banker" LIKE '%3acd872b-594c-81ea-9e9b-00028c10d912%' THEN 'Ian' WHEN "Banker" LIKE '%3acd872b-594c-8131-8828-00025eea3ff5%' THEN 'Renato' WHEN "Banker" LIKE '%3acd872b-594c-818f-8a71-0002213e347e%' THEN 'Rodrigo' ELSE 'Sem banker' END AS banker`;

  const BASE = `WITH r AS (
SELECT ${BK}, url, "Negócio" AS negocio, COALESCE("Tipo",'Sem tipo') AS tipo, "Etapa" AS etapa, "Temperatura" AS temperatura, COALESCE("Valor",0) AS valor, date("date:Previsão de fechamento:start") AS previsao, date(COALESCE("date:Início real:start", "Criado em")) AS inicio, date("date:Concluído em:start") AS concluido, "Tipo" AS tipo_raw, "Origem" AS origem, "Motivo de perda" AS motivo FROM ${NEG} WHERE "Tipo" IS NULL OR "Tipo" <> 'Originação'),
n AS (SELECT banker, url, negocio, tipo, etapa, temperatura, valor, previsao, inicio, concluido,
CASE WHEN tipo_raw IN ('Conta nova','Aporte adicional','Previdência') THEN 'Captação' WHEN tipo_raw = 'Indicação' THEN 'Indicação' WHEN tipo_raw = 'Resgate' THEN 'Saída' WHEN tipo_raw IS NULL THEN 'Sem tipo' ELSE 'Receita' END AS linha,
CASE WHEN etapa = 'Ganho' THEN 1.0 WHEN etapa = 'Perdido' THEN 0.0 WHEN temperatura = 'Quente' THEN 0.9 WHEN temperatura = 'Morno' THEN 0.6 WHEN temperatura = 'Frio' THEN 0.1 ELSE 0.0 END AS prob,
CASE WHEN etapa IN ('Ganho','Perdido') THEN 0 ELSE 1 END AS aberto,
COALESCE(origem, 'Sem origem') AS origem, COALESCE(motivo, 'Sem motivo') AS motivo
FROM r),
x AS (SELECT * FROM n UNION ALL SELECT 'Todos', url, negocio, tipo, etapa, temperatura, valor, previsao, inicio, concluido, linha, prob, aberto, origem, motivo FROM n)
`;
  const BANKERS0 = `, b AS (SELECT 'Todos' AS nome, 0 AS ordem UNION ALL SELECT 'Tax', 1 UNION ALL SELECT 'Fernando', 2 UNION ALL SELECT 'Gabe', 3 UNION ALL SELECT 'Ian', 4 UNION ALL SELECT 'Renato', 5 UNION ALL SELECT 'Rodrigo', 6)
`;

  const Q = {};

  Q.conc_tipo = BASE + `SELECT banker, tipo, linha, banker || '|' || tipo AS chave, SUM(CASE WHEN etapa = 'Ganho' THEN 1 ELSE 0 END) AS ganhos, SUM(CASE WHEN etapa = 'Perdido' THEN 1 ELSE 0 END) AS perdidos,
ROUND(1.0 * SUM(CASE WHEN etapa = 'Ganho' THEN 1 ELSE 0 END) / COUNT(*), 2) AS taxa_ganho,
ROUND(AVG(julianday(concluido) - julianday(inicio))) AS ciclo_medio_dias,
SUM(CASE WHEN etapa = 'Ganho' AND concluido IS NOT NULL THEN valor ELSE 0 END) AS realizado
FROM x WHERE aberto = 0 GROUP BY banker, tipo, linha ORDER BY banker, linha, tipo`;

  Q.concentracao = `WITH r AS (
SELECT ${BK}, t.url AS url, t."Negócio" AS negocio, COALESCE(t."Tipo",'Sem tipo') AS tipo, t."Etapa" AS etapa, t."Temperatura" AS temperatura, COALESCE(t."Valor",0) AS valor, t."Tipo" AS tipo_raw, (SELECT group_concat(c."Nome do cliente", ', ') FROM json_each(t."Cliente") AS j JOIN ${CLI} AS c ON c.url = j.value) AS cliente FROM ${NEG} AS t WHERE t."Tipo" IS NULL OR t."Tipo" <> 'Originação'),
n AS (SELECT banker, url, negocio, tipo, etapa, valor, COALESCE(cliente, 'Sem cliente') AS cliente,
CASE WHEN tipo_raw IN ('Conta nova','Aporte adicional','Previdência') THEN 'Captação' ELSE 'Outra' END AS linha,
CASE WHEN etapa = 'Ganho' THEN 1.0 WHEN etapa = 'Perdido' THEN 0.0 WHEN temperatura = 'Quente' THEN 0.9 WHEN temperatura = 'Morno' THEN 0.6 WHEN temperatura = 'Frio' THEN 0.1 ELSE 0.0 END AS prob,
CASE WHEN etapa IN ('Ganho','Perdido') THEN 0 ELSE 1 END AS aberto
FROM r),
x AS (SELECT * FROM n UNION ALL SELECT 'Todos', url, negocio, tipo, etapa, valor, cliente, linha, prob, aberto FROM n)
SELECT banker, posicao, banker || '|' || posicao AS chave, negocio, cliente, dono, tipo, ponderado, ROUND(ponderado / total, 4) AS participacao, ROUND(SUM(ponderado) OVER (PARTITION BY banker ORDER BY posicao) / total, 4) AS acumulado FROM (
SELECT x.banker, n2.banker AS dono, x.negocio, x.cliente, x.tipo, x.valor * x.prob AS ponderado,
ROW_NUMBER() OVER (PARTITION BY x.banker ORDER BY x.valor * x.prob DESC) AS posicao,
SUM(x.valor * x.prob) OVER (PARTITION BY x.banker) AS total
FROM x JOIN n AS n2 ON n2.url = x.url
WHERE x.aberto = 1 AND x.linha = 'Captação' AND x.valor * x.prob > 0)
WHERE posicao <= 5 ORDER BY banker, posicao`;

  Q.historico = `WITH h AS (SELECT date("date:Semana:start") AS semana, date("date:Data da foto:start") AS data_foto, replace(replace("ID do negócio", 'https://app.notion.com/p/', ''), 'https://app.notion.com/', '') AS id, "Banker" AS banker, "Negócio" AS negocio, "Tipo" AS tipo, "Etapa" AS etapa, "Temperatura" AS temperatura, COALESCE("Valor", 0) AS valor, date("date:Previsão de fechamento:start") AS previsao, date("date:Concluído em:start") AS concluido FROM ${HIST}),
w AS (SELECT DISTINCT semana FROM h),
k AS (SELECT semana FROM w WHERE semana = (SELECT MAX(semana) FROM w) OR semana = (SELECT MAX(w2.semana) FROM w AS w2 WHERE substr(w2.semana, 1, 7) = substr(w.semana, 1, 7)))
SELECT * FROM h WHERE semana IN (SELECT semana FROM k) ORDER BY semana, banker, id`;

  Q.negocios_vivo = BASE + `SELECT replace(url, 'https://app.notion.com/', '') AS id, url, banker, negocio, tipo, linha, etapa, temperatura, valor, previsao, concluido, inicio, aberto,
CAST(julianday('now') - julianday(inicio) AS INTEGER) AS idade_dias FROM n ORDER BY banker, negocio, url`;

  Q.origem = BASE + `SELECT banker, origem, banker || '|' || origem AS chave,
SUM(aberto) AS abertos,
SUM(CASE WHEN aberto = 1 AND linha = 'Captação' THEN valor * prob ELSE 0 END) AS captacao_ponderada,
SUM(CASE WHEN aberto = 1 AND linha = 'Receita' THEN valor * prob ELSE 0 END) AS receita_ponderada,
SUM(CASE WHEN etapa = 'Ganho' THEN 1 ELSE 0 END) AS ganhos,
SUM(CASE WHEN etapa = 'Perdido' THEN 1 ELSE 0 END) AS perdidos,
CASE WHEN SUM(1 - aberto) > 0 THEN ROUND(1.0 * SUM(CASE WHEN etapa = 'Ganho' THEN 1 ELSE 0 END) / SUM(1 - aberto), 2) END AS taxa_ganho,
SUM(CASE WHEN etapa = 'Ganho' AND linha = 'Captação' AND concluido IS NOT NULL THEN valor ELSE 0 END) AS captado
FROM x WHERE linha <> 'Saída' GROUP BY banker, origem ORDER BY banker, captacao_ponderada DESC, abertos DESC, origem`;

  Q.originacao = `WITH r AS (SELECT ${BK}, url, "Negócio" AS negocio, "Etapa" AS etapa, "Temperatura" AS temperatura, COALESCE("Valor",0) AS valor, date("date:Previsão de fechamento:start") AS previsao, date("date:Concluído em:start") AS concluido FROM ${NEG} WHERE "Tipo" = 'Originação')
SELECT replace(url, 'https://app.notion.com/', '') AS id, banker, negocio, etapa, temperatura, valor, previsao, concluido FROM r ORDER BY banker, negocio, id`;

  Q.params = `SELECT "Linha" AS linha, "Tipo" AS tipo, "AuA inicial" AS aua_inicial, date("date:Data de referência:start") AS data_ref, "Ano" AS ano, "Ganho de capital (% a.a.)" AS ganho_aa FROM ${PAR} ORDER BY "Tipo", "Linha"`;

  Q.perdas = BASE + `SELECT banker, motivo, banker || '|' || motivo AS chave, COUNT(*) AS negocios, SUM(valor) AS valor
FROM x WHERE etapa = 'Perdido' AND linha <> 'Saída' GROUP BY banker, motivo ORDER BY banker, negocios DESC, valor DESC, motivo`;

  Q.pipe_kpi = BASE + BANKERS0 + `SELECT b.nome AS banker, strftime('%Y-%m','now') AS mes_atual,
SUM(CASE WHEN aberto = 1 AND linha = 'Captação' AND previsao < date('now','start of month','+1 month') THEN valor * prob ELSE 0 END) AS captacao_mes,
SUM(CASE WHEN aberto = 1 AND linha = 'Receita' AND previsao < date('now','start of month','+1 month') THEN valor * prob ELSE 0 END) AS receita_mes,
SUM(CASE WHEN etapa = 'Ganho' AND linha = 'Captação' AND strftime('%Y-%m', concluido) = strftime('%Y-%m','now') THEN valor ELSE 0 END) AS captado_mes,
SUM(CASE WHEN aberto = 1 AND linha = 'Captação' THEN valor * prob ELSE 0 END) AS captacao_mesa,
SUM(CASE WHEN aberto = 1 AND linha = 'Captação' THEN valor ELSE 0 END) AS captacao_bruta,
SUM(CASE WHEN aberto = 1 AND linha = 'Saída' THEN valor * (1 - prob) ELSE 0 END) AS saida_esperada,
SUM(CASE WHEN aberto = 1 AND linha = 'Saída' THEN valor ELSE 0 END) AS saida_em_risco,
COALESCE(SUM(aberto), 0) AS negocios_abertos,
SUM(CASE WHEN aberto = 1 AND previsao < date('now') THEN 1 ELSE 0 END) AS previsoes_vencidas,
COUNT(x.url) AS negocios_total
FROM b LEFT JOIN x ON x.banker = b.nome GROUP BY b.nome, b.ordem ORDER BY b.ordem`;

  Q.pipe_lista = BASE + `SELECT url, banker, negocio, tipo, etapa, temperatura, valor, CASE WHEN linha = 'Saída' THEN valor * (1 - prob) ELSE valor * prob END AS ponderado, previsao, CASE WHEN previsao < date('now') THEN 'Sim' ELSE 'Não' END AS vencida, CAST(julianday('now') - julianday(inicio) AS INTEGER) AS idade_dias
FROM n WHERE aberto = 1 ORDER BY previsao, url`;

  Q.pipe_mes = BASE + `SELECT banker, mes, ordem, SUM(captacao) AS captacao, SUM(receita) AS receita, SUM(saida) AS saida, SUM(captacao_bruta) AS captacao_bruta, SUM(receita_bruta) AS receita_bruta, SUM(saida_bruta) AS saida_bruta, SUM(captado) AS captado, SUM(saida_realizada) AS saida_realizada, SUM(receita_realizada) AS receita_realizada FROM (
SELECT banker, CASE WHEN previsao IS NULL THEN 'Sem previsão' WHEN previsao < date('now','start of month') THEN 'Atrasado' ELSE strftime('%Y-%m', previsao) END AS mes,
CASE WHEN previsao IS NULL THEN '9999' WHEN previsao < date('now','start of month') THEN '0000' ELSE strftime('%Y-%m', previsao) END AS ordem,
CASE WHEN linha = 'Captação' THEN valor * prob ELSE 0 END AS captacao,
CASE WHEN linha = 'Receita' THEN valor * prob ELSE 0 END AS receita,
CASE WHEN linha = 'Saída' THEN valor * (1 - prob) ELSE 0 END AS saida,
CASE WHEN linha = 'Captação' THEN valor ELSE 0 END AS captacao_bruta,
CASE WHEN linha = 'Receita' THEN valor ELSE 0 END AS receita_bruta,
CASE WHEN linha = 'Saída' THEN valor ELSE 0 END AS saida_bruta,
0 AS captado, 0 AS saida_realizada, 0 AS receita_realizada
FROM x WHERE aberto = 1
UNION ALL
SELECT banker, strftime('%Y-%m', concluido), strftime('%Y-%m', concluido), 0, 0, 0, 0, 0, 0,
CASE WHEN etapa = 'Ganho' AND linha = 'Captação' THEN valor ELSE 0 END,
CASE WHEN etapa = 'Perdido' AND linha = 'Saída' THEN valor ELSE 0 END,
CASE WHEN etapa = 'Ganho' AND linha = 'Receita' THEN valor ELSE 0 END
FROM x WHERE aberto = 0 AND concluido >= date('now','start of month'))
GROUP BY banker, mes, ordem ORDER BY banker, ordem`;

  Q.pipe_tipo = BASE + `SELECT banker, tipo, linha, banker || '|' || tipo AS chave, COUNT(*) AS negocios, SUM(valor) AS valor, SUM(CASE WHEN linha = 'Saída' THEN valor * (1 - prob) ELSE valor * prob END) AS ponderado, ROUND(AVG(julianday('now') - julianday(inicio))) AS idade_media_dias
FROM x WHERE aberto = 1 GROUP BY banker, tipo, linha ORDER BY banker, linha, ponderado DESC, tipo`;

  const REUN_BASE = `WITH r AS (
SELECT ${BK}, date("date:Data da reunião:start") AS d FROM ${REUN}),
x AS (SELECT banker, d FROM r WHERE d IS NOT NULL UNION ALL SELECT 'Todos', d FROM r WHERE d IS NOT NULL),
b AS (SELECT 'Todos' AS nome, 0 AS ordem UNION ALL SELECT 'Tax', 1 UNION ALL SELECT 'Fernando', 2 UNION ALL SELECT 'Gabe', 3 UNION ALL SELECT 'Ian', 4 UNION ALL SELECT 'Renato', 5 UNION ALL SELECT 'Rodrigo', 6)
`;

  Q.reun_resumo = REUN_BASE + `SELECT b.nome AS banker, b.ordem AS ordem,
SUM(CASE WHEN x.d >= date('now', '-30 days') AND x.d <= date('now') THEN 1 ELSE 0 END) AS ultimos_30d,
SUM(CASE WHEN x.d > date('now') THEN 1 ELSE 0 END) AS agendadas,
SUM(CASE WHEN x.d >= date('now', '-6 days', 'weekday 1', '-77 days') AND x.d < date('now', '-6 days', 'weekday 1') THEN 1 ELSE 0 END) AS ultimas_11_semanas,
ROUND(SUM(CASE WHEN x.d >= date('now', '-6 days', 'weekday 1', '-77 days') AND x.d < date('now', '-6 days', 'weekday 1') THEN 1 ELSE 0 END) / 11.0, 1) AS media_semanal,
MAX(CASE WHEN x.d <= date('now') THEN x.d END) AS ultima
FROM b LEFT JOIN x ON x.banker = b.nome GROUP BY b.nome, b.ordem ORDER BY b.ordem`;

  Q.reun_semana = REUN_BASE + `SELECT banker, semana, banker || '|' || semana AS chave, COUNT(*) AS reunioes FROM (
SELECT banker, date(d, '-6 days', 'weekday 1') AS semana FROM x)
WHERE semana >= date('now', '-6 days', 'weekday 1', '-77 days') AND semana <= date('now', '-6 days', 'weekday 1', '+7 days')
GROUP BY banker, semana ORDER BY banker, semana`;

  Q.tarefas_abertas = `SELECT DISTINCT replace(replace(j.value, 'https://app.notion.com/p/', ''), 'https://app.notion.com/', '') AS negocio_id FROM ${TAR} AS t, json_each(t."Negócio") AS j WHERE t."Status" IS NULL OR t."Status" <> 'Concluído' ORDER BY negocio_id`;

  Q.time_resumo = BASE + `, b AS (SELECT 'Todos' AS nome, 99 AS ordem UNION ALL SELECT 'Tax', 1 UNION ALL SELECT 'Fernando', 2 UNION ALL SELECT 'Gabe', 3 UNION ALL SELECT 'Ian', 4 UNION ALL SELECT 'Renato', 5 UNION ALL SELECT 'Rodrigo', 6)
SELECT b.nome AS banker, b.ordem AS ordem,
COALESCE(SUM(x.aberto), 0) AS abertos,
SUM(CASE WHEN x.aberto = 1 AND x.linha = 'Captação' THEN x.valor ELSE 0 END) AS captacao_bruta,
SUM(CASE WHEN x.aberto = 1 AND x.linha = 'Captação' THEN x.valor * x.prob ELSE 0 END) AS captacao_ponderada,
SUM(CASE WHEN x.aberto = 1 AND x.linha = 'Receita' THEN x.valor * x.prob ELSE 0 END) AS receita_ponderada,
SUM(CASE WHEN x.aberto = 1 AND x.linha = 'Saída' THEN x.valor * (1 - x.prob) ELSE 0 END) AS saida_esperada,
SUM(CASE WHEN x.aberto = 1 AND x.previsao < date('now') THEN 1 ELSE 0 END) AS vencidas,
SUM(CASE WHEN x.aberto = 1 AND x.valor = 0 THEN 1 ELSE 0 END) AS sem_valor,
SUM(CASE WHEN x.etapa = 'Ganho' THEN 1 ELSE 0 END) AS ganhos,
SUM(CASE WHEN x.etapa = 'Perdido' THEN 1 ELSE 0 END) AS perdidos,
CASE WHEN SUM(CASE WHEN x.aberto = 0 THEN 1 ELSE 0 END) > 0 THEN ROUND(1.0 * SUM(CASE WHEN x.etapa = 'Ganho' THEN 1 ELSE 0 END) / SUM(CASE WHEN x.aberto = 0 THEN 1 ELSE 0 END), 2) END AS taxa_ganho,
ROUND(AVG(CASE WHEN x.aberto = 0 AND x.concluido IS NOT NULL THEN julianday(x.concluido) - julianday(x.inicio) END)) AS ciclo_medio_dias,
SUM(CASE WHEN x.etapa = 'Ganho' AND x.linha = 'Captação' AND x.concluido IS NOT NULL THEN x.valor ELSE 0 END) AS captado_total
FROM b LEFT JOIN x ON x.banker = b.nome GROUP BY b.nome, b.ordem ORDER BY b.ordem`;

  window.CCO_QUERIES = Q;
})();
