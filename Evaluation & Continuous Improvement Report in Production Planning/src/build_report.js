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
c.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Week 4: Evaluation & Continuous Improvement Report in Production Planning", font: FONT, size: 48, bold: true, color: NAVY })] }));
c.push(new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 8 } }, children: [new TextRun({ text: "Case study: Vertex Mobility Pvt. Ltd. (hypothetical electric two-wheeler manufacturer)", font: FONT, size: 24, italics: true })] }));
["Prepared by: [Your Name]", "Role: SAP PP Production Planning Analyst Intern", "Date: October 2026"].forEach(t => c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T(t)] })));
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", font: FONT, size: 32, bold: true, color: NAVY })] }));
const TOCPOS = c.length;
c.push(new Paragraph({ children: [new PageBreak()] }));

const K = R.kstat, CC = R.cc, I = R.ini, PJ = R.proj, IX = R.index, BC = R.bc;
const lakh = v => "Rs " + v.toFixed(1) + " lakh";
const f1 = v => Number(v).toFixed(1);
const topI = id => I.find(x => x.id === id);
// ---------------- 1 Introduction ----------------
c.push(H1("1. Introduction"));
c.push(H2("1.1 Purpose"));
c.push(P("This is the final report of the SAP PP virtual internship. Week 1 designed a planning strategy, Week 2 built the master data foundation and Week 3 analysed production order scheduling. Week 4 asks a different question: how good is the planning system as a whole, and how can it keep getting better? The report evaluates the current planning processes of the hypothetical manufacturer Vertex Mobility Pvt. Ltd., sets up a KPI framework and proposes a continuous improvement strategy with a roadmap, business case and governance."));
c.push(H2("1.2 Executive summary"));
c.push(P("The evaluation combines the findings of Weeks 1 to 3 with a synthetic twelve-month KPI history (October 2025 to September 2026). The main conclusions are:"));
c.push(bul("Forecast error has averaged " + K.mape.mean + "% (the target is 12%), service level " + K.otif.mean + "% (target 95%), schedule adherence " + K.sched_adh.mean + "% (target 92%) and inventory turns " + K.turns.mean + " (target 6.5). A control chart shows that this performance is stable. The only point outside the limits is the festive month of " + CC.ooc.join(", ") + ". Stable but poor results mean the system itself must change; firefighting month by month will not help.", "Performance:"));
c.push(bul("Average process maturity is about " + (R.maturity.reduce((a, b) => a + b[1], 0) / R.maturity.length).toFixed(1) + " on a five-point scale. Performance management is the weakest area (level 1), followed by demand planning, S&OP, master data, capacity planning, scheduling and inventory control (level 2).", "Maturity:"));
c.push(bul("Planning inefficiency costs an estimated Rs " + Math.round(R.tot_loss) + " lakh a year (about Rs " + (R.tot_loss / 100).toFixed(1) + " crore). Master data errors, late and lost sales and excess inventory account for about " + Math.round(100 * (R.loss[0][1] + R.loss[1][1] + R.loss[2][1]) / R.tot_loss) + "% of it.", "Cost of the gap:"));
c.push(bul("Eleven initiatives are organised in four phases over twelve months. Their combined annual benefit is estimated at " + lakh(R.tot_benefit) + " against a one-time cost of " + lakh(R.tot_cost) + " and running costs of " + lakh(R.tot_run) + " a year. Payback is about " + BC[2].payback + " months in the expected case and " + BC[0].payback + " months if only half of the benefit is realised.", "Improvement plan:"));
c.push(bul("A planning health index combining seven KPIs rises from " + IX.plan[0] + " to 100 under the plan, to " + IX.cons[12] + " in a conservative case, and falls to " + IX.idle[12] + " if nothing is done.", "Measurement:"));
c.push(H2("1.3 Scope and approach"));
c.push(P("The report follows the structure requested in the task: Introduction, Analysis, Proposed Improvements, KPIs, Roadmap, Business Case and Conclusion. It builds on the earlier weeks rather than repeating them. All company data and results are synthetic. The model that generates the KPI history, control chart, loss estimate, initiative portfolio and business case is included in the repository (src/improvement_model.py) so that every number can be traced."));

// ---------------- 2 Literature review ----------------
c.push(H1("2. Literature Review: Continuous Improvement in Production Planning"));
c.push(H2("2.1 Continuous improvement philosophies"));
c.push(table([2200, 3700, 3460], ["Approach", "Core idea", "Use in production planning"], [
  ["PDCA (Plan-Do-Check-Act)", "Deming and Shewhart cycle: set a target, test a change, measure it, standardise or adjust", "Cadence for every improvement initiative; quarterly review loop"],
  ["Kaizen", "Many small, frequent improvements suggested by the people doing the work", "Planner and supervisor suggestions: dispatch list layouts, report variants, checklist changes"],
  ["Lean", "Remove waste (waiting, overproduction, inventory, motion, defects) and create flow", "Queue time reduction, inventory policy, changeover reduction (SMED)"],
  ["Six Sigma (DMAIC)", "Define, Measure, Analyse, Improve, Control; uses data and statistics to reduce variation", "Chronic problems such as forecast error and late orders (Section 5.5)"],
  ["Theory of constraints", "Identify the constraint, exploit it, subordinate everything else, elevate it, repeat", "Bottleneck-first scheduling (Week 3) and capacity levers"],
  ["Total productive maintenance", "Operators and maintenance prevent breakdowns and losses together", "Availability of the battery line"],
  ["Statistical process control", "Separate common-cause from special-cause variation with control charts", "Decide when to react to a KPI movement and when to change the system"]
]));
c.push(cap("Table 1: Continuous improvement approaches and their use here."));
c.push(H2("2.2 Measuring planning performance"));
c.push(P("Good measurement is the base of improvement. The Supply Chain Operations Reference (SCOR) model groups metrics into reliability (for example perfect order fulfilment), responsiveness (cycle time), agility, cost and asset management (inventory days). Planning-specific measures include forecast accuracy (MAPE or weighted absolute percentage error), forecast bias (a persistent over- or under-forecast), tracking signal, schedule adherence, plan stability and inventory turns. Balanced scorecard thinking recommends a small set of leading indicators (such as data-quality score or confirmation timeliness) alongside lagging results (such as service level) so that managers can act before the result suffers."));
c.push(P("Sales and operations planning maturity models describe a progression from ad hoc planning to an integrated, managed and finally optimised process. Typical stages are ad hoc, repeatable, defined, managed and optimised. This report uses a five-level scale of that kind for the maturity assessment in Section 4.4."));
c.push(H2("2.3 Support for improvement in SAP PP"));
c.push(P("SAP PP provides much of the data needed to measure and improve planning. Standard reports and transactions include the order information system (COOIS), capacity evaluation (CM01), stock/requirements lists (MD04, MD07), confirmation data (CO11N), goods movements and status history. On S/4HANA, MRP Live (MD01N) and Fiori apps such as Monitor Material Coverage and Manage Production Orders give planners exception-based views. Optional or additional SAP components include SAP Analytics Cloud for dashboards, SAP Integrated Business Planning for demand and supply planning, PP-DS for detailed scheduling, SAP Master Data Governance for data quality workflows and SAP Signavio for process analysis. Availability depends on the licence and release, so the roadmap in this report starts with standard transactions and low-cost extracts and treats the optional tools as later steps."));
c.push(H2("2.4 Common challenges"));
c.push(bul("Tool-first thinking: buying software before fixing data, process and ownership.", "1."));
c.push(bul("Too many KPIs without owners or targets, so that nobody acts on them.", "2."));
c.push(bul("Reacting to every monthly fluctuation (tampering) instead of improving the system.", "3."));
c.push(bul("Improvements that are not standardised and fade after the project team leaves.", "4."));
c.push(bul("Silo thinking: sales, planning, production and purchasing optimise their own targets.", "5."));
c.push(bul("Poor master data, which undermines every measurement and every plan (Week 2).", "6."));
c.push(bul("Resistance to change and lack of time for improvement work.", "7."));
c.push(H2("2.5 Implications for this report"));
c.push(P("The review leads to five design choices: use PDCA as the common cycle, DMAIC for chronic problems, the theory of constraints for capacity decisions, control charts to decide when to act, and a small balanced KPI set with owners and SAP data sources."));

