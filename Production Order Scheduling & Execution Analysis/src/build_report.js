const fs = require('fs');
const d = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, LevelFormat, BorderStyle, PageBreak, Bookmark, InternalHyperlink, Tab, TabStopType, LeaderType, Footer, PageNumber, ImageRun } = d;
const R = JSON.parse(fs.readFileSync('data/results.json'));
const FONT = "Calibri", NAVY = "1F3864", GREY = "F2F2F2";
const inr = n => "Rs " + Math.round(n).toLocaleString("en-IN");
const T = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 22, ...o });
const B = (t, o = {}) => T(t, { bold: true, ...o });
const P = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: Array.isArray(t) ? t : [T(t)] });
const heads = [];
const PAGES = fs.existsSync('toc_pages.json') ? JSON.parse(fs.readFileSync('toc_pages.json')) : {};
const mkH = (lvl, hl) => t => { const id = 'h' + heads.length; heads.push({ lvl, t, id }); return new Paragraph({ heading: hl, children: [new Bookmark({ id, children: [new TextRun({ text: t, font: FONT })] })] }); };
const H1 = mkH(1, HeadingLevel.HEADING_1);
const H2 = mkH(2, HeadingLevel.HEADING_2);
const bul = (t, lead) => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60 }, children: lead ? [B(lead + " "), T(t)] : [T(t)] });
const cap = t => P([T(t, { italics: true, size: 18, color: "595959" })], { spacing: { after: 200 } });
function table(widths, header, rows, hl) {
  const total = widths.reduce((a, b) => a + b, 0);
  const bd = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
  const borders = { top: bd, bottom: bd, left: bd, right: bd };
  const cell = (txt, w, hdr, i, red) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, fill: hdr ? NAVY : (red ? "FBE5E2" : (i % 2 ? GREY : "FFFFFF")), color: "auto" },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(txt), font: FONT, size: 19, bold: hdr, color: hdr ? "FFFFFF" : "000000" })] })]
  });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], true, 0)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false, ri, hl && hl(r))) }))] });
}
function fig(file, wpx = 610) {
  const buf = fs.readFileSync("figures/" + file);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: false,
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: wpx, height: Math.round(wpx * h / w) }, altText: { title: file, description: file, name: file } })] });
}

const c = [];
// ---------------- Title ----------------
c.push(new Paragraph({ spacing: { before: 2600, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAP PP Production Planning Analyst Virtual Internship", font: FONT, size: 26, color: "595959" })] }));
c.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Week 3: Production Order Scheduling & Execution Analysis", font: FONT, size: 48, bold: true, color: NAVY })] }));
c.push(new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 8 } }, children: [new TextRun({ text: "Case study: Vertex Mobility Pvt. Ltd. (hypothetical electric two-wheeler manufacturer)", font: FONT, size: 24, italics: true })] }));
["Prepared by: [Your Name]", "Role: SAP PP Production Planning Analyst Intern", "Date: October 2026"].forEach(t => c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T(t)] })));
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", font: FONT, size: 32, bold: true, color: NAVY })] }));
const TOCPOS = c.length;
c.push(new Paragraph({ children: [new PageBreak()] }));

// ---------------- 1 Introduction ----------------
const M = R.main, RB = R.robust, F = M["FIFO (as-is)"], PR = M["Proposed"], PO = M["Proposed + overtime"];
const pct = (a, b) => Math.round(100 * (a - b) / a);
const nOrd = R.orders.length;
c.push(H1("1. Introduction"));
c.push(H2("1.1 Purpose"));
c.push(P("Weeks 1 and 2 of this internship produced a planning strategy and a clean master data foundation for Vertex Mobility. Week 3 moves to the execution phase: how production orders are scheduled, sequenced, released and completed on the shop floor. A plan is only valuable if it is executed on time, so this report analyses how production order scheduling works in SAP PP, simulates a shop floor in which typical scheduling problems occur, identifies the bottlenecks, and proposes practical improvements to order prioritisation and resource use."));
c.push(H2("1.2 Executive summary"));
c.push(P("A discrete-event simulation of Vertex Mobility's shop floor was built, with six work centres, multi-level production orders and three disruptions (a line breakdown, a late controller delivery and a rush order). The order set contains " + nOrd + " production orders for " + R.total_qty + " vehicles over a 12-working-day window. Main findings:"));
c.push(bul("The battery assembly line (BATT-ASM) is loaded at " + R.load.BATT.pct + "% of capacity, while every other work centre is between " + R.load.WHL.pct + "% and " + R.load.FIN.pct + "%. It is the bottleneck, and it decides when orders finish.", "Bottleneck:"));
c.push(bul("Under first-in-first-out dispatching (the as-is practice), " + Math.round(F.late_pct) + "% of orders finish late, the average queue time at BATT-ASM is " + R.wait["FIFO (as-is)"].BATT.toFixed(0) + " hours, and queue time makes up " + Math.round(100 * R.comp["FIFO (as-is)"].queue / (R.comp["FIFO (as-is)"].queue + R.comp["FIFO (as-is)"].setup + R.comp["FIFO (as-is)"].proc)) + "% of all operation time.", "Waiting dominates:"));
c.push(bul("The proposed sequencing scheme (earliest due date at the bottleneck, grouping of same-model jobs, and priority for rush orders) cut changeover hours by " + pct(F.setup_h, PR.setup_h) + "% and the lateness of the rush order from " + F.rush_late_h.toFixed(0) + " h to " + PR.rush_late_h.toFixed(0) + " h. Over 40 random order sets, it lowered setup time by " + pct(RB["FIFO (as-is)"].setup_h.mean, RB["Proposed"].setup_h.mean) + "% on average.", "Sequencing helps, within limits:"));
c.push(bul("Sequencing alone did not reduce the share of late orders, because the bottleneck is overloaded. Adding a 15% capacity lever (overtime or an extra shift) on the battery line during the peak cut average tardiness by " + pct(RB["FIFO (as-is)"].mean_tard_h.mean, RB["Proposed + overtime"].mean_tard_h.mean) + "% across 40 order sets and by " + pct(F.mean_tard_h, PO.mean_tard_h) + "% in the main run.", "Capacity matters most:"));
c.push(bul("Two ideas that look attractive on paper, a release gate on material availability and a rope limiting work in progress, did not help in this plant and were rejected (Section 7.3).", "Honest negative results:"));
c.push(H2("1.3 Scope and approach"));
c.push(P("The report follows five steps: (1) review public SAP documentation and literature on production order scheduling; (2) build a simulated production environment; (3) measure how the as-is dispatching performs; (4) design and test improvements; and (5) translate the results into SAP configuration and process recommendations. Vertex Mobility, its orders and all numbers are hypothetical. The simulation (src/shop_simulation.py) is included in the repository so that every result can be reproduced."));
c.push(H2("1.4 Report structure"));
c.push(P("Section 2 reviews production order scheduling in SAP PP. Section 3 explains the methodology. Section 4 presents the findings for the as-is schedule. Section 5 summarises the scheduling challenges. Section 6 proposes solutions and Section 7 evaluates them. Sections 8 to 10 cover SAP implementation, risks and a roadmap, and Section 11 concludes with recommendations."));

