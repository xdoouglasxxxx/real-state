# Real State Agency — Maison Estate

Site de agência imobiliária de alto padrão. Recriação independente do template Base44,
funcionando 100% local com dados mock — e pronta para reconectar ao backend depois.

## Rodar o projeto

```bash
npm install
npm run dev
```

Abra http://localhost:5173

## Estrutura

- `base44/entities/` — schemas das entidades (formato Base44 / JSON Schema)
- `src/api/base44Client.js` — cliente de dados. Hoje usa mock local
  (`mockData.js`) com a MESMA interface do SDK do Base44
  (`entities.Property.list / .filter / .get / .create`).
  Para reconectar ao Base44 real, siga o comentário no topo do arquivo.
- `src/components/` — componentes compartilhados + `home/` + `about/`
- `src/components/ui/` — reservado para componentes shadcn/ui (veja README interno)
- `src/pages/` — uma página por rota
- `src/lib/`, `src/hooks/`, `src/utils/` — utilitários

## Trocar dados de exemplo pelos reais

Edite `src/api/mockData.js` — imóveis, corretores, depoimentos e posts do blog.
