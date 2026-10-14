"""
Vertex Mobility - Week 3: production order scheduling simulation (synthetic data).
Discrete-event model of a 6-work-centre shop (multi-level production orders) comparing dispatch rules
and a proposed bottleneck-aware scheme, under three disruptions (line breakdown, missing controller, rush order).
Run: python src/shop_simulation.py
"""
import random, heapq, json, csv, statistics as st

DAY = 16.0                                   # working hours per day (2 shifts x 8 h)
WC = {  # machines, unit hours per vehicle, setup hours on model change
 "WELD": dict(m=3, u=0.60, s=0.0), "PAINT": dict(m=1, u=0.20, s=1.0), "PWR": dict(m=3, u=0.55, s=1.0),
 "BATT": dict(m=2, u=0.50, s=1.5), "WHL": dict(m=2, u=0.35, s=0.5), "FIN": dict(m=5, u=1.00, s=0.5)}
MODEL_MULT = {"VXL": 1.0, "VXP": 1.15, "VXM": 1.30}
MODEL_P = [("VXL", .60), ("VXP", .28), ("VXM", .12)]
PRED = {"WELD": [], "PWR": [], "BATT": [], "WHL": [], "PAINT": ["WELD"], "FIN": ["PAINT", "PWR", "BATT", "WHL"]}
REMAIN = {"WELD": ["WELD", "PAINT", "FIN"], "PAINT": ["PAINT", "FIN"], "PWR": ["PWR", "FIN"], "BATT": ["BATT", "FIN"], "WHL": ["WHL", "FIN"], "FIN": ["FIN"]}

def make_orders(seed, scale=1.0, rush=True, mat_delay=True):
    r = random.Random(seed); orders = []; total = 0; i = 0
    while total < 700 * scale:
        i += 1
        model = r.choices([m for m, _ in MODEL_P], [p for _, p in MODEL_P])[0]
        qty = r.choice([20, 25, 30, 35, 40, 45]); total += qty
        rel = r.randint(0, 9) * DAY; due = rel + DAY * (6 + r.randint(0, 2))
        orders.append(dict(id="PO%02d" % i, model=model, qty=qty, rel=rel, due=due, rush=False, mat=rel))
    if rush:
        orders.append(dict(id="RUSH", model="VXM", qty=25, rel=6 * DAY, due=6 * DAY + 3.5 * DAY, rush=True, mat=6 * DAY))
    if mat_delay:                              # controller shipment late for orders released on days 4-6
        for o in orders:
            if 4 * DAY <= o["rel"] <= 6 * DAY and not o["rush"]: o["mat"] = o["rel"] + 24
    for o in orders:
        o["proc"] = {w: o["qty"] * WC[w]["u"] * MODEL_MULT[o["model"]] * r.uniform(0.95, 1.10) for w in WC}
    orders.sort(key=lambda o: o["rel"]); return orders

CFG = dict(bott="edd", other="edd", tol=16.0, buffer=1e9, k=2.0, rush_w=5.0, matgate=False)