// ---------------- 3 Methodology ----------------
c.push(H1("3. Methodology"));
c.push(H2("3.1 Evaluation approach"));
c.push(table([700, 2500, 6160], ["Step", "Activity", "Output"], [
  ["1", "Consolidate findings from Weeks 1 to 3", "Table of baseline problems and quantified effects (Section 4.1)"],
  ["2", "Build a twelve-month KPI history", "Trend, mean, variation and gap to target for six KPIs (Section 4.2)"],
  ["3", "Test stability with a control chart", "Control limits and special-cause points (Section 4.3)"],
  ["4", "Assess process maturity", "Scores for nine process areas with evidence (Section 4.4)"],
  ["5", "Estimate the annual cost of inefficiency", "Pareto of nine loss categories (Section 4.5)"],
  ["6", "Design and prioritise initiatives", "Portfolio of eleven initiatives with impact, effort, cost and benefit (Section 5)"],
  ["7", "Define KPIs, projection and roadmap", "Scorecard, health index, 12-month plan (Sections 6 and 7)"],
  ["8", "Build the business case", "Benefit, cost, payback, NPV and sensitivity (Section 8)"]
]));
c.push(cap("Table 2: Evaluation steps."));
c.push(H2("3.2 Data sources"));
c.push(bul("Quantified results of the previous reports: forecast back-test and capacity load (Week 1), master data audit and cost of data errors (Week 2), scheduling simulation (Week 3).", "Earlier weeks."));
c.push(bul("A synthetic monthly KPI history for October 2025 to September 2026, generated with a fixed random seed and scaled so that the means equal the baselines stated in the earlier reports (forecast error 28%, OTIF 88%, schedule adherence 78%, inventory turns 5.2, battery OEE 68%).", "KPI history."));
c.push(bul("Loss assumptions are listed in Appendix A.", "Cost assumptions."));
c.push(H2("3.3 Scoring and prioritisation"));
c.push(P("Maturity is scored from 1 (ad hoc) to 5 (optimised) using evidence from the earlier weeks. Initiatives are scored for impact and effort (1 to 5) and ranked by a benefit-to-cost ratio. The annual benefit of each initiative is the share of one or more loss categories it is expected to recover. Shares are judgement-based and are tested in a sensitivity analysis (Section 8)."));
c.push(H2("3.4 Limitations"));
c.push(bul("All data is synthetic. The numbers show how the method works and what the order of magnitude might be, not a forecast for a real plant."));
c.push(bul("Benefit shares are estimates. The conservative case in Section 8 assumes only half or three quarters of them."));
c.push(bul("Interactions between initiatives are only partly modelled. Shares are assigned so that each loss category is not recovered by more than 70%."));

