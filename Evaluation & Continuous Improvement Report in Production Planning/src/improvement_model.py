"""
Vertex Mobility - Week 4: evaluation and continuous improvement model (synthetic data).
Builds: 12-month KPI history + control chart limits, maturity scores, annual planning-loss estimate,
improvement portfolio with business case, and KPI projection (plan / conservative / do-nothing).
Run: python src/improvement_model.py
"""
import random, json, csv, statistics as st

MONTHS = ["Oct-25","Nov-25","Dec-25","Jan-26","Feb-26","Mar-26","Apr-26","May-26","Jun-26","Jul-26","Aug-26","Sep-26"]
FESTIVE = {0: 1.0, 1: 1.0, 5: 0.4}             # Oct, Nov peak; March wedding season smaller peak
r = random.Random(7)
def series(mean, festive_effect, noise, lo=None, hi=None, dec=1):
    raw = [mean + festive_effect * FESTIVE.get(i, 0) + r.gauss(0, noise) for i in range(12)]
    off = mean - st.mean(raw); out = [round(x + off, dec) for x in raw]
    return out
H = dict(
    mape=series(28.0, 3.5, 1.4), otif=series(88.0, -2.6, 1.0), sched_adh=series(78.0, -3.0, 1.5), turns=series(5.2, -0.3, 0.15, dec=2),
    oee=series(68.0, -2.0, 1.1), rush=[round(x) for x in series(8.0, 4.0, 1.5, dec=0)], downtime=series(12.0, 5.0, 2.0), backlog=series(5.0, 2.0, 0.8))
