# Plan de Proyecto — PetroVision RTIC

> **Proyecto Final de Ingeniería en Sistemas de Información — UTN FRM**
> **Fecha de inicio:** Febrero 2026
> **Versión del documento:** 1.0

---

## 1. Definición del Problema

### 1.1 Problema identificado

Las plantas de procesos químicos en Argentina (producción de Anhídrido Maleico y extracción de Ácido Tartárico) enfrentan desafíos críticos:

- **Monitoreo manual** de variables de proceso (temperatura, presión, flujo, nivel, composición)
- **Tiempos de respuesta lentos** ante desviaciones de proceso
- **Falta de trazabilidad** en lotes de producción y alarmas de planta
- **Ausencia de herramientas estadísticas** para control de calidad (SPC)
- **Desconexión** entre datos de proceso, modelos predictivos y toma de decisiones

### 1.2 Contexto industrial

El sector químico requiere sistemas de control en tiempo real (RTIC) que cumplan con estándares ISA (International Society of Automation):
- **ISA 5.1** — Simbología e identificación de instrumentos
- **ISA 18.2** — Gestión de alarmas
- **ISA 88** — Control de lotes (Batch)
- **ISA 101** — Interfaces humano-máquina (HMI)

---

## 2. Objetivos

### 2.1 Objetivo General

Desarrollar un sistema RTIC web para monitoreo y control de procesos químicos industriales en tiempo real, integrando visualización de datos, inteligencia artificial, control estadístico de procesos y generación de reportes.

### 2.2 Objetivos Específicos

1. Implementar un dashboard HMI conforme a ISA 101 con diagramas P&ID interactivos (ISA 5.1)
2. Desarrollar un sistema de alarmas según ISA 18.2 con priorización y ciclo de vida completo
3. Integrar 6 modelos de Machine Learning para predicción, optimización y detección de anomalías
4. Implementar módulo SPC con cartas Shewhart X̄, CUSUM y EWMA con índices de capacidad
5. Crear sistema de reportes con exportación a Excel (.xlsx) para turnos, diarios, semanales y mensuales
6. Desarrollar gemelo digital (Digital Twin) con diagrama P&ID SVG interactivo
7. Asegurar la trazabilidad completa de lotes de producción (Batch Tracking)
8. Diseñar la arquitectura como microservicios contenerizados (Docker) para escalabilidad

---

## 3. Alcance

### 3.1 Dentro del alcance

| Módulo | Descripción |
|--------|-------------|
| Overview Dashboard | KPIs en tiempo real, tendencias, distribución de alarmas |
| P&ID Interactivo | Diagramas de proceso con simbología ISA 5.1 |
| Equipos 3D | Visualización CSS 3D rotable con datos en vivo |
| Consola de Alarmas | Gestión ISA 18.2 con 4 niveles de prioridad |
| Visor de Tendencias | Gráficos históricos con selector de rango |
| Batch Tracker | Seguimiento de lotes con estados y métricas |
| Simulador What-If | Escenarios hipotéticos de proceso |
| ML / IA | 6 modelos productivos (LSTM, XGBoost, IF, RF, GP, Pareto) |
| Digital Twin | Gemelo digital P&ID con datos en tiempo real |
| SPC | Cartas Shewhart, CUSUM, EWMA + capacidad de proceso |
| Reportes | Generación y exportación a Excel (.xlsx) |
| Sintonización PID | Ajuste visual de controladores PID |
| Documentación | Documentación técnica integrada en el sistema |
| Auditoría | Log de acciones y cambios |
| PWA | Progressive Web App con notificaciones push |

### 3.2 Fuera del alcance

- Conexión física a PLCs/DCS/SCADA reales (se simula)
- Certificación formal de seguridad funcional (IEC 61508/61511)
- Despliegue en infraestructura de producción industrial real
- Integración con sistemas ERP/MES existentes

### 3.3 Procesos simulados

| Código | Proceso | Reacción |
|--------|---------|----------|
| **MA-100** | Producción de Anhídrido Maleico | C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O |
| **AT-200** | Extracción de Ácido Tartárico | CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄ |

---

## 4. Stakeholders

| Rol | Nombre | Responsabilidad |
|-----|--------|----------------|
| Tesista / Desarrollador | Juan Ignacio Barranco | Desarrollo completo del sistema |
| Director de Tesis | [Nombre del director] | Supervisión académica y técnica |
| Codirector | [Nombre del codirector] | Apoyo técnico especializado |
| Tribunal evaluador | [Nombres] | Evaluación del proyecto final |
| Usuarios objetivo | Ingenieros de proceso, operadores de planta | Usuarios finales del sistema |

---

## 5. Metodología de Trabajo

### 5.1 Enfoque metodológico

Se adopta un enfoque **híbrido** combinando:

- **Scrum** para la gestión iterativa del desarrollo (sprints de 2 semanas)
- **PMBOK 7ª Ed.** para la documentación formal de gestión del proyecto
- **GitFlow** para el control de versiones

### 5.2 Sprints planificados

