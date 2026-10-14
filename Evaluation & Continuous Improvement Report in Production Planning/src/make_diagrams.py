import json, math
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Polygon
R = json.load(open("data/results.json"))
NAVY, BLUE, LB, GREY, RED, GREEN, ORG = "#1F3864", "#2E5597", "#DCE6F5", "#F2F2F2", "#C0392B", "#2E8B57", "#E08A1E"
def box(ax, x, y, w, h, text, fc=LB, ec=NAVY, tc="black", fs=8.5, bold=False, lw=1.3):
    ax.add_patch(FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.02,rounding_size=0.08", fc=fc, ec=ec, lw=lw))
    ax.text(x, y, text, ha="center", va="center", fontsize=fs, color=tc, fontweight="bold" if bold else "normal", linespacing=1.25)
def arrow(ax, p, q, color=NAVY, lw=1.5, rad=0):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle="-|>", mutation_scale=14, color=color, lw=lw, connectionstyle="arc3,rad=%s" % rad))
def canvas(w, h, xl, yl):
    f, ax = plt.subplots(figsize=(w, h)); ax.set_xlim(0, xl); ax.set_ylim(0, yl); ax.axis("off"); return f, ax
def save(f, n): f.savefig("figures/" + n, dpi=170, bbox_inches="tight", facecolor="white"); plt.close(f)
def clean(ax):
    ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)

# ---- Fig 1: PDCA cycle ----
f, ax = canvas(12, 5.8, 12, 5.8); ax.text(6, 5.65, "Figure 1: The continuous improvement cycle applied to production planning in SAP PP", ha="center", fontsize=11, fontweight="bold", color=NAVY)
Q = [(3.0, 3.9, "PLAN", "Find the gap and set a target\n- KPI scorecard vs target\n- Pareto of losses\n- Choose initiative, owner, date", NAVY),
     (9.0, 3.9, "DO", "Pilot the change\n- Change master data (MM02, CS02)\n- Test sequence in CM21\n- Train planners", BLUE),
     (9.0, 1.4, "CHECK", "Measure the result\n- COOIS, CM01, MD07 reports\n- Control chart of KPI\n- Compare with target", GREEN),
     (3.0, 1.4, "ACT", "Standardise or adjust\n- Update SOP and parameters\n- Roll out to other plants / models\n- Log lesson, next cycle", ORG)]
for x, y, t, d, c in Q:
    ax.add_patch(FancyBboxPatch((x - 2.6, y - 0.95), 5.2, 1.9, boxstyle="round,pad=0.02,rounding_size=0.1", fc="white", ec=c, lw=2))
    ax.add_patch(FancyBboxPatch((x - 2.6, y + 0.45), 5.2, 0.5, boxstyle="round,pad=0.02,rounding_size=0.1", fc=c, ec=c)); ax.text(x, y + 0.7, t, ha="center", va="center", color="white", fontsize=11, fontweight="bold")
    ax.text(x - 2.4, y - 0.25, d, fontsize=8.3, va="center", linespacing=1.4)
arrow(ax, (5.7, 3.9), (6.3, 3.9)); arrow(ax, (9.0, 2.9), (9.0, 2.5)); arrow(ax, (6.3, 1.4), (5.7, 1.4)); arrow(ax, (3.0, 2.5), (3.0, 2.9))
ax.text(6, 2.65, "Every cycle: 4 to 12 weeks", ha="center", fontsize=9, color=NAVY, style="italic")
save(f, "fig1_improvement_cycle.png")

# ---- Fig 2: KPI process map ----
f, ax = canvas(13, 5.0, 13, 5.0); ax.text(6.5, 4.85, "Figure 2: Production planning process with KPI measurement points", ha="center", fontsize=11, fontweight="bold", color=NAVY)
st = [(1.2, "PLAN", "Forecast, S&OP,\nMRP, capacity"), (3.8, "SOURCE / DATA", "Master data,\nsuppliers, lead times"), (6.4, "MAKE", "Scheduling, orders,\nconfirmations"), (9.0, "DELIVER", "Goods receipt,\nshipment to dealer"), (11.6, "FINANCE", "Inventory,\ncost of delay")]
for x, t, d in st:
    box(ax, x, 3.7, 2.2, 1.1, t + "\n" + d, NAVY if False else LB, BLUE, fs=8.3)
