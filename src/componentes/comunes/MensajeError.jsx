export default function MensajeError({ mensaje, onReintentar }) {
  return (
    <div className="mensaje error" role="alert">
      <strong>No se pudo obtener la previsualización.</strong>
      <p>{mensaje}</p>
      {onReintentar && (
        <button type="button" className="boton secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
