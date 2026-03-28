const LeafMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="header-logo-icon">
    <path
      fill="#3e7c2f"
      d="M18.7 3.8c-4.8.1-8.1 1.5-10.3 4.1-2.5 3-3.1 6.8-2.1 10.2.1.3.4.5.7.5h.1c.3 0 .6-.3.6-.6.3-3.3 2.7-6.3 6.4-7.6-2 1.5-3.6 3.4-4.6 5.7-.1.4 0 .8.4.9.4.2.8 0 1-.4 1.9-4.1 5.5-7.1 10-8.3.3-.1.5-.3.5-.6.1-1.1.1-2.3-.2-3.4-.1-.3-.4-.5-.7-.5h-.1Z"
    />
  </svg>
);

function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <LeafMark />
        <div className="app-header-title">
          <span className="app-header-word-dark">Plant</span>
          <span className="app-header-word-green">Autopsy</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
