import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  {
    label: 'Diagnose',
    path: '/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.5 3a1 1 0 0 1 .7.29l5.5 5.5a1 1 0 0 1 0 1.41l-1.38 1.38-1.41-1.41.67-.67-4.09-4.09-.67.67-1.41-1.41L13.79 3.3A1 1 0 0 1 14.5 3Zm-6 5.5 7 7-4.75 4.75a4.243 4.243 0 0 1-6 0 4.243 4.243 0 0 1 0-6L8.5 8.5Zm-2.34 6.66a2.243 2.243 0 0 0 0 3.18 2.243 2.243 0 0 0 3.18 0l2.34-2.34-3.18-3.18-2.34 2.34Z"
        />
      </svg>
    )
  },
  {
    label: 'History',
    path: '/history',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 4a8 8 0 1 1-7.75 10h2.07A6 6 0 1 0 12 6a5.96 5.96 0 0 0-4.24 1.76L10 10H4V4l2.35 2.35A7.95 7.95 0 0 1 12 4Zm-1 4h2v5h4v2h-6V8Z"
        />
      </svg>
    )
  },
  {
    label: 'About',
    path: '/about',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 8a1 1 0 0 0-1 1v5h2v-5a1 1 0 0 0-1-1Zm0-4a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 12 6Z"
        />
      </svg>
    )
  }
];

function TabNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="tab-nav">
      {tabs.map((tab) => {
        const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            type="button"
            className={`tab-nav-item ${active ? 'is-active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="tab-nav-icon">{tab.icon}</span>
            <span className="tab-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default TabNav;
