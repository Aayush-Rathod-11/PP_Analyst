# SAP PP Virtual Internship - Week 4: Evaluation & Continuous Improvement Report

Case study: **Vertex Mobility Pvt. Ltd.** (hypothetical electric two-wheeler manufacturer). Final report building on Weeks 1-3.

## Contents
| Path | Description |
|---|---|
| `docs/Week4_Evaluation_Continuous_Improvement_Report.docx` | Final report (23 pages, 10 diagrams, table of contents) |
| `src/improvement_model.py` | 12-month KPI history, control chart limits, maturity scores, annual loss estimate, initiative portfolio, business case, KPI projection |
| `src/make_diagrams.py` | Draws all figures (matplotlib) |
| `src/build_report.js` | Generates the Word report (Node.js `docx` package) |
| `figures/` | PNG diagrams used in the report |
| `data/kpi_history.csv` | Synthetic monthly KPIs, Oct-25 to Sep-26 |
| `data/maturity.csv`, `data/loss_estimate.csv`, `data/initiatives.csv`, `data/kpi_projection.csv` | Model outputs |
| `data/results.json` | All outputs used in the report |

## Run
```bash
python src/improvement_model.py   # standard library only
python src/make_diagrams.py       # needs matplotlib
node src/build_report.js          # needs: npm install docx
```

All company data, costs and benefits are synthetic and illustrative.
