const fs = require('fs');
const d = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, LevelFormat, BorderStyle, PageBreak, TableOfContents, Footer, PageNumber } = d;
const R = JSON.parse(fs.readFileSync('data/results.json'));
const months = ["Oct-26","Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27","Jul-27","Aug-27","Sep-27"];

const FONT = "Calibri", NAVY = "1F3864", GREY = "F2F2F2";
const P = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: Array.isArray(t) ? t : [new TextRun({ text: t, font: FONT, size: 22 })] });
const B = (t, o = {}) => new TextRun({ text: t, bold: true, font: FONT, size: 22, ...o });
const T = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 22, ...o });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT })] });
const bul = (t, lead) => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60 }, children: lead ? [B(lead + " "), T(t)] : [T(t)] });

function table(widths, header, rows) {
  const total = widths.reduce((a, b) => a + b, 0);
  const bd = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
  const borders = { top: bd, bottom: bd, left: bd, right: bd };
  const cell = (txt, w, hdr, i) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, fill: hdr ? NAVY : (i % 2 ? GREY : "FFFFFF"), color: "auto" },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(txt), font: FONT, size: 19, bold: hdr, color: hdr ? "FFFFFF" : "000000" })] })]
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], true, 0)) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, widths[i], false, ri)) }))]
  });
}
const gap = () => P("", { spacing: { after: 80 } });
const cap = t => P([T(t, { italics: true, size: 18, color: "595959" })], { spacing: { after: 200 } });

const c = [];
// ---------- Title page ----------
c.push(new Paragraph({ spacing: { before: 2600, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAP PP Production Planning Analyst Virtual Internship", font: FONT, size: 26, color: "595959" })] }));
c.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Week 1: Production Planning Strategy & Process Analysis", font: FONT, size: 48, bold: true, color: NAVY })] }));
c.push(new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 8 } }, children: [new TextRun({ text: "Case study: Vertex Mobility Pvt. Ltd. (hypothetical electric two-wheeler manufacturer)", font: FONT, size: 24, italics: true })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T("Prepared by: [Your Name]")] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T("Role: SAP PP Production Planning Analyst Intern")] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T("Date: 30 September 2026")] }));
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", font: FONT, size: 32, bold: true, color: NAVY })] }));
c.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 1 Executive summary & intro ----------
c.push(H1("1. Introduction"));
c.push(H2("1.1 Purpose of this report"));
c.push(P("This report documents my Week 1 analysis for the SAP PP (Production Planning) virtual internship. It (a) summarises the fundamentals of SAP PP and production planning strategies from public sources, (b) analyses a hypothetical business scenario in which planning is business-critical, (c) designs an end-to-end planning strategy covering demand forecasting, inventory control and capacity planning, and (d) identifies risks with mitigation recommendations."));
c.push(H2("1.2 Executive summary"));
c.push(P("Vertex Mobility, a fictional electric two-wheeler maker in Sanand, Gujarat, suffers from a forecast error of roughly 28%, alternating stock-outs and excess stock, and a battery-pack assembly line that is overloaded in the festive season. The proposed strategy has five parts:"));
c.push(bul("segment materials with ABC/XYZ analysis and assign the right SAP planning strategy to each segment (e.g. 40 for vehicles, 10 for batteries and 50/70 for options);", "Segment:"));
c.push(bul("replace the flat-average forecast with a seasonal-growth model reviewed monthly in a consensus meeting and loaded into SAP through Sales & Operations Planning (SOP);", "Forecast:"));
c.push(bul("statistically derived safety stocks, reorder logic and lot-sizing per segment, with MRP live (MD01N) run daily for the critical net-change segments;", "Control inventory:"));
c.push(bul("rough-cut capacity check at SOP level followed by detailed capacity evaluation (CM01/CM21) and levelling with overtime, pre-build and subcontracting;", "Plan capacity:"));
c.push(bul("KPI dashboard (forecast accuracy, schedule adherence, inventory turns, OEE, service level) with clear owners.", "Monitor:"));
c.push(P("In the illustrative back-test in Section 4.1, the recommended seasonal-growth method reached a MAPE of " + R.backtest["Seasonal index x growth"].MAPE + "% against " + R.backtest["3-month moving avg"].MAPE + "% for the moving average currently used and " + R.backtest["Exp. smoothing (a=0.3)"].MAPE + "% for simple exponential smoothing. Note that all Vertex figures are synthetic and were generated for learning purposes."));

