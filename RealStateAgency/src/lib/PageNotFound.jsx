import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <main className="page narrow center-page">
      <p className="eyebrow">Erro 404</p>
      <h1>Página não <em>encontrada</em></h1>
      <p className="lead">O endereço que você tentou abrir não existe ou foi movido.</p>
      <Link className="btn-solid inline-btn" to="/">Voltar ao início</Link>
    </main>
  );
}
