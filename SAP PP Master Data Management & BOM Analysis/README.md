# SAP PP Virtual Internship - Week 2: Master Data Management & BOM Analysis

Case study: **Vertex Mobility Pvt. Ltd.** (hypothetical electric two-wheeler manufacturer). Continues the Week 1 planning strategy.

## Contents

| Path                                                                                        | Description                                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `docs/Master_Data_BOM_Analysis_Report.docx`                                                 | Final report (18 pages, 7 diagrams)                                                                     |
| `src/master_data_audit.py`                                                                  | Builds as-is / to-be master data, runs 8 data-quality rules, explodes the BOM, estimates cost of errors |
| `src/make_diagrams.py`                                                                      | Draws all figures (matplotlib)                                                                          |
| `src/build_report.js`                                                                       | Generates the Word report (Node.js `docx` package)                                                      |
| `figures/`                                                                                  | PNG diagrams used in the report                                                                         |
| `data/material_master_*.csv`, `bom_*.csv`, `routing_*.csv`                                  | Synthetic as-is and to-be master data                                                                   |
| `data/audit_findings.csv`, `bom_explosion_oct26.csv`, `impact_estimate.csv`, `results.json` | Model outputs                                                                                           |

## Run

```bash
python src/master_data_audit.py   # data + audit + impact (needs only the standard library)
python src/make_diagrams.py       # needs matplotlib
node src/build_report.js          # needs: npm install docx
```

All company data and cost figures are synthetic and illustrative.
