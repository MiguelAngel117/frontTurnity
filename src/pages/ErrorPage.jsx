import './ErrorPage.css'; // Asegúrate de crear este archivo CSS

const ErrorPage = () => {
  // Función para redireccionar al inicio
  const goToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="error-container">
      <div className="gears-container">
        <div className="gear gear-large"></div>
        <div className="gear gear-medium"></div>
        <div className="gear gear-small"></div>
      </div>
      
      <div className="error-content">
        <h1>¡Oops! Algo salió mal</h1>
        <p>Estamos trabajando para solucionar este problema.</p>
        <p className="error-message">Nuestro equipo técnico ha sido notificado y estamos reparando este error.</p>
        <button className="home-button" onClick={goToHome}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;