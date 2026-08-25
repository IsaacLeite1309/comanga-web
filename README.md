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

Em produção, `vercel.json` redireciona `/api/*` para a API hospedada na Render. O frontend nunca acessa diretamente o PostgreSQL, o R2 ou segredos de infraestrutura.

## Funcionalidades implementadas

### Experiência pública

- Pesquisa pública de Obras e Edições com termo, filtros, ordenação, paginação e parâmetros preservados na URL.
- Alternância entre Obras e Edições preservando o contexto de busca.
- Grid responsivo de capas 2:3, fallback de capa e estados de carregamento, erro e resultado vazio.
- Detalhes públicos de Obra, Edição e Volume.
- Página de Autor com suas Obras públicas.
- Navegação disponível para visitantes e usuários autenticados; conteúdo privado e +18 é filtrado pela API.

### Contas e navegação autenticada

- Cadastro, login, ativação de conta e reenvio de ativação.
- Contexto de autenticação consultando `/api/auth/me` ao iniciar a aplicação.
- Perfil do usuário, logout e preferência de conteúdo adulto.
- Proteção visual de páginas privadas e administrativas por `ProtectedRoute`; a autorização efetiva permanece no backend.

### Administração

- Gestão de usuários e opções de domínio.
- Cadastro e edição de Obras, Edições e Volumes.
- Consulta administrativa da estrutura Obra -> Edição -> Volume.
- Importação e remoção de capas internas por URL, com feedback de interface e confirmação de ações destrutivas.

As páginas de Coleção, Checklist e Lista de Desejos existem como navegação/estrutura visual, mas Estante Digital e Lista de Desejos ainda não possuem suas regras e integrações finais implementadas.

## Rotas principais

| Área | Rotas |
| --- | --- |
| Conta | `/entrar`, `/cadastrar`, `/activate/:token`, `/reenvio`, `/perfil/:username` |
| Catálogo público | `/pesquisa`, `/obras/:slug`, `/edicoes/:editionId`, `/volumes/:volumeId`, `/autores/:authorId` |
| Área pessoal | `/colecao`, `/checklist`, `/desejos` |
| Administração | `/admin/novo-manga`, `/admin/editar-mangas`, `/admin/opcoes`, `/admin/users` e rotas aninhadas de Edições/Volumes |

## Stack e organização

- React 18, TypeScript e Vite.
- React Router para navegação da SPA.
- Axios para integração HTTP.
- Tailwind CSS, Radix UI, Lucide e Sonner para interface e feedback.
- Vitest e React Testing Library para testes.

O código é organizado por funcionalidade em `src/features`, incluindo `auth`, `profile`, `admin-catalog`, `admin-media`, `admin-users` e `public-catalog`. Componentes reutilizáveis ficam em `src/components`, serviços HTTP em `src/services` e utilitários em `src/lib`.

## Requisitos

- Node.js 22 ou superior.
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
| `npm run lint` | Executa ESLint. |

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
