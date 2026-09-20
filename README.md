# CoMangá Web

Frontend do CoMangá, uma SPA para catalogação e consulta de coleções físicas de mangás. A aplicação oferece autenticação, administração do catálogo e navegação pública por Obras, Edições, Volumes e Autores.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

## Visão geral

O `comanga-web` é uma Single Page Application construída com React, TypeScript e Vite. Ela é hospedada na Vercel e consome a API REST do CoMangá por Axios, sempre com `withCredentials: true` para que o cookie de sessão HttpOnly seja enviado pelo navegador.

```text
Navegador -> React SPA/Vercel -> /api -> API Node.js/Render -> Neon e Cloudflare R2
```

Em produção, `vercel.json` redireciona `/api/*` para a API hospedada na Render. O frontend nunca acessa diretamente o PostgreSQL, o R2 ou segredos de infraestrutura. O envio de e-mails pelo Resend é configurado somente na API.

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
- Importação e substituição de capas internas obrigatórias por URL, com feedback de interface. Capas já associadas não podem ser removidas sem substituição.

As páginas de Coleção, Checklist e Lista de Desejos existem como navegação/estrutura visual, mas Estante Digital e Lista de Desejos ainda não possuem suas regras e integrações finais implementadas.

## Rotas principais

| Área | Rotas |
| --- | --- |
| Conta | `/entrar`, `/cadastrar`, `/activate/:token`, `/reenvio`, `/recuperar-senha`, `/redefinir-senha/:token`, `/perfil/:username` |
| Catálogo público | `/pesquisa`, `/obras/:slug`, `/edicoes/:editionId`, `/volumes/:volumeId`, `/autores/:authorId` |
| Área pessoal | `/colecao`, `/checklist`, `/desejos` |
| Administração | `/admin/novo-manga`, `/admin/editar-mangas`, `/admin/opcoes`, `/admin/users` e rotas aninhadas de Edições/Volumes |

## Stack e organização

- React 18, TypeScript e Vite.
- React Router para navegação da SPA.
- Axios para integração HTTP.
- Tailwind CSS, Radix UI, Lucide e Sonner para interface e feedback.
- Vitest e React Testing Library para testes.

O código é organizado por funcionalidade em `src/features`: `auth`, `profile`, `admin-catalog`, `admin-media`, `admin-users`, `public-catalog`, `collection` e `wishlist`. Cada feature é responsável pelas suas páginas, componentes específicos, estado, regras e testes, expondo sua API pública por `index.ts`. As duas últimas preservam as telas provisórias e não representam funcionalidades de coleção/desejos concluídas.

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
- `npm run check:online`: auditoria de todas as dependências, incluindo ferramentas de desenvolvimento.
- `npm run typecheck`: valida o código da aplicação, testes e configurações TypeScript; também faz parte do build.

A cobertura inclui páginas, componentes, hooks e rotas. Apenas declarações de tipos, testes, configuração de testes e o ponto de montagem `main.tsx` ficam fora da medição. As páginas administrativas são carregadas sob demanda para reduzir o JavaScript inicial.

O GitHub Actions executa as verificações nos PRs e nos pushes para `develop` e `main`.

A proteção de `develop` e `main` deve ser configurada pelo dono diretamente no GitHub.

## Qualidade e deploy

- Testes cobrem componentes compartilhados, formulários, autenticação, páginas públicas, páginas administrativas e integração de serviços HTTP.
- A interface trata carregamento, erros e estados vazios nas telas assíncronas relevantes.
- GitHub Actions executa cobertura, lint e build em pull requests destinadas a `develop` e `main`.
- O deploy é realizado na Vercel; a regra de rewrite do arquivo `vercel.json` mantém `/api` como URL estável para a SPA.

## Escopo ainda planejado

Calendário público, Estante Digital funcional, Lista de Desejos funcional, dados de posse/desejo no catálogo e a futura arquitetura distribuída ainda serão desenvolvidos. A referência de requisitos e cartões está em [`comanga-docs`](https://github.com/IsaacLeite1309/comanga-docs).

## Repositórios relacionados

- [comanga-api](https://github.com/IsaacLeite1309/comanga-api) - API REST, autenticação, catálogo e mídia.
- [comanga-docs](https://github.com/IsaacLeite1309/comanga-docs) - documentação técnica e acadêmica.

## Perfis e conta

Contas com múltiplos perfis podem escolher o perfil ativo na tela de perfil. As rotas administrativas exigem perfil Administrador ativo; possuir a atribuição não basta durante uso como Usuário Padrão. A mesma tela permite alterar username e senha, mantendo a sessão atual e revogando as outras na troca autenticada. Requer os endpoints de perfis/conta da API e a migration `20260920120000_perfis_de_acesso`.

## Metadados e créditos da Obra

Cadastro e edição exigem título romanizado e sinopse própria; o título original continua opcional. A ficha pública distingue títulos e usa a sinopse da Obra. Autores podem ser reordenados por controles acessíveis e o backend preserva a ordem do array. Requer a frente correspondente da API e revisão editorial dos valores preenchidos pelo backfill.

## Capa da Edição

A Edição usa a capa do Volume de número 1 e não oferece importação de capa própria. Sem essa origem, exibe estado vazio e permanece privada até ter um Volume 1 com capa. Excluir um Volume atualiza também a capa e a contagem do resumo da Edição. Requer a API correspondente; coordenar a publicação com a migration que remove editions.cover_asset_id.

## Opções controladas e catálogo adulto

Tipos de Obra e gêneros permitem apenas ativação/desativação. Tipos de Edição podem ser ordenados; os botões respeitam ASC/DESC. Formulários oferecem tipos compatíveis com o país e preservam vínculos legados somente na própria Obra, sem oferecê-los em novos cadastros. A pesquisa usa relações tipo/país e atualiza opções conforme a sessão; a API é a autoridade da política adulta e da autorização.

## Regressões transversais

Testes cobrem proteção das rotas administrativas e acessibilidade dos controles de autenticação. As regressões de cada regra acompanham a respectiva frente funcional. `npm run check` mantém lint, arquitetura, build e cobertura com piso de 80%.

## Paginação de Edições e Volumes

Listas administrativas usam oito registros por página, em lista e grade. A página é preservada por Obra/Edição ao retornar dos formulários na mesma aba, e recua quando deixa de existir. Recarregar a aplicação reinicia a memória. Respostas atrasadas não substituem a navegação atual; carregamento, erro e vazio permanecem distintos. Reutiliza page/limit da API existente.