for a, b in zip(st, st[1:]): arrow(ax, (a[0] + 1.12, 3.7), (b[0] - 1.12, 3.7))
K = [(1.2, ["Forecast accuracy", "Forecast bias", "Plan stability", "MRP exception backlog"]), (3.8, ["Data-quality score", "Lead-time deviation", "Supplier on-time rate", "Critical-rule failures"]),
     (6.4, ["Schedule adherence", "OEE battery line", "Bottleneck downtime", "Confirmation timeliness"]), (9.0, ["OTIF service level", "Rush orders", "Mean tardiness", "Perfect order rate"]), (11.6, ["Inventory turns", "Days of inventory", "Expedite cost", "Planning loss (Rs)"])]
for x, ks in K:
    for i, k in enumerate(ks):
        box(ax, x, 2.35 - i * 0.62, 2.2, 0.46, k, "#E4F3EA", GREEN, fs=7.8)
        ax.plot([x, x], [3.12, 2.62 if i == 0 else 3.12], color=GREEN, lw=1) if i == 0 else None
ax.text(6.5, 0.0, "Feedback: each KPI has an owner, a SAP data source and an alert limit; results flow into the monthly S&OP and quarterly improvement review", ha="center", fontsize=8.3, color=NAVY)
save(f, "fig2_kpi_process_map.png")

# ---- Fig 3: KPI history ----
H = R["hist"]; M = R["months"]
f, axs = plt.subplots(2, 3, figsize=(13, 6.2))
panels = [("mape", "Forecast error, MAPE (%)", 12, "lower"), ("otif", "OTIF service level (%)", 95, "higher"), ("sched_adh", "Schedule adherence (%)", 92, "higher"),
          ("turns", "Inventory turns", 6.5, "higher"), ("oee", "OEE battery line (%)", 78, "higher"), ("rush", "Rush orders per month", 4, "lower")]
for ax, (k, t, tg, d) in zip(axs.flat, panels):
    ax.plot(range(12), H[k], marker="o", color=BLUE, lw=1.8, ms=4); ax.axhline(R["kstat"][k]["mean"], color="#7F7F7F", ls="--", lw=1); ax.axhline(tg, color=GREEN, lw=1.6)
    ax.text(11.4, tg, "target %s" % tg, color=GREEN, fontsize=7.8, ha="right", va="bottom"); ax.set_title(t, fontsize=9.5, fontweight="bold", color=NAVY)
    ax.set_xticks(range(0, 12, 2)); ax.set_xticklabels([M[i] for i in range(0, 12, 2)], fontsize=7.5); clean(ax)
    lo, hi = min(min(H[k]), tg), max(max(H[k]), tg); pad = (hi - lo) * 0.15; ax.set_ylim(lo - pad, hi + pad)
f.suptitle("Figure 3: Twelve-month performance of core planning KPIs (dashed line = 12-month mean)", fontsize=11, fontweight="bold", color=NAVY, x=0.01, ha="left"); f.tight_layout(rect=(0, 0, 1, 0.95))
save(f, "fig3_kpi_history.png")

# ---- Fig 4: control chart ----
cc = R["cc"]; f, ax = plt.subplots(figsize=(10, 4.3)); x = H["mape"]
ax.plot(range(12), x, marker="o", color=BLUE, lw=1.8)
for i, v in enumerate(x):
    if v > cc["ucl"] or v < cc["lcl"]: ax.plot(i, v, "o", color=RED, ms=10, mfc="none", mew=2); ax.annotate("special cause\n(festive peak)", (i, v), (i + 1.2, v + 0.2), fontsize=8, color=RED, arrowprops=dict(arrowstyle="-", color=RED))
