export const metadata = { title: "Acessibilidade" };
export default function Acessibilidade() {
  return (
    <main className="page narrow">
      <div className="page-head"><p className="eyebrow">Compromisso</p><h1>Acessibilidade</h1></div>
      <div className="prose">
        <p>Este site foi construído para ser navegável por teclado, com foco visível, textos alternativos nas imagens e contraste adequado.</p>
        <p>Animações e vídeos respeitam a preferência de movimento reduzido do sistema (prefers-reduced-motion).</p>
        <p>Encontrou alguma barreira? Fale com a gente — corrigiremos com prioridade.</p>
      </div>
    </main>
  );
}
