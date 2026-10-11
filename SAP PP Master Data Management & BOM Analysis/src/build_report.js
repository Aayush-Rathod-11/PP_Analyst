const fs = require('fs');
const d = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, LevelFormat, BorderStyle, PageBreak, TableOfContents, Footer, PageNumber, ImageRun } = d;
const R = JSON.parse(fs.readFileSync('data/results.json'));
const FONT = "Calibri", NAVY = "1F3864", GREY = "F2F2F2";
const inr = n => "Rs " + Math.round(n).toLocaleString("en-IN");
const T = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 22, ...o });
const B = (t, o = {}) => T(t, { bold: true, ...o });
const P = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: Array.isArray(t) ? t : [T(t)] });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT })] });
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
c.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Week 2: SAP PP Master Data Management & BOM Analysis", font: FONT, size: 48, bold: true, color: NAVY })] }));
c.push(new Paragraph({ spacing: { after: 600 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 8 } }, children: [new TextRun({ text: "Case study: Vertex Mobility Pvt. Ltd. (hypothetical electric two-wheeler manufacturer)", font: FONT, size: 24, italics: true })] }));
["Prepared by: [Your Name]", "Role: SAP PP Production Planning Analyst Intern", "Date: October 2026"].forEach(t => c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T(t)] })));
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", font: FONT, size: 32, bold: true, color: NAVY })] }));
c.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
c.push(new Paragraph({ children: [new PageBreak()] }));

// ---------------- 1 Introduction ----------------
c.push(H1("1. Introduction"));
c.push(H2("1.1 Purpose"));
c.push(P("Week 1 defined a production planning strategy for Vertex Mobility: forecast demand, control inventory and level capacity. That strategy only works if the data it runs on is correct. This Week 2 report therefore looks one layer deeper, at SAP PP master data management and Bill of Material (BOM) analysis. It explains why master data is the foundation of planning, analyses the BOM structure of the VX-Lite electric scooter, simulates a month in which data errors caused real production problems, and proposes a structured way to prevent and correct them."));
c.push(H2("1.2 Executive summary"));
c.push(P("In the simulated scenario, eight master data errors affected the October 2026 plan of " + R.demand.toLocaleString("en-IN") + " VX-Lite scooters. A rule-based audit found them in about " + R.asis.checks + " checks, a failure rate of only " + (100 - R.asis.score).toFixed(1) + "%, yet the estimated cost reached " + inr(R.total) + " (about Rs " + (R.total / 1e5).toFixed(1) + " lakh) in a single month. Three errors caused roughly 78% of the damage: a controller lead time of 30 days instead of 84, a battery cell BOM quantity of 48 instead of 52, and a battery routing time of 0.30 h instead of 0.50 h."));
c.push(P("The report recommends six measures:"));
c.push(bul("named data owners and a RACI model, with one steward per data object;", "Govern:"));
c.push(bul("naming rules, mandatory fields and validation rules before data is saved;", "Standardise:"));
c.push(bul("engineering change management with change numbers, impact checks and valid-from dates;", "Control change:"));
c.push(bul("a data-quality scorecard produced by automated audit rules (a working Python prototype is included in the repository);", "Monitor:"));
c.push(bul("feedback loops that compare master values with actual lead times, routing hours and yields;", "Learn from actuals:"));
c.push(bul("a phased clean-up and roll-out plan, with measurable targets.", "Remediate:"));
c.push(H2("1.3 Approach and sources"));
c.push(P("SAP concepts, table names and transaction codes come from public SAP Help Portal documentation, SAP Learning material and standard textbooks (see References). Vertex Mobility, its materials and every figure in the scenario are hypothetical and were created for this assignment. Calculations are reproducible with the scripts in the repository (src/master_data_audit.py and src/make_diagrams.py). Cost figures use stated assumptions and should be read as illustrative estimates, not measurements."));

// ---------------- 2 Importance ----------------
c.push(H1("2. Why Master Data Matters in SAP PP"));
c.push(H2("2.1 Master data versus transactional data"));
c.push(P("SAP separates data into two kinds. Master data describes the stable objects of the business, such as materials, BOMs, work centres, routings and vendors, and changes only occasionally. Transactional data records events, such as a planned order, a production order, a goods issue or a confirmation. Every transaction reads master data to decide how to behave. A production order, for example, copies its components from the BOM and its operations and times from the routing at the moment it is created. If the master record is wrong, every transaction built from it inherits the error, and the mistake repeats in each order until someone notices."));
c.push(table([2300, 3530, 3530], ["Aspect", "Master data", "Transactional data"], [
  ["Examples", "Material master, BOM, routing, work centre, info record", "Planned order, production order, goods movement, confirmation"],
  ["Rate of change", "Low; changed under control", "High; created every day"],
  ["Owner", "Data steward / functional owner", "Planner, buyer, operator"],
  ["Effect of an error", "Repeats in every order and every MRP run", "Usually limited to a single document"],
  ["Correction", "Change record and impact check required", "Reversal, cancellation or adjustment"]
]));
c.push(cap("Table 1: Master data and transactional data compared."));
c.push(H2("2.2 The SAP PP master data landscape"));
c.push(P("The material master sits at the centre. The BOM, routing, production version, work centre, vendor info records and plant stock all attach to it, which is why one wrong field can affect many processes at once. Figure 1 shows the main objects with their usual transaction codes and technical tables."));
c.push(fig("fig1_master_data_landscape.png", 520));
c.push(cap("Figure 1 shows the material master and the objects linked to it. Transaction codes and table names are those commonly documented for SAP ECC and S/4HANA."));
c.push(H2("2.3 From raw data to planning decisions"));
c.push(P("Planning outputs are derived from master data fields. The table below links the fields that matter most to the decisions they drive. It also shows what happens when the field is wrong, using the situations simulated later in this report."));
c.push(table([2300, 2700, 4360], ["Master data field", "Planning decision it drives", "Effect when wrong"], [
  ["BOM component quantity", "Dependent requirements and purchase quantities", "Under-ordering stops the line; over-ordering ties up cash"],
  ["Planned delivery time (info record / material)", "Order release date for purchased parts", "Orders are placed too late and production waits"],
  ["MRP type and MRP controller", "Whether and by whom an item is planned", "Item silently drops out of MRP (type ND)"],
  ["Routing standard times", "Capacity load, lead time and product cost", "Overload is invisible until the shop floor feels it"],
  ["Component and assembly scrap %", "Gross quantity needed to get good output", "Chronic shortages of the same component"],
  ["Unit of measure and conversion", "Purchase quantity from a requirement", "Order quantities off by a factor of 10 or more"],
  ["Lot size, safety stock, reorder point", "Order size and buffer", "Stock-outs or excess inventory"],
  ["Validity dates, status, change number", "Which BOM or version is active on a date", "Obsolete parts keep being ordered"],
  ["Production version", "Which BOM and routing a planned order uses", "Wrong or missing BOM/routing on the order"]
]));
c.push(cap("Table 2: Master data fields and the planning decisions that depend on them."));
c.push(P("Figure 3 follows data through the planning chain. Information moves from master data into MRP, planned orders, production orders and confirmations. Actual results flow back through a feedback loop that lets a data steward correct master values. Without that loop, estimated values stay in the system for years."));
c.push(fig("fig3_data_to_decision_flow.png", 620));
c.push(cap("Figure 3: Data-to-decision flow with the feedback loop."));

