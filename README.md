# CartelHub

![Logo do CartelHub](frontend/public/images/cartelhub-logo.png)

O CartelHub é uma plataforma interna para centralizar membros, links, arquivos históricos, relações externas e administração de acessos. O projeto utiliza uma API REST em Node.js/Express, um frontend React e MySQL como banco de dados.

## Funcionalidades

- Autenticação com cadastro, login e sessão baseada em JWT.
- Fluxo de aprovação para novos usuários por meio do cargo `sem_acesso`.
- Controle de acesso baseado em cargos e permissões (RBAC).
- Diretório de membros com perfil, codinome, biografia, status e departamentos.
- Catálogo de links com categorias, destaques, ordenação e restrições por cargo ou departamento.
- Atribuição direta de links a usuários específicos.
- Galeria histórica com imagens, vídeos e histórias em HTML sanitizado.
- Relações externas com organizações, avaliações, pessoas-chave, histórico e negociações.
- Registro de auditoria das alterações em organizações.
- Administração de usuários, cargos, permissões e departamentos.
- Painel inicial com estatísticas calculadas de acordo com o acesso do usuário.

## Tecnologias

### Backend

- Node.js
- Express 5
- Sequelize 6
- MySQL
- JSON Web Token
- bcryptjs
- Multer
- CORS

### Frontend

- React 19
- Vite 7
- React Router
- TanStack React Query
- Tailwind CSS
- Radix UI
- Framer Motion
- Lucide React
- React Hook Form
- React Quill
- DOMPurify
- date-fns

## Arquitetura

```text
cartelhub/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexão com o MySQL
│   │   ├── controllers/     # Regras de negócio e respostas da API
│   │   ├── middleware/      # JWT, RBAC e upload de arquivos
│   │   ├── models/          # Models e relacionamentos Sequelize
│   │   ├── routes/          # Rotas da API REST
│   │   ├── seed/            # Cargos, permissões e administrador inicial
│   │   └── server.js        # Inicialização do servidor
│   ├── uploads/             # Arquivos enviados para a galeria
│   └── package.json
├── frontend/
│   ├── public/images/       # Imagens públicas
│   ├── src/
│   │   ├── components/      # Componentes de domínio e de interface
│   │   ├── context/         # Contexto de autenticação
│   │   ├── hooks/           # Hooks de permissões
│   │   ├── lib/             # Datas, ícones, sanitização e utilitários
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Cliente da API
│   │   ├── App.jsx          # Rotas do frontend
│   │   └── main.jsx         # Entrada do React e React Query
│   └── package.json
└── README.md
```

### Fluxo de uma requisição protegida

```text
Frontend
   ↓ Authorization: Bearer <token>
Rota Express
   ↓
authMiddleware
   ↓
permissionMiddleware
   ↓
Controller
   ↓
Sequelize / MySQL
```

O frontend controla a visibilidade das páginas e ações para melhorar a experiência de uso. A autorização definitiva é sempre aplicada pela API.

## Modelo de dados

As principais entidades são:

- `Usuario`: conta, email, senha criptografada, cargo e estado da conta.
- `Membro`: perfil individual ligado a exatamente um usuário.
- `Role`: cargo com hierarquia, nível visual e identificação por slug.
- `Permission`: permissão individual atribuída aos cargos.
- `Department`: catálogo de departamentos disponíveis no sistema.
- `Link` e `LinkCategory`: links, categorias e regras de visibilidade.
- `UserLink`: atribuição direta de um link a um usuário.
- `GalleryItem`: imagem, vídeo ou história do arquivo histórico.
- `Organization`: ficha de uma organização externa.
- `OrganizationHistory`: eventos narrativos de uma organização.
- `OrganizationNegotiation`: negociações, responsáveis e prazos.
- `OrganizationAuditLog`: auditoria de alterações nas organizações.

Relacionamentos principais:

