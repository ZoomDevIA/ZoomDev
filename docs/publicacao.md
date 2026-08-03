# Publicação do MVP

O construtor entregava um ZIP. Um ZIP não é um produto: é um arquivo que o
fundador precisa hospedar em algum lugar antes de mostrar para alguém. Entre
"tenho um ZIP" e "mandei o link no WhatsApp" existe um abismo de fricção, e é
nele que a maioria dos projetos para.

Agora o site tem endereço, vai ao ar num clique, e o formulário dele entrega
de verdade.

---

## 1. O endereço

`POST /api/projects/:id/site`

| | |
|---|---|
| Formato | `zoomdev.app/s/rastro-do-acai` |
| Regra | 3 a 40 caracteres, letras minúsculas, números e hífen |
| Sugestão | derivada do nome do projeto, sem acento e sem pontuação |
| Colisão | `acai`, `acai-2`, `acai-3` |
| Reservados | `api`, `assets`, `previa`, `admin`, `painel`, `studio` e mais alguns |

Trocar de endereço **libera o anterior**. Deixá-lo preso serviria só para
impedir que outra pessoa usasse um nome que ninguém mais quer. O custo é que
quem tiver o link antigo cai numa página de endereço não encontrado, e a
interface avisa isso antes.

## 2. A cópia congelada

O que vai ao ar é uma **cópia do código no momento da publicação**, não um
espelho do editor.

Sem isso, qualquer rascunho salvo apareceria no ar imediatamente, e o fundador
não teria como mexer no produto sem mexer no que está publicado. Com a cópia,
publicar vira uma decisão.

Quando o editor fica à frente do que está no ar, o painel mostra um aviso
amarelo: *"Você editou o código depois de publicar. O que está no ar ainda é a
versão anterior."*

---

## 3. A decisão de segurança que manda neste módulo

O site é **código gerado por IA, servido do mesmo domínio da plataforma**. Sem
cuidado, o JavaScript desse site leria `localStorage` da origem, onde mora o
token de quem estiver logado na ZoomDev. Bastaria um MVP mal gerado, ou uma
instrução escondida num anexo, para virar roubo de sessão.

A resposta é o diretivo `sandbox` na política de conteúdo:

```
sandbox allow-scripts allow-forms allow-popups allow-modals
        allow-top-navigation-by-user-activation;
default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';
img-src data: blob: https:; connect-src 'none'; form-action 'self';
frame-ancestors 'none'
```

Sem `allow-same-origin`, o documento cai numa **origem opaca**. Desenha, roda
script, aceita clique e envia formulário, mas não enxerga o armazenamento nem
os dados da plataforma.

`allow-top-navigation-by-user-activation` existe para os links entre as
páginas do próprio site funcionarem. Sem ele, o site publicado seria uma
página só, sem saída.

**Verificado no navegador:** a página renderiza com o CSS aplicado, e
`localStorage.getItem('zd_token')` de dentro do site devolve nada.

### O preço, e como foi pago

Em origem opaca, `localStorage` lança exceção, e o MVP gerado guarda estado
nele. Por isso entra um substituto em memória no topo do documento, antes de
qualquer script do produto.

Para um site publicado isso é o comportamento certo: o que interessa persistir
é o contato, e o contato vai para o servidor.

---

## 4. O formulário que entrega

O MVP gerado guardava o lead no navegador do visitante, o que equivale a jogar
fora.

Na montagem da página, todo `<form>` **sem destino próprio** passa a apontar
para a rota de captura. Formulário que já traz `action` para fora é respeitado.

É **POST de formulário, não fetch**, de propósito: em origem opaca um fetch
seria requisição de outra origem e esbarraria em CORS, enquanto o envio nativo
funciona e ainda continua funcionando com o JavaScript desligado.

### Reconhecimento sem depender do agente

O nome e o e-mail são deduzidos dos campos (`nome`, `name`, `email`, ou
qualquer valor que contenha `@`), e todo o resto é guardado como veio. Assim a
captura funciona independentemente de como o agente nomeou os campos.

### O aviso fecha o ciclo

O contato chega no e-mail do fundador na hora, com botão de responder. Sem
isso, o lead ficaria esperando alguém abrir a plataforma, e um contato que
espera dois dias já não é mais um contato.

Todos ficam também no Estúdio, na aba Contatos.

---

## 5. O defeito que só apareceu no navegador

O primeiro envio de formulário devolveu **403 Origem não autorizada**.

A política de origem estava montada globalmente. O site roda em origem opaca,
e o navegador manda `Origin: null` no envio do formulário; o middleware via uma
origem estranha e barrava. Nenhum contato entrava.

A correção foi mover a política para onde ela pertence:

```js
app.use('/api', cors);   // e não app.use(cors)
```

Um site na internet não é chamada de API, e CORS não tem o que dizer sobre ele.
A API continua barrando origem estranha com 403; conferido nos dois sentidos.

Há um teste dedicado a isso, porque a falha é silenciosa: o site continua no
ar, bonito, e só os contatos somem.

---

## 6. Privacidade dos contatos

| | |
|---|---|
| Origem | só os dois primeiros octetos do IP (`187.45`), o bastante para distinguir origem sem guardar de onde a pessoa acessou |
| Teto | 500 contatos por projeto |
| Onde | no arquivo de conteúdo do projeto, fora do índice |
| Exportação e exclusão | acompanham o projeto, como todo o resto |

---

## 7. Mapa

```
server/src/services/publicacao.js     endereço, cópia, montagem, contatos
server/src/services/blindagem.js      POLITICA_SITE
server/src/index.js                   GET /s/:slug/:pagina?  ·  POST /s/:slug/lead
server/src/routes/projects.js         GET POST DELETE /api/projects/:id/site
web/src/components/studio/Publicacao.jsx   painel de endereço e contatos
server/test/blindagem.test.js         11 testes da publicação
```

## Limites conhecidos

- **Uma página inicial e as páginas HTML do MVP.** Sem blog, sem rotas
  dinâmicas, sem SEO além do que o gerador escrever no `<head>`.
- **Sem domínio próprio por site** ainda. Quando existir, a origem já será
  outra e a restrição de sandbox poderá afrouxar.
- **Imagens externas** funcionam (`img-src https:`), mas o MVP gerado não usa
  nenhuma por enquanto.
