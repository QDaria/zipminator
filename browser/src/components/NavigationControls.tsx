// NavigationControls component

interface NavigationControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
}

export function NavigationControls({
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onReload,
}: NavigationControlsProps) {
  return (
    <div className="navigation-controls">
      <button
        className="nav-btn"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Go back"
        title="Back (Cmd+[)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        className="nav-btn"
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Go forward"
        title="Forward (Cmd+])"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        className="nav-btn"
        onClick={onReload}
        aria-label={isLoading ? "Stop loading" : "Reload page"}
        title={isLoading ? "Stop (Esc)" : "Reload (Cmd+R)"}
      >
        {isLoading ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13 8A5 5 0 113.5 5.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M1 3l2.5 2.5L6 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
