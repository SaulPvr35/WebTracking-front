const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const CLAVE_TOKEN = "hacerweb_token_auth";
const CLAVE_USUARIO = "hacerweb_usuario_auth";

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

export function obtenerUsuarioActual() {
  try {
    const raw = localStorage.getItem(CLAVE_USUARIO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function obtenerCabeceras(base = {}) {
  const headers = { ...base };
  const token = obtenerToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function traducirErrorAmigable(cuerpo, respuesta) {
  if (cuerpo.error) {
    // Si viene error con código HTTP como "HTTP 404"
    if (cuerpo.error.includes("404") || respuesta.status === 404) {
      return "El producto o la página que buscas no existe o ya no está disponible.";
    }
    if (cuerpo.error.includes("401") || respuesta.status === 401) {
      return "Debes iniciar sesión con tu cuenta para realizar esta acción.";
    }
    if (cuerpo.error.includes("403") || respuesta.status === 403) {
      return "No tienes permiso para acceder a este elemento o la tienda bloqueó temporalmente el acceso.";
    }
    if (cuerpo.error.includes("500") || respuesta.status >= 500) {
      return "El servicio no está disponible en este momento. Por favor, intenta de nuevo en unos momentos.";
    }
    return cuerpo.error;
  }

  if (respuesta.status === 404) {
    return "No pudimos encontrar la información solicitada.";
  }
  if (respuesta.status === 401) {
    return "Tu sesión ha expirado o necesitas iniciar sesión.";
  }
  if (respuesta.status >= 500) {
    return "Ocurrió un inconveniente temporal en el servidor. Por favor, intenta de nuevo.";
  }
  return "No fue posible completar la solicitud. Por favor intenta de nuevo.";
}

async function interpretarRespuesta(respuesta) {
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(traducirErrorAmigable(cuerpo, respuesta));
  }
  return cuerpo;
}

export async function registrarUsuario(nombre, email, password) {
  const respuesta = await fetch(`${apiUrl}/api/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });
  return interpretarRespuesta(respuesta);
}

export async function iniciarSesion(email, password) {
  const respuesta = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return interpretarRespuesta(respuesta);
}

export async function obtenerPerfil() {
  const respuesta = await fetch(`${apiUrl}/api/auth/perfil`, {
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}

export async function comprobarSalud() {
  const respuesta = await fetch(`${apiUrl}/api/salud`);
  return interpretarRespuesta(respuesta);
}

export async function previsualizarProducto(url, selectores = null) {
  const respuesta = await fetch(`${apiUrl}/api/productos/previsualizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, selectores: selectores || undefined }),
  });
  return interpretarRespuesta(respuesta);
}

export async function analizarHtmlTienda(url, modo = "texto") {
  const respuesta = await fetch(`${apiUrl}/api/productos/analizar-html-tienda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, modo }),
  });
  return interpretarRespuesta(respuesta);
}

export function obtenerUrlProxyInspector() {
  return `${apiUrl}/api/productos/proxy-inspector`;
}


export async function guardarProducto(producto) {
  const respuesta = await fetch(`${apiUrl}/api/productos`, {
    method: "POST",
    headers: obtenerCabeceras({ "Content-Type": "application/json" }),
    body: JSON.stringify(producto),
  });
  return interpretarRespuesta(respuesta);
}

export async function obtenerResumen() {
  const respuesta = await fetch(`${apiUrl}/api/panel/resumen`, {
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}

export async function listarProductos({ pagina = 1, busqueda = "", orden = "fechaActualizacion", direccion = "desc" } = {}) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    limite: "10",
    busqueda,
    orden,
    direccion,
  });
  const respuesta = await fetch(`${apiUrl}/api/productos?${parametros}`, {
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}

export async function obtenerProducto(id) {
  const respuesta = await fetch(`${apiUrl}/api/productos/${encodeURIComponent(id)}`, {
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}

export async function consultarProductoAhora(id) {
  const respuesta = await fetch(`${apiUrl}/api/productos/${encodeURIComponent(id)}/consultar`, {
    method: "POST",
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}

export async function eliminarProducto(id) {
  const respuesta = await fetch(`${apiUrl}/api/productos/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: obtenerCabeceras(),
  });
  if (respuesta.status === 204) return true;
  return interpretarRespuesta(respuesta);
}

export async function crearSeguimiento(productoId, intervaloMinutos) {
  const respuesta = await fetch(`${apiUrl}/api/seguimientos`, {
    method: "POST",
    headers: obtenerCabeceras({ "Content-Type": "application/json" }),
    body: JSON.stringify({ productoId, intervaloMinutos }),
  });
  return interpretarRespuesta(respuesta);
}

export async function cambiarEstadoSeguimiento(id, activo) {
  const respuesta = await fetch(`${apiUrl}/api/seguimientos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: obtenerCabeceras({ "Content-Type": "application/json" }),
    body: JSON.stringify({ activo }),
  });
  return interpretarRespuesta(respuesta);
}

export async function consultarSeguimiento(id) {
  const respuesta = await fetch(`${apiUrl}/api/seguimientos/${encodeURIComponent(id)}/consultar`, {
    method: "POST",
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}

export async function listarSeguimientos() {
  const respuesta = await fetch(`${apiUrl}/api/seguimientos`, {
    headers: obtenerCabeceras(),
  });
  return interpretarRespuesta(respuesta);
}
