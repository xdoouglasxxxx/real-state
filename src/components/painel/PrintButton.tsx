"use client";

/** Botão de imprimir/salvar PDF do documento de contrato. */
export default function PrintButton() {
  return (
    <button className="btn-solid" type="button" onClick={() => window.print()}>
      🖨 Imprimir / Salvar PDF
    </button>
  );
}
