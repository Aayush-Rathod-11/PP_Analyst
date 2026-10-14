import json
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
R = json.load(open("data/results.json"))
NAVY, BLUE, LB, GREY, RED, GREEN, ORG = "#1F3864", "#2E5597", "#DCE6F5", "#F2F2F2", "#C0392B", "#2E8B57", "#E08A1E"
MC = {"VXL": "#7FA6D9", "VXP": "#E59A55", "VXM": "#7CBF8E"}
DAY = 16.0
def box(ax, x, y, w, h, text, fc=LB, ec=NAVY, tc="black", fs=8.5, bold=False, lw=1.3):
    ax.add_patch(FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.02,rounding_size=0.08", fc=fc, ec=ec, lw=lw))
    ax.text(x, y, text, ha="center", va="center", fontsize=fs, color=tc, fontweight="bold" if bold else "normal", linespacing=1.25)
def arrow(ax, p, q, color=NAVY, lw=1.4, rad=0, style="-|>"):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle=style, mutation_scale=13, color=color, lw=lw, connectionstyle="arc3,rad=%s" % rad))
def canvas(w, h, xl, yl):
    f, ax = plt.subplots(figsize=(w, h)); ax.set_xlim(0, xl); ax.set_ylim(0, yl); ax.axis("off"); return f, ax
def save(f, n): f.savefig("figures/" + n, dpi=170, bbox_inches="tight", facecolor="white"); plt.close(f)
def title(ax, x, y, t): ax.text(x, y, t, ha="center", fontsize=11, fontweight="bold", color=NAVY)

# ---- Fig 1: production order lifecycle ----
f, ax = canvas(13, 5.2, 13, 5.2); title(ax, 6.5, 5.05, "Figure 1: Production order lifecycle in SAP PP (status, key action, typical transaction)")
st = [("Planned order", "MD01N / MD04", "-", "Planned\norder"), ("CRTD", "CO40 / CO01", "Created: BOM + routing copied,\nlead-time scheduling,\navailability check", "CRTD"),
      ("REL", "CO02 / CO05N / COHV", "Released: shop papers,\nreservations active,\ngoods issue allowed", "REL"), ("PCNF", "CO11N / CO12", "Partially confirmed:\nyield, scrap, hours\nposted per operation", "PCNF"),
      ("CNF / DLV", "MIGO (101)", "Confirmed; goods receipt\nof finished or sub-assembly", "CNF / DLV"), ("TECO", "CO02", "Technically complete:\nno more postings", "TECO"), ("CLSD", "KO88 / COR2", "Settled and closed:\nvariances to cost objects", "CLSD")]
xs = [1.0, 2.9, 4.8, 6.7, 8.6, 10.5, 12.1]
for x, (a, tc, desc, lab) in zip(xs, st):
    box(ax, x, 3.4, 1.55 if x < 12 else 1.4, 0.8, lab, NAVY if lab in ("CRTD", "REL", "CLSD") else BLUE, NAVY, "white", 9.5, True)
    ax.text(x, 2.7, tc, ha="center", fontsize=7.8, color=BLUE, style="italic")
    if desc != "-": ax.text(x, 1.95, desc, ha="center", va="center", fontsize=7.6, linespacing=1.3)
for a, b in zip(xs, xs[1:]): arrow(ax, (a + 0.8, 3.4), (b - (0.8 if b < 12 else 0.75), 3.4))
box(ax, 3.5, 0.7, 5.4, 0.7, "Scheduling: basic and scheduled dates; load in CM01 / CM21", "#E4F3EA", GREEN, fs=8)
box(ax, 9.5, 0.7, 5.4, 0.7, "Monitoring: COOIS, status in CO03, exceptions MD04 / CO24", "#E4F3EA", GREEN, fs=8)
save(f, "fig1_order_lifecycle.png")