def simulate(orders, rule, gate=False, bd_hours=8.0, ot=False, cfg=None):
    cfg = cfg or CFG
    mach = {w: [dict(free=0.0, last=None, bd=(w == "BATT" and k == 0 and bd_hours > 0)) for k in range(WC[w]["m"])] for w in WC}
    tasks = {}; queue = {w: [] for w in WC}; done = {}; pending = sorted(orders, key=lambda o: o["due"]); released = {}
    times = []
    for o in orders: heapq.heappush(times, o["rel"]); heapq.heappush(times, o["mat"])
    heapq.heappush(times, 0.0); heapq.heappush(times, 3 * DAY)
    t = 0.0; wip_area = 0.0; last_t = 0.0; wip = 0; sched = []
    def batt_backlog():
        return sum(tk["p"] for tk in tasks.values() if tk["w"] == "BATT" and tk["end"] is None)
    def put(o):
        released[o["id"]] = t
        for w in WC:
            tasks[(o["id"], w)] = dict(o=o, w=w, p=o["proc"][w], ready=None, start=None, end=None, setup=0.0)
        for w in ("WELD", "PWR", "BATT", "WHL"):
            tk = tasks[(o["id"], w)]; tk["ready"] = t if w != "PWR" else max(t, o["mat"]); queue[w].append(tk); heapq.heappush(times, tk["ready"])
    def key(tk, w):
        o = tk["o"]; rem = sum(o["proc"][x] for x in REMAIN[w]); slack = o["due"] - t - rem
        if rule == "FIFO": return tk["ready"]
        if rule == "EDD": return o["due"]
        if rule == "SPT": return tk["p"]
        if rule == "CR": return (o["due"] - t) / max(rem, 1e-6)
        # PROPOSED: drum-buffer-rope. Bottleneck (BATT) sequenced by ATC index, other centres by due date; rush order weighted
        kind = cfg["bott"] if w == "BATT" else cfg["other"]
        if kind == "edd": return o["due"] - (1000 if o["rush"] else 0)
        if kind == "slack": return slack - (1000 if o["rush"] else 0)
        import math
        pbar = st.mean(x["p"] for x in queue[w]) if queue[w] else tk["p"]
        wgt = cfg["rush_w"] if o["rush"] else 1.0
        return -(wgt / max(tk["p"], 1e-6)) * math.exp(-max(slack, 0.0) / (cfg["k"] * pbar))
    while times:
        t = heapq.heappop(times)
        while times and times[0] <= t + 1e-9: heapq.heappop(times)
        wip_area += wip * (t - last_t); last_t = t
        if gate:                                                # release gate: material availability (+ optional rope on BATT backlog)
            for o in list(pending):
                if o["rel"] <= t + 1e-9 and (not cfg["matgate"] or o["mat"] <= t + 8) and (o["rush"] or batt_backlog() + o["proc"]["BATT"] <= cfg["buffer"]):
                    put(o); pending.remove(o)
        else:
            for o in list(pending):
                if o["rel"] <= t + 1e-9: put(o); pending.remove(o)
        for w in WC:
            for mk in mach[w]:
                if mk["free"] > t + 1e-9: continue
                if mk["bd"] and t >= 3 * DAY:
                    mk["free"] = t + bd_hours; mk["bd"] = False; heapq.heappush(times, mk["free"]); continue
                cand = [tk for tk in queue[w] if tk["ready"] is not None and tk["ready"] <= t + 1e-9]
                if not cand: continue
                if rule == "PROPOSED" and WC[w]["s"] > 0:      # prefer same model (no setup) when slack is nearly equal
                    best = min(key(tk, w) for tk in cand)
                    near = [tk for tk in cand if key(tk, w) <= best + cfg["tol"] and not tk["o"]["rush"]]
                    same = [tk for tk in near if tk["o"]["model"] == mk["last"]]
                    pick = min(same or cand, key=lambda tk: key(tk, w))
                else:
                    pick = min(cand, key=lambda tk: key(tk, w))
                queue[w].remove(pick)
                setup = WC[w]["s"] if (mk["last"] is not None and mk["last"] != pick["o"]["model"]) else 0.0
                p = pick["p"] / (1.15 if (ot and w == "BATT" and 3 * DAY <= t <= 9 * DAY) else 1.0)
                pick["start"] = t + setup; pick["end"] = t + setup + p; pick["setup"] = setup; pick["mach"] = mach[w].index(mk)
                mk["free"] = pick["end"]; mk["last"] = pick["o"]["model"]; heapq.heappush(times, pick["end"])
                sched.append((w, pick["mach"], pick["o"]["id"], pick["o"]["model"], round(t, 2), round(pick["start"], 2), round(pick["end"], 2), round(setup, 2), round(pick["ready"], 2)))
        for (oid, w), tk in list(tasks.items()):
            if tk["end"] is not None and tk["end"] <= t + 1e-9 and not tk.get("fin"):
                tk["fin"] = True
                for s, pr in PRED.items():
                    if w in pr and tasks[(oid, s)]["ready"] is None and all(tasks[(oid, x)].get("fin") for x in pr):
                        tk2 = tasks[(oid, s)]; tk2["ready"] = max(tasks[(oid, x)]["end"] for x in pr); queue[s].append(tk2); heapq.heappush(times, tk2["ready"])
                if w == "FIN": done[oid] = tk["end"]
        wip = len(released) - len(done)
        if len(done) == len(orders): break
    fin = {o["id"]: done[o["id"]] for o in orders}
    late = {o["id"]: max(0.0, fin[o["id"]] - o["due"]) for o in orders}
    ms = max(fin.values()); setup_h = sum(tk["setup"] for tk in tasks.values())
    batt_busy = sum(tk["end"] - tk["start"] for tk in tasks.values() if tk["w"] == "BATT")
    wait = {w: st.mean([tk["start"] - tk["setup"] - tk["ready"] for tk in tasks.values() if tk["w"] == w]) for w in WC}
    comp = dict(queue=sum(tk["start"] - tk["setup"] - tk["ready"] for tk in tasks.values()), setup=setup_h, proc=sum(tk["end"] - tk["start"] for tk in tasks.values()))
    flow = [fin[o["id"]] - o["rel"] for o in orders]          # flow time measured from planned (MRP) release date
    res = dict(rule=rule, n=len(orders), late_pct=100 * sum(1 for v in late.values() if v > 0) / len(orders), mean_tard_h=st.mean(late.values()),
               max_tard_h=max(late.values()), makespan_h=ms, mean_flow_h=st.mean(flow), setup_h=setup_h, batt_util=100 * batt_busy / (2 * 12 * DAY),
               avg_wip=wip_area / ms, rush_late_h=late.get("RUSH", 0.0))
    return res, dict(sched=sched, fin=fin, late=late, wait=wait, comp=comp, released=released)