// ---------------- 4 Analysis ----------------
c.push(H1("4. Analysis: Evaluation of Current Production Planning"));
c.push(H2("4.1 What Weeks 1 to 3 showed"));
c.push(table([1100, 4200, 4060], ["Week", "Key finding", "Consequence for improvement"], [
  ["1", "Forecast error of about 28% from a 3-month average; a seasonal-growth method cut test error to 6.1% against 15.1%. Battery line load of 127-130% in Oct-Nov.", "Forecasting method and capacity planning need a formal process, not one-off fixes"],
  ["2", "Eight master data errors (audit score 94.7%) cost an estimated Rs 24.4 lakh in one month; three errors caused about 78% of it.", "Data governance is a precondition; a few critical fields matter most"],
  ["3", "Battery line loaded at 108%; FIFO dispatch leaves 59% of orders late in the main run; sequencing cut changeover hours by about 24% and rush-order delay sharply; overtime cut mean tardiness by about 27%.", "Capacity at the bottleneck comes first; sequencing rules help but do not replace capacity"]
]));
c.push(cap("Table 3: Baseline findings carried into the improvement plan."));
c.push(H2("4.2 Twelve-month KPI performance"));
c.push(fig("fig3_kpi_history.png", 624));
c.push(cap("Figure 3: Monthly KPI results, October 2025 to September 2026 (synthetic data, source: data/kpi_history.csv)."));
const kp = [["Forecast error, MAPE (%)", "mape", 12], ["OTIF service level (%)", "otif", 95], ["Schedule adherence (%)", "sched_adh", 92], ["Inventory turns", "turns", 6.5], ["OEE battery line (%)", "oee", 78], ["Rush orders per month", "rush", 4]];
c.push(table([2700, 1100, 1100, 1100, 1100, 1100, 1160], ["KPI", "Mean", "Std dev", "Min", "Max", "Target", "Gap to target"], kp.map(([n, k, t]) => [n, K[k].mean, K[k].sd, K[k].mn, K[k].mx, t, f1(Math.abs(K[k].mean - t)) + (k === "mape" || k === "rush" ? " too high" : " too low")])));
c.push(cap("Table 4: Twelve-month KPI statistics against targets."));
c.push(P("Three patterns stand out. First, every KPI is far from target, not just in the festive months. Second, the festive peak (October and November) worsens forecast error, service level and rush orders together, which points to a shared cause: the plan does not anticipate peak demand and capacity. Third, month-to-month variation is small compared with the gap to target (standard deviation of " + K.mape.sd + " points for forecast error against a gap of " + f1(K.mape.mean - 12) + " points)."));
c.push(H2("4.3 Is the process stable? Control chart"));
c.push(fig("fig4_control_chart.png", 560));
c.push(cap("Figure 4: Individuals control chart for forecast error (limits = mean plus or minus 2.66 times the average moving range)."));
c.push(P("The control limits are " + CC.lcl + "% and " + CC.ucl + "% around a mean of " + CC.cl + "%. Only " + CC.ooc.join(", ") + " lies outside the limits; this is the festive peak and has a known cause. All other months show ordinary variation. Two conclusions follow. The process is stable, so it will keep producing forecast errors of 25 to 31% as long as the method stays the same, and the target of 12% is unreachable without changing the forecasting system (Week 1 method plus consensus review). And managers should not react to normal month-to-month changes, but should investigate special causes such as the festive peak and build them into the plan."));
c.push(H2("4.4 Process maturity assessment"));
c.push(fig("fig5_maturity_radar.png", 420));
c.push(cap("Figure 5: Maturity by process area, current and 12-month target."));
c.push(table([2500, 900, 900, 5060], ["Process area", "Current", "Target", "Evidence"], R.maturity.map(m => [m[0], m[1], m[2], m[3]]), r => Number(r[1]) <= 2));
c.push(cap("Table 5: Maturity scores (1 ad hoc, 2 repeatable, 3 defined, 4 managed, 5 optimised). Shaded rows are at level 2 or below."));
c.push(P("Seven of nine areas score 2 or below. The pattern is consistent: activities happen, but depend on individuals, are not measured and are not managed against targets. The main step for each area is to move from repeatable to managed (level 4) by adding ownership, standards, measurement and a review rhythm."));
c.push(H2("4.5 Cost of planning inefficiency"));
c.push(fig("fig6_loss_pareto.png", 624));
c.push(cap("Figure 6: Estimated annual losses (source: data/loss_estimate.csv; assumptions in Appendix A)."));
c.push(P("The three largest categories (master data errors, late and lost sales, excess inventory) represent " + Math.round(100 * (R.loss[0][1] + R.loss[1][1] + R.loss[2][1]) / R.tot_loss) + "% of the estimated loss of Rs " + Math.round(R.tot_loss) + " lakh. Separately from this annual cost, moving inventory turns from 5.2 to 6.5 would release about Rs " + R.inv.release + " crore of working capital (from Rs " + R.inv.cur + " crore to Rs " + R.inv.tgt + " crore of stock), which is a one-time cash effect and is not counted in the annual benefit."));
c.push(H2("4.6 How the problems connect"));
c.push(table([2600, 3300, 1100, 2360], ["Symptom (KPI)", "Underlying cause", "Source", "Addressed by"], [
  ["Low forecast accuracy", "Method ignores seasonality; no bias tracking; no consensus review", "Week 1", "I2, I4"],
  ["High rush-order count and late orders", "Peak demand not planned into capacity; no priority rule", "Weeks 1, 3", "I2, I5, I6, I8"],
  ["Overloaded battery line", "Routing time understated; capacity levers decided late", "Weeks 2, 3", "I1, I6, I7"],
  ["Stock-outs and excess stock together", "Same safety stock for all items; lead times wrong", "Weeks 1, 2", "I1, I3, I10"],
  ["Low schedule adherence", "Arrival-order dispatch; breakdowns; late confirmations", "Week 3", "I5, I9, I4"],
  ["Rework by planners", "No dashboards; manual spreadsheets; no data-quality checks", "Weeks 2, 4", "I1, I4"]
]));
c.push(cap("Table 6: Chain of cause and effect across the four weeks."));
c.push(P("The table shows why improvement must be run as one programme. Fixing forecast accuracy without capacity planning only moves the problem to the shop floor; fixing the schedule with wrong routing times only creates wrong schedules faster. Master data and measurement sit underneath everything."));
c.push(H2("4.7 Strengths to build on"));
c.push(bul("MRP and production order processing already run in SAP, so the structure exists.", "Core process:"));
c.push(bul("Planning models (forecast, audit, simulation) from Weeks 1 to 3 can be reused as tools.", "Analytical tools:"));
c.push(bul("Problems are now measurable and have owners and costs attached, which helps to win sponsorship.", "Clarity:"));
c.push(bul("The bottleneck is known (battery assembly), so effort can be focused.", "Focus:"));

// ---------------- 5 Proposed improvements ----------------
c.push(H1("5. Proposed Improvements: Continuous Improvement Strategy"));
c.push(H2("5.1 Principles"));
c.push(bul("Change the system, not the month: use control charts to separate noise from signals.", "1."));
c.push(bul("Bottleneck first: capacity and sequencing decisions at the battery line come before others.", "2."));
c.push(bul("Data before tools: governance and measurement come before software.", "3."));
c.push(bul("Small, fast cycles: every initiative runs in 4 to 12 week PDCA cycles with a named owner.", "4."));
c.push(bul("Standardise what works: update procedures, SAP parameters and training after each cycle.", "5."));
c.push(bul("Measure what matters: few KPIs, each with an owner, a source and an alert rule.", "6."));
c.push(bul("Involve the people who do the work: planners and supervisors suggest and test improvements.", "7."));
c.push(fig("fig1_improvement_cycle.png", 600));
c.push(cap("Figure 1: PDCA cycle with SAP PP examples."));
c.push(H2("5.2 Initiative portfolio"));
c.push(table([500, 2900, 2200, 1200, 800, 800, 960], ["ID", "Initiative", "SAP lever", "Owner", "Cost", "Benefit", "Phase months"],
  I.map(x => [x.id, x.name, x.sap, x.owner, x.cost, x.benefit, "M" + x.start + "-M" + x.end])));