ax.axhline(cc["cl"], color="#7F7F7F"); ax.axhline(cc["ucl"], color=ORG, ls="--"); ax.axhline(cc["lcl"], color=ORG, ls="--"); ax.axhline(12, color=GREEN, lw=1.8)
ax.text(11.4, cc["ucl"] + 0.2, "UCL %.1f" % cc["ucl"], color=ORG, ha="right", fontsize=8.5); ax.text(11.4, cc["lcl"] - 0.9, "LCL %.1f" % cc["lcl"], color=ORG, ha="right", fontsize=8.5)
ax.text(11.4, cc["cl"] + 0.2, "mean %.1f" % cc["cl"], color="#555555", ha="right", fontsize=8.5); ax.text(11.4, 12.4, "target 12", color=GREEN, ha="right", fontsize=9, fontweight="bold")
ax.set_xticks(range(12)); ax.set_xticklabels(M, fontsize=8, rotation=0); ax.set_ylim(8, 34); ax.set_ylabel("Forecast MAPE (%)"); clean(ax)
ax.set_title("Figure 4: Individuals control chart of forecast error. Stable, but far from target.", fontsize=10.5, fontweight="bold", color=NAVY, loc="left")
save(f, "fig4_control_chart.png")

# ---- Fig 5: radar ----
mat = R["maturity"]; N = len(mat); ang = [n / N * 2 * math.pi for n in range(N)] + [0]
f = plt.figure(figsize=(7.5, 6.3)); ax = f.add_subplot(111, polar=True)
cur = [m[1] for m in mat] + [mat[0][1]]; tgt = [m[2] for m in mat] + [mat[0][2]]
ax.plot(ang, tgt, color=GREEN, lw=2, label="Target (month 12)"); ax.fill(ang, tgt, color=GREEN, alpha=0.12); ax.plot(ang, cur, color=RED, lw=2, label="Current"); ax.fill(ang, cur, color=RED, alpha=0.25)
ax.set_xticks(ang[:-1]); ax.set_xticklabels([m[0].replace(" and ", " &\n").replace("Sales & operations planning", "Sales & ops\nplanning").replace("Master data management", "Master data\nmanagement").replace("MRP & planning parameters", "MRP & planning\nparameters").replace("Performance management", "Performance\nmanagement") for m in mat], fontsize=8)
ax.set_ylim(0, 5); ax.set_yticks([1, 2, 3, 4, 5]); ax.set_yticklabels(["1", "2", "3", "4", "5"], fontsize=7); ax.legend(loc="lower right", bbox_to_anchor=(1.15, -0.05), fontsize=8.5)
ax.set_title("Figure 5: Planning process maturity (1 ad hoc to 5 optimised)", fontsize=10.5, fontweight="bold", color=NAVY, pad=22)
save(f, "fig5_maturity_radar.png")

# ---- Fig 6: loss Pareto ----
L = sorted(R["loss"], key=lambda r: -r[1]); tot = sum(r[1] for r in L)
f, ax = plt.subplots(figsize=(11.5, 5)); ax.bar(range(len(L)), [r[1] for r in L], color=[RED if i < 3 else "#E59A92" for i in range(len(L))], edgecolor=NAVY, lw=0.6)
lab = {"Master data errors": "Master data\nerrors", "Late and lost sales (OTIF 88%)": "Late and lost\nsales", "Excess inventory carrying": "Excess inventory\ncarrying", "Breakdowns at bottleneck": "Bottleneck\nbreakdowns", "Changeover losses": "Changeover\nlosses", "Rush-order expediting": "Rush-order\nexpediting", "Unplanned overtime at bottleneck": "Unplanned\novertime", "Material shortage line stops": "Material\nshortages", "Planner manual effort": "Planner manual\neffort"}
ax.set_xticks(range(len(L))); ax.set_xticklabels([lab[r[0]] for r in L], fontsize=8.3); ax.set_ylabel("Estimated loss (Rs lakh per year)")
for i, r in enumerate(L): ax.text(i, r[1] + 2, "%.0f" % r[1], ha="center", fontsize=8.5)
ax2 = ax.twinx(); cum = 0; cp = []
for r in L: cum += r[1]; cp.append(100 * cum / tot)
ax2.plot(range(len(L)), cp, color=NAVY, marker="o", lw=1.6); ax2.set_ylim(0, 105); ax2.set_ylabel("Cumulative %"); ax.spines["top"].set_visible(False); ax2.spines["top"].set_visible(False)
ax.set_title("Figure 6: Estimated annual cost of planning inefficiency (total Rs %.0f lakh)" % tot, fontsize=10.5, fontweight="bold", color=NAVY, loc="left")
save(f, "fig6_loss_pareto.png")

