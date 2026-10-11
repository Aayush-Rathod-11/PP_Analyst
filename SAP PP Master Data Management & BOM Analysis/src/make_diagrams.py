import json
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
R = json.load(open("data/results.json"))
NAVY, BLUE, LB, GREY, RED, GREEN, ORG = "#1F3864", "#2E5597", "#DCE6F5", "#F2F2F2", "#C0392B", "#2E8B57", "#E08A1E"
plt.rcParams["font.family"] = "DejaVu Sans"

def box(ax, x, y, w, h, text, fc=LB, ec=NAVY, tc="black", fs=9, bold=False, lw=1.3):
    ax.add_patch(FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.02,rounding_size=0.08", fc=fc, ec=ec, lw=lw))
    ax.text(x, y, text, ha="center", va="center", fontsize=fs, color=tc, fontweight="bold" if bold else "normal", linespacing=1.25)
def arrow(ax, p, q, color=NAVY, style="-|>", lw=1.4, rad=0, ls="-"):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle=style, mutation_scale=13, color=color, lw=lw, connectionstyle="arc3,rad=%s" % rad, linestyle=ls))
def canvas(w, h, xl, yl):
    f, ax = plt.subplots(figsize=(w, h)); ax.set_xlim(0, xl); ax.set_ylim(0, yl); ax.axis("off"); return f, ax
def save(f, n): f.savefig("figures/" + n, dpi=170, bbox_inches="tight", facecolor="white"); plt.close(f)

# ---- Fig 1: master data landscape ----
f, ax = canvas(10, 6.4, 10, 6.4)
box(ax, 5, 3.2, 3.0, 1.0, "MATERIAL MASTER\nMM01 / MM02 | MARA, MARC", NAVY, NAVY, "white", 9.5, True)
nodes = [(1.7, 5.4, "Bill of Material\nCS01 | STKO, STPO, MAST"), (5, 5.8, "Production Version\nC223 | MKAL"), (8.3, 5.4, "Routing / Task List\nCA01 | PLKO, PLPO"),
         (1.4, 3.2, "Info Record &\nSource List\nME11 / ME01 | EINA, EINE"), (8.6, 3.2, "Work Center\nCR01 | CRHD, CRCO"),
         (1.7, 1.0, "Planning Data\nMRP type, lot size,\nsafety stock, lead time"), (5, 0.6, "Storage / Plant Stock\nMARD, MBEW"), (8.3, 1.0, "Production Resources\n& Tools (PRT)\nCF01")]
for x, y, t in nodes:
    box(ax, x, y, 2.6, 1.0 if t.count("\n") < 2 else 1.2, t, LB, BLUE, fs=8.5)
    arrow(ax, (5 + (x - 5) * 0.25, 3.2 + (y - 3.2) * 0.25), (x - (x - 5) * 0.2, y - (y - 3.2) * 0.2) if abs(x-5) > 0.1 else (x, y + (-0.6 if y > 3.2 else 0.6)), style="<|-|>", lw=1.2)
ax.text(5, 6.3, "Figure 1: SAP PP master data landscape", ha="center", fontsize=11, fontweight="bold", color=NAVY)
save(f, "fig1_master_data_landscape.png")

# ---- Fig 2: BOM tree ----
f, ax = canvas(13.6, 8.4, 13.6, 8.4)
ax.text(6.8, 8.2, "Figure 2: Multi-level BOM of VX-Lite electric scooter (quantities per 1 vehicle)", ha="center", fontsize=11, fontweight="bold", color=NAVY)
box(ax, 6.8, 7.3, 3.2, 0.7, "VXL-1000  VX-Lite Scooter (FERT)", NAVY, NAVY, "white", 9.5, True)
L1 = [(1.4, "VXL-2000\nFrame Assy\n(HALB) x1"), (3.8, "VXL-3000\nPowertrain\n(HALB) x1"), (6.2, "VXL-4000\nBattery Pack\n(HALB) x1"), (8.6, "VXL-5000\nWheel Assy\n(HALB) x2"), (10.4, "VXL-6000\nDashboard\n(ROH) x1"), (11.7, "VXL-6100\nFastener Kit\n(ROH) x1"), (12.95, "VXL-6200\nPacking\n(VERP) x1")]
for x, t in L1:
    box(ax, x, 5.7, 1.5 if x < 9.5 else 1.15, 1.0, t, "#BCD0EE", BLUE, fs=7.5, bold=False)
    arrow(ax, (6.8, 6.95), (x, 6.2), lw=1.0)