c.push(cap("Table 7: Improvement initiatives (cost = one-time, benefit = annual, both in Rs lakh; source: data/initiatives.csv)."));
c.push(fig("fig7_prioritisation.png", 470));
c.push(cap("Figure 7: Impact versus effort. Green bubbles are quick wins."));
c.push(P("The quick wins (I1, I2, I3, I5, shown in green) combine high impact with low effort and account for about " + Math.round(100 * (topI("I1").benefit + topI("I2").benefit + topI("I3").benefit + topI("I5").benefit) / R.tot_benefit) + "% of the total benefit. They start in the first three months. Larger projects (I6 peak capacity, I9 maintenance, I7 changeover reduction) follow once the measurement base exists."));
c.push(H2("5.3 Key initiatives in more detail"));
c.push(bul("Appoint a data steward and owners per object (Week 2 RACI). Run the nightly audit rules on A and B materials, review exceptions weekly, require change numbers for BOM and routing changes, and compare lead times, routing hours and scrap with actual values every quarter. Target: audit score of 99% or more and no failures on critical materials.", "I1 Master data governance:"));
c.push(bul("Replace the 3-month average with the seasonal-growth model of Week 1, add a monthly consensus meeting and track MAPE, bias and tracking signal by product family. Load the agreed plan to SAP as planned independent requirements (MD61).", "I2 Consensus forecast:"));
c.push(bul("Segment items by ABC/XYZ, set service levels by class (98%, 95%, 90%) and calculate safety stock from variability and lead time. Update through mass maintenance (MM17) and review each quarter.", "I3 Inventory policy:"));
c.push(bul("Sequence the battery line by earliest due date with same-model grouping, publish a daily dispatch list from COOIS, and re-plan in CM21 after every disruption (Week 3).", "I5 Bottleneck sequencing:"));
c.push(bul("Plan roughly 15% extra capacity for peak weeks (overtime roster, extra shift, subcontractor) and decide it from the 12-week load view in CM01, not after orders are late.", "I6 Peak capacity plan:"));
c.push(bul("Approval, impact quote and first-in-queue rule for rush orders (Week 3), with a monthly count and cost report.", "I8 Rush-order governance:"));
c.push(H2("5.4 Applying DMAIC to two chronic problems"));
c.push(table([1200, 4080, 4080], ["Phase", "Problem 1: forecast error 28% (target 12%)", "Problem 2: late orders at the bottleneck (59%)"], [
  ["Define", "Reduce family-level MAPE to below 12% within 12 months; owner: demand planner", "Reduce late orders to 25% or less and cut changeover hours by 25%; owner: capacity planner"],
  ["Measure", "12-month MAPE history, bias by family; control chart (Section 4.3)", "Order lateness by work centre; queue time; changeover hours; load in CM01 (Week 3)"],
  ["Analyse", "Seasonality and growth ignored by 3-month average; no review of known events", "Bottleneck at 108%; arrival-order dispatch; no capacity lever; breakdown without re-plan"],
  ["Improve", "Seasonal-growth model; monthly consensus review; event calendar", "EDD with grouping, peak capacity lever, SMED, TPM at the bottleneck"],
  ["Control", "Monthly MAPE and bias chart with limits; tracking signal alert at +/-4", "Weekly lateness and load review; alert if load above 100% for 2 weeks"]
]));
c.push(cap("Table 8: DMAIC applied to two problems."));
c.push(H2("5.5 Innovative ideas"));
c.push(bul("Combine seven KPIs into a single score (Section 6.4) to give leadership one number and a trend, with drill-down to the weakest KPI.", "Planning health index."));
c.push(bul("Update lead times, routing times and scrap automatically as suggestions from actual receipts and confirmations; the data steward approves. This turns the Week 2 and Week 3 findings into a standing process.", "Closed-loop parameter learning."));
c.push(bul("Planners review the top 10 exceptions ranked by value at risk (value x days late x lead time) instead of scanning hundreds of MRP messages.", "Exception-based planning."));
c.push(bul("Run the Week 3 simulation on the weekly order list before release to preview lateness and test capacity levers.", "What-if planning twin."));
c.push(bul("Use status-change history of production orders (created, released, confirmed) to find hidden waiting, for example the time between creation and release.", "Process mining on order data."));
c.push(bul("Large shop-floor display at the battery line showing the next jobs, buffer status and daily target, updated from confirmations.", "Visual management."));
c.push(bul("Share a rolling 12-week demand view with key suppliers of cells and controllers to stabilise lead times.", "Supplier collaboration."));
c.push(bul("A visible improvement board where staff submit ideas; small rewards for adopted ideas; one idea per month implemented in the planning team.", "Kaizen board."));
c.push(H2("5.6 SAP enablers"));
c.push(table([2900, 3700, 2760], ["Need", "SAP capability", "Comment"], [
  ["Exception-based planning", "MD07, MD04, Monitor Material Coverage (Fiori)", "Standard; configure MRP controller groups and exception messages"],
  ["Order monitoring and dispatch lists", "COOIS, Manage Production Orders (Fiori)", "Standard; define layouts per work centre"],
  ["Capacity load and levelling", "CM01, CM21, CM25", "Standard; 12-week load view for the weekly review"],
  ["Data-quality control", "Field selection, validation rules, change numbers; optional MDG", "Start with standard controls and the audit job"],
  ["Dashboards", "Extracts to spreadsheet first; later SAP Analytics Cloud", "Avoid waiting for a dashboard project to start measuring"],
  ["Demand planning", "MM/PP forecast or SOP first; optional IBP", "Method matters more than tool"],
  ["Detailed scheduling", "CM21 planning table; optional PP-DS", "Evaluate PP-DS after rules are proven manually"],
  ["Maintenance integration", "Plant Maintenance notifications and plans", "Link downtime to bottleneck reporting"]
]));
c.push(cap("Table 9: SAP capabilities supporting improvement. Availability depends on release and licence."));