// ---------------- 2 Literature review ----------------
c.push(H1("2. Production Order Scheduling in SAP PP: Review"));
c.push(H2("2.1 Role of the production order"));
c.push(P("A production order is the SAP document that instructs the plant to produce a quantity of a material in a given period. It is created from a planned order (CO40 or CO41 for conversion) or directly (CO01). On creation, SAP copies the BOM as the component list and the routing as the operation list (Week 2), determines basic dates, schedules operations, checks material and capacity availability and assigns a status. Because the order inherits all master data, the accuracy work of Week 2 directly determines how reliable the schedule is."));
c.push(fig("fig1_order_lifecycle.png", 624));
c.push(cap("Figure 1: Typical production order lifecycle and the main status values (CRTD created, REL released, PCNF partially confirmed, CNF confirmed, DLV delivered, TECO technically complete, CLSD closed)."));
c.push(H2("2.2 Scheduling types and date logic"));
c.push(P("SAP calculates order dates by lead-time scheduling. For every operation, the system adds queue time, setup time, processing time, teardown time, wait time and move time, converted to calendar dates with the working-time calendar of the work centre. Operation dates are then rolled up into scheduled start and finish dates for the order."));
c.push(table([2300, 7060], ["Concept", "Explanation"], [
  ["Forward scheduling", "Starts from a fixed basic start date and calculates the finish date; used when the earliest completion is needed"],
  ["Backward scheduling", "Starts from the due date (basic finish) and calculates the latest start; the usual choice for make-to-stock and customer-driven orders"],
  ["Current date scheduling", "Used when the calculated start date lies in the past; the system starts today and reports the delay"],
  ["Basic dates", "Dates from the planned order or entered at order creation; the target window"],
  ["Scheduled dates", "Dates calculated from the routing operation times; they can differ from basic dates by the floats"],
  ["Scheduling margin key", "Holds the float before production, float after production and release period (days); these margins absorb disturbance"],
  ["Reduction levels", "Stepwise shortening of queue, wait and move times (and floats) when scheduled dates do not fit the basic dates"],
  ["Overlapping and splitting", "Overlapping starts the next operation before the previous one is complete; splitting spreads one operation over several machines to cut lead time"],
  ["Scheduling parameters", "Configured per plant and order type, for example whether to schedule with capacity requirements and which scheduling type is the default"]
]));
c.push(cap("Table 1: Key scheduling concepts in SAP PP (SAP Help Portal and training material)."));
c.push(fig("fig2_scheduling_anatomy.png", 624));
c.push(cap("Figure 2: Operation times and order dates. The floats are buffers between basic and scheduled dates."));
c.push(H2("2.3 Capacity planning and sequencing in SAP"));
c.push(P("Scheduling determines when an operation should run; capacity planning checks whether the work centre has the capacity to do it. Capacity requirements are generated when the order is created or scheduled and are evaluated in the capacity evaluation (CM01) for load and in the capacity planning table (CM21) for interactive levelling. The planning table can be used to drag operations, change the sequence and reschedule. Capacity levelling can also be run in the background. For orders with sequence-dependent setups (such as battery model changes), SAP PP offers sequencing logic in the planning table, and the optional Production Planning and Detailed Scheduling component (PP-DS) provides optimisation algorithms and heuristics for advanced detailed scheduling. This report assumes standard PP functionality and treats the dispatch rules proposed later as logic that planners apply in the planning table, or that could be implemented through enhancements or PP-DS."));
c.push(H2("2.4 Release, execution and control"));
c.push(bul("Orders are released individually (CO02) or collectively (CO05N, or mass processing in COHV). Release makes shop papers available and allows goods issue; only released orders can be confirmed.", "Release."));
c.push(bul("Before release, material availability is checked (for example with CO09 and the missing parts information system CO24), so that planners do not start orders that cannot be finished.", "Availability."));
c.push(bul("Confirmations (CO11N for single, CO12 for collective) post yield, scrap, hours and finish status per operation. They update capacity load, actual dates and costs.", "Confirmation."));
c.push(bul("The production order information system (COOIS) lists orders by status, work centre or date; exception messages in MD04 and MD07 show reschedule or cancel recommendations.", "Monitoring."));
c.push(bul("After the last confirmation and goods receipt, the order is set to technically complete (TECO), settled (KO88) and closed.", "Completion."));
c.push(H2("2.5 Common scheduling problems in the literature"));
c.push(table([2600, 6760], ["Problem", "Typical cause and impact"], [
  ["Capacity ignored by MRP", "MRP assumes infinite capacity, so planned orders can overload work centres and create queues; capacity must be checked afterwards"],
  ["Bottleneck starvation or flooding", "Too little work at the constraint loses output; too much work in front of it raises work in progress and lead time"],
  ["Inaccurate lead-time data", "Fixed queue and move times in the routing do not reflect actual waiting; scheduled dates are unrealistic"],
  ["Frequent changeovers", "Sequence-dependent setup time reduces productive capacity when jobs are run in arrival order"],
  ["Disruptions", "Breakdowns, late materials and rush orders break the plan; without re-planning, delays cascade through the network"],
  ["Poor shop-floor feedback", "Late or batch confirmations mean planners work from stale status and capacity load"]
]));
c.push(cap("Table 2: Typical scheduling problems."));
c.push(P("Dispatching rules are a well-studied response. First-in-first-out (FIFO) processes jobs in arrival order. Earliest due date (EDD) sorts by due date and minimises maximum lateness on a single resource. Shortest processing time (SPT) minimises average flow time but can delay long jobs indefinitely. Critical ratio (CR) compares the time remaining to the work remaining. Least slack uses due date minus remaining work. The theory of constraints (drum-buffer-rope) argues that the bottleneck sets the pace of the whole system: the schedule is built around the constraint, with a buffer in front of it and a release limit (the rope) upstream. These ideas are tested in Section 7."));
c.push(H2("2.6 Key transaction codes"));
c.push(table([2700, 3000, 3660], ["Activity", "T-code / app", "Use in this report"], [
  ["Convert planned order", "CO40, CO41", "Create production orders from MRP proposals"],
  ["Create / change / display order", "CO01, CO02, CO03", "Maintain dates, release, set TECO"],
  ["Collective release / mass processing", "CO05N, COHV", "Release, reschedule or TECO many orders at once"],
  ["Capacity evaluation", "CM01", "Load per work centre"],
  ["Capacity planning table, levelling", "CM21, CM25", "Sequence operations and level load"],
  ["Material availability", "CO09, CO24", "Check shortages before release"],
  ["Confirmation", "CO11N, CO12", "Post progress and actual times"],
  ["Order information system", "COOIS", "Dispatch lists and status reports"],
  ["Stock / requirements list", "MD04, MD07", "Exception messages and rescheduling"],
  ["Settlement", "KO88", "Close the order and settle variances"]
]));
c.push(cap("Table 3: Production order scheduling transactions (names as commonly cited; menu paths differ slightly between SAP ECC and S/4HANA)."));

