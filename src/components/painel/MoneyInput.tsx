"use client";
import { useState } from "react";

/** Input de moeda BRL: digita livre, formata ao sair do campo (onBlur).
 *  Submete o texto formatado — o servidor extrai o número (aceita "R$ 1.250,50"). */
export default function MoneyInput({ name, placeholder = "R$ 0,00", required = false, defaultValue = "" }:
  { name: string; placeholder?: string; required?: boolean; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);

  const format = () => {
    const n = Number(value.replace(/[^\d,]/g, "").replace(",", "."));
    if (!n || isNaN(n)) return;
    setValue(n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  };

  return (
    <input
      name={name}
      value={value}
      required={required}
      inputMode="decimal"
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onBlur={format}
    />
  );
}
