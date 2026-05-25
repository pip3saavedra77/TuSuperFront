---
description: Compara findings de SonarCloud con el código actual del frontend
---

# Audit Sonar Diff — Frontend Angular

Concilia SonarCloud (posiblemente desactualizado) con el código local.

## Prerrequisito

MCP `sonarqube` activo. ProjectKey: `Andreycho-B_tusuper-frontend`. Org: `andreycho-b`.

## Paso 1 — Snapshot SonarCloud

Vía MCP `sonarqube`:
1. `search_my_sonarqube_projects` con `q: "tusuper-frontend"`
2. `get_project_quality_gate_status` con projectKey
3. `search_sonar_issues_in_projects`:
   - `projects: ["Andreycho-B_tusuper-frontend"]`
   - `issueStatuses: ["OPEN", "CONFIRMED"]`
   - `severities: ["BLOCKER", "HIGH", "MEDIUM"]`
4. `get_component_measures`: `bugs`, `vulnerabilities`, `code_smells`, `coverage`, `duplicated_lines_density`, `ncloc`, `sqale_index` (deuda técnica)

## Paso 2 — Validar issues localmente

Para cada issue:
1. Lee archivo:línea
2. Verifica si la regla aún aplica
3. Clasifica:
   - **OBSOLETO** — ya resuelto / código eliminado
   - **PERSISTE** — sigue siendo válido
   - **MIGRADO** — código se movió, problema sigue

## Paso 3 — Detectar issues nuevos no en Sonar

Si existe `audit-reports/{fecha}/semgrep.md`:
- Lista issues detectados por Semgrep ausentes en Sonar
- Razón probable: Sonar desactualizado

Sugerir re-ejecutar análisis Sonar (ver Paso 6).

## Paso 4 — Hotspots de seguridad

Vía `search_security_hotspots`:
- Hotspots con status `TO_REVIEW`
- Para cada uno: revisar código y proponer resolution

## Paso 5 — Coverage gaps

Vía `search_files_by_coverage` con `maxCoverage: 50`:
- Lista componentes/services con baja cobertura
- Sugiere tests específicos

## Paso 6 — CI/CD recomendación

Si Sonar está desactualizado, generar workflow de GitHub Actions para `.github/workflows/sonar.yml`:

```yaml
name: SonarCloud
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  sonar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test -- --coverage --watch=false
      - uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Paso 7 — Reporte

`audit-reports/{fecha}/sonar-diff.md`:
- Métricas SonarCloud vs realidad local
- **Para cerrar en Sonar** (X obsoletos)
- **Para arreglar urgente** (Y persistentes CRITICAL/HIGH)
- **Para añadir** (CI workflow + secret SONAR_TOKEN)

## Paso 8 — Acciones automatizadas (con permiso)

Solo con confirmación uno-a-uno o lote-a-lote:
- `change_sonar_issue_status` → `falsepositive` o `accept` para obsoletos
- `change_security_hotspot_status` → `REVIEWED` para hotspots resueltos

NUNCA cambios masivos sin revisión.