# ---- Fig 7: prioritisation matrix ----
f, ax = plt.subplots(figsize=(9, 6)); ax.axhline(3.5, color="#7F7F7F", ls="--", lw=1); ax.axvline(2.5, color="#7F7F7F", ls="--", lw=1)
offs = {}
for it in R["ini"]:
    key = (it["effort"], it["impact"]); k = offs.get(key, 0); offs[key] = k + 1
    dx = [0, 0.28, -0.28, 0.0][k % 4]; dy = [0, 0.12, -0.12, -0.3][k % 4]
    ax.scatter(it["effort"] + dx, it["impact"] + dy, s=max(it["benefit"], 8) * 14, color=GREEN if (it["impact"] >= 4 and it["effort"] <= 2) else BLUE, alpha=0.65, edgecolor=NAVY)
    ax.text(it["effort"] + dx, it["impact"] + dy, it["id"], ha="center", va="center", fontsize=8.5, fontweight="bold", color="white" if it["benefit"] > 12 else "black")
ax.text(1.0, 5.45, "QUICK WINS", color=GREEN, fontweight="bold", fontsize=9); ax.text(3.0, 5.45, "MAJOR PROJECTS", color=BLUE, fontweight="bold", fontsize=9)
ax.text(1.0, 0.85, "FILL-INS", color="#7F7F7F", fontweight="bold", fontsize=9); ax.text(3.0, 0.85, "RECONSIDER", color="#7F7F7F", fontweight="bold", fontsize=9)
ax.set_xlim(0.7, 4.2); ax.set_ylim(0.7, 5.7); ax.set_xlabel("Effort (1 low to 5 high)"); ax.set_ylabel("Impact (1 low to 5 high)"); clean(ax)
ax.set_title("Figure 7: Initiative prioritisation (bubble size = annual benefit)", fontsize=10.5, fontweight="bold", color=NAVY, loc="left")
save(f, "fig7_prioritisation.png")

# ---- Fig 8: roadmap Gantt ----
f, ax = plt.subplots(figsize=(12.5, 5.6)); ini = R["ini"]
for q, (a, b, c, t) in enumerate([(0, 3, "#EAF1FB", "1 Stabilise"), (3, 6, "#E4F3EA", "2 Standardise"), (6, 9, "#FFF2DE", "3 Optimise"), (9, 12, "#F0E9F7", "4 Sustain")]):
    ax.axvspan(a, b, color=c, alpha=0.9); ax.text((a + b) / 2, len(ini) + 0.35, t, ha="center", fontsize=8.5, fontweight="bold", color=NAVY)
for i, it in enumerate(ini):
    y = len(ini) - 1 - i; ax.barh(y, it["end"] - it["start"] + 1, left=it["start"] - 1, height=0.55, color=BLUE, edgecolor=NAVY)
    ax.text(it["start"] - 1.1, y, it["id"] + "  " + it["name"][:44] + ("..." if len(it["name"]) > 44 else ""), ha="right", va="center", fontsize=7.6)
