# SAP PP Virtual Internship - Week 3: Production Order Scheduling & Execution Analysis

Case study: **Vertex Mobility Pvt. Ltd.** (hypothetical electric two-wheeler manufacturer). Continues Weeks 1 (planning strategy) and 2 (master data and BOM).

## Contents

| Path                                                   | Description                                                                                                                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/Production_Order_Scheduling_Report.docx`         | Final report (19 pages, 9 diagrams, table of contents)                                                                                                                  |
| `src/shop_simulation.py`                               | Discrete-event simulation of a 6-work-centre shop; compares FIFO, EDD, SPT, critical ratio and the proposed bottleneck-aware scheme; disruption and robustness analysis |
| `src/make_diagrams.py`                                 | Draws all figures (matplotlib)                                                                                                                                          |
| `src/build_report.js`                                  | Generates the Word report (Node.js `docx` package)                                                                                                                      |
| `figures/`                                             | PNG diagrams used in the report                                                                                                                                         |
| `data/orders.csv`                                      | Main order set (seed 42)                                                                                                                                                |
| `data/scenario_results.csv`                            | Results of the six scenarios on the main order set                                                                                                                      |
| `data/schedule_fifo.csv`, `data/schedule_proposed.csv` | Operation-level schedules                                                                                                                                               |
| `data/design_study_training.csv`                       | Design study of scheme variants on training seeds 1-25                                                                                                                  |
| `data/results.json`                                    | All outputs used in the report (including 40-seed robustness test)                                                                                                      |

## Run

```bash
python src/shop_simulation.py   # standard library only
python src/make_diagrams.py     # needs matplotlib
node src/build_report.js        # needs: npm install docx
```

All company data and results are synthetic and illustrative. Key finding: sequencing rules reduce changeovers and rush-order delay, but capacity at the bottleneck drives lateness.
