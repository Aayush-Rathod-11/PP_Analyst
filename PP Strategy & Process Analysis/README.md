# SAP Production Planning - 1: Production Planning Strategy & Process Analysis

Case study: **Vertex Mobility Pvt. Ltd.** (hypothetical electric two-wheeler manufacturer, Sanand, Gujarat).

## Contents
| Path | Description |
|---|---|
| `docs/Week1_Production_Planning_Strategy_Report.docx` | Final report (introduction, SAP PP fundamentals, scenario, strategy, KPIs, risks, roadmap, conclusion) |
| `src/planning_model.py` | Forecast back-test, 12-month forecast, rough-cut capacity and levelled production plan |
| `src/build_report.js` | Script that generates the report (Node.js, `docx` package) |
| `data/demand_history.csv` | 24 months of synthetic demand |
| `data/forecast_and_capacity.csv` | Forecast, load, planned output and stock by month |
| `data/results.json` | Model outputs used in the report |

## Run
```bash
python src/planning_model.py     # regenerates data/*.csv and results.json
node src/build_report.js         # rebuilds the .docx (npm install docx)
```

All company data are synthetic and created for educational purposes.