// ---------- 2 Fundamentals ----------
c.push(H1("2. Fundamentals of SAP PP and Production Planning"));
c.push(H2("2.1 What is SAP PP?"));
c.push(P("SAP Production Planning (PP) is the module of SAP ERP / SAP S/4HANA that plans, executes and monitors manufacturing. It covers demand management, material requirements planning (MRP), capacity planning, shop-floor control, and costing hand-off. It is tightly integrated with Materials Management (MM) for procurement and stock, Sales & Distribution (SD) for customer demand, Quality Management (QM) for inspections, Plant Maintenance (PM) for equipment availability, and Finance/Controlling (FI/CO) for order settlement."));
c.push(H2("2.2 Organisational structure and master data"));
c.push(table([2300, 7060], ["Element", "Role in production planning"], [
  ["Client / Company code / Plant", "Plant is the key planning unit; MRP and capacity are planned per plant."],
  ["Storage location", "Where stock is physically held; MRP can include or exclude locations."],
  ["Material master (MM01)", "MRP views hold MRP type, lot size, safety stock, lead times, planning strategy group and procurement type."],
  ["Bill of Material (CS01)", "Structure of components and quantities used for requirements explosion."],
  ["Work centre (CR01)", "Machine/line/labour resource with capacity, formulas and cost centre link."],
  ["Routing (CA01)", "Sequence of operations, standard values (setup, machine, labour) and work centre assignment."],
  ["Production version", "Links a BOM and routing that are valid for a particular lot size range and date."]
]));
c.push(cap("Table 1: Key organisational and master-data objects in SAP PP."));
c.push(H2("2.3 The planning process end to end"));
c.push(table([600, 2500, 1900, 4360], ["#", "Process step", "Typical T-code / app", "Output"], [
  ["1", "Sales & Operations Planning", "MC87 / MC88", "Sales, production and inventory plan at product-group level"],
  ["2", "Demand management", "MD61 / MD62", "Planned independent requirements (PIRs)"],
  ["3", "Master production scheduling", "MD40 / MD43", "Approved plan for critical end items"],
  ["4", "Material requirements planning", "MD01N / MD02", "Planned orders, purchase requisitions"],
  ["5", "Evaluate requirements", "MD04 / MD07", "Stock/requirements list, exception messages"],
  ["6", "Capacity evaluation and levelling", "CM01 / CM21 / CM25", "Load per work centre, levelled schedule"],
  ["7", "Convert planned to production order", "CO40 / CO41", "Production orders released with reservations"],
  ["8", "Production execution", "CO02, MIGO", "Component goods issue (261)"],
  ["9", "Confirmation and goods receipt", "CO11N, MIGO", "Actual times, yield/scrap, finished stock (101)"],
  ["10", "Order settlement and analysis", "KO88, COOIS", "Variance analysis, cost settlement"]
]));
c.push(cap("Table 2: Production planning process flow in SAP PP (T-codes as commonly cited in SAP Help and training material; menu paths differ slightly between ECC and S/4HANA)."));
c.push(H2("2.4 Production types"));
c.push(bul("individual production orders with routing and BOM; suited to varied products such as vehicle assemblies;", "Discrete manufacturing:"));
c.push(bul("period-based, rate-based flow lines with run schedule headers (e.g. repetitive high-volume motor assembly);", "Repetitive manufacturing:"));
c.push(bul("recipes and master recipes for batch and continuous processes (e.g. electrolyte or paint mixing).", "Process manufacturing:"));
c.push(H2("2.5 Planning strategies"));
c.push(P("A planning strategy controls whether production is driven by forecast, by customer orders, or by a combination, and at which BOM level planning takes place. The most relevant standard strategies are summarised below."));
c.push(table([1000, 2500, 2900, 2960], ["Key", "Strategy", "Logic", "Best suited to"], [
  ["10", "Planning with final assembly (net requirements planning)", "Forecast PIRs are consumed by sales orders; production before order", "Standard, fast-moving finished goods and battery packs"],
  ["30", "Production by lot size", "Total planned quantity produced in lot-sized chunks", "Many small sales orders on one product"],
  ["40", "Planning with final assembly", "PIRs reduced by incoming sales orders; components planned from PIRs", "Make-to-stock with customer-order overlap"],
  ["50", "Planning without final assembly", "Components produced to forecast; final assembly upon order", "Configurable end products with common parts"],
  ["70", "Planning at assembly level", "Assemblies planned to forecast; end items assembled to order", "Variant-rich products"],
  ["82", "Planning with planning material", "Forecast at a planning-material level with a planning BOM", "Wide variant range with a shared component family"],
  ["20", "Make-to-order", "No forecast; only sales orders create requirements", "Low-volume or expensive custom items"]
]));
c.push(cap("Table 3: Selected SAP PP planning strategies (SAP Help documentation, published training material)."));
c.push(H2("2.6 MRP concepts"));
c.push(bul("PD (MRP), VB (reorder-point), VM (automatic reorder-point), ND (no planning), M0 (master schedule items).", "MRP types:"));
c.push(bul("EX (lot-for-lot), FX (fixed), HB (replenish to maximum), WB (weekly), MB (monthly), and optimising procedures such as Silver-Meal or Groff.", "Lot-sizing procedures:"));
c.push(bul("planned delivery time, goods receipt processing time, in-house production time and scheduling margin key drive dates.", "Lead times:"));
c.push(bul("Net requirement = gross requirements − warehouse stock − scheduled receipts + safety stock.", "Netting formula:"));
c.push(bul("MD01N runs MRP Live on SAP HANA; Fiori apps such as Monitor Material Coverage and Manage Production Orders support the planner.", "S/4HANA note:"));