for m in (3, 6, 9, 12): ax.plot(m, -0.85, marker="D", color=RED, ms=8); ax.text(m, -1.35, "Review M%d" % m, ha="center", fontsize=7.8, color=RED)
ax.set_xlim(0, 12.4); ax.set_ylim(-1.8, len(ini) + 0.8); ax.set_xticks(range(0, 13)); ax.set_xticklabels(["M%d" % m if m else "" for m in range(13)], fontsize=8); ax.set_yticks([]); clean(ax); ax.spines["left"].set_visible(False)
f.subplots_adjust(left=0.36)
ax.set_title("Figure 8: Twelve-month improvement roadmap", fontsize=11, fontweight="bold", color=NAVY, loc="left", x=-0.55)
save(f, "fig8_roadmap.png")

# ---- Fig 9: KPI projection ----
P = R["proj"]; f, axs = plt.subplots(2, 4, figsize=(14, 6.4)); names = list(P.keys()) + ["Planning health index"]
for ax, n in zip(axs.flat, names):
    if n in P:
        d = P[n]; pl, cs, idl, tg = d["plan"], d["cons"], d["idle"], d["target"]
    else:
        pl, cs, idl, tg = R["index"]["plan"], R["index"]["cons"], R["index"]["idle"], 100
    ax.plot(range(13), pl, color=GREEN, lw=2, label="Plan"); ax.plot(range(13), cs, color=ORG, lw=1.8, ls="--", label="Conservative (60% of gap)"); ax.plot(range(13), idl, color=RED, lw=1.8, ls=":", label="Do nothing")
    ax.axhline(tg, color="#7F7F7F", lw=0.8); ax.set_title(n, fontsize=9, fontweight="bold", color=NAVY); ax.set_xticks([0, 3, 6, 9, 12]); ax.set_xticklabels(["M0", "M3", "M6", "M9", "M12"], fontsize=8); clean(ax)
axs.flat[0].legend(fontsize=7, loc="lower right", frameon=False)
f.suptitle("Figure 9: Projected KPI paths over 12 months (plan, conservative case, and no action)", fontsize=11, fontweight="bold", color=NAVY, x=0.01, ha="left"); f.tight_layout(rect=(0, 0, 1, 0.94))
save(f, "fig9_kpi_projection.png")

# ---- Fig 10: governance cadence ----
f, ax = canvas(12, 5.2, 12, 5.2); ax.text(6, 5.05, "Figure 10: Review cadence that keeps improvement running", ha="center", fontsize=11, fontweight="bold", color=NAVY)
lv = [("DAILY", "15-minute shift huddle at the bottleneck", "Dispatch list, yesterday's misses, today's risks", "Shift supervisor", "#DCE6F5"), ("WEEKLY", "Planning review (45 min)", "Capacity load 12 weeks, late orders, rush requests, exceptions", "Production planner", "#BCD0EE"),
      ("MONTHLY", "S&OP and KPI review (2 h)", "Forecast accuracy, OTIF, inventory, data-quality score; approve plan", "Plant manager", "#9DB7DB"), ("QUARTERLY", "Improvement steering review", "Roadmap progress, benefits, new initiatives, resources", "Steering committee", "#7FA6D9")]
for i, (a, b, c, d, col) in enumerate(lv):
    y = 4.1 - i * 1.05; ax.add_patch(FancyBboxPatch((0.4, y - 0.42), 11.2, 0.84, boxstyle="round,pad=0.02,rounding_size=0.08", fc=col, ec=NAVY))
    ax.text(0.7, y, a, fontsize=10, fontweight="bold", color=NAVY, va="center"); ax.text(2.6, y + 0.14, b, fontsize=9, fontweight="bold", va="center"); ax.text(2.6, y - 0.17, c, fontsize=8.3, va="center"); ax.text(10.4, y, "Lead: " + d, fontsize=8.3, ha="center", va="center", style="italic")
save(f, "fig10_governance_cadence.png")
print("ok")
