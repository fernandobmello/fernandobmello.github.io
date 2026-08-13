# Survey de conjoint — Eleições 2026

Survey de página única, sem dependências externas: um único `index.html` com
HTML, CSS e JavaScript, mais as imagens. Não precisa de servidor, build nem
framework — basta servir a pasta como site estático.

Esta é a cópia publicada em <https://www.fernandobmello.com/conjoint/>. A cópia
compartilhada com o IBPAD fica em
<https://github.com/fernandobmello/conjoint-eleicoes-2026> — o survey é idêntico;
lá também vão o `export_96/` e o `export_cells.js`, que não são necessários para
servir o site.

```
├── index.html              ← o survey inteiro (HTML + CSS + JS)
├── apps-script.gs          ← backend Google Sheets (instruções dentro do arquivo)
├── assets/                 ← 48 cards recortados + 12 fotos (5 MB)
├── extract_cards.py        ← recorta os 48 cards de notícia dos prints originais
├── extract_photos.py       ← recorta as 12 fotos usadas pelas variantes "post"
├── test_randomization.js   ← simula 5.000 respondentes e confere o balanceamento
(o workflow que publica no Pages fica na raiz deste repositório)
```

## Como colocar no ar

### 1. Criar o backend (obrigatório — sem isso nada é gravado)

1. Crie uma planilha nova em <https://sheets.new>.
2. **Extensões → Apps Script**, apague o conteúdo e cole o `apps-script.gs` inteiro.
3. **Implantar → Nova implantação → App da Web**, com
   *Executar como:* você e *Quem pode acessar:* **Qualquer pessoa**.
4. Copie a URL gerada (termina em `/exec`).

### 2. Ligar o survey ao backend

Abra o `index.html` e troque a constante `ENDPOINT`, logo no começo do `<script>`:

```js
const ENDPOINT = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
```

Enquanto isso não for feito, o survey funciona do início ao fim mas roda em
**modo de teste**: a tela final avisa "endpoint não configurado" e nada é gravado.

### 3. Publicar

Neste repositório o Pages já publica tudo a cada push na `main`, e o survey sai
em `/conjoint/`.

Como é um site estático, também funciona em qualquer outra hospedagem: basta
subir todos os arquivos mantendo a pasta `assets/` ao lado do `index.html`.

### 4. Antes de ir a campo

- Faça um teste completo e confirme que a linha apareceu nas abas `respondents`
  e `conjoint_long` da planilha.
- Confira a classificação de valência das notícias (ver seção adiante).
- Se quiser mudar textos, grupos ou o pool de mensagens, tudo está nas constantes
  no topo do `<script>` do `index.html` — não é preciso mexer no resto do código.

## Escala de frequência de 7 pontos

Três perguntas usam a mesma escala, definida uma única vez em `FREQ_SCALE` e
montada por `renderFreqScale()` — frequência de compartilhamento no WhatsApp
(tela 1) e os dois itens de exposição a conflito (tela 3):

| Valor | Rótulo |
|---|---|
| 6 | Várias vezes por dia |
| 5 | Uma vez por dia |
| 4 | Várias vezes por semana |
| 3 | Uma vez por semana |
| 2 | Menos de uma vez por semana |
| 1 | Muito raramente |
| 0 | Nunca |

Valor maior = mais frequente. Como as três perguntas leem da mesma constante,
não há risco de uma ficar diferente das outras.

As duas perguntas em formato de botões vão de **1 a 7**: interesse por política
(1 = nenhum interesse, 7 = muito interesse) e importância de influenciar a
opinião dos outros (1 = nada importante, 7 = extremamente importante).

As três perguntas de voluntariado (2018, 2022, 2026) são **Sim / Não**, sem
"prefiro não responder": a opção tende a atrair muita gente e esvaziar a medida.

## Contadores de reação e encaminhamento

Nos prints originais os contadores estavam gravados na imagem e variavam demais:
o nível `high` ia de **4,2 mil a 21,3 mil** reações conforme a notícia, ou seja,
a fonte acabava confundida com a magnitude da viralização.

Hoje a faixa de contadores é **recortada fora do card** e desenhada em CSS, igual
nas quatro fontes:

| Nível | Faixa |
|---|---|
| `high` | 500 a 1.300 reações e encaminhamentos |
| `low`  | 5 a 30 |

