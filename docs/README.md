# Documentación del Repositorio — PetroVision RTIC

> Índice maestro de toda la documentación del Proyecto Final

---

## Estructura de Documentación

```
docs/
├── 01-formulacion/
│   └── plan-de-proyecto.md          ← Problema, objetivos, alcance, cronograma, riesgos, costos
│
├── 02-factibilidad/
│   └── estudio-de-factibilidad.md   ← Factibilidad técnica, económica, operativa, seguridad, ética
│
├── 03-gestion/
│   └── gestion-del-proyecto.md      ← Recursos, entregables, métricas, QA, control de cambios
│
├── 04-requerimientos/
│   └── SRS.md                       ← Especificación IEEE 830 (16 RF + 7 RNF)
│
├── 05-diseno/
│   └── arquitectura-de-software.md  ← SAD: contenedores, componentes, datos, decisiones
│
├── 06-implementacion/
│   └── (referencia al código en backend/ y frontend/)
│
├── 07-testing/
│   ├── plan-de-testing.md           ← Estrategia, 35 casos de prueba, criterios de aceptación
│   └── evidencia/                   ← Screenshots, outputs de tests
│
├── 08-informes/
│   └── README.md                    ← Guía de informes: inicial, avance, final
│
├── 09-presentacion/
│   └── (poster.pdf, paper.md, presentacion-defensa.pdf)
│
├── uml/
│   ├── uml-arquitectura.mermaid
│   ├── uml-casos-de-uso.mermaid
│   ├── uml-clases.mermaid
│   └── uml-secuencia.mermaid
│
├── manual/
│   └── manual-de-usuario.md         ← Guía de uso para operadores y usuarios
│
├── screenshots/
│   └── (capturas de la aplicación)
│
└── reingenieria-acido-tartarico.pdf ← Documento de referencia del proceso
```

---

## Mapeo con Etapas del PFI UTN

| Etapa PFI | Documentos |
|-----------|-----------|
| Formulación y planificación | `01-formulacion/plan-de-proyecto.md` |
| Evaluación de factibilidad | `02-factibilidad/estudio-de-factibilidad.md` |
| Gestión del proyecto | `03-gestion/gestion-del-proyecto.md` |
| Requerimientos | `04-requerimientos/SRS.md` |
| Diseño y arquitectura | `05-diseno/arquitectura-de-software.md` + `uml/` |
| Implementación | `backend/` + `frontend/` (código fuente) |
| Testing y QA | `07-testing/plan-de-testing.md` + `07-testing/evidencia/` |
| Informes formales | `08-informes/README.md` |
| Presentación | `09-presentacion/` |
| Manual | `manual/manual-de-usuario.md` |

---

## Milestones y Versiones

| Tag | Milestone | Contenido |
|-----|-----------|----------|
| `v0.1` | Infraestructura base | Docker, Auth, DB, simulador |
| `v0.3` | Frontend HMI | Login, Overview, P&ID, Alarmas, Tendencias |
| `v0.5` | Módulos core | Batch, What-If, ML/IA, WebSocket |
| `v0.7` | Módulos avanzados | Digital Twin, SPC, Reportes, PID |
| `v0.9` | QA + Documentación | Tests, evidencia, informes |
| `v1.0` | Release final | Sistema completo, informe final, defensa |
