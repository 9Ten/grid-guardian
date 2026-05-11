![PEA Logo](../asset/PEA-Logo.png)

# Koh Tao Microgrid — Dispatch Order

**17:30 Thu 27-Mar-2026** &nbsp;│&nbsp; Solve `#0503-1728` &nbsp;│&nbsp; Valid until next re-solve **18:00**

**NOW:** Load **12.8 MW** &nbsp;·&nbsp; Grid **4.0 MW (capped)** &nbsp;·&nbsp; BESS **61% SoC, discharging 7.2 MW** &nbsp;·&nbsp; Diesel **OFFLINE**

---

## 🔴 NEXT ACTION — Start Diesel Genset

| | |
|---|---|
| **Execute by** | **17:45** (T-15 from now) |
| **Command** | START → synchronize → close breaker → ramp to **3.0 MW by 17:55** → **6.5 MW by 19:00** |
| **Reason** | BESS hits 10% floor at ~19:45 without DG; load peaks 14.0 MW at 19:00 |
| **If missed** | Declare emergency. Begin manual load-shed per **SOP-MG-04** |

### Pre-Start Checklist (complete before 17:43)
- [ ] Day tank fuel level ≥ 80% &nbsp;·&nbsp; transfer pump in AUTO
- [ ] Lube-oil temp ≥ 40 °C &nbsp;·&nbsp; jacket water ≥ 50 °C (pre-heat ON)
- [ ] AVR in AUTO &nbsp;·&nbsp; Governor in DROOP (4%) &nbsp;·&nbsp; PMS in AUTO-PARALLEL
- [ ] Sync key inserted &nbsp;·&nbsp; check-sync relay armed
- [ ] DG breaker rack-in confirmed &nbsp;·&nbsp; protection (51V, 32, 40, 27/59) green

### Sync / Parallel (at 17:45 + sync window)
Close DG breaker only when **all three** met on synchroscope:
&nbsp;&nbsp;&nbsp;&nbsp;ΔV ≤ ±5% &nbsp;·&nbsp; Δf ≤ ±0.2 Hz &nbsp;·&nbsp; Δϕ ≤ ±10° (slip slow, 12 o'clock)

### Ramp Rate
Genset **+1.0 MW/min max**. Do not step-load. Hold 3.0 MW for 60 s after sync before further ramp.

---

## Hourly Setpoints (17:00 – 22:00)

| Window | Load | Grid | BESS | Diesel | SoC EoH |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 17:00–17:59 | 12.8 | 4.0 | DIS 7.2 | OFF | 55% |
| **18:00–18:59** | **13.5** | **4.0** | **DIS 5.5** | **3.0 MW** *(just synced)* | **52%** |
| **19:00–19:59** | **14.0** | **4.0** | **DIS 3.5** | **6.5 MW** | **46%** |
| 20:00–20:59 | 13.8 | 4.0 | DIS 3.8 | 6.0 MW | 40% |
| 21:00–21:59 | 12.5 | 4.0 | DIS 2.5 | 6.0 MW | 37% |

*All values in MW. Re-solve at 21:00 will reassess DG de-load.*

---

## Hard Limits — Do Not Breach

| Limit | Value | If breached |
|---|---|---|
| BESS SoC floor | **10%** (warn at 15%) | Trip BESS, raise DG to max, request emergency re-solve |
| Spinning reserve | **≥ 15% of load** | Re-solve immediately; do not accept new dispatch |
| Grid intake (33 kV cable) | **4.0 MW hard cap** | Cable protection trips at 4.4 MW — back off setpoint |
| DG min stable load | **3.0 MW** | Below this → load on resistive bank or take DG offline |

---

**Ack diesel-start authorisation by 17:43** &nbsp;│&nbsp; Supervisor ext. **201**