H["fa"] = [round(100 - x, 1) for x in H["mape"]]
with open("data/kpi_history.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["month", "forecast_mape_pct", "forecast_accuracy_pct", "otif_pct", "schedule_adherence_pct", "inventory_turns", "oee_battery_pct", "rush_orders", "bottleneck_downtime_h", "mrp_exception_backlog_days"])
    for i, m in enumerate(MONTHS): w.writerow([m, H["mape"][i], H["fa"][i], H["otif"][i], H["sched_adh"][i], H["turns"][i], H["oee"][i], H["rush"][i], H["downtime"][i], H["backlog"][i]])

# ---- control chart (individuals / moving range) for forecast MAPE ----
x = H["mape"]; mr = [abs(a - b) for a, b in zip(x[1:], x[:-1])]; cl = st.mean(x); mrbar = st.mean(mr)
ucl, lcl = cl + 2.66 * mrbar, cl - 2.66 * mrbar
ooc = [MONTHS[i] for i, v in enumerate(x) if v > ucl or v < lcl]
cc = dict(cl=round(cl, 2), ucl=round(ucl, 2), lcl=round(lcl, 2), ooc=ooc, mrbar=round(mrbar, 2), target=12.0)
kstat = {k: dict(mean=round(st.mean(v), 2), sd=round(st.pstdev(v), 2), mn=min(v), mx=max(v)) for k, v in H.items()}

# ---- maturity assessment (1 ad hoc, 2 repeatable, 3 defined, 4 managed, 5 optimised) ----
MAT = [("Demand planning", 2, 4, "3-month average forecast; 28% error; no bias tracking (Week 1)"),
       ("Sales & operations planning", 2, 4, "No monthly consensus meeting; Excel master schedule"),
       ("Master data management", 2, 4, "8 errors found, no owner, no change control (Week 2)"),
       ("MRP and planning parameters", 3, 4, "MRP runs, but lead times and scrap are estimates"),
       ("Capacity planning", 2, 4, "Overload of 127-130% found only on the shop floor (Weeks 1-3)"),
       ("Scheduling and sequencing", 2, 4, "Arrival-order dispatch; 59% late orders in simulation (Week 3)"),
       ("Shop-floor execution", 3, 4, "Orders confirmed, but not every shift; rush orders unmanaged"),
       ("Inventory control", 2, 4, "Same safety stock for all items; turns 5.2"),
       ("Performance management", 1, 4, "No KPI scorecard, no review cadence, no improvement log")]
with open("data/maturity.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["area", "current", "target_12m", "evidence"]); w.writerows(MAT)

# ---- annual planning loss estimate (Rs lakh) ----
VEH, MATCOST, CONTR = 15000, 29966, 7500
inv_val = VEH * MATCOST / 5.2; inv_tgt = VEH * MATCOST / 6.5
LOSS = [("Master data errors", 4 * 24.36, "Week 2 monthly estimate of Rs 24.4 lakh, assumed to recur once per quarter"),
        ("Late and lost sales (OTIF 88%)", (VEH * 0.12 * 0.25 * CONTR + VEH * 0.12 * 0.75 * 1000) / 1e5, "12% of vehicles late; 25% lost at Rs 7,500 contribution; rest cost Rs 1,000 in concessions"),
        ("Excess inventory carrying", (inv_val - inv_tgt) * 0.18 / 1e5, "Stock at 5.2 turns versus 6.5 turns target; carrying cost 18% a year"),
        ("Breakdowns at bottleneck", 12 * 12 * 15000 / 1e5, "12 h a month; one battery line hour = 2 packs x Rs 7,500"),
        ("Changeover losses", 53.4 * 26 * 1200 / 1e5, "Week 3: 53 h per 12-day window x 26 windows x Rs 1,200 per hour"),
        ("Rush-order expediting", 8 * 12 * 15000 / 1e5, "8 rush orders a month at Rs 15,000 extra cost"),
        ("Unplanned overtime at bottleneck", 3 * 192.6 * 2400 / 1e5, "Week 2: 193 h of unplanned overtime in 3 peak months at Rs 2,400 per h"),
        ("Material shortage line stops", 4 * 2.4, "4 stops a year at Rs 2.4 lakh (Week 2: 4 h x Rs 60,000)"),
        ("Planner manual effort", 3 * 0.30 * 9, "3 planners x 30% of time in spreadsheets and rework x Rs 9 lakh a year")]
LOSS = [(a, round(b, 1), c) for a, b, c in LOSS]; tot_loss = round(sum(b for _, b, _ in LOSS), 1)
with open("data/loss_estimate.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["loss_category", "rs_lakh_per_year", "assumption"]); w.writerows(LOSS)
LD = {a: b for a, b, _ in LOSS}

# ---- initiative portfolio ----
# id, name, impact 1-5, effort 1-5, one-time cost, run cost per year, {loss category: share recovered}, SAP lever, owner, start month, end month
INI = [("I1", "Master data governance and nightly audit", 5, 2, 12, 2, {"Master data errors": .70}, "MM02, CS02, CA02, validation rules, audit job", "Data steward", 1, 6),
       ("I2", "Seasonal consensus forecast and accuracy tracking", 4, 2, 10, 0, {"Late and lost sales (OTIF 88%)": .30, "Excess inventory carrying": .20}, "MP30 / SOP, PIRs (MD61), S&OP calendar", "Demand planner", 1, 5),
       ("I3", "Segmented inventory policy (ABC/XYZ, safety stock)", 4, 2, 6, 0, {"Excess inventory carrying": .45}, "MRP 1/2 views, MM17 mass change", "Materials manager", 3, 6),
       ("I4", "KPI dashboard and review cadence", 4, 3, 14, 2, {"Planner manual effort": .50}, "COOIS, CM01, MD07 extracts; SAP Analytics Cloud or Excel to start", "Planning analyst", 1, 4),
       ("I5", "Bottleneck-first EDD sequencing and dispatch list", 4, 2, 4, 0, {"Late and lost sales (OTIF 88%)": .10, "Changeover losses": .25}, "CM21 planning table, COOIS dispatch layout", "Capacity planner", 2, 5),
       ("I6", "Peak capacity lever plan (shift roster, subcontract)", 5, 3, 8, 8, {"Late and lost sales (OTIF 88%)": .30, "Unplanned overtime at bottleneck": .40}, "Shift models in CR02, CM01 12-week view", "Plant manager", 3, 8),
       ("I7", "SMED on battery line", 3, 3, 9, 0, {"Changeover losses": .35}, "Routing setup times (CA02) after improvement", "Production manager", 5, 9),
       ("I8", "Rush-order governance", 3, 1, 2, 0, {"Rush-order expediting": .50}, "Priority field, approval workflow, impact check", "Production manager", 1, 3),
       ("I9", "Total productive maintenance at bottleneck", 4, 3, 15, 3, {"Breakdowns at bottleneck": .50}, "Plant Maintenance (PM) plans, notifications", "Maintenance head", 4, 10),
       ("I10", "Availability check before release and supplier lead-time feedback", 3, 2, 5, 0, {"Material shortage line stops": .60}, "CO09, CO24, info record update (ME12)", "MRP controller", 2, 6),
       ("I11", "Training and change management", 3, 2, 6, 0, {}, "Training, super-user network, Kaizen board", "HR / project lead", 1, 12)]
rows = []; tb = tc = trun = 0
for i, n, imp, eff, cost, run, shares, sap, own, s, e in INI:
    ben = round(sum(LD[k] * v for k, v in shares.items()), 1)
    rows.append(dict(id=i, name=n, impact=imp, effort=eff, cost=cost, run=run, benefit=ben, net=round(ben - run, 1), ratio=round(ben / cost, 1) if cost else 0, sap=sap, owner=own, start=s, end=e))
    tb += ben; tc += cost; trun += run
tb = round(tb, 1)
with open("data/initiatives.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["id", "initiative", "impact_1_5", "effort_1_5", "one_time_cost_lakh", "run_cost_lakh_yr", "annual_benefit_lakh", "owner", "start_month", "end_month"])
    for x_ in rows: w.writerow([x_["id"], x_["name"], x_["impact"], x_["effort"], x_["cost"], x_["run"], x_["benefit"], x_["owner"], x_["start"], x_["end"]])

# ---- business case ----
RAMP = [0, .05, .12, .20, .30, .42, .55, .66, .76, .84, .90, .95, 1.0]
def case(scale):
    cum = -tc; pay = None; flows = []
    for m in range(1, 37):
        rr = RAMP[m] if m <= 12 else 1.0
        cf = (tb * scale * rr - trun) / 12
        cum += cf; flows.append(cf)
        if pay is None and cum >= 0: pay = m
    y = [sum(flows[0:12]), sum(flows[12:24]), sum(flows[24:36])]
    npv = -tc + sum(v / 1.12 ** (k + 1) for k, v in enumerate(y))
    return dict(scale=scale, year1=round(y[0], 1), year2=round(y[1], 1), year3=round(y[2], 1), payback=pay, npv3=round(npv, 1), roi3=round(100 * (sum(y) - tc) / tc))
BC = [case(s) for s in (0.5, 0.75, 1.0)]
# ---- KPI projection ----
KP = [("Forecast accuracy (%)", 72.0, 88.0, 0.0, 1), ("OTIF service level (%)", 88.0, 95.0, -2.0, 1), ("Schedule adherence (%)", 78.0, 92.0, -3.0, 1),
      ("Inventory turns", 5.2, 6.5, -0.2, 1), ("OEE battery line (%)", 68.0, 78.0, -1.5, 1), ("Data-quality score (%)", 94.7, 99.0, -1.0, 1), ("Rush orders per month", 8.0, 4.0, 2.0, -1)]
proj = {}
for n, b, t, drift, sign in KP:
    proj[n] = dict(base=b, target=t, plan=[round(b + (t - b) * RAMP[m], 2) for m in range(13)], cons=[round(b + 0.6 * (t - b) * RAMP[m], 2) for m in range(13)], idle=[round(b + drift * m / 12, 2) for m in range(13)], sign=sign)
FLOOR = {"Forecast accuracy (%)": 50, "OTIF service level (%)": 70, "Schedule adherence (%)": 60, "Inventory turns": 3.0, "OEE battery line (%)": 50, "Data-quality score (%)": 85, "Rush orders per month": 15}
def phi(vals):
    s = []
    for n, b, t, d, sg in KP:
        v = vals[n]; s.append(max(0, min(1, (v - FLOOR[n]) / (t - FLOOR[n]))))
    return 100 * sum(s) / len(s)
index = {k: [round(phi({n: proj[n][k][m] for n, *_ in KP}), 1) for m in range(13)] for k in ("plan", "cons", "idle")}
with open("data/kpi_projection.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["kpi", "month", "plan", "conservative", "do_nothing"])
    for n in proj:
        for m in range(13): w.writerow([n, m, proj[n]["plan"][m], proj[n]["cons"][m], proj[n]["idle"][m]])
    for m in range(13): w.writerow(["Planning health index", m, index["plan"][m], index["cons"][m], index["idle"][m]])
out = dict(months=MONTHS, hist=H, kstat=kstat, cc=cc, maturity=MAT, loss=LOSS, tot_loss=tot_loss, ini=rows, tot_benefit=tb, tot_cost=tc, tot_run=trun, bc=BC, proj=proj, index=index, ramp=RAMP,
           inv=dict(cur=round(inv_val / 1e7, 2), tgt=round(inv_tgt / 1e7, 2), release=round((inv_val - inv_tgt) / 1e7, 2)))
json.dump(out, open("data/results.json", "w"), indent=1)
print("loss", tot_loss, "benefit", tb, "cost", tc, "run", trun); print(BC); print(cc); print("index", index["plan"][0], index["plan"][6], index["plan"][12], index["cons"][12], index["idle"][12]); print(inv_val / 1e7, inv_tgt / 1e7)
print([(x_["id"], x_["benefit"]) for x_ in rows]); print(kstat["mape"], kstat["otif"])