// ---------- 3 Scenario ----------
c.push(H1("3. Business Scenario Analysis: Vertex Mobility"));
c.push(H2("3.1 Company profile (hypothetical)"));
c.push(P("Vertex Mobility Pvt. Ltd. manufactures three electric scooter models (VX-Lite, VX-Pro, VX-Max) and in-house lithium-ion battery packs at a single plant in Sanand, Gujarat. Annual production is around 15,000 vehicles. Key purchased items are lithium cells (imported, 45-day lead time), motor controllers (12-week lead time), and steel frames (local, 10 days)."));
c.push(H2("3.2 Current situation and pain points"));
c.push(table([3200, 6160], ["Pain point", "Impact"], [
  ["Forecast built from a 3-month average; 28% average error", "Stock-outs of controllers in festive months; excess batteries in low season"],
  ["Demand seasonality (Diwali/festive Oct-Nov, wedding season Feb-Mar)", "Peaks are 30-40% above the annual average, but capacity is fixed"],
  ["Battery assembly line at 127-130% load in Oct-Nov", "Late orders, overtime cost, quality escapes"],
  ["Manual Excel MPS not linked to MRP", "Slow re-planning, data mismatch, low trust in numbers"],
  ["Long and variable supplier lead times for cells", "Expediting cost, 7-10 days average production delays"],
  ["Same lot size and safety stock for all materials", "High working capital in C-class parts; shortages in A-class parts"]
]));
c.push(cap("Table 4: Pain points identified in the scenario."));
c.push(H2("3.3 Objectives"));
c.push(bul("Raise finished-goods service level from about 88% to at least 95%."));
c.push(bul("Cut forecast MAPE at family level from 28% to below 12%."));
c.push(bul("Reduce total inventory value by 15% without increasing stock-outs."));
c.push(bul("Keep work-centre load within 85-100% of regular capacity, using flexible capacity only for peaks."));

