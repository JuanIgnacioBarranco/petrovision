# Gestión del Proyecto — PetroVision RTIC

> **Proyecto Final de Ingeniería en Sistemas de Información — UTN FRM**
> **Versión:** 1.0 | **Fecha:** Febrero 2026

---

## 1. Gestión de Recursos

### 1.1 Recursos humanos

| Recurso | Rol | Dedicación | Período |
|---------|-----|-----------|---------|
| Juan Ignacio Barranco | Tesista / Desarrollador full-stack | 20-25 h/semana | Feb – Jul 2026 |
| [Director] | Director de tesis | 2-3 h/semana | Feb – Jul 2026 |
| [Codirector] | Codirector | 1-2 h/semana | Feb – Jul 2026 |

### 1.2 Recursos tecnológicos

| Recurso | Especificación |
|---------|---------------|
| PC de desarrollo | Linux / 8GB+ RAM / SSD |
| Docker Desktop | v2+ con Docker Compose |
| GitHub | Repositorio + Issues + Projects + Actions |
| IDE | VS Code con extensiones (Python, TypeScript, Docker) |
| Navegador | Chrome DevTools para debugging |

---

## 2. Gestión de Entregables

### 2.1 Entregables por etapa

| Etapa | Entregable | Formato | Ubicación en repo |
|-------|-----------|---------|-------------------|
| Formulación | Plan de Proyecto | Markdown | `docs/01-formulacion/` |
| Factibilidad | Estudio de Factibilidad | Markdown | `docs/02-factibilidad/` |
| Gestión | Este documento | Markdown | `docs/03-gestion/` |
| Requerimientos | SRS (IEEE 830) | Markdown | `docs/04-requerimientos/` |
| Diseño | SAD + Diagramas UML | Markdown + Mermaid | `docs/05-diseno/` |
| Implementación | Código fuente | TypeScript + Python | `frontend/` + `backend/` |
| Testing | Plan + Evidencia | Markdown + Screenshots | `docs/07-testing/` |
| Informes | Inicial + Avance + Final | Markdown / PDF | `docs/08-informes/` |
| Presentación | Poster + Paper + Slides | PDF | `docs/09-presentacion/` |

### 2.2 Calendario de entregas formales

| Entregable | Fecha estimada | Estado |
|-----------|---------------|--------|
| Informe Inicial (formulación + factibilidad) | Mar 2026 | 🔄 En progreso |
| Sistema v0.5 (demo funcional) | Abr 2026 | ⬜ Pendiente |
| Informe de Avance | Abr 2026 | ⬜ Pendiente |
| Sistema v1.0 (feature-complete) | Jun 2026 | ⬜ Pendiente |
| Informe Final + Paper + Poster | Jun 2026 | ⬜ Pendiente |
| Defensa oral | Jul 2026 | ⬜ Pendiente |

---

## 3. Métricas del Proyecto

### 3.1 Métricas de progreso

| Métrica | Cómo se mide | Frecuencia |
|---------|-------------|-----------|
| Velocity (puntos/sprint) | Issues cerrados por sprint | Bisemanal |
| Burndown | Issues restantes vs tiempo | Semanal |
| Commits por semana | `git log --oneline` | Semanal |
| Cobertura de tests | `pytest --cov` | Por sprint |

### 3.2 Métricas de calidad del software

| Métrica | Herramienta | Objetivo |
|---------|-------------|----------|
| Cobertura de tests | pytest-cov | ≥ 70% |
| Complejidad ciclomática | radon (Python) | ≤ 15 por función |
| Deuda técnica | Análisis manual | Documentada en issues |
| Bugs abiertos | GitHub Issues (label: bug) | ≤ 5 al momento de entrega |
| Endpoints documentados | Swagger /docs | 100% |
| TypeScript strict | Vite build | 0 errores de compilación |

### 3.3 Métricas de rendimiento

| Métrica | Umbral | Cómo se mide |
|---------|--------|-------------|
| Tiempo de respuesta API (p95) | < 500ms | curl + time |
| Latencia WebSocket | < 3 segundos | Chrome DevTools |
| Build frontend | < 30 segundos | `vite build` |
| Docker compose up (cold) | < 5 minutos | time |
| Docker compose up (warm) | < 30 segundos | time |

---

## 4. Aseguramiento de Calidad

### 4.1 Revisiones de código

| Actividad | Frecuencia | Método |
|-----------|-----------|--------|
| Self-review antes de commit | Cada commit | `git diff` + revisión manual |
| Revisión con director | Bisemanal | Reunión + demo en vivo |
| Code quality check | Por sprint | radon + pylint (manual) |

### 4.2 Validación con estándares

| Estándar | Aspecto verificado | Evidencia |
|----------|-------------------|-----------|
| ISA 5.1 | Nomenclatura de instrumentos (TI-101, PI-102...) | Screenshots P&ID |
| ISA 18.2 | Ciclo de vida de alarmas (ACTIVE → ACK → NORMAL) | Consola de alarmas |
| ISA 88 | Estados de lote (PLANNED → IN_PROGRESS → COMPLETED) | Batch Tracker |
| ISA 101 | Colores HMI, layout, jerarquía visual | Capturas de pantalla |
| IEEE 830 | Estructura del SRS | Documento SRS.md |
| OWASP | Top 10 vulnerabilidades web | Análisis de seguridad |

### 4.3 Control de versiones

| Práctica | Implementación |
|----------|---------------|
| Branching | `main` (estable) + feature branches |
| Commits | Mensajes descriptivos en español o inglés |
| Tags | Versionado semántico (v0.1, v0.5, v1.0) |
| Releases | GitHub Releases con changelog |

---

## 5. Gestión de Cambios

### 5.1 Proceso de cambio

```
Solicitud de cambio
       │
       ▼
Evaluación de impacto (tiempo, alcance, riesgo)
       │
       ▼
Aprobación (director / tesista)
       │
       ▼
Implementación en feature branch
       │
       ▼
Merge a main + tag de versión
```

### 5.2 Registro de cambios significativos

| Fecha | Cambio | Impacto | Aprobado por |
|-------|--------|---------|-------------|
| Feb 2026 | Eliminación módulo Data Warehouse | Bajo (no afecta otros módulos) | Tesista |
| Feb 2026 | Adición SPC + Reportes | Alto (2 módulos nuevos full-stack) | Tesista |
| Feb 2026 | Adición Digital Twin | Medio (nuevo módulo frontend+backend) | Tesista |

---

## Historial de revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial |
