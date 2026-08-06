/* Selo circular giratório — texto em volta de um círculo. */
export default function RotatingBadge({ text = "MAISON ESTATE · ALTO PADRÃO · " }) {
  return (
    <svg className="rot-badge" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id="rot-circle" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
      </defs>
      <text>
        <textPath href="#rot-circle">{text}</textPath>
      </text>
    </svg>
  );
}