// ---------- 4 Strategy ----------
c.push(H1("4. Production Planning Strategy"));
c.push(P("The strategy is built as a planning hierarchy, from long-term aggregate planning down to daily execution. Each layer feeds the next, and every layer has an owner, a cadence and a SAP object."));
c.push(table([1900, 1700, 2300, 3460], ["Horizon", "Cadence", "SAP object", "Decision"], [
  ["Strategic (12-18 months)", "Monthly S&OP", "SOP (MC87), PIRs", "Volume by product family, capacity needs, capex/hiring"],
  ["Tactical (3-12 months)", "Monthly", "MPS (MD40), long-term planning", "Peak build-ahead, supplier frame contracts"],
  ["Operational (1-13 weeks)", "Weekly", "MRP (MD01N), CM21", "Planned orders, purchase reqs, capacity levelling"],
  ["Execution (daily)", "Daily", "CO02, CO11N, COOIS", "Order release, shop-floor control, exceptions"]
]));
c.push(cap("Table 5: Planning hierarchy."));

c.push(H2("4.1 Demand forecasting"));
c.push(P("Segmentation. Materials are first classified by ABC (value) and XYZ (demand variability). Statistical forecasts are used for X and Y items, and judgemental or order-driven planning for Z items."));
c.push(table([1700, 2600, 5060], ["Segment", "Example at Vertex", "Approach"], [
  ["AX (high value, stable)", "VX-Lite vehicle, controllers", "Statistical forecast, weekly MRP, strategy 40"],
  ["AY / AZ", "VX-Max vehicle, battery cells", "Seasonal model plus sales input; strategy 40 or 50; higher safety stock"],
  ["BX / BY", "Motors, wiring harness", "MRP with reorder logic, lot-for-lot or weekly lots"],
  ["CX / CY / CZ", "Fasteners, labels, clips", "Reorder-point (VB) with min-max or Kanban, no MRP explosion"]
]));
c.push(cap("Table 6: Segmentation and planning approach."));
c.push(P("Method selection. Three candidate methods were back-tested on the last six months of the synthetic VX-Lite history (train: Oct-24 to Mar-26; test: Apr-26 to Sep-26). The results are in Table 7."));
c.push(table([3400, 1800, 1800, 2360], ["Method", "MAPE (%)", "Bias (%)", "Comment"], [
  ["3-month moving average (current)", R.backtest["3-month moving avg"].MAPE, R.backtest["3-month moving avg"].Bias, "Ignores seasonality; over-forecasts in the off-season"],
  ["Exponential smoothing (alpha = 0.3)", R.backtest["Exp. smoothing (a=0.3)"].MAPE, R.backtest["Exp. smoothing (a=0.3)"].Bias, "Level only; lags turning points"],
  ["Seasonal index x growth (recommended)", R.backtest["Seasonal index x growth"].MAPE, R.backtest["Seasonal index x growth"].Bias, "Captures festive and wedding peaks and trend"]
]));
c.push(cap("Table 7: Back-test on synthetic data. Source: src/planning_model.py in the project repository. A result this good depends partly on the pattern of the synthetic data and would be lower-precision in real life."));
c.push(P("Recommended process (monthly):"));
c.push(bul("Statistical baseline is generated (in SAP: forecast in MM/PP via MP30/MPBT, or SAP IBP if available).", "1."));
c.push(bul("Sales, marketing, finance and operations review the baseline in a consensus meeting and add known events (promotions, subsidy changes, competitor launches).", "2."));
c.push(bul("The agreed plan is transferred to demand management as PIRs (MD61) and to SOP for family-level planning; a frozen zone of 4 weeks avoids nervousness.", "3."));
c.push(bul("Forecast accuracy (MAPE, bias, tracking signal) is reviewed and the method is re-selected quarterly.", "4."));
c.push(P([B("Illustrative 12-month forecast. "), T("Applying the recommended approach with damped growth (full YoY growth " + R.growth + ", damped to " + R.damped + ") gives the plan below.")]));
c.push(table([1560, 1560, 1560, 1560, 1560, 1560], ["Month", "Forecast (units)", "Load (hours)", "Load (% of regular)", "Planned output", "Ending stock"],
  months.map((m, i) => [m, R.forecast[i], R.load_hours[i], R.load_pct[i] + "%", R.plan[i], R.end_inv[i]])));