// ---------------- 3 Methodology ----------------
c.push(H1("3. Methodology"));
c.push(H2("3.1 Overview"));
c.push(P("The study uses a simulation because real SAP production data is not available in a virtual internship. A simulation allows different scheduling rules to be tested on exactly the same orders and disruptions, which is not possible on a real shop floor. The method has five stages: define the plant model, generate an order set with disruptions, simulate the as-is dispatching, design and test improvements, and evaluate with several performance measures."));
c.push(H2("3.2 The simulated plant"));
c.push(P("The plant is Vertex Mobility's assembly shop. Each work centre has a number of identical machines or lines, a processing time per vehicle (taken from routing standard times, with BATT-ASM at 0.50 h per pack as corrected in Week 2) and a changeover time when the vehicle model changes. Work runs two 8-hour shifts per day (16 working hours)."));
c.push(table([1700, 1500, 1800, 1800, 2560], ["Work centre", "Machines", "Hours per vehicle", "Model change (h)", "Role"], [
  ["WELD-01", "3", "0.60", "0", "Frame welding"],
  ["PAINT-01", "1", "0.20", "1.0", "Powder coating"],
  ["PWR-ASM", "3", "0.55", "1.0", "Powertrain assembly"],
  ["BATT-ASM", "2", "0.50", "1.5", "Battery pack assembly (bottleneck)"],
  ["WHL-ASM", "2", "0.35", "0.5", "Wheel assembly"],
  ["FIN-ASM", "5", "1.00", "0.5", "Final assembly"]
]));
c.push(cap("Table 4: Work centres. Processing time is multiplied by 1.15 for VX-Pro and 1.30 for VX-Max, and varies randomly by -5% to +10% per operation."));
c.push(P("Each production order is a vehicle lot. Its routing is a network, shown in Figure 3: frame welding followed by painting, plus powertrain, battery and wheel assembly in parallel, all feeding final assembly. Final assembly can start only when all four branches are complete. This mirrors the multi-level BOM of Week 2, where each assembly has its own production order."));
c.push(fig("fig3_order_network.png", 580));
c.push(cap("Figure 3: Order network of one lot."));
c.push(H2("3.3 Order set and disruptions"));
c.push(bul("The main order set has " + nOrd + " production orders (including one rush order) for " + R.total_qty + " vehicles: 60% VX-Lite, 28% VX-Pro and 12% VX-Max. Lot sizes are 20 to 45 vehicles. Release dates are spread over 10 days, and due dates fall 6 to 8 days after release.", "Orders."));
c.push(bul("On day 4, one battery line fails for 8 hours (it stops after finishing its current job).", "Breakdown."));
c.push(bul("Controller shipments arrive 24 hours late for orders released on days 5 to 7, so the powertrain operation of those orders cannot start on time.", "Missing material."));
c.push(bul("A dealer rush order for 25 VX-Max scooters is released on day 7 with a due date 3.5 days later.", "Rush order."));
c.push(H2("3.4 Scenarios compared"));
c.push(table([2400, 6960], ["Scenario", "Rule"], [
  ["FIFO (as-is)", "Each work centre processes jobs in the order they arrive in its queue; all orders are released on their MRP date"],
  ["EDD", "Earliest due date first at every work centre"],
  ["SPT", "Shortest processing time first"],
  ["Critical ratio", "Smallest ratio of time to due date divided by remaining work first"],
  ["Proposed", "Bottleneck-centred sequence: EDD at every work centre; at changeover work centres jobs of the same model are grouped when due dates are within 16 hours; rush orders are served first (Figure 9)"],
  ["Proposed + overtime", "As Proposed, plus a 15% capacity increase on the battery line from day 4 to day 9 (overtime or an extra shift)"]
]));
c.push(cap("Table 5: Scenarios."));
c.push(H2("3.5 Performance measures"));
c.push(bul("Percentage of orders finishing after their due date, and mean and maximum tardiness (hours late).", "Delivery performance:"));
c.push(bul("Mean flow time (completion minus planned release), average queue time per work centre and share of queue in total operation time.", "Lead time:"));
c.push(bul("Total changeover hours, battery line utilisation, makespan and average work in progress (orders in the system).", "Resource use:"));
c.push(H2("3.6 Evaluation design"));
c.push(P("To avoid choosing a scheme that merely fits one data set, the design of the proposed scheme was studied on 25 training order sets (seeds 1 to 25). The final comparison uses 40 different test order sets (seeds 100 to 139) and one detailed main case (seed 42) used for the figures. Results are reported as mean and standard deviation across the test sets."));
c.push(H2("3.7 Assumptions and limitations"));
c.push(bul("Data is synthetic. Findings show how methods compare in a plausible plant; they are not predictions for a real plant."));
c.push(bul("FIFO is used as the as-is practice; a real SAP system would sort by dates and planner decisions."));
c.push(bul("Operators, tools, transport and quality rework are not modelled; breakdown and shortage are single, scheduled events."));
c.push(bul("The overtime effect (+15% output) is an assumption; its cost is not valued here."));