A faixa fica presa ao conteúdo nas quatro fontes (dentro do card de notícia e
dentro do balão do post), e o ícone de encaminhamento começa sempre na mesma
posição — uma coluna fixa de 52%, não uma margem — para que a distância entre os
emojis e o ícone não mude conforme o número tenha 1, 2 ou 4 dígitos.

Os números são sorteados **por célula, de forma determinística** (`countsFor()`,
a partir do `profile_id`): cada uma das 96 células tem sempre o mesmo par, então
o PNG exportado é idêntico ao que o respondente vê e a viralização continua um
fator de dois níveis limpo. Para mudar as faixas, edite `COUNT_RANGE` no
`index.html` e rode `node export_cells.js` de novo.

## As 96 células como imagem

`assets/` guarda os **insumos** que o survey usa: 48 cards recortados (sem os
contadores) e 12 fotos. Nenhuma das quatro fontes é hoje uma imagem completa —
todas terminam de ser montadas em CSS no navegador.

As 96 células já renderizadas ficam em `export_96/`, no repositório do IBPAD —
servem para portar o survey para outra plataforma, revisar e pré-registrar, e
não são necessárias para servir o site.

Para não haver divergência, o `export_cells.js` **lê o CSS e a função
`cardHTML()` de dentro do `index.html`** — não reescreve o desenho. Depois de
mexer no visual dos cards ou nas faixas de contadores, rode de novo:

```bash
node export_cells.js     # precisa do Google Chrome e do ImageMagick
```

As imagens saem com 836 px de largura, já sobre o fundo do chat do WhatsApp —
e não com fundo transparente, de propósito: num fundo branco, um balão branco
com pílulas brancas ficaria praticamente invisível.

## Os prints originais não estão aqui

`assets/` já vem pronto. Os prints originais do WhatsApp (~89 MB), dos quais os
cards foram recortados, ficam fora do repositório. Eles só são necessários para
**regerar** as imagens:

```bash
python3 extract_cards.py /caminho/para/os/prints   # recorta os 48 cards
python3 extract_photos.py                          # recorta as 12 fotos
```

## Desenho do conjoint

Dois blocos de **5 tarefas** cada. A ordem dos blocos é sorteada por respondente
(50% A→B, 50% B→A) e gravada em `block_order`.

| Bloco | Grupo de WhatsApp | Composição |
|---|---|---|
| A | *Flávio 2026 / Fora PT* | só eleitores de Flávio Bolsonaro e críticos ao PT |
| B | *Política 2026* | eleitores de Lula, de Flávio, de outros e indecisos |

Cada bloco começa com uma tela de introdução que mostra uma conversa de grupo
simulada. Em cada tarefa o respondente vê duas telas de WhatsApp lado a lado e
escolhe uma — a escolha é obrigatória.

A moldura de cada opção (nome do grupo, mensagens anteriores, barra de digitação)
é desenhada em CSS, então o contexto acompanha o bloco.

**Bloco A — Flávio 2026 / Fora PT.** Sempre as mesmas duas mensagens; o que muda
é a **ordem**, definida pela valência do card, de modo que a mensagem que
"responde" ao conteúdo fica colada nele:

| Card | Ordem exibida |
|---|---|
| pró-Flávio (`pro_bolsonaro`) | Fora Lula e PT! → Flávio Bolsonaro, Presidente! |
| anti-PT / negativo para Lula (`anti_pt`) | Flávio Bolsonaro, Presidente! → Fora Lula e PT! |
| indefinido (`unclear`) | sorteada |

Como a ordem depende do card, os dois lados de um mesmo par podem aparecer em
ordens diferentes. Quem diz cada mensagem é sorteado uma vez por respondente e
não muda de tarefa para tarefa. A ordem efetivamente exibida é resolvida no
momento em que a tarefa é montada e gravada em `left_ctx` / `right_ctx` — inclusive
nos casos `unclear`, em que ela é aleatória.

**Bloco B — Política 2026.** Saudações neutras, sorteadas **uma vez por bloco** e
repetidas nas 5 tarefas, gravadas em `context_B`. Pool e quantidade (`CTX_COUNT`)
ficam em `BLOCKS`, no `index.html`.

### Checagem de manipulação