c.push(cap("Table 8: VX-Lite forecast, battery-line load and levelled production plan (synthetic)."));

c.push(H2("4.2 Inventory control"));
c.push(P("Safety stock is calculated per material as SS = z x sigma_LT, where z is the service-level factor (1.65 for 95%, 2.05 for 98%), and sigma_LT is the demand standard deviation during the replenishment lead time. It is maintained in the material master (MRP 2 view) and reviewed quarterly."));
c.push(table([1800, 2400, 2400, 2760], ["Class", "Service level target", "MRP settings", "Replenishment"], [
  ["A", "98%", "MRP type PD, lot-for-lot (EX), safety stock by z x sigma", "Frame agreements, scheduling agreements, weekly supplier releases"],
  ["B", "95%", "PD, weekly lots (WB), safety stock", "Purchase orders, monthly consolidation"],
  ["C", "90%", "VB reorder-point or Kanban", "Min-max, vendor-managed inventory"]
]));
c.push(cap("Table 9: Inventory policy by class."));
c.push(bul("Dynamic safety stock for cells: raise the cell safety stock to 3 weeks of demand from August to October, and lower it after the festive season.", "Seasonal buffer:"));
c.push(bul("Use planned delivery time and GR processing time from actual supplier performance, updated via info records and reviewed quarterly.", "Lead-time hygiene:"));
c.push(bul("Configure MRP controller groups, exception messages 10 (new order), 20 (reschedule in), 96 (stock below safety) and 98 (stock below reorder point) and review them daily in MD07.", "Exception management:"));
c.push(bul("Physical inventory with cycle counting (A items monthly, B quarterly, C annually) supports stock accuracy required by MRP.", "Stock accuracy:"));

c.push(H2("4.3 Capacity planning"));
c.push(P([B("Available capacity, battery assembly. "), T("2 lines x 2 shifts x 8 hours x 26 days = 832 gross hours per month. With 90% utilisation and 95% efficiency the effective capacity is " + R.cap_hours + " hours, or about " + R.cap_units + " packs per month at 0.5 line-hours per pack. Overtime (+15%) raises the ceiling to about " + R.ot_units + " packs.")]));
c.push(P("Capacity in SAP is defined in the work centre (Capacity tab: shifts, breaks, utilisation, efficiency) and evaluated using CM01 (load by work centre) and CM21 (capacity planning table). Under this scenario the forecast load exceeds regular capacity in Oct, Nov and Mar."));
c.push(P("Levelling levers, in order of cost:"));
c.push(bul("Pre-build battery packs in the low season (May-Aug) up to a 400-pack strategic buffer, since batteries have limited shelf life, monitor state-of-charge and ageing.", "1. Pre-build:"));
c.push(bul("Shift secondary operations (labelling, functional test) to non-peak days and reduce changeover with SMED.", "2. Reschedule:"));
c.push(bul("Plan overtime and one extra Sunday shift for weeks with load above 100%.", "3. Overtime:"));
c.push(bul("Qualify a subcontract assembler for up to 250 packs per month from October to December, with an approved inspection plan.", "4. Subcontract:"));
c.push(bul("Multi-skill operators across battery and vehicle lines to absorb peaks.", "5. Flexible labour:"));
c.push(P("With these levers the plan in Table 8 keeps every month within reach: October (1,593 units) is met with overtime, November (1,800) needs overtime plus about 164 subcontracted packs, and safety stock stays between roughly 100 and 185 units."));

