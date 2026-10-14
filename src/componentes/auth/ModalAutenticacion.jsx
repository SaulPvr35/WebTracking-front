import { useEffect, useState } from "react";
import { X, User, Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { iniciarSesion, registrarUsuario } from "../../servicios/servicioApi.js";

export default function ModalAutenticacion({ alAutenticar, alCerrar }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPresionarTecla(e) {
      if (e.key === "Escape") alCerrar();
    }
    window.addEventListener("keydown", alPresionarTecla);

    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener("keydown", alPresionarTecla);
    };
  }, [alCerrar]);

  async function enviar(evento) {
    evento.preventDefault();
    setCargando(true);
    setError("");

    try {
      let respuesta;
      if (esRegistro) {
        respuesta = await registrarUsuario(nombre, email, password);
      } else {
        respuesta = await iniciarSesion(email, password);
      }
      alAutenticar(respuesta.usuario, respuesta.token);
    } catch (problema) {
      setError(problema.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="modal-fondo" onClick={(e) => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="modal-tarjeta animar-escala">
        <div className="modal-encabezado">
          <h3>{esRegistro ? "Crear cuenta nueva" : "Iniciar sesión"}</h3>
          <button type="button" className="enlace-boton modal-cerrar-btn" onClick={alCerrar} title="Cerrar ventana">
            <X size={18} />
          </button>
        </div>

        <p className="ayuda">
          {esRegistro
            ? "Regístrate para guardar y monitorear tus propios productos de forma independiente."
            : "Accede a tu cuenta para ver tu catálogo de productos y tus alertas de precios."}
        </p>

        {error && (
          <div className="mensaje error" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertCircle size={16} />
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={enviar} className="modal-formulario">
          {esRegistro && (
            <div className="campo">
              <label htmlFor="auth-nombre">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <User size={14} />
                  Tu nombre
                </span>
                <input
                  id="auth-nombre"
                  type="text"
                  required
                  placeholder="ej. Carlos López"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="campo">
            <label htmlFor="auth-email">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Mail size={14} />
                Correo electrónico
              </span>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <div className="campo">
            <label htmlFor="auth-password">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Lock size={14} />
                Contraseña
              </span>
              <input
                id="auth-password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="boton principal" disabled={cargando} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {esRegistro ? <UserPlus size={16} /> : <LogIn size={16} />}
            <span>{cargando ? "Procesando..." : esRegistro ? "Crear mi cuenta" : "Entrar a mi cuenta"}</span>
          </button>
        </form>

        <div className="modal-pie">
          {esRegistro ? (
            <p>
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                className="enlace-boton"
                onClick={() => { setEsRegistro(false); setError(""); }}
              >
                Inicia sesión aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Aún no tienes cuenta?{" "}
              <button
                type="button"
                className="enlace-boton"
                onClick={() => { setEsRegistro(true); setError(""); }}
              >
                Regístrate gratis
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
