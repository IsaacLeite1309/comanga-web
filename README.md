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
- Detalhes públicos de Obra, Edição e Volume. A ficha da Obra mostra "Título original" e "Título romanizado" em campos separados, nunca concatenados, e exibe a sinopse da própria Obra.
- Página de Autor com suas Obras públicas.
- Autores aparecem na ordem editorial definida pela administração, tanto nos cards quanto nas fichas.
- Navegação disponível para visitantes e usuários autenticados; conteúdo privado e +18 é filtrado pela API. As opções de filtro vêm de `GET /api/public/catalog-options` com o cookie de sessão, então o gênero Hentai só aparece para quem está autorizado; gêneros e tipos de Edição são exibidos na ordem devolvida pela API e os Tipos de Obra são restritos ao país selecionado.

### Contas e navegação autenticada

- Cadastro com nascimento obrigatório, login, ativação e reenvio de ativação.
- Recuperação e redefinição de senha por e-mail, com validação compartilhada de senha e limite de 72 bytes em UTF-8. Os formulários reiniciam ao trocar de rota ou token.
- Contexto de autenticação consultando `/api/auth/me` ao iniciar a aplicação, que expõe os perfis da conta (`profiles`) e o perfil ativo da sessão (`active_profile`).
- Perfil do usuário, logout e preferência de conteúdo adulto, disponível apenas com nascimento informado e 18 anos completos; a API aplica a restrição pública.
- Seletor de perfil ativo na tela de perfil, exibido somente para contas que possuem mais de um perfil. Trocar o perfil ativo muda apenas o contexto de uso da sessão atual; não concede nem remove perfis.
- Alteração do próprio nome de usuário (mesmas regras do cadastro: 3 a 20 caracteres `[A-Za-z0-9_]`, sem trim nem conversão automática) e da própria senha (senha atual, nova e confirmação), com validação de experiência reaproveitada de `passwordValidation`. Em caso de sucesso a pessoa permanece na tela de perfil, recebe notificação e o contexto é atualizado sem recarregar.
- Proteção visual de páginas privadas e administrativas por `ProtectedRoute`, que considera o perfil ATIVO; a autorização efetiva permanece no backend.

### Administração

- Gestão de usuários e opções de domínio. A alteração de perfil de outra conta concede (`Administrador`) ou remove (`Usuário Padrão`) a atribuição Administrador; o perfil `Usuário Padrão` nunca é removido e a própria conta continua bloqueada. A API recusa remoções que deixariam o sistema sem administrador efetivo. Em `Tipo de obra` e `Gêneros`, controlados pelo sistema, a tela não oferece criar, renomear nem excluir: apenas ativar/desativar cada valor (inativos ficam sinalizados na lista). Em `Tipo de edição` há botões acessíveis de mover para cima e para baixo, que enviam a nova ordem para a API e respeitam a direção visual em ASC/DESC.
- Cadastro e edição de Obras, Edições e Volumes. O formulário da Obra exige título em português, título original, título romanizado e sinopse da Obra como campos distintos; mostra apenas os Tipos compatíveis com o país selecionado e mantém `Conteúdo +18` marcado e bloqueado enquanto o gênero Hentai estiver associado, identificado pelo código estável devolvido pela API.
- Ordenação manual dos autores da Obra por botões "Mover autor N para cima/para baixo", desabilitados nos limites da lista; o array é enviado à API na ordem exibida e o backend normaliza as posições.
- Consulta administrativa da estrutura Obra -> Edição -> Volume.
- Listas administrativas paginadas de Obras, de Edições dentro de uma Obra e de Volumes dentro de uma Edição, consumindo os metadados (`page`, `limit`, `total`, `totalPages`) devolvidos pela API. Cada lista exibe total de registros, página atual, total de páginas e as ações Anterior/Próxima, tanto na visualização em lista quanto na visualização em grade, com os controles desabilitados nos limites e na lista vazia. As Edições são paginadas em ordem decrescente pelo número cronológico e os Volumes em ordem crescente pelo número. A página dessas listas é preservada por Obra/Edição durante a navegação na mesma aba e ajustada se deixar de existir; recarregar a aplicação reinicia na página 1. As alterações estão locais em `feature/monolito-modular-eslint`, ainda sem commit ou merge.
- Importação e substituição de capas internas obrigatórias por URL para Obra e Volume, com feedback de interface. Capas já associadas não podem ser removidas sem substituição.
- O formulário de Edição não importa capa: a capa exibida vem do Volume 1 da mesma Edição. Sem esse Volume, as telas administrativas mostram "Sem capa (cadastre o Volume 1)" e as públicas, "Capa indisponível"; a recusa de publicação por falta do Volume 1 é exibida com a mensagem da API. Excluir um Volume atualiza também a capa derivada e a contagem no resumo da Edição.

Na edição de uma Obra, tipos e gêneros legados já vinculados continuam visíveis e são preservados ao salvar. Eles não são oferecidos no cadastro de outra Obra.

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
