// Prevents an additional console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
#[allow(dead_code)]
mod extensions;
mod navigation;
mod pqc;
mod state;
mod tabs;

// Domain modules (declared in lib.rs, re-used here via crate path)
use state::AppState;
#[cfg(feature = "vpn")]
use state::VpnState;
use tauri::Manager;

// AI sidebar commands (Domain 4)
use zipbrowser::ai;

fn main() {
    // Initialize structured logging (tracing for domain modules, env_logger for shell).
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "zipbrowser=info,proxy=debug,vpn=info,privacy=info,ai=info".into()),
        )
        .init();

    tracing::info!("Starting Zipminator v0.2.0");

    // Verify TLS provider before launching the app.
    if let Err(e) = zipbrowser::verify_tls() {
        tracing::error!(error = %e, "TLS provider verification failed");
        eprintln!("FATAL: {e}");
        std::process::exit(1);
    }
    tracing::info!(info = ?zipbrowser::get_tls_info(), "TLS provider verified");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .manage(ai::initial_state(None)) // AI sidebar state (proxy port set in setup)
        .setup(|app| {
            let app_handle = app.handle().clone();

            // ── Domain 2: Start PQC HTTPS Proxy ───────────────────────────
            let data_dir = app.path().app_data_dir().unwrap_or_else(|_| {
                std::env::temp_dir().join("zipbrowser")
            });
            let proxy_data_dir = data_dir.clone();
            tauri::async_runtime::spawn(async move {
                match zipbrowser::start_proxy(proxy_data_dir).await {
                    Ok((host, port)) => {
                        tracing::info!(host, port, "PQC HTTPS proxy started");
                    }
                    Err(e) => {
                        tracing::error!(error = %e, "Failed to start PQC proxy");
                    }
                }
            });

            // ── Domain 3: Initialize the VPN manager ──────────────────────
            zipbrowser::init_vpn_manager();

            #[cfg(feature = "vpn")]
            {
                let vpn_handle = app_handle.clone();
                app.listen("vpn-state-changed", move |event| {
                    let payload_str = event.payload();
                    let managed: tauri::State<'_, AppState> = vpn_handle.state();
                    if let Ok(mut vpn) = managed.vpn_state.lock() {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(payload_str) {
                            let state_str = v.get("state").and_then(|s| s.as_str()).unwrap_or("");
                            vpn.connected = matches!(state_str, "Connected" | "Rekeying");
                            if vpn.connected {
                                vpn.protocol = Some("PQ-WireGuard".to_string());
                            } else {
                                vpn.protocol = None;
                                vpn.uptime_secs = 0;
                            }
                        }
                    }
                    tracing::info!("VPN state updated from event");
                });
            }

            // ── Domain 1: Restore persisted state ─────────────────────────
            if let Ok(data_dir) = app.path().app_data_dir() {
                let state = app.state::<AppState>();
                let path = data_dir.as_path();
                if path.exists() {
                    match tabs::TabManager::load_from_disk(path) {
                        Ok(restored) => {
                            if let Ok(mut tabs) = state.tabs.lock() {
                                *tabs = restored;
                            }
                        }
                        Err(e) => tracing::warn!(error = %e, "Could not restore tabs"),
                    }
                    if let Err(e) = state.load_bookmarks(path) {
                        tracing::warn!(error = %e, "Could not restore bookmarks");
                    }
                }
            }

            tracing::info!("ZipBrowser setup complete — all domains initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ── Domain 1: Browser shell commands ──────────────────────────
            // Tab management
            commands::get_tabs,
            commands::get_active_tab,
            commands::create_tab,
            commands::close_tab,
            commands::set_active_tab,
            commands::set_active_tab_by_index,
            commands::duplicate_tab,
            commands::toggle_pin_tab,
            commands::reorder_tab,
            // Navigation
            commands::navigate,
            commands::go_back,
            commands::go_forward,
            commands::reload,
            commands::can_go_back,
            commands::can_go_forward,
            // Tab metadata
            commands::update_tab_meta,
            commands::set_tab_error,
            // Bookmarks
            commands::get_bookmarks,
            commands::add_bookmark,
            commands::remove_bookmark,
            commands::is_bookmarked,
            // Persistence
            commands::save_state,
            commands::load_state,
            // ── Cross-domain integration commands ─────────────────────────
            // Proxy (Domain 2: PQC TLS)
            commands::set_proxy_config,
            commands::disable_proxy,
            commands::get_proxy_config,
            // Session token (Domain 5: privacy engine)
            commands::get_session_token,
            commands::regenerate_session_token,
            // VPN lifecycle (Domain 3: embedded VPN)
            commands::get_vpn_state,
            commands::vpn_connect,
            commands::vpn_disconnect,
            commands::vpn_set_always_on,
            commands::vpn_get_status,
            // Entropy status (Domain 5: privacy engine)
            commands::get_entropy_status,
            // ── PQC Kyber768 commands (zipminator-core) ───────────────────
            pqc::pqc_info,
            pqc::pqc_keygen,
            pqc::pqc_encapsulate,
            pqc::pqc_decapsulate,
            pqc::pqc_self_test,
            // ── PQC Scanning ─────────────────────────────────────────────
            commands::scan_pqc_endpoint,
            // ── AI Sidebar (Domain 4) ───────────────────────────────────────
            ai::sidebar::ai_chat,
            ai::sidebar::ai_summarize,
            ai::sidebar::ai_rewrite,
            ai::sidebar::ai_get_config,
            ai::sidebar::ai_set_config,
            ai::sidebar::ai_extract_page_context,
            ai::sidebar::ai_clear_history,
            ai::sidebar::ai_download_model,
            ai::sidebar::ai_load_model,
        ])
        .run(tauri::generate_context!())
        .expect("error running Zipminator");
}
