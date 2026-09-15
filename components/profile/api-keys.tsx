"use client";

// Profile -> API keys. The developer-facing half of the platform: keys created
// here authenticate POST /v1/videos (see components/docs/api-docs.tsx), spend
// the account's credit balance, and can be disabled or deleted at any time.
//
// The website's own key ("fluxion-web", minted by lib/hub.ts) is deliberately
// not listed: it is an implementation detail of the playground.

import { useEffect, useState } from "react";
import { Copy, Check, Eye } from "lucide-react";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  revealApiKey,
  setApiKeyEnabled,
  type ApiKeyRow,
} from "@/lib/hub";
import { formatWhen } from "@/lib/generations";
import { toast } from "@/lib/toast";

const STATUS: Record<number, string> = { 1: "Active", 2: "Disabled", 3: "Expired", 4: "Out of credits" };

const inputClass =
  "w-full rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg outline-none focus:border-blue focus:ring-1 focus:ring-blue";
const btnPrimary = "rounded-none bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-50";
const cellAction = "rounded-none border border-hairline-strong px-2.5 py-1.5 text-xs text-fg transition-colors hover:bg-hover disabled:opacity-40";

function message(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.";
}

/** The secret, shown once after creation. Copying it is the only thing to do here. */
function NewKey({ name, secret, onDone }: { name: string; secret: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(secret).then(() => {
      setCopied(true);
      toast("Key copied");
    });
  }
  return (
    <div className="border border-accent bg-accent-soft/40 p-4">
      <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-accent-ink">
        {name} created
      </p>
      <p className="mt-1 text-sm text-muted">
        Copy it now. You can read it again from this page, but treat it like a password: it spends your credits.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap border border-line-strong bg-raised px-3 py-2 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
          {secret}
        </code>
        <button type="button" onClick={copy} className={btnPrimary}>
          {copied ? <Check size={15} strokeWidth={2} className="inline" /> : <Copy size={15} strokeWidth={1.8} className="inline" />}
          <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
        </button>
        <button type="button" onClick={onDone} className="px-3 py-2 text-sm text-muted transition-colors hover:text-fg">
          Done
        </button>
      </div>
    </div>
  );
}

export function ApiKeys() {
  const [rows, setRows] = useState<ApiKeyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<{ name: string; secret: string } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  function load() {
    return listApiKeys()
      .then((list) => {
        setRows(list);
        setError(null);
      })
      .catch((e) => {
        setRows([]);
        setError(message(e));
      });
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (creating) return;
    setCreating(true);
    try {
      const { row, secret } = await createApiKey(name);
      setFresh({ name: row.name, secret });
      setName("");
      await load();
    } catch (e) {
      toast(message(e));
    } finally {
      setCreating(false);
    }
  }

  async function act(id: number, fn: () => Promise<unknown>, done: string) {
    setBusy(id);
    try {
      await fn();
      await load();
      toast(done);
    } catch (e) {
      toast(message(e));
    } finally {
      setBusy(null);
    }
  }

  async function copyKey(row: ApiKeyRow) {
    setBusy(row.id);
    try {
      const secret = await revealApiKey(row.id);
      await navigator.clipboard?.writeText(secret);
      toast("Key copied");
    } catch (e) {
      toast(message(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">API keys</h2>
        <p className="mt-2 text-sm text-muted">
          Call the models from your own code with a bearer key. We generate the key; it spends the
          same balance as the playground. See the{" "}
          <a href="/docs#quickstart" className="text-blue hover:text-gold-soft">quickstart</a> for the request shape.
        </p>
      </div>

      {fresh && <NewKey name={fresh.name} secret={fresh.secret} onDone={() => setFresh(null)} />}

      {/* The key itself is generated by the platform; the name is only a label,
          so the button needs nothing typed. A label can be given if you want
          one, and a duplicate is renamed rather than refused. */}
      <div className="flex flex-wrap items-end gap-3">
        <button type="button" onClick={() => void create()} disabled={creating} className={btnPrimary}>
          {creating ? "Creating…" : "Create a key"}
        </button>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="key-name" className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">
            Label <span className="text-dim">(optional)</span>
          </label>
          <input
            id="key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void create();
            }}
            placeholder="production"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="border border-hairline p-6 text-sm text-muted">
            No keys yet. Create one above to call the API from your own code.
        </p>
      ) : (
        <div className="overflow-x-auto border border-line-strong">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-muted">
              <tr className="border-b border-line-strong">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5">Last used</th>
                <th className="px-4 py-2.5">Spent</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-hairline align-middle last:border-0">
                  <td className="px-4 py-3 text-fg">{row.name}</td>
                  <td className="px-4 py-3 font-[family-name:var(--font-jetbrains)] text-xs text-muted">{row.masked}</td>
                  <td className="px-4 py-3 text-muted">{row.createdAt ? formatWhen(row.createdAt) : "—"}</td>
                  <td className="px-4 py-3 text-muted">{row.lastUsedAt ? formatWhen(row.lastUsedAt) : "Never"}</td>
                  <td className="px-4 py-3 text-muted">${row.spentUsd.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={row.status === 1 ? "text-accent-ink" : "text-dim"}>{STATUS[row.status] ?? "Unknown"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void copyKey(row)}
                        disabled={busy === row.id}
                        title="Copy the full key"
                        className={cellAction}
                      >
                        <Eye size={13} strokeWidth={1.8} className="mr-1 inline" />
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void act(row.id, () => setApiKeyEnabled(row.id, row.status !== 1), row.status === 1 ? "Key disabled" : "Key enabled")
                        }
                        disabled={busy === row.id || (row.status !== 1 && row.status !== 2)}
                        className={cellAction}
                      >
                        {row.status === 1 ? "Disable" : "Enable"}
                      </button>
                      {confirmDelete === row.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void act(row.id, () => deleteApiKey(row.id), "Key deleted").then(() => setConfirmDelete(null))
                            }
                            disabled={busy === row.id}
                            className="rounded-none border border-[rgba(255,107,107,0.5)] px-2.5 py-1.5 text-xs text-danger transition-colors hover:bg-[rgba(255,107,107,0.08)]"
                          >
                            Delete for good
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(null)} className="text-xs text-muted hover:text-fg">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(row.id)}
                          disabled={busy === row.id}
                          className="rounded-none border border-[rgba(255,107,107,0.4)] px-2.5 py-1.5 text-xs text-danger transition-colors hover:bg-[rgba(255,107,107,0.08)]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-dim">
        A deleted key stops working immediately, and anything already generated with it stays in your library.
      </p>
    </div>
  );
}
