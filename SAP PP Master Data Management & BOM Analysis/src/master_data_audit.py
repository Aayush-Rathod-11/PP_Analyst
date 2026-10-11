"""
Vertex Mobility - Week 2: master data & BOM audit (synthetic data).
1. Builds a 'dirty' (as-is) and 'clean' (to-be) copy of material master, BOM and routing data
2. Runs rule-based data-quality checks (what a SAP data steward / MDG validation would do)
3. Explodes the BOM for the Oct-26 plan (1,808 VX-Lite) and quantifies the cost of the data errors
Run: python src/master_data_audit.py
"""
import csv, json, re, os
DEMAND = 1808            # VX-Lite, Oct-26 forecast from Week 1
# material: (id, desc, type, base_uom, mrp_type, proc, lt_master, lt_actual, scrap_master, scrap_hist, status, unit_cost)
M = [
 ("VXL-1000","VX-Lite Electric Scooter","FERT","EA","PD","E",0,0,0,0,"A",42000),
 ("VXL-2000","Frame Assembly","HALB","EA","PD","E",0,0,0,0,"A",5200),
 ("VXL-2100","Steel Frame Tube","ROH","EA","PD","F",10,10,0,0,"A",1800),
 ("VXL-2200","Swingarm","ROH","EA","PD","F",12,12,0,0,"A",950),
 ("VXL-2300","Paint Powder","ROH","KG","PD","F",14,14,0,0,"A",620),
 ("VXL-3000","Powertrain Assembly","HALB","EA","PD","E",0,0,0,0,"A",9800),
 ("VXL-3100","Hub Motor 1.5 kW","ROH","EA","PD","F",35,36,0,0,"A",5200),
 ("VXL-3200","Motor Controller","ROH","EA","PD","F",30,84,0,0,"A",3200),
 ("VXL-3300","Wiring Harness","HALB","EA","PD","E",0,0,0,4,"A",780),
 ("VXL-3310","Copper Wire 1.5 sq.mm","ROH","M","PD","F",21,21,0,0,"A",95),
 ("VXL-3320","Connector Set","ROH","EA","PD","F",15,15,0,0,"A",140),
 ("VXL-3400","Controller Mount Bracket","ROH","EA","ND","F",10,10,0,0,"A",210),
 ("VXL-4000","Battery Pack 48V","HALB","EA","PD","E",0,0,0,0,"A",12500),
 ("VXL-4100","Li-ion Cell 21700","ROH","EA","PD","F",45,45,0,0,"A",170),
 ("VXL-4150","BMS Board v1 (obsolete)","ROH","EA","PD","F",28,28,0,0,"O",850),
 ("VXL-4200","BMS Board v2","ROH","EA","PD","F",28,29,0,0,"A",1050),
 ("VXL-4300","Battery Casing","ROH","EA","PD","F",18,18,0,0,"A",480),
 ("VXL-4400","Nickel Strip","ROH","M","PD","F",20,20,0,0,"A",65),
 ("VXL-5000","Wheel Assembly","HALB","EA","PD","E",0,0,0,0,"A",3600),
 ("VXL-5100","Tyre","ROH","EA","PD","F",10,10,0,0,"A",650),
 ("VXL-5200","Alloy Rim","ROH","EA","PD","F",14,14,0,0,"A",1450),
 ("VXL-5300","Brake Disc","ROH","EA","PD","F",12,12,0,0,"A",420),
 ("VXL-6000","Dashboard & Lighting Kit","ROH","EA","PD","F",25,26,0,0,"A",1650),
 ("VXL-6100","Fastener Kit M6-M8","ROH","EA","PD","F",7,7,0,0,"A",320),
 ("VXL-6110","FASTENER KIT M6/M8","ROH","EA","PD","F",7,7,0,0,"A",320),
 ("VXL-6200","Packaging Set","VERP","EA","PD","F",7,7,0,0,"A",380),
]
# BOM: (parent, comp, qty_bom, qty_engineering, uom, valid_to_blank?)
B = [
 ("VXL-1000","VXL-2000",1,1,"EA"),("VXL-1000","VXL-3000",1,1,"EA"),("VXL-1000","VXL-4000",1,1,"EA"),
 ("VXL-1000","VXL-5000",2,2,"EA"),("VXL-1000","VXL-6000",1,1,"EA"),("VXL-1000","VXL-6100",1,1,"EA"),
 ("VXL-1000","VXL-6200",1,1,"EA"),
 ("VXL-2000","VXL-2100",1,1,"EA"),("VXL-2000","VXL-2200",1,1,"EA"),("VXL-2000","VXL-2300",0.35,0.35,"KG"),
 ("VXL-3000","VXL-3100",1,1,"EA"),("VXL-3000","VXL-3200",1,1,"EA"),("VXL-3000","VXL-3300",1,1,"EA"),
 ("VXL-3000","VXL-3400",1,1,"EA"),
 ("VXL-3300","VXL-3310",3.5,3.5,"M"),("VXL-3300","VXL-3320",1,1,"EA"),
 ("VXL-4000","VXL-4100",48,52,"EA"),            # <- error: 48 instead of 52 (13S4P)
 ("VXL-4000","VXL-4150",1,0,"EA"),              # <- error: obsolete BMS v1 still in BOM
 ("VXL-4000","VXL-4200",1,1,"EA"),("VXL-4000","VXL-4300",1,1,"EA"),("VXL-4000","VXL-4400",2.4,2.4,"M"),
 ("VXL-5000","VXL-5100",1,1,"EA"),("VXL-5000","VXL-5200",1,1,"EA"),("VXL-5000","VXL-5300",1,1,"EA"),
]
# routing: (material, op, work centre, std_hrs, actual_hrs)
RT = [("VXL-4000",10,"BATT-ASM",0.30,0.50),("VXL-2000",10,"WELD-01",0.80,0.82),("VXL-3000",10,"PWR-ASM",0.60,0.62),
      ("VXL-5000",10,"WHL-ASM",0.40,0.41),("VXL-1000",10,"FIN-ASM",1.20,1.25)]
