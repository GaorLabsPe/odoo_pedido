import { useState, useEffect, useCallback } from "react";
import {
  Database, ShoppingCart, MessageSquare, RefreshCw, Zap, Settings,
  ChevronRight, Wifi, Package, Users, BarChart3, Eye, EyeOff,
  X, Save, ExternalLink, ArrowUpRight, Minus, Play, Pause,
  Terminal, LogOut, Lock, User, CheckCircle, Clock, AlertTriangle
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Status = "ok" | "error" | "warning" | "pending" | "unknown";
interface ServiceStatus { status: Status; latency?: number; message?: string; }
interface OdooStats { products: number; partners: number; pending: number; confirmed: number; is_demo: boolean; is_connected: boolean; }
interface Order { id: string; partner_nombre: string; total: number; estado: string; created_at: string; odoo_order_ref?: string; }
interface LogEntry { id: string; time: string; type: "info" | "success" | "error" | "warning"; service: string; message: string; }
interface Config { odooUrl: string; odooDB: string; odooUser: string; odooPassword: string; odooCompanyId: number; n8nUrl: string; evolutionUrl: string; evolutionInstance: string; evolutionKey: string; }

const ADMIN_PASSWORD = "admin123";
const DEFAULT_CONFIG: Config = { odooUrl: "", odooDB: "", odooUser: "", odooPassword: "", odooCompanyId: 1, n8nUrl: "https://n8n.red51.site", evolutionUrl: "https://api.red51.site", evolutionInstance: "olivia", evolutionKey: "" };
const DEMO_ORDERS: Order[] = [
  { id: "1", partner_nombre: "Distribuidora Norte SAC", total: 1840.00, estado: "confirmed", created_at: new Date(Date.now() - 600000).toISOString(), odoo_order_ref: "S/0041" },
  { id: "2", partner_nombre: "Bodega Los Andes", total: 320.50, estado: "pending", created_at: new Date(Date.now() - 120000).toISOString() },
  { id: "3", partner_nombre: "Supermercado El Sol", total: 5200.00, estado: "confirmed", created_at: new Date(Date.now() - 3600000).toISOString(), odoo_order_ref: "S/0040" },
  { id: "4", partner_nombre: "Minimarket La Esquina", total: 890.75, estado: "processing", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "5", partner_nombre: "Ferretería Central", total: 2100.00, estado: "error", created_at: new Date(Date.now() - 10800000).toISOString() },
];
const ESTADO: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: "#15803d", bg: "#dcfce7", label: "Confirmado" },
  pending:   { color: "#b45309", bg: "#fef3c7", label: "Pendiente" },
  processing:{ color: "#1d4ed8", bg: "#dbeafe", label: "Procesando" },
  error:     { color: "#dc2626", bg: "#fee2e2", label: "Error" },
};
const SVC: Record<Status, { text: string; bg: string; border: string }> = {
  ok:      { text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  error:   { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  warning: { text: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  pending: { text: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  unknown: { text: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};
function timeAgo(iso: string) { const d = Date.now() - new Date(iso).getTime(); if (d < 60000) return `${Math.floor(d / 1000)}s`; if (d < 3600000) return `${Math.floor(d / 60000)}m`; return `${Math.floor(d / 3600000)}h`; }
function addLog(logs: LogEntry[], type: LogEntry["type"], service: string, message: string): LogEntry[] { return [{ id: Math.random().toString(36).slice(2), time: new Date().toLocaleTimeString("es-PE"), type, service, message }, ...logs].slice(0, 100); }

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState(""); const [show, setShow] = useState(false); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false); const [shake, setShake] = useState(false);
  const submit = () => { setLoading(true); setTimeout(() => { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem("of_auth", "1"); onLogin(); } else { setErr("Contraseña incorrecta"); setShake(true); setTimeout(() => setShake(false), 500); setPw(""); } setLoading(false); }, 700); };
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}input:focus{outline:none;border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.15)!important}`}</style>

      {/* Left panel */}
      <div style={{ width: "45%", background: "linear-gradient(150deg,#4c1d95 0%,#6d28d9 50%,#7c3aed 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ animation: "fadeUp .6s ease both", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.25)" }}><Zap size={26} color="white" fill="white" /></div>
            <div><div style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>OrderFlow</div><div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Hub de gestión</div></div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "white", lineHeight: 1.25, marginBottom: 18, letterSpacing: "-0.02em" }}>Conecta Odoo,<br />WhatsApp y n8n.</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.55)", lineHeight: 1.75, marginBottom: 44 }}>Gestiona pedidos en tiempo real, monitorea tu infraestructura y mantén todo sincronizado automáticamente.</div>
          {[{ icon: Database, t: "Sincronización XML-RPC con Odoo 17" }, { icon: MessageSquare, t: "WhatsApp via Evolution API · olivia" }, { icon: Zap, t: "Automatización con n8n workflows" }].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, animation: `fadeUp .6s ${.12 * (i + 1)}s ease both`, opacity: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><f.icon size={15} color="rgba(255,255,255,.8)" /></div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.65)", fontWeight: 600 }}>{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp .5s .1s ease both", opacity: 0 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#1e1b4b", letterSpacing: "-0.02em", marginBottom: 6 }}>Iniciar sesión</div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>Panel de administración OrderFlow</div>
          </div>
          <div style={{ animation: shake ? "shake .4s ease" : "none" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, display: "block" }}>Usuario</label>
              <div style={{ position: "relative" }}><User size={15} color="#d1d5db" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} /><input readOnly value="admin" style={{ width: "100%", padding: "11px 13px 11px 40px", background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#9ca3af", fontFamily: "inherit" }} /></div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, display: "block" }}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#d1d5db" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
                <input type={show ? "text" : "password"} value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && pw && submit()} placeholder="••••••••••" style={{ width: "100%", padding: "11px 40px 11px 40px", background: "white", border: `1.5px solid ${err ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 9, fontSize: 13, color: "#1f2937", fontFamily: "inherit", transition: "border-color .15s" }} />
                <button onClick={() => setShow(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {err && <div style={{ marginTop: 7, fontSize: 12, color: "#dc2626", display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={12} />{err}</div>}
            </div>
            <button onClick={submit} disabled={loading || !pw} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: loading || !pw ? "not-allowed" : "pointer", background: !pw ? "#e5e7eb" : "linear-gradient(135deg,#7c3aed,#6d28d9)", color: !pw ? "#9ca3af" : "white", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: !pw ? "none" : "0 4px 14px rgba(109,40,217,.3)", transition: "all .2s" }}>
              {loading ? <><RefreshCw size={15} style={{ animation: "spin .8s linear infinite" }} />Verificando...</> : "Ingresar al sistema"}
            </button>
          </div>
          <div style={{ marginTop: 28, padding: 14, background: "#f5f3ff", borderRadius: 10, border: "1px solid #ede9fe" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", marginBottom: 3 }}>Acceso demo</div>
            <div style={{ fontSize: 12, color: "#8b5cf6" }}>Usuario: <strong>admin</strong> · Contraseña: <strong>admin123</strong></div>
          </div>
          <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#9ca3af" }}>© 2024 OrderFlow · GaorSystem Perú</div>
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }: { icon: any; label: string; value: any; sub?: string; color: string; trend?: "up" | "down" | "flat" }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "20px 22px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "box-shadow .2s,transform .2s", cursor: "default" }} onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={20} color={color} /></div>
        {trend && <div style={{ fontSize: 11, fontWeight: 800, color: trend === "up" ? "#15803d" : trend === "down" ? "#dc2626" : "#9ca3af", display: "flex", alignItems: "center" }}>{trend === "up" ? <ArrowUpRight size={15} /> : trend === "flat" ? <Minus size={15} /> : <ArrowUpRight size={15} style={{ transform: "rotate(90deg)" }} />}</div>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#111827", lineHeight: 1, marginBottom: 5 }}>{typeof value === "number" ? value.toLocaleString("es-PE") : value}</div>
      <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard({ name, icon: Icon, status, url, onTest }: { name: string; icon: any; status: ServiceStatus; url?: string; onTest?: () => void }) {
  const c = SVC[status.status];
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} color={c.text} /></div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{name}</div>{url && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{url}</div>}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {status.latency && <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{status.latency}ms</span>}
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: c.bg, color: c.text, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: ".05em" }}>{status.status}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{status.message || "Sin verificar"}</span>
        <button onClick={onTest} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: "#7c3aed", borderRadius: 7, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={11} />Test</button>
      </div>
    </div>
  );
}

