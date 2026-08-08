#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# RECORTE DE FUNDO BRANCO NOS RETRATOS DE AGENTE
#
# Retrato de agente é PNG com fundo transparente. Quando um chega achatado
# sobre branco, seja por ter sido exportado em JPEG, que não guarda
# transparência, seja por ter sido salvo em PNG já sem alfa, ele aparece na
# tela dentro de uma caixa clara no meio dos cartões escuros.
#
# Aconteceu com cinco dos dez avatares da primeira remessa. Este script devolve
# o alfa a partir do arquivo achatado.
#
# Por que preenchimento a partir da borda, e não "todo pixel branco vira
# transparente": o personagem tem branco DENTRO dele (visor, brilho, metal
# claro). Apagar todo branco furaria o agente. O preenchimento só alcança o
# branco CONECTADO à borda, que é o fundo, e nunca entra por dentro.
#
# A rampa existe porque a borda do render é suavizada: o pixel meio branco na
# silhueta vira meio transparente em vez de virar degrau serrilhado.

import sys
from pathlib import Path
from PIL import Image, ImageDraw

TOLERANCIA = 34      # distância máxima do branco puro para ser considerado fundo
RAMPA_DE = 200       # abaixo disto o pixel é 100% opaco
RAMPA_ATE = 250      # acima disto, dentro da região do fundo, é transparente


def recortar(origem: Path, destino: Path):
    im = Image.open(origem).convert('RGB')
    l, a = im.size

    # Moldura de 1 px de branco puro em volta, para o preenchimento partir de
    # um canto que com certeza é fundo mesmo se o render encostar na borda.
    moldura = Image.new('RGB', (l + 2, a + 2), (255, 255, 255))
    moldura.paste(im, (1, 1))

    SENTINELA = (255, 0, 255)
    ImageDraw.floodfill(moldura, (0, 0), SENTINELA, thresh=TOLERANCIA)
    marcado = moldura.crop((1, 1, l + 1, a + 1))

    px_orig = im.load()
    px_marc = marcado.load()
    saida = Image.new('RGBA', (l, a))
    px_out = saida.load()

    fundo = 0
    for y in range(a):
        for x in range(l):
            r, g, b = px_orig[x, y]
            if px_marc[x, y] == SENTINELA:
                # Região do fundo: transparência proporcional à claridade, para
                # a silhueta suavizada não virar degrau.
                claro = min(r, g, b)
                if claro >= RAMPA_ATE:
                    alfa = 0
                elif claro <= RAMPA_DE:
                    alfa = 255
                else:
                    alfa = int(255 * (RAMPA_ATE - claro) / (RAMPA_ATE - RAMPA_DE))
                    alfa = 255 - alfa
                if alfa == 0:
                    fundo += 1
                px_out[x, y] = (r, g, b, alfa)
            else:
                px_out[x, y] = (r, g, b, 255)

    saida.save(destino, 'PNG')
    return fundo, l * a


# Uso:  python3 scripts/recortar-fundo.py caminho/do/arquivo.jpg [outro.png ...]
#
# Escreve <nome>.png com alfa em web/public/assets/agents/, pronto para o
# converter-imagens.py levar a WebP e gerar a miniatura.
if __name__ == '__main__':
    RAIZ = Path(__file__).resolve().parent.parent / 'web' / 'public' / 'assets' / 'agents'
    for arg in sys.argv[1:]:
        origem = Path(arg)
        destino = RAIZ / f'{origem.stem}.png'
        fundo, total = recortar(origem, destino)
        print(f'{origem.stem:<12} fundo removido: {100 * fundo / total:5.1f}% dos pixels')