// ---------------- 3 Core objects ----------------
c.push(H1("3. Core Master Data Objects"));
c.push(H2("3.1 Material master"));
c.push(P("The material master (MM01 create, MM02 change, MM03 display) holds all information about a material, organised in views. A view is maintained at the level of its organisational unit, such as client, plant or storage location. For planning, the plant-level views are the most important."));
c.push(table([2100, 3300, 3960], ["View", "Key fields", "Why it matters for PP"], [
  ["Basic data", "Base unit of measure, material group, weights, material type (ROH, HALB, FERT, VERP)", "Material type controls which screens, accounts and processes apply"],
  ["MRP 1", "MRP type, MRP controller, lot-size procedure, reorder point, assembly scrap", "Decides how, by whom and in what quantities the item is planned"],
  ["MRP 2", "Procurement type (E in-house, F external, X both), special procurement, planned delivery time, GR processing time, in-house production time, scheduling margin key", "Provides the lead-time offsets used to schedule orders and the phantom assembly setting"],
  ["MRP 3", "Planning strategy group, consumption mode, availability check", "Selects the planning strategy (Week 1: 10, 40, 50, etc.)"],
  ["MRP 4", "Selection method for BOM explosion, individual/collective requirements, repetitive manufacturing flags", "Controls how BOM and production version are selected"],
  ["Work scheduling", "Production unit, under- and over-delivery tolerance, production scheduler, setup time", "Needed for production orders and shop-floor control"],
  ["Plant data / storage", "Batch management, shelf life, storage conditions", "Matters for batteries with limited shelf life"],
  ["Accounting / costing", "Valuation class, price control, standard price", "Feeds order costing and variance analysis"]
]));
c.push(cap("Table 3: Important material master views for production planning."));
c.push(H2("3.2 Bill of Material"));
c.push(P("A BOM (CS01 create, CS02 change, CS03 display) is a structured list of the components needed to produce a material, with quantities and units. It has a header (technical table STKO) and items (STPO), and the link between a material and its BOM is stored in MAST. Each BOM is valid for a plant, has a BOM usage (for example 1 for production, 2 for engineering/design, 3 universal, 5 sales and distribution), a status, and one or more alternatives."));
c.push(table([2600, 6760], ["BOM feature", "Description"], [
  ["Material BOM", "Standard BOM for a finished product or assembly; the type used in this report"],
  ["Alternative BOM", "Different BOMs for the same material (for example, different lot sizes or processes), selected by production version or MRP"],
  ["Multiple BOM", "Several BOMs of the same material in different plants or usages"],
  ["Variant BOM / configurable BOM", "A super BOM with selection conditions or dependencies for product variants"],
  ["Item categories", "L stock item, N non-stock item (bought directly for the order), T text item, D document item, R variable-size item, K class item"],
  ["Component scrap and operation scrap", "Percentage added to the required quantity; component scrap is on the BOM item"],
  ["Phantom assembly", "Assembly that is not produced or stocked; its components are passed straight to the parent (special procurement key 50 in the material master, or the phantom indicator on the BOM item)"],
  ["Validity and change number", "Valid-from and valid-to dates controlled by an engineering change number (CC01), so the BOM can change at a planned date"]
]));
c.push(cap("Table 4: BOM features relevant to planning."));
c.push(H2("3.3 Work centre and routing"));
c.push(P("A work centre (CR01) represents a machine, line or group of people where an operation is carried out. It stores available capacity (shift sequence, working hours, utilisation and efficiency), the scheduling formulas, and the link to a cost centre and activity types for costing. A routing (CA01) is a task list of operations. Each operation names a work centre and gives standard values for setup, machine and labour time. The system uses these values to calculate lead time, capacity requirement and product cost."));
c.push(H2("3.4 Production version"));
c.push(P("A production version (C223, table MKAL) joins a BOM alternative to a routing alternative for a given lot-size range and validity period. When MRP creates a planned order or the planner converts it to a production order, the system uses the production version to pick the BOM and routing. A material without a valid production version may produce planned orders without proper explosion or scheduling, or with the wrong ones."));
c.push(H2("3.5 Supporting objects and key T-codes"));
c.push(table([2700, 2900, 3760], ["Object", "T-code(s)", "Main tables / purpose"], [
  ["Material master", "MM01, MM02, MM03", "MARA (general), MARC (plant), MARD (storage), MAKT (descriptions)"],
  ["Bill of material", "CS01, CS02, CS03, CS20 (mass change)", "STKO, STPO, MAST"],
  ["BOM analysis", "CS11 level by level, CS12 multilevel, CS13 summarised, CS14 compare, CS15 where-used", "Explosion and where-used reports"],
  ["Work centre", "CR01, CR02, CR03", "CRHD (header), CRCO (cost centre link)"],
  ["Routing", "CA01, CA02, CA03, CA85 (mass replace work centre)", "PLKO (header), PLPO (operations), MAPL"],
  ["Production version", "C223", "MKAL"],
  ["Purchasing info record / source list", "ME11, ME01", "EINA, EINE; source of supply and delivery time"],
  ["Production resources / tools", "CF01", "Tools and fixtures assigned to operations"],
  ["Engineering change", "CC01, CC02", "Change master that controls validity of BOM and routing"],
  ["Planning analysis", "MD04, MD07, CM01", "Stock/requirements list, collective view, capacity load"]
]));
c.push(cap("Table 5: Key master data objects, transaction codes and tables (as commonly documented; S/4HANA also offers Fiori apps for several of these)."));

