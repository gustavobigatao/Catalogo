# Premium Catalog

Catálogo de apresentação profissional com vitrine de produtos, carrinho de compras e painel administrativo.

## Funcionalidades

### Cliente
- **Catálogo** com grid responsivo (2 a 5 colunas), scroll infinito (20 em 20)
- **Filtros** por nome, marca, litros, categoria e ordenação
- **Busca** com debounce
- **Carrinho** lateral com controle de quantidade

### Administrador
- **CRUD de produtos** com upload de imagem (base64)
- **Controle de estoque** com badges e filtro de estoque baixo
- **Aba de pedidos** com relatório mensal

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Estado | Context API |
| Persistência | localStorage |
| Build | Vite |

## Estrutura

```
src/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── CartDrawer.tsx
│   ├── FilterBar.tsx
│   └── ProductForm.tsx
├── pages/
│   ├── Home.tsx
│   ├── Admin.tsx
│   ├── Login.tsx
│   └── NotFound.tsx
├── context/CartContext.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useDebounce.ts
├── lib/
│   ├── productStore.ts
│   ├── types.ts
│   └── utils.ts
├── routes/index.tsx
└── utils/formatters.ts
```

## Como usar

```bash
cd app
npm install
npm run dev
```

Acesse `http://localhost:3000` para ver o catálogo e `http://localhost:3000/gestao` para o admin (sem login).

Os produtos já vêm com dados de exemplo salvos em localStorage.

## Conectando com backend

A camada de dados está isolada em `src/lib/productStore.ts`. Para conectar com uma API ou banco (Supabase, tRPC, REST), basta substituir a implementação desse arquivo — nenhum componente ou página precisa ser alterado.

O diretório `backend/` contém uma estrutura de referência com controllers, services, migrations SQL e configuração Supabase, útil como ponto de partida.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend (Vite HMR) |
| `npm run build` | Build de produção |
| `npm run check` | TypeScript check |

## Licença

MIT