L2 = {1.4: ["VXL-2100 Frame Tube x1", "VXL-2200 Swingarm x1", "VXL-2300 Paint Powder 0.35 KG"],
      3.8: ["VXL-3100 Hub Motor x1", "VXL-3200 Controller x1", "VXL-3400 Mount Bracket x1", "VXL-3300 Wiring Harness x1*"],
      6.2: ["VXL-4100 Li-ion Cell x52", "VXL-4200 BMS v2 x1", "VXL-4300 Casing x1", "VXL-4400 Nickel Strip 2.4 M"],
      8.6: ["VXL-5100 Tyre x1", "VXL-5200 Rim x1", "VXL-5300 Brake Disc x1"]}
for x, items in L2.items():
    for k, t in enumerate(items):
        y = 4.4 - k * 0.78
        hv = "*" in t
        box(ax, x, y, 2.15, 0.6, t.replace("*",""), "#FFE9C7" if hv else GREY, ORG if hv else "#7F7F7F", fs=7.2)
        arrow(ax, (x, 5.2 if k == 0 else y + 0.78 - 0.3), (x, y + 0.3), lw=0.9, color="#7F7F7F")
box(ax, 3.8, 1.0, 2.5, 0.55, "L3: VXL-3310 Copper wire 3.5 M\nL3: VXL-3320 Connector set x1", "#FFE9C7", ORG, fs=7.2)
arrow(ax, (3.8, 1.76), (3.8, 1.3), lw=0.9, color=ORG)
ax.text(10.4, 3.4, "Legend", fontsize=9, fontweight="bold", color=NAVY)
for k, (c, e, t) in enumerate([("#BCD0EE", BLUE, "Level 1 assembly / component"), (GREY, "#7F7F7F", "Level 2 component"), ("#FFE9C7", ORG, "Sub-assembly with its own BOM")]):
    ax.add_patch(FancyBboxPatch((10.4, 2.9 - k * 0.5), 0.5, 0.3, boxstyle="round,pad=0.01", fc=c, ec=e)); ax.text(11.05, 3.05 - k * 0.5, t, fontsize=8, va="center")
ax.text(10.4, 0.9, "BOM depth: 3 levels | 23 BOM items (to-be)", fontsize=8.5, color=NAVY, fontweight="bold")
save(f, "fig2_bom_structure.png")

# ---- Fig 3: data-to-decision flow ----
f, ax = canvas(13, 4.4, 13, 4.4)
ax.text(6.5, 4.25, "Figure 3: How master data flows into planning, scheduling and inventory decisions", ha="center", fontsize=11, fontweight="bold", color=NAVY)
steps = [(1.0, "Master data\nMaterial, BOM,\nRouting, WC", NAVY, "white"), (3.2, "Demand (PIR/SO)\nfrom SOP\n(Week 1)", LB, "black"), (5.4, "MRP run MD01N\nBOM explosion,\nnetting, lot size", LB, "black"),
         (7.6, "Planned orders\nPurchase reqs\nCapacity load", LB, "black"), (9.8, "Production orders\nCO01, release,\nGI / GR", LB, "black"), (11.9, "Confirmations\nCO11N, stock,\ncosts", LB, "black")]