// ---------------- 4 BOM analysis ----------------
c.push(H1("4. BOM Structure Analysis"));
c.push(H2("4.1 The VX-Lite BOM"));
c.push(P("The VX-Lite scooter has a three-level BOM. The finished product is assembled from four sub-assemblies (frame, powertrain, battery pack, two wheel assemblies) and three purchased items (dashboard kit, fastener kit, packaging). The wiring harness is a sub-assembly of the powertrain, which gives the BOM its third level."));
c.push(fig("fig2_bom_structure.png", 624));
c.push(cap("Figure 2: Multi-level BOM of the VX-Lite (to-be, corrected state). Quantities are per vehicle."));
c.push(H2("4.2 Structure metrics"));
c.push(table([3600, 5760], ["Metric", "VX-Lite value"], [
  ["BOM depth", "3 levels (finished product, sub-assemblies, components)"],
  ["Number of BOM items", "23 in the corrected BOM (24 in the as-is BOM, which still carries obsolete BMS v1)"],
  ["Sub-assemblies with own BOM / routing", "5 (frame, powertrain, battery pack, wheel assembly, wiring harness)"],
  ["Purchased components", "18"],
  ["Longest supplier lead time", "84 days (motor controller), 45 days (lithium cells), 35 days (hub motor)"],
  ["Items used more than once", "Wheel assembly: quantity 2 per vehicle"]
]));
c.push(cap("Table 6: BOM structure metrics."));
c.push(H2("4.3 Cost and criticality analysis"));
c.push(P("Not every component deserves the same attention. The table ranks the main components by cost contribution per vehicle and shows their lead times. Components with high value and long lead time are the ones where a master data error is most expensive, and these should receive the strictest data control (class A in the ABC logic from Week 1)."));
const comp = [["Li-ion cells x52", 52 * 170, 45], ["Hub motor", 5200, 36], ["Wheel assemblies (tyre, rim, disc x2)", 2 * (650 + 1450 + 420), 14], ["Motor controller", 3200, 84], ["Frame parts and paint", 1800 + 950 + 0.35 * 620, 14], ["Dashboard & lighting kit", 1650, 26], ["BMS board v2", 1050, 29], ["Battery casing", 480, 18], ["Wiring harness parts", 3.5 * 95 + 140, 21], ["Packaging set", 380, 7], ["Fastener kit", 320, 7], ["Bracket", 210, 10], ["Nickel strip x2.4 m", 2.4 * 65, 20]];
const tot = comp.reduce((a, b) => a + b[1], 0); let cum = 0;
const crow = comp.sort((a, b) => b[1] - a[1]).map(r => { cum += r[1]; return [r[0], inr(r[1]), (100 * r[1] / tot).toFixed(1) + "%", (100 * cum / tot).toFixed(1) + "%", r[2] + " d", cum / tot <= 0.8 || r[1] / tot > 0.1 ? "A" : (cum / tot <= 0.95 ? "B" : "C")]; });
c.push(table([3000, 1500, 1200, 1300, 1200, 1160], ["Component", "Cost per vehicle", "Share", "Cumulative", "Lead time", "Class"], crow));
c.push(cap("Table 7: Cost contribution per vehicle (total material cost " + inr(tot) + ") using unit costs from data/material_master_tobe.csv. Class is assigned by cumulative share (A up to 80%, B up to 95%)."));
c.push(P("Four items (cells, hub motor, wheels and controller) account for about 74% of material cost. The controller combines mid-range value with the longest lead time (84 days), so a wrong lead time here delays the whole vehicle, which is exactly what happens in the scenario."));
c.push(H2("4.4 How the BOM drives MRP"));
c.push(bul("MRP starts from the planned independent requirement for the finished product (VXL-1000) and multiplies it down the BOM, level by level, to create dependent requirements for every component.", "Explosion."));
c.push(bul("Each material has a low-level code, the lowest level at which it appears in any BOM. MRP plans a material only after all its parents are planned, so every requirement is known before the material is netted.", "Low-level code."));
c.push(bul("Component scrap and assembly scrap increase the gross requirement. If scrap is missing, MRP assumes 100% yield.", "Scrap."));
c.push(bul("Lead-time offset places each component's need date before the parent's start date, using the routing and scheduling margin key. Planned delivery time and GR processing time set the order date for purchased items.", "Timing."));
c.push(bul("Phantom assemblies pass requirements straight to their components and are not stocked, which reduces the number of orders.", "Phantoms."));
c.push(bul("Net requirement = gross requirement - stock - scheduled receipts + safety stock, then rounded to the lot size.", "Netting."));
c.push(H2("4.5 Worked BOM explosion for October 2026"));
c.push(P("The October 2026 plan from Week 1 calls for " + R.demand.toLocaleString("en-IN") + " VX-Lite vehicles. The table compares the requirement calculated from the as-is (incorrect) BOM with the requirement from the correct BOM for the components that matter most."));
const nm = { "VXL-4100": "Li-ion cell 21700", "VXL-4150": "BMS board v1 (obsolete)", "VXL-4200": "BMS board v2", "VXL-3200": "Motor controller", "VXL-3310": "Copper wire (m)", "VXL-3300": "Wiring harness", "VXL-3400": "Controller mount bracket", "VXL-4000": "Battery pack", "VXL-5100": "Tyre", "VXL-6100": "Fastener kit M6-M8", "VXL-4400": "Nickel strip (m)" };
const rq = R.requirement.filter(r => nm[r[0]]).map(r => [r[0], nm[r[0]], r[1].toLocaleString("en-IN"), r[2].toLocaleString("en-IN"), (r[2] - r[1]) === 0 ? "0" : ((r[2] - r[1]) > 0 ? "+" : "") + (r[2] - r[1]).toLocaleString("en-IN")]);
c.push(table([1400, 3000, 1700, 1700, 1560], ["Material", "Description", "Correct requirement", "As-is requirement", "Difference"], rq, r => r[4] !== "0"));
c.push(cap("Table 8: BOM explosion results for 1,808 vehicles (source: data/bom_explosion_oct26.csv). Shaded rows differ between the correct and as-is BOM."));
c.push(P("Two rows differ. The as-is BOM under-states cell demand by 7,232 cells (4 cells in each of 1,808 packs) and requires 1,808 boards of the obsolete BMS v1 that should not be built into any pack. One wrong quantity and one forgotten end-of-life entry are enough to shift thousands of purchase units."));
c.push(H2("4.6 BOM sensitivity"));
c.push(P("A BOM error scales with volume and with the position of the component in the structure. An error of one unit on a quantity-2 component costs 1,808 units per month, while the same error on a sub-assembly that is used in several parents multiplies across all of them. Where-used analysis (CS15) before a change shows how many parents a component has, and level-by-level explosion (CS11) shows how deep an effect travels. For the VX-Lite, a one-cell error per pack equals 1,808 cells (about Rs " + Math.round(1808 * 170 / 1000) + " thousand) per month."));

