use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use crate::state::SecurityLevel;

/// The loading state of a tab.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LoadingStatus {
    Idle,
    Loading,
    Complete,
    Error,
}

/// A single browser tab.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub loading: LoadingStatus,
    pub security: SecurityLevel,
    pub pinned: bool,
    pub created_at: i64,
    pub last_accessed: i64,
}

impl Tab {
    pub fn new(url: &str) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            title: "New Tab".to_string(),
            favicon: None,
            loading: LoadingStatus::Idle,
            security: SecurityLevel::None,
            pinned: false,
            created_at: now,
            last_accessed: now,
        }
    }
}

/// Manages the collection of open tabs.
#[derive(Debug, Serialize, Deserialize)]
pub struct TabManager {
    tabs: Vec<Tab>,
    active_tab_id: Option<String>,
    /// Ordered list of tab IDs (supports reordering).
    tab_order: Vec<String>,
    /// Navigation history per tab: (back_stack, forward_stack).
    #[serde(skip)]
    history: HashMap<String, (Vec<String>, Vec<String>)>,
}

impl TabManager {
    pub fn new() -> Self {
        let default_tab = Tab::new("about:blank");
        let id = default_tab.id.clone();
        Self {
            tabs: vec![default_tab],
            active_tab_id: Some(id.clone()),
            tab_order: vec![id],
            history: HashMap::new(),
        }
    }

    /// Returns all tabs in display order.
    pub fn get_tabs(&self) -> Vec<Tab> {
        let mut ordered: Vec<Tab> = Vec::with_capacity(self.tab_order.len());
        for tab_id in &self.tab_order {
            if let Some(tab) = self.tabs.iter().find(|t| &t.id == tab_id) {
                ordered.push(tab.clone());
            }
        }
        ordered
    }

    /// Returns the active tab, if any.
    pub fn active_tab(&self) -> Option<&Tab> {
        self.active_tab_id
            .as_ref()
            .and_then(|id| self.tabs.iter().find(|t| t.id == *id))
    }

    /// Returns the active tab id.
    #[allow(dead_code)]
    pub fn active_tab_id(&self) -> Option<String> {
        self.active_tab_id.clone()
    }

    /// Create a new tab and make it active.
    pub fn create_tab(&mut self, url: &str) -> Tab {
        let tab = Tab::new(url);
        let id = tab.id.clone();
        self.tabs.push(tab.clone());
        self.tab_order.push(id.clone());
        self.history
            .insert(id.clone(), (Vec::new(), Vec::new()));
        self.active_tab_id = Some(id);
        tab
    }

    /// Close a tab by ID. Returns the new active tab id (if any).
    pub fn close_tab(&mut self, tab_id: &str) -> Option<String> {
        // Don't close the last tab -- create a replacement instead.
        if self.tabs.len() == 1 {
            let new_tab = Tab::new("about:blank");
            let new_id = new_tab.id.clone();
            self.tabs = vec![new_tab];
            self.tab_order = vec![new_id.clone()];
            self.active_tab_id = Some(new_id.clone());
            self.history.remove(tab_id);
            return Some(new_id);
        }

        let idx = self.tab_order.iter().position(|id| id == tab_id);
        self.tabs.retain(|t| t.id != tab_id);
        self.tab_order.retain(|id| id != tab_id);
        self.history.remove(tab_id);

        // If the closed tab was active, pick a neighbor.
        if self.active_tab_id.as_deref() == Some(tab_id) {
            let new_active = if let Some(i) = idx {
                let clamped = if i >= self.tab_order.len() {
                    self.tab_order.len().saturating_sub(1)
                } else {
                    i
                };
                self.tab_order.get(clamped).cloned()
            } else {
                self.tab_order.first().cloned()
            };
            self.active_tab_id = new_active.clone();
            new_active
        } else {
            self.active_tab_id.clone()
        }
    }

    /// Switch to a tab by ID.
    pub fn set_active_tab(&mut self, tab_id: &str) -> bool {
        if let Some(tab) = self.tabs.iter_mut().find(|t| t.id == tab_id) {
            tab.last_accessed = chrono::Utc::now().timestamp_millis();
            self.active_tab_id = Some(tab_id.to_string());
            true
        } else {
            false
        }
    }

    /// Set a tab by index (1-based, for Cmd+1..9).
    pub fn set_active_tab_by_index(&mut self, index: usize) -> Option<String> {
        let zero_based = index.saturating_sub(1);
        if let Some(tab_id) = self.tab_order.get(zero_based).cloned() {
            self.set_active_tab(&tab_id);
            Some(tab_id)
        } else {
            None
        }
    }