// ---------------- 4 Findings ----------------
c.push(H1("4. Findings: The As-Is Schedule"));
c.push(H2("4.1 Load versus capacity"));
c.push(P("Figure 4 compares the total hours required at each work centre with the capacity of the 12-day window. Battery assembly is at " + R.load.BATT.pct + "%. All others have spare capacity of 14% or more. Even a perfect schedule cannot complete all battery work inside the window; the only question is which orders absorb the shortfall."));
c.push(fig("fig4_load_capacity.png", 520));
c.push(cap("Figure 4: Load versus capacity."));
c.push(H2("4.2 Performance with FIFO dispatching"));
c.push(table([3600, 2000, 3760], ["Measure (main run, FIFO)", "Value", "Comment"], [
  ["Orders finished late", Math.round(F.late_pct) + "% (" + Math.round(F.late_pct * nOrd / 100) + " of " + nOrd + ")", "Includes the rush order"],
  ["Mean tardiness per order", F.mean_tard_h.toFixed(1) + " h", "Averaged over all orders"],
  ["Maximum tardiness", F.max_tard_h.toFixed(1) + " h", "The rush order, which waited behind earlier arrivals"],
  ["Mean flow time", F.mean_flow_h.toFixed(0) + " h", "About " + (F.mean_flow_h / 16).toFixed(1) + " working days from release"],
  ["Changeover hours (all work centres)", F.setup_h.toFixed(1) + " h", "Models run in arrival order"],
  ["Battery line utilisation", F.batt_util.toFixed(0) + "%", "Share of the 12-day window used for processing"],
  ["Makespan", F.makespan_h.toFixed(0) + " h", "Last order finishes after about " + (F.makespan_h / 16).toFixed(1) + " working days"]
]));
c.push(cap("Table 6: As-is performance (main order set)."));
c.push(H2("4.3 Where the time goes"));
c.push(fig("fig7_queue_time.png", 600));
c.push(cap("Figure 7: Queue time by work centre and composition of operation time under FIFO."));
c.push(P("Nearly half of all operation time is waiting. The battery line has by far the longest average queue, " + R.wait["FIFO (as-is)"].BATT.toFixed(0) + " hours per operation, more than twice that of any other work centre. Changeovers are only about 1% of the time but they are concentrated on the bottleneck, where each lost hour delays every later order. The routing in SAP typically stores fixed queue times; the data shows that the real queue is highly variable and depends on load, so fixed values will not predict dates reliably."));
c.push(H2("4.4 The bottleneck schedule"));
c.push(fig("fig5_gantt.png", 624));
c.push(cap("Figure 5: Battery line schedule, as-is versus proposed. Numbers in the bars are order numbers; hatched blocks are model changeovers."));
c.push(P("In the FIFO schedule (top), models alternate in arrival order, producing many changeovers; the rush order starts only after the jobs ahead of it are finished. Both battery lines run continuously past the end of the 12-day window (dotted line), confirming overload. The breakdown on line 1 on day 4 removes 8 hours of already scarce capacity."));
c.push(H2("4.5 Effect of the disruptions"));
const D = R.disruptions;
c.push(table([3000, 1500, 1700, 1500, 1660], ["Case (main order set)", "FIFO late %", "FIFO mean tardiness (h)", "Proposed late %", "Proposed mean tardiness (h)"],
  Object.keys(D).map(k => [k, D[k]["FIFO (as-is)"].late_pct, D[k]["FIFO (as-is)"].mean_tard_h, D[k]["Proposed"].late_pct, D[k]["Proposed"].mean_tard_h])));