c.push(H2("4.4 SAP configuration summary"));
c.push(table([3000, 6360], ["Area", "Recommended setting"], [
  ["Strategy group / strategy", "VX vehicles: 40; battery packs: 10; variants and accessories: 50 / 70; C parts: no planning strategy (VB)"],
  ["MRP type / lot size", "PD + EX for A items; PD + WB for B; VB + FX for C"],
  ["MRP run", "Daily net-change MRP Live (MD01N) for the near horizon; weekly regenerative run for the long horizon"],
  ["Planning time fence", "4 weeks frozen; firmed planned orders inside the fence"],
  ["Scheduling", "Backward scheduling, scheduling margin key for a 2-day float on assembly"],
  ["Production version", "One per line; lot-size ranges maintained"],
  ["Capacity levelling", "Sequence planning using CM21; use of the planning table"],
  ["Order types", "PP01 for standard production; separate order type for rework"]
]));
c.push(cap("Table 10: Proposed configuration outline."));

// ---------- 5 KPIs ----------
c.push(H1("5. Critical Success Factors and KPIs"));
c.push(H2("5.1 Critical success factors"));
c.push(bul("Executive sponsorship and a monthly S&OP meeting with sales, finance and supply chain leaders.", "Governance:"));
c.push(bul("Accurate BOMs, routings, lead times and work-centre capacities; a data-quality owner per object.", "Master data quality:"));
c.push(bul("Cross-functional agreement on one number: a single consensus demand plan.", "Alignment:"));
c.push(bul("Trained MRP controllers, planner dashboards and clear exception-handling rules.", "People and process:"));
c.push(bul("Reliable shop-floor confirmations (CO11N) and goods movements posted the same day.", "Execution discipline:"));
c.push(bul("Regular supplier performance reviews with on-time-in-full targets.", "Supplier collaboration:"));
c.push(H2("5.2 KPI dashboard"));
c.push(table([2600, 2200, 2200, 2360], ["KPI", "Baseline", "Target (12 months)", "Owner"], [
  ["Forecast accuracy (1 - MAPE), family level", "72%", "88%+", "Demand planner"],
  ["Finished-goods service level", "88%", "95%+", "Supply chain head"],
  ["Schedule adherence", "78%", "92%", "Production manager"],
  ["Inventory turns", "5.2", "6.5", "Materials manager"],
  ["Battery line load (peak)", "130%", "<= 105%", "Capacity planner"],
  ["MRP exception backlog", "Unmeasured", "< 2 days old", "MRP controllers"],
  ["OEE, battery line", "68%", "78%", "Plant manager"]
]));
c.push(cap("Table 11: KPIs (baseline values are assumptions of the scenario)."));

// ---------- 6 Risks ----------
c.push(H1("6. Risk Analysis and Mitigation"));
c.push(table([2200, 900, 2900, 3360], ["Risk", "Rating", "Primary mitigation", "Second-level recommendation"], [
  ["Forecast error from demand shocks (subsidy change, competitor launch)", "High", "Monthly re-forecast, tracking signal alerts", "Scenario planning (optimistic / base / pessimistic) and a 10% flexible-capacity reserve; use sales-order-driven strategy 40 to consume forecast quickly"],
  ["Cell supply disruption or import delay", "High", "3-week seasonal safety stock, frame contracts", "Dual sourcing, supplier risk score, air-freight trigger rules, and early-warning MRP report on open purchase orders"],
  ["Poor master data (wrong lead times, BOM errors)", "High", "Data-governance owner and validation checks", "Automated master-data audit with reports (for example MRP-relevant field checks) before each MRP run"],
  ["MRP nervousness, constant re-planning", "Medium", "Planning time fence, firming", "Rolling frozen horizon and a change-log approved by the S&OP meeting"],
  ["Overloaded battery line and quality issues", "Medium", "Overtime and subcontracting plan", "Pre-build with battery ageing limits; add a quality gate on subcontracted output; invest in a third line business case"],
  ["Over-stocking C items and obsolescence", "Medium", "Min-max and Kanban", "Quarterly obsolescence review with a slow-mover disposal policy"],
  ["User adoption and resistance to change", "Medium", "Training, super-users", "Planner incentives tied to KPIs; a phased rollout with pilot on VX-Lite before scaling"],
  ["Poor integration between SAP and shop-floor data", "Low-Medium", "Daily confirmation discipline", "Barcode or MES integration; automatic confirmations for repetitive lines"]
]));
c.push(cap("Table 12: Risk register with second-level recommendations."));