```text
Role 1 ─── N Usuario
Role N ─── N Permission
Usuario 1 ─── 1 Membro
Usuario N ─── N Link
Link N ─── N LinkCategory
Organization 1 ─── N OrganizationHistory
Organization 1 ─── N OrganizationNegotiation
Organization 1 ─── N OrganizationAuditLog
```

Atualmente, os departamentos de cada membro permanecem armazenados como JSON em `Membro.departamentos`. `Department` funciona como um catálogo central independente.

## Cargos e permissões

O seed executado na inicialização mantém quatro cargos de sistema:

| Cargo | Acesso inicial |
| --- | --- |
| `sem_acesso` | Nenhuma permissão; usuário aguarda aprovação |
| `membro` | Sistema, início, links e galeria |
| `lideranca` | Início, membros, links, cargos, galeria e relações externas, incluindo parte das ações de gerenciamento |
| `administrador` | Todas as permissões cadastradas |

Também é possível criar cargos personalizados pela área administrativa.

Permissões disponíveis:

| Área | Permissões |
| --- | --- |
| Sistema | `acessar_sistema` |
| Início | `visualizar_inicio` |
| Membros | `visualizar_membros`, `gerenciar_membros` |
| Links | `visualizar_links`, `gerenciar_links` |
| Galeria | `visualizar_galeria`, `gerenciar_galeria` |
| Relações | `visualizar_relacoes`, `gerenciar_relacoes` |
| Usuários | `gerenciar_usuarios` |
| Cargos | `visualizar_roles`, `gerenciar_roles` |

Novos cadastros recebem inicialmente o cargo `sem_acesso` e são direcionados para `/aguardando` até que um administrador conceda acesso.

## Pré-requisitos

- Node.js `^20.19.0` ou `>=22.12.0`.
- npm.
- MySQL disponível localmente ou em um servidor acessível.

## Configuração do banco

Crie um banco vazio no MySQL. O nome pode ser alterado, desde que corresponda a `DB_NAME`:

```sql
CREATE DATABASE cartelhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Na inicialização, o backend:

1. testa a conexão com o MySQL;
2. registra os relacionamentos dos models;
3. sincroniza as tabelas com o Sequelize;
4. sincroniza permissões e cargos de sistema;
5. cria ou atualiza o administrador inicial;
6. garante um perfil `Membro` para cada usuário;
7. sincroniza o catálogo de departamentos encontrado nos membros.

Em desenvolvimento, a sincronização usa `alter: true`. Quando `NODE_ENV=production`, o Sequelize não altera automaticamente as tabelas existentes.

## Variáveis de ambiente

### Backend

Configure `backend/.env` sem versionar credenciais reais:

```dotenv
# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cartelhub
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Autenticação
JWT_SECRET=gere_um_segredo_longo_e_aleatorio

# Administrador inicial
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=troque_esta_senha
```

Variáveis obrigatórias verificadas diretamente na inicialização:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Comportamentos padrão e variáveis opcionais:

- `PORT`: usa `3000` quando ausente.
- `FRONTEND_URL`: usa `http://localhost:5173` quando ausente.
- `PUBLIC_BASE_URL`: base pública recomendada para gerar URLs dos uploads; sem ela, a API usa os dados da requisição.
- `ADMIN_NAME`: usa `Administrador` quando ausente.
- `NODE_ENV`: controla a alteração automática das tabelas.

### Frontend

Configure `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Quando `VITE_API_URL` não é informado, o frontend utiliza `http://localhost:3000/api`.

## Instalação

Instale as dependências do backend:

```bash
cd backend
npm ci
```

Em outro terminal, instale as dependências do frontend:

```bash
cd frontend
npm ci
```

## Executando em desenvolvimento

Inicie o backend:

```bash
cd backend
npm run dev
```

A API ficará disponível, por padrão, em:

```text
http://localhost:3000
```

Inicie o frontend em outro terminal:

```bash
cd frontend
npm run dev
```

O Vite informará a URL de acesso, normalmente:

```text
http://localhost:5173
```

## Scripts disponíveis

