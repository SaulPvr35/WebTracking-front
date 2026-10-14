import { useMemo, useState } from "react";

export default function GraficoHistorialPrecios({ historial = [], moneda = "USD", umbralDeseado = null }) {
  const [rango, setRango] = useState("todo"); // '7d', '30d', 'todo'
  const [hoverPunto, setHoverPunto] = useState(null);

  // Normalizar y ordenar historial por fecha
  const puntos = useMemo(() => {
    if (!historial || historial.length === 0) return [];
    const ordenados = [...historial]
      .filter((item) => item.precio !== null && item.precio !== undefined)
      .sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro));

    if (rango === "todo") return ordenados;
    const ahora = new Date().getTime();
    const dias = rango === "7d" ? 7 : 30;
    const corte = ahora - dias * 24 * 60 * 60 * 1000;
    return ordenados.filter((item) => new Date(item.fechaRegistro).getTime() >= corte);
  }, [historial, rango]);

  // Métricas financieras estilo Keepa
  const estadisticas = useMemo(() => {
    if (puntos.length === 0) return null;
    const precios = puntos.map((p) => p.precio);
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    const promedio = Math.round((precios.reduce((acc, val) => acc + val, 0) / precios.length) * 100) / 100;
    const actual = precios[precios.length - 1];
    const primerPrecio = precios[0];
    const cambioPorcentaje = primerPrecio > 0 ? (((actual - primerPrecio) / primerPrecio) * 100).toFixed(1) : 0;

    return { min, max, promedio, actual, cambioPorcentaje };
  }, [puntos]);

  if (puntos.length === 0) {
    return (
      <div className="keepa-sin-datos">
        <p>Aún no hay suficiente historial registrado para graficar la evolución de precios.</p>
      </div>
    );
  }

  // Geometría del SVG del gráfico
  const anchoSvg = 700;
  const altoSvg = 220;
  const paddingX = 45;
  const paddingY = 30;

  const minPrecio = Math.min(estadisticas.min * 0.95, umbralDeseado ? umbralDeseado * 0.95 : estadisticas.min);
  const maxPrecio = Math.max(estadisticas.max * 1.05, umbralDeseado ? umbralDeseado * 1.05 : estadisticas.max);
  const rangoPrecio = maxPrecio - minPrecio || 1;

  const minTiempo = new Date(puntos[0].fechaRegistro).getTime();
  const maxTiempo = new Date(puntos[puntos.length - 1].fechaRegistro).getTime();
  const rangoTiempo = maxTiempo - minTiempo || 1;

  const coordenadas = puntos.map((punto, index) => {
    const tiempo = new Date(punto.fechaRegistro).getTime();
    const x = paddingX + ((tiempo - minTiempo) / rangoTiempo) * (anchoSvg - paddingX * 2);
    const y = altoSvg - paddingY - ((punto.precio - minPrecio) / rangoPrecio) * (altoSvg - paddingY * 2);
    return { ...punto, x, y, index };
  });

  const caminoLinea = coordenadas.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const caminoArea = coordenadas.length > 0
    ? `${caminoLinea} L ${coordenadas[coordenadas.length - 1].x} ${altoSvg - paddingY} L ${coordenadas[0].x} ${altoSvg - paddingY} Z`
    : "";

  const yUmbral = umbralDeseado
    ? altoSvg - paddingY - ((umbralDeseado - minPrecio) / rangoPrecio) * (altoSvg - paddingY * 2)
    : null;

  return (
    <div className="keepa-grafico-contenedor">
      <div className="keepa-encabezado">
        <div className="keepa-titular">
          <h4>Historial y Tendencia de Precios</h4>
          <span className="keepa-badge-moneda">{moneda}</span>
        </div>
        <div className="keepa-selector-rango">
          <button
            type="button"
            className={`keepa-btn-filtro ${rango === "7d" ? "activo" : ""}`}
            onClick={() => setRango("7d")}
          >
            7 Días
          </button>
          <button
            type="button"
            className={`keepa-btn-filtro ${rango === "30d" ? "activo" : ""}`}
            onClick={() => setRango("30d")}
          >
            30 Días
          </button>
          <button
            type="button"
            className={`keepa-btn-filtro ${rango === "todo" ? "activo" : ""}`}
            onClick={() => setRango("todo")}
          >
            Todo el histórico
          </button>
        </div>
      </div>

      {estadisticas && (
        <div className="keepa-metricas-resumen">
          <div className="keepa-tarjeta-metrica">
            <span>Actual</span>
            <strong>{moneda} {estadisticas.actual}</strong>
          </div>
          <div className="keepa-tarjeta-metrica destacado-verde">
            <span>Mínimo histórico</span>
            <strong>{moneda} {estadisticas.min}</strong>
          </div>
          <div className="keepa-tarjeta-metrica">
            <span>Promedio</span>
            <strong>{moneda} {estadisticas.promedio}</strong>
          </div>
          <div className="keepa-tarjeta-metrica destacado-naranja">
            <span>Máximo histórico</span>
            <strong>{moneda} {estadisticas.max}</strong>
          </div>
        </div>
      )}

      <div className="keepa-svg-wrapper">
        <svg viewBox={`0 0 ${anchoSvg} ${altoSvg}`} className="keepa-svg">
          <defs>
            <linearGradient id="degradadoPrecio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas guía horizontales */}
          <line x1={paddingX} y1={paddingY} x2={anchoSvg - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={paddingX} y1={altoSvg / 2} x2={anchoSvg - paddingX} y2={altoSvg / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={paddingX} y1={altoSvg - paddingY} x2={anchoSvg - paddingX} y2={altoSvg - paddingY} stroke="#cbd5e1" />

          {/* Línea de umbral deseado si existe */}
          {yUmbral !== null && yUmbral >= paddingY && yUmbral <= altoSvg - paddingY && (
            <g>
              <line
                x1={paddingX}
                y1={yUmbral}
                x2={anchoSvg - paddingX}
                y2={yUmbral}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x={anchoSvg - paddingX - 4} y={yUmbral - 4} fill="#10b981" fontSize="10" textAnchor="end">
                Meta: {moneda} {umbralDeseado}
              </text>
            </g>
          )}

          {/* Área sombreada y línea continua */}
          {caminoArea && <path d={caminoArea} fill="url(#degradadoPrecio)" />}
          {caminoLinea && <path d={caminoLinea} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />}

          {/* Puntos interactivos */}
          {coordenadas.map((pto) => (
            <circle
              key={pto.id || pto.index}
              cx={pto.x}
              cy={pto.y}
              r={hoverPunto?.index === pto.index ? 6 : 4}
              fill={hoverPunto?.index === pto.index ? "#1d4ed8" : "#fff"}
              stroke="#2563eb"
              strokeWidth="2"
              onMouseEnter={() => setHoverPunto(pto)}
              onMouseLeave={() => setHoverPunto(null)}
              style={{ cursor: "pointer", transition: "r 0.15s ease" }}
            />
          ))}
        </svg>

        {/* Tooltip flotante */}
        {hoverPunto && (
          <div
            className="keepa-tooltip"
            style={{
              left: `${(hoverPunto.x / anchoSvg) * 100}%`,
              top: `${(hoverPunto.y / altoSvg) * 100}%`,
            }}
          >
            <div className="keepa-tooltip-precio">
              {moneda} {hoverPunto.precio}
            </div>
            <div className="keepa-tooltip-fecha">
              {new Date(hoverPunto.fechaRegistro).toLocaleDateString()} {new Date(hoverPunto.fechaRegistro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {hoverPunto.disponibilidad && (
              <div className="keepa-tooltip-stock">{hoverPunto.disponibilidad}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
