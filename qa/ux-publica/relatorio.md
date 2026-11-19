# Revisão da experiência pública em telas menores

Base da revisão `f152228` de `develop`. As correções foram feitas na branch `feature/ux-publica-mobile`.

## Rotas verificadas

A matriz principal usou Chromium com tela em retrato de 320 × 640, 390 × 844, 600 × 960, 768 × 1.024 e 820 × 1.180 pixels CSS. A largura de 320 px representa um celular estreito. As de 768 e 820 px incluem a troca da navegação inferior pela barra lateral. As rotas foram conferidas na configuração efetivamente montada pelo aplicativo.

| Rotas | O que foi verificado |
| --- | --- |
| `/pesquisa` nas abas Obras e Edições | Capas 2:3 com imagem, imagem indisponível e fallback. Filtros simples e avançados, rótulos e opções longas, seleção e limpeza, parâmetros na URL, ordenação e salto de página. |
| `/lancamentos` | Seletor de mês e ano, pesquisa e filtro de editora, ordenação, botões dos volumes e recuperação de URL inválida. |
| `/obra/:slug` | Capa, título, autoria, dados editoriais, sinopse, prévias de volumes e navegação para autor e edição. |
| `/obra/:slug/edicao/:editionNumber` | Capa, ficha editorial, acesso à obra e ao volume e ações de acervo como visitante e com sessão de usuário padrão simulada. |
| `/obra/:slug/edicao/:editionNumber/volume/:volumeNumber` | Capa, navegação anterior e próxima, retorno à edição, sinopse, botões de acervo e compra disponível ou indisponível. |
| `/autor/:authorSlug` | Nome extenso, títulos e papéis, navegação para as obras e paginação. |
| `/`, `/colecao`, `/desejos` | Redirecionamento inicial para coleção, aviso para visitante, links de login e cadastro e troca entre telas pelo menu. |
| `/entrar`, `/cadastrar` | Abas, campos, botões, navegação e seleção de data de nascimento. |
| `/recuperar-senha`, `/redefinir-senha`, `/redefinir-senha/:token`, `/reenvio`, `/activate/:token` | Legibilidade dos formulários e mensagens, incluindo acesso direto à redefinição sem token e respostas simuladas de ativação. |
| Rota desconhecida | Página 404 e link para voltar ao início. |

Rotas de perfil, edição da coleção e seleção de volumes exigem sessão. A navegação e o estado pessoal nas páginas públicas foram exercitados com conta fictícia. A ficha de edição também é usada pelo acervo autenticado em `/colecao/:slug/edicao/:editionNumber`. Os testes conferem que a ficha e o esqueleto de carregamento aplicam os novos estilos somente na rota pública.

## Problemas e correções

