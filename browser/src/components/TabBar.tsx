import { useCallback, useState } from "react";
import type { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onReorderTab: (fromIndex: number, toIndex: number) => void;
  onDuplicateTab: (tabId: string) => void;
  onTogglePinTab: (tabId: string) => void;
}

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  index: number;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  onContextMenu: (e: React.MouseEvent, tabId: string) => void;
}

function TabItem({
  tab,
  isActive,
  index,
  onSelect,
  onClose,
  onDragStart,
  onDragOver,
  onDragEnd,
  onContextMenu,
}: TabItemProps) {
  const securityIcon =
    tab.security === "pqc"
      ? "\u{1F6E1}\uFE0F" // shield
      : tab.security === "classical"
        ? "\u{1F512}" // lock
        : "";

  const loadingClass = tab.loading === "loading" ? "tab-loading" : "";
  const activeClass = isActive ? "tab-active" : "";
  const pinnedClass = tab.pinned ? "tab-pinned" : "";

  return (
    <div
      className={`tab-item ${activeClass} ${loadingClass} ${pinnedClass}`}
      draggable={!tab.pinned}
      onClick={onSelect}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      onContextMenu={(e) => onContextMenu(e, tab.id)}
      title={`${tab.title}\n${tab.url}`}
    >
      {tab.favicon && (
        <img
          className="tab-favicon"
          src={tab.favicon}
          alt=""
          width={16}
          height={16}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      {securityIcon && <span className="tab-security-icon">{securityIcon}</span>}
      {!tab.pinned && <span className="tab-title">{tab.title}</span>}
      {tab.loading === "loading" && <span className="tab-spinner" />}
      {!tab.pinned && (
        <button
          className="tab-close-btn"
          onClick={onClose}
          aria-label={`Close ${tab.title}`}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTab,
  onDuplicateTab,
  onTogglePinTab,
}: TabBarProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragFrom(index);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (dragFrom !== null && dragFrom !== index) {
        onReorderTab(dragFrom, index);
        setDragFrom(index);
      }
    },
    [dragFrom, onReorderTab]
  );

  const handleDragEnd = useCallback(() => {
    setDragFrom(null);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, tabId });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="tab-bar" onMouseLeave={closeContextMenu}>
      <div className="tab-list">
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            index={index}
            onSelect={() => onSelectTab(tab.id)}
            onClose={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>
      <button className="new-tab-btn" onClick={onNewTab} aria-label="New Tab">
        +
      </button>

      {contextMenu && (
        <div
          className="tab-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={closeContextMenu}
        >
          <button
            onClick={() => {
              onDuplicateTab(contextMenu.tabId);
              closeContextMenu();
            }}
          >
            Duplicate Tab
          </button>
          <button
            onClick={() => {
              onTogglePinTab(contextMenu.tabId);
              closeContextMenu();
            }}
          >
            {tabs.find((t) => t.id === contextMenu.tabId)?.pinned
              ? "Unpin Tab"
              : "Pin Tab"}
          </button>
          <hr />
          <button
            onClick={() => {
              onCloseTab(contextMenu.tabId);
              closeContextMenu();
            }}
          >
            Close Tab
          </button>
        </div>
      )}
    </div>
  );
}
