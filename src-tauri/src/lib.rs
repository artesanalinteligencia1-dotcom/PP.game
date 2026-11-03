// Desktop shell: a native window around the same web build. All game files are bundled in the
// installer, so the game runs fully offline. Saves stay in the webview's local storage.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running PP.game");
}