// ---------- 7 Roadmap ----------
c.push(H1("7. Implementation Roadmap"));
c.push(table([1700, 2400, 5260], ["Phase", "Timeline", "Key activities"], [
  ["1. Foundation", "Weeks 1-4", "Master-data clean-up, ABC/XYZ segmentation, define KPIs, baseline forecast accuracy"],
  ["2. Design", "Weeks 5-8", "Configure strategies, MRP parameters, work-centre capacity; design S&OP calendar"],
  ["3. Pilot", "Weeks 9-14", "Pilot on VX-Lite and battery packs; run MRP Live; capacity levelling; parallel run with Excel"],
  ["4. Roll-out", "Weeks 15-24", "Extend to VX-Pro and VX-Max, C-part Kanban, supplier scheduling agreements"],
  ["5. Optimise", "Ongoing", "Quarterly method review, KPI reviews, consider SAP IBP / PP-DS for advanced planning"]
]));
c.push(cap("Table 13: Implementation roadmap."));

// ---------- 8 Conclusion ----------
c.push(H1("8. Conclusion"));
c.push(P("Production planning succeeds when demand, supply and capacity are planned together instead of in silos. For Vertex Mobility, the combination of segmentation-based planning strategies, a seasonal consensus forecast, statistically grounded inventory parameters and a levelled capacity plan directly addresses the stock-outs, excess inventory and peak-season overload. SAP PP provides the tools (SOP, demand management, MRP Live, capacity evaluation and production orders), but the results depend equally on data quality, governance and disciplined execution."));
c.push(P("Next steps for the internship (Weeks 2-4) are to translate this strategy into detailed SAP configuration and master data, run MRP and capacity scenarios, and analyse shop-floor execution."));

// ---------- References ----------
c.push(H1("9. References"));
["SAP Help Portal: Production Planning (PP) and Materials Requirements Planning documentation, help.sap.com.",
 "SAP Learning: Production Planning and Manufacturing Execution training materials, learning.sap.com.",
 "Chopra, S. and Meindl, P., Supply Chain Management: Strategy, Planning and Operation, Pearson.",
 "Silver, E., Pyke, D. and Thomas, D., Inventory and Production Management in Supply Chains, CRC Press.",
 "Hyndman, R. and Athanasopoulos, G., Forecasting: Principles and Practice, otexts.com/fpp3.",
 "Project repository: src/planning_model.py and data/*.csv (synthetic data for Vertex Mobility)."]
 .forEach(r => c.push(bul(r)));
c.push(P([T("Disclaimer: Vertex Mobility and all figures are hypothetical and created for this educational assignment.", { italics: true, size: 18 })], { spacing: { before: 200 } }));

const doc = new Document({ features: { updateFields: true },
  creator: "Intern", title: "Week 1 - Production Planning Strategy & Process Analysis",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: "2E5597", font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } }
    ]
  },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1273, right: 1273 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAP PP Internship | Week 1 | Page ", font: FONT, size: 18, color: "7F7F7F" }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "7F7F7F" })] })] }) },
    children: c
  }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync("docs/Week1_Production_Planning_Strategy_Report.docx", b); console.log("ok"); });
