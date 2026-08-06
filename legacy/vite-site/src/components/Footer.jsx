import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link className="logo" to="/">MAISON <em>ESTATE</em></Link>
        <div className="footer-links">
          <Link to="/imoveis">Imóveis</Link>
          <Link to="/vender">Vender</Link>
          <Link to="/sobre">Sobre</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/termos">Termos</Link>
          <Link to="/acessibilidade">Acessibilidade</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Maison Estate · CRECI-SP 45.120-J</span>
        <span>Av. Faria Lima 2927 · São Paulo · (11) 3040-8800</span>
      </div>
    </footer>
  );
}