// ---------------- 6 KPI framework ----------------
c.push(H1("6. KPI Framework"));
c.push(H2("6.1 Design principles"));
c.push(bul("A small set (22 KPIs in five groups) with a clear owner for each.", "Few and owned:"));
c.push(bul("Each KPI has a formula, a SAP data source, a frequency and a target for month 6 and month 12.", "Defined:"));
c.push(bul("Leading indicators (data-quality score, confirmation timeliness, plan stability) predict the lagging results (OTIF, inventory turns, cost).", "Balanced:"));
c.push(bul("Control limits and alert rules show when to act (Section 6.5).", "Actionable:"));
c.push(H2("6.2 KPI scorecard"));
c.push(P("The scorecard is split into the five process groups of Figure 2. Baselines are taken from the earlier reports where available; 'Not measured' means no baseline exists and the first measurement will set it. Table sources are the commonly used SAP objects and may differ by release."));
c.push(fig("fig2_kpi_process_map.png", 624));
c.push(cap("Figure 2: Where each KPI group is measured in the planning process."));
const W6 = [1700, 2200, 1650, 850, 700, 700, 1560], H6 = ["KPI", "Formula", "SAP source", "Baseline", "M6", "M12", "Frequency / owner"];
c.push(table(W6, H6, [
  ["Forecast accuracy", "1 - MAPE at product-family level", "Sales history vs forecast (SOP / MM forecast)", "72%", "80%", "88%", "Monthly / Demand planner"],
  ["Forecast bias", "(Forecast - actual) / actual", "As above", "+14%", "+/-5%", "+/-3%", "Monthly / Demand planner"],
  ["Plan stability", "Orders rescheduled after release / orders released", "COOIS, change history", "Not measured", "<= 15%", "<= 10%", "Weekly / Production planner"],
  ["MRP exception backlog", "Average age of open exceptions (days)", "MD07", K.backlog.mean + " d", "3 d", "2 d", "Weekly / MRP controllers"],
  ["Plan attainment", "Output / planned output for the period", "COOIS, GR postings", "Not measured", "90%", "95%", "Monthly / Plant manager"]
]));
c.push(cap("Table 10: Plan KPIs."));
c.push(table(W6, H6, [
  ["Data-quality score", "Checks passed / checks run (audit rules)", "Nightly audit job (Week 2)", "94.7%", "98%", "99%", "Weekly / Data steward"],
  ["Critical-rule failures", "Failed high-severity rules on A items", "Audit job", "6", "2", "0", "Weekly / Data steward"],
  ["Lead-time deviation", "Items with planned vs actual delivery time gap > 20%", "Info record vs goods receipts", "1 item", "0 on A items", "0", "Monthly / Purchasing"],
  ["Supplier on-time delivery", "On-time lines / total lines", "Purchase order history", "Not measured", "85%", "92%", "Monthly / Purchasing"]
]));
c.push(cap("Table 11: Source and data KPIs."));
c.push(table(W6, H6, [
  ["Schedule adherence", "Orders finished by scheduled finish / orders finished", "Order header dates (AFKO), COOIS", K.sched_adh.mean + "%", "85%", "92%", "Weekly / Production manager"],
  ["OEE battery line", "Availability x performance x quality", "Confirmations, PM notifications", K.oee.mean + "%", "73%", "78%", "Weekly / Plant manager"],
  ["Bottleneck downtime", "Unplanned stop hours per month", "PM notifications", K.downtime.mean + " h", "9 h", "6 h", "Weekly / Maintenance head"],
  ["Changeover hours", "Setup hours per 12-day window", "Confirmations (setup time)", "53 h", "45 h", "40 h", "Weekly / Capacity planner"],
  ["Confirmation timeliness", "Operations confirmed within one shift / all", "CO11N timestamps", "Not measured", "90%", "95%", "Weekly / Supervisors"],
  ["Mean tardiness", "Average hours late per finished order", "Order dates", "6.2 h", "4.5 h", "3.5 h", "Weekly / Production planner"]
]));
c.push(cap("Table 12: Make KPIs. Mean tardiness baseline from the Week 3 40-set simulation."));
c.push(table(W6, H6, [
  ["OTIF service level", "Deliveries on time and in full / all", "Delivery documents vs confirmed dates", K.otif.mean + "%", "92%", "95%", "Monthly / Supply chain head"],
  ["Rush orders", "Count of rush orders per month", "Order priority field", K.rush.mean.toFixed(0) + " per month", "6", "4", "Monthly / Production manager"],
  ["Backorders", "Open late order lines at month end", "Sales order status", "Not measured", "-30%", "-50%", "Monthly / Sales"],
  ["Perfect order rate", "On time x in full x undamaged x correct documents", "SD and QM data", "Not measured", "85%", "92%", "Monthly / Supply chain head"]
]));
c.push(cap("Table 13: Deliver KPIs."));
c.push(table(W6, H6, [
  ["Inventory turns", "Annual cost of goods / average stock value", "Stock valuation (material master, material documents)", K.turns.mean, "5.9", "6.5", "Monthly / Materials manager"],
  ["Days of inventory", "365 / inventory turns", "As above", "70 d", "62 d", "56 d", "Monthly / Materials manager"],
  ["Expedite and overtime cost", "Rush costs + unplanned overtime premium", "Cost centre reports", "Rs " + (R.loss[5][1] + R.loss[6][1]).toFixed(0) + " lakh/yr", "-25%", "-50%", "Monthly / Finance"],
  ["Planning loss estimate", "Sum of the nine loss categories (Appendix A)", "Dashboard model", "Rs " + Math.round(R.tot_loss) + " lakh/yr", "Rs 200 lakh", "Rs 130 lakh", "Quarterly / Steering committee"]
]));
c.push(cap("Table 14: Finance KPIs."));
c.push(H2("6.3 Planning health index"));
c.push(P("To give leadership one number, seven headline KPIs are normalised to a 0 to 100 scale and averaged: index = average of (value - floor) / (target - floor), limited to 0 to 1, times 100. For a KPI where lower is better (rush orders) the scale is reversed. The floor is the worst acceptable level."));
c.push(table([3000, 1500, 1500, 1500, 1860], ["KPI in index", "Floor", "Baseline", "Target (M12)", "Baseline score"], P_rows()));
c.push(cap("Table 15: Planning health index inputs. Baseline index = " + IX.plan[0] + " out of 100."));
function P_rows() {
  const FL = { "Forecast accuracy (%)": 50, "OTIF service level (%)": 70, "Schedule adherence (%)": 60, "Inventory turns": 3.0, "OEE battery line (%)": 50, "Data-quality score (%)": 85, "Rush orders per month": 15 };
  return Object.keys(PJ).map(n => { const d = PJ[n]; const sc = Math.max(0, Math.min(1, (d.base - FL[n]) / (d.target - FL[n]))); return [n, FL[n], d.base, d.target, (100 * sc).toFixed(0)]; });
}
c.push(H2("6.4 Alert rules and control"));
c.push(table([3000, 3300, 3060], ["Rule", "Signal", "Response"], [
  ["Point outside control limits", "KPI above or below limit (for example forecast error above 31%)", "Investigate within one week; record cause (special cause) in the improvement log"],
  ["Run of 7 points on one side of the mean, or a steady trend", "Shift in the process", "Check whether a change took effect; update limits if the improvement is real"],
  ["Amber / red thresholds", "Amber: below M6 target; red: below baseline", "Amber to owner; red to steering committee"],
  ["Tracking signal", "Outside +/-4 on forecast", "Re-select forecast model and review events"],
  ["Bottleneck load", "Above 100% for 2 consecutive weeks in CM01", "Trigger capacity lever decision"],
  ["Data-quality score", "Below 98% or any critical-rule failure", "Data steward corrects and reports in weekly review"]
]));
c.push(cap("Table 16: Alert rules."));
c.push(H2("6.5 Expected KPI trajectory"));
c.push(fig("fig9_kpi_projection.png", 624));
c.push(cap("Figure 9: Plan, conservative case (60% of the gap closed) and do-nothing path (volume growth worsens load; source: data/kpi_projection.csv)."));
const pr = n => [n, PJ[n].base, PJ[n].plan[3], PJ[n].plan[6], PJ[n].plan[9], PJ[n].plan[12], PJ[n].cons[12], PJ[n].idle[12]];
c.push(table([2500, 900, 900, 900, 900, 1000, 1100, 1160], ["KPI", "Baseline", "M3", "M6", "M9", "M12 plan", "M12 conservative", "M12 do nothing"],
  Object.keys(PJ).map(pr).concat([["Planning health index", IX.plan[0], IX.plan[3], IX.plan[6], IX.plan[9], IX.plan[12], IX.cons[12], IX.idle[12]]])));
