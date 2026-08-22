// ═══════════════════════════════════════════════════════════════════════════
// PASSAPORTE PÚBLICO DO HECTARE — GET /api/publico/passaporte/:loteId
//
// Página sem login: qualquer comprador, auditor ou jornalista escaneia o QR
// de um lote e vê O QUE JÁ É PROVA e, com o mesmo destaque, O QUE AINDA NÃO
// É. A honestidade é o produto: o selo mais fraco aparece na frente, o
// sequestro de carbono vem sempre como estimativa até existir MRV
// instrumentado, e a cadeia de custódia é conferida a cada chamada.
//
// O que NUNCA sai aqui: userId de quem registrou e qualquer dado de conta.
// Evidência pública é sobre o lote, não sobre a pessoa.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { MUNICIPIO, LOTES } from '../data/territorio.js';
import { trilha, seloDoLote, verificarCadeia, decomposicao } from '../services/custodia.js';
import { semearSePreciso } from '../services/territorioDemo.js';
import { SELOS, disclaimerConformidade } from '../science/selos.js';

export const passaporteRouter = Router();

passaporteRouter.get('/publico/passaporte/:loteId', (req, res) => {
  semearSePreciso();
  const lote = LOTES.find(l => l.id === req.params.loteId);
  if (!lote || lote.status === 'potencial') {
    return res.status(404).json({ error: 'Passaporte não encontrado para este lote.' });
  }

  const selo = seloDoLote(lote.id);
  const frentes = decomposicao(lote.id);
  const publica = (ev) => ({
    id: ev.id, tipo: ev.tipo, descricao: ev.descricao, selo: ev.selo,
    confianca: SELOS[ev.selo].confianca, em: ev.em, hash: ev.hash, anterior: ev.anterior,
    anexoHash: ev.anexoHash,
  });

  res.json({
    demonstracao: true,
    aviso: 'Passaporte demonstrativo: geometria real de Macapá, conteúdo de exemplo.',
    lote: {
      id: lote.id, nome: lote.nome, ha: lote.ha, cultura: lote.cultura,
      municipio: `${MUNICIPIO.nome} · ${MUNICIPIO.uf}`, centro: MUNICIPIO.centro,
      poligono: lote.poligono,
    },
    selo,
    // O passaporte separa as frentes com a régua da casa: prova é o que
    // sustenta alegação comercial (CAMPO para cima); o resto é dito como é.
    jaEProva: frentes.filter(f => SELOS[f.selo].usoComercial && SELOS[f.selo].tipo === 'EVIDENCE'),
    aindaNaoE: frentes.filter(f => !(SELOS[f.selo].usoComercial && SELOS[f.selo].tipo === 'EVIDENCE')),
    carbono: {
      situacao: 'ESTIMATIVA',
      texto: 'Sequestro de carbono é sempre estimativa do motor 360° até haver MRV instrumentado '
        + 'e verificação por terceira parte. Nenhum crédito foi emitido para este lote.',
      disclaimer: disclaimerConformidade(selo.selo),
    },
    trilha: trilha(lote.id).map(publica),
    verificacao: verificarCadeia(lote.id),
  });
});