| Sprint | Período | Módulos / Entregables |
|--------|---------|----------------------|
| Sprint 1 | Sem 1-2 | Arquitectura Docker, Backend API base, Auth, DB |
| Sprint 2 | Sem 3-4 | Modelo de datos, Instrumentos, Simulador de datos |
| Sprint 3 | Sem 5-6 | Frontend base, Login, Overview Dashboard |
| Sprint 4 | Sem 7-8 | P&ID, Equipos 3D, Consola de Alarmas |
| Sprint 5 | Sem 9-10 | Tendencias, Batch Tracker, WebSocket |
| Sprint 6 | Sem 11-12 | ML/IA (6 modelos), What-If Simulator |
| Sprint 7 | Sem 13-14 | Digital Twin, SPC (Shewhart/CUSUM/EWMA) |
| Sprint 8 | Sem 15-16 | Reportes, PID Tuning, PWA |
| Sprint 9 | Sem 17-18 | Testing, QA, Documentación |
| Sprint 10 | Sem 19-20 | Informe final, Paper, Poster, Defensa |

### 5.3 Herramientas de gestión

| Herramienta | Uso |
|-------------|-----|
| GitHub Issues | Backlog, user stories, bugs |
| GitHub Projects | Kanban board por sprint |
| GitHub Milestones | Hitos de entrega |
| GitHub Actions | CI/CD (lint, test, build) |
| Git Tags | Versionado semántico (v0.1, v0.5, v1.0) |

---

## 6. Cronograma (Gantt simplificado)

```
Feb 2026 ──────────────────────────────────────────── Jul 2026
│ Sprint 1-2: Infraestructura + Backend ████
│ Sprint 3-4: Frontend + HMI               ████
│ Sprint 5-6: Modules Core                      ████
│ Sprint 7-8: ML/IA + SPC + Twin                    ████
│ Sprint 9:   Testing + QA                               ███
│ Sprint 10:  Docs + Defensa                                ███
│                                                              │
│ ► Informe Inicial ─────────────────── Feb                    │
│ ► Informe Avance ──────────────────── Abr                    │
│ ► Informe Final ───────────────────── Jun                    │
│ ► Defensa ─────────────────────────── Jul                    │
```

---

## 7. Gestión de Costos

### 7.1 Costos de desarrollo (estimados)

| Recurso | Horas | Costo/hora (ARS) | Total (ARS) |
|---------|-------|-------------------|-------------|
| Análisis y diseño | 80 h | $15.000 | $1.200.000 |
| Desarrollo backend | 120 h | $15.000 | $1.800.000 |
| Desarrollo frontend | 120 h | $15.000 | $1.800.000 |
| ML/IA | 60 h | $18.000 | $1.080.000 |
| Testing y QA | 40 h | $12.000 | $480.000 |
| Documentación | 40 h | $10.000 | $400.000 |
| **Total** | **460 h** | | **$6.760.000** |

### 7.2 Costos de infraestructura

| Servicio | Costo mensual | Período | Total |
|----------|--------------|---------|-------|
| Docker Desktop (dev) | $0 (gratis) | 5 meses | $0 |
| GitHub (repo + CI) | $0 (gratis) | 5 meses | $0 |
| Dominio (opcional) | ~$5 USD | 1 año | ~$5 USD |
| VPS producción (opcional) | ~$10 USD/mes | 5 meses | ~$50 USD |

---

## 8. Gestión de Riesgos

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| R1 | Atrasos en desarrollo de ML | Media | Alto | Modelos con fallback a valores por defecto |
| R2 | Incompatibilidad Docker entre SO | Baja | Alto | Docker Compose multiplataforma testeado |
| R3 | Pérdida de código fuente | Baja | Crítico | Git + GitHub + commits frecuentes |
| R4 | Complejidad de SPC estadístico | Media | Medio | Implementación incremental, validación con datos conocidos |
| R5 | Bajo rendimiento con datos masivos | Media | Medio | InfluxDB para time-series, downsampling |
| R6 | Cambios en requerimientos académicos | Baja | Alto | Comunicación frecuente con director |

---

## 9. Gestión de Comunicaciones

| Canal | Frecuencia | Participantes | Formato |
|-------|-----------|---------------|---------|
| Reunión con director | Bisemanal | Director + Tesista | Presencial/virtual |
| Email de avance | Semanal | Director + Codirector | Email + adjuntos |
| Commits GitHub | Diario | Tesista | Git log |
| Informes formales | 3 entregas | Tribunal completo | PDF formal |

---

## 10. Gestión de Calidad

### 10.1 Estándares aplicados

- **ISA 5.1** — Simbología de instrumentos
- **ISA 18.2** — Gestión de alarmas
- **ISA 88** — Control de lotes
- **ISA 101** — Diseño HMI
- **ISO 25010** — Calidad del producto software
- **OWASP Top 10** — Seguridad web

### 10.2 Métricas de calidad

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Cobertura de testing | ≥ 70% | pytest --cov |
| Vulnerabilidades OWASP | 0 críticas | Análisis manual + dependabot |
| Tiempo de respuesta API | < 500ms (p95) | Medición con curl/pytest |
| Disponibilidad | 99% (en demo) | Docker healthchecks |
| Documentación | 100% endpoints | Swagger auto-generado |

---

## Historial de revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial del plan |
