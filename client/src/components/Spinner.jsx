function Spinner({ message }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner-circle" aria-hidden="true" />
      {message ? <p className="spinner-message">{message}</p> : null}
    </div>
  );
}

export default Spinner;