// ─── ORDER ROW ────────────────────────────────────────────────────────────────
function OrderRow({ o }: { o: Order }) {
  const e = ESTADO[o.estado] || { color: "#6b7280", bg: "#f3f4f6", label: o.estado };
  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }} onMouseEnter={ev => (ev.currentTarget.style.background = "#fafafa")} onMouseLeave={ev => (ev.currentTarget.style.background = "white")}>
      <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{o.partner_nombre}</div><div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>hace {timeAgo(o.created_at)}</div></td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", fontFamily: "monospace" }}>{o.odoo_order_ref || <span style={{ color: "#e5e7eb" }}>—</span>}</td>
      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "#111827" }}>S/ {o.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
      <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: e.bg, color: e.color, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: e.color }} />{e.label}</span></td>
    </tr>
  );
}

// ─── CONFIG MODAL ─────────────────────────────────────────────────────────────
function ConfigModal({ config, onSave, onClose }: { config: Config; onSave: (c: Config) => void; onClose: () => void }) {
  const [local, setLocal] = useState(config); const [showPw, setShowPw] = useState(false); const [saving, setSaving] = useState(false); const [err, setErr] = useState(""); const [tab, setTab] = useState<"odoo" | "n8n" | "evolution">("odoo");
  const set = (k: keyof Config, v: any) => setLocal(p => ({ ...p, [k]: v }));
  const save = async () => { setSaving(true); setErr(""); try { const r = await fetch("/api/odoo/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: local.odooUrl, db: local.odooDB, username: local.odooUser, password: local.odooPassword, companyId: local.odooCompanyId }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); onSave(local); onClose(); } catch (e: any) { setErr(e.message); } finally { setSaving(false); } };
  const inp: React.CSSProperties = { width: "100%", padding: "10px 13px", background: "white", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, color: "#1f2937", fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6, display: "block" };
  const tabs = [{ id: "odoo", label: "Odoo 17", icon: Database }, { id: "n8n", label: "n8n", icon: Zap }, { id: "evolution", label: "Evolution", icon: MessageSquare }] as const;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Settings size={17} color="#7c3aed" /></div>
            <div><div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Configuración de servicios</div><div style={{ fontSize: 11, color: "#9ca3af" }}>Conecta tu infraestructura</div></div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color="#6b7280" /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
          {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 8px", border: "none", cursor: "pointer", background: "none", fontSize: 12, fontWeight: 800, color: tab === t.id ? "#7c3aed" : "#9ca3af", borderBottom: `2px solid ${tab === t.id ? "#7c3aed" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><t.icon size={13} />{t.label}</button>)}
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "odoo" && <>
            <div><label style={lbl}>URL de Odoo</label><input style={inp} value={local.odooUrl} onChange={e => set("odooUrl", e.target.value)} placeholder="https://tu-odoo.com" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={lbl}>Base de datos</label><input style={inp} value={local.odooDB} onChange={e => set("odooDB", e.target.value)} placeholder="nombre_db" /></div>
              <div><label style={lbl}>Compañía ID</label><input style={inp} type="number" value={local.odooCompanyId} onChange={e => set("odooCompanyId", parseInt(e.target.value))} /></div>
            </div>
            <div><label style={lbl}>Usuario</label><input style={inp} value={local.odooUser} onChange={e => set("odooUser", e.target.value)} placeholder="admin@empresa.com" /></div>
            <div><label style={lbl}>Contraseña</label>
              <div style={{ position: "relative" }}><input style={{ ...inp, paddingRight: 38 }} type={showPw ? "text" : "password"} value={local.odooPassword} onChange={e => set("odooPassword", e.target.value)} /><button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showPw ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}</button></div>
            </div>
          </>}
          {tab === "n8n" && <>
            <div><label style={lbl}>URL de n8n</label><input style={inp} value={local.n8nUrl} onChange={e => set("n8nUrl", e.target.value)} /></div>
            <div style={{ padding: 14, background: "#f5f3ff", borderRadius: 9, border: "1px solid #ede9fe", fontSize: 12, color: "#7c3aed", lineHeight: 1.65 }}>El dashboard verifica <code>/healthz</code> para detectar si n8n está activo y respondiendo.</div>
            <a href={local.n8nUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#7c3aed", fontSize: 13, fontWeight: 700, textDecoration: "none" }}><ExternalLink size={13} />Abrir n8n →</a>
          </>}
          {tab === "evolution" && <>
            <div><label style={lbl}>URL base</label><input style={inp} value={local.evolutionUrl} onChange={e => set("evolutionUrl", e.target.value)} /></div>
            <div><label style={lbl}>Instancia</label><input style={inp} value={local.evolutionInstance} onChange={e => set("evolutionInstance", e.target.value)} /></div>
            <div><label style={lbl}>API Key</label>
              <div style={{ position: "relative" }}><input style={{ ...inp, paddingRight: 38 }} type={showPw ? "text" : "password"} value={local.evolutionKey} onChange={e => set("evolutionKey", e.target.value)} placeholder="••••••••••••" /><button onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showPw ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}</button></div>
            </div>
          </>}
          {err && <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, color: "#dc2626", fontSize: 13 }}>{err}</div>}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: "white", border: "1.5px solid #e5e7eb", borderRadius: 9, color: "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: 10, background: saving ? "#e5e7eb" : "#7c3aed", border: "none", borderRadius: 9, color: saving ? "#9ca3af" : "white", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: saving ? "none" : "0 4px 12px rgba(124,58,237,.25)" }}>
            {saving ? <><RefreshCw size={14} style={{ animation: "spin .8s linear infinite" }} />Conectando...</> : <><Save size={14} />Guardar conexión</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [cfg, setCfg] = useState<Config>(() => { try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem("of_config") || "{}") }; } catch { return DEFAULT_CONFIG; } });
  const [showCfg, setShowCfg] = useState(false);
  const [tab, setTab] = useState<"overview" | "orders" | "services" | "logs">("overview");
  const [stats, setStats] = useState<OdooStats>({ products: 0, partners: 0, pending: 0, confirmed: 0, is_demo: true, is_connected: false });
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [auto, setAuto] = useState(true);
  const [lastR, setLastR] = useState<Date | null>(null);
  const [svc, setSvc] = useState<Record<string, ServiceStatus>>({ odoo: { status: "unknown" }, n8n: { status: "unknown" }, evolution: { status: "unknown" }, supabase: { status: "unknown" } });
  const log = useCallback((type: LogEntry["type"], service: string, message: string) => setLogs(p => addLog(p, type, service, message)), []);

  const testOdoo = useCallback(async () => {
    setSvc(p => ({ ...p, odoo: { status: "pending", message: "Conectando..." } })); log("info", "Odoo", "Verificando...");
    const t = Date.now(); try { const r = await fetch("/api/odoo/stats"); const d = await r.json(); if (d.error) throw new Error(d.error); setStats({ ...d, is_connected: !d.is_demo }); setSvc(p => ({ ...p, odoo: { status: d.is_demo ? "warning" : "ok", latency: Date.now() - t, message: d.is_demo ? "Modo demo — configura credenciales" : `${d.products} productos · ${d.partners} clientes` } })); log(d.is_demo ? "warning" : "success", "Odoo", d.is_demo ? "Modo demo activo" : `OK — ${d.products} productos`); } catch (e: any) { setSvc(p => ({ ...p, odoo: { status: "error", message: e.message } })); log("error", "Odoo", e.message); }
  }, [log]);

  const testN8n = useCallback(async () => {
    setSvc(p => ({ ...p, n8n: { status: "pending", message: "Verificando..." } })); const t = Date.now();
    try { const r = await fetch(`${cfg.n8nUrl}/healthz`, { signal: AbortSignal.timeout(8000) }); setSvc(p => ({ ...p, n8n: { status: r.ok ? "ok" : "warning", latency: Date.now() - t, message: r.ok ? "n8n activo" : `HTTP ${r.status}` } })); log(r.ok ? "success" : "warning", "n8n", r.ok ? `OK ${Date.now() - t}ms` : `HTTP ${r.status}`); } catch { setSvc(p => ({ ...p, n8n: { status: "warning", message: "No accesible desde browser" } })); log("warning", "n8n", "Verifica CORS o acceso público"); }
  }, [cfg.n8nUrl, log]);

  const testEvo = useCallback(async () => {
    setSvc(p => ({ ...p, evolution: { status: "pending", message: "Verificando instancia..." } })); const t = Date.now();
    try { const h: Record<string, string> = { "Content-Type": "application/json" }; if (cfg.evolutionKey) h["apikey"] = cfg.evolutionKey; const r = await fetch(`${cfg.evolutionUrl}/instance/fetchInstances`, { headers: h, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(`HTTP ${r.status}`); const d = await r.json(); const inst = (Array.isArray(d) ? d : []).find((i: any) => i.instance?.instanceName === cfg.evolutionInstance); const ok = inst?.instance?.state === "open"; setSvc(p => ({ ...p, evolution: { status: ok ? "ok" : "warning", latency: Date.now() - t, message: ok ? `${cfg.evolutionInstance} conectada ✓` : "Instancia desconectada" } })); log(ok ? "success" : "warning", "Evolution", ok ? `WhatsApp OK (${cfg.evolutionInstance})` : "No conectada"); } catch (e: any) { setSvc(p => ({ ...p, evolution: { status: "error", message: e.message } })); log("error", "Evolution", e.message); }
  }, [cfg.evolutionUrl, cfg.evolutionInstance, cfg.evolutionKey, log]);

  const testSupa = useCallback(async () => {
    setSvc(p => ({ ...p, supabase: { status: "pending", message: "Verificando..." } })); const t = Date.now();
    try { const r = await fetch("/api/stats"); if (!r.ok) throw new Error(`HTTP ${r.status}`); const d = await r.json(); setSvc(p => ({ ...p, supabase: { status: "ok", latency: Date.now() - t, message: `${d.active_sessions || 0} sesiones · ${d.pending_orders || 0} pendientes` } })); log("success", "Supabase", `OK — ${Date.now() - t}ms`); } catch (e: any) { setSvc(p => ({ ...p, supabase: { status: "error", message: e.message } })); log("error", "Supabase", e.message); }
  }, [log]);

  const fetchOrders = useCallback(async () => { try { const r = await fetch("/api/recent-orders"); const d = await r.json(); if (Array.isArray(d) && d.length) setOrders(d); } catch (_) {} }, []);
  const refreshAll = useCallback(async () => { setLastR(new Date()); await Promise.allSettled([testOdoo(), testN8n(), testEvo(), testSupa(), fetchOrders()]); }, [testOdoo, testN8n, testEvo, testSupa, fetchOrders]);

  useEffect(() => { refreshAll(); }, []);
  useEffect(() => { if (!auto) return; const id = setInterval(refreshAll, 60000); return () => clearInterval(id); }, [auto, refreshAll]);
  const saveCfg = (c: Config) => { setCfg(c); localStorage.setItem("of_config", JSON.stringify(c)); log("info", "Config", "Configuración guardada"); setTimeout(refreshAll, 500); };
  const okCount = Object.values(svc).filter(s => s.status === "ok").length;

  const navTabs = [{ id: "overview", label: "Panel principal", icon: BarChart3 }, { id: "orders", label: "Pedidos", icon: ShoppingCart }, { id: "services", label: "Servicios", icon: Wifi }, { id: "logs", label: "Logs", icon: Terminal }] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}input:focus{outline:none;border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.12)!important}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}`}</style>

      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={17} color="white" fill="white" /></div>
            <div><div style={{ fontSize: 15, fontWeight: 900, color: "#1e1b4b", letterSpacing: "-0.02em" }}>OrderFlow</div><div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Hub de gestión</div></div>
            <div style={{ width: 1, height: 26, background: "#e5e7eb", margin: "0 8px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: okCount === 4 ? "#f0fdf4" : "#fffbeb", border: `1px solid ${okCount === 4 ? "#bbf7d0" : "#fde68a"}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: okCount === 4 ? "#22c55e" : "#f59e0b", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: okCount === 4 ? "#15803d" : "#b45309" }}>{okCount}/4 servicios activos</span>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 2 }}>
            {navTabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800, background: tab === t.id ? "#f5f3ff" : "transparent", color: tab === t.id ? "#7c3aed" : "#6b7280", transition: "all .15s" }}><t.icon size={13} />{t.label}</button>)}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastR && <span style={{ fontSize: 11, color: "#9ca3af" }}>{lastR.toLocaleTimeString("es-PE")}</span>}
            <button onClick={() => setAuto(p => !p)} style={{ background: auto ? "#f0fdf4" : "#f3f4f6", border: `1px solid ${auto ? "#bbf7d0" : "#e5e7eb"}`, color: auto ? "#15803d" : "#6b7280", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{auto ? <Play size={13} /> : <Pause size={13} />}</button>
            <button onClick={refreshAll} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#6b7280", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><RefreshCw size={13} /></button>
            <button onClick={() => setShowCfg(true)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: "#7c3aed", borderRadius: 8, height: 32, padding: "0 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 800 }}><Settings size={13} />Configurar</button>
            <button onClick={onLogout} title="Cerrar sesión" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><LogOut size={13} /></button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>

        {/* OVERVIEW */}
        {tab === "overview" && <div style={{ animation: "fadeIn .3s ease" }}>
          {stats.is_demo && <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#b45309", fontWeight: 600 }}><AlertTriangle size={16} color="#f59e0b" /><span><strong>Modo demo:</strong> Haz clic en <strong>Configurar</strong> para conectar con tu Odoo real.</span></div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            <StatCard icon={Package} label="Productos en Odoo" value={stats.products} sub={stats.is_demo ? "demo" : "en catálogo"} color="#7c3aed" trend="up" />
            <StatCard icon={Users} label="Clientes" value={stats.partners} sub="registrados" color="#2563eb" />
            <StatCard icon={Clock} label="Pedidos pendientes" value={stats.pending} sub="por procesar" color="#f59e0b" trend={stats.pending > 0 ? "up" : "flat"} />
            <StatCard icon={CheckCircle} label="Confirmados" value={stats.confirmed} sub="sincronizados con Odoo" color="#22c55e" trend="up" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Pedidos recientes</span>
                <button onClick={() => setTab("orders")} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Ver todos <ChevronRight size={13} /></button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#fafafa" }}>{["Cliente", "Ref. Odoo", "Total", "Estado"].map(h => <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</th>)}</tr></thead>
                <tbody>{orders.slice(0, 5).map(o => <OrderRow key={o.id} o={o} />)}</tbody>
              </table>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ServiceCard name="Odoo 17 (XML-RPC)" icon={Database} status={svc.odoo} url={cfg.odooUrl || "Sin configurar"} onTest={testOdoo} />
              <ServiceCard name="n8n Workflows" icon={Zap} status={svc.n8n} url={cfg.n8nUrl} onTest={testN8n} />
              <ServiceCard name="Evolution API" icon={MessageSquare} status={svc.evolution} url={`${cfg.evolutionUrl} · ${cfg.evolutionInstance}`} onTest={testEvo} />
              <ServiceCard name="Supabase DB" icon={Database} status={svc.supabase} url="Base de datos central" onTest={testSupa} />
            </div>
          </div>
        </div>}

        {/* ORDERS */}
        {tab === "orders" && <div style={{ animation: "fadeIn .3s ease" }}>
          <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["pending","confirmed","processing","error"].map(e => { const st = ESTADO[e]; return <span key={e} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: st.bg, color: st.color, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color }} />{orders.filter(o => o.estado === e).length} {st.label}</span>; })}
          </div>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6" }}><span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Cola de pedidos</span></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#fafafa" }}>{["Cliente","Ref. Odoo","Total","Estado"].map(h => <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</th>)}</tr></thead>
              <tbody>{orders.length === 0 ? <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Sin pedidos registrados</td></tr> : orders.map(o => <OrderRow key={o.id} o={o} />)}</tbody>
            </table>
          </div>
        </div>}

        {/* SERVICES */}
        {tab === "services" && <div style={{ animation: "fadeIn .3s ease", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <ServiceCard name="Odoo 17 (XML-RPC)" icon={Database} status={svc.odoo} url={cfg.odooUrl || "Sin configurar"} onTest={testOdoo} />
          <ServiceCard name="n8n Workflows" icon={Zap} status={svc.n8n} url={cfg.n8nUrl} onTest={testN8n} />
          <ServiceCard name="Evolution API (WhatsApp)" icon={MessageSquare} status={svc.evolution} url={`${cfg.evolutionUrl} · instancia: ${cfg.evolutionInstance}`} onTest={testEvo} />
          <ServiceCard name="Supabase DB" icon={Database} status={svc.supabase} url="Hub de datos central" onTest={testSupa} />
          <div style={{ gridColumn: "1/-1", background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={20} color="#f97316" /></div>
              <div><div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Editor de workflows — n8n</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{cfg.n8nUrl}</div></div>
            </div>
            <a href={cfg.n8nUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#fff7ed", border: "1px solid #fed7aa", color: "#f97316", borderRadius: 9, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Abrir n8n <ExternalLink size={13} /></a>
          </div>
        </div>}

        {/* LOGS */}
        {tab === "logs" && <div style={{ animation: "fadeIn .3s ease" }}>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e1b4b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Terminal size={15} color="#a78bfa" /><span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Consola de actividad</span><span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(167,139,250,.2)", borderRadius: 10, color: "#a78bfa", fontWeight: 700 }}>{logs.length}</span></div>
              <button onClick={() => setLogs([])} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", borderRadius: 7, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Limpiar</button>
            </div>
            <div style={{ background: "#0d1117", padding: "16px 20px", minHeight: 400, maxHeight: 520, overflowY: "auto", fontFamily: "monospace" }}>
              {logs.length === 0 ? <div style={{ color: "#4b5563", fontSize: 13 }}>$ Esperando actividad del sistema...</div> : logs.map(l => { const lc = { info: "#64748b", success: "#22c55e", error: "#ef4444", warning: "#f59e0b" }[l.type]; return <div key={l.id} style={{ display: "flex", gap: 12, padding: "3px 0", fontSize: 12 }}><span style={{ color: "#374151", flexShrink: 0 }}>{l.time}</span><span style={{ color: lc, flexShrink: 0, width: 14 }}>{{ info: "›", success: "✓", error: "✗", warning: "⚠" }[l.type]}</span><span style={{ color: "#6b7280", flexShrink: 0, minWidth: 90 }}>[{l.service}]</span><span style={{ color: l.type === "error" ? "#fca5a5" : l.type === "success" ? "#86efac" : "#9ca3af" }}>{l.message}</span></div>; })}
            </div>
          </div>
        </div>}
      </main>
      {showCfg && <ConfigModal config={cfg} onSave={saveCfg} onClose={() => setShowCfg(false)} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem("of_auth") === "1");
  if (!auth) return <LoginPage onLogin={() => setAuth(true)} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem("of_auth"); setAuth(false); }} />;
}
