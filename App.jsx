import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, ComposedChart
} from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const VOLUME_DATA = [
  { m: "Jul", volume: 890, fees: 8.9, oi: 210, traders: 82 },
  { m: "Aug", volume: 1100, fees: 11.0, oi: 248, traders: 91 },
  { m: "Sep", volume: 1380, fees: 13.8, oi: 295, traders: 108 },
  { m: "Oct", volume: 2100, fees: 21.0, oi: 380, traders: 142 },
  { m: "Nov", volume: 3200, fees: 32.0, oi: 490, traders: 198 },
  { m: "Dec", volume: 4800, fees: 48.0, oi: 620, traders: 265 },
  { m: "Jan", volume: 6200, fees: 62.0, oi: 740, traders: 318 },
  { m: "Feb", volume: 7100, fees: 71.0, oi: 820, traders: 365 },
  { m: "Mar", volume: 8400, fees: 84.0, oi: 910, traders: 412 },
  { m: "Apr", volume: 9200, fees: 92.0, oi: 980, traders: 448 },
  { m: "May", volume: 10100, fees: 101.0, oi: 1050, traders: 490 },
  { m: "Jun", volume: 11800, fees: 118.0, oi: 1180, traders: 542 },
];

const CATEGORIES = [
  { name: "Politics", color: "#6EE7B7", volume: 4120, share: 34.9, oi: 412, avgFee: 0.011, markets: 284, trend: 18.2 },
  { name: "Economics", color: "#67E8F9", volume: 2480, share: 21.0, oi: 248, avgFee: 0.009, markets: 156, trend: 12.4 },
  { name: "Sports", color: "#A78BFA", volume: 2210, share: 18.7, oi: 221, avgFee: 0.010, markets: 892, trend: 41.8 },
  { name: "Tech & AI", color: "#FCD34D", volume: 1180, share: 10.0, oi: 118, avgFee: 0.012, markets: 98, trend: 28.6 },
  { name: "Weather", color: "#FB923C", volume: 890, share: 7.5, oi: 89, avgFee: 0.008, markets: 210, trend: 6.2 },
  { name: "Culture", color: "#F9A8D4", volume: 920, share: 7.8, oi: 92, avgFee: 0.010, markets: 134, trend: 9.1 },
];

const REVENUE_WATERFALL = [
  { name: "Taker Fees", value: 82.6, fill: "#6EE7B7" },
  { name: "Maker Fees", value: 23.6, fill: "#67E8F9" },
  { name: "Data Licensing", value: 8.4, fill: "#A78BFA" },
  { name: "Platinum Program", value: 3.4, fill: "#FCD34D" },
];

const COHORT_DATA = [
  { cohort: "Jul-25", m1: 100, m2: 72, m3: 61, m4: 55, m5: 51, m6: 48 },
  { cohort: "Aug-25", m1: 100, m2: 75, m3: 64, m4: 58, m5: 54, m6: 51 },
  { cohort: "Sep-25", m1: 100, m2: 78, m3: 67, m4: 61, m5: 57, m6: null },
  { cohort: "Oct-25", m1: 100, m2: 81, m3: 70, m4: 64, m5: null, m6: null },
  { cohort: "Nov-25", m1: 100, m2: 83, m3: 72, m4: null, m5: null, m6: null },
  { cohort: "Dec-25", m1: 100, m2: 85, m3: null, m4: null, m5: null, m6: null },
  { cohort: "Jan-26", m1: 100, m2: null, m3: null, m4: null, m5: null, m6: null },
];

const SCENARIO_BASE = {
  monthlyVolume: 11800,
  feeRate: 0.01,
  dataLicensing: 8.4,
  platinum: 3.4,
  opex: 28,
  cash: 980,
};