c.push(cap("Table 17: KPI trajectories. Ramp-up follows an S-curve (5% of the gap at month 1, 42% at month 5, 76% at month 8, 100% at month 12). Do-nothing drift is an assumption caused by 8% annual volume growth."));
c.push(H2("6.6 Data collection and reporting"));
c.push(bul("Month 1: extract KPI data from SAP (COOIS, CM01, MD07, goods movements) into a spreadsheet with fixed formulas; one analyst owns it.", "Start simple."));
c.push(bul("Months 3 to 6: automate the nightly audit and the weekly extract; publish a one-page scorecard.", "Automate."));
c.push(bul("Months 6 to 12: move to a dashboard in SAP Analytics Cloud or another BI tool if the licence allows; keep the same KPI definitions.", "Scale."));
c.push(bul("Each KPI definition is stored in a data dictionary with formula, source, owner and change history so that numbers stay comparable over time.", "Document."));

// ---------------- 7 Roadmap ----------------
c.push(H1("7. Implementation Roadmap"));
c.push(H2("7.1 Twelve-month plan"));
c.push(fig("fig8_roadmap.png", 624));
c.push(cap("Figure 8: Roadmap by initiative with quarterly reviews."));
c.push(table([1500, 1100, 2500, 2500, 1760], ["Phase", "Months", "Objectives", "Deliverables", "Exit criteria"], [
  ["1 Stabilise", "M1-M3", "Stop the biggest losses; set up measurement", "Data steward and owners named; audit baseline; KPI scorecard v1; rush-order rule; forecast review meeting started", "Scorecard published monthly; no open critical data errors"],
  ["2 Standardise", "M4-M6", "Make good practice routine", "Seasonal forecast live; safety-stock policy by class; EDD dispatch list; availability check before release; capacity levers agreed", "Forecast accuracy 80% or more; OTIF 92% or more"],
  ["3 Optimise", "M7-M9", "Improve the bottleneck and flow", "Peak capacity plan active; SMED on battery line; TPM routines; closed-loop parameter updates", "Bottleneck load 105% or less at peak; changeover hours down 15%"],
  ["4 Sustain", "M10-M12", "Lock in gains and extend", "Dashboard in production; procedures updated; training refreshed; next-year roadmap", "KPIs at M12 targets for two consecutive months"]
]));
c.push(cap("Table 18: Phases, deliverables and exit criteria."));
c.push(H2("7.2 First 90 days"));
c.push(table([1400, 5560, 2400], ["Period", "Actions", "Owner"], [
  ["Days 1-30", "Appoint steering committee and improvement lead; name data owners; run the audit on all A/B materials and fix critical findings; build KPI spreadsheet and publish the first scorecard; introduce the rush-order approval rule", "Plant manager, data steward, planning analyst"],
  ["Days 31-60", "Start the monthly consensus forecast meeting; load the seasonal forecast for the next peak; create the weekly dispatch list in COOIS; run availability checks before release of long-lead items; agree peak capacity options with HR and finance", "Demand planner, capacity planner, MRP controller"],
  ["Days 61-90", "Review first-cycle results against M3 targets; update procedures; set safety stocks by class for A items; start TPM routines and SMED study; present the 90-day review to the steering committee and approve phase 2", "Improvement lead, materials manager, maintenance head"]
]));
c.push(cap("Table 19: Action plan for the first 90 days."));
c.push(H2("7.3 Governance and cadence"));
c.push(fig("fig10_governance_cadence.png", 600));
c.push(cap("Figure 10: Review rhythm."));
c.push(table([2400, 1500, 1500, 1500, 1500, 960], ["Role", "Steering", "Improvement lead", "Process owners", "Data steward", "Planners"], [
  ["Approve roadmap and budget", "A", "R", "C", "I", "I"],
  ["Maintain KPI scorecard", "I", "A", "C", "R", "C"],
  ["Run PDCA cycles per initiative", "I", "A", "R", "C", "C"],
  ["Data quality and master data", "I", "C", "A", "R", "C"],
  ["Weekly planning review", "I", "C", "A", "C", "R"],
  ["Standardise and train", "I", "A", "R", "C", "R"]
]));
c.push(cap("Table 20: Responsibilities (A accountable, R responsible, C consulted, I informed)."));
c.push(H2("7.4 Change management"));
c.push(table([1700, 3800, 3860], ["Stage (ADKAR)", "What people need", "Actions"], [
  ["Awareness", "Understand why change is needed", "Share the Rs " + Math.round(R.tot_loss) + " lakh loss estimate and the KPI gap; show the control chart"],
  ["Desire", "Want to take part", "Involve planners in choosing quick wins; link KPIs to team goals; recognise adopted Kaizen ideas"],
  ["Knowledge", "Know how to do it", "Training on forecasting, MRP parameters, CM21 sequencing, audit reports and KPI reading"],
  ["Ability", "Be able to apply it", "Super-users per area; checklists; coaching in the first cycles"],
  ["Reinforcement", "Keep doing it", "Monthly KPI review; update procedures; celebrate results; keep the improvement log"]
]));
c.push(cap("Table 21: Change management plan."));
c.push(H2("7.5 Resources"));
c.push(bul("Improvement lead at about 50% of time, a data steward, a planning analyst (KPI model), and part-time owners; about 4 hours a week per process owner.", "People:"));
c.push(bul("One-time spend of " + lakh(R.tot_cost) + " (training, SMED study, TPM set-up, dashboard, audit tooling) and running costs of " + lakh(R.tot_run) + " a year (shift premium for planned peaks, maintenance routines, licence or support).", "Budget:"));
c.push(bul("Standard SAP transactions first; optional analytics tools only after the measurement base is proven.", "Tools:"));