for x, t, c, tc in steps: box(ax, x, 2.6, 1.85 if x < 11 else 1.6, 1.2, t, c, NAVY, tc, 8.5, bold=(c == NAVY))
for a, b in zip(steps, steps[1:]): arrow(ax, (a[0] + 0.95, 2.6), (b[0] - (0.95 if b[0] < 11 else 0.82), 2.6))
box(ax, 6.5, 0.9, 9.5, 0.8, "Feedback loop: actual lead times, actual routing hours, scrap and yield, stock differences -> data steward review -> master data update", "#E4F3EA", GREEN, fs=8.8)
arrow(ax, (11.9, 2.0), (11.2, 1.3), color=GREEN, rad=-0.2); arrow(ax, (1.8, 1.3), (1.0, 2.0), color=GREEN, rad=-0.2)
ax.text(1.0, 3.5, "Garbage in", fontsize=8, color=RED, ha="center", style="italic"); ax.text(11.9, 3.5, "Garbage out", fontsize=8, color=RED, ha="center", style="italic")
save(f, "fig3_data_to_decision_flow.png")

# ---- Fig 4: master data change process ----
f, ax = canvas(13, 4.8, 13, 4.8)
ax.text(6.5, 4.65, "Figure 4: Governed master data and engineering change process (to-be)", ha="center", fontsize=11, fontweight="bold", color=NAVY)
S = [(1.2, "1. Request\nECR / data\nrequest form"), (3.3, "2. Impact check\nWhere-used (CS15)\nstock, open orders"), (5.4, "3. Approve\nEng, Planning,\nPurchasing, Quality"),
     (7.5, "4. Execute\nChange number\n(CC01), valid-from"), (9.6, "5. Validate\nRules, BOM compare\n(CS14), test MRP"), (11.8, "6. Release &\nmonitor\nDQ dashboard")]
for x, t in S: box(ax, x, 3.0, 1.9, 1.2, t, LB, BLUE, fs=8.3)
for a, b in zip(S, S[1:]): arrow(ax, (a[0] + 0.97, 3.0), (b[0] - 0.97, 3.0))
box(ax, 5.4, 1.2, 3.2, 0.8, "Rejected / incomplete\nreturn to requester with reason", "#FBE5E2", RED, fs=8.3); arrow(ax, (5.4, 2.4), (5.4, 1.6), color=RED)
box(ax, 9.6, 1.2, 3.2, 0.8, "Validation failure\nback to step 4 (correct and retest)", "#FBE5E2", RED, fs=8.3); arrow(ax, (9.6, 2.4), (9.6, 1.6), color=RED)
ax.text(7.5, 0.35, "Roles: Requester | Data steward (owner) | Approvers | Basis/SAP key user | Auditor", ha="center", fontsize=8.5, color=NAVY)
save(f, "fig4_change_process.png")

# ---- Fig 5: Pareto of cost ----
imp = sorted(R["impact"], key=lambda r: -r[1]); tot = sum(r[1] for r in imp)
short = {"Battery cell BOM understated (48 vs 52)": "Cell BOM qty\n(48 vs 52)", "Controller lead time 30 d vs 84 d": "Controller\nlead time", "Battery routing time 0.30 h vs 0.50 h": "Battery routing\ntime", "Obsolete BMS v1 still in BOM": "Obsolete BMS\nin BOM", "Controller bracket set to MRP type ND": "Bracket\nMRP type ND", "Harness scrap % not maintained (4%)": "Harness\nscrap %", "Duplicate fastener kit materials": "Duplicate\nmaterial", "Wire UoM conversion (1 ROL = 10 M vs 100 M)": "Wire UoM\nconversion"}
f, ax = plt.subplots(figsize=(11, 5.2))
vals = [r[1] / 1e5 for r in imp]; ax.bar(range(len(imp)), vals, color=[RED if i < 3 else "#E59A92" for i in range(len(imp))], edgecolor=NAVY, lw=0.6)
ax.set_xticks(range(len(imp))); ax.set_xticklabels([short[r[0]] for r in imp], fontsize=8.5); ax.set_ylabel("Estimated cost, Rs lakh (Oct-26 plan)")
cum = 0; ax2 = ax.twinx(); cp = []
for r in imp: cum += r[1]; cp.append(100 * cum / tot)
ax2.plot(range(len(imp)), cp, color=NAVY, marker="o", lw=1.6); ax2.set_ylim(0, 105); ax2.set_ylabel("Cumulative %")
for i, v in enumerate(vals): ax.text(i, v + 0.15, "%.1f" % v, ha="center", fontsize=8.5)
ax.set_title("Figure 5: Cost of master data errors by source (Pareto) | total Rs %.1f lakh" % (tot / 1e5), fontsize=11, fontweight="bold", color=NAVY, loc="left")
for s in ("top",): ax.spines[s].set_visible(False); ax2.spines[s].set_visible(False)
save(f, "fig5_pareto.png")

