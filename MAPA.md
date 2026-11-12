# Mapa dos imóveis (`/painel/mapa`)

Mapa com todos os imóveis que têm latitude/longitude: pins por status, filtros,
agrupamento de pins próximos, lista lateral e detalhe com link para o cadastro.
Sem biblioteca de mapas: `src/lib/geo.ts` (projeção Web Mercator, ajuste de zoom, tiles,
agrupamento) + `src/components/painel/PropertyMap.tsx`.

## Ligar no menu (1 linha)
Em `src/app/painel/layout.tsx`, logo abaixo da linha do link "Imóveis", acrescente:

    <Link className="panel-link" href="/painel/mapa">Mapa</Link>

## Quem aparece no mapa
- Imóveis da imobiliária, exceto **rascunho** e **arquivado**.
- Só os que têm latitude e longitude (cadastro do imóvel → Localização). Os demais não
  aparecem, e a tela diz quantos são.
- Status: disponível (À venda/Exclusivo), reservado, vendido/alugado.
- **Sem visita 90+ dias** = a mesma regra do alerta do dashboard: disponível, cadastrado há
  mais de 90 dias e sem nenhuma visita nos últimos 90.

## Provedor dos tiles (importante)
Por padrão usa o servidor público do OpenStreetMap, com atribuição na tela. Esse servidor é
para uso moderado: com muitas imobiliárias e muito acesso, troque por um provedor com chave
(MapTiler, Stadia, Thunderforest, etc.) definindo na Vercel (sem aspas) e fazendo Redeploy:

    NEXT_PUBLIC_MAP_TILE_URL=https://api.exemplo.com/tiles/{z}/{x}/{y}.png?key=SUA_CHAVE
    NEXT_PUBLIC_MAP_ATTRIBUTION=© Provedor © OpenStreetMap contributors

O modelo da URL precisa ter `{z}`, `{x}` e `{y}` e entregar tiles de 256 px.
O navegador de quem usa o painel faz as requisições dos tiles direto ao provedor.

## Testes
- `npx tsx --test tests/unit/geo.test.ts` (matemática do mapa).
- A interação (filtros, zoom, agrupamento, seleção, link, mobile, rótulos) foi testada em
  Chromium com os imóveis da demo Maison.

## Limites desta versão
Não arrasta o mapa com o mouse (usa +/−, clique em agrupamento e clique na lista).
Até 1.000 imóveis por imobiliária.
