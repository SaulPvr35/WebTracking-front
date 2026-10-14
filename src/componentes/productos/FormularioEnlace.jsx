import { useState } from "react";
import { Search, Link as LinkIcon } from "lucide-react";

export default function FormularioEnlace({ onAnalizar, onAbrirInspector, cargando }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function validarUrl(valor) {
    try {
      const enlace = new URL(valor);
      if (!["http:", "https:"].includes(enlace.protocol)) {
        throw new Error();
      }
      return true;
    } catch {
      return false;
    }
  }

  function enviar(evento) {
    evento.preventDefault();
    const valor = url.trim();
    if (!validarUrl(valor)) {
      setError("Escribe una URL válida que empiece por http:// o https://.");
      return;
    }
    setError("");
    onAnalizar(valor);
  }

  function inspeccionarDirecto() {
    const valor = url.trim();
    if (!validarUrl(valor)) {
      setError("Escribe una URL válida para abrir el inspector.");
      return;
    }
    setError("");
    if (onAbrirInspector) {
      onAbrirInspector(valor);
    }
  }

  return (
    <form className="formulario-enlace" onSubmit={enviar}>
      <label htmlFor="url-producto" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <LinkIcon size={16} />
        <span>Enlace del producto</span>
      </label>
      <div className="fila-enlace">
        <input
          id="url-producto"
          type="url"
          value={url}
          onChange={(evento) => setUrl(evento.target.value)}
          placeholder="https://tienda.example/producto"
          disabled={cargando}
          required
        />
        <button className="boton principal" type="submit" disabled={cargando} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Search size={16} />
          <span>{cargando ? "Analizando..." : "Analizar enlace"}</span>
        </button>
        {onAbrirInspector && (
          <button
            type="button"
            className="boton secundario"
            onClick={inspeccionarDirecto}
            disabled={cargando}
            title="Abre el inspector visual F12 y visor de DOM de la tienda"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Inspector F12</span>
          </button>
        )}
      </div>
      {error && <p className="error-campo">{error}</p>}
      <p className="ayuda">La URL será consultada directamente. Puedes analizarla automáticamente o inspeccionar su HTML y DOM ejecutado en vivo.</p>
    </form>
  );
}