    /// Duplicate a tab.
    pub fn duplicate_tab(&mut self, tab_id: &str) -> Option<Tab> {
        let source = self.tabs.iter().find(|t| t.id == tab_id)?.clone();
        let new_tab = self.create_tab(&source.url);
        // Copy title and favicon from source.
        if let Some(t) = self.tabs.iter_mut().find(|t| t.id == new_tab.id) {
            t.title = source.title;
            t.favicon = source.favicon;
        }
        self.tabs.iter().find(|t| t.id == new_tab.id).cloned()
    }

    /// Pin or unpin a tab.
    pub fn toggle_pin(&mut self, tab_id: &str) -> bool {
        if let Some(tab) = self.tabs.iter_mut().find(|t| t.id == tab_id) {
            tab.pinned = !tab.pinned;
            // Move pinned tabs to the front.
            self.reorder_pinned();
            true
        } else {
            false
        }
    }

    /// Reorder tabs so pinned tabs are first (preserving relative order).
    fn reorder_pinned(&mut self) {
        let pinned_ids: Vec<String> = self
            .tab_order
            .iter()
            .filter(|id| self.tabs.iter().any(|t| &t.id == *id && t.pinned))
            .cloned()
            .collect();
        let unpinned_ids: Vec<String> = self
            .tab_order
            .iter()
            .filter(|id| self.tabs.iter().any(|t| &t.id == *id && !t.pinned))
            .cloned()
            .collect();
        self.tab_order = [pinned_ids, unpinned_ids].concat();
    }

    /// Move a tab from one position to another.
    pub fn reorder_tab(&mut self, from_index: usize, to_index: usize) -> bool {
        if from_index >= self.tab_order.len() || to_index >= self.tab_order.len() {
            return false;
        }
        let id = self.tab_order.remove(from_index);
        self.tab_order.insert(to_index, id);
        true
    }

    /// Navigate the active tab to a new URL (pushes old URL onto history).
    pub fn navigate(&mut self, tab_id: &str, url: &str) {
        if let Some(tab) = self.tabs.iter_mut().find(|t| t.id == tab_id) {
            let old_url = tab.url.clone();
            tab.url = url.to_string();
            tab.loading = LoadingStatus::Loading;
            tab.security = SecurityLevel::None;

            let entry = self
                .history
                .entry(tab_id.to_string())
                .or_insert_with(|| (Vec::new(), Vec::new()));
            if old_url != "about:blank" {
                entry.0.push(old_url);
            }
            // Clear forward stack on new navigation.
            entry.1.clear();
        }
    }

    /// Navigate back. Returns the URL to load, if any.
    pub fn go_back(&mut self, tab_id: &str) -> Option<String> {
        let tab = self.tabs.iter_mut().find(|t| t.id == tab_id)?;
        let entry = self.history.get_mut(tab_id)?;
        let prev_url = entry.0.pop()?;
        entry.1.push(tab.url.clone());
        tab.url = prev_url.clone();
        tab.loading = LoadingStatus::Loading;
        Some(prev_url)
    }

    /// Navigate forward. Returns the URL to load, if any.
    pub fn go_forward(&mut self, tab_id: &str) -> Option<String> {
        let tab = self.tabs.iter_mut().find(|t| t.id == tab_id)?;
        let entry = self.history.get_mut(tab_id)?;
        let next_url = entry.1.pop()?;
        entry.0.push(tab.url.clone());
        tab.url = next_url.clone();
        tab.loading = LoadingStatus::Loading;
        Some(next_url)
    }

    /// Check if a tab can navigate back.
    pub fn can_go_back(&self, tab_id: &str) -> bool {
        self.history
            .get(tab_id)
            .map(|(back, _)| !back.is_empty())
            .unwrap_or(false)
    }

    /// Check if a tab can navigate forward.
    pub fn can_go_forward(&self, tab_id: &str) -> bool {
        self.history
            .get(tab_id)
            .map(|(_, fwd)| !fwd.is_empty())
            .unwrap_or(false)
    }

    /// Update tab metadata after page load.
    pub fn update_tab_meta(
        &mut self,
        tab_id: &str,
        title: Option<String>,
        favicon: Option<String>,
        security: Option<SecurityLevel>,
    ) {
        if let Some(tab) = self.tabs.iter_mut().find(|t| t.id == tab_id) {
            if let Some(t) = title {
                tab.title = t;
            }
            if let Some(f) = favicon {
                tab.favicon = Some(f);
            }
            if let Some(s) = security {
                tab.security = s;
            }
            tab.loading = LoadingStatus::Complete;
        }
    }

    /// Mark a tab as having an error.
    pub fn set_tab_error(&mut self, tab_id: &str) {
        if let Some(tab) = self.tabs.iter_mut().find(|t| t.id == tab_id) {
            tab.loading = LoadingStatus::Error;
        }
    }

    /// Serialize tab state for persistence.
    pub fn serialize(&self) -> Result<String, String> {
        serde_json::to_string_pretty(self).map_err(|e| format!("Serialize tabs: {}", e))
    }