c.push(cap("Table 7: Disruption analysis (source: data/results.json). Each row removes or changes one disruption."));
c.push(bul("Without any disruption, FIFO still finishes " + D["No disruptions"]["FIFO (as-is)"].late_pct + "% of orders late. The root cause is the 108% load, not the disruptions.", "Structural overload."));
c.push(bul("Removing the breakdown lowers mean tardiness from " + D["All three disruptions"]["FIFO (as-is)"].mean_tard_h + " h to " + D["No breakdown"]["FIFO (as-is)"].mean_tard_h + " h; a 16-hour breakdown raises it to " + D["16 h breakdown"]["FIFO (as-is)"].mean_tard_h + " h. Each breakdown hour on the bottleneck costs real output.", "Breakdown."));
c.push(bul("The 24-hour controller delay changed nothing in the main run, because the powertrain branch has float and the delay was absorbed before final assembly. Missing materials matter mostly on the critical (bottleneck) path.", "Missing material."));
c.push(bul("Removing the rush order lowers mean tardiness from " + D["All three disruptions"]["FIFO (as-is)"].mean_tard_h + " h to " + D["No rush order"]["FIFO (as-is)"].mean_tard_h + " h, because an uncontrolled rush order pushes regular orders back.", "Rush order."));
c.push(H2("4.6 Worked example: lead-time scheduling of one order"));
c.push(P("To connect the simulation to SAP logic, the table below schedules a sample battery pack order (40 packs of VX-Lite) backward from a due date at the end of working day 8. Operation times follow the routing (0.30 + 0.12 + 0.08 = 0.50 h per pack). Floats are 16 h before and 8 h after production."));
const ops = [["10 Cell stacking and welding", "BATT-ASM", 8, 1.5, 12, 0, 1], ["20 BMS install and strapping", "BATT-ASM", 2, 0, 4.8, 0, 1], ["30 Functional test", "TEST-01", 4, 0.5, 3.2, 2, 1]];
let totLT = 0; const opRows = ops.map(o => { const lt = o[2] + o[3] + o[4] + o[5] + o[6]; totLT += lt; return [o[0], o[1], o[2], o[3], o[4], o[5] + o[6], lt.toFixed(1)]; });
c.push(table([2600, 1300, 900, 900, 1200, 1100, 1360], ["Operation", "Work centre", "Queue (h)", "Setup (h)", "Processing (h)", "Wait + move (h)", "Operation lead time (h)"], opRows.concat([["Total", "", "", "", "", "", totLT.toFixed(1)]])));
c.push(cap("Table 8: Operation lead times for a sample order (hypothetical routing data)."));
const dueH = 128, schedFin = dueH - 8, schedStart = schedFin - totLT, basicStart = schedStart - 16;
const clock = h => "Day " + (Math.floor(h / 16) + 1) + ", " + String(6 + Math.floor((h % 16))).padStart(2, "0") + ":" + String(Math.round((h % 1) * 60)).padStart(2, "0");
c.push(table([3300, 2000, 4060], ["Date", "Value", "How it is derived"], [
  ["Basic finish (due date)", "End of day 8 (" + dueH + " h)", "Required date from the planned order"],
  ["Scheduled finish", clock(schedFin), "Basic finish less 8 h float after production"],
  ["Scheduled start", clock(schedStart), "Scheduled finish less total operation lead time of " + totLT.toFixed(1) + " h (" + (totLT / 16).toFixed(1) + " working days)"],
  ["Basic start", clock(basicStart), "Scheduled start less 16 h float before production"],
  ["Lead time with 50% reduction of queue, wait and move", (totLT - 0.5 * (14 + 2 + 3)).toFixed(1) + " h", "Queue 14 h, wait 2 h, move 3 h reduced by half to recover " + (0.5 * 19).toFixed(1) + " h when dates are tight"]
]));
c.push(cap("Table 9: Backward scheduling of the sample order (working day = 16 h; day 1 starts at 06:00)."));
c.push(P("The sample shows how much of the lead time is not processing: of " + totLT.toFixed(1) + " hours, only 20.0 are processing. Queue, wait and move time are set in the routing, so they are the first place to look when scheduled dates do not match reality."));

// ---------------- 5 Challenges ----------------
c.push(H1("5. Scheduling Challenges Identified"));
c.push(table([2300, 3600, 3460], ["Challenge", "Evidence from the simulation", "Symptom in SAP"], [
  ["Capacity bottleneck at battery assembly", "108% load; queue of " + R.wait["FIFO (as-is)"].BATT.toFixed(0) + " h; line busy beyond the 12-day window", "CM01 shows overload; dates slip although MRP dates look feasible"],
  ["Arrival-order sequencing", FIFO_late_text(), "Orders released and dispatched by MRP date, not due date or constraint"],
  ["Changeover losses", "Total of " + F.setup_h.toFixed(0) + " h of changeovers; model alternates on the bottleneck", "No sequencing by model family in the planning table"],
  ["Uncontrolled rush orders", "Rush order " + F.rush_late_h.toFixed(0) + " h late and pushes other orders back", "Priority managed by phone or message, not by rule"],
  ["Breakdown without re-planning", "8 h outage on the bottleneck adds about " + (D["All three disruptions"]["FIFO (as-is)"].mean_tard_h - D["No breakdown"]["FIFO (as-is)"].mean_tard_h).toFixed(1) + " h of mean tardiness", "Capacity load not refreshed; planned dates stay unchanged"],
  ["Material shortage found late", "Powertrain operation waits for controllers; non-critical in this run but critical when it hits the bottleneck path", "Missing-part checks (CO09, CO24) not run before release"],
  ["Fixed queue times in routings", "Real average queue between " + Math.min(...Object.values(R.wait["FIFO (as-is)"])).toFixed(1) + " h and " + Math.max(...Object.values(R.wait["FIFO (as-is)"])).toFixed(0) + " h by work centre", "Scheduled dates unrealistic; unreliable promised dates"]
]));
c.push(cap("Table 10: Challenges, evidence and SAP symptoms."));

// ---------------- 6 Solutions ----------------
c.push(H1("6. Proposed Solutions"));
c.push(P("The solutions follow one idea: manage the bottleneck first, protect it from disruption, and use rules, not phone calls, to decide priorities. Figure 8 shows the proposed process for scheduling and executing orders."));
c.push(fig("fig8_to_be_process.png", 624));
c.push(cap("Figure 8: Proposed scheduling and execution process."));
c.push(H2("6.1 Order prioritisation"));
c.push(bul("Each order carries a priority class: A rush or customer-critical, B standard with due date, C stock replenishment. Rush orders are placed first at every work centre; they must be approved by the planner so that they do not become the normal case.", "Priority classes."));
c.push(bul("Standard orders are sequenced by earliest due date, not by arrival or MRP date. EDD is easy to explain, easy to implement in the planning table and keeps maximum lateness low.", "Due-date rule."));
c.push(H2("6.2 Bottleneck-centred sequencing"));
c.push(P("The battery line is scheduled first in CM21 using EDD and model grouping, and the rest of the plant is scheduled around it. When two jobs are within 16 hours of due date, the planner prefers the job of the same model as the one just completed, avoiding a 1.5 h changeover. Figure 9 shows the decision when a machine becomes free."));
c.push(fig("fig9_dispatch_logic.png", 600));
c.push(cap("Figure 9: Dispatch logic of the proposed scheme."));
c.push(H2("6.3 Resource optimisation"));
c.push(bul("Plan 15% extra capacity on the bottleneck for peak weeks (overtime, an extra Sunday shift or a third shift), decided in CM01 before orders are released and not after they are late.", "Capacity lever."));
c.push(bul("Reduce changeover time with quick-changeover methods (SMED) on the battery line: cutting the 1.5 h battery changeover to 0.75 h returns capacity directly to the bottleneck and makes grouping less critical.", "Reduce setups."));
c.push(bul("Protect the bottleneck: preventive maintenance at shift change, spare parts for critical equipment, and no breaks for the line (staggered breaks).", "Bottleneck protection."));
c.push(bul("Cross-train operators so that WELD, WHL and PWR staff can support BATT in peaks.", "Flexible labour."));
c.push(bul("Subcontract part of battery assembly in the festive season, as already suggested in Week 1.", "External capacity."));
c.push(H2("6.4 Execution discipline"));
c.push(bul("Release orders through a daily dispatch list per work centre from COOIS, ordered by the proposed rule.", "Dispatch list."));
c.push(bul("Confirm every shift with CO11N so load, yield and actual times are current; use collective confirmation (CO12) where operations are short.", "Timely confirmations."));
c.push(bul("Check material availability (CO09, CO24) before releasing orders that use the longest lead-time parts, and give the buyer a missing-part list.", "Availability check."));
c.push(bul("Reschedule after every disruption: after a breakdown or rush order, re-run capacity levelling in CM21 and publish the new dispatch list the same shift.", "Re-plan quickly."));
c.push(H2("6.5 Innovative ideas"));
c.push(bul("Before the weekly release, run the Python simulation (src/shop_simulation.py) on the actual order list to preview lateness and test the effect of overtime. This is a low-cost digital twin for what-if planning.", "Simulation before release."));
c.push(bul("Replace fixed routing queue times with values estimated from actual start-minus-ready times in confirmations, refreshed monthly.", "Learned queue times."));
c.push(bul("Show a buffer-status colour for each order (green, amber, red) based on consumed slack and send an alert when the bottleneck queue falls below two jobs (starvation) or exceeds a limit.", "Buffer management."));
c.push(bul("Create a standard rush-order procedure that quotes the expected delay to other orders before the rush is accepted, so the commercial team sees the cost.", "Rush-order impact quote."));
c.push(bul("Group orders into model families in the planning table (for example by a characteristic or order text) to make same-model grouping a one-click filter.", "Family grouping in the planning table."));