| Rota ou componente | Largura observada | Problema | Correção |
| --- | --- | --- | --- |
| Pesquisa, lançamentos e autor | 320 px | Ao abrir o campo de salto na página 5 com dez páginas, o primeiro botão começava 4 px antes da borda visível e a faixa exigia rolagem. | A paginação do catálogo quebra em linhas e os botões numéricos têm área mínima de 44 × 44 px em telas estreitas. Com o campo aberto, a faixa apresentou 288 px de largura total e 288 px de largura visível. |
| Pesquisa e lançamentos | 320 e 390 px | Rótulos dos filtros e nomes extensos de opções eram cortados. | Rótulos quebram linha e cada opção do menu cresce de acordo com seu conteúdo. |
| Pesquisa, lançamentos e autor | 320 a 820 px | Títulos dos cartões e outros dados apareciam reduzidos a uma linha com reticências, o que exigia acesso ao detalhe para leitura. | Os cartões permitem múltiplas linhas em telas estreitas. |
| Obra e autor | 320 e 768 px | Títulos longos, nomes de autoria e palavras sem espaços podiam ser cortados ou ultrapassar as colunas. Na obra, toda a ficha antecedia o título e a sinopse no celular. | Quebra de palavras longas em tela estreita e título e sinopse antes dos metadados em celulares. A ordem visual do esqueleto de obra acompanha o conteúdo. |
| Edição | 320 e 768 px | A região com rolagem horizontal cortava ações para o início da linha. Com sessão, o primeiro link podia ficar inteiramente fora da área visível. Termos longos ultrapassavam a ficha editorial. | Título, rótulo e ações passam a se distribuir verticalmente, com os botões em colunas que se reacomodam pela largura disponível. Títulos e valores da ficha quebram linha. |
| Volume | 320 a 820 px | A trilha de navegação cortava itens, palavras longas extrapolavam as colunas e a seção da capa ocupava altura excessiva antes da ficha no celular. A indicação de compra indisponível tinha pouco espaço. | A edição e o volume atual têm espaço reservado na trilha. No celular, os demais vínculos ficam na ficha e no menu. A capa mantém a proporção 2:3 e tem limite de tamanho ligado à altura visível. A compra usa a largura da ficha em telas estreitas, com indicação de indisponibilidade legível. |
| Obra, edição, volume e autor com cabeçalho fixo | 320, 390 e 600 px | O aviso disparado por uma ação de visitante podia bloquear o botão Voltar após a troca de página. | O aviso aparece abaixo do cabeçalho fixo no celular, inclusive durante o carregamento de detalhes. |
| Pesquisa, lançamentos e detalhes | 320 e 768 px | Mensagens temporárias deixavam áreas vazias ou somente um botão Voltar depois de desaparecerem. Um link de calendário inválido podia exigir editar a URL. | Erros iniciais continuam disponíveis no fluxo da página em telas estreitas. O calendário permite restaurar a consulta quando recebe parâmetros inválidos. |
| Ativação | 320 px | Mensagem fictícia com uma sequência longa de caracteres podia ultrapassar o cartão. | A mensagem de sucesso ou falha pode quebrar palavras em telas estreitas. |

## Capturas comparativas a 320 px

| Trecho | Antes | Depois |
| --- | --- | --- |
| Ações da edição para visitante | [Edição antes](capturas/edicao-320-antes.png) | [Edição depois](capturas/edicao-320-depois.png) |
| Cabeçalho e ficha do volume | [Volume antes](capturas/volume-320-antes.png) | [Volume depois](capturas/volume-320-depois.png) |

## Validação

- Navegadores Playwright conectados ao Vite em `127.0.0.1`, com chamadas à API interceptadas localmente e dados fictícios de catálogo e sessão. O conjunto incluiu títulos, nomes, sinopses e opções longas, capas válidas, ausentes e com falha, respostas atrasadas, vazias e com erro HTTP.
- Chromium conferiu 142 combinações de rota, largura, estado e sessão, além de 30 fluxos interativos. A conferência mediu a largura da página e dos elementos e verificou controles fora do quadro e textos cortados. As trilhas mantêm reticências para nomes livres, com texto completo nos títulos e na ficha.
- WebKit conferiu 88 combinações e 12 fluxos interativos em retrato a 320 e 768 px. A execução adicional de Chromium verificou 96 casos direcionados, incluindo 640 px, a mudança de layout dos filtros e a prioridade do item atual na trilha do volume.
- Em 14 casos de falha a 320 e 768 px, a mensagem continuou visível depois do fim da notificação. O escopo da edição pública foi conferido separadamente no Chromium e no WebKit com dados e carregamento.
- Os testes de interface verificam a presença do erro na pesquisa, a recuperação de uma URL inválida do calendário e a aplicação do layout público da edição e do carregamento conforme a rota. A suíte existente verifica filtros, navegação, paginação, ações de visitante, acesso autenticado e estados assíncronos.
- `npm run check` aprovou lint, 15 verificações de arquitetura, build e 574 testes Vitest em 64 arquivos. A cobertura foi de 88,81% de instruções, 83,75% de ramificações, 88,62% de funções e 90,99% de linhas. O Vite emitiu aviso de chunk acima de 500 kB e o jsdom informou que não implementa `window.scrollTo`.
- Verificação local emulada, sem depender de dispositivos físicos, serviços de e-mail, pagamentos, catálogo real ou infraestrutura de produção.
