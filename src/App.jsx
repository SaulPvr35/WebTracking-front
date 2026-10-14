import { useEffect, useState } from "react";
import { Search, LayoutDashboard, LogIn, LogOut, Activity } from "lucide-react";
import Cargando from "./componentes/comunes/Cargando.jsx";
import MensajeError from "./componentes/comunes/MensajeError.jsx";
import FormularioEnlace from "./componentes/productos/FormularioEnlace.jsx";
import VistaPreviaProducto from "./componentes/productos/VistaPreviaProducto.jsx";
import PanelControl from "./componentes/panel/PanelControl.jsx";
import ModalAutenticacion from "./componentes/auth/ModalAutenticacion.jsx";
import InspectorVisualTienda from "./componentes/productos/InspectorVisualTienda.jsx";
import {
  cerrarSesion,
  comprobarSalud,
  guardarProducto,
  guardarSesion,
  obtenerUsuarioActual,
  previsualizarProducto,
} from "./servicios/servicioApi.js";

function App() {
  const [salud, setSalud] = useState({ estado: "cargando" });
  const [vistaActiva, setVistaActiva] = useState("extractor"); // "extractor" | "panel"
  const [estado, setEstado] = useState("inicial");
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [mostrarModalAuth, setMostrarModalAuth] = useState(false);
  const [claveRecargaPanel, setClaveRecargaPanel] = useState(0);
  const [urlInspectorDirecto, setUrlInspectorDirecto] = useState(null);

  useEffect(() => {
    setUsuario(obtenerUsuarioActual());
    comprobarSalud()
      .then(setSalud)
      .catch(() => setSalud({ estado: "error" }));
  }, []);

  function alAutenticar(usuarioDatos, token) {
    guardarSesion(token, usuarioDatos);
    setUsuario(usuarioDatos);
    setMostrarModalAuth(false);
    setClaveRecargaPanel((k) => k + 1);
  }

  function salir() {
    cerrarSesion();
    setUsuario(null);
    setClaveRecargaPanel((k) => k + 1);
  }

  async function analizar(url, selectores = null) {
    setEstado("cargando");
    setError("");
    try {
      setProducto(await previsualizarProducto(url, selectores));
      setEstado("exito");
    } catch (problema) {
      setProducto(null);
      setError(problema.message);
      setEstado("error");
    }
  }

  return (
    <div className="app-layout">
      {/* Navbar Superior Global (Estilo SaaS / Maxun / Keepa) */}
      <header className="navbar-superior">
        <div className="navbar-contenedor">
          <div className="navbar-izquierda">
            <div className="marca-logo" onClick={() => setVistaActiva("extractor")} style={{ cursor: "pointer" }}>
              <Activity size={20} className="marca-icono" />
              <span>WebTracking</span>
            </div>
            <nav className="navbar-links">
              <button
                type="button"
                className={`navbar-tab-btn ${vistaActiva === "extractor" ? "activo" : ""}`}
                onClick={() => setVistaActiva("extractor")}
              >
                <Search size={16} />
                <span>Extractor & Scraping</span>
              </button>
              <button
                type="button"
                className={`navbar-tab-btn ${vistaActiva === "panel" ? "activo" : ""}`}
                onClick={() => setVistaActiva("panel")}
              >
                <LayoutDashboard size={16} />
                <span>Mi Panel & Robots</span>
              </button>
            </nav>
          </div>

          <div className="navbar-derecha">
            <div className={`indicador-salud ${salud.estado === "ok" ? "salud-ok" : "salud-fallo"}`} title="Estado del backend">
              <span className="dot-salud"></span>
              <span className="texto-salud">{salud.estado === "ok" ? "Backend Online" : "Desconectado"}</span>
            </div>

            {usuario ? (
              <div className="usuario-menu-nav">
                <div className="usuario-avatar-chip">
                  <span className="avatar-circulo">{usuario.nombre?.charAt(0).toUpperCase()}</span>
                  <span className="usuario-nombre-nav">{usuario.nombre}</span>
                </div>
                <button type="button" className="boton secundario boton-chico" onClick={salir} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <LogOut size={14} />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="boton principal boton-chico"
                onClick={() => setMostrarModalAuth(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <LogIn size={15} />
                <span>Iniciar sesión / Registro</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal según la vista del Navbar */}
      <main className="contenedor app-main-content">
        {vistaActiva === "extractor" ? (
          <section className="vista-extractor animar-entrada">
            <div className="hero-extractor">
              <h1>Extrae productos con inteligencia de precios</h1>
              <p className="descripcion">
                {usuario
                  ? `Hola ${usuario.nombre}, pega cualquier enlace de tienda para extraer descuentos, imágenes, rankings y guardarlo en tu cuenta.`
                  : "Pega el enlace de un producto para analizarlo automáticamente y guardar un monitoreo periódico."}
              </p>
            </div>

            <FormularioEnlace
              onAnalizar={analizar}
              onAbrirInspector={(urlDirecta) => setUrlInspectorDirecto(urlDirecta)}
              cargando={estado === "cargando"}
            />
            {urlInspectorDirecto && (
              <InspectorVisualTienda
                url={urlInspectorDirecto}
                onCerrar={() => setUrlInspectorDirecto(null)}
                onAplicarSelectorACampo={(_campo, _selector) => {
                  // Opcional: si el usuario selecciona campos directo desde aquí, puede disparar el análisis
                }}
              />
            )}
            {estado === "cargando" && <Cargando />}
            {estado === "error" && <MensajeError mensaje={error} />}
            {estado === "exito" && producto && (
              <VistaPreviaProducto
                producto={producto}
                usuarioActivo={usuario}
                onSolicitarAuth={() => setMostrarModalAuth(true)}
                onConfirmar={async (datos) => {
                  const res = await guardarProducto(datos);
                  setClaveRecargaPanel((k) => k + 1);
                  setVistaActiva("panel"); // Llevar al usuario a su panel tras guardar
                  return res;
                }}
                onReanalizarConSelectores={(url, selectores) => analizar(url, selectores)}
                reejecutando={estado === "cargando"}
              />
            )}
          </section>
        ) : (
          <section className="vista-panel animar-entrada">
            <PanelControl
              key={claveRecargaPanel}
              usuarioActivo={usuario}
              onSolicitarAuth={() => setMostrarModalAuth(true)}
            />
          </section>
        )}

        {mostrarModalAuth && (
          <ModalAutenticacion
            alAutenticar={alAutenticar}
            alCerrar={() => setMostrarModalAuth(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