// ---------------- 7 Evaluation ----------------
c.push(H1("7. Evaluation of the Proposed Solutions"));
c.push(H2("7.1 Main run"));
const rowsMain = Object.keys(M).map(n => [n, M[n].late_pct.toFixed(0) + "%", M[n].mean_tard_h.toFixed(1), M[n].max_tard_h.toFixed(0), M[n].setup_h.toFixed(1), M[n].mean_flow_h.toFixed(0), M[n].rush_late_h.toFixed(0)]);
c.push(table([2200, 1100, 1400, 1400, 1100, 1000, 1160], ["Scenario", "Late orders", "Mean tardiness (h)", "Max tardiness (h)", "Setup (h)", "Flow (h)", "Rush late (h)"], rowsMain, r => r[0].startsWith("Proposed")));
c.push(cap("Table 11: Main order set (source: data/scenario_results.csv). Shaded rows are the proposed scenarios."));
c.push(P("In the main run, the proposed sequence matches FIFO on late orders but reduces changeover time by " + pct(F.setup_h, PR.setup_h) + "%, shortens the rush order delay from " + F.rush_late_h.toFixed(0) + " h to " + PR.rush_late_h.toFixed(0) + " h and shortens the makespan by " + (F.makespan_h - PR.makespan_h).toFixed(0) + " h because the saved setup time becomes output. SPT has the fewest late orders (" + Math.round(M["SPT"].late_pct) + "%) but its maximum tardiness is " + M["SPT"].max_tard_h.toFixed(0) + " h, because it keeps postponing the long jobs. That is unacceptable for customers. With overtime, late orders fall to " + Math.round(PO.late_pct) + "% and mean tardiness to " + PO.mean_tard_h.toFixed(1) + " h."));
c.push(H2("7.2 Robustness over 40 order sets"));
c.push(fig("fig6_rule_comparison.png", 624));
c.push(cap("Figure 6: Dispatch rules compared across 40 random order sets."));
c.push(table([2500, 1700, 1700, 1700, 1760], ["Scenario", "Late orders (%)", "Mean tardiness (h)", "Setup (h)", "Mean flow (h)"],
  Object.keys(RB).map(n => [n, RB[n].late_pct.mean + " (sd " + RB[n].late_pct.sd + ")", RB[n].mean_tard_h.mean + " (sd " + RB[n].mean_tard_h.sd + ")", RB[n].setup_h.mean + " (sd " + RB[n].setup_h.sd + ")", RB[n].mean_flow_h.mean + " (sd " + RB[n].mean_flow_h.sd + ")"]), r => r[0].startsWith("Proposed")));
c.push(cap("Table 12: Mean results over 40 test order sets (seeds 100 to 139)."));
c.push(P("Across the test sets, the proposed sequence lowers changeover time by " + pct(RB["FIFO (as-is)"].setup_h.mean, RB["Proposed"].setup_h.mean) + "% and reduces mean tardiness in " + R.robust_wins.tard + " of " + R.robust_wins.runs + " order sets, but it cuts the share of late orders in only " + R.robust_wins.late + " of 40. The average late share (" + RB["Proposed"].late_pct.mean + "%) is slightly higher than FIFO (" + RB["FIFO (as-is)"].late_pct.mean + "%). The honest reading is that sequencing rules are worth having for changeover savings and rush-order control, but they do not solve a capacity shortage. Adding overtime gives the clearest improvement: mean tardiness falls from " + RB["FIFO (as-is)"].mean_tard_h.mean + " h to " + RB["Proposed + overtime"].mean_tard_h.mean + " h and late orders from " + RB["FIFO (as-is)"].late_pct.mean + "% to " + RB["Proposed + overtime"].late_pct.mean + "%. The spread between order sets is large (standard deviations of about 15 percentage points), which means that single-run results should be interpreted with caution."));
c.push(H2("7.3 What did not work"));
c.push(P("Several variants were tested on the 25 training order sets before the final scheme was chosen (Table 13). Reporting rejected ideas is part of the analysis."));
c.push(table([4300, 1250, 1350, 1150, 1310], ["Variant (training sets 1 to 25)", "Late orders (%)", "Mean tardiness (h)", "Flow (h)", "Setup (h)"], R.tuning.map(r => r.map((v, i) => i === 0 ? v : v)), r => r[0].includes("chosen")));
c.push(cap("Table 13: Design study for the proposed scheme (source: data/design_study_training.csv). The chosen variant is shaded."));
c.push(bul("Least slack at all work centres raised the late share (about 45% against 37% with FIFO). In an overloaded system, least slack gives priority to jobs that are already hopeless and delays jobs that could still be saved.", "Least slack:"));
c.push(bul("Holding orders until the controller was available left machines idle while the part was only 24 hours late, and increased lateness.", "Material-availability release gate:"));
c.push(bul("A limit of 96 hours of battery backlog made no material difference (mean tardiness 5.5 h against 5.3 h). Tighter limits increased lateness in exploratory runs, because all four branches of an order are released together and the frame and powertrain branches take longer than the battery branch, so final assembly waits.", "Rope on the bottleneck backlog:"));
c.push(bul("The apparent tardiness cost of grouping rises when the allowed due-date gap is large (48 h): setup falls further but lateness grows. A gap of about one day (16 h) keeps tardiness equal to EDD and still saves about 25% of setup hours compared with FIFO.", "Setup grouping tolerance:"));
c.push(H2("7.4 Implications"));
c.push(bul("Fix the constraint first: capacity levers on the battery line deliver more than any dispatch rule.", "1."));
c.push(bul("Use simple, explainable rules (EDD plus grouping) rather than complex ones: they are robust and easy to apply in the planning table.", "2."));
c.push(bul("Treat release gates cautiously: they must consider the structure of the order network and the time needed by the non-bottleneck branches.", "3."));
c.push(bul("Evaluate on many scenarios: a result on one data set can be misleading because the spread between order sets is large.", "4."));