Logo depois da introdução de cada bloco, antes das tarefas, o respondente
precisa dizer em que tipo de grupo vai compartilhar. A ordem das cinco
alternativas é sorteada **por bloco** (independentemente uma da outra), e o
botão "Próximo" só libera quando ele acerta:

| Bloco | Resposta certa |
|---|---|
| A | Grupo de eleitores bolsonaristas e antipetistas |
| B | Grupo com eleitores de diferentes candidatos, incluindo indecisos |

Acerto mostra em verde *"Correto! Você vai compartilhar no …"* e trava a
resposta. Erro mostra em vermelho *"Incorreto! Tente novamente"* e mantém o
avanço bloqueado — o respondente pode tentar quantas vezes quiser, e há um
botão "← Ver o grupo de novo" que volta para a conversa.

Gravado por bloco: `mc_A_first` / `mc_B_first` (primeira alternativa marcada),
`mc_A_attempts` / `mc_B_attempts` (tentativas até acertar), `mc_A_correct1st` /
`mc_B_correct1st` (1 se acertou de primeira) e `mc_A_order` / `mc_B_order` (a
ordem exibida). Como todo mundo acaba acertando, o que mede atenção é o
`correct1st` e o número de tentativas — não a resposta final.

### ⚠️ A classificação de valência é um julgamento — confira

`valence` está em `STORIES`, no `index.html`, e foi atribuída por leitura da
manchete:

| Valência | Notícias |
|---|---|
| `pro_bolsonaro` | f4 (PF inocenta Flávio), f6 (Flávio 68%), t1 (Trump elogia Flávio) |
| `anti_pt` | f3 (filho de Lula/Azul), f5 (Lula critica Neymar), t2 (PF investiga Lulinha), t3 (Lula e Alcolumbre em 'segredo') |
| `unclear` | f1 (urna fraudada), f2 (TSE premiado), t4 (Flávio pede desculpas), t5 (Fundo Eleitoral), t6 (vereador/ONG) |

Os casos limítrofes são **t3** (reportagem factual, mas o enquadramento de
"segredo" pesa contra Lula) e **f1/f2**, que mexem com o sistema eleitoral sem
citar Flávio nem Lula. Se discordar, basta trocar o valor em `STORIES`.

### Introdução animada e tempo mínimo

As mensagens da conversa **surgem uma a uma** (400 ms até a primeira, 700 ms entre
as demais), como numa conversa real. O botão "Continuar" começa desativado e só
libera quando as duas condições forem cumpridas: a última mensagem já apareceu
**e** passaram-se pelo menos 3 s. Enquanto isso o botão mostra a contagem
("Aguarde 3s…"). Na prática dá 3,2 s no bloco A (4 mensagens) e 3,9 s no bloco B
(5 mensagens). Constantes no topo do `<script>`: `MIN_INTRO_MS`, `MSG_DELAY_MS`,
`MSG_START_MS`.

O piso de 3 s vale só para as duas telas de introdução. Para aplicar um piso
parecido às 10 telas de tarefa (contra respondente acelerado), o mesmo mecanismo
pode ser reaproveitado em `requireProfile()` — hoje ele não trava por tempo.

### Atributos randomizados

| Atributo | Níveis | Observação |
|---|---|---|
| Notícia | `f1`–`f6` (falsas), `t1`–`t6` (verdadeiras) | 12 níveis |
| Fonte   | `g1`, `no_source`, `post`, `post_source` | 4 níveis |
| Viralização | `high`, `low` | contadores de reação/encaminhamento |

Fonte e viralização são sorteadas de forma independente e uniforme para cada um
dos dois perfis de cada par → 12 × 4 × 2 = **96 células**, todas disponíveis.

Os quatro níveis de fonte:

| Nível | O que aparece |
|---|---|
| `g1` | card jornalístico com a marca **G1**, editoria, manchete, linha fina, assinatura, foto e contadores |
| `no_source` | o mesmo card jornalístico, **sem** a marca |
| `post` | mensagem encaminhada, **sem fonte nenhuma**: manchete + "Por que não falam sobre isso? / Compartilhe antes que apaguem" + foto, com os contadores em pílulas embaixo do balão |
| `post_source` | a mesma mensagem encaminhada, assinada por uma página desconhecida (**Brasil Notícias**, "Página de notícias") |