# ---- Fig 2: scheduling anatomy ----
f, ax = canvas(13, 5.4, 13, 5.4); title(ax, 6.5, 5.25, "Figure 2: Anatomy of production order scheduling (operation times and order dates)")
ax.plot([0.5, 12.5], [3.9, 3.9], color="#7F7F7F", lw=1)
segs = [("Queue", 1.0, 2.2, "#C9C9C9"), ("Setup", 3.2, 1.0, ORG), ("Processing", 4.2, 3.6, BLUE), ("Teardown", 7.8, 1.0, ORG), ("Wait", 8.8, 1.0, "#C9C9C9"), ("Move", 9.8, 0.8, "#E4B9B5")]
for n, x, w, c in segs:
    ax.add_patch(Rectangle((x, 3.55), w, 0.7, fc=c, ec=NAVY, lw=1)); ax.text(x + w / 2, 3.9, n, ha="center", va="center", fontsize=7.6 if n == "Teardown" else 8, color="white" if c in (BLUE,) else "black")
ax.text(0.5, 4.7, "Operation 10 (work centre BATT): operation lead time = queue + setup + processing + teardown + wait + move", fontsize=8.8, color=NAVY, fontweight="bold")
ax.annotate("", xy=(1.0, 3.3), xytext=(10.6, 3.3), arrowprops=dict(arrowstyle="<->", color=NAVY)); ax.text(5.8, 3.05, "operation lead time (converted using the work centre's working-time calendar)", ha="center", fontsize=8)
# order level
ax.add_patch(Rectangle((2.2, 1.55), 7.8, 0.55, fc=LB, ec=NAVY)); ax.text(6.1, 1.82, "Scheduled production time (sum of operation lead times along the routing)", ha="center", va="center", fontsize=8.3)
ax.add_patch(Rectangle((0.5, 1.55), 1.7, 0.55, fc="#E4F3EA", ec=GREEN)); ax.text(1.35, 1.82, "Float before\nproduction", ha="center", va="center", fontsize=7.6)
ax.add_patch(Rectangle((10.0, 1.55), 1.6, 0.55, fc="#E4F3EA", ec=GREEN)); ax.text(10.8, 1.82, "Float after\nproduction", ha="center", va="center", fontsize=7.6)
for x, t in ((0.5, "Basic start"), (2.2, "Scheduled start"), (10.0, "Scheduled finish"), (11.6, "Basic finish\n(due date)")):
    ax.plot([x, x], [1.25, 1.55], color=NAVY, lw=1.4); ax.text(x, 0.95, t, ha="center", va="center", fontsize=7.8, fontweight="bold", color=NAVY)
ax.text(12.4, 1.82, "Release date =\nstart - release\nperiod", fontsize=7.4, va="center", color=RED)
ax.text(0.5, 0.35, "Forward scheduling: basic start fixed, dates computed forward. Backward scheduling: due date fixed, start computed backward. Reduction levels may shorten queue, wait, move and floats when dates are tight.", fontsize=7.6, color="#404040")
save(f, "fig2_scheduling_anatomy.png")

# ---- Fig 3: order network ----
f, ax = canvas(12, 5.0, 12, 4.6); ax.set_ylim(-0.4, 4.6); title(ax, 6, 4.45, "Figure 3: Multi-level production order network of one VX-Lite lot (critical branch through the bottleneck)")
nodes = {"WELD": (1.5, 3.4, "WELD-01\nFrame welding\n(0.60 h/unit)"), "PAINT": (4.0, 3.4, "PAINT-01\nPowder coat\n(0.20 h/unit)"), "PWR": (4.0, 2.3, "PWR-ASM\nPowertrain\n(0.55 h/unit)"),
         "BATT": (4.0, 1.2, "BATT-ASM\nBattery pack\n(0.50 h/unit)  BOTTLENECK"), "WHL": (4.0, 0.2, "WHL-ASM\nWheel assy\n(0.35 h/unit)"), "FIN": (8.0, 1.8, "FIN-ASM\nFinal assembly\n(1.00 h/unit)")}
for k, (x, y, t) in nodes.items():
    hot = k == "BATT"
    box(ax, x, y, 2.2 if not hot else 2.6, 0.78, t, "#FBE5E2" if hot else LB, RED if hot else BLUE, fs=7.8, lw=2 if hot else 1.3)