// ---------------- 8 Business case ----------------
c.push(H1("8. Business Case"));
c.push(table([500, 3500, 1300, 1300, 1300, 1460], ["ID", "Initiative", "One-time cost", "Run cost / yr", "Annual benefit", "Benefit / cost"],
  I.map(x => [x.id, x.name, x.cost, x.run, x.benefit, x.cost ? x.ratio : "-"]).concat([["", "Total", R.tot_cost, R.tot_run, R.tot_benefit, (R.tot_benefit / R.tot_cost).toFixed(1)]])));
c.push(cap("Table 22: Costs and benefits in Rs lakh (source: data/initiatives.csv). Benefit = share of the loss categories recovered."));
c.push(table([2200, 1300, 1300, 1300, 1160, 1100, 1000], ["Case", "Year 1 net", "Year 2 net", "Year 3 net", "Payback (months)", "3-year NPV", "3-year ROI"],
  BC.map(b => [Math.round(100 * b.scale) + "% of benefit realised", b.year1, b.year2, b.year3, b.payback, b.npv3, b.roi3 + "%"])));
c.push(cap("Table 23: Scenarios (Rs lakh; NPV at 12% discount rate; year 1 benefit follows the S-curve ramp of Table 17; run costs deducted)."));
c.push(P("In the expected case, the programme costs " + lakh(R.tot_cost) + " and pays back in about " + BC[2].payback + " months; a three-year net present value is about " + lakh(BC[2].npv3) + ". If only 75% of the benefit is achieved, payback is " + BC[1].payback + " months, and if only half, " + BC[0].payback + " months, with a positive NPV in all three cases. The benefit equals about " + Math.round(100 * R.tot_benefit / R.tot_loss) + "% of the estimated annual loss, so the plan does not assume that all inefficiency disappears. Master data governance (I1) carries " + Math.round(100 * topI("I1").benefit / R.tot_benefit) + "% of the benefit and is the largest single driver, so its delivery is critical to the case."));
c.push(P("Not counted in the figures: about Rs " + R.inv.release + " crore of working capital released by higher inventory turns, better customer retention from higher OTIF, lower planner stress and the value of faster decisions. These should be tracked but not relied on when approving the plan."));

// ---------------- 9 Risks ----------------
c.push(H1("9. Risks and Mitigation"));
c.push(table([2500, 800, 2900, 3160], ["Risk", "Rating", "Mitigation", "Second-level recommendation"], [
  ["Benefits are lower than estimated", "High", "Track benefits by initiative every quarter", "Stage gates: release phase 3 funds only if phase 2 targets are met"],
  ["Key staff have no time for improvement work", "High", "Protect a weekly improvement hour; assign a lead", "Backfill with a temporary analyst; cut scope before stretching people"],
  ["Data governance fades after the first months", "High", "Nightly audit with weekly review", "Tie data quality to team objectives; quarterly external check"],
  ["KPI overload or disputes about definitions", "Medium", "Data dictionary, single owner", "Review KPI set annually; retire KPIs that nobody uses"],
  ["Overtime and subcontracting not available", "Medium", "Agree rosters and suppliers early", "Business case for a third battery line"],
  ["Resistance from planners and shop floor", "Medium", "Involve them in design; training", "Recognise adopted ideas; share success stories"],
  ["Peak demand arrives before changes work", "Medium", "Start with I2, I5, I6 before the festive season", "Contingency capacity plan"],
  ["SAP configuration or release constraints", "Low", "Use standard functions first", "Plan optional tools (PP-DS, IBP, MDG) with IT after proof of value"],
  ["Synthetic assumptions differ from reality", "Medium", "Validate with real SAP data", "Repeat the evaluation after the first quarter of real KPI data"]
]));
c.push(cap("Table 24: Risk register."));

