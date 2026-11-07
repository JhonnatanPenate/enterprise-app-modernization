# Lab 19 · Strangler Fig: Inventory Extraction

| | |
|---|---|
| **Tag** | `lab-19` |
| **Course** | Cloud Development II · ESEN · Week 10 (Application modernization) |
| **Phase** | 1 of 2 (continues in Lab 20) |
| **Environment** | Local, Node.js only (no AWS, Docker or Kubernetes) · cost $0 |
| **Date** | 2026-11-06 |

← Back to the [README](../README.md) for the architecture, setup and API reference.

## Goal
Build a checkout monolith and extract its first capability, the inventory check, into an independent microservice. A facade routes each request to either path according to the `STRANGLE_INVENTORY` flag.

## What changed in this phase
| Component | Change |
|---|---|
| `monolith/` | New. Legacy checkout with `/checkout` plus `/checkout-payment-only`, prepared for the next step |
| `inventory-service/` | New. Extracted `GET /check-stock` |
| `facade/` | New. Single entry point with feature-flag routing |

## Test results

| # | Scenario | Expected | Result | Evidence |
|---|---|---|---|---|
| 1 | Monolith standalone | `source: monolito` | ✅ | [a-monolito](evidence/lab-19-a-monolito.png) |
| 2 | Inventory service standalone | `source: microservicio-inventario` | ✅ | [b-inventario](evidence/lab-19-b-inventario.png) |
| 3 | Facade starts in legacy mode | Log shows `STRANGLE_INVENTORY=false` | ✅ | [c-fachada-false-inicio](evidence/lab-19-c-fachada-false-inicio.png) |
| 4 | Legacy mode, 4 requests | All `source: monolito` | ✅ | [d1-strangle-false](evidence/lab-19-d1-strangle-false.png) |
| 5 | Modernized mode, 10 requests | `monolito (solo pago)` and `microservicio-inventario (via fachada)` on out-of-stock | ✅ | [d2-strangle-true](evidence/lab-19-d2-strangle-true.png) |
| 6 | Rollback to legacy | All `source: monolito` again | ✅ | [rollback](evidence/lab-19-rollback.png) |

Occasional `pago rechazado` and `sin stock` responses are expected, because both outcomes are simulated with `Math.random()`.

### Legacy mode
![Legacy mode](evidence/lab-19-d1-strangle-false.png)

### Modernized mode
![Modernized mode](evidence/lab-19-d2-strangle-true.png)

### Rollback
![Rollback](evidence/lab-19-rollback.png)

## Rollback analysis
If the inventory service failed in a real incident, setting `STRANGLE_INVENTORY=false` and restarting only the facade sends all `/checkout` traffic back to the monolith, which was never modified or shut down. No code is reverted, rebuilt or redeployed, and clients notice nothing because the API contract is unchanged. The rollback takes seconds, while reverting a full deployment requires rebuilding, testing and republishing the whole application, with more risk and downtime.

## Issues & lessons learned
| Issue | Cause | Fix |
|---|---|---|
| `curl: (7) Failed to connect to localhost:4000` | Monolith not running | Keep each service running in its own terminal |
| `error interno de la fachada` (HTTP 500) | Facade could not reach the monolith (ECONNREFUSED) | The three processes must be up at the same time |
| Flag ignored in PowerShell | `set VAR=value` creates a PowerShell variable, not an environment variable | Use `cmd`, or `$env:STRANGLE_INVENTORY = "true"` |
| Extra blank lines in code | Copied from a Word document | Reformatted in a separate `style` commit |

## Next
[Lab 20](lab-20.md): extract payment, retire the monolith and add distributed tracing.