box(ax, 10.9, 1.8, 1.7, 0.9, "Goods receipt\nVX-Lite lot\nto stock", NAVY, NAVY, "white", 8.2, True)
arrow(ax, (2.6, 3.4), (2.9, 3.4)); arrow(ax, (5.1, 3.4), (7.0, 2.1)); arrow(ax, (5.1, 2.3), (7.0, 1.95)); arrow(ax, (5.3, 1.2), (7.0, 1.7), color=RED, lw=2.2); arrow(ax, (5.1, 0.25), (7.0, 1.5))
arrow(ax, (9.1, 1.8), (10.05, 1.8))
ax.text(1.5, 2.3, "Production orders\nrelease together;\nfinal assembly waits\nfor all four branches", fontsize=8, color="#404040", va="center")
save(f, "fig3_order_network.png")

# ---- Fig 4: load vs capacity ----
f, ax = plt.subplots(figsize=(9, 4.6)); wcs = list(R["load"].keys()); pct = [R["load"][w]["pct"] for w in wcs]
b = ax.bar(wcs, pct, color=[RED if p > 100 else "#7FA6D9" for p in pct], edgecolor=NAVY, width=0.6)
ax.axhline(100, color=GREEN, ls="--", lw=2); ax.text(5.45, 102, "100% of available capacity", color=GREEN, ha="right", fontsize=9, fontweight="bold")
for r, v in zip(b, pct): ax.text(r.get_x() + r.get_width() / 2, v + 2, "%d%%" % v, ha="center", fontsize=10, fontweight="bold")
ax.set_ylim(0, 125); ax.set_ylabel("Load / capacity over 12 working days (%)"); ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)
ax.set_title("Figure 4: Work-centre load versus capacity for the simulated order set (%d vehicles)" % R["total_qty"], fontsize=10.5, fontweight="bold", color=NAVY, loc="left")
save(f, "fig4_load_capacity.png")

# ---- Fig 5: Gantt of BATT ----
f, axs = plt.subplots(2, 1, figsize=(12, 5.8), sharex=True)
for ax, key, lab in zip(axs, ("FIFO (as-is)", "Proposed"), ("FIFO dispatch (as-is)", "Proposed sequence (EDD at bottleneck + setup grouping + rush priority)")):
    for (w, m, oid, model, disp, s, e, setup, ready) in R["gantt"][key]:
        y = 1 - m
        if setup > 0: ax.barh(y, setup / DAY, left=(s - setup) / DAY, height=0.7, color="#BFBFBF", edgecolor="black", hatch="///", lw=0.5)
        ax.barh(y, (e - s) / DAY, left=s / DAY, height=0.7, color=MC[model] if oid != "RUSH" else RED, edgecolor="black", lw=0.6)
        if (e - s) / DAY > 0.55: ax.text((s + e) / 2 / DAY, y, oid.replace("PO", ""), ha="center", va="center", fontsize=7)
    ax.barh(1, 8 / DAY, left=3, height=0.7, color="#333333", alpha=0.85); ax.text(3 + 4 / DAY, 1, "breakdown", ha="center", va="center", color="white", fontsize=7)
    ax.axvline(12, color=NAVY, ls=":", lw=1.5); ax.set_yticks([0, 1]); ax.set_yticklabels(["BATT line 2", "BATT line 1"]); ax.set_title(lab, fontsize=9.5, loc="left", fontweight="bold", color=NAVY)
    ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False); ax.set_xlim(0, 18)