WIRE_CONV_MASTER, WIRE_CONV_SUPPLIER = 10, 100     # metres per roll: master vs supplier packaging

def build(clean):
    mm = [list(m) for m in M]
    for m in mm:
        if clean:
            if m[0]=="VXL-3200": m[6]=84                      # lead time corrected
            if m[0]=="VXL-3300": m[8]=4                       # scrap % maintained
            if m[0]=="VXL-3400": m[4]="PD"                    # MRP type corrected
    mm = [m for m in mm if not (clean and m[0] in ("VXL-6110","VXL-4150"))]   # duplicate merged, obsolete blocked
    bom=[]
    for p,c,q,qe,u in B:
        if clean:
            if c=="VXL-4150": continue
            q = qe
        bom.append((p,c,q,qe,u))
    rt=[]
    for m,op,wc,s,a in RT:
        rt.append((m,op,wc,a if (clean and m=="VXL-4000") else s,a))
    conv = WIRE_CONV_SUPPLIER if clean else WIRE_CONV_MASTER
    return mm,bom,rt,conv

def norm(s): return re.sub(r"[^a-z0-9]","",s.lower().replace("/","").replace("-",""))

def audit(mm,bom,rt,conv):
    f=[]; checks=0
    mid={m[0]:m for m in mm}
    for m in mm:
        i,d,t,u,mrp,proc,ltm,lta,scm,sch,st,_=m
        if t in ("ROH",) and proc=="F":
            checks+=1
            if lta and abs(ltm-lta)/lta>0.20: f.append(("R1","Lead-time deviation",i,"Planned delivery time %d d vs actual %d d"%(ltm,lta),"High"))
        checks+=1
        if mrp=="ND" and any(b[1]==i for b in bom): f.append(("R2","MRP type ND on BOM component",i,"Component is in a BOM but excluded from MRP","High"))
        checks+=1
        if st=="O" and any(b[1]==i for b in bom): f.append(("R3","Obsolete material still in active BOM",i,"Status obsolete, no valid-to date","High"))
        checks+=1
        if sch>0 and scm==0: f.append(("R4","Component scrap not maintained",i,"Historical yield loss %.0f%% vs master 0%%"%sch,"Medium"))
    names={}
    for m in mm: names.setdefault(norm(m[1]),[]).append(m[0])
    for n,ids in names.items():
        checks+=1
        if len(ids)>1: f.append(("R5","Possible duplicate material",", ".join(ids),"Same description after normalisation","Medium"))
    for p,c,q,qe,u in bom:
        checks+=1
        if abs(q-qe)>1e-9 and qe>0: f.append(("R6","BOM quantity differs from engineering BOM",p+" > "+c,"BOM %s vs EBOM %s %s"%(q,qe,u),"High"))
    checks+=1
    if conv!=WIRE_CONV_SUPPLIER: f.append(("R7","UoM conversion mismatch","VXL-3310","1 ROL = %d M in master vs %d M supplier pack"%(conv,WIRE_CONV_SUPPLIER),"High"))
    for m,op,wc,s,a in rt:
        checks+=1
        if abs(s-a)/a>0.15: f.append(("R8","Routing standard time deviates from actual",m+" / "+wc,"Std %.2f h vs actual %.2f h"%(s,a),"High"))
    return f,checks