### Backend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Executa a API com o modo `--watch` do Node.js |
| `npm start` | Executa a API normalmente |

### Frontend

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite |
| `npm run build` | Gera a versão de produção em `frontend/dist` |
| `npm run preview` | Serve localmente o build de produção |

## Rotas do frontend

| Caminho | Descrição | Acesso |
| --- | --- | --- |
| `/login` | Login | Público |
| `/register` | Cadastro | Público |
| `/aguardando` | Conta aguardando aprovação | Usuário autenticado sem acesso ao sistema |
| `/` | Painel inicial | `visualizar_inicio` |
| `/membros` | Diretório de membros | `visualizar_membros` ou `gerenciar_membros` |
| `/links` | Central de links | `visualizar_links` ou `gerenciar_links` |
| `/galeria` | Arquivo histórico | `visualizar_galeria` ou `gerenciar_galeria` |
| `/relacoes` | Organizações externas | `visualizar_relacoes` ou `gerenciar_relacoes` |
| `/relacoes/:id` | Detalhes de uma organização | `visualizar_relacoes` ou `gerenciar_relacoes` |
| `/administracao` | Usuários e cargos | `gerenciar_usuarios` ou `gerenciar_roles` |

As rotas `/relacoes-externas` e `/relacoes-externas/:id` são mantidas como redirecionamentos legados para `/relacoes`.

## API REST

A URL-base padrão é `http://localhost:3000/api`. Exceto cadastro e login, as rotas abaixo utilizam JWT no cabeçalho:

```http
Authorization: Bearer <token>
```

### Autenticação

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cadastra um usuário |
| `POST` | `/api/auth/login` | Autentica e retorna o JWT |
| `GET` | `/api/auth/me` | Retorna o usuário autenticado |

### Início e membros

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/home/stats` | Estatísticas visíveis para o usuário |
| `GET` | `/api/membros` | Lista membros |
| `GET` | `/api/membros/:id` | Retorna um membro |
| `PUT` | `/api/membros/:id` | Atualiza o perfil de um membro |

### Administração

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/admin/permissions` | Lista permissões |
| `GET` | `/api/admin/roles` | Lista cargos |
| `POST` | `/api/admin/roles` | Cria um cargo |
| `PUT` | `/api/admin/roles/:id` | Atualiza um cargo e suas permissões |
| `GET` | `/api/admin/usuarios` | Lista usuários |
| `PATCH` | `/api/admin/usuarios/:id` | Atualiza dados do usuário |
| `PATCH` | `/api/admin/usuarios/:id/role` | Altera o cargo do usuário |
| `PATCH` | `/api/admin/usuarios/:id/status` | Ativa ou desativa o usuário |
| `DELETE` | `/api/admin/usuarios/:id` | Exclui o usuário |
| `GET` | `/api/admin/departamentos` | Lista departamentos |
| `POST` | `/api/admin/departamentos` | Cria um departamento |
| `PUT` | `/api/admin/departamentos/:id` | Atualiza um departamento |
| `DELETE` | `/api/admin/departamentos/:id` | Exclui um departamento |

### Links

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/links` | Lista os links disponíveis ou administráveis |
| `POST` | `/api/links` | Cria um link |
| `PUT` | `/api/links/:id` | Atualiza um link |
| `DELETE` | `/api/links/:id` | Exclui um link |
| `GET` | `/api/links/categories` | Lista categorias |
| `POST` | `/api/links/categories` | Cria uma categoria |
| `PUT` | `/api/links/categories/:id` | Atualiza uma categoria |
| `DELETE` | `/api/links/categories/:id` | Exclui uma categoria |
| `GET` | `/api/links/user-links` | Lista vínculos entre usuários e links |
| `POST` | `/api/links/user-links` | Atribui um link a um usuário |
| `DELETE` | `/api/links/user-links/:usuarioId/:linkId` | Remove uma atribuição |

### Galeria

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/gallery` | Lista itens visíveis ou administráveis |
| `POST` | `/api/gallery/upload` | Envia uma imagem ou vídeo |
| `POST` | `/api/gallery` | Cria um item |
| `PUT` | `/api/gallery/:id` | Atualiza um item |
| `DELETE` | `/api/gallery/:id` | Exclui um item |

