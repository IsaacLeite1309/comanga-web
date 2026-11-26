# CoMangá Web

Frontend do CoMangá, uma SPA para catalogação e consulta de coleções físicas de mangás, light novels, novels, databooks e artbooks. A aplicação oferece autenticação, administração do catálogo e navegação pública por Obras, Edições, Volumes e Autores.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

Site: [comanga.com.br](https://comanga.com.br).

Versão do sistema: **1.0**.

## Visão geral

O `comanga-web` é uma Single Page Application construída com React, TypeScript e Vite. Ela é hospedada na Vercel e consome a API REST do CoMangá por Axios, sempre com `withCredentials: true` para que o cookie de sessão HttpOnly seja enviado pelo navegador.

```text
Navegador -> React SPA/Vercel -> /api -> API Node.js/Render -> Neon e Cloudflare R2
```

Em produção, `vercel.ts` encaminha `/api/*` para a API hospedada na Render. O frontend nunca acessa diretamente o PostgreSQL, o R2 ou segredos de infraestrutura. O envio de e-mails pelo Resend é configurado somente na API.

## Funcionalidades implementadas

### Experiência pública

- Pesquisa pública de Obras e Edições com termo, filtros, ordenação, paginação e parâmetros preservados na URL.
- Alternância entre Obras e Edições preservando o contexto de busca.
- Grid responsivo de capas 2:3, fallback de capa e estados de carregamento, erro e resultado vazio.
- Detalhes públicos de Obra, Edição e Volume.
- Página de Autor com suas Obras públicas.
- Navegação disponível para visitantes e usuários autenticados; conteúdo privado e +18 é filtrado pela API.

### Contas e navegação autenticada

- Cadastro com nascimento obrigatório, login, ativação e reenvio de ativação.
- Recuperação e redefinição de senha por e-mail, com validação compartilhada de senha e limite de 72 bytes em UTF-8. Os formulários reiniciam ao trocar de rota ou token.
- Contexto de autenticação consultando `/api/auth/me` ao iniciar a aplicação.
- Perfil do usuário, logout e preferência de conteúdo adulto, disponível apenas com nascimento informado e 18 anos completos; a API aplica a restrição pública.
- Proteção visual de páginas privadas e administrativas por `ProtectedRoute`; a autorização efetiva permanece no backend.

### Administração

- Gestão de usuários e opções de domínio.
- Cadastro e edição de Obras, Edições e Volumes.
- Consulta administrativa da estrutura Obra -> Edição -> Volume.
- Importação e substituição de capas de Obras e Volumes por URL. A capa da Edição é derivada do Volume 1.

A aplicação oferece coleção e lista de desejos para contas autenticadas e uma página pública de lançamentos.

## Rotas principais

| Área | Rotas |
| --- | --- |
| Conta | `/entrar`, `/cadastrar`, `/activate/:token`, `/reenvio`, `/recuperar-senha`, `/redefinir-senha/:token`, `/perfil/:username` |
| Catálogo público | `/pesquisa`, `/obra/:slug`, `/obra/:slug/edicao/:editionNumber`, `/obra/:slug/edicao/:editionNumber/volume/:volumeNumber`, `/autor/:authorSlug`, `/lancamentos` |
| Área pessoal | `/colecao`, `/desejos` |
| Administração | `/admin/novo-manga`, `/admin/gerenciar-mangas`, `/admin/opcoes`, `/admin/users` e rotas aninhadas de Edições/Volumes |

## Stack e organização

- React 18, TypeScript e Vite.
- React Router para navegação da SPA.
- Axios para integração HTTP e TanStack Query para consultas e cache.
- Tailwind CSS, Radix UI, Lucide e Sonner para interface e feedback.
- Vitest e React Testing Library para testes.

O código é organizado por funcionalidade em `src/features`: `auth`, `profile`, `admin-catalog`, `admin-media`, `admin-users`, `public-catalog`, `collection` e `wishlist`. Cada feature é responsável pelas suas páginas, componentes específicos, estado e regras, expondo sua API pública por `index.ts`. Os testes ficam em `__tests__/`, com a mesma estrutura relativa de `src/`, seguindo o padrão do repositório da API. Coleção e lista de desejos integram as funcionalidades pessoais à API.

`src/App.tsx` e `src/app` compõem rotas, navegação e proteção de páginas. O contexto de autenticação pertence a `features/auth`. Componentes reutilizáveis ficam em `src/components`, o cliente HTTP em `src/services` e utilitários transversais em `src/lib`; essa base compartilhada não depende das features.

Imports entre features usam somente suas APIs públicas e as dependências permitidas em `eslint.config.js`. `npm run lint` verifica as fronteiras com `eslint-plugin-boundaries`, ciclos e resolução de imports com `eslint-plugin-import-x` e o resolver TypeScript. Todo arquivo de produção deve pertencer a uma feature, à composição ou à base compartilhada; arquivos sem classificação e imports de testes são recusados. O código de produção usa `import`: `require()`, `module.require()`, `require.resolve()` e imports dinâmicos com caminho calculado são recusados para manter a detecção de ciclos verificável.

O ESLint também limita a complexidade ciclomática a 15, a profundidade de blocos a 4 e cada função a 150 linhas de código, sempre como erro. Comentários e linhas vazias não entram na contagem. Apenas testes (`*.test.*`, `*.spec.*`, `__tests__`) e arquivos gerados (`*.generated.*`, `src/generated/`) têm exceção de tamanho; complexidade e profundidade continuam obrigatórias. Saídas de build e dependências já ficam fora do lint. Os testes da configuração verificam os limites e o alcance dessas exceções.

`npm run test:architecture` testa essa configuração com o próprio ESLint em projetos temporários, cobrindo também tentativas de contornar as fronteiras por arquivos intermediários. Essas regressões fazem parte de `npm run check`, enquanto a suíte Vitest concentra os testes funcionais. O frontend continua uma SPA separada da API.

## Requisitos

- Node.js 22.12 ou superior.
- API do CoMangá em execução localmente ou acessível no ambiente configurado.

## Configuração local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Crie `.env` na raiz do projeto:

   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. Inicie a interface:

   ```bash
   npm run dev
   ```

O Vite informa a URL local no terminal. A API precisa permitir essa origem em `CORS_ORIGIN` e estar configurada para cookies de desenvolvimento.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o Vite em modo de desenvolvimento. |
| `npm run build` | Gera a versão de produção. |
| `npm run preview` | Serve localmente o build gerado. |
| `npm test` | Executa a suíte Vitest. |
| `npm run test:coverage` | Executa testes com cobertura. |
| `npm run lint` | Executa ESLint, incluindo fronteiras arquiteturais, imports e ciclos. |

## Verificações de qualidade

Use Node.js 22 e `npm ci` para instalar as versões do lockfile.

- `npm run check`: fronteiras arquiteturais, lint sem avisos, build e cobertura mínima de 80% em cada métrica.
- `npm run test:architecture`: regressões da configuração arquitetural do ESLint em projetos temporários.
- `npm run check:online`: auditoria das dependências de produção.
- `npm run typecheck`: valida o código da aplicação, testes e configurações TypeScript; também faz parte do build.

A cobertura inclui páginas, componentes, hooks e rotas. Apenas declarações de tipos, testes, configuração de testes e o ponto de montagem `main.tsx` ficam fora da medição. As páginas administrativas são carregadas sob demanda para reduzir o JavaScript inicial.

O GitHub Actions executa as verificações nos PRs e nos pushes para `develop` e `main`.

A proteção de `develop` e `main` deve ser configurada pelo dono diretamente no GitHub.

## Qualidade e deploy

- Testes cobrem componentes compartilhados, formulários, autenticação, páginas públicas, páginas administrativas e integração de serviços HTTP.
- A interface trata carregamento, erros e estados vazios nas telas assíncronas relevantes.
- GitHub Actions executa cobertura, lint e build em pull requests destinadas a `develop` e `main`.
- Na Vercel, `vercel.ts` mantém `/api` como URL estável para a SPA. Habilite a exposição das variáveis de sistema da Vercel e configure `COMANGA_PREVIEW_API_ORIGIN` no ambiente Preview com a origem HTTPS da API isolada de homologação. O Preview usa `/api` mesmo quando `VITE_API_URL` estiver configurada no projeto. Sem origem de homologação, a Vercel serve a SPA e seus arquivos estáticos e responde HTTP 503 às chamadas de API. Uma origem inválida interrompe o build. Antes de testar o cadastro, faça uma leitura em `/api/public/catalog-options` pelo Preview e confira o `x-request-id` retornado nos logs da API de homologação. O guia de publicação do cadastro com aceite está em `docs/operations/publicacao-cadastro-aceite.md` no repositório da API.

## Documentação e requisitos

A referência de requisitos e cartões está em [`comanga-docs`](https://github.com/IsaacLeite1309/comanga-docs).

## Repositórios relacionados

- [comanga-api](https://github.com/IsaacLeite1309/comanga-api) - API REST, autenticação, catálogo e mídia.
- [comanga-docs](https://github.com/IsaacLeite1309/comanga-docs) - documentação técnica e acadêmica.

## Perfis e conta

Contas com múltiplos perfis podem escolher o perfil ativo na tela de perfil. As rotas administrativas exigem perfil Administrador ativo; possuir a atribuição não basta durante uso como Usuário Padrão. A mesma tela permite alterar username e senha, mantendo a sessão atual e revogando as outras na troca autenticada.

## Metadados e créditos da Obra

Cadastro e edição exigem título romanizado e sinopse própria; o título original continua opcional. A ficha pública distingue títulos e usa a sinopse da Obra. Autores podem ser reordenados por controles acessíveis e o backend preserva a ordem do array. Os valores preenchidos pelo backfill devem passar por revisão editorial.

## Capa da Edição

A Edição usa a capa do Volume de número 1 e não oferece importação de capa própria. Sem essa origem, exibe estado vazio e permanece privada até ter um Volume 1 com capa. Excluir um Volume atualiza também a capa e a contagem do resumo da Edição.

## Gerenciamento e miolo da Edição

O gerenciamento usa caminhos explícitos: `/admin/gerenciar-mangas/obras/:slug/edicoes` para as Edições da Obra e `/admin/gerenciar-mangas/obras/:slug/edicoes/:editionId/volumes` para os Volumes. Os formulários de Edição incluem o campo de seleção múltipla pesquisável `Miolo`, que pode ficar vazio, alimentado pelas opções administrativas da categoria correspondente.
