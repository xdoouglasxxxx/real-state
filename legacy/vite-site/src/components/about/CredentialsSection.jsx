const CREDENTIALS = [
  ["CRECI-SP 45.120-J", "Registro jurídico ativo"],
  ["14 anos", "de atuação contínua"],
  ["Equipe jurídica própria", "due diligence em 100% das transações"],
  ["Sigilo contratual", "para vendas fora de anúncio"],
];

export default function CredentialsSection() {
  return (
    <section className="section stats-strip" style={{ paddingLeft: 0, paddingRight: 0 }}>
      {CREDENTIALS.map(([n, l]) => (
        <div className="stat" key={n}><strong style={{ fontSize: "1.6rem" }}>{n}</strong><span>{l}</span></div>
      ))}
    </section>
  );
}