// ---------------- 5 Scenario ----------------
c.push(H1("5. Scenario: Data Inaccuracies and Production Inefficiency"));
c.push(H2("5.1 Background"));
c.push(P("Vertex Mobility has grown from one model to three in two years. New materials were created by different people in engineering, purchasing and production, partly by copying older records and partly through a one-time data load from a spreadsheet system. There is no named data owner, no change-control step between engineering and SAP, and no routine audit. When the Week 1 plan for October 2026 was released, the first MRP run produced a plan that looked healthy, but it was built on faulty master data."));
c.push(H2("5.2 Error register"));
c.push(table([500, 2000, 2200, 2200, 2460], ["#", "Object / field", "Value in SAP (wrong)", "Correct value", "Consequence"], [
  ["1", "BOM VXL-4000 / VXL-4100 cell quantity", "48 per pack", "52 per pack (13S4P)", "7,232 cells short; packs cannot be finished"],
  ["2", "Material VXL-3200 controller / planned delivery time", "30 days", "84 days (12 weeks)", "Orders placed 54 days late; vehicles wait"],
  ["3", "Routing VXL-4000 / battery assembly time", "0.30 h per pack", "0.50 h per pack", "Planned load 76%, real load 127%"],
  ["4", "BOM VXL-4000 / BMS v1 (obsolete) without valid-to date", "Active in BOM", "Blocked, valid-to set", "Obsolete boards ordered and need write-off"],
  ["5", "Material VXL-3400 bracket / MRP type", "ND (no planning)", "PD (MRP)", "No requirement created; shortage found at line"],
  ["6", "Duplicate fastener kit VXL-6100 / VXL-6110", "Two numbers, same item", "One number", "Stock split; wrong stock view; extra safety stock"],
  ["7", "Copper wire / unit conversion roll to metre", "1 ROL = 10 M", "1 ROL = 100 M", "Purchase requisitions 10x too large"],
  ["8", "Wiring harness / scrap %", "0% maintained", "4% (historical)", "Chronic copper wire shortfall"]
]));
c.push(cap("Table 9: Master data errors injected into the scenario (as-is state)."));
c.push(H2("5.3 What happened"));
c.push(table([1700, 7660], ["When", "Event"], [
  ["Week 1, Monday", "MRP (MD01N) runs for October. Planned orders and purchase requisitions are created from the as-is data. Nothing in the plan looks wrong."],
  ["Week 1, Thursday", "Battery line reports that cell stock is 4 cells per pack short of the needed quantity. Planners find the BOM quantity is 48, not 52."],
  ["Week 2", "The controller shipment arrives about 54 days after the date the system should have ordered it. 22% of vehicles are blocked waiting for it."],
  ["Week 2", "Capacity report (CM01) shows only 76% load, yet the line works overtime. The routing time of 0.30 h is found to be a design estimate, not the measured 0.50 h."],
  ["Week 3", "Line stops for four hours because the controller mount bracket was never planned (MRP type ND)."],
  ["Week 3", "Buyer notices a requisition for 10 times the normal wire quantity (unit conversion), stops it before ordering."],
  ["Week 4", "Obsolete BMS v1 boards (300 units) are discovered in goods receipt; the BOM still lists them."]
]));
c.push(cap("Table 10: Timeline of the simulated disruption."));
c.push(H2("5.4 Detecting the errors with an audit"));
c.push(P("A rule-based audit (src/master_data_audit.py) scans the as-is material master, BOM and routing files. It runs " + R.asis.checks + " checks, finds all 8 injected errors and reports a data-quality score of " + R.asis.score + "%. After correction, the same rules find no issues in the to-be dataset (" + R.tobe.checks + " checks, score " + R.tobe.score + "%). The rules are listed in Appendix A."));
c.push(table([700, 2300, 2300, 2900, 1160], ["Rule", "Issue", "Object", "Detail", "Severity"], R.findings_list.map(f => [f[0], f[1], f[2], f[3], f[4]])));
c.push(cap("Table 11: Audit findings on the as-is data (source: data/audit_findings.csv)."));
c.push(P("A score of " + R.asis.score + "% sounds good, which is the trap: a small share of wrong records can cause large losses when they sit on high-value, long-lead or high-volume items. Quality should therefore be measured both by overall score and by the severity of failed rules on critical materials."));
c.push(H2("5.5 Business impact"));
c.push(P("Impact was estimated for one month with explicit assumptions, listed in the table. Total estimated impact is " + inr(R.total) + "."));
c.push(table([3200, 1500, 4660], ["Data error", "Estimated cost", "Assumption"], R.impact.map(r => [r[0], inr(r[1]), r[2]]).concat([["Total", inr(R.total), ""]])));
c.push(cap("Table 12: Cost of data errors for October 2026 (source: data/impact_estimate.csv). The assumptions are illustrative."));
c.push(fig("fig5_pareto.png", 600));
c.push(cap("Figure 5: Pareto of cost by data error; the first three errors account for roughly 78% of the total."));
c.push(fig("fig6_capacity.png", 470));
c.push(cap("Figure 6: With the routing time of 0.30 h, the plan showed a comfortable 76% load; with the real 0.50 h the battery line is 127% loaded."));
c.push(P("The two figures lead to three observations. First, the cost of data errors is concentrated, so fixing a few critical fields first returns most of the benefit. Second, errors on long-lead items (controller) and high-volume items (cells) cost far more than errors on cheap items. Third, the capacity error is the most dangerous because it hides itself: the capacity report looked healthy while the line was overloaded."));
c.push(H2("5.6 Root-cause analysis"));
c.push(fig("fig7_fishbone.png", 600));
c.push(cap("Figure 7: Fishbone diagram of root causes."));
c.push(table([2000, 7360], ["Root cause", "Evidence in the scenario"], [
  ["No data ownership", "Nobody was accountable for lead times, routing times or BOM accuracy; errors were noticed only by the line"],
  ["Weak change control", "Engineering changed the cell configuration to 13S4P but SAP was not updated; the old BMS was not blocked"],
  ["No validation at entry", "MRP type ND could be set on a BOM component; unit conversion accepted without check; duplicate description accepted"],
  ["Estimated, never updated values", "Lead times and routing times came from quotations and design estimates and were never compared with actuals"],
  ["Legacy migration", "A one-time spreadsheet load copied errors and created duplicates"],
  ["No monitoring", "No audit, KPI or exception report on data quality"]
]));
c.push(cap("Table 13: Root causes with evidence."));