As notícias são sorteadas **sem reposição dentro de um bloco**: as 5 tarefas de um
bloco usam 10 das 12 notícias, então nenhuma manchete se repete dentro do mesmo
bloco (e nunca aparece dos dois lados do mesmo par). Notícias podem se repetir
entre o bloco A e o bloco B. Para sortear com reposição, mude
`NO_REPEAT_WITHIN_BLOCK = false` no `index.html`.

Verificado por simulação (`test_randomization.js`, 5.000 respondentes, 100.000
perfis): ordem dos blocos 50,0/50,0; cada notícia ≈8,3%; cada nível de fonte
≈25,0%; viralização 50,0/50,0; zero pares com a mesma notícia dos dois lados,
zero repetições dentro de bloco, zero asset inválido.

```bash
node test_randomization.js
```

## Assets

O print inteiro deixou de ser a imagem. Hoje a imagem é só o **card de notícia**
(ou só a **foto**, nas variantes desenhadas), e toda a moldura do WhatsApp —
nome do grupo, mensagens anteriores, barra de digitação — é desenhada em CSS.
Foi isso que permitiu ligar o estímulo ao tipo de grupo e completar as 96 células.

```
assets/  60 arquivos, 5,0 MB
├── <noticia>_g1_<high|low>.jpg          24 cards com marca G1
├── <noticia>_no_source_<high|low>.jpg   24 cards sem marca
└── photo_<noticia>.jpg                  12 fotos (usadas por post e post_source)
```

Todos com 800 px de largura. As variantes `post` e `post_source` não têm arquivo:
são montadas em CSS a partir da manchete + `photo_<noticia>.jpg`, então as 48
células dessas duas fontes saem das mesmas 12 fotos.

`extract_cards.py` separa o card das bolhas de conversa e da barra de digitação
pela geometria (todos são quase brancos): acha faixas brancas largas, agrupa pela
coluna onde começam e estende o recorte pelas bordas internas do card, o que
atravessa a foto do meio. Os 48 recortes foram conferidos um a um.

### O que o recorte resolveu

Os prints originais vinham em alturas de 750 a 1777 px e, em 5 das 12 notícias,
o `g1` e o `no_source` da mesma notícia tinham sido capturados em zooms
diferentes — o texto do `no_source` saía maior, confundindo a fonte (variável
manipulada) com a escala de renderização.

Recortando o card e normalizando todos para 800 px de largura, isso desaparece:
o conteúdo passa a ter a mesma escala em todas as células. A moldura tem altura
fixa (`.wa--task { height: 600px }`), então os dois lados de um par ocupam
exatamente a mesma caixa; o card dentro dela varia de altura conforme o conteúdo,
como num WhatsApp de verdade.

## Perguntas condicionais sobre partidos (tela 2)

Quem responde **Sim** para "existe algum partido que representa a sua forma de
pensar?" recebe *Qual partido você **MAIS** gosta?*; quem responde **Sim** para
"existe algum partido de que você não gosta?" recebe *Qual partido você **MENOS**
gosta?*. As duas aparecem logo abaixo da pergunta-filtro, marcadas por uma barra
azul à esquerda, e só então passam a ser obrigatórias. Se o respondente voltar a
"Não", a resposta é apagada e deixa de ser exigida.

Lista (11 partidos + `Outro`): MDB, PSDB, NOVO, Republicanos, União Brasil, PDT,
PL, PSOL, PT, PSB, PSD.

A ordem é sorteada por respondente, **independentemente para cada uma das duas
perguntas**, com `Outro` sempre fixo em último — não faz sentido randomizar uma
categoria residual. A ordem exibida é gravada em `partido_gosta_order` e
`partido_menos_order` (separadas por `|`), o que permite testar efeito de ordem
depois.

## Dados gravados

**Aba `respondents`** — 1 linha por respondente: `respondent_id`, `block_order`,
`context_A`/`context_B` (mensagens sorteadas de cada bloco), o bloco de consumo
de notícias da tela 3 (`midia` e `plataformas` como lista separada por `|`,
`busca`, `exp_odio`, `exp_briga`, `silenciou`, `saiu_grupo`, `evitou`,
`voluntario_2018/2022/2026`),
`start_time`/`end_time`, consentimento, as 3 perguntas pré-tratamento, partidos
(`partido_sim`/`partido_gosta`, `partido_nao`/`partido_menos`, mais as duas
colunas de ordem), os 2 termômetros (0–100), bolsonarista/antipetista, e toda a
demografia. `partido_gosta` e `partido_menos` ficam vazios quando a pergunta-filtro
foi "Não".

