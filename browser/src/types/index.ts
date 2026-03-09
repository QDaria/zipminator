/** Security classification of the current page connection. */
export type SecurityLevel = "pqc" | "classical" | "none";

/** Loading state of a browser tab. */
export type LoadingStatus = "idle" | "loading" | "complete" | "error";

/** A single browser tab. */
export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  loading: LoadingStatus;
  security: SecurityLevel;
  pinned: boolean;
  created_at: number;
  last_accessed: number;
}

/** Result of a navigation action. */
export interface NavigationResult {
  tab_id: string;
  url: string;
  can_go_back: boolean;
  can_go_forward: boolean;
}

/** Proxy configuration for the PQC TLS proxy. */
export interface ProxyConfig {
  host: string;
  port: number;
  enabled: boolean;
}

/** VPN connection status. */
export interface VpnState {
  connected: boolean;
  server_location: string | null;
  protocol: string | null;
  uptime_secs: number;
}

/** QRNG entropy pool status. */
export type EntropyStatus = "available" | "harvesting" | "depleted" | "unknown";

/** A bookmarked page. */
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  created_at: string;
}

/** Tab metadata update payload. */
export interface TabMetaUpdate {
  tab_id: string;
  title?: string;
  favicon?: string;
  security?: SecurityLevel;
}

/** Sidebar slot props for cross-domain AI sidebar integration. */
export interface SidebarSlotProps {
  /** Whether the sidebar is open. */
  isOpen: boolean;
  /** Width in pixels. */
  width: number;
  /** Content to render inside the sidebar. */
  children?: React.ReactNode;
  /** Callback when sidebar is closed. */
  onClose: () => void;
}

/** The global browser state exposed to all components. */
export interface BrowserState {
  tabs: Tab[];
  activeTabId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  vpnState: VpnState;
  entropyStatus: EntropyStatus;
  proxyConfig: ProxyConfig;
  sidebarOpen: boolean;
}