// ---------------- 8 SAP implementation ----------------
c.push(H1("8. Implementation in SAP PP"));
c.push(table([2700, 3600, 3060], ["Recommendation", "SAP implementation", "Owner"], [
  ["Schedule bottleneck first by due date", "Use CM21 planning table for BATT-ASM; sort operations by due date; save as a variant", "Capacity planner"],
  ["Group same-model jobs", "Filter by material or characteristic; use sequence in the planning table; consider PP-DS or an enhancement for automatic setup-aware sequencing", "Capacity planner / IT"],
  ["Rush-order priority", "Order priority field or priority-based status; approval workflow and standard impact check", "Production manager"],
  ["Realistic lead times", "Maintain queue and move times per work centre from actuals; apply scheduling margin key; use reduction only when needed", "Production planner"],
  ["Capacity lever for peak weeks", "Maintain shift sequences and additional shift models in the work centre; run CM01 for 12 weeks ahead", "Plant manager"],
  ["Material availability before release", "CO09 and CO24 check in the release routine for long lead-time components", "MRP controller"],
  ["Daily dispatch list", "COOIS layout per work centre with sort order; scheduled spool or Fiori list", "Shop-floor supervisor"],
  ["Timely confirmations", "CO11N at each shift end; target of 95% of operations confirmed within one shift", "Supervisors"],
  ["Mass changes after disruption", "COHV mass rescheduling and release; rerun CM21 levelling", "Production planner"],
  ["Simulation before release", "Run src/shop_simulation.py on the weekly order list (outside SAP)", "Planning analyst"]
]));
c.push(cap("Table 14: Mapping recommendations to SAP functionality."));
c.push(H2("8.1 KPIs"));
c.push(table([3200, 2000, 2000, 2160], ["KPI", "Baseline (simulation)", "Target", "Review"], [
  ["On-time order completion", (100 - Math.round(RB["FIFO (as-is)"].late_pct.mean)) + "%", ">= 85%", "Weekly"],
  ["Mean tardiness per late order", "see Table 12", "-30%", "Weekly"],
  ["Battery line changeover hours", RB["FIFO (as-is)"].setup_h.mean + " h per 12 days", "-25%", "Weekly"],
  ["Bottleneck load (CM01)", R.load.BATT.pct + "%", "<= 100% (with levers)", "Daily"],
  ["Rush-order lateness", F.rush_late_h.toFixed(0) + " h", "<= 16 h", "Per order"],
  ["Operations confirmed within one shift", "Not measured", ">= 95%", "Weekly"],
  ["Plan stability (orders rescheduled after release)", "Not measured", "<= 10%", "Monthly"],
  ["Bottleneck breakdown hours", "8 h in window", "-50%", "Monthly"]
]));
c.push(cap("Table 15: KPI set for production order scheduling."));

// ---------------- 9 Risks ----------------
c.push(H1("9. Risks and Mitigation"));
c.push(table([2600, 900, 2900, 2960], ["Risk", "Rating", "Mitigation", "Second-level recommendation"], [
  ["Overtime not available or too costly", "High", "Negotiate extra-shift roster in advance", "Subcontract battery assembly; add a third line business case"],
  ["Planners ignore the rule", "Medium", "Dispatch list and training", "Tie planner KPIs to on-time delivery; weekly review of exceptions"],
  ["Rush orders become routine", "High", "Approval and impact quote", "Charge expedite fees; keep a protected capacity reserve of about 5%"],
  ["Confirmations late or wrong", "Medium", "Shift-end confirmation rule", "Barcode or MES terminals; automatic backflush for repetitive lines"],
  ["Master data errors return", "High", "Week 2 audit and governance", "Link routing time review to confirmation variances"],
  ["Simulation results over-trusted", "Medium", "Validate with real data", "Calibrate with actual queue times; repeat the study with SAP order history"],
  ["Breakdown at bottleneck", "High", "Preventive maintenance and spares", "Condition monitoring; maintenance windows outside peak weeks"]
]));
c.push(cap("Table 16: Risk register."));

// ---------------- 10 Roadmap ----------------
c.push(H1("10. Implementation Roadmap"));
c.push(table([1700, 1500, 6160], ["Phase", "Timing", "Activities"], [
  ["1. Quick wins", "Weeks 1-2", "Daily dispatch list in COOIS; rush-order approval rule; shift-end confirmation; weekly bottleneck load review in CM01"],
  ["2. Sequencing", "Weeks 3-6", "EDD sequence and family grouping in the CM21 planning table; planner training; measure setup hours"],
  ["3. Capacity", "Weeks 5-10", "Peak capacity levers (shift model, overtime roster, subcontractor qualification); SMED on battery line"],
  ["4. Data", "Weeks 7-12", "Replace fixed queue and move times by actual averages; review scheduling margin keys"],
  ["5. Automation", "Weeks 12-24", "Simulation before release; buffer-status alerts; evaluate PP-DS for automatic sequencing"],
  ["6. Sustain", "Ongoing", "KPI reviews, quarterly re-calibration, lessons learned from rush orders and breakdowns"]
]));
c.push(cap("Table 17: Implementation roadmap."));