// ---------------- 6 Solution ----------------
c.push(H1("6. Proposed Solution: A Master Data Management Framework"));
c.push(P("The solution has six building blocks: governance, standards, system controls, change management, monitoring and remediation. They work together, which is why a tool alone (for example validation rules without owners) does not solve the problem."));
c.push(H2("6.1 Governance and ownership"));
c.push(table([2300, 1500, 1500, 1500, 1300, 1260], ["Data object", "Engineering", "Planning", "Purchasing", "Production", "Data steward"], [
  ["Material master, basic data", "A", "C", "C", "I", "R"],
  ["Material master, MRP views", "I", "A / R", "C", "C", "C"],
  ["BOM", "A / R", "C", "I", "C", "C"],
  ["Routing and work centre", "C", "C", "I", "A / R", "C"],
  ["Info record, delivery time", "I", "C", "A / R", "I", "C"],
  ["Production version", "C", "A / R", "I", "C", "C"]
]));
c.push(cap("Table 14: RACI matrix (A accountable, R responsible, C consulted, I informed). The data steward guards quality and runs audits."));
c.push(H2("6.2 Data standards"));
c.push(bul("Material numbers follow a defined scheme (VXL-nnnn), descriptions follow a template (noun first, then attributes, with fixed abbreviations).", "Naming:"));
c.push(bul("Each material type has a list of mandatory fields; for example, every purchased component needs MRP type, MRP controller, planned delivery time, lot size and base unit.", "Mandatory fields:"));
c.push(bul("Unit-of-measure conversions are agreed with the supplier's pack size before the info record is created.", "Units:"));
c.push(bul("Lead times, routing times and scrap are set from measured data and reviewed every quarter.", "Evidence-based values:"));
c.push(H2("6.3 System controls in SAP"));
c.push(table([2700, 6660], ["Control", "How it prevents errors"], [
  ["Field selection (OMSR) and screen layout", "Makes planning fields required and removes unused fields, so key data cannot be skipped"],
  ["Material type and number range settings", "Enforces numbering scheme and prevents free numbering"],
  ["Duplicate check", "Warns when a similar description or number already exists (standard duplicate check or custom check or MDG matching)"],
  ["Validation rules / BAdIs / MDG rules", "Reject saving combinations such as ND with active BOM use, or missing delivery time on externally procured items"],
  ["Authorisations", "Only stewards can change MRP views and BOMs; others can display"],
  ["Engineering change management", "BOM and routing changes require a change number and valid-from date"],
  ["Material status and valid-to dates", "Obsolete materials are blocked for procurement and production"],
  ["Optional: SAP Master Data Governance (MDG)", "Central workflow, approval and quality rules for material and BOM data, if the licence is available"]
]));
c.push(cap("Table 15: Preventive controls. Specific configuration depends on the SAP release."));
c.push(H2("6.4 Change management process"));
c.push(P("Most BOM errors originate in changes, so changes need a gate. Figure 4 shows the proposed process. A request is first checked for impact (where-used, stock, open orders), then approved by all affected functions, then executed with a change number and a valid-from date. Validation includes a BOM comparison (CS14) and a test MRP run before release."));
c.push(fig("fig4_change_process.png", 620));
c.push(cap("Figure 4: Governed engineering change and master data process."));
c.push(H2("6.5 Data-quality monitoring"));
c.push(P("Quality is monitored along six dimensions: completeness (mandatory fields filled), accuracy (values equal reality), consistency (BOM, routing and info record agree), uniqueness (no duplicates), validity (values within rules) and timeliness (changes made before they are needed). The audit script turns these into rules that run automatically, for example every night, and produces a scorecard and an exception list."));
c.push(table([3200, 1800, 1800, 2560], ["KPI", "As-is (scenario)", "Target", "Owner"], [
  ["Data-quality score (all checks)", R.asis.score + "%", ">= 99%", "Data steward"],
  ["Critical-material rule failures (A items)", "6 of 8 findings", "0", "Data steward"],
  ["Lead-time deviation > 20% (planned vs actual)", "1 material", "0 on A items", "Purchasing"],
  ["Routing time deviation > 15%", "1 operation", "0", "Production"],
  ["BOM vs engineering BOM mismatches", "1", "0", "Engineering"],
  ["Duplicate materials", "1 pair", "0", "Data steward"],
  ["Time to approve a master data change", "Not measured", "<= 3 working days", "Data steward"],
  ["Share of changes made with change number", "Not measured", "100%", "Engineering"]
]));
c.push(cap("Table 16: Data-quality KPIs."));
c.push(H2("6.6 Correcting the existing errors"));
c.push(table([500, 3000, 3500, 2360], ["#", "Fix", "How in SAP", "Verification"], [
  ["1", "Correct cell quantity to 52", "CS02 with a change number; compare with CS14", "Explosion CS11 shows 52; test MRP"],
  ["2", "Update planned delivery time to 84 days", "MM02 (MRP 2) and ME12 info record", "MD04 shows corrected dates"],
  ["3", "Set routing time to 0.50 h", "CA02 standard value; recalculate load", "CM01 shows 127% before levelling"],
  ["4", "Remove obsolete BMS v1; block material", "CS02 end-date item; MM02 status", "Where-used (CS15) returns none"],
  ["5", "Set MRP type to PD", "MM02 (MRP 1)", "Run MD02 for the bracket"],
  ["6", "Merge duplicate fastener kits", "Block one number, transfer stock (MIGO), update BOMs (CS20)", "Duplicate check clean"],
  ["7", "Correct unit conversion to 100 M per roll", "MM02 additional data, ME12", "Test requisition shows normal quantity"],
  ["8", "Maintain 4% component scrap", "CS02 item scrap field", "Explosion shows +4%"]
]));
c.push(cap("Table 17: Remediation actions for each error."));
c.push(H2("6.7 Innovative improvements"));
c.push(bul("A nightly job compares planned delivery time with the actual receipt time of the last six deliveries. If the gap exceeds 20%, it proposes a new value to the buyer. This would have caught the 30-day versus 84-day controller error before the first MRP run.", "Actuals-based lead-time suggestion."));
c.push(bul("Confirmations (CO11N) already record actual hours. Comparing them with the routing standard every month and flagging deviations above 15% would reveal the 0.30 versus 0.50 h gap.", "Routing feedback from confirmations."));
c.push(bul("A nightly comparison of the engineering BOM (from the PLM or design system) with the SAP manufacturing BOM lists differences, for instance 48 versus 52 cells.", "Automatic EBOM-to-MBOM comparison."));
c.push(bul("Standardised descriptions plus fuzzy matching find near-duplicate materials like VXL-6100 and VXL-6110 before they are created.", "Duplicate prevention."));
c.push(bul("Score each material by value x lead time x BOM usage (as in Table 7) and apply the strictest rules and review frequency to the highest-risk 20%.", "Risk-based data control."));
c.push(bul("Publish the data-quality score and top exceptions to planners as a simple dashboard, so that quality is as visible as production output.", "Visible scorecard."));
c.push(H2("6.8 Expected result"));
c.push(P("After remediation, the audit reports " + R.tobe.findings + " findings and a score of " + R.tobe.score + "%. If one month like the scenario's occurred each quarter, the avoided cost would be around Rs " + (4 * R.total / 1e5).toFixed(0) + " lakh a year. That figure is only illustrative, but it shows that even a small data team pays for itself when it protects a few critical fields."));

