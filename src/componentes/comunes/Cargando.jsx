import { Globe, Sparkles } from "lucide-react";

export default function Cargando({ mensaje = "Analizando la tienda y extrayendo los datos del producto..." }) {
  return (
    <div className="loader-extractor-contenedor" role="status" aria-live="polite">
      <div className="loader-icono-anillo">
        <div className="loader-spinner-svg"></div>
        <Globe size={24} className="loader-icono-centro" />
      </div>

      <div className="loader-textos">
        <h4 className="loader-titulo">Inspeccionando el producto</h4>
        <p className="loader-subtexto">{mensaje}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.8rem", color: "#3b82f6", marginTop: "4px" }}>
          <Sparkles size={14} className="animar-rotar" />
          <span>Detectando precios, promociones activas y especificaciones</span>
        </div>
      </div>

      <div className="loader-barra-progreso">
        <div className="loader-barra-relleno"></div>
      </div>
    </div>
  );
}
