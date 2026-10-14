import { useEffect, useState } from "react";
import { Flame, Tag, Clock, ImageOff, Star, Check, AlertCircle, Save, LogIn, Crosshair } from "lucide-react";
import InspectorSelectoresMaxun from "./InspectorSelectoresMaxun.jsx";
import InspectorVisualTienda from "./InspectorVisualTienda.jsx";

const campos = [
  ["nombre", "Nombre"],
  ["descripcion", "Descripción"],
  ["imagenUrl", "URL de imagen"],
  ["precioActual", "Precio actual (final)"],
  ["precioOriginal", "Precio original (lista)"],
  ["moneda", "Moneda"],
  ["disponibilidad", "Disponibilidad"],
  ["etiquetaPromocion", "Etiqueta de promoción"],
  ["vigenciaPromocion", "Vigencia de oferta"],
  ["valoracion", "Valoración"],
  ["cantidadValoraciones", "Cantidad de valoraciones"],
];
const camposNumericos = new Set(["precioActual", "precioOriginal", "precioAnterior", "ahorro", "porcentajeDescuento", "valoracion", "cantidadValoraciones"]);

function mostrarValor(valor) {
  return valor === null || valor === undefined || valor === "" ? "" : String(valor);
}

export default function VistaPreviaProducto({
  producto,
  onConfirmar,
  onReanalizarConSelectores,
  reejecutando = false,
  usuarioActivo = null,
  onSolicitarAuth = null,
}) {
  const [datos, setDatos] = useState({});
  const [confirmado, setConfirmado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarInspectorVisual, setMostrarInspectorVisual] = useState(false);
  const [selectoresActivos, setSelectoresActivos] = useState({});

  useEffect(() => {
    setDatos(Object.fromEntries(campos.map(([campo]) => [campo, mostrarValor(producto[campo])])));
    setConfirmado(false);
  }, [producto]);

  function actualizar(campo, valor) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));
    setConfirmado(false);
  }

  function confirmar(evento) {
    evento.preventDefault();
    if (!usuarioActivo) {
      if (onSolicitarAuth) {
        onSolicitarAuth();
      } else {
        setError("Debes iniciar sesión para guardar y monitorear este producto.");
      }
      return;
    }
    const datosGuardados = Object.fromEntries(
      campos.map(([campo]) => {
        const valor = datos[campo]?.trim?.() ?? datos[campo];
        if (valor === "" || valor === null || valor === undefined) return [campo, null];
        if (campo === "cantidadValoraciones") {
          const num = Number(valor);
          return [campo, Number.isFinite(num) ? Math.round(num) : null];
        }
        if (camposNumericos.has(campo)) {
          const num = Number(valor);
          return [campo, Number.isFinite(num) ? num : null];
        }
        return [campo, valor];
      }),
    );
    setGuardando(true);
    setError("");
    onConfirmar({ ...producto, ...datosGuardados })
      .then(() => setConfirmado(true))
      .catch((problema) => setError(problema.message))
      .finally(() => setGuardando(false));
  }

  // Comprobar si hay un descuento verificado
  const tieneDescuentoVerificado =
    producto.tieneDescuento &&
    producto.precioActual !== null &&
    producto.precioOriginal !== null &&
    producto.precioActual < producto.precioOriginal;

  const puntuacionNum = Math.min(5, Math.max(0, Math.round(Number(datos.valoracion) || 0)));

  return (
    <section className="vista-previa animar-entrada" aria-labelledby="titulo-vista-previa">
      <div className="encabezado-seccion">
        <div>
          <p className="etiqueta-seccion">Resultado de extracción</p>
          <h2 id="titulo-vista-previa">Revisa los datos antes de continuar</h2>
        </div>
        <span className="insignia">No guardado</span>
      </div>
      <p className="origen">
        Origen: <a href={producto.urlCanonica} target="_blank" rel="noreferrer">{producto.urlCanonica}</a>
      </p>

      {/* Bloque visual destacado de Descuento Activo */}
      {tieneDescuentoVerificado ? (
        <div className="promo-banner-descuento">
          <div className="promo-badge-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Flame size={15} />
            <span>{producto.porcentajeDescuento}% DE DESCUENTO</span>
          </div>
          <div className="promo-cuerpo">
            <div className="promo-precios">
              <span className="promo-precio-actual">
                {producto.precioActual?.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {producto.moneda ?? ""}
              </span>
              <span className="promo-precio-original">
                {producto.precioOriginal?.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {producto.moneda ?? ""}
              </span>
            </div>
            <div className="promo-ahorro">
              Ahorras: <strong>${producto.ahorro?.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {producto.moneda ?? ""}</strong>
            </div>
          </div>
          {producto.etiquetaPromocion && (
            <p className="promo-etiqueta-texto" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Tag size={14} />
              <em>{producto.etiquetaPromocion}</em>
            </p>
          )}
          {producto.vigenciaPromocion && (
            <p className="promo-vigencia" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} />
              <span>Vigencia válida hasta: <strong>{producto.vigenciaPromocion}</strong></span>
            </p>
          )}
        </div>
      ) : (
        <div className="promo-banner-normal">
          <span className="promo-precio-actual">
            {producto.precioActual !== null && producto.precioActual !== undefined
              ? `${producto.precioActual?.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${producto.moneda ?? ""}`
              : "Precio no detectado"}
          </span>
          <span className="promo-sin-oferta">Precio regular / Sin descuento activo verificable</span>
        </div>
      )}

      {onReanalizarConSelectores && (
        <InspectorSelectoresMaxun
          selectores={selectoresActivos}
          onAplicarSelectores={(selectores) => {
            setSelectoresActivos(selectores);
            onReanalizarConSelectores(producto.urlOriginal, selectores);
          }}
          onAbrirInspectorVisual={() => setMostrarInspectorVisual(true)}
          reejecutando={reejecutando}
        />
      )}

      {mostrarInspectorVisual && (
        <InspectorVisualTienda
          url={producto.urlOriginal || producto.urlCanonica}
          selectoresActuales={selectoresActivos}
          onCerrar={() => setMostrarInspectorVisual(false)}
          onAplicarSelectorACampo={(campo, selector, valorTexto) => {
            // 1. Guardar el selector en el estado para cuando se guarde el producto
            setSelectoresActivos((prev) => ({ ...prev, [campo]: selector }));

            // 2. Poblar inmediatamente el campo en el formulario de la ficha sin disparar recarga de red
            if (valorTexto !== undefined && valorTexto !== null) {
              let valorFormateado = valorTexto;
              if (camposNumericos.has(campo)) {
                const soloNumeros = String(valorTexto).replace(/[^0-9.]/g, "");
                if (soloNumeros) valorFormateado = soloNumeros;
              }
              actualizar(campo, valorFormateado);
            }
          }}
        />
      )}

      {/* Tarjeta de previsualización dinámica: Imagen + Título limpio + Ranking + Resumen */}
      <div className="preview-dinamica-card">
        <div className="preview-imagen-box">
          {datos.imagenUrl ? (
            <img src={datos.imagenUrl} alt={datos.nombre ?? "Producto"} className="preview-imagen-img" />
          ) : (
            <div className="preview-imagen-placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <ImageOff size={24} />
              <span>Sin imagen</span>
            </div>
          )}
        </div>
        <div className="preview-info-box">
          <h3 className="preview-titulo-limpio">{datos.nombre || "Título no detectado"}</h3>
          {datos.valoracion && (
            <div className="preview-ranking-row" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="estrellas-doradas" style={{ display: "inline-flex", gap: "2px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i <= puntuacionNum ? "#eab308" : "transparent"}
                    color={i <= puntuacionNum ? "#eab308" : "#94a3b8"}
                  />
                ))}
              </span>
              <strong className="puntuacion-texto">{datos.valoracion} / 5</strong>
              {datos.cantidadValoraciones && (
                <span className="opiniones-texto">({datos.cantidadValoraciones} valoraciones)</span>
              )}
            </div>
          )}
          {datos.descripcion && (
            <p className="preview-descripcion-extracto">
              {datos.descripcion.length > 220 ? `${datos.descripcion.slice(0, 220)}...` : datos.descripcion}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={confirmar}>
        <div className="campos-producto">
          {campos.map(([campo, etiqueta]) => {
            const valorOriginal = mostrarValor(producto[campo]);
            const modificado = datos[campo] !== valorOriginal;
            return (
              <label className={`campo ${modificado ? "modificado" : ""}`} key={campo}>
                <span>{etiqueta} {modificado && <small>editado</small>}</span>
                {campo === "descripcion" ? (
                  <textarea value={datos[campo] ?? ""} onChange={(evento) => actualizar(campo, evento.target.value)} rows="3" />
                ) : (
                  <input type={campo.includes("precio") || campo.includes("valoracion") ? "number" : "text"} step="any" value={datos[campo] ?? ""} onChange={(evento) => actualizar(campo, evento.target.value)} />
                )}
                {!datos[campo] && <em>No disponible; puedes completarlo manualmente.</em>}
              </label>
            );
          })}
        </div>
        <div className="metadatos">
          <span>Información detectada y verificada automáticamente</span>
          <span>{producto.metadatosConsulta?.duracionMs ?? 0} ms de análisis</span>
        </div>
        {usuarioActivo ? (
          <button className="boton principal" type="submit" disabled={guardando} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Save size={16} />
            <span>{guardando ? "Guardando..." : "Confirmar y guardar producto"}</span>
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start", marginTop: "10px" }}>
            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#1e40af",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <AlertCircle size={16} />
              <span>Puedes analizar cualquier producto libremente, pero para guardarlo y activar el monitoreo automático debes iniciar sesión.</span>
            </div>
            <button
              className="boton principal"
              type="button"
              onClick={onSolicitarAuth}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <LogIn size={16} />
              <span>Iniciar sesión para guardar y monitorear</span>
            </button>
          </div>
        )}
        {error && (
          <p className="mensaje error" role="alert" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </p>
        )}
        {confirmado && (
          <p className="mensaje correcto" role="status" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Check size={16} />
            <span>Producto guardado exitosamente en tu catálogo.</span>
          </p>
        )}
      </form>
    </section>
  );
}