// ---------------- 7 Best practices ----------------
c.push(H1("7. Best Practices for Data Integrity and Planning"));
c.push(table([2600, 6760], ["Area", "Recommended practice"], [
  ["Ownership", "Assign one accountable owner per data object and publish the RACI; include data quality in the owners' objectives"],
  ["Creation", "Use templates and request forms; create new materials through a controlled request, never by copying without review"],
  ["Mandatory data", "Define required fields per material type and enforce them in the system"],
  ["Changes", "Use change numbers with valid-from dates for every BOM and routing change; run an impact check first"],
  ["Where-used", "Check where-used (CS15) before changing or retiring any component"],
  ["Validation", "Compare BOM with engineering BOM, test MRP after every release"],
  ["Evidence", "Review lead times, routing times, scrap and yield quarterly against actuals"],
  ["Lifecycle", "Block obsolete materials, end-date BOM items and archive unused records"],
  ["Cleansing", "Run duplicate detection and standardisation before and after any data migration"],
  ["Training", "Train planners and buyers on how master data drives MRP; give super-users authority to flag errors"],
  ["Audit", "Run automated checks nightly and a formal audit each quarter; report results to management"],
  ["Documentation", "Keep a data dictionary: field, meaning, owner, rule, source"]
]));
c.push(cap("Table 18: Best practices."));