SCEN = [("FIFO (as-is)", "FIFO", False, False), ("EDD", "EDD", False, False), ("SPT", "SPT", False, False), ("Critical ratio", "CR", False, False),
        ("Proposed", "PROPOSED", False, False), ("Proposed + overtime", "PROPOSED", False, True)]
if __name__ == "__main__":
    out = {}
    orders = make_orders(42)
    out["orders"] = [{k: (round(v, 1) if isinstance(v, float) else v) for k, v in o.items() if k != "proc"} for o in orders]
    out["total_qty"] = sum(o["qty"] for o in orders)
    load = {w: round(sum(o["proc"][w] for o in orders), 1) for w in WC}
    out["load"] = {w: dict(load=load[w], cap=WC[w]["m"] * DAY * 12, pct=round(100 * load[w] / (WC[w]["m"] * DAY * 12))) for w in WC}
    main = {}; keep = {}
    for name, rule, gate, ot in SCEN:
        r, d = simulate(orders, rule, gate, ot=ot); r["name"] = name; main[name] = r; keep[name] = d
    out["main"] = main
    out["wait"] = {k: {w: round(v, 1) for w, v in d["wait"].items()} for k, d in keep.items()}
    out["comp"] = {k: {a: round(b, 1) for a, b in d["comp"].items()} for k, d in keep.items()}
    for nm, fn in (("FIFO (as-is)", "schedule_fifo.csv"), ("Proposed", "schedule_proposed.csv")):
        with open("data/" + fn, "w", newline="") as fh:
            w = csv.writer(fh); w.writerow(["work_centre", "machine", "order", "model", "dispatch_h", "start_h", "end_h", "setup_h", "ready_h"]); w.writerows(keep[nm]["sched"])
    out["gantt"] = {k: [s for s in keep[k]["sched"] if s[0] == "BATT"] for k in ("FIFO (as-is)", "Proposed")}
    out["late_by_order"] = {k: {o: round(v, 1) for o, v in keep[k]["late"].items()} for k in ("FIFO (as-is)", "Proposed")}
    dis = {}
    for lbl, kw in (("All three disruptions", dict(rush=True, mat_delay=True, bd=8)), ("No breakdown", dict(rush=True, mat_delay=True, bd=0)),
                    ("No missing controller", dict(rush=True, mat_delay=False, bd=8)), ("No rush order", dict(rush=False, mat_delay=True, bd=8)),
                    ("No disruptions", dict(rush=False, mat_delay=False, bd=0)), ("16 h breakdown", dict(rush=True, mat_delay=True, bd=16))):
        o2 = make_orders(42, rush=kw["rush"], mat_delay=kw["mat_delay"]); row = {}
        for nm, rule, gate, ot in (SCEN[0], SCEN[4]):
            r, _ = simulate(o2, rule, gate, bd_hours=kw["bd"], ot=ot); row[nm] = dict(late_pct=round(r["late_pct"], 1), mean_tard_h=round(r["mean_tard_h"], 1))
        dis[lbl] = row
    out["disruptions"] = dis
    rob = {n: {"late_pct": [], "mean_tard_h": [], "setup_h": [], "mean_flow_h": []} for n, *_ in SCEN}
    for sd in range(100, 140):
        o3 = make_orders(sd)
        for name, rule, gate, ot in SCEN:
            r, _ = simulate(o3, rule, gate, ot=ot)
            for k in rob[name]: rob[name][k].append(r[k])
    out["robust"] = {n: {k: dict(mean=round(st.mean(v), 1), sd=round(st.pstdev(v), 1)) for k, v in d.items()} for n, d in rob.items()}
    out["robust_wins"] = dict(runs=40, tard=sum(1 for a, b in zip(rob["FIFO (as-is)"]["mean_tard_h"], rob["Proposed"]["mean_tard_h"]) if b < a),
                              late=sum(1 for a, b in zip(rob["FIFO (as-is)"]["late_pct"], rob["Proposed"]["late_pct"]) if b < a))

    # --- design-of-scheme study on TRAINING seeds 1-25 (disjoint from the test seeds 100-139 used for evaluation) ---
    train = {s: make_orders(s) for s in range(1, 26)}
    variants = [("FIFO (as-is)", "FIFO", False, None), ("EDD everywhere", "EDD", False, None),
                ("Least-slack at BATT and elsewhere", "PROPOSED", False, dict(CFG, bott="slack", other="slack", tol=0)),
                ("ATC at BATT, EDD elsewhere", "PROPOSED", False, dict(CFG, bott="atc", tol=0)),
                ("EDD + rope (BATT backlog <= 96 h)", "PROPOSED", True, dict(CFG, tol=0, buffer=96.0)),
                ("EDD + material-availability release gate", "PROPOSED", True, dict(CFG, tol=0, matgate=True)),
                ("EDD at BATT, no setup grouping", "PROPOSED", False, dict(CFG, tol=0)),
                ("EDD at BATT + setup grouping (16 h) = chosen", "PROPOSED", False, dict(CFG, tol=16.0)),
                ("EDD at BATT + setup grouping (48 h)", "PROPOSED", False, dict(CFG, tol=48.0))]
    tune_rows = []
    for nm, rule, gate, cf in variants:
        rs = [simulate(o, rule, gate, cfg=cf)[0] for o in train.values()]
        tune_rows.append([nm] + [round(st.mean(r[k] for r in rs), 1) for k in ("late_pct", "mean_tard_h", "mean_flow_h", "setup_h")])
    out["tuning"] = tune_rows
    with open("data/design_study_training.csv", "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(["variant", "late_orders_pct", "mean_tardiness_h", "mean_flow_h", "setup_h"]); w.writerows(tune_rows)
    json.dump(out, open("data/results.json", "w"), indent=1)
    with open("data/orders.csv", "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(["order", "model", "qty", "release_h", "due_h", "rush", "controller_available_h"])
        for o in out["orders"]: w.writerow([o["id"], o["model"], o["qty"], o["rel"], o["due"], o["rush"], o["mat"]])
    with open("data/scenario_results.csv", "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(["scenario", "late_orders_pct", "mean_tardiness_h", "max_tardiness_h", "makespan_h", "mean_flow_h", "setup_h", "batt_util_pct", "avg_wip"])
        for n, r in main.items(): w.writerow([n] + [round(r[k], 1) for k in ("late_pct", "mean_tard_h", "max_tard_h", "makespan_h", "mean_flow_h", "setup_h", "batt_util", "avg_wip")])
    print(out["total_qty"], len(orders), {w: v["pct"] for w, v in out["load"].items()})
    for n, r in main.items(): print(n, {k: round(v, 1) for k, v in r.items() if isinstance(v, float)})
    print(out["robust_wins"]); 
    for n in ("FIFO (as-is)", "EDD", "Proposed", "Proposed + overtime"): print(n, json.dumps(out["robust"][n]))
    print(json.dumps(out["disruptions"]))