// ---------------- 11 Conclusion ----------------
c.push(H1("11. Conclusions and Recommendations"));
c.push(P("This report analysed production order scheduling and execution for Vertex Mobility using a simulation grounded in SAP PP concepts. The main conclusion is that the plant's delivery problems start with a capacity constraint: the battery assembly line is loaded at " + R.load.BATT.pct + "% while everything else has spare capacity. Waiting for that constraint accounts for most of the lead time. Scheduling rules matter, but they change how a shortage is shared, not whether it exists."));
c.push(P("Recommendations, in order of priority:"));
c.push(bul("Add capacity at the bottleneck during peak weeks (a 15% lever cut mean tardiness by about " + pct(RB["FIFO (as-is)"].mean_tard_h.mean, RB["Proposed + overtime"].mean_tard_h.mean) + "% across 40 order sets).", "1."));
c.push(bul("Sequence the bottleneck by earliest due date with same-model grouping; expect about " + pct(RB["FIFO (as-is)"].setup_h.mean, RB["Proposed"].setup_h.mean) + "% fewer changeover hours.", "2."));
c.push(bul("Handle rush orders by rule: priority approval, impact quote and first place in the queue (rush lateness fell from " + F.rush_late_h.toFixed(0) + " h to " + PR.rush_late_h.toFixed(0) + " h).", "3."));
c.push(bul("Re-plan after every disruption and keep confirmations current so that capacity load reflects reality.", "4."));
c.push(bul("Replace fixed queue times in routings with measured values and keep the Week 2 data governance in place.", "5."));
c.push(bul("Use simulation before release for what-if tests; validate it with real SAP order history when available.", "6."));
c.push(P("Together with the Week 1 planning strategy and the Week 2 master data framework, these measures form a complete chain from plan to data to execution. Week 4 can build on it by measuring performance and closing the loop with analytics."));

// ---------------- 12 References ----------------
c.push(H1("12. References"));
["SAP Help Portal: Production Orders, Scheduling, Capacity Planning and Capacity Leveling documentation, help.sap.com.",
 "SAP Learning: Production Planning and Execution training material, learning.sap.com.",
 "Pinedo, M., Scheduling: Theory, Algorithms, and Systems, Springer.",
 "Goldratt, E. and Cox, J., The Goal, North River Press (theory of constraints and drum-buffer-rope).",
 "Vepsalainen, A. and Morton, T., Priority rules for job shops with weighted tardiness costs, Management Science, 1987.",
 "Hopp, W. and Spearman, M., Factory Physics, Waveland Press.",
 "Project repository: src/shop_simulation.py, src/make_diagrams.py and data/*.csv (synthetic data)."].forEach(r => c.push(bul(r)));

// ---------------- Appendix ----------------
c.push(H1("Appendix A: Simulation Details"));
c.push(table([3000, 6360], ["Item", "Description"], [
  ["Model type", "Discrete-event simulation with parallel machines per work centre and a dispatch rule applied when a machine becomes free"],
  ["Time", "Working hours; one day = 16 h (two shifts); 12-day planning window; simulation runs until all orders are finished"],
  ["Orders", "Lot size 20-45; model mix 60% VX-Lite, 28% VX-Pro, 12% VX-Max; due date 6-8 days after release; one rush order"],
  ["Operation time", "Quantity x hours per vehicle x model factor x random factor (0.95-1.10), same random draws in all scenarios"],
  ["Changeover", "Applied when a machine switches model; hours per work centre as in Table 4"],
  ["Breakdown", "Battery line 1, 8 h, starting on day 4 after the current job"],
  ["Missing material", "Controller delivery 24 h late for orders released on days 5-7; delays only the powertrain operation"],
  ["Overtime scenario", "Battery processing 15% faster between day 4 and day 9"],
  ["Training and test sets", "Seeds 1-25 for design; seeds 100-139 for the final comparison; seed 42 for the main run"],
  ["Outputs", "data/scenario_results.csv, schedule_fifo.csv, schedule_proposed.csv, design_study_training.csv, results.json"]
]));
c.push(cap("Table 18: Simulation settings."));
c.push(P([T("Disclaimer: Vertex Mobility and all data are hypothetical and created for this educational assignment.", { italics: true, size: 18 })], { spacing: { before: 200 } }));
function FIFO_late_text() { return Math.round(F.late_pct) + "% of orders late under FIFO; the rush order waits behind earlier arrivals"; }


const tocEntries = () => heads.map(h => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: 9300, leader: LeaderType.DOT }],
  spacing: { before: h.lvl === 1 ? 110 : 0, after: h.lvl === 1 ? 20 : 0, line: 252 },
  indent: { left: h.lvl === 1 ? 0 : 360 },
  children: [new InternalHyperlink({ anchor: h.id, children: [new TextRun({ text: h.t, font: FONT, size: h.lvl === 1 ? 21 : 19, bold: h.lvl === 1, color: h.lvl === 1 ? NAVY : "000000" })] }),
    new TextRun({ children: [new Tab(), String(PAGES[h.t] || "")], font: FONT, size: h.lvl === 1 ? 21 : 19, bold: h.lvl === 1 })] }));
c.splice(TOCPOS, 0, ...tocEntries());
require('fs').writeFileSync('toc_headings.json', JSON.stringify(heads.map(h => h.t)));

const doc = new Document({
  features: { updateFields: true }, creator: "Intern", title: "Week 3 - Production Order Scheduling & Execution Analysis",
  styles: { default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: "2E5597", font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } }] },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1273, right: 1273 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAP PP Internship | Week 3 | Page ", font: FONT, size: 18, color: "7F7F7F" }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "7F7F7F" })] })] }) },
    children: c }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync("docs/Week3_Production_Order_Scheduling_Report.docx", b); console.log("ok"); });