// ---------------- 8 Roadmap ----------------
c.push(H1("8. Implementation Roadmap"));
c.push(table([1700, 1500, 6160], ["Phase", "Timing", "Activities"], [
  ["1. Stabilise", "Weeks 1-2", "Fix the 8 errors (Table 17); block obsolete materials; freeze new material creation without approval"],
  ["2. Baseline", "Weeks 3-4", "Run the audit on all A and B materials; compute data-quality score; agree targets"],
  ["3. Govern", "Weeks 5-8", "Appoint owners and stewards; publish RACI, naming rules and mandatory field lists"],
  ["4. Control", "Weeks 9-14", "Configure field selection, validation, change numbers and authorisations; start the change process"],
  ["5. Automate", "Weeks 15-22", "Schedule nightly audits; implement lead-time, routing and BOM-comparison feedback; dashboard"],
  ["6. Sustain", "Ongoing", "Quarterly audit, review of KPIs, training, evaluation of SAP MDG"]
]));
c.push(cap("Table 19: Roadmap."));

// ---------------- 9 Conclusion ----------------
c.push(H1("9. Conclusion"));
c.push(P("Accurate master data is not an administrative detail; it is the input that every planning decision depends on. The Vertex Mobility scenario shows how eight small errors, affecting under 6% of the data checks, can cost about Rs 24 lakh in a single month by disrupting purchasing, capacity planning and the shop floor. The BOM analysis shows why: a component's quantity, lead time and scrap multiply across all its parents and across the full production volume."));
c.push(P("The proposed framework combines ownership, standards, system controls, a governed change process, automated monitoring and feedback from actual results. Together they turn master data from a one-time setup into a managed asset that keeps the Week 1 planning strategy reliable. Week 3 can now build on this foundation by running MRP and production execution on the corrected data."));

// ---------------- 10 References ----------------
c.push(H1("10. References"));
["SAP Help Portal: Bill of Material, Material Master, Work Center, Routing and Production Version documentation, help.sap.com.",
 "SAP Learning: Production Planning and Master Data training material, learning.sap.com.",
 "SAP Help Portal: Engineering Change Management and SAP Master Data Governance documentation.",
 "Chopra, S. and Meindl, P., Supply Chain Management: Strategy, Planning and Operation, Pearson.",
 "DAMA International, DAMA-DMBOK: Data Management Body of Knowledge (data quality dimensions).",
 "Project repository: src/master_data_audit.py, src/make_diagrams.py and data/*.csv (synthetic data)."].forEach(r => c.push(bul(r)));

// ---------------- Appendix ----------------
c.push(H1("Appendix A: Audit Rules"));
c.push(table([800, 3200, 5360], ["Rule", "Check", "Logic"], [
  ["R1", "Lead-time deviation", "Externally procured material: |planned - actual| / actual > 20%"],
  ["R2", "MRP type ND on BOM component", "Material with MRP type ND that appears as a component in any BOM"],
  ["R3", "Obsolete material in active BOM", "Status obsolete and still a BOM item without valid-to date"],
  ["R4", "Scrap not maintained", "Historical scrap > 0% while master scrap = 0%"],
  ["R5", "Possible duplicate", "Same description after removing case, spaces and punctuation"],
  ["R6", "BOM vs engineering BOM", "BOM quantity differs from engineering reference quantity"],
  ["R7", "UoM conversion", "Master conversion factor differs from supplier's pack quantity"],
  ["R8", "Routing time deviation", "|standard - actual| / actual > 15% for an operation"]
]));
c.push(cap("Table 20: Rules implemented in src/master_data_audit.py."));
c.push(P([T("Disclaimer: Vertex Mobility and all data are hypothetical and created for this educational assignment.", { italics: true, size: 18 })], { spacing: { before: 200 } }));

const doc = new Document({
  features: { updateFields: true }, creator: "Intern", title: "Week 2 - SAP PP Master Data Management & BOM Analysis",
  styles: { default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: "2E5597", font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } }] },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1273, right: 1273 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAP PP Internship | Week 2 | Page ", font: FONT, size: 18, color: "7F7F7F" }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "7F7F7F" })] })] }) },
    children: c }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync("docs/Week2_Master_Data_BOM_Analysis_Report.docx", b); console.log("ok"); });