axs[1].set_xlabel("Working day (16 h per day; dotted line = end of 12-day planning window)")
from matplotlib.patches import Patch
axs[0].legend(handles=[Patch(fc=MC["VXL"], label="VX-Lite"), Patch(fc=MC["VXP"], label="VX-Pro"), Patch(fc=MC["VXM"], label="VX-Max"), Patch(fc=RED, label="Rush order"), Patch(fc="#BFBFBF", hatch="///", label="Model changeover")], ncol=5, fontsize=8, loc="lower center", bbox_to_anchor=(0.5, -0.02), frameon=False, bbox_transform=f.transFigure)
f.suptitle("Figure 5: Bottleneck (battery assembly) schedule, as-is versus proposed", fontsize=11, fontweight="bold", color=NAVY, x=0.01, ha="left"); f.subplots_adjust(bottom=0.2)
save(f, "fig5_gantt.png")

# ---- Fig 6: scenario comparison across 40 order sets ----
names = list(R["robust"].keys()); short = ["FIFO\n(as-is)", "EDD", "SPT", "Critical\nratio", "Proposed", "Proposed\n+ overtime"]
cols = ["#9DB7DB", "#9DB7DB", "#9DB7DB", "#9DB7DB", GREEN, "#1E6B43"]
f, axs = plt.subplots(1, 3, figsize=(13, 4.2))
for ax, k, lab in zip(axs, ("late_pct", "mean_tard_h", "setup_h"), ("Late orders (%)", "Mean tardiness per order (h)", "Setup / changeover hours")):
    m = [R["robust"][n][k]["mean"] for n in names]; s = [R["robust"][n][k]["sd"] for n in names]
    ax.bar(range(6), m, yerr=s, color=cols, edgecolor=NAVY, capsize=3, lw=0.7, error_kw=dict(lw=0.8))
    for i, v in enumerate(m): ax.text(i, v + 0.5 + s[i], "%.1f" % v, ha="center", fontsize=8)
    ax.set_xticks(range(6)); ax.set_xticklabels(short, fontsize=7.5); ax.set_title(lab, fontsize=9.5, fontweight="bold", color=NAVY); ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)
f.suptitle("Figure 6: Dispatch rules compared over 40 random order sets (mean, whisker = standard deviation)", fontsize=11, fontweight="bold", color=NAVY, x=0.01, ha="left")
save(f, "fig6_rule_comparison.png")

# ---- Fig 7: queue time and flow composition (FIFO) ----
f, axs = plt.subplots(1, 2, figsize=(12, 4.2), gridspec_kw={"width_ratios": [1.3, 1]})
w = R["wait"]["FIFO (as-is)"]; ks = list(w.keys())
axs[0].bar(ks, [w[k] for k in ks], color=[RED if k == "BATT" else "#7FA6D9" for k in ks], edgecolor=NAVY)
for i, k in enumerate(ks): axs[0].text(i, w[k] + 0.4, "%.1f" % w[k], ha="center", fontsize=9)
axs[0].set_ylabel("Average queue time per operation (h)"); axs[0].set_title("Queue time by work centre (FIFO)", fontsize=10, fontweight="bold", color=NAVY)
c = R["comp"]["FIFO (as-is)"]; tot = sum(c.values())
axs[1].pie([c["queue"], c["setup"], c["proc"]], labels=["Queue", "Setup", "Processing"], colors=["#C9C9C9", ORG, BLUE], autopct="%1.0f%%", startangle=90, textprops=dict(fontsize=9), wedgeprops=dict(edgecolor="white"))
axs[1].set_title("Share of total operation time", fontsize=10, fontweight="bold", color=NAVY)
for a in axs[:1]: a.spines["top"].set_visible(False); a.spines["right"].set_visible(False)
f.suptitle("Figure 7: Where the time goes in the as-is schedule", fontsize=11, fontweight="bold", color=NAVY, x=0.01, ha="left")
save(f, "fig7_queue_time.png")