# ---- Fig 6: capacity view ----
f, ax = plt.subplots(figsize=(8.5, 4.6)); L = R["load"]
b = ax.bar(["Load planned\n(std 0.30 h)", "Load real\n(actual 0.50 h)"], [L["planned_h"], L["actual_h"]], color=["#7FA6D9", RED], edgecolor=NAVY, width=0.5)
ax.axhline(L["cap"], color=GREEN, lw=2, ls="--"); ax.text(-0.35, L["cap"] + 15, "Effective capacity %.0f h" % L["cap"], color=GREEN, ha="left", fontsize=9, fontweight="bold")
for r, v in zip(b, [L["planned_h"], L["actual_h"]]): ax.text(r.get_x() + r.get_width() / 2, v + 15, "%.0f h (%.0f%%)" % (v, 100 * v / L["cap"]), ha="center", fontsize=9.5, fontweight="bold")
ax.set_ylabel("Battery assembly load, hours"); ax.set_ylim(0, 1050); ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)
ax.set_title("Figure 6: Wrong routing time hides a 127% overload (Oct-26, 1,808 packs)", fontsize=10.5, fontweight="bold", color=NAVY, loc="left")
save(f, "fig6_capacity.png")

# ---- Fig 7: root cause (fishbone) ----
f, ax = canvas(12, 5.2, 12, 5.2)
ax.text(6, 5.05, "Figure 7: Root-cause analysis (fishbone) of the master data failures", ha="center", fontsize=11, fontweight="bold", color=NAVY)
ax.plot([0.6, 9.6], [2.6, 2.6], color=NAVY, lw=3); box(ax, 10.8, 2.6, 2.2, 1.0, "Planning\nerrors and\nline disruption", NAVY, NAVY, "white", 9.5, True)
cats = [(2.2, 4.3, "People", ["No data owner", "Untrained planners"]), (5.0, 4.3, "Process", ["No change control (ECN)", "Late BOM updates"]), (7.8, 4.3, "System", ["No validation rules", "Free-text duplicates"]),
        (2.2, 0.9, "Data", ["Estimated, not actual,\nlead times / times", "Legacy migration errors"]), (5.0, 0.9, "Governance", ["No audits or KPIs", "No RACI"]), (7.8, 0.9, "Integration", ["Engineering and SAP\nnot synchronised", "Supplier packs differ"])]
for x, y, t, its in cats:
    box(ax, x, y + (0.25 if y > 2.6 else -0.25), 1.6, 0.5, t, LB, BLUE, fs=9, bold=True)
    arrow(ax, (x + 0.5, y - (0.0 if y > 2.6 else 0.0)), (x + 1.4, 2.6), style="-", lw=1.4)
    for k, it in enumerate(its):
        ty = (y - 0.55 - k * 0.55) if y > 2.6 else (y + 0.55 + k * 0.55)
        ax.text(x - 1.3, ty, "- " + it, fontsize=7.8, va="center")
save(f, "fig7_fishbone.png")
print("done")
