// SidebarSlot component
import type { SidebarSlotProps } from "../types";

/**
 * SidebarSlot provides a mounting point for the AI sidebar (Domain Lead 4).
 *
 * The AI sidebar domain will inject its content into this slot by passing
 * React children through the App component's sidebar integration point.
 * This component handles the open/close animation and sizing.
 */
export function SidebarSlot({
  isOpen,
  width,
  children,
  onClose,
}: SidebarSlotProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="sidebar-slot"
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      <div className="sidebar-header">
        <span className="sidebar-title">AI Assistant</span>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="sidebar-content">
        {children ?? (
          <div className="sidebar-placeholder">
            <p>AI sidebar will be connected by Domain Lead 4.</p>
            <p>This slot accepts any React component tree.</p>
          </div>
        )}
      </div>
    </div>
  );
}