    /// Restore tab state from persisted JSON.
    pub fn deserialize(json: &str) -> Result<Self, String> {
        let mut mgr: TabManager =
            serde_json::from_str(json).map_err(|e| format!("Deserialize tabs: {}", e))?;
        // Rebuild empty history for each tab.
        for tab in &mgr.tabs {
            mgr.history
                .entry(tab.id.clone())
                .or_insert_with(|| (Vec::new(), Vec::new()));
        }
        Ok(mgr)
    }

    /// Persist tab state to the app data directory.
    pub fn save_to_disk(&self, app_data_dir: &std::path::Path) -> Result<(), String> {
        let path = app_data_dir.join("tabs.json");
        let data = self.serialize()?;
        std::fs::write(&path, data).map_err(|e| format!("Write tabs: {}", e))?;
        Ok(())
    }

    /// Load tab state from the app data directory.
    pub fn load_from_disk(app_data_dir: &std::path::Path) -> Result<Self, String> {
        let path = app_data_dir.join("tabs.json");
        if !path.exists() {
            return Ok(Self::new());
        }
        let data = std::fs::read_to_string(&path).map_err(|e| format!("Read tabs: {}", e))?;
        Self::deserialize(&data)
    }
}

impl Default for TabManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_close_tabs() {
        let mut mgr = TabManager::new();
        assert_eq!(mgr.get_tabs().len(), 1);

        let tab2 = mgr.create_tab("https://example.com");
        assert_eq!(mgr.get_tabs().len(), 2);
        assert_eq!(mgr.active_tab_id(), Some(tab2.id.clone()));

        mgr.close_tab(&tab2.id);
        assert_eq!(mgr.get_tabs().len(), 1);
    }

    #[test]
    fn test_close_last_tab_creates_new() {
        let mut mgr = TabManager::new();
        let first_id = mgr.active_tab_id().unwrap();
        let new_active = mgr.close_tab(&first_id);
        assert!(new_active.is_some());
        assert_eq!(mgr.get_tabs().len(), 1);
        assert_ne!(new_active.unwrap(), first_id);
    }

    #[test]
    fn test_navigation_history() {
        let mut mgr = TabManager::new();
        let tab = mgr.create_tab("https://a.com");
        let id = tab.id.clone();

        mgr.navigate(&id, "https://b.com");
        mgr.navigate(&id, "https://c.com");

        assert!(mgr.can_go_back(&id));
        assert!(!mgr.can_go_forward(&id));

        let back = mgr.go_back(&id);
        assert_eq!(back, Some("https://b.com".to_string()));
        assert!(mgr.can_go_forward(&id));

        let fwd = mgr.go_forward(&id);
        assert_eq!(fwd, Some("https://c.com".to_string()));
    }

    #[test]
    fn test_pin_tab() {
        let mut mgr = TabManager::new();
        let tab = mgr.create_tab("https://example.com");
        assert!(!mgr.get_tabs().iter().find(|t| t.id == tab.id).unwrap().pinned);

        mgr.toggle_pin(&tab.id);
        assert!(mgr.get_tabs().iter().find(|t| t.id == tab.id).unwrap().pinned);
        // Pinned tab should be first in order.
        assert_eq!(mgr.tab_order[0], tab.id);
    }

    #[test]
    fn test_duplicate_tab() {
        let mut mgr = TabManager::new();
        let tab = mgr.create_tab("https://example.com");
        mgr.update_tab_meta(&tab.id, Some("Example".to_string()), None, None);

        let dup = mgr.duplicate_tab(&tab.id).unwrap();
        assert_ne!(dup.id, tab.id);
        assert_eq!(dup.url, "https://example.com");
        assert_eq!(dup.title, "Example");
        assert_eq!(mgr.get_tabs().len(), 3); // default + original + dup
    }

    #[test]
    fn test_reorder_tab() {
        let mut mgr = TabManager::new();
        let _t1 = mgr.create_tab("https://a.com");
        let t2 = mgr.create_tab("https://b.com");

        let initial_last = mgr.tab_order.last().unwrap().clone();
        assert_eq!(initial_last, t2.id);

        mgr.reorder_tab(2, 0);
        assert_eq!(mgr.tab_order[0], t2.id);
    }

    #[test]
    fn test_serialize_deserialize() {
        let mut mgr = TabManager::new();
        mgr.create_tab("https://example.com");
        let json = mgr.serialize().unwrap();
        let restored = TabManager::deserialize(&json).unwrap();
        assert_eq!(restored.get_tabs().len(), mgr.get_tabs().len());
    }

    #[test]
    fn test_set_active_tab_by_index() {
        let mut mgr = TabManager::new();
        let t2 = mgr.create_tab("https://a.com");
        let _t3 = mgr.create_tab("https://b.com");

        let switched = mgr.set_active_tab_by_index(2);
        assert_eq!(switched, Some(t2.id));
    }
}
