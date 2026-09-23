# CoMangá Web

Frontend do CoMangá, uma SPA para catalogar e consultar mangás publicados no Brasil. A Web cobre autenticação e conta, catálogo público navegável por Obra, Edição, Volume e Autor, e a administração do catálogo e dos usuários.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

## Visão geral

O `comanga-web` é uma Single Page Application em React, TypeScript e Vite, hospedada na Vercel. Toda a comunicação com o backend passa pela API REST do CoMangá, por um único cliente Axios (`src/services/api.ts`) configurado com `withCredentials: true`. Assim o navegador envia o cookie de sessão HttpOnly emitido pela API.

```text
Navegador -> SPA React (Vercel) -> /api -> API Node.js (Render) -> PostgreSQL (Neon) e Cloudflare R2
```

A Web não acessa diretamente o banco, o armazenamento de capas (R2) nem segredos de infraestrutura. O envio de e-mails (Resend) também fica só na API. As guardas de rota da Web organizam a navegação; quem autoriza de fato cada operação é a API.

Termos como Obra → Edição → Volume, perfis concedidos e perfil ativo seguem a seção 1.3 do SERS, em [`comanga-docs`](https://github.com/IsaacLeite1309/comanga-docs). Ele é a fonte das regras de negócio (RF, RN e RNF), citadas neste README pelos IDs.

## Stack

- React 18, TypeScript 5 e Vite 8 (`@vitejs/plugin-react`).
- React Router 7 (`react-router-dom`) para as rotas da SPA.
- Axios para HTTP.
- Tailwind CSS 3, Radix UI (Tabs), Lucide e Sonner (avisos) na interface.
- Vitest 4, React Testing Library e jsdom nos testes, com cobertura V8.
- ESLint 9 com `typescript-eslint`, `eslint-plugin-boundaries` e `eslint-plugin-import-x` para lint e fronteiras arquiteturais.

## Rotas e proteções

Todas as rotas estão declaradas em `src/App.tsx`. As guardas ficam em `src/app/`.

### Guardas

| Guarda (em `App.tsx`) | Componente | Quem passa | O que acontece com os demais |
| --- | --- | --- | --- |
| `GuestPage` | `GuestRoute` | Visitante (sem sessão) | Usuário autenticado vai para `/perfil/:username` (ou `/perfil`), sem aviso. |
| `ProtectedRoute` | `ProtectedRoute` | Usuário autenticado, com qualquer perfil ativo | Visitante vai para `/entrar` com o aviso "Sua sessão é inválida ou foi encerrada. Por favor, faça login novamente.". O aviso é suprimido no logout voluntário, que mostra apenas "Sessão encerrada com segurança.". |
| `AdminRoute` | `ProtectedRoute requiredRole="Administrador"` | Usuário autenticado com o perfil **Administrador ativo** | Visitante vai para `/entrar` (mesmo aviso de sessão). Usuário com outro perfil ativo, inclusive quem possui o perfil Administrador mas está usando Usuário Padrão, vai para `/perfil/:username` com o aviso "Acesso negado: Você não tem permissão para acessar esta área.". |
| `PublicPage` | `PublicProfileRoute` | Visitante e usuário com perfil ativo Usuário Padrão | Usuário com o perfil **Administrador ativo** vai para `/perfil/:username` com o aviso "Mude o perfil para usuário padrão para acessar essa página." |

Enquanto a sessão é consultada em `/api/auth/me`, as guardas mostram um indicador de carregamento. As páginas administrativas são carregadas sob demanda (`React.lazy`).

### Visitante e conta

| Rota | Tela | Proteção |
| --- | --- | --- |
| `/` | Redireciona para `/entrar` | Nenhuma (a guarda de `/entrar` envia usuários autenticados ao perfil) |
| `/entrar`, `/cadastrar` | Login e cadastro | `GuestPage` |
| `/reenvio` | Reenvio do e-mail de ativação | `GuestPage` |
| `/recuperar-senha` | Pedido de recuperação de senha | `GuestPage` |
| `/redefinir-senha/:token?` | Redefinição de senha pelo link do e-mail | `GuestPage` |
| `/activate/:token` | Ativação da conta pelo link do e-mail | Nenhuma |

Os links de ativação e de redefinição enviados pela API usam o endereço configurado em `FRONTEND_URL` na API e apontam para `/activate/:token` e `/redefinir-senha/:token`.

### Perfil

| Rota | Tela | Proteção |
| --- | --- | --- |
| `/perfil`, `/perfil/:username` | Perfil da conta da sessão | `ProtectedRoute` |

A tela sempre carrega a conta da sessão (`GET /api/users/me`). O `:username` da URL não seleciona outra conta.

### Catálogo público

As URLs de Edição e Volume sempre carregam o contexto da Obra e da Edição. Os caminhos são gerados por `src/features/public-catalog/publicCatalogPaths.ts` (`publicWorkPath`, `publicEditionPath`, `publicVolumePath`).

| Rota | Tela | Proteção |
| --- | --- | --- |
| `/pesquisa` | Pesquisa de Obras e Edições | `PublicPage` |
| `/autores/:authorId` | Autor e suas Obras públicas | `PublicPage` |
| `/obras/:slug` | Obra | `PublicPage` |
| `/obras/:slug/edicao/:editionId` | Edição da Obra | `PublicPage` |
| `/obras/:slug/edicao/:editionId/volume/:volumeId` | Volume da Edição | `PublicPage` |
| `/obras/:slug/edicao/:editionId/selecionar/:mode` | Seleção visual de Volumes (`mode` = `estante` ou `desejos`) | `PublicPage` |

Exemplo com dados fictícios: `/obras/exemplo` → `/obras/exemplo/edicao/10` → `/obras/exemplo/edicao/10/volume/42`.

As telas conferem o contexto recebido da API e respondem como não encontrado quando a URL não corresponde ao registro. Rotas isoladas, como `/edicoes/:id` ou `/volumes/:id`, caem na página de rota inexistente. Regras: SERS RN0071.

### Área pessoal (Em breve)

| Rota | Situação |
| --- | --- |
| `/colecao` | Tela "Em breve" ("Sua Coleção"), sem integração com a API |
| `/checklist` | Tela "Em breve", sem integração com a API |
| `/desejos` | Tela "Em breve", sem integração com a API |
| `/colecao/:slug/edicao/:editionId` | Reutiliza a página pública de Edição, com "Coleção" (`/colecao`) como raiz do breadcrumb e do botão Voltar |
| `/colecao/:slug/edicao/:editionId/selecionar/:mode` | Reutiliza a seleção visual de Volumes; Cancelar e OK voltam para a Edição em `/colecao/...` |

Nenhuma dessas rotas tem guarda, e nenhuma tela fora delas gera links para elas. As duas rotas `/colecao/:slug/edicao/...` abrem, portanto, com qualquer perfil ativo, ao contrário das equivalentes em `/obras/...`, o que é um defeito (veja [Pontos em aberto](#pontos-em-aberto)).

### Administração

Todas as rotas abaixo usam `AdminRoute` e exigem o perfil Administrador ativo. O teste `src/app/adminRouteProtection.test.tsx` enumera as rotas declaradas sob `/admin` e confirma que todas estão protegidas. Os caminhos são gerados por `src/features/admin-catalog/domain/catalogPaths.ts`.

| Rota | Tela |
| --- | --- |
| `/admin/novo-manga` | Cadastro de Obra (formulário em etapas) |
| `/admin/gerenciar-mangas` | Gerenciar mangás: lista de Obras |
| `/admin/gerenciar-mangas/obras/:workSlug/editar` | Edição dos dados da Obra |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes` | Edições da Obra (Gerenciar edições) |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes/nova` | Cadastro de Edição |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/editar` | Edição dos dados da Edição |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes` | Volumes da Edição (Gerenciar volumes) |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes/novo` | Cadastro de Volume |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId` | Formulário de edição do Volume (mesma tela de `/editar`) |
| `/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId/editar` | Formulário de edição do Volume |
| `/admin/pos-cadastro` | Próximos passos após um cadastro, com atalhos como gerenciar o item criado ou cadastrar o próximo nível (sem estado de navegação, volta para Gerenciar mangás) |
| `/admin/opcoes` | Gerenciar opções |
| `/admin/users` | Gerenciar usuários |

### Rota inexistente

Qualquer outro caminho renderiza `src/app/NotFound.tsx` (404) e registra o caminho no console.

## Funcionalidades

### Navegação lateral

`src/app/PublicNav.tsx` mostra itens diferentes conforme o perfil ativo:

- **Visitante e Usuário Padrão**: Coleção, Pesquisar, Checklists e Lista de Desejos, além de Entrar (visitante) ou Meu Perfil (autenticado).
- **Administrador ativo**: Novo mangá, Gerenciar Mangás, Gerenciar Opções e Gerenciar Usuários, além de Meu Perfil.

### Pesquisa pública

- Duas abas, Obras e Edições, com termo (com debounce), filtros, ordenação e paginação (24 itens por página) registrados na URL.
- No filtro de Obra, a lista de tipos de obra é restrita aos tipos compatíveis com o país selecionado, e um tipo incompatível é limpo ao trocar o país.
- Grade de capas 2:3 com fallback, além de estados de carregamento, erro recuperável e resultado vazio.

A API (`/api/public/*`) filtra Obras privadas e conteúdo adulto não autorizado. A Web não decide essa visibilidade. Regras: SERS RF0036, RF0037, RN0046, RN0048 e RN0049.

### Obra, Edição e Volume públicos

**Obra** (`/obras/:slug`): metadados públicos, capa 2:3 e lista das Edições públicas com prévias de Volumes.

**Edição** (`/obras/:slug/edicao/:editionId`):

- Breadcrumb "Pesquisar › Obra › Nª edição" e botão Voltar para a Obra.
- Capa derivada do Volume 1. Sem essa origem, mostra "Capa indisponível".
- Os miolos informados em `papers` aparecem empilhados no campo "Miolo"; uma lista vazia omite o campo.
- Volumes públicos paginados (24 por página, `?page=` na URL), com estado vazio "Nenhum Volume público cadastrado nesta Edição.".
- Os botões "Coleção" e "Lista de Desejos" abrem a seleção de Volumes (`/selecionar/estante` e `/selecionar/desejos`). A seleção é apenas visual: nada é gravado, e OK só volta para a Edição.

**Volume** (`/obras/:slug/edicao/:editionId/volume/:volumeId`):

- Breadcrumb "Pesquisar › Obra › Nª edição › Volume N" e botão Voltar para a Edição, além de atalhos para a Obra e para a Edição.
- Os botões do Volume anterior e do seguinte ficam abaixo da capa e só aparecem quando a API informa o destino (`previousVolume` e `nextVolume`).
- A ficha do Volume não exibe miolo. Os miolos ficam na ficha da Edição, em valores empilhados quando informados.

**Autor** (`/autores/:authorId`): dados do Autor e grade paginada das suas Obras públicas.

Regras: SERS RF0038 a RF0041, RF0051, RN0069, RN0070 e RN0072 (divergências da Web em períodos e capa da Edição na seção 6.3).

### Conta e perfil

- **Cadastro**: a tela valida a data de nascimento e a senha com as mesmas regras da API (`src/features/auth/passwordValidation.ts`).
- **Redefinição de senha**: depois de redefinir a senha pelo link, o usuário é levado a `/entrar`.
- **Sessão**: ao iniciar, o `AuthProvider` consulta `/api/auth/me`. O contexto expõe perfis concedidos (`profiles`), perfil ativo (`active_profile`) e se a conta possui o perfil Administrador. Se o perfil ativo informado não estiver entre os concedidos, a Web considera `Usuário Padrão` (`src/features/auth/authContextState.ts`).
- **Tela de perfil**:
  - Mostra nome de usuário e e-mail.
  - O seletor "Perfil ativo" aparece somente para contas com mais de um perfil (`PATCH /api/users/me/active-profile`).
  - A preferência "Conteúdo +18" aparece somente quando a API informa que a conta pode habilitá-la (`can_enable_adult_content`) e o perfil ativo não é Administrador.
  - "Configurações avançadas" reúne a alteração de nome de usuário, a alteração de senha e a exclusão da conta.

Regras: SERS RF0001 a RF0012, RF0052, RN0002 e RN0048.

### Administração do catálogo

Regras: SERS RF0013 a RF0029 e RF0050, além dos IDs entre parênteses abaixo.

**Gerenciamento por nível.**

- **Gerenciar mangás** lista as Obras. Cada Obra leva a **Gerenciar edições** e cada Edição, a **Gerenciar volumes**. Todos os níveis permitem editar e excluir.
- A visibilidade é alterada na Obra e na Edição. O Volume exibe o estado recebido. As condições de publicação são da API (RN0037, RN0040, RN0069).

**Breadcrumbs** (`AdminCatalogBreadcrumb`, sempre com um botão Voltar para o nível anterior):

| Tela | Caminho exibido |
| --- | --- |
| Edições da Obra | Gerenciar mangás › Edições de *Título da Obra* |
| Editar Obra | Gerenciar mangás › Editar *Título da Obra* |
| Nova Edição / editar Edição | Gerenciar mangás › Edições de *Título da Obra* › Nova edição / Editar *N*ª edição |
| Volumes da Edição | Gerenciar mangás › Edições de *Título da Obra* › Volumes da *N*ª edição |
| Novo Volume / editar Volume | Gerenciar mangás › Edições de *Título da Obra* › Volumes da edição › Novo volume / Editar Volume *N* (ou "Editar volume único") |

**Formulário de Obra** (`/admin/novo-manga` e `.../obras/:workSlug/editar`), em quatro etapas:

1. **Identificação**: o tipo de obra só é liberado depois do país e fica restrito aos tipos compatíveis.
2. **Autoria**: autores e papéis. A ordem dos créditos e os papéis incompatíveis seguem RN0023 e RN0068.
3. **Publicação original e classificação**, com a opção "Sinalizar como Conteúdo +18 (Restrito)":
   - Com status "Em andamento" ou "Em hiato", o ano final fica desabilitado.
   - Artbook e Databook forçam o lançamento direto.
   - Demografias só se aplicam ao tipo Mangá sem lançamento direto. Nos demais casos, o campo é limpo e desabilitado.
   - Com o gênero Hentai selecionado, o formulário marca e trava a opção +18. Ao retirar o Hentai, a opção é desmarcada automaticamente. Na API a regra é outra (RN0067).
4. **Capa e sinopse**: a capa vem antes da sinopse.

Os campos obrigatórios são validados por etapa e os erros aparecem ao lado do campo (RN0026). A tela ainda exige "Título original", que é opcional (veja [Pontos em aberto](#pontos-em-aberto)).

**Formulário de Edição**:

- Campos obrigatórios e opcionais conforme RN0033. Acabamento e Formato usam seleção simples pesquisável; Miolo permite seleção múltipla pesquisável e limpeza da lista, alimentada pelas opções administrativas (`paperIds`).
- A Edição não tem campo de capa, porque a capa vem do Volume 1.

**Formulário de Volume**: duas etapas, **Dados do Volume** e **Capa e sinopse** (campos em RF0025 e RN0039).

**Capas** (`src/features/admin-media`, regras em RN0058 a RN0061):

- A capa é importada informando a URL de origem (`POST /api/admin/media/covers`). Não há envio de arquivo local.
- Substituir uma capa pede confirmação. Uma capa importada e ainda não salva é descartada na API ao ser substituída ou removida.

**Rascunhos**: os formulários guardam o rascunho em memória enquanto se navega pela SPA. O rascunho se perde ao recarregar a página. Com alterações não salvas, os formulários de Obra, Edição e Volume pedem confirmação ao clicar em um link interno e ao recarregar ou fechar a aba.

### Gerenciar opções

`/admin/opcoes` organiza as opções por formulário:

- **Obra**: Autor, Pré-publicação e Editora original. As três listas podem ser filtradas por país.
- **Edição**: Editora brasileira, Acabamento, Formato e Miolo.

A tela permite criar, renomear e excluir valores. Ativar e desativar fica só na API, por decisão. Tipos de obra e gêneros são valores fixos do sistema e não aparecem nesta tela. Regras: SERS RF0030 a RF0033, RN0043, RN0044 e RN0066.

### Gerenciar usuários

`/admin/users` lista as contas com busca e filtros por perfil e status, e permite conceder ou retirar o perfil Administrador de outra conta (`PATCH /api/admin/users/:id/role`). Regras: SERS RF0034, RF0035, RN0045 e RN0063.

## Estrutura do código

```text
src/
  App.tsx            composição das rotas
  main.tsx           ponto de montagem
  app/               guardas, navegação lateral e 404
  features/          módulos por funcionalidade
  components/        componentes compartilhados (formulários, estados assíncronos, UI)
  hooks/, lib/       utilitários transversais
  services/api.ts    cliente HTTP único
  test/              setup do Vitest (Testing Library, matchMedia)
scripts/
  eslint-architecture.test.cjs   testes da política arquitetural do ESLint
```

| Feature | Responsabilidade | Pode depender de |
| --- | --- | --- |
| `auth` | Login, cadastro, ativação, reenvio, recuperação de senha, contexto de sessão e perfis | — |
| `profile` | Tela de perfil, perfil ativo, conteúdo +18 e configurações avançadas | `auth` |
| `public-catalog` | Pesquisa, Obra, Edição, Volume, Autor e seleção visual de Volumes | — |
| `admin-catalog` | Gerenciar mangás, edições e volumes, formulários, opções e pós-cadastro | `admin-media` |
| `admin-media` | Importação e descarte de capas | — |
| `admin-users` | Gerenciar usuários | `auth` |
| `collection` | Telas "Em breve" de Coleção e Checklist | — |
| `wishlist` | Tela "Em breve" de Lista de Desejos | — |

**Fronteiras entre módulos**:

- Cada feature expõe sua API pública em `index.ts`. Outras features e a composição (`App.tsx`, `main.tsx`, `src/app`) só importam esse arquivo.
- A base compartilhada (`components`, `hooks`, `lib`, `services`) não depende de features. Nenhum código de produção importa testes.
- As regras estão em `eslint.config.js`, com `eslint-plugin-boundaries` para as fronteiras e `eslint-plugin-import-x` com o resolver TypeScript para ciclos e resolução de imports.
- Arquivos sem classificação são recusados.
- `require()`, `module.require()`, `require.resolve()` e imports dinâmicos com caminho calculado são proibidos, para manter o grafo verificável.

**Limites de código**:

- O ESLint trata como erro complexidade ciclomática acima de 15, profundidade de blocos acima de 4 e funções com mais de 150 linhas de código. Comentários e linhas em branco não contam.
- Apenas testes e arquivos gerados ficam isentos do limite de tamanho. Complexidade e profundidade continuam valendo para eles.

## Requisitos

- Node.js 22.12 ou superior (`engines` do `package.json`).
- API do CoMangá acessível: local, em `http://localhost:3000` por padrão, ou remota.

## Configuração local

```bash
npm ci
npm run dev
```

O Vite sobe em `http://localhost:8080` e repassa `/api` para a API (`vite.config.ts`). Sem `VITE_API_URL`, o cliente usa `/api` no mesmo endereço da página, então o proxy dispensa configuração de CORS. A origem padrão aceita pela API (`CORS_ORIGIN`) e usada nos links de e-mail (`FRONTEND_URL`) já é `http://localhost:8080`.

### Variáveis de ambiente

| Variável | Onde é lida | Uso | Padrão |
| --- | --- | --- | --- |
| `VITE_API_URL` | `src/services/api.ts` (dev e build; embutida no bundle) | URL base da API usada pelo Axios | `/api` |
| `VITE_API_PROXY_TARGET` | `vite.config.ts` (servidores do Vite: `npm run dev` e `npm run preview`) | Destino do proxy `/api` | `http://localhost:3000` |

`VITE_API_URL` pode ser definida em `.env` na raiz (ignorado pelo Git). `VITE_API_PROXY_TARGET` é lida por `vite.config.ts` em `process.env` e precisa vir do shell, por exemplo `VITE_API_PROXY_TARGET=http://localhost:3001 npm run dev`; no `.env` ela não tem efeito. Com `VITE_API_URL` apontando para outra origem, por exemplo `http://localhost:3000/api`, a API precisa aceitar a origem da Web em `CORS_ORIGIN` e usar cookies compatíveis com esse cenário.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento do Vite. |
| `npm run build` | `typecheck` e build de produção em `dist/`. |
| `npm run build:dev` | Build em modo `development`. |
| `npm run preview` | Serve localmente o build gerado. |
| `npm run typecheck` | `tsc --noEmit` nos projetos `tsconfig.app.json` e `tsconfig.node.json`. |
| `npm run lint` | ESLint sem avisos tolerados (`--max-warnings=0`), incluindo fronteiras, ciclos e limites de código. |
| `npm test` | Suíte Vitest uma vez. |
| `npm run test:watch` | Vitest em modo observação. |
| `npm run test:coverage` | Vitest com cobertura e limites mínimos. |
| `npm run test:architecture` | Testes da política arquitetural do ESLint (`node --test`). |
| `npm run check` | `lint` + `test:architecture` + `build` + `test:coverage`. |
| `npm run check:online` | `npm audit` de todas as dependências, inclusive as de desenvolvimento. |

## Testes e qualidade

- **Unitários e de componentes** (Vitest + Testing Library em jsdom, `src/**/*.{test,spec}.{ts,tsx}`):
  - guardas e rotas (`App.test.tsx`, `src/app/*.test.tsx`);
  - fluxos de autenticação e perfil;
  - páginas públicas e administrativas;
  - componentes de formulário;
  - regras de domínio, como caminhos, papéis de autoria, validação de senha e paginação;
  - serviços HTTP com a API simulada.
- **Arquitetura** (`npm run test:architecture`): executa o ESLint em projetos temporários e confirma que a configuração recusa:
  - imports internos entre features, inclusive por reexport, import dinâmico ou tipos;
  - dependências invertidas e ciclos;
  - pontes por arquivos sem classificação ou por testes;
  - imports não resolvidos.

  Também verifica os limites de complexidade, profundidade e tamanho.
- **Cobertura** (`npm run test:coverage`): provedor V8, com mínimo de 80% em statements, branches, functions e lines. A medição inclui `src/**/*.{ts,tsx}`, exceto testes, declarações `.d.ts`, `src/main.tsx` e `src/test/`.
- **Lint e tipos**: `npm run lint` e `npm run typecheck`. O typecheck também roda dentro do build.

A validação de referência é `npm run check`, executado manualmente na máquina local antes de integrar mudanças. O repositório não tem hooks Git configurados para rodá-lo automaticamente.

## CI

`.github/workflows/quality.yml` define o job "Vitest coverage, ESLint and build". Ele roda em pull requests e pushes para `develop` e `main`, e também manualmente. Usa Node 22 e executa `npm ci`, `npm run check:online` e `npm run check`.

O GitHub Actions da conta está bloqueado por cobrança, então esse workflow não está sendo executado. Ausência de execução remota não significa aprovação nem reprovação. A verificação válida é o `npm run check` local.

## Deploy

A Web é publicada na Vercel como SPA estática gerada por `npm run build`. O `vercel.json` define duas reescritas:

- `/api/:path*` → `https://comanga-api.onrender.com/api/:path*`, a API hospedada no Render.
- Qualquer outro caminho → `/index.html`, para que o React Router trate as rotas.

Com isso, em produção a SPA chama `/api` no próprio domínio e não precisa de `VITE_API_URL`.

## Pontos em aberto

Comportamentos atuais do código que ainda aguardam decisão ou correção:

- **Rotas `/colecao/:slug/edicao/...` sem `PublicPage`**: defeito a corrigir (SERS 6.3).
- **Código residual de valores controlados**: cadeado e Ativar/Desativar de Gerenciar opções, inalcançáveis desde que Tipo de obra e Gêneros saíram da tela (SERS 6.3).
- **Título original obrigatório na tela**: o formulário de Obra (`newMangaLogic.ts`) exige o campo opcional (SERS 6.3).
- **Página administrativa de detalhes do Volume**: `VolumeDetailsPage` é exportada por `admin-catalog`, mas nenhuma rota a usa.
- **Outras divergências da Web**: mensagem do login bloqueado (HTTP 429), períodos e capa ausente da Edição, miolo com vírgula e ISBN sem validação na tela (SERS 6.3).

## Escopo não implementado

Coleção (Estante Digital), Checklist e Lista de Desejos existem apenas como telas "Em breve" e como seleção visual de Volumes, sem persistência nem integração com a API. O estado desses requisitos e das demais funcionalidades futuras está registrado na documentação central, em [`comanga-docs`](https://github.com/IsaacLeite1309/comanga-docs).

## Repositórios relacionados

- [comanga-api](https://github.com/IsaacLeite1309/comanga-api): API REST, autenticação, catálogo e mídia.
- [comanga-docs](https://github.com/IsaacLeite1309/comanga-docs): documentação técnica e acadêmica (SERS, histórias de usuário, ATAM, DAS e diagramas).
