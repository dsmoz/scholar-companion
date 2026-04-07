// src/api/preferences.ts — sync all user preferences to the server
import { apiFetch } from './client';
import {
  getTheme, getSyncInterval, getSyncOnStartup, getAutoSync,
  getChatModel, getChatMaxChunks, getChatRelatedMax, getChatRelatedMinLabel,
  getItemPaneHeight, getDiscoveryScoreMode, getDiscoveryMinScore,
  getDiscoveryTopK, getListPageSize, getCacheTtlMinutes,
  getDiscoveryFontSize, getDiscoveryTextColor, getSourcePrefs,
  getAutoCascadeDelete, getAccentColor,
} from '../prefs';

/** Collect all local preferences into a single object. */
function collectAll(): Record<string, unknown> {
  return {
    discovery_sources: getSourcePrefs(),
    theme: getTheme(),
    accent_color: getAccentColor(),
    sync_interval: getSyncInterval(),
    sync_on_startup: getSyncOnStartup(),
    auto_sync: getAutoSync(),
    chat_model: getChatModel(),
    chat_max_chunks: getChatMaxChunks(),
    chat_related_max: getChatRelatedMax(),
    chat_related_min_label: getChatRelatedMinLabel(),
    item_pane_height: getItemPaneHeight(),
    discovery_score_mode: getDiscoveryScoreMode(),
    discovery_min_score: getDiscoveryMinScore(),
    discovery_top_k: getDiscoveryTopK(),
    list_page_size: getListPageSize(),
    cache_ttl_minutes: getCacheTtlMinutes(),
    discovery_font_size: getDiscoveryFontSize(),
    discovery_text_color: getDiscoveryTextColor(),
    auto_cascade_delete: getAutoCascadeDelete(),
  };
}

let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Push all preferences to the server. Debounced — rapid changes
 * within 500ms are batched into a single request.
 */
export function syncPreferences(): void {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    apiFetch('/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences: collectAll() }),
    }).catch(err => {
      console.warn('[Scholar Companion] Failed to sync preferences:', err);
    });
  }, 500);
}

/**
 * Push all preferences immediately (no debounce).
 * Use on login/connect when you want to ensure sync before continuing.
 */
export async function syncPreferencesNow(): Promise<void> {
  if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
  try {
    await apiFetch('/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences: collectAll() }),
    });
  } catch (err) {
    console.warn('[Scholar Companion] Failed to sync preferences:', err);
  }
}

/**
 * Load preferences from the server and apply to local prefs.
 * Use on login/connect to restore server-side state.
 */
export async function loadPreferencesFromServer(): Promise<void> {
  try {
    const data = await apiFetch<{ preferences: Record<string, unknown> }>('/preferences');
    const prefs = data.preferences;
    if (!prefs || Object.keys(prefs).length === 0) return;

    // Apply server preferences to local storage
    const { setPref, setSourcePref } = await import('../prefs');
    const mapping: Array<[string, string, 'string' | 'number' | 'boolean']> = [
      ['theme', 'theme', 'string'],
      ['accent_color', 'accentColor', 'string'],
      ['sync_interval', 'syncInterval', 'number'],
      ['sync_on_startup', 'syncOnStartup', 'boolean'],
      ['auto_sync', 'autoSync', 'boolean'],
      ['chat_model', 'chatModel', 'string'],
      ['chat_max_chunks', 'chatMaxChunks', 'number'],
      ['chat_related_max', 'chatRelatedMax', 'number'],
      ['chat_related_min_label', 'chatRelatedMinLabel', 'string'],
      ['item_pane_height', 'itemPaneHeight', 'number'],
      ['discovery_score_mode', 'discoveryScoreMode', 'string'],
      ['discovery_min_score', 'discoveryMinScore', 'number'],
      ['discovery_top_k', 'discoveryTopK', 'number'],
      ['list_page_size', 'listPageSize', 'number'],
      ['cache_ttl_minutes', 'cacheTtlMinutes', 'number'],
      ['discovery_font_size', 'discoveryFontSize', 'number'],
      ['discovery_text_color', 'discoveryTextColor', 'string'],
      ['auto_cascade_delete', 'autoCascadeDelete', 'boolean'],
    ];

    for (const [serverKey, localKey, type] of mapping) {
      const val = prefs[serverKey];
      if (val === undefined || val === null) continue;
      if (type === 'number' && typeof val === 'number') setPref(localKey as any, val as any);
      else if (type === 'boolean' && typeof val === 'boolean') setPref(localKey as any, val as any);
      else if (type === 'string' && typeof val === 'string') setPref(localKey as any, val as any);
    }

    // Discovery sources
    const sources = prefs.discovery_sources;
    if (sources && typeof sources === 'object') {
      for (const [key, enabled] of Object.entries(sources as Record<string, boolean>)) {
        setSourcePref(key, Boolean(enabled));
      }
    }
  } catch (err) {
    console.warn('[Scholar Companion] Failed to load preferences from server:', err);
  }
}
