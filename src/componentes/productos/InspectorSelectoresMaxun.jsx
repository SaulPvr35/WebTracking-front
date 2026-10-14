import { useState, useEffect } from "react";
import { Sliders, Bot, ChevronDown, ChevronUp, RotateCcw, Play, Crosshair } from "lucide-react";

export default function InspectorSelectoresMaxun({
  selectores = {},
  onAplicarSelectores,
  onAbrirInspectorVisual,
  reejecutando = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState({
    nombre: selectores.nombre || "",
    precioActual: selectores.precioActual || "",
    precioOriginal: selectores.precioOriginal || selectores.precioAnterior || "",
    imagenUrl: selectores.imagenUrl || "",
    descripcion: selectores.descripcion || "",
    moneda: selectores.moneda || "",
    disponibilidad: selectores.disponibilidad || "",
    etiquetaPromocion: selectores.etiquetaPromocion || "",
    vigenciaPromocion: selectores.vigenciaPromocion || "",
    valoracion: selectores.valoracion || "",
    cantidadValoraciones: selectores.cantidadValoraciones || "",
  });

  useEffect(() => {
    setValores({
      nombre: selectores.nombre || "",
      precioActual: selectores.precioActual || "",
      precioOriginal: selectores.precioOriginal || selectores.precioAnterior || "",
      imagenUrl: selectores.imagenUrl || "",
      descripcion: selectores.descripcion || "",
      moneda: selectores.moneda || "",
      disponibilidad: selectores.disponibilidad || "",
      etiquetaPromocion: selectores.etiquetaPromocion || "",
      vigenciaPromocion: selectores.vigenciaPromocion || "",
      valoracion: selectores.valoracion || "",
      cantidadValoraciones: selectores.cantidadValoraciones || "",
    });
  }, [selectores]);

  function manejarCambio(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicar(e) {
    e.preventDefault();
    const limpios = Object.fromEntries(
      Object.entries(valores).filter(([, selector]) => selector && selector.trim() !== "")
    );
    onAplicarSelectores(limpios);
  }

  function limpiarTodo() {
    const vacios = {
      nombre: "",
      precioActual: "",
      precioOriginal: "",
      imagenUrl: "",
      descripcion: "",
      moneda: "",
      disponibilidad: "",
      etiquetaPromocion: "",
      vigenciaPromocion: "",
      valoracion: "",
      cantidadValoraciones: "",
    };
    setValores(vacios);
    onAplicarSelectores({});
  }

  return (
    <div className="maxun-inspector-contenedor">
      <div className="maxun-encabezado-toggle" onClick={() => setAbierto(!abierto)}>
        <div className="maxun-toggle-titulo" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="maxun-badge-robot" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Bot size={13} />
            Modo Maxun
          </span>
          <strong>Reglas y Selectores CSS Personalizados</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onAbrirInspectorVisual && (
            <button
              type="button"
              className="boton principal boton-chico"
              onClick={(e) => {
                e.stopPropagation();
                onAbrirInspectorVisual();
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Crosshair size={14} />
              <span>Abrir Inspector Visual F12</span>
            </button>
          )}
          <button type="button" className="enlace-boton" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Sliders size={14} />
            <span>{abierto ? "Ocultar selectores" : "Configurar selectores"}</span>
            {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {abierto && (
        <form onSubmit={aplicar} className="maxun-formulario-selectores">
          <p className="ayuda">
            Si la tienda no muestra algún dato o cambió su diseño, puedes indicar aquí la parte exacta de la página
            donde se ubica el precio o el título (ejemplo: <code>.precio-oferta</code>, <code>#titulo-producto</code>).
          </p>

          <div className="maxun-grid-campos">
            <div className="campo">
              <label htmlFor="selector-nombre">
                <span>Selector de Título / Nombre</span>
                <input
                  id="selector-nombre"
                  type="text"
                  placeholder="ej. h1.nombre-producto, .title"
                  value={valores.nombre}
                  onChange={(e) => manejarCambio("nombre", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-precio">
                <span>Selector de Precio Actual</span>
                <input
                  id="selector-precio"
                  type="text"
                  placeholder='ej. [data-testid="discounted"], #price'
                  value={valores.precioActual}
                  onChange={(e) => manejarCambio("precioActual", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-precio-ant">
                <span>Selector de Precio Original (lista / tachado)</span>
                <input
                  id="selector-precio-ant"
                  type="text"
                  placeholder='ej. [data-testid="original"], .line-through'
                  value={valores.precioOriginal}
                  onChange={(e) => manejarCambio("precioOriginal", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-imagen">
                <span>Selector de Imagen</span>
                <input
                  id="selector-imagen"
                  type="text"
                  placeholder="ej. #main-image, img.gallery-pic"
                  value={valores.imagenUrl}
                  onChange={(e) => manejarCambio("imagenUrl", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-desc">
                <span>Selector de Descripción</span>
                <input
                  id="selector-desc"
                  type="text"
                  placeholder="ej. #productDescription, .detalles"
                  value={valores.descripcion}
                  onChange={(e) => manejarCambio("descripcion", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-moneda">
                <span>Selector de Moneda</span>
                <input
                  id="selector-moneda"
                  type="text"
                  placeholder="ej. .currency-symbol, .moneda"
                  value={valores.moneda}
                  onChange={(e) => manejarCambio("moneda", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-stock">
                <span>Selector de Stock / Disponibilidad</span>
                <input
                  id="selector-stock"
                  type="text"
                  placeholder="ej. #availability, .stock-status"
                  value={valores.disponibilidad}
                  onChange={(e) => manejarCambio("disponibilidad", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-promo">
                <span>Selector de Etiqueta Promoción</span>
                <input
                  id="selector-promo"
                  type="text"
                  placeholder="ej. .badge-promo, .discount-tag"
                  value={valores.etiquetaPromocion}
                  onChange={(e) => manejarCambio("etiquetaPromocion", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-vigencia">
                <span>Selector de Vigencia de Oferta</span>
                <input
                  id="selector-vigencia"
                  type="text"
                  placeholder="ej. .promo-deadline, .countdown"
                  value={valores.vigenciaPromocion}
                  onChange={(e) => manejarCambio("vigenciaPromocion", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-valoracion">
                <span>Selector de Valoración (calificación / estrellas)</span>
                <input
                  id="selector-valoracion"
                  type="text"
                  placeholder="ej. .rating-stars, .review-score"
                  value={valores.valoracion}
                  onChange={(e) => manejarCambio("valoracion", e.target.value)}
                />
              </label>
            </div>

            <div className="campo">
              <label htmlFor="selector-cant-val">
                <span>Selector de Cantidad de Valoraciones</span>
                <input
                  id="selector-cant-val"
                  type="text"
                  placeholder="ej. .total-reviews, .rating-count"
                  value={valores.cantidadValoraciones}
                  onChange={(e) => manejarCambio("cantidadValoraciones", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="maxun-acciones">
            <button type="submit" className="boton principal" disabled={reejecutando} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Play size={15} />
              <span>{reejecutando ? "Extrayendo con nuevos selectores..." : "Re-ejecutar Extracción con estas reglas"}</span>
            </button>
            <button type="button" className="boton secundario" onClick={limpiarTodo} disabled={reejecutando} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <RotateCcw size={14} />
              <span>Restablecer valores por defecto</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