### Relações externas

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/api/organizations` | Lista organizações acessíveis |
| `POST` | `/api/organizations` | Cria uma organização |
| `GET` | `/api/organizations/:id` | Retorna uma organização |
| `PUT` | `/api/organizations/:id` | Atualiza uma organização |
| `DELETE` | `/api/organizations/:id` | Exclui uma organização |
| `GET` | `/api/organizations/responsible-users` | Lista possíveis responsáveis |
| `GET` | `/api/organizations/:organizationId/history` | Lista o histórico |
| `POST` | `/api/organizations/:organizationId/history` | Cria um evento histórico |
| `PUT` | `/api/organizations/:organizationId/history/:historyId` | Atualiza um evento histórico |
| `DELETE` | `/api/organizations/:organizationId/history/:historyId` | Exclui um evento histórico |
| `GET` | `/api/organizations/:organizationId/negotiations` | Lista negociações |
| `POST` | `/api/organizations/:organizationId/negotiations` | Cria uma negociação |
| `PUT` | `/api/organizations/:organizationId/negotiations/:negotiationId` | Atualiza uma negociação |
| `DELETE` | `/api/organizations/:organizationId/negotiations/:negotiationId` | Exclui uma negociação |

A API também oferece `GET /` como verificação simples de disponibilidade.

## Uploads da galeria

Os uploads são armazenados localmente em `backend/uploads/gallery` e servidos pelo backend em `/uploads`.

- Tamanho máximo: 50 MB por arquivo.
- Imagens: JPEG, PNG, WebP, GIF e AVIF.
- Vídeos: MP4, M4V, WebM, OGG e QuickTime/MOV.
- Nomes de arquivo são normalizados e recebem um identificador aleatório.
- O endpoint de upload exige `gerenciar_galeria`.

Em produção, configure `PUBLIC_BASE_URL` para que as URLs retornadas apontem para o domínio público correto. Se houver mais de uma instância da API, substitua o armazenamento local por um serviço compartilhado ou armazenamento de objetos.

## Segurança e conteúdo

- Senhas são armazenadas com hash bcrypt.
- Tokens JWT expiram após sete dias.
- O frontend armazena o token no `localStorage` e o envia como Bearer Token.
- Contas inativas e usuários sem acesso são bloqueados pelo middleware de autenticação.
- Permissões são verificadas no backend antes dos controllers.
- Links, itens de galeria e organizações podem aplicar restrições adicionais de conteúdo.
- Histórias em HTML são sanitizadas com DOMPurify antes do envio e da renderização.
- Nunca publique ou versione valores reais de `.env`.

## Build de produção

Gere o frontend:

```bash
cd frontend
npm run build
```

O resultado será criado em `frontend/dist`. O frontend compilado deve ser servido por um servidor web ou plataforma de hospedagem, enquanto o backend é iniciado separadamente:

```bash
cd backend
NODE_ENV=production npm start
```

No Windows PowerShell, defina a variável antes de executar:

```powershell
$env:NODE_ENV = "production"
npm start
```

Em produção, confira principalmente:

- `VITE_API_URL`, definido antes do build do frontend;
- `FRONTEND_URL`, apontando para a origem permitida pelo CORS;
- `PUBLIC_BASE_URL`, apontando para a URL pública do backend;
- conexão e permissões do usuário MySQL;
- persistência do diretório de uploads;
- segredos fortes para JWT e administrador.

## Estado atual do projeto

- O schema é gerenciado por `sequelize.sync`; ainda não existem migrations versionadas.
- Não há scripts automatizados de testes, lint ou formatação nos `package.json`.
- Os uploads utilizam o disco local da API.
- O seed é idempotente e executado em toda inicialização do backend.