**Aba `conjoint_long`** — 1 linha por tarefa (10 por respondente), com
`left_*`, `right_*` e `chosen_*` para notícia, veracidade, fonte, viralização e
valência, mais `left_ctx`/`right_ctx` (as mensagens exibidas acima de cada card,
na ordem em que apareceram), `rt_ms` (tempo na tela) e `block_position`. Para AMCE em `cjoint`/R basta
fazer o reshape de wide (par) para long (perfil).

**Aba `raw`** — JSON completo, backup caso algum campo mude.

## Tela final

Além do agradecimento e do aviso sobre o sorteio, a tela final traz o
**esclarecimento** nos moldes do projeto Bahia: avisa que parte das mensagens
reproduzia conteúdo falso criado para a pesquisa, pede que o respondente ignore
e não compartilhe esse conteúdo, esclarece que os grupos são fictícios e que as
manchetes não representam a posição dos pesquisadores nem dos veículos cujas
marcas aparecem, e promete o material de correção por e-mail.

A tela **não exibe as respostas** do respondente. O payload só vai para o
console do navegador quando o `ENDPOINT` ainda não foi configurado (modo de teste).

## Estrutura de telas

| Tela | Conteúdo |
|---|---|
| 0 | Consentimento (recusa → tela 99, encerra) |
| 1 | Interesse por política (1–7) · importância de influenciar (1–7) · frequência de compartilhamento (7 pontos) |
| 2 | Partidos (+ 2 perguntas condicionais) · termômetros · bolsonarista vs. antipetista |
| 3 | Consumo de notícias · plataformas · busca por política · exposição a conflito (7 pontos) · evitação · voluntariado em 2018/2022/2026 |
| 4–10 | Primeiro bloco: introdução + checagem + 5 tarefas |
| 11–17 | Segundo bloco: introdução + checagem + 5 tarefas |
| 18 | Gênero · idade · escolaridade · renda |
| 19 | Cor/raça · estado · religiosidade · perda de status |
| 20 | Agradecimento + envio |

As telas 4–17 são geradas por JavaScript no momento do consentimento, já na ordem
sorteada. Todas as perguntas são obrigatórias e validadas antes de avançar; não há
botão de voltar de dentro do conjoint para as telas anteriores.

## Testado

Fluxo completo percorrido no navegador (desktop 1280px e mobile 375px):
validação bloqueia páginas incompletas, os termômetros exigem interação,
escolha obrigatória em cada tarefa, payload final íntegro com as 10 linhas de
conjoint. Toque duplo em "Começar" não duplica as telas.

Perguntas condicionais de partido: escondidas no início e com "Não"; aparecem com
"Sim"; bloqueiam o avanço enquanto não respondidas; ordens sorteadas diferentes
entre as duas perguntas, 12 opções em cada, `Outro` por último; ao voltar de "Sim"
para "Não" a resposta é apagada e o avanço é liberado.

Introdução: mensagens surgem uma a uma nas duas telas, cada bloco anima e libera
de forma independente, e clicar no botão travado não avança.

Tamanho: medidos os pares no navegador — os dois lados ocupam exatamente a mesma
caixa (316×647 no desktop), inclusive quando um lado é card de notícia e o outro
é mensagem encaminhada, e o card mais alto do conjunto cabe na área de conversa.

Cobertura das 96 células: todas geram markup válido, e os 60 arquivos que elas
referenciam carregam, todos com 800 px de largura.

Contexto do bloco B: sorteado uma vez, idêntico nas 5 tarefas e nos dois lados.

Ordem das mensagens no bloco A: 400 sorteios × 12 notícias — `pro_bolsonaro`
sempre "Fora Lula e PT!" primeiro, `anti_pt` sempre "Flávio Bolsonaro,
Presidente!" primeiro, `unclear` 51/49 entre as duas ordens, zero violações da
regra. Conferido também que o texto no DOM bate com o que vai gravado em
`left_ctx`/`right_ctx`, inclusive nos `unclear`.

Tela final: mostra o esclarecimento e **não** exibe as respostas do respondente.