# ---- Fig 8: to-be scheduling process ----
f, ax = canvas(13, 5.6, 13, 5.6); title(ax, 6.5, 5.45, "Figure 8: Proposed production order scheduling and execution process (to-be)")
top = [(1.3, "1. MRP run\nplanned orders\n(MD01N)"), (3.7, "2. Convert\nCO40 / CO41\nbasic dates"), (6.1, "3. Check\nmaterial CO09\ncapacity CM01"), (8.5, "4. Sequence\nbottleneck first\nCM21 planning table"), (10.9, "5. Release\nCO05N / COHV\nshop papers")]
for x, t in top: box(ax, x, 4.0, 2.1, 1.1, t, LB, BLUE, fs=8.3)
for a, b in zip(top, top[1:]): arrow(ax, (a[0] + 1.07, 4.0), (b[0] - 1.07, 4.0))
bot = [(10.9, "6. Execute\ndispatch list by\nwork centre"), (8.5, "7. Confirm\nCO11N each shift\nhours, yield, scrap"), (6.1, "8. Monitor\nCOOIS, MD04\nKPI alerts"), (3.7, "9. Re-plan\nCM21, CO02\nrush / breakdown"), (1.3, "10. TECO / settle\nCO02, KO88\nlessons learned")]
for x, t in bot: box(ax, x, 1.7, 2.1, 1.1, t, "#E4F3EA" if x != 3.7 else "#FFE9C7", GREEN if x != 3.7 else ORG, fs=8.3)
arrow(ax, (10.9, 3.4), (10.9, 2.3)); [arrow(ax, (a[0] - 1.07, 1.7), (b[0] + 1.07, 1.7)) for a, b in zip(bot, bot[1:])]
arrow(ax, (3.7, 2.3), (8.5, 3.4), color=ORG, rad=0.15); ax.text(5.6, 2.95, "re-sequence after disruption", fontsize=8, color=ORG, style="italic")
ax.text(6.5, 0.45, "Rules at step 4: EDD at bottleneck | group same model within 16 h of due-date difference | rush order first | capacity lever (overtime, extra shift) planned in step 3", ha="center", fontsize=8.3, color=NAVY)
save(f, "fig8_to_be_process.png")

# ---- Fig 9: dispatch decision logic ----
f, ax = canvas(12, 4.8, 12, 4.8); title(ax, 6, 4.65, "Figure 9: Dispatch decision at a work centre when a machine becomes free")
box(ax, 1.4, 3.6, 2.2, 0.8, "Machine free:\nlist ready operations", LB, BLUE, fs=8.5)
box(ax, 4.4, 3.6, 2.2, 0.9, "Rush order\nin queue?", "#FFE9C7", ORG, fs=8.5); box(ax, 4.4, 1.7, 2.2, 0.8, "Start rush operation", "#FBE5E2", RED, fs=8.5)
box(ax, 7.3, 3.6, 2.4, 0.9, "Pick earliest\ndue date (EDD)", LB, BLUE, fs=8.5)
box(ax, 10.2, 3.6, 2.5, 1.0, "Another job of the same\nmodel within 16 h of\ndue-date gap?", "#FFE9C7", ORG, fs=8.2)
box(ax, 7.3, 1.7, 2.4, 0.8, "Start same-model job\n(no changeover)", "#E4F3EA", GREEN, fs=8.5); box(ax, 10.2, 1.7, 2.5, 0.8, "Start EDD job\n(accept changeover)", LB, BLUE, fs=8.5)
arrow(ax, (2.5, 3.6), (3.3, 3.6)); arrow(ax, (4.4, 3.15), (4.4, 2.1)); ax.text(4.55, 2.65, "yes", fontsize=8, color=RED); arrow(ax, (5.5, 3.6), (6.1, 3.6)); ax.text(5.65, 3.75, "no", fontsize=8)
arrow(ax, (8.5, 3.6), (8.95, 3.6)); arrow(ax, (9.6, 3.1), (8.2, 2.1)); ax.text(8.5, 2.7, "yes", fontsize=8, color=GREEN); arrow(ax, (10.2, 3.1), (10.2, 2.1)); ax.text(10.35, 2.65, "no", fontsize=8)
ax.text(6, 0.65, "Used on bottleneck and changeover work centres (BATT, PAINT, PWR, WHL). Other work centres follow EDD only.", ha="center", fontsize=8.3, color=NAVY)
save(f, "fig9_dispatch_logic.png")
print("figs ok")
