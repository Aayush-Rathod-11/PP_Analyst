"""
Vertex Mobility - Week 1 SAP PP internship
Demand forecasting + rough-cut capacity model (illustrative, synthetic data).
Run: python src/planning_model.py
"""
import csv, json

months_hist = ["Oct-24","Nov-24","Dec-24","Jan-25","Feb-25","Mar-25","Apr-25","May-25","Jun-25","Jul-25","Aug-25","Sep-25",
               "Oct-25","Nov-25","Dec-25","Jan-26","Feb-26","Mar-26","Apr-26","May-26","Jun-26","Jul-26","Aug-26","Sep-26"]
demand = [1450,1500,1100,950,1050,1200,1000,900,850,880,950,1050,
          1680,1720,1250,1100,1210,1390,1210,985,1050,930,1160,1150]
months_fc = ["Oct-26","Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27","Jul-27","Aug-27","Sep-27"]

def mape(actual, fc):
    return 100*sum(abs(a-f)/a for a, f in zip(actual, fc))/len(actual)
def bias(actual, fc):
    return 100*sum(f-a for a, f in zip(actual, fc))/sum(actual)

# ---- Back-test: forecast Apr-26..Sep-26 using data up to Mar-26 ----
train, test = demand[:18], demand[18:]
ma3 = [sum(train[-3:])/3]*6
a, s = 0.3, train[0]
for x in train[1:]:
    s = a*x + (1-a)*s
ses = [s]*6
g = sum(train[12:18])/sum(train[0:6])          # YoY growth from Oct-Mar
snaive = [train[6+i]*g for i in range(6)]       # last year's Apr-Sep x growth
bt = {"3-month moving avg": ma3, "Exp. smoothing (a=0.3)": ses, "Seasonal index x growth": snaive}
backtest = {k: {"MAPE": round(mape(test, v),1), "Bias": round(bias(test, v),1)} for k, v in bt.items()}

# ---- 12-month forecast: last 12 months x damped growth ----
g_full = sum(demand[12:])/sum(demand[:12])
g_damp = 1 + (g_full-1)/2
forecast = [round(x*g_damp) for x in demand[12:]]

# ---- Capacity (battery pack assembly, 1 pack per vehicle, 0.5 line-hr/pack) ----
lines, shifts, hrs, days, util, eff = 2, 2, 8, 26, 0.90, 0.95
cap_hours = lines*shifts*hrs*days*util*eff
std_hr = 0.5
cap_units = cap_hours/std_hr
ot_units = cap_units*1.15          # with overtime/extra Sunday shift (+15 %)
load_hours = [round(f*std_hr,1) for f in forecast]
load_pct = [round(100*h/cap_hours) for h in load_hours]

# ---- Leveled MPS: opening stock 400 (pre-built Q2-Q3 2026), safety stock = 10 % of next month demand ----
# Max output per month = regular capacity, overtime (+15 %) and, for the festive peak (Oct-Dec), 250 units/month subcontracted
n = len(forecast)
max_cap = [ot_units + (250 if i < 3 else 0) for i in range(n)]
need = [forecast[i] + 0.10*(forecast[i+1] if i+1 < n else forecast[i]) for i in range(n)]
# net-requirements logic: produce what is needed to restore safety stock, capped by max capacity
inv, plan, end_inv = 400, [], []
for i in range(n):
    p = max(0, min(need[i] - inv, max_cap[i]))
    inv = inv + p - forecast[i]
    plan.append(round(p)); end_inv.append(round(inv))
out = dict(backtest=backtest, growth=round(g_full,3), damped=round(g_damp,3), forecast=forecast,
           cap_hours=round(cap_hours,1), cap_units=round(cap_units), ot_units=round(ot_units),
           load_hours=load_hours, load_pct=load_pct, plan=plan, end_inv=end_inv)
json.dump(out, open("data/results.json","w"), indent=2)
with open("data/forecast_and_capacity.csv","w",newline="") as fh:
    w = csv.writer(fh); w.writerow(["month","forecast_units","load_hours","load_pct","planned_output","ending_stock"])
    for row in zip(months_fc, forecast, load_hours, load_pct, plan, end_inv): w.writerow(row)
with open("data/demand_history.csv","w",newline="") as fh:
    w = csv.writer(fh); w.writerow(["month","units"]); w.writerows(zip(months_hist, demand))
print(json.dumps(out))
