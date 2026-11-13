# Site público — vitrine moderna em escuro refinado (direção "D")

Esta entrega moderniza o site de cada imobiliária (`(site)/`): cabeçalho, home, listagem, cartões, mapa
público e o tema das páginas internas. Painel, portal do cliente, login e cadastro **não mudam**.

## O que mudou para quem usa
- **Cabeçalho:** logo da imobiliária (ou monograma com a inicial), busca por bairro/nome, links, botão
  **Falar no WhatsApp** (só aparece com telefone válido; sem ele, "Ver imóveis"). Fixo no topo ao rolar.
- **Home:** abas Comprar/Vender/Avaliar, busca com tipo, região, preço e quartos, atalhos, faixa de confiança
  com dados reais, destaques (até 4), **mapa**, "Como funciona", bairros **que têm imóvel disponível agora**,
  equipe com WhatsApp, depoimentos (estrelas se houver nota) e chamada para vender.
- **Listagem `/imoveis`:** busca por texto, tipo, região, preço, quartos, "só exclusivos"; alternância
  **Lista | Mapa** (`?visao=mapa`) que mantém os filtros.
- **Página do imóvel:** o mapa do Google embutido saiu; entra o mapa próprio com **círculo de região
  aproximada**. Consentimento LGPD com caixa de 22 px e link dentro do texto.
- **Removido (era igual para todos os clientes):** "14 anos / R$ 2,1 bi / 640+ / 31 dias", bairros fixos
  (Jardins, Itaim, Alphaville, Riviera), vídeo e imagem de hero da Maison, "Desde 2012" na página Sobre.

## Correções de segurança e dados incluídas
| Antes | Agora |
|---|---|
| `?type=xyz` / `?price=abc` derrubava a consulta e o `catch` mostrava **imóveis de demonstração** num site real | Parâmetros validados (`src/lib/search.ts`); com banco, erro = lista vazia |
| Bairros, corretores e depoimentos também caíam no demo em erro | Idem: vazio |
| Nome da imobiliária ou título de imóvel (vem de feed XML) com `</script>` fechava o JSON-LD e injetava HTML | `safeJsonLd` |
| Mapa do Google e JSON-LD com a **coordenada exata**, mesmo escrito "região aproximada" | `publicLatLng`: ~110 m. Sem Google (sem cookies de terceiros) |
| `logoUrl` aceito em Configurações mas nunca usado | `safeLogoUrl` (https only) e exibido |
| `html, body { overflow-x: hidden }` quebrava `position: sticky` (cabeçalho nunca grudava) | `overflow-x: clip` quando a página é do site (`globals.css`) |

## Como funciona (para manter)
- **CSS:** `src/app/(site)/site-theme.css`, tudo sob `.site`. Redefine os tokens neutros; as classes antigas
  (`.page`, `.form`, `.inquiry`, `.detail-*`…) re-temam sozinhas. Classes novas: `s-*` (home/cabeçalho/rodapé),
  `pc*` (cartão). A cor da marca é só o destaque (`--brass`, vinda de `readableAccent`).
- **Dados:** `getSiteSummary` (`src/lib/site-data.ts`) conta disponíveis, bairros e corretores do banco;
  `loadSiteSummary` (`site-summary.ts`) escolhe banco ou demo. `getMapPins` pede ao banco **só 6 colunas**.
- **Mapa:** `PublicMap.tsx` (reaproveita `geo.ts`). Tiles só carregam perto da tela. Mesma célula → lista.
  `area` = modo "região" (página do imóvel). Variáveis: `NEXT_PUBLIC_MAP_TILE_URL`, `NEXT_PUBLIC_MAP_ATTRIBUTION`.
- **Privacidade:** `PUBLIC_COORD_DECIMALS = 3` (≈110 m) em `src/lib/site.ts`. Para esconder mais, use 2 (≈1,1 km).

## Limites conhecidos
- **OpenStreetMap com tráfego público:** a política de uso do OSM não é para site com muito acesso. Antes de
  divulgar muito, configure um provedor comercial em `NEXT_PUBLIC_MAP_TILE_URL`.
- Configurações ainda mostra **tinta** e **creme**; eles já não têm efeito (só a cor de destaque vale).
- Textos de promessa (Como funciona, página Vender, Sobre) são **fixos** para todos os clientes.
- Login, cadastro e portal do cliente mantêm o visual antigo.
- Não há coração de favoritar na vitrine (exige login do cliente) nem mini-formulário "quanto vale"
  (levaria o telefone na URL). A chamada para vender leva à página de avaliação, que tem o consentimento LGPD.
- Navegador sem `:has()`/`overflow: clip` (anteriores a 2022–2023) só perde o cabeçalho fixo.

## Testes
`npm run test:unit` (inclui `search`, `site`, `site-data`, `css-scope`). Cobrem: validação da busca e
equivalência banco × demonstração, coordenada sempre arredondada, lista branca dos pins, logo seguro, JSON-LD
com entrada hostil, isolamento por imobiliária e escopo do CSS.
