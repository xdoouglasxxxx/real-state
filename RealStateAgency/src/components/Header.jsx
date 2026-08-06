import { NavLink, Link } from "react-router-dom";

const LINKS = [
  { to: "/imoveis", label: "Imóveis" },
  { to: "/vender", label: "Vender" },
  { to: "/sobre", label: "Sobre" },
  { to: "/blog", label: "Blog" },
];

export default function Header() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="logo" to="/">MAISON <em>ESTATE</em></Link>
        <div className="nav-links">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
          <Link className="btn-outline" to="/imoveis">Ver imóveis</Link>
        </div>
      </div>
    </nav>
  );
}
