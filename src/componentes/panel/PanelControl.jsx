import { useEffect, useState } from "react";
import {
  Package,
  Bot,
  Trash2,
  X,
  Flame,
  Tag,
  Clock,
  Check,
  RefreshCw,
  Zap,
  ImageOff,
  ExternalLink,
  Play,
  Pause,
  AlertCircle,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import MensajeError from "../comunes/MensajeError.jsx";
import GraficoHistorialPrecios from "../productos/GraficoHistorialPrecios.jsx";
import {
  cambiarEstadoSeguimiento,
  consultarSeguimiento,
  crearSeguimiento,
  eliminarProducto,
  listarProductos,
  listarSeguimientos,
  obtenerResumen,
  obtenerProducto,
  consultarProductoAhora,
} from "../../servicios/servicioApi.js";

const LIMITE = 10;

function formatearPrecio(precio, moneda) {
  if (precio === null || precio === undefined) return "No disponible";
  return `${Number(precio).toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${moneda ?? ""}`.trim();
}

function formatearFecha(fecha) {
  if (!fecha) return "Nunca";
  return new Date(fecha).toLocaleString("es-MX");
}

function obtenerDatosOferta(item) {
  const precioActual = Number(item.precioActual ?? item.precio);
  const precioOriginal = Number(item.precioOriginal ?? item.precioAnterior);
  const tienePreciosValidos = Number.isFinite(precioActual) && Number.isFinite(precioOriginal) && precioActual > 0 && precioOriginal > precioActual;
  
  if (tienePreciosValidos) {
    const ahorro = Number(item.ahorro) > 0 ? Number(item.ahorro) : Math.round((precioOriginal - precioActual) * 100) / 100;
    const porcentaje = Number(item.porcentajeDescuento) > 0 ? Math.round(Number(item.porcentajeDescuento)) : Math.round(((precioOriginal - precioActual) / precioOriginal) * 100);
    return {
      tieneOferta: true,
      porcentaje,
      ahorro,
      precioActual,
      precioOriginal,
      moneda: item.moneda,
    };
  }

  // Si tiene etiqueta o bandera de descuento explícita
  if (item.tieneDescuento && Number(item.porcentajeDescuento) > 0) {
    return {
      tieneOferta: true,
      porcentaje: Math.round(Number(item.porcentajeDescuento)),
      ahorro: Number(item.ahorro) || null,
      precioActual: Number.isFinite(precioActual) ? precioActual : null,
      precioOriginal: Number.isFinite(precioOriginal) ? precioOriginal : null,
      moneda: item.moneda,
    };
  }

  return {
    tieneOferta: false,
    precioActual: Number.isFinite(precioActual) ? precioActual : null,
    precioOriginal: null,
    ahorro: null,
    porcentaje: 0,
    moneda: item.moneda,
  };
}

import { LogIn } from "lucide-react";

export default function PanelControl({ usuarioActivo, onSolicitarAuth }) {
  const [pestanaActiva, setPestanaActiva] = useState("productos"); // "productos" | "monitoreo"
  const [resumen, setResumen] = useState(null);
  const [productos, setProductos] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("fechaActualizacion");
  const [direccion, setDireccion] = useState("desc");
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [intervalo, setIntervalo] = useState(1440);
  const [operando, setOperando] = useState(false);
  const [consultaEnProcesoId, setConsultaEnProcesoId] = useState(null);
  const [mensajeToast, setMensajeToast] = useState(null);

  function mostrarAviso(texto, tipo = "exito") {
    setMensajeToast({ texto, tipo });
    setTimeout(() => {
      setMensajeToast(null);
    }, 4500);
  }

  async function cargarResumen() {
    if (!usuarioActivo) return;
    setResumen(await obtenerResumen());
  }

  async function cargarProductos() {
    if (!usuarioActivo) return;
    const datos = await listarProductos({ pagina, busqueda, orden, direccion });
    setProductos(datos.productos);
    setTotal(datos.total);
  }

  async function cargarSeguimientos() {
    if (!usuarioActivo) return;
    try {
      const datos = await listarSeguimientos();
      setSeguimientos(Array.isArray(datos) ? datos : []);
    } catch {
      // Ignorar si aún no hay seguimientos
    }
  }

  useEffect(() => {
    if (!usuarioActivo) return;
    Promise.all([cargarResumen(), cargarProductos(), cargarSeguimientos()]).catch((problema) => setError(problema.message));
  }, [usuarioActivo, pagina, busqueda, orden, direccion]);

  useEffect(() => {
    if (!detalle) return;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPresionarEscape(e) {
      if (e.key === "Escape") setDetalle(null);
    }
    window.addEventListener("keydown", alPresionarEscape);

    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener("keydown", alPresionarEscape);
    };
  }, [detalle]);

  async function mostrarDetalle(id) {
    try {
      setDetalle(await obtenerProducto(id));
    } catch (problema) {
      setError(problema.message);
    }
  }

  async function borrarProducto(id, nombre) {
    const seguro = window.confirm(`¿Estás seguro de que deseas eliminar "${nombre || "este producto"}"? Esta acción no se puede deshacer.`);
    if (!seguro) return;

    setOperando(true);
    setError("");
    try {
      await eliminarProducto(id);
      if (detalle?.id === id) setDetalle(null);
      await Promise.all([cargarResumen(), cargarProductos(), cargarSeguimientos()]);
    } catch (problema) {
      setError(problema.message);
    } finally {
      setOperando(false);
    }
  }

  async function crearMonitoreo() {
    if (!detalle) return;
    setOperando(true);
    setError("");
    try {
      await crearSeguimiento(detalle.id, Number(intervalo));
      await mostrarDetalle(detalle.id);
      await cargarResumen();
      await cargarProductos();
    } catch (problema) {
      setError(problema.message);
    } finally {
      setOperando(false);
    }
  }

  async function alternarSeguimiento(seguimiento) {
    if (!detalle) return;
    setOperando(true);
    setError("");
    try {
      await cambiarEstadoSeguimiento(seguimiento.id, !seguimiento.activo);
      await mostrarDetalle(detalle.id);
      await cargarResumen();
    } catch (problema) {
      setError(problema.message);
    } finally {
      setOperando(false);
    }
  }

  async function consultarAhora(seguimiento) {
    setOperando(true);
    setConsultaEnProcesoId(seguimiento.id);
    setError("");
    try {
      const res = await consultarSeguimiento(seguimiento.id);
      if (detalle) {
        await mostrarDetalle(detalle.id);
      }
      await Promise.all([cargarResumen(), cargarProductos(), cargarSeguimientos()]);
      mostrarAviso(`Consulta completada para "${seguimiento.producto?.nombre ? seguimiento.producto.nombre.slice(0, 30) + '...' : 'producto'}". Datos y precios verificados en vivo.`);
    } catch (problema) {
      setError(problema.message);
      mostrarAviso(`Error al consultar: ${problema.message}`, "error");
    } finally {
      setOperando(false);
      setConsultaEnProcesoId(null);
    }
  }

  async function consultarProductoDirecto(productoId) {
    setOperando(true);
    setConsultaEnProcesoId(productoId);
    setError("");
    try {
      const res = await consultarProductoAhora(productoId);
      const prod = res?.producto;
      if (prod) {
        setDetalle(prod);
        const precioActual = prod.precioActual;
        const precioAnterior = prod.precioAnterior;
        if (precioAnterior !== null && precioAnterior !== undefined && precioActual !== null && precioActual !== undefined) {
          const delta = precioActual - precioAnterior;
          if (delta < 0) {
            mostrarAviso(`¡Precio bajó! De ${formatearPrecio(precioAnterior, prod.moneda)} a ${formatearPrecio(precioActual, prod.moneda)} (-$${Math.abs(delta).toFixed(2)})`);
          } else if (delta > 0) {
            mostrarAviso(`Precio subió: De ${formatearPrecio(precioAnterior, prod.moneda)} a ${formatearPrecio(precioActual, prod.moneda)} (+$${delta.toFixed(2)})`, "alerta");
          } else {
            mostrarAviso(`Datos verificados en vivo: El precio se mantiene en ${formatearPrecio(precioActual, prod.moneda)}.`);
          }
        } else {
          mostrarAviso(`Datos actualizados en vivo exitosamente desde la tienda.`);
        }
      } else if (detalle?.id === productoId) {
        await mostrarDetalle(productoId);
        mostrarAviso(`Datos consultados y sincronizados con éxito.`);
      }
      await Promise.all([cargarResumen(), cargarProductos(), cargarSeguimientos()]);
    } catch (problema) {
      setError(problema.message);
      mostrarAviso(`No se pudo consultar la tienda: ${problema.message}`, "error");
    } finally {
      setOperando(false);
      setConsultaEnProcesoId(null);
    }
  }

  const paginas = Math.max(1, Math.ceil(total / LIMITE));

  if (!usuarioActivo) {
    return (
      <section className="panel" aria-labelledby="titulo-panel">
        <div className="panel-bloqueado-card" style={{
          textAlign: "center",
          padding: "50px 24px",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          maxWidth: "540px",
          margin: "40px auto",
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "#eff6ff",
            color: "#2563eb",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <Package size={32} />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Panel de Productos y Monitoreo Privado
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "24px" }}>
            Para ver tu lista de productos guardados, configurar robots de seguimiento de precios y revisar el historial, debes iniciar sesión con tu cuenta.
          </p>
          <button
            type="button"
            className="boton principal"
            onClick={onSolicitarAuth}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: "0 auto", padding: "12px 24px" }}
          >
            <LogIn size={18} />
            <span>Iniciar sesión / Registrarse</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel animar-entrada" aria-labelledby="titulo-panel">
      <div className="encabezado-seccion">
        <div>
          <p className="etiqueta-seccion">Mi espacio de monitoreo</p>
          <h2 id="titulo-panel">Productos guardados y seguimiento</h2>
        </div>
        <span className="insignia">{total} producto{total === 1 ? "" : "s"}</span>
      </div>
      {error && <MensajeError mensaje={error} />}
      <div className="metricas">
        <article className="metrica-tarjeta-pro tarjeta-hover">
          <div className="metrica-cabecera">
            <span className="metrica-icono-wrapper icono-azul">
              <Package size={20} />
            </span>
            <span className="metrica-label">Productos guardados</span>
          </div>
          <strong>{resumen?.productos ?? "—"}</strong>
          <span className="metrica-subtexto">En tu catálogo personal</span>
        </article>

        <article className="metrica-tarjeta-pro tarjeta-hover">
          <div className="metrica-cabecera">
            <span className="metrica-icono-wrapper icono-verde">
              <Zap size={20} />
            </span>
            <span className="metrica-label">Seguimientos activos</span>
          </div>
          <strong>{resumen?.seguimientosActivos ?? "—"}</strong>
          <span className="metrica-subtexto">Robots vigilando precios</span>
        </article>

        <article className="metrica-tarjeta-pro tarjeta-hover">
          <div className="metrica-cabecera">
            <span className="metrica-icono-wrapper icono-morado">
              <Bot size={20} />
            </span>
            <span className="metrica-label">Seguimientos totales</span>
          </div>
          <strong>{resumen?.seguimientos ?? "—"}</strong>
          <span className="metrica-subtexto">Historial de tareas creadas</span>
        </article>

        <article className="metrica-tarjeta-pro tarjeta-hover">
          <div className="metrica-cabecera">
            <span className="metrica-icono-wrapper icono-naranja">
              <RefreshCw size={20} />
            </span>
            <span className="metrica-label">Consultas registradas</span>
          </div>
          <strong>{resumen?.consultas ?? "—"}</strong>
          <span className="metrica-subtexto">Verificaciones automáticas</span>
        </article>
      </div>
      {/* Pestañas estilo Maxun / Keepa */}
      <div className="panel-pestanas-nav">
        <button
          type="button"
          className={`pestana-btn ${pestanaActiva === "productos" ? "activa" : ""}`}
          onClick={() => setPestanaActiva("productos")}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
        >
          <Package size={16} />
          <span>Productos Guardados ({total})</span>
        </button>
        <button
          type="button"
          className={`pestana-btn ${pestanaActiva === "monitoreo" ? "activa" : ""}`}
          onClick={() => { setPestanaActiva("monitoreo"); cargarSeguimientos(); }}
          style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
        >
          <Bot size={16} />
          <span>Estado de Monitoreo y Robots ({seguimientos.length})</span>
        </button>
      </div>

      {pestanaActiva === "productos" ? (
        <>
          <div className="filtros">
            <label className="filtro-buscar-campo">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Search size={14} />
                Buscar
              </span>
              <input value={busqueda} onChange={(evento) => { setPagina(1); setBusqueda(evento.target.value); }} placeholder="Buscar por nombre o tienda (ej. coppel, samsung)..." />
            </label>
            <label className="filtro-orden-campo">
              <span>Ordenar por</span>
              <select value={orden} onChange={(evento) => setOrden(evento.target.value)}>
                <option value="fechaActualizacion">Última actualización</option>
                <option value="fechaCreacion">Fecha de creación</option>
                <option value="nombre">Nombre</option>
                <option value="precioActual">Precio</option>
                <option value="dominio">Tienda</option>
              </select>
            </label>
            <button className="boton secundario boton-direccion-orden" type="button" onClick={() => setDireccion((actual) => actual === "asc" ? "desc" : "asc")}>
              <ArrowUpDown size={14} />
              <span>{direccion === "asc" ? "Ascendente" : "Descendente"}</span>
            </button>
          </div>
          {productos.length === 0 ? (
            <p className="mensaje informativo">No hay productos que coincidan con los filtros.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-productos-pro">
                <thead>
                  <tr>
                    <th style={{ width: "38%" }}>Producto</th>
                    <th style={{ width: "14%" }}>Tienda</th>
                    <th style={{ width: "16%" }}>Precio</th>
                    <th style={{ width: "14%" }}>Oferta / Ahorro</th>
                    <th style={{ width: "6%", textAlign: "center" }}>Robots</th>
                    <th style={{ width: "12%", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => {
                    const oferta = obtenerDatosOferta(producto);
                    return (
                    <tr key={producto.id} className="fila-producto-hover">
                      <td>
                        <div className="fila-producto-celda">
                          <div className="miniatura-tabla-box" onClick={() => mostrarDetalle(producto.id)} style={{ cursor: "pointer" }}>
                            {producto.imagenUrl ? (
                              <img src={producto.imagenUrl} alt={producto.nombre ?? "Producto"} className="miniatura-tabla-img" loading="lazy" />
                            ) : (
                              <span className="miniatura-placeholder">
                                <ImageOff size={16} color="#94a3b8" />
                              </span>
                            )}
                          </div>
                          <div className="info-nombre-tabla">
                            <span className="titulo-producto-tabla" onClick={() => mostrarDetalle(producto.id)} title={producto.nombre}>
                              {producto.nombre ?? "Sin nombre"}
                            </span>
                            <span className="fecha-actualizacion-sub">
                              Act: {formatearFecha(producto.fechaActualizacion)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-tienda-chip">
                          {producto.dominio}
                        </span>
                      </td>
                      <td>
                        <div className="celda-precio">
                          <span className="precio-actual-destacado">{formatearPrecio(producto.precioActual, producto.moneda)}</span>
                          {oferta.tieneOferta && oferta.precioOriginal && (
                            <span className="precio-original-tachado">{formatearPrecio(oferta.precioOriginal, producto.moneda)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {oferta.tieneOferta ? (
                          <div className="badge-descuento-tabla">
                            <span className="descuento-pill">
                              <Flame size={12} />
                              -{oferta.porcentaje}%
                            </span>
                            {oferta.ahorro > 0 && (
                              <span className="ahorro-subtexto">
                                Ahorras {formatearPrecio(oferta.ahorro, producto.moneda)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="texto-sin-promo">Sin oferta activa</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge-conteo-seguimientos ${producto._count.seguimientos > 0 ? "con-robots" : ""}`}>
                          {producto._count.seguimientos}
                        </span>
                      </td>
                      <td>
                        <div className="acciones-tabla-wrapper">
                          <button
                            className="boton principal boton-chico boton-tabla-accion"
                            type="button"
                            disabled={operando}
                            onClick={() => consultarProductoDirecto(producto.id)}
                            title="Consultar datos y precios actualizados en vivo de la tienda"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <RefreshCw size={12} className={consultaEnProcesoId === producto.id ? "animar-rotar" : ""} />
                            <span>{consultaEnProcesoId === producto.id ? "Consultando..." : "Consultar"}</span>
                          </button>
                          <button
                            className="boton secundario boton-chico boton-tabla-accion"
                            type="button"
                            onClick={() => mostrarDetalle(producto.id)}
                            title="Ver detalles e historial"
                          >
                            Detalle
                          </button>
                          <button
                            className="boton-icono-peligro"
                            type="button"
                            disabled={operando}
                            onClick={() => borrarProducto(producto.id, producto.nombre)}
                            title="Eliminar producto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="paginacion">
            <span>Página {pagina} de {paginas}</span>
            <div>
              <button className="boton secundario" type="button" disabled={pagina <= 1} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button>
              <button className="boton secundario" type="button" disabled={pagina >= paginas} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button>
            </div>
          </div>
        </>
      ) : (
        /* Pestaña de Monitoreo: Estado, veces consultado, latencia ms, próxima consulta */
        <div className="seccion-monitoreo-robots">
          <div className="encabezado-monitoreo">
            <p className="ayuda">
              Visualiza en tiempo real los robots de monitoreo periódicos, su frecuencia, latencia de respuesta y estado de ejecución.
            </p>
          </div>
          {seguimientos.length === 0 ? (
            <p className="mensaje informativo">No hay tareas de monitoreo activas. Abre un producto y haz clic en "Crear seguimiento".</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-productos-pro">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Oferta / Ahorro</th>
                    <th>Estado</th>
                    <th>Frecuencia</th>
                    <th>Consultas Totales</th>
                    <th>Éxitos / Fallos</th>
                    <th>Última Latencia</th>
                    <th>Próxima Consulta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {seguimientos.map((s) => {
                    const oferta = obtenerDatosOferta(s.producto || {});
                    return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.producto?.nombre ?? "Producto"}</strong>
                        <div className="subtexto-dominio">{s.producto?.dominio}</div>
                      </td>
                      <td>
                        {oferta.tieneOferta ? (
                          <div className="badge-descuento-tabla">
                            <span className="descuento-pill">
                              <Flame size={12} />
                              -{oferta.porcentaje}%
                            </span>
                            {oferta.ahorro > 0 && (
                              <span className="ahorro-subtexto">
                                Ahorras {formatearPrecio(oferta.ahorro, s.producto?.moneda)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="texto-sin-promo">Sin oferta activa</span>
                        )}
                      </td>
                      <td>
                        <span className={`insignia-estado ${s.ultimoEstado === "exito" ? "estado-exito" : s.ultimoEstado === "pausado" ? "estado-pausado" : "estado-pendiente"}`}>
                          {s.activo ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <span className="dot-salud" style={{ width: 6, height: 6 }}></span>
                              {s.ultimoEstado}
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Pause size={12} />
                              Pausado
                            </span>
                          )}
                        </span>
                      </td>
                      <td>Cada {s.intervaloMinutos} min</td>
                      <td>
                        <strong>{s.intentosTotales}</strong> consultas
                      </td>
                      <td>
                        <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <Check size={12} /> {s.consultasExitosas}
                        </span>
                        {" / "}
                        <span style={{ color: "#dc2626", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <X size={12} /> {s.consultasFallidas}
                        </span>
                      </td>
                      <td>
                        <span className="badge-latencia" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {s.tiempoUltimaConsultaMs ? (
                            <>
                              <Zap size={12} />
                              <span>{s.tiempoUltimaConsultaMs} ms</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                      </td>
                      <td>{formatearFecha(s.proximaConsulta)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="boton secundario boton-chico"
                            disabled={operando}
                            onClick={() => alternarSeguimiento(s)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {s.activo ? <Pause size={12} /> : <Play size={12} />}
                            <span>{s.activo ? "Pausar" : "Reanudar"}</span>
                          </button>
                          <button
                            type="button"
                            className="boton principal boton-chico"
                            disabled={operando}
                            onClick={() => consultarAhora(s)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <RefreshCw size={12} className={consultaEnProcesoId === s.id ? "animar-rotar" : ""} />
                            <span>{consultaEnProcesoId === s.id ? "Consultando..." : "Consultar"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {detalle && (
        <div className="modal-fondo" onClick={(e) => { if (e.target === e.currentTarget) setDetalle(null); }}>
          <div className="modal-tarjeta modal-tarjeta-grande animar-escala">
            <div className="modal-encabezado">
              <div>
                <p className="etiqueta-seccion">Detalle del producto</p>
                <h3 style={{ margin: "4px 0 0" }}>{detalle.nombre ?? "Sin nombre"}</h3>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className="boton principal boton-chico"
                  type="button"
                  disabled={operando}
                  onClick={() => consultarProductoDirecto(detalle.id)}
                  title="Consultar en vivo a la tienda y registrar variaciones"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={13} className={operando ? "animar-rotar" : ""} />
                  <span>{operando ? "Consultando tienda..." : "Consultar ahora"}</span>
                </button>
                <button
                  className="boton boton-peligro boton-chico"
                  type="button"
                  disabled={operando}
                  onClick={() => borrarProducto(detalle.id, detalle.nombre)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
                <button className="enlace-boton modal-cerrar-btn" type="button" onClick={() => setDetalle(null)} title="Cerrar ventana">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-scroll-cuerpo">
              {/* Tarjeta de imagen y datos principales */}
              <div className="detalle-modal-preview">
                {detalle.imagenUrl && (
                  <div className="detalle-modal-img-box">
                    <img src={detalle.imagenUrl} alt={detalle.nombre ?? "Producto"} className="detalle-modal-img" />
                  </div>
                )}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p className="origen" style={{ border: 0, padding: 0, margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                    <strong>Origen:</strong>
                    <a href={detalle.urlOriginal} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span>{detalle.urlOriginal}</span>
                      <ExternalLink size={13} />
                    </a>
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Estado de monitoreo:</strong>{" "}
                    {detalle.seguimientos.length ? detalle.seguimientos.map((seguimiento) => seguimiento.ultimoEstado).join(", ") : "Sin seguimiento creado"}
                  </p>
                  {detalle.descripcion && (
                    <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.9rem", lineHeight: "1.4" }}>
                      {detalle.descripcion}
                    </p>
                  )}
                </div>
              </div>

              {/* Banner de Descuento Activo si existe */}
              {detalle.tieneDescuento && detalle.precioOriginal && (
                <div className="promo-banner-descuento" style={{ margin: "14px 0" }}>
                  <div className="promo-badge-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Flame size={14} />
                    <span>{detalle.porcentajeDescuento}% DE DESCUENTO</span>
                  </div>
                  <div className="promo-cuerpo">
                    <div className="promo-precios">
                      <span className="promo-precio-actual">{formatearPrecio(detalle.precioActual, detalle.moneda)}</span>
                      <span className="promo-precio-original">{formatearPrecio(detalle.precioOriginal, detalle.moneda)}</span>
                    </div>
                    <div className="promo-ahorro">Ahorro: <strong>{formatearPrecio(detalle.ahorro, detalle.moneda)}</strong></div>
                  </div>
                  {detalle.etiquetaPromocion && (
                    <p className="promo-etiqueta-texto" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Tag size={13} />
                      <em>{detalle.etiquetaPromocion}</em>
                    </p>
                  )}
                  {detalle.vigenciaPromocion && (
                    <p className="promo-vigencia" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} />
                      <span>Vigencia: <strong>{detalle.vigenciaPromocion}</strong></span>
                    </p>
                  )}
                </div>
              )}

              {/* Configuración de Monitoreo / Robots */}
              {!detalle.seguimientos.length && (
                <div className="configuracion-monitoreo">
                  <label>
                    Intervalo de monitoreo (minutos)
                    <input type="number" min="15" max="43200" value={intervalo} onChange={(evento) => setIntervalo(evento.target.value)} />
                  </label>
                  <button className="boton principal" type="button" disabled={operando} onClick={crearMonitoreo}>
                    Crear seguimiento
                  </button>
                </div>
              )}

              {detalle.seguimientos.map((seguimiento) => (
                <div className="seguimiento-control" key={seguimiento.id}>
                  <span>Intervalo: {seguimiento.intervaloMinutos} min · Próxima consulta: {formatearFecha(seguimiento.proximaConsulta)}</span>
                  <div>
                    <button className="boton secundario" type="button" disabled={operando} onClick={() => alternarSeguimiento(seguimiento)}>
                      {seguimiento.activo ? "Pausar" : "Reanudar"}
                    </button>
                    <button className="boton secundario" type="button" disabled={operando} onClick={() => consultarAhora(seguimiento)}>
                      Consultar ahora
                    </button>
                  </div>
                </div>
              ))}

              {/* Gráfico de evolución de precios */}
              <h4>Evolución histórica y análisis de precios</h4>
              <GraficoHistorialPrecios
                historial={detalle.historialPrecios}
                moneda={detalle.moneda ?? "USD"}
                umbralDeseado={detalle.precioActual ? Math.round(detalle.precioActual * 0.9) : null}
              />

              {/* LÍNEA DE TIEMPO: FLUJO DE CONSULTAS Y CAMBIOS DE PRECIO */}
              <div className="seccion-timeline-precios">
                <div className="timeline-encabezado">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={18} color="var(--color-primario)" />
                    <h4 style={{ margin: 0 }}>Línea de tiempo y registro de consultas</h4>
                  </div>
                  <span className="badge-total-registros">
                    {detalle.historialPrecios?.length || 0} cambios registrados
                  </span>
                </div>

                {(!detalle.historialPrecios || detalle.historialPrecios.length === 0) ? (
                  <p className="ayuda" style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    Aún no se han ejecutado suficientes consultas para mostrar una línea de tiempo. Activa el monitoreo automático o pulsa "Consultar ahora" para comenzar a registrar variaciones.
                  </p>
                ) : (
                  <div className="contenedor-timeline-flujo">
                    {detalle.historialPrecios.map((item, idx, array) => {
                      // El array viene ordenado descendente (más reciente primero)
                      // Comparamos con el anterior cronológico (que está en idx + 1)
                      const anterior = array[idx + 1];
                      let diferencia = null;
                      let porcentajeCambio = null;
                      let tipoCambio = "neutro"; // 'subio' | 'bajo' | 'igual' | 'inicial'

                      if (anterior && anterior.precio !== null && item.precio !== null) {
                        diferencia = Math.round((item.precio - anterior.precio) * 100) / 100;
                        if (anterior.precio > 0) {
                          porcentajeCambio = Math.round(((item.precio - anterior.precio) / anterior.precio) * 100);
                        }
                        if (diferencia > 0) tipoCambio = "subio";
                        else if (diferencia < 0) tipoCambio = "bajo";
                        else tipoCambio = "igual";
                      } else if (idx === array.length - 1) {
                        tipoCambio = "inicial";
                      }

                      return (
                        <div key={item.id || idx} className={`item-timeline item-${tipoCambio}`}>
                          <div className="nodo-timeline">
                            {tipoCambio === "subio" && <TrendingUp size={14} className="icono-subio" />}
                            {tipoCambio === "bajo" && <TrendingDown size={14} className="icono-bajo" />}
                            {tipoCambio === "igual" && <Minus size={14} className="icono-igual" />}
                            {tipoCambio === "inicial" && <Calendar size={14} className="icono-inicial" />}
                          </div>

                          <div className="tarjeta-evento-timeline">
                            <div className="evento-cabecera">
                              <div className="evento-precios-row">
                                <strong className="evento-precio-principal">
                                  {formatearPrecio(item.precio, item.moneda || detalle.moneda)}
                                </strong>

                                {tipoCambio === "bajo" && (
                                  <span className="badge-cambio-precio baja">
                                    <TrendingDown size={12} />
                                    <span>Bajó {formatearPrecio(Math.abs(diferencia), item.moneda || detalle.moneda)} ({porcentajeCambio}%)</span>
                                  </span>
                                )}

                                {tipoCambio === "subio" && (
                                  <span className="badge-cambio-precio alza">
                                    <TrendingUp size={12} />
                                    <span>Aumentó +{formatearPrecio(diferencia, item.moneda || detalle.moneda)} (+{porcentajeCambio}%)</span>
                                  </span>
                                )}

                                {tipoCambio === "igual" && (
                                  <span className="badge-cambio-precio sin-cambio">
                                    <Minus size={12} />
                                    <span>Precio sin variación</span>
                                  </span>
                                )}

                                {tipoCambio === "inicial" && (
                                  <span className="badge-cambio-precio inicial">
                                    <span>Precio inicial capturado</span>
                                  </span>
                                )}
                              </div>

                              <span className="evento-fecha">
                                {formatearFecha(item.fechaRegistro)}
                              </span>
                            </div>

                            <div className="evento-detalles-adicionales">
                              {item.tieneDescuento && item.precioOriginal && (
                                <span className="evento-tag-descuento">
                                  <Flame size={12} />
                                  <span>Oferta activa: Original {formatearPrecio(item.precioOriginal, item.moneda || detalle.moneda)}</span>
                                  {item.porcentajeDescuento ? ` (-${item.porcentajeDescuento}%)` : ""}
                                </span>
                              )}

                              {item.disponibilidad && (
                                <span className="evento-tag-info">
                                  Stock: {item.disponibilidad}
                                </span>
                              )}

                              {item.etiquetaPromocion && (
                                <span className="evento-tag-promo">
                                  <Tag size={12} />
                                  <span>{item.etiquetaPromocion}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}
      {mensajeToast && (
        <div className={`toast-flotante toast-${mensajeToast.tipo} animar-entrada-abajo`}>
          <div className="toast-icono">
            <RefreshCw size={15} />
          </div>
          <div className="toast-contenido">
            <span>{mensajeToast.texto}</span>
          </div>
          <button type="button" className="toast-cerrar" onClick={() => setMensajeToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
