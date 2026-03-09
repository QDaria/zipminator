/**
 * PasswordVault.tsx
 *
 * Password manager UI.  Displays saved credentials, allows search/filter,
 * add/edit/delete, password generation, and master password change.
 *
 * The vault is PQC-encrypted (AES-256-GCM + ML-KEM-768) on disk.
 * All decryption happens in the Tauri backend; we only pass plain data
 * to/from the Rust side over the secure IPC bridge.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { invoke } from "@tauri-apps/api/core";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PasswordEntry {
  id: string;
  domain: string;
  username: string;
  created_at: number;
  updated_at: number;
  has_totp: boolean;
}

interface PlainEntry {
  domain: string;
  username: string;
  password: string;
  notes?: string;
  totp_secret?: string;
}

type VaultState = "locked" | "needs_create" | "unlocked";

// ── Sub-components ─────────────────────────────────────────────────────────────

function StrengthMeter({ password }: { password: string }) {
  const score = measureStrength(password);
  const labels = ["None", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-gray-600",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  if (!password) return null;

  return (
    <div className="mt-1">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full ${
              i <= score ? colors[score] : "bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1">{labels[score]}</p>
    </div>
  );
}

function EntryRow({
  entry,
  onView,
  onDelete,
}: {
  entry: PasswordEntry;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center py-3 border-b border-gray-700 last:border-0 group">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{entry.domain}</span>
          {entry.has_totp && (
            <span className="text-xs bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded">
              2FA
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 truncate">{entry.username}</p>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onView(entry.id)}
          className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-gray-700"
        >
          View
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Unlock / Create panel ──────────────────────────────────────────────────────

function UnlockPanel({
  vaultState,
  onUnlocked,
}: {
  vaultState: "locked" | "needs_create";
  onUnlocked: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isCreate = vaultState === "needs_create";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isCreate && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Master password must be at least 12 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isCreate) {
        await invoke("vault_create", { masterPassword: password });
      } else {
        await invoke("vault_unlock", { masterPassword: password });
      }
      setPassword("");
      setConfirm("");
      onUnlocked();
    } catch (e) {
      setError(isCreate ? "Failed to create vault." : "Incorrect password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🔒</div>
        <h3 className="font-semibold text-white">
          {isCreate ? "Create Password Vault" : "Unlock Password Vault"}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {isCreate
            ? "Your vault is encrypted with Argon2id + AES-256-GCM + ML-KEM-768."
            : "Enter your master password to access saved credentials."}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Master password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          autoComplete="new-password"
          required
        />
        {isCreate && (
          <input
            type="password"
            placeholder="Confirm master password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            autoComplete="new-password"
            required
          />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Please wait..." : isCreate ? "Create Vault" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

// ── Add entry form ─────────────────────────────────────────────────────────────

function AddEntryForm({
  onAdded,
  onCancel,
}: {
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePassword = async () => {
    try {
      const pw = await invoke<string>("vault_generate_password", { length: 24 });
      setPassword(pw);
    } catch (e) {
      setError("Failed to generate password.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await invoke("vault_add_entry", {
        domain,
        username,
        password,
        notes: notes || undefined,
      });
      onAdded();
    } catch (e) {
      setError("Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-medium text-white">Add Password</h3>
      <input
        type="text"
        placeholder="Domain (e.g. github.com)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
        required
      />
      <input
        type="text"
        placeholder="Username or email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
        required
      />
      <div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            required
          />
          <button
            type="button"
            onClick={generatePassword}
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-2 rounded-lg"
          >
            Generate
          </button>
        </div>
        <StrengthMeter password={password} />
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white text-sm font-medium py-2 rounded-lg"
        >
          {loading ? "Saving..." : "Save Password"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PasswordVault() {
  const [vaultState, setVaultState] = useState<VaultState>("locked");
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkState = useCallback(async () => {
    try {
      const state = await invoke<VaultState>("vault_get_state");
      setVaultState(state);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const list = await invoke<PasswordEntry[]>("vault_list_entries");
      setEntries(list);
    } catch (e) {
      // Vault may be locked.
    }
  }, []);

  useEffect(() => {
    checkState();
  }, [checkState]);

  useEffect(() => {
    if (vaultState === "unlocked") {
      loadEntries();
    }
  }, [vaultState, loadEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this password entry?")) return;
    try {
      await invoke("vault_delete_entry", { id });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleView = async (id: string) => {
    try {
      const entry = await invoke<{ domain: string; username: string; password: string; notes?: string }>(
        "vault_get_entry",
        { id }
      );
      alert(
        `Domain: ${entry.domain}\nUsername: ${entry.username}\nPassword: ${entry.password}${
          entry.notes ? `\nNotes: ${entry.notes}` : ""
        }`
      );
    } catch (e) {
      setError(String(e));
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.domain.includes(search) ||
      e.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        Loading vault...
      </div>
    );
  }

  if (vaultState === "locked" || vaultState === "needs_create") {
    return (
      <div className="p-6">
        <UnlockPanel
          vaultState={vaultState}
          onUnlocked={() => setVaultState("unlocked")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-white max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Password Vault</h2>
        <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
          PQC-encrypted
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {adding ? (
        <AddEntryForm
          onAdded={() => {
            setAdding(false);
            loadEntries();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by domain or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => setAdding(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
            >
              Add
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {search ? "No matching passwords" : "No saved passwords yet"}
              </div>
            ) : (
              <div className="divide-y divide-gray-700 px-4">
                {filtered.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onView={handleView}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{entries.length} saved passwords</span>
            <button
              onClick={() => invoke("vault_lock").then(() => setVaultState("locked"))}
              className="text-gray-400 hover:text-white"
            >
              Lock vault
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function measureStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}
