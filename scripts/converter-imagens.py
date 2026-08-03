#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# CONVERSÃO DAS IMAGENS PARA WEBP
#
# A plataforma carregava 37,7 MB de PNG. Quarenta e oito arquivos de 1024px,
# quase todos exibidos em tamanho muito menor: o retrato de agente que ocupa
# 96 pixels na tela vinha em 1024, e num celular no 4G isso é segundos de
# espera por uma imagem que ninguém vai olhar de perto.
#
# A conversão não mexe no layout. Cada arquivo continua no mesmo lugar, com o
# mesmo nome, só que em WebP e no tamanho em que realmente aparece.
#
# AS LARGURAS SÃO DERIVADAS DO USO, NÃO CHUTADAS:
#
#   agents/          maior uso é w-24 h-28, ou seja, 96x112 pontos de tela.
#                    512 cobre isso com folga até em tela de 3x, e ainda serve
#                    de textura no vale 3D.
#   agents/faces/    maior uso é o avatar de 96 pontos. 256 basta.
#   modules/         cartões de módulo na home, perto de 400 pontos de largura.
#   site/            arte de fundo e exemplos, até a largura de uma coluna larga.
#
# O PNG original não é apagado por este script: quem apaga é quem revisa, e só
# depois de conferir o resultado na tela.
#
# Uso:  python3 scripts/converter-imagens.py [--apagar-originais]
# ═══════════════════════════════════════════════════════════════════════════

import sys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent / 'web' / 'public' / 'assets'

# pasta -> (largura máxima, qualidade)
REGRAS = {
    'agents/faces': (256, 84),
    'agents':       (512, 82),
    'modules':      (768, 82),
    'site':         (1024, 82),
    '':             (512, 84),   # raiz: logo
}

# O ícone da aba continua em PNG: o suporte a WebP em favicon ainda é irregular
# fora do Chrome, e é o único arquivo onde isso importa.
FAVICON = ('logo.png', 96)

# ── Miniaturas ────────────────────────────────────────────────────────────
# A tela de elenco mostra vinte e cinco retratos em cartões de 56 pontos, e
# baixava 512 pixels de cada um: 1,2 MB para desenhar polegares. A miniatura
# entra num srcset ao lado do arquivo grande, e o navegador escolhe sozinho:
# cartão pequeno pega a miniatura, ficha aberta pega o retrato inteiro.
MINIATURAS = {'agents': 160}
SUFIXO_MINI = '-mini'


def regra_de(caminho: Path):
    relativo = caminho.parent.relative_to(RAIZ).as_posix()
    if relativo == '.':
        relativo = ''
    # da pasta mais específica para a mais geral
    while True:
        if relativo in REGRAS:
            return REGRAS[relativo]
        if '/' not in relativo:
            return REGRAS['']
        relativo = relativo.rsplit('/', 1)[0]


def converter(origem: Path):
    destino = origem.with_suffix('.webp')
    largura_max, qualidade = regra_de(origem)

    with Image.open(origem) as img:
        img = img.convert('RGBA' if 'A' in img.getbands() else 'RGB')
        antes_dim = img.size
        if img.width > largura_max:
            altura = round(img.height * largura_max / img.width)
            img = img.resize((largura_max, altura), Image.LANCZOS)
        img.save(destino, 'WEBP', quality=qualidade, method=6)

    return {
        'origem': origem, 'destino': destino,
        'bytes_antes': origem.stat().st_size,
        'bytes_depois': destino.stat().st_size,
        'dim_antes': antes_dim, 'dim_depois': img.size,
    }


def gerar_miniaturas():
    """Cria a variante pequena das pastas que aparecem em lista."""
    feitas = 0
    for pasta_rel, largura in MINIATURAS.items():
        base = RAIZ / pasta_rel
        if not base.exists():
            continue
        for origem in sorted(base.glob('*.webp')):
            if origem.stem.endswith(SUFIXO_MINI):
                continue
            destino = origem.with_name(f'{origem.stem}{SUFIXO_MINI}.webp')
            with Image.open(origem) as img:
                if img.width <= largura:
                    continue
                img = img.convert('RGBA' if 'A' in img.getbands() else 'RGB')
                altura = round(img.height * largura / img.width)
                img.resize((largura, altura), Image.LANCZOS).save(
                    destino, 'WEBP', quality=80, method=6)
            feitas += 1
    if feitas:
        total = sum(p.stat().st_size for p in RAIZ.rglob(f'*{SUFIXO_MINI}.webp'))
        print(f'{feitas} miniaturas, {total/1024:.0f} KB no total')
    return feitas


def main():
    apagar = '--apagar-originais' in sys.argv
    if '--so-miniaturas' in sys.argv:
        gerar_miniaturas()
        return
    # O favicon é SAÍDA deste script, não entrada. Sem esta exclusão, a segunda
    # execução o trata como original, converte para WebP e apaga o PNG: o
    # script come a própria saída e o ícone da aba some.
    arquivos = sorted(
        p for p in RAIZ.rglob('*')
        if p.suffix.lower() in ('.png', '.jpg', '.jpeg')
        and p.is_file()
        and p.name != 'favicon.png'
    )

    if not arquivos:
        print('Nenhuma imagem encontrada em', RAIZ)
        return

    antes = depois = 0
    linhas = []

    for origem in arquivos:
        r = converter(origem)
        antes += r['bytes_antes']
        depois += r['bytes_depois']
        corte = 100 - (r['bytes_depois'] * 100 // r['bytes_antes'])
        linhas.append(
            f"{r['bytes_antes']/1048576:6.2f} MB -> {r['bytes_depois']/1024:7.0f} KB  "
            f"({corte:2d}% menor)  {r['dim_antes'][0]}x{r['dim_antes'][1]} -> "
            f"{r['dim_depois'][0]}x{r['dim_depois'][1]}  "
            f"{r['origem'].relative_to(RAIZ)}"
        )

    print('\n'.join(linhas))
    print()
    print(f'{len(arquivos)} imagens')
    print(f'antes:  {antes/1048576:.1f} MB')
    print(f'depois: {depois/1048576:.1f} MB')
    print(f'corte:  {100 - depois*100//antes}%')

    if apagar:
        for origem in arquivos:
            origem.unlink()
        print(f'\n{len(arquivos)} originais apagados.')
    else:
        print('\nOriginais mantidos. Confira o resultado e rode de novo com --apagar-originais.')

    gerar_miniaturas()

    # Por último, e a partir do WebP: o PNG do logo pode já ter sido apagado
    # acima, e o favicon precisa existir de qualquer jeito.
    gerar_favicon()


def gerar_favicon():
    fonte = RAIZ / 'logo.webp'
    if not fonte.exists():
        fonte = RAIZ / FAVICON[0]
    if not fonte.exists():
        print('logo não encontrado: favicon não gerado')
        return
    with Image.open(fonte) as img:
        img = img.convert('RGBA')
        img.thumbnail((FAVICON[1], FAVICON[1]), Image.LANCZOS)
        img.save(RAIZ / 'favicon.png', 'PNG', optimize=True)
    print(f"\nfavicon.png: {(RAIZ / 'favicon.png').stat().st_size/1024:.0f} KB")


if __name__ == '__main__':
    main()