function fmt(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}B`;
  return `$${n}M`;
}

function fmtM(n) { return `$${n.toFixed(1)}M`; }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(5,8,15,0.96)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, padding: "10px 14px", fontSize: 11,
      fontFamily: "'Space Mono', monospace",
    }}>
      <div style={{ color: "#9CA3AF", marginBottom: 6, fontSize: 10 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#fff", marginBottom: 2 }}>
          {p.name}: {typeof p.value === "number" && p.value > 100
            ? `$${p.value.toLocaleString()}M` : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("overview");
  const [animated, setAnimated] = useState(false);
  const [scenarioGrowth, setScenarioGrowth] = useState(100);
  const [scenarioFeeChange, setScenarioFeeChange] = useState(0);
  const [selectedCat, setSelectedCat] = useState(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => { setTimeout(() => setAnimated(true), 80); }, []);

  // Scenario calcs
  const scenVolume = SCENARIO_BASE.monthlyVolume * (1 + scenarioGrowth / 100);
  const scenFeeRate = SCENARIO_BASE.feeRate * (1 + scenarioFeeChange / 100);
  const scenFeeRev = scenVolume * scenFeeRate;
  const scenTotalRev = scenFeeRev + SCENARIO_BASE.dataLicensing + SCENARIO_BASE.platinum;
  const scenAnnualRev = scenTotalRev * 12;
  const scenNetIncome = scenTotalRev - SCENARIO_BASE.opex;
  const scenRunway = SCENARIO_BASE.cash / Math.max(SCENARIO_BASE.opex - scenTotalRev, 0.1);
  const scenValuation5x = scenAnnualRev * 5;
  const scenValuation10x = scenAnnualRev * 10;
  const scenValuation15x = scenAnnualRev * 15;

  const totalVolume = VOLUME_DATA.reduce((s, d) => s + d.volume, 0);
  const totalFees = VOLUME_DATA.reduce((s, d) => s + d.fees, 0);
  const latestVolume = VOLUME_DATA[VOLUME_DATA.length - 1].volume;
  const latestFees = VOLUME_DATA[VOLUME_DATA.length - 1].fees;
  const totalRevenue = REVENUE_WATERFALL.reduce((s, d) => s + d.value, 0);

  const volGrowth = (((latestVolume - VOLUME_DATA[0].volume) / VOLUME_DATA[0].volume) * 100).toFixed(0);

  const VIEWS = ["overview", "markets", "revenue", "cohorts", "scenarios"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#05080F",
      fontFamily: "'Space Mono', monospace",
      color: "#E5E7EB",
      overflowX: "hidden",
    }}>
      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(110,231,183,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(110,231,183,0.015) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Top glow */}
      <div style={{
        position: "fixed", top: -300, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 400,
        background: "radial-gradient(ellipse, rgba(110,231,183,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1440, margin: "0 auto", padding: "0 28px" }}>

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "32px 0 20px",
          borderBottom: "1px solid rgba(110,231,183,0.08)",
          opacity: animated ? 1 : 0,
          transform: animated ? "none" : "translateY(-10px)",
          transition: "all 0.5s ease",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#6EE7B7", boxShadow: "0 0 10px #6EE7B7",
                animation: "blink 2s infinite",
              }} />
              <span style={{ fontSize: 10, color: "#6EE7B7", letterSpacing: "0.2em" }}>
                LIVE EXCHANGE INTELLIGENCE · Q2 2026
              </span>
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 400, color: "#F9FAFB",
              letterSpacing: "-0.03em", margin: "0 0 4px",
            }}>
              Kalshi Strategic Finance OS
            </h1>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
              Exchange-native financial intelligence · Event contract volume · Revenue modeling · Cohort analytics
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{
              display: "flex", gap: 16, padding: "8px 16px",
              background: "rgba(110,231,183,0.04)",
              border: "1px solid rgba(110,231,183,0.1)",
              borderRadius: 6,
            }}>
              {[
                { label: "Valuation", value: "$22B" },
                { label: "Total Volume", value: "$52B" },
                { label: "2025 Fee Rev", value: "$248M" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, color: "#6EE7B7" }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#6B7280" }}>
              Built by Nithya Kuppa · Strategic Finance Application
            </div>
          </div>
        </div>

        {/* ── NAV ── */}
        <div style={{
          display: "flex", gap: 4, padding: "14px 0",
          opacity: animated ? 1 : 0,
          transition: "all 0.5s ease 0.1s",
        }}>
          {VIEWS.map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 16px", borderRadius: 4,
              border: `1px solid ${view === v ? "rgba(110,231,183,0.3)" : "rgba(255,255,255,0.05)"}`,
              background: view === v ? "rgba(110,231,183,0.07)" : "transparent",
              color: view === v ? "#6EE7B7" : "#4B5563",
              fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {v}
            </button>
          ))}
        </div>

        {/* ─────────────── OVERVIEW ─────────────── */}
        {view === "overview" && (
          <div style={{ opacity: animated ? 1 : 0, transition: "all 0.4s ease 0.15s" }}>

            {/* KPI CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Jun Monthly Volume", value: fmt(latestVolume), sub: `+${volGrowth}% since Jul`, accent: "#6EE7B7", flag: "↑" },
                { label: "Jun Fee Revenue", value: fmtM(latestFees), sub: "~1.0% blended rate", accent: "#6EE7B7", flag: "↑" },
                { label: "Open Interest", value: fmt(VOLUME_DATA[11].oi), sub: "Active contracts", accent: "#67E8F9", flag: "" },
                { label: "Active Traders", value: `${VOLUME_DATA[11].traders}K`, sub: "+561% vs Jul-25", accent: "#A78BFA", flag: "↑" },
                { label: "FY Fee Run Rate", value: fmtM(latestFees * 12), sub: "Annualized Jun pace", accent: "#FCD34D", flag: "" },
              ].map((c, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "16px",
                  opacity: animated ? 1 : 0,
                  transform: animated ? "none" : "translateY(12px)",
                  transition: `all 0.5s ease ${0.2 + i * 0.05}s`,
                }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 24, color: c.accent, letterSpacing: "-0.02em", marginBottom: 4 }}>
                    {c.value}
                  </div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>{c.flag} {c.sub}</div>
                </div>
              ))}
            </div>

            {/* MAIN CHARTS */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>

              {/* Volume + Fee area chart */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>
                      Monthly Notional Volume + Fee Revenue
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>Jul 2025 – Jun 2026 · $M</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <div style={{ width: 12, height: 2, background: "#6EE7B7" }} />
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>Volume</span>
                    </div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <div style={{ width: 12, height: 2, background: "#A78BFA" }} />
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>Fees</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={VOLUME_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#9CA3AF", fontFamily: "'Space Mono'" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="vol" tick={{ fontSize: 9, fill: "#9CA3AF", fontFamily: "'Space Mono'" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="fee" orientation="right" tick={{ fontSize: 9, fill: "#9CA3AF", fontFamily: "'Space Mono'" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area yAxisId="vol" type="monotone" dataKey="volume" stroke="#6EE7B7" strokeWidth={2} fill="url(#volGrad)" name="Volume ($M)" />
                      <Line yAxisId="fee" type="monotone" dataKey="fees" stroke="#A78BFA" strokeWidth={2} dot={{ fill: "#A78BFA", r: 2 }} name="Fee Rev ($M)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue waterfall */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
                  Revenue Breakdown
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 14 }}>Jun 2026 · $M</div>

                {REVENUE_WATERFALL.map((item, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: item.fill }}>${item.value}M</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", width: `${(item.value / totalRevenue) * 100}%`,
                        background: item.fill, borderRadius: 2,
                        transition: "width 0.8s ease",
                        boxShadow: `0 0 6px ${item.fill}40`,
                      }} />
                    </div>
                  </div>
                ))}

                <div style={{
                  paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", justifyContent: "space-between", marginTop: 4,
                }}>
                  <span style={{ fontSize: 12, color: "#6EE7B7" }}>Total Revenue</span>
                  <span style={{ fontSize: 18, color: "#6EE7B7" }}>${totalRevenue.toFixed(1)}M</span>
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>
                  ${(totalRevenue * 12).toFixed(0)}M annualized run rate
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

              {/* Trader growth */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "18px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
                  Active Trader Growth
                </div>
                <div style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={VOLUME_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="traderGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="traders" stroke="#A78BFA" strokeWidth={1.5} fill="url(#traderGrad)" name="Traders (K)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume by category mini */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "18px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
                  Volume by Category
                </div>
                {CATEGORIES.map((cat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 10, color: "#9CA3AF", width: 70 }}>{cat.name}</div>
                    <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", width: `${cat.share}%`,
                        background: cat.color, borderRadius: 2, opacity: 0.7,
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: cat.color, minWidth: 36, textAlign: "right" }}>
                      {cat.share}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Key ratios */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "18px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
                  Exchange Health Metrics
                </div>
                {[
                  { label: "Blended Fee Rate", value: "1.00%", color: "#6EE7B7", note: "Taker + maker spread" },
                  { label: "Rev / Active Trader", value: "$217/mo", color: "#67E8F9", note: "Jun 2026" },
                  { label: "Vol Growth MoM", value: "+16.8%", color: "#A78BFA", note: "May → Jun" },
                  { label: "Data Rev / Total", value: "7.1%", color: "#FCD34D", note: "Diversification" },
                  { label: "OI / Volume Ratio", value: "10.0%", color: "#FB923C", note: "Liquidity indicator" },
                ].map((m, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 8, paddingBottom: 8,
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>{m.label}</div>
                      <div style={{ fontSize: 9, color: "#9CA3AF" }}>{m.note}</div>
                    </div>
                    <div style={{ fontSize: 14, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────── MARKETS ─────────────── */}
        {view === "markets" && (
          <div style={{ opacity: animated ? 1 : 0, transition: "all 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
              {CATEGORIES.map((cat, i) => {
                const isSelected = selectedCat === cat.name;
                const revenueEst = (cat.volume * 0.01).toFixed(1);
                const trendColor = cat.trend > 0 ? "#6EE7B7" : "#F87171";
                return (
                  <div key={i}
                    onClick={() => setSelectedCat(isSelected ? null : cat.name)}
                    style={{
                      background: isSelected ? "rgba(110,231,183,0.04)" : "rgba(255,255,255,0.015)",
                      border: `1px solid ${isSelected ? "rgba(110,231,183,0.2)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 10, padding: "18px", cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", background: cat.color,
                          boxShadow: isSelected ? `0 0 8px ${cat.color}` : "none",
                        }} />
                        <span style={{ fontSize: 13, color: "#E5E7EB" }}>{cat.name}</span>
                      </div>
                      <span style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 3,
                        background: "rgba(255,255,255,0.04)", color: "#9CA3AF",
                      }}>
                        {cat.markets} mkts
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      {[
                        { l: "Monthly Volume", v: `$${cat.volume}M`, c: cat.color },
                        { l: "Est. Fee Rev", v: `$${revenueEst}M`, c: cat.color },
                        { l: "Open Interest", v: `$${cat.oi}M`, c: "#9CA3AF" },
                        { l: "Avg Fee Rate", v: `${(cat.avgFee * 100).toFixed(1)}%`, c: "#9CA3AF" },
                      ].map((item, j) => (
                        <div key={j}>
                          <div style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 2 }}>{item.l}</div>
                          <div style={{ fontSize: 14, color: item.c }}>{item.v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <span style={{ fontSize: 9, color: "#9CA3AF" }}>MoM volume trend</span>
                      <span style={{ fontSize: 12, color: trendColor }}>
                        {cat.trend > 0 ? "+" : ""}{cat.trend}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category comparison chart */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "20px",
            }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
                Volume vs Fee Revenue by Category · Jun 2026
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CATEGORIES} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" name="Volume ($M)" radius={[3, 3, 0, 0]}>
                      {CATEGORIES.map((cat, i) => (
                        <Cell key={i} fill={cat.color} fillOpacity={0.6} />
                      ))}
                    </Bar>
                    <Bar dataKey="oi" name="Open Interest ($M)" radius={[3, 3, 0, 0]}>
                      {CATEGORIES.map((cat, i) => (
                        <Cell key={i} fill={cat.color} fillOpacity={0.25} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────── REVENUE ─────────────── */}
        {view === "revenue" && (
          <div style={{ opacity: animated ? 1 : 0, transition: "all 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
                  Monthly Fee Revenue Trajectory
                </div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={VOLUME_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="fees" stroke="#6EE7B7" strokeWidth={2} fill="url(#feeGrad)" name="Fee Revenue ($M)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
                  Revenue Mix Analysis
                </div>
                {[
                  { label: "Trading Fee Revenue", value: totalFees, pct: 92, color: "#6EE7B7" },
                  { label: "Data Licensing", value: 8.4 * 12, pct: 6.4, color: "#A78BFA" },
                  { label: "Platinum Program", value: 3.4 * 12, pct: 1.6, color: "#FCD34D" },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: item.color }}>${item.value.toFixed(0)}M/yr</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
                      <div style={{
                        height: "100%", width: `${item.pct}%`,
                        background: item.color, borderRadius: 3,
                        boxShadow: `0 0 8px ${item.color}40`,
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3 }}>{item.pct}% of total</div>
                  </div>
                ))}

                <div style={{
                  padding: "12px", marginTop: 8,
                  background: "rgba(110,231,183,0.04)",
                  border: "1px solid rgba(110,231,183,0.08)",
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}>Strategic Note</div>
                  <div style={{ fontSize: 11, color: "#6EE7B7", lineHeight: 1.6 }}>
                    Data licensing at 7.1% of revenue signals strong diversification opportunity. CNN + CNBC partnerships set foundation for institutional data products.
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue per unit metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Revenue per $1K Volume", value: "$10.00", sub: "Blended fee rate", color: "#6EE7B7" },
                { label: "Monthly Rev Growth", value: "+16.8%", sub: "May → Jun 2026", color: "#6EE7B7" },
                { label: "Ann. Rev Run Rate", value: fmtM(latestFees * 12 + 8.4 * 12 + 3.4 * 12), sub: "Trading + data + platinum", color: "#A78BFA" },
                { label: "Rev per Active Trader", value: "$217/mo", sub: "Jun 2026 cohort", color: "#FCD34D" },
              ].map((m, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontSize: 22, color: m.color, marginBottom: 3 }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: "#9CA3AF" }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────── COHORTS ─────────────── */}
        {view === "cohorts" && (
          <div style={{ opacity: animated ? 1 : 0, transition: "all 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

              {/* Cohort retention table */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
                  Trader Cohort Retention
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>% of cohort still active by month</div>

                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF" }}>Cohort</div>
                  {["M1", "M2", "M3", "M4", "M5", "M6"].map(h => (
                    <div key={h} style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center" }}>{h}</div>
                  ))}
                </div>

                {COHORT_DATA.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "80px repeat(6, 1fr)", gap: 4, marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color: "#6B7280" }}>{row.cohort}</div>
                    {["m1", "m2", "m3", "m4", "m5", "m6"].map(k => {
                      const val = row[k];
                      const bg = val === null ? "transparent"
                        : val >= 80 ? "rgba(110,231,183,0.15)"
                          : val >= 60 ? "rgba(252,211,77,0.12)"
                            : "rgba(248,113,113,0.1)";
                      const color = val === null ? "#4B5563"
                        : val >= 80 ? "#6EE7B7"
                          : val >= 60 ? "#FCD34D"
                            : "#F87171";
                      return (
                        <div key={k} style={{
                          textAlign: "center", fontSize: 11, color,
                          background: bg, borderRadius: 4, padding: "4px 0",
                        }}>
                          {val === null ? "—" : `${val}%`}
                        </div>
                      );
                    })}
                  </div>
                ))}

                <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                  {[
                    { color: "rgba(110,231,183,0.15)", text: "≥80% retained", tc: "#6EE7B7" },
                    { color: "rgba(252,211,77,0.12)", text: "60-79%", tc: "#FCD34D" },
                    { color: "rgba(248,113,113,0.1)", text: "<60%", tc: "#F87171" },
                  ].map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
                      <span style={{ fontSize: 9, color: l.tc }}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention trend */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
                  M2 Retention Trend by Cohort
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>
                  Improving retention = healthier trader base
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={COHORT_DATA.filter(c => c.m2 !== null).map(c => ({ cohort: c.cohort, m2: c.m2 }))}
                      margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="cohort" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[65, 90]} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={80} stroke="rgba(110,231,183,0.2)" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="m2" stroke="#6EE7B7" strokeWidth={2} dot={{ fill: "#6EE7B7", r: 4 }} name="M2 Retention %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{
                  padding: "10px 12px", marginTop: 12,
                  background: "rgba(110,231,183,0.04)",
                  border: "1px solid rgba(110,231,183,0.08)",
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: 11, color: "#6EE7B7", lineHeight: 1.6 }}>
                    M2 retention improved from 72% (Jul cohort) to 85% (Dec cohort) — a 13pp improvement in 6 months. Signals product-market fit improving as sports markets and Robinhood integration drive higher-quality trader acquisition.
                  </div>
                </div>
              </div>
            </div>

            {/* LTV estimate */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                {
                  label: "Est. Trader LTV (12-mo)", value: "$1,840",
                  sub: "$217/mo × avg 8.5 months retained",
                  color: "#6EE7B7",
                  note: "Based on Jun cohort pace",
                },
                {
                  label: "Trader Acquisition Cost", value: "~$45-80",
                  sub: "S&M spend / new traders acquired",
                  color: "#67E8F9",
                  note: "Estimated from public fundraise data",
                },
                {
                  label: "LTV:CAC Ratio", value: "23-41x",
                  sub: "$1,840 LTV / $45-80 CAC",
                  color: "#A78BFA",
                  note: "Exceptionally high — exchange model advantage",
                },
              ].map((m, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "16px",
                }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 24, color: m.color, marginBottom: 4 }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>{m.sub}</div>
                  <div style={{ fontSize: 9, color: "#6B7280", fontStyle: "italic" }}>{m.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────── SCENARIOS ─────────────── */}
        {view === "scenarios" && (
          <div style={{ opacity: animated ? 1 : 0, transition: "all 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>

              {/* Sliders */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "20px",
              }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20 }}>
                  Scenario Inputs
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Volume Growth vs Jun Baseline</span>
                    <span style={{ fontSize: 13, color: "#6EE7B7" }}>+{scenarioGrowth}%</span>
                  </div>
                  <input type="range" min={-50} max={400} value={scenarioGrowth}
                    onChange={e => setScenarioGrowth(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#6EE7B7" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>
                    <span>-50%</span><span>+400%</span>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>Fee Rate Change</span>
                    <span style={{ fontSize: 13, color: "#FCD34D" }}>
                      {scenarioFeeChange >= 0 ? "+" : ""}{scenarioFeeChange}%
                      <span style={{ fontSize: 9, color: "#9CA3AF", marginLeft: 6 }}>
                        ({(scenFeeRate * 100).toFixed(2)}% blended)
                      </span>
                    </span>
                  </div>
                  <input type="range" min={-30} max={50} value={scenarioFeeChange}
                    onChange={e => setScenarioFeeChange(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#FCD34D" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>
                    <span>-30%</span><span>+50%</span>
                  </div>
                </div>

                {/* Base assumptions */}
                <div style={{
                  padding: "12px", background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Base Assumptions
                  </div>
                  {[
                    { l: "Baseline Vol (Jun)", v: `$${SCENARIO_BASE.monthlyVolume}M` },
                    { l: "Data Licensing/mo", v: `$${SCENARIO_BASE.dataLicensing}M` },
                    { l: "Platinum Rev/mo", v: `$${SCENARIO_BASE.platinum}M` },
                    { l: "Monthly OpEx", v: `$${SCENARIO_BASE.opex}M` },
                    { l: "Cash Balance", v: `$${SCENARIO_BASE.cash}M` },
                  ].map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{a.l}</span>
                      <span style={{ fontSize: 10, color: "#6B7280" }}>{a.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Output cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Scenario Monthly Volume", value: fmt(scenVolume), color: "#6EE7B7" },
                    { label: "Monthly Fee Revenue", value: fmtM(scenFeeRev), color: "#6EE7B7" },
                    { label: "Total Monthly Revenue", value: fmtM(scenTotalRev), color: "#6EE7B7" },
                    { label: "Annual Revenue Run Rate", value: fmtM(scenAnnualRev), color: "#A78BFA" },
                    { label: "Monthly Net Income", value: fmtM(scenNetIncome), color: scenNetIncome >= 0 ? "#6EE7B7" : "#F87171" },
                    {
                      label: "Cash Runway",
                      value: scenNetIncome >= 0 ? "∞" : `${Math.min(scenRunway, 99).toFixed(1)} mo`,
                      color: scenNetIncome >= 0 ? "#6EE7B7" : "#FCD34D"
                    },
                  ].map((m, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8, padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 22, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Valuation table */}
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "20px",
                }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
                    Valuation Sensitivity · ARR Multiple
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {[
                      { label: "5x ARR", value: fmtM(scenValuation5x), sub: "Conservative", color: "#FCD34D" },
                      { label: "10x ARR", value: fmtM(scenValuation10x), sub: "Base Case", color: "#67E8F9" },
                      { label: "15x ARR", value: fmtM(scenValuation15x), sub: "Upside (current)", color: "#6EE7B7" },
                    ].map((v, i) => (
                      <div key={i} style={{
                        textAlign: "center", padding: "14px",
                        background: "rgba(255,255,255,0.035)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                      }}>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 8 }}>{v.label}</div>
                        <div style={{ fontSize: 20, color: v.color, marginBottom: 4 }}>{v.value}</div>
                        <div style={{ fontSize: 9, color: "#9CA3AF" }}>{v.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scenario narrative */}
                <div style={{
                  background: "rgba(110,231,183,0.03)",
                  border: "1px solid rgba(110,231,183,0.1)",
                  borderRadius: 10, padding: "16px 18px",
                }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                    Scenario Summary
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.8 }}>
                    At <span style={{ color: "#6EE7B7" }}>+{scenarioGrowth}% volume growth</span> from the Jun baseline
                    {scenarioFeeChange !== 0 && <> and a <span style={{ color: "#FCD34D" }}>{scenarioFeeChange >= 0 ? "+" : ""}{scenarioFeeChange}% fee rate adjustment</span></>},
                    monthly fee revenue reaches <span style={{ color: "#6EE7B7" }}>{fmtM(scenFeeRev)}</span> and
                    total monthly revenue hits <span style={{ color: "#6EE7B7" }}>{fmtM(scenTotalRev)}</span>.
                    Annualized, that's a <span style={{ color: "#A78BFA" }}>{fmtM(scenAnnualRev)} run rate</span>.
                    {scenNetIncome >= 0
                      ? <> At that volume, the exchange reaches <span style={{ color: "#6EE7B7" }}>monthly cash generation</span> — runway becomes indefinite.</>
                      : <> Monthly burn of <span style={{ color: "#F87171" }}>{fmtM(Math.abs(scenNetIncome))}</span> implies runway of {Math.min(scenRunway, 99).toFixed(1)} months at current cash balance.</>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.03)",
          padding: "14px 0 28px",
          display: "flex", justifyContent: "space-between",
          marginTop: 24,
        }}>
          <div style={{ fontSize: 9, color: "#6B7280" }}>
            Kalshi Strategic Finance OS · Built by Nithya Kuppa · Strategic Finance Application 2026
          </div>
          <div style={{ fontSize: 9, color: "#6B7280" }}>
            Data: Illustrative model based on public reporting · Not affiliated with Kalshi Inc.
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #6EE7B7; }
          50% { opacity: 0.3; box-shadow: none; }
        }
        input[type=range] { height: 4px; cursor: pointer; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}