// ---------------- 10 Conclusion ----------------
c.push(H1("10. Conclusions and Recommendations"));
c.push(H2("10.1 Conclusions"));
c.push(P("The evaluation shows a planning process that works at a basic level but is not managed. Performance is stable around poor levels, process maturity averages about 2 out of 5, and the estimated annual cost of the gap is Rs " + Math.round(R.tot_loss) + " lakh. The problems connect: forecast error, capacity overload, scheduling practice and master data feed each other, so improvement must be a coordinated programme rather than separate fixes."));
c.push(P("The proposed strategy uses simple, proven methods (PDCA, DMAIC, theory of constraints, control charts) and standard SAP PP functions first. A seven-KPI health index gives leadership one number; a 22-KPI scorecard gives owners the detail. Eleven initiatives in four phases are expected to recover about " + Math.round(100 * R.tot_benefit / R.tot_loss) + "% of the annual loss with a payback of about " + BC[2].payback + " months."));
c.push(H2("10.2 Recommendations"));
c.push(bul("Start with data governance (I1) and measurement (I4); they underpin everything else.", "1."));
c.push(bul("Replace the forecast method and hold a monthly consensus meeting before the next festive peak (I2).", "2."));
c.push(bul("Manage the battery line as the constraint: sequence by due date with grouping, plan a 15% peak capacity lever and maintain it (I5, I6, I9).", "3."));
c.push(bul("Control rush orders by rule and track their cost (I8).", "4."));
c.push(bul("Use control charts to decide when to react; do not chase monthly noise.", "5."));
c.push(bul("Review progress every quarter against the roadmap, stop what does not deliver and publish the results.", "6."));
c.push(H2("10.3 Lessons from the four weeks"));
c.push(table([1100, 3400, 4860], ["Week", "Topic", "Main lesson"], [
  ["1", "Planning strategy", "Strategy needs the right method for each material class and an honest forecast process"],
  ["2", "Master data and BOM", "A few wrong values on critical items can cost more than many wrong values on cheap items"],
  ["3", "Scheduling and execution", "Capacity at the bottleneck decides lateness; sequencing rules help but cannot replace capacity"],
  ["4", "Evaluation and improvement", "Without measurement, ownership and a review rhythm, none of the above lasts"]
]));
c.push(cap("Table 25: Summary of the internship."));
c.push(H2("10.4 Next steps"));
c.push(P("The immediate steps are to confirm sponsorship, appoint the improvement lead and data steward, run the first KPI extract and start the first PDCA cycles on master data, forecasting and rush orders. A first review after 90 days should compare the real KPI data with the baselines in this report and recalibrate the assumptions."));

// ---------------- 11 References ----------------
c.push(H1("11. References"));
["SAP Help Portal: Production Planning, MRP, Capacity Planning, Production Order Information System and S/4HANA Fiori apps documentation, help.sap.com.",
 "SAP Learning: Production Planning and Analytics training material, learning.sap.com.",
 "Deming, W. E., Out of the Crisis, MIT Press (PDCA and variation).",
 "Wheeler, D., Understanding Variation: The Key to Managing Chaos, SPC Press (control charts).",
 "Goldratt, E. and Cox, J., The Goal, North River Press (theory of constraints).",
 "Womack, J. and Jones, D., Lean Thinking, Free Press.",
 "ASCM (APICS), SCOR Digital Standard, metrics for reliability, responsiveness, agility, cost and assets.",
 "Kaplan, R. and Norton, D., The Balanced Scorecard, Harvard Business School Press.",
 "Hyndman, R. and Athanasopoulos, G., Forecasting: Principles and Practice, otexts.com/fpp3 (forecast accuracy measures).",
 "Hiatt, J., ADKAR: A Model for Change in Business, Government and Our Community, Prosci.",
 "Project repository: src/improvement_model.py, src/make_diagrams.py and data/*.csv (synthetic data)."].forEach(r => c.push(bul(r)));

// ---------------- Appendices ----------------
c.push(H1("Appendix A: Loss Assumptions"));
c.push(table([2900, 1300, 5160], ["Loss category", "Rs lakh / yr", "Assumption"], R.loss.map(l => [l[0], l[1], l[2]]).concat([["Total", R.tot_loss, ""]])));
c.push(cap("Table 26: Annual loss estimate (source: data/loss_estimate.csv). Annual volume 15,000 vehicles; material cost Rs 29,966 per vehicle (Week 2)."));
c.push(H1("Appendix B: Four-Week Deliverables"));
c.push(table([1100, 4200, 4060], ["Week", "Report", "Repository content"], [
  ["1", "Production Planning Strategy & Process Analysis", "Forecast back-test and capacity model (Python), report generator"],
  ["2", "Master Data Management & BOM Analysis", "Audit rules and BOM explosion (Python), diagrams, data files"],
  ["3", "Production Order Scheduling & Execution Analysis", "Shop simulation and dispatch rule comparison (Python), schedules"],
  ["4", "Evaluation & Continuous Improvement Report", "KPI history, control chart, loss estimate, business case (Python)"]
]));
c.push(cap("Table 27: Overview of the four weekly deliverables."));
c.push(P([T("Disclaimer: Vertex Mobility and all data are hypothetical and created for this educational assignment.", { italics: true, size: 18 })], { spacing: { before: 200 } }));


const tocEntries = () => heads.map(h => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: 9300, leader: LeaderType.DOT }],
  spacing: { before: h.lvl === 1 ? 70 : 0, after: 0, line: 232 },
  indent: { left: h.lvl === 1 ? 0 : 360 },
  children: [new InternalHyperlink({ anchor: h.id, children: [new TextRun({ text: h.t, font: FONT, size: h.lvl === 1 ? 20 : 18, bold: h.lvl === 1, color: h.lvl === 1 ? NAVY : "000000" })] }),
    new TextRun({ children: [new Tab(), String(PAGES[h.t] || "")], font: FONT, size: h.lvl === 1 ? 20 : 18, bold: h.lvl === 1 })] }));
c.splice(TOCPOS, 0, ...tocEntries());
require('fs').writeFileSync('toc_headings.json', JSON.stringify(heads.map(h => h.t)));

const doc = new Document({
  features: { updateFields: true }, creator: "Intern", title: "Week 4 - Evaluation & Continuous Improvement Report",
  styles: { default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: "2E5597", font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } }] },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1273, right: 1273 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAP PP Internship | Week 4 | Page ", font: FONT, size: 18, color: "7F7F7F" }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "7F7F7F" })] })] }) },
    children: c }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync("docs/Week4_Evaluation_Continuous_Improvement_Report.docx", b); console.log("ok"); });
