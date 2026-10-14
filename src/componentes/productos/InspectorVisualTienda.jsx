import { useState, useEffect, useRef } from "react";
import {
  FileCode,
  Globe,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Search,
  Sparkles,
  MousePointer,
  Crosshair,
  ExternalLink,
  Code2,
  Layers,
  ArrowRight,
  RefreshCw,
  X
} from "lucide-react";
import { analizarHtmlTienda, obtenerUrlProxyInspector } from "../../servicios/servicioApi.js";

export default function InspectorVisualTienda({
  url,
  selectoresActuales = {},
  onAplicarSelectorACampo,
  onCerrar,
}) {
  const [modo, setModo] = useState("ejecutado"); // "texto" | "ejecutado"
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [datosHtml, setDatosHtml] = useState(null); // { modo, html, titulo, urlFinal, lineas, tamanoBytes }
  const [copiado, setCopiado] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  // Estado para el modo ejecutado / inspector
  const [elementoHover, setElementoHover] = useState(null);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [iframeListo, setIframeListo] = useState(false);

  const iframeRef = useRef(null);

  // Cargar datos según el modo activo
  useEffect(() => {
    if (!url) return;
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");
      setIframeListo(false);
      try {
        const respuesta = await analizarHtmlTienda(url, modo);
        if (activo) {
          setDatosHtml(respuesta);
        }
      } catch (err) {
        if (activo) {
          setError(err.message || "Error al analizar el HTML de la tienda.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [url, modo]);

  // Manejar mensajes del script inyectado en el iframe (hover, click, listo)
  useEffect(() => {
    function manejarMensaje(evento) {
      if (!evento.data || typeof evento.data !== "object") return;
      const { tipo, elemento, url: urlMsg } = evento.data;

      if (tipo === "INSPECTOR_LISTO") {
        setIframeListo(true);
      } else if (tipo === "INSPECTOR_HOVER") {
        setElementoHover(elemento);
      } else if (tipo === "INSPECTOR_SELECCION") {
        setElementoSeleccionado(elemento);
      }
    }

    window.addEventListener("message", manejarMensaje);
    return () => window.removeEventListener("message", manejarMensaje);
  }, []);

  const [camposAsignados, setCamposAsignados] = useState({});

  function copiarTexto(texto) {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function asignarACampo(campo, selector) {
    if (onAplicarSelectorACampo && selector && elementoSeleccionado) {
      const valor = elementoSeleccionado.valorAttrSrc || elementoSeleccionado.texto;
      onAplicarSelectorACampo(campo, selector, valor);
      setCamposAsignados((prev) => ({ ...prev, [campo]: valor }));
    }
  }

  // Filtrado de líneas para modo texto
  const lineasHtml = datosHtml?.html ? datosHtml.html.split("\n") : [];
  const lineasFiltradas = filtroTexto
    ? lineasHtml
        .map((linea, idx) => ({ linea, num: idx + 1 }))
        .filter((item) => item.linea.toLowerCase().includes(filtroTexto.toLowerCase()))
        .slice(0, 100)
    : [];

  return (
    <div className={`modal-fondo inspector-modal-overlay ${pantallaCompleta ? "modal-fullscreen" : ""}`}>
      <div className="inspector-modal-card">
        {/* Barra superior de control estilo WebTracking */}
        <div className="inspector-header">
          <div className="inspector-titulo-grupo">
            <div className="inspector-icono-wrapper">
              <Crosshair size={18} />
            </div>
            <div className="inspector-titulos">
              <div className="inspector-badge-row">
                <h3>Inspector Visual de Elementos</h3>
                <span className="insignia-f12-pro">Modo F12 Activo</span>
              </div>
              <p className="subtexto-url" title={url}>
                {url}
              </p>
            </div>
          </div>

          {/* Segmented Control / Tabs modernas */}
          <div className="inspector-tabs-modo">
            <button
              type="button"
              className={`inspector-tab-btn ${modo === "ejecutado" ? "activo" : ""}`}
              onClick={() => setModo("ejecutado")}
              disabled={cargando}
            >
              <Globe size={14} />
              <span>Navegador Interactivo</span>
            </button>
            <button
              type="button"
              className={`inspector-tab-btn ${modo === "texto" ? "activo" : ""}`}
              onClick={() => setModo("texto")}
              disabled={cargando}
            >
              <FileCode size={14} />
              <span>Código Fuente HTML</span>
            </button>
          </div>

          <div className="inspector-acciones-ventana">
            <button
              type="button"
              className="inspector-btn-control"
              title={pantallaCompleta ? "Restaurar tamaño normal" : "Maximizar pantalla completa"}
              onClick={() => setPantallaCompleta(!pantallaCompleta)}
            >
              {pantallaCompleta ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {onCerrar && (
              <button
                type="button"
                className="inspector-btn-control inspector-btn-cerrar"
                title="Cerrar inspector"
                onClick={onCerrar}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Notificaciones / Mensajes de estado */}
        {error && (
          <div className="inspector-alerta-error">
            <span>{error}</span>
            <button type="button" className="boton-reintentar" onClick={() => setModo(modo)}>
              <RefreshCw size={13} /> Reintentar
            </button>
          </div>
        )}

        {/* CUERPO DEL INSPECTOR */}
        <div className="inspector-cuerpo">
          {cargando ? (
            <div className="inspector-cargando">
              <RefreshCw size={32} className="icono-girando" />
              <h4>{modo === "ejecutado" ? "Renderizando página con Playwright..." : "Descargando HTML directo..."}</h4>
              <p className="ayuda">
                {modo === "ejecutado"
                  ? "Cargando scripts dinámicos, fuentes y estilos como en un navegador real."
                  : "Obteniendo texto plano para análisis de etiquetas rápidas."}
              </p>
            </div>
          ) : modo === "ejecutado" ? (
            /* MODO EJECUTADO: VISTA SPLIT-SCREEN (Navegador a la izq, DevTools a la der) */
            <div className="inspector-split-layout">
              {/* Lado izquierdo: Navegador Web Sandbox Interactivo */}
              <div className="inspector-panel-navegador">
                <div className="barra-navegador-superior">
                  <div className="indicador-interactivo">
                    <span className="punto-verde"></span>
                    <span>Modo Interactivo: Haz clic en cualquier elemento para capturar su selector</span>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="enlace-tienda-externa"
                    title="Abrir en pestaña nueva"
                  >
                    <span>Tienda original</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                <div className="contenedor-iframe-tienda">
                  {datosHtml?.html ? (
                    <iframe
                      ref={iframeRef}
                      title="Vista Renderizada del Producto"
                      className="iframe-tienda-render"
                      sandbox="allow-scripts allow-same-origin"
                      srcDoc={datosHtml.html}
                    />
                  ) : (
                    <div className="sin-contenido-iframe">No se pudo generar la vista previa renderizada.</div>
                  )}
                </div>

                {elementoHover && (
                  <div className="inspector-hover-barra">
                    <span className="hover-tag">&lt;{elementoHover.tag}&gt;</span>
                    <span className="hover-selector">{elementoHover.selector || "sin clase"}</span>
                    {elementoHover.texto && <span className="hover-texto">"{elementoHover.texto.slice(0, 50)}..."</span>}
                  </div>
                )}
              </div>

              {/* Lado derecho: Panel DevTools F12 & Asignador de Selectores */}
              <div className="inspector-panel-devtools">
                <div className="devtools-header">
                  <div className="devtools-titulo-grupo">
                    <Code2 size={16} />
                    <strong>Elemento Seleccionado</strong>
                  </div>
                  {elementoSeleccionado && (
                    <button
                      type="button"
                      className="boton-copiar-selector"
                      onClick={() => copiarTexto(elementoSeleccionado.selector)}
                    >
                      {copiado ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiado ? "Copiado" : "Copiar selector"}</span>
                    </button>
                  )}
                </div>

                {elementoSeleccionado ? (
                  <div className="devtools-contenido">
                    {/* Selector CSS destacado */}
                    <div className="caja-selector-css">
                      <label>Selector CSS generado:</label>
                      <div className="fila-codigo-selector">
                        <code>{elementoSeleccionado.selector || "Selector no identificable"}</code>
                      </div>
                    </div>

                    {/* Botones de asignación directa rápida */}
                    <div className="seccion-asignacion-rapida">
                      <label className="etiqueta-asignacion">Asignar directamente a campo de la ficha:</label>
                      <div className="grid-botones-asignar">
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("precioActual", elementoSeleccionado.selector)}
                          title="Precio actual o de oferta final"
                        >
                          <ArrowRight size={13} />
                          <span>Precio Actual (final)</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("precioOriginal", elementoSeleccionado.selector)}
                          title="Precio original de lista o tachado"
                        >
                          <ArrowRight size={13} />
                          <span>Precio Original (lista)</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("nombre", elementoSeleccionado.selector)}
                          title="Título principal del producto"
                        >
                          <ArrowRight size={13} />
                          <span>Nombre / Título</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("imagenUrl", elementoSeleccionado.selector)}
                          title="Imagen principal"
                        >
                          <ArrowRight size={13} />
                          <span>URL de imagen</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("descripcion", elementoSeleccionado.selector)}
                          title="Descripción o características"
                        >
                          <ArrowRight size={13} />
                          <span>Descripción</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("moneda", elementoSeleccionado.selector)}
                          title="Código de moneda (MXN, USD, etc.)"
                        >
                          <ArrowRight size={13} />
                          <span>Moneda</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("disponibilidad", elementoSeleccionado.selector)}
                          title="Estado de stock o disponibilidad"
                        >
                          <ArrowRight size={13} />
                          <span>Disponibilidad</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("etiquetaPromocion", elementoSeleccionado.selector)}
                          title="Texto de promo o descuento (ej. Hot Sale, -20%)"
                        >
                          <ArrowRight size={13} />
                          <span>Etiqueta de promoción</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("vigenciaPromocion", elementoSeleccionado.selector)}
                          title="Fecha o vigencia de la oferta"
                        >
                          <ArrowRight size={13} />
                          <span>Vigencia de oferta</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("valoracion", elementoSeleccionado.selector)}
                          title="Calificación en estrellas o puntos (ej. 4.8)"
                        >
                          <ArrowRight size={13} />
                          <span>Valoración (estrellas)</span>
                        </button>
                        <button
                          type="button"
                          className="btn-asignar"
                          onClick={() => asignarACampo("cantidadValoraciones", elementoSeleccionado.selector)}
                          title="Número de opiniones o reseñas"
                        >
                          <ArrowRight size={13} />
                          <span>Cantidad de valoraciones</span>
                        </button>
                      </div>

                      {Object.keys(camposAsignados).length > 0 && (
                        <div className="inspector-resumen-completados">
                          <div className="resumen-completados-header">
                            <span className="resumen-contador-badge">
                              {Object.keys(camposAsignados).length} campos asignados
                            </span>
                            {onCerrar && (
                              <button
                                type="button"
                                onClick={onCerrar}
                                className="boton-volver-ficha"
                              >
                                Listo, volver a la ficha
                              </button>
                            )}
                          </div>
                          <div className="lista-tags-asignados">
                            {Object.entries(camposAsignados).map(([c, val]) => (
                              <span key={c} className="tag-campo-asignado">
                                <span className="tag-campo-nombre">{c}</span>
                                <span className="tag-campo-valor">{String(val).slice(0, 24)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Previsualización del valor contenido */}
                    <div className="devtools-bloque-info">
                      <label>Texto extraído del elemento:</label>
                      <pre className="bloque-codigo-valor">{elementoSeleccionado.texto || "(Vacío o sin texto directo)"}</pre>
                    </div>

                    {elementoSeleccionado.valorAttrSrc && (
                      <div className="devtools-bloque-info">
                        <label>Atributo de Imagen (src):</label>
                        <div className="fila-img-previa">
                          <img
                            src={elementoSeleccionado.valorAttrSrc}
                            alt="Previa del elemento"
                            className="img-miniatura-inspector"
                          />
                          <code className="url-img-corta">{elementoSeleccionado.valorAttrSrc}</code>
                        </div>
                      </div>
                    )}

                    {/* Atributos del nodo */}
                    <div className="devtools-bloque-info">
                      <label>Atributos del nodo DOM:</label>
                      <div className="tabla-atributos">
                        {Object.entries(elementoSeleccionado.atributos || {}).map(([k, v]) => (
                          <div key={k} className="fila-atributo">
                            <span className="attr-clave">{k}:</span>
                            <span className="attr-valor" title={String(v)}>
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="devtools-vacio">
                    <MousePointer size={28} className="icono-puntero-vacio" />
                    <h5>Ningún elemento seleccionado</h5>
                    <p className="ayuda">
                      Haz clic en cualquier botón, precio, título o imagen en la vista previa del navegador de la izquierda para
                      inspeccionar su estructura DOM y generar su selector CSS.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* MODO TEXTO: VISOR Y BUSCADOR DE HTML PLANO */
            <div className="inspector-panel-texto">
              <div className="barra-herramientas-texto">
                <div className="buscador-texto-html">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Buscar etiqueta, clase o palabra clave (ej. price, itemprop, discount, h1)..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                  />
                  {filtroTexto && (
                    <button type="button" className="btn-limpiar-busqueda" onClick={() => setFiltroTexto("")}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="info-texto-stats">
                  <span>{datosHtml?.lineas ? `${datosHtml.lineas.toLocaleString()} líneas` : ""}</span>
                  <span>{datosHtml?.tamanoBytes ? `${Math.round(datosHtml.tamanoBytes / 1024)} KB` : ""}</span>
                  <button
                    type="button"
                    className="boton secundario boton-chico"
                    onClick={() => copiarTexto(datosHtml?.html || "")}
                  >
                    {copiado ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiado ? "HTML Copiado" : "Copiar todo el HTML"}</span>
                  </button>
                </div>
              </div>

              {filtroTexto ? (
                <div className="resultados-busqueda-html">
                  <div className="resultados-contador">
                    Coincidencias encontradas ({lineasFiltradas.length}{lineasFiltradas.length === 100 ? "+" : ""}):
                  </div>
                  <div className="lista-lineas-codigo">
                    {lineasFiltradas.map((item, idx) => (
                      <div key={idx} className="linea-codigo-item">
                        <span className="num-linea">{item.num}</span>
                        <pre className="contenido-linea">{item.linea}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <pre className="visor-codigo-completo">
                  <code>{datosHtml?.html || "Sin contenido HTML"}</code>
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