def explode(mm,bom,qty):
    req={}
    def rec(p,q):
        for pp,c,qq,_,_ in bom:
            if pp==p:
                req[c]=req.get(c,0)+q*qq; rec(c,q*qq)
    rec("VXL-1000",qty); return req

def write(name,rows,hdr):
    with open("data/"+name,"w",newline="") as fh:
        w=csv.writer(fh); w.writerow(hdr); w.writerows(rows)

res={}
for tag,clean in (("asis",False),("tobe",True)):
    mm,bom,rt,conv=build(clean)
    f,checks=audit(mm,bom,rt,conv)
    score=round(100*(checks-len(f))/checks,1)
    res[tag]=dict(findings=len(f),checks=checks,score=score,by_rule={})
    for r in f: res[tag]["by_rule"][r[0]]=res[tag]["by_rule"].get(r[0],0)+1
    write("material_master_%s.csv"%tag,[m for m in mm],["material","description","type","base_uom","mrp_type","procurement","lt_master_days","lt_actual_days","scrap_master_pct","scrap_hist_pct","status","unit_cost_inr"])
    write("bom_%s.csv"%tag,bom,["parent","component","qty_bom","qty_engineering","uom"])
    write("routing_%s.csv"%tag,rt,["material","operation","work_center","std_hours","actual_hours"])
    if tag=="asis":
        write("audit_findings.csv",f,["rule","issue","object","detail","severity"]); res["findings_list"]=f
        res["bom_asis"]=bom

# ---- BOM explosion and impact (as-is vs correct) ----
mm_a,bom_a,rt_a,_=build(False); mm_c,bom_c,rt_c,_=build(True)
ra,rc=explode(mm_a,bom_a,DEMAND),explode(mm_c,bom_c,DEMAND)
cost={m[0]:m[11] for m in M}
rows=[(k,round(rc.get(k,0),1),round(ra.get(k,0),1)) for k in sorted(set(ra)|set(rc))]
write("bom_explosion_oct26.csv",rows,["component","correct_requirement","as_is_requirement"])
cells_short=(rc["VXL-4100"]-ra["VXL-4100"])
imp=[]
imp.append(("Battery cell BOM understated (48 vs 52)",cells_short*(170*0.35+15),"%d cells short; emergency buy at +35%% plus Rs 15/cell air freight"%cells_short))
late_veh=round(DEMAND*0.22)
imp.append(("Controller lead time 30 d vs 84 d",late_veh*9*250,"%d vehicles (22%%) delayed ~9 days at Rs 250 per vehicle-day"%late_veh))
load_plan=DEMAND*0.30; load_act=DEMAND*0.50; cap=711.4
imp.append(("Battery routing time 0.30 h vs 0.50 h",(load_act-cap)*2400,"Planned load %.0f h (%.0f%%) vs real %.0f h (%.0f%%); %.0f h unplanned overtime at Rs 2,400/h"%(load_plan,100*load_plan/cap,load_act,100*load_act/cap,load_act-cap)))
imp.append(("Obsolete BMS v1 still in BOM",ra["VXL-4150"]*0+300*850,"300 obsolete boards ordered at Rs 850 before block (write-off risk)"))
imp.append(("Controller bracket set to MRP type ND",4*60000,"4-hour line stop at Rs 60,000/h contribution loss"))
imp.append(("Duplicate fastener kit materials",1200*320*0.18/12,"1,200 kits split across two numbers; monthly carrying cost at 18%% p.a. (capital tied up Rs %s)"%format(1200*320,",")))
imp.append(("Wire UoM conversion (1 ROL = 10 M vs 100 M)",24*600,"10x requisition quantity caught at approval; 24 h buyer rework at Rs 600/h"))
imp.append(("Harness scrap % not maintained (4%)",0.04*DEMAND*3.5*95,"Shortfall of %.0f m copper wire at Rs 95/m"%(0.04*DEMAND*3.5)))
imp=[(a,round(b),c) for a,b,c in imp]
tot=sum(x[1] for x in imp)
write("impact_estimate.csv",imp,["data_error","cost_inr","assumption"])
res.update(impact=imp,total=tot,load=dict(planned_h=round(load_plan,1),actual_h=round(load_act,1),cap=cap),
           requirement=[(k,round(rc.get(k,0),1),round(ra.get(k,0),1)) for k in sorted(set(ra)|set(rc))],demand=DEMAND)
json.dump(res,open("data/results.json","w"),indent=1,default=str)
print(json.dumps({k:res[k] for k in ("asis","tobe","total","load")},indent=1)); print(imp)
