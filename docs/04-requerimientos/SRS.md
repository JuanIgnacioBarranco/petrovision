# Especificación de Requerimientos de Software (SRS)

> **PetroVision RTIC — Sistema de Control Industrial en Tiempo Real**
> **Conforme a IEEE 830-1998 / ISO/IEC/IEEE 29148:2018**
> **Versión:** 1.0 | **Fecha:** Febrero 2026

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales del sistema PetroVision RTIC, destinado al monitoreo y control de procesos químicos industriales en tiempo real.

### 1.2 Alcance del producto

PetroVision es un sistema web RTIC que:
- Monitorea variables de proceso (T, P, F, L, composición) en tiempo real
- Visualiza diagramas P&ID interactivos con simbología ISA 5.1
- Gestiona alarmas según ISA 18.2
- Integra modelos de ML/IA para predicción y optimización
- Implementa control estadístico de procesos (SPC)
- Genera reportes de producción con exportación a Excel
- Funciona como PWA en cualquier dispositivo con navegador

### 1.3 Definiciones y acrónimos

| Acrónimo | Significado |
|----------|------------|
| RTIC | Real-Time Industrial Control |
| P&ID | Piping and Instrumentation Diagram |
| SPC | Statistical Process Control |
| HMI | Human-Machine Interface |
| OEE | Overall Equipment Effectiveness |
| CUSUM | Cumulative Sum Control Chart |
| EWMA | Exponentially Weighted Moving Average |
| WE | Western Electric (rules) |
| PWA | Progressive Web Application |

---

## 2. Descripción General

### 2.1 Perspectiva del producto

PetroVision opera como sistema standalone, sin dependencias de SCADA/DCS externos. Los datos de proceso se generan mediante un simulador configurable que reproduce comportamiento realista de planta química.

### 2.2 Funciones principales

1. Dashboard de monitoreo con KPIs en tiempo real
2. Diagramas P&ID interactivos (2 procesos: MA-100, AT-200)
3. Visualización 3D de equipos con datos en vivo
4. Consola de alarmas con priorización ISA 18.2
5. Visor de tendencias históricas
6. Seguimiento de lotes (Batch Tracking)
7. Simulador What-If
8. Panel ML/IA con 6 modelos predictivos
9. Gemelo digital (Digital Twin)
10. Control estadístico de procesos (SPC)
11. Centro de reportes con exportación Excel
12. Sintonización PID visual
13. Documentación técnica integrada
14. Log de auditoría
15. Notificaciones push (PWA)

### 2.3 Características de los usuarios

| Tipo de usuario | Experiencia técnica | Módulos principales |
|----------------|-------------------|-------------------|
| Operador de planta | Baja-Media | Overview, P&ID, Alarmas, Tendencias |
| Ingeniero de proceso | Alta | SPC, ML, Digital Twin, What-If |
| Supervisor | Media | Reportes, Batch, Auditoría |
| Data Scientist | Alta | ML/IA, SPC |
| Administrador | Alta | Todos + configuración |

### 2.4 Restricciones

- Navegadores soportados: Chrome 90+, Firefox 88+, Edge 90+
- Resolución mínima: 1024x768 (responsive hasta 375px)
- Conexión: LAN/WiFi (para WebSocket en tiempo real)
- Docker requerido para despliegue

---

## 3. Requerimientos Funcionales

### RF-001: Autenticación de usuarios
- **Prioridad:** Alta
- **Descripción:** El sistema debe permitir login con usuario/contraseña
- **Criterio de aceptación:** JWT generado con expiración configurable, hash bcrypt

### RF-002: Dashboard Overview
- **Prioridad:** Alta
- **Descripción:** Mostrar KPIs de proceso en tiempo real (producción, temperatura, presión, alarmas activas)
- **Criterio:** Actualización < 3 segundos vía WebSocket

### RF-003: Diagrama P&ID interactivo
- **Prioridad:** Alta
- **Descripción:** Visualizar diagramas P&ID con simbología ISA 5.1 y valores en vivo
- **Criterio:** 32 instrumentos visibles con estado de color (normal/alarma)

### RF-004: Consola de alarmas ISA 18.2
- **Prioridad:** Alta
- **Descripción:** Listar alarmas activas con prioridad (CRITICA/ALTA/MEDIA/BAJA), reconocimiento y ciclo de vida
- **Criterio:** Alarmas ordenadas por prioridad y timestamp, filtro por tipo

### RF-005: Visor de tendencias
- **Prioridad:** Alta
- **Descripción:** Gráficos de series temporales para cualquier instrumento, con selector de rango
- **Criterio:** Rangos: 1h, 6h, 24h, 7d. Downsampling automático.

### RF-006: Batch Tracking
- **Prioridad:** Media
- **Descripción:** Seguimiento de lotes con estado, yield, pureza, costos
- **Criterio:** Estados: PLANNED, IN_PROGRESS, COMPLETED, ABORTED

### RF-007: Simulador What-If
- **Prioridad:** Media
- **Descripción:** Permitir al usuario modificar variables de entrada y simular efecto en producción
- **Criterio:** Resultados en < 2 segundos, comparación con estado actual

### RF-008: Módulo ML/IA
- **Prioridad:** Alta
- **Descripción:** 6 modelos de ML accesibles desde interfaz gráfica con sliders
- **Modelos:** LSTM (temp), XGBoost (yield), Isolation Forest (anomalías), Random Forest (mantenimiento), Gaussian Process (calidad), Multi-objetivo (energía)
- **Criterio:** Inferencia < 1s, intervalo de confianza 95%, recomendaciones en texto

### RF-009: Digital Twin
- **Prioridad:** Media
- **Descripción:** Gemelo digital con diagrama P&ID SVG interactivo y datos en tiempo real
- **Criterio:** Nodos clicables, panel de detalle por instrumento, auto-refresh 2s

### RF-010: SPC — Carta Shewhart X̄
- **Prioridad:** Alta
- **Descripción:** Carta de control con CL, UCL, LCL, zonas A/B/C, detección Western Electric
- **Criterio:** 4 reglas WE implementadas, índices Cp/Cpk/Pp/Ppk calculados

### RF-011: SPC — Carta CUSUM
- **Prioridad:** Media
- **Descripción:** Carta CUSUM con parámetros k y h configurables
- **Criterio:** Detección de desplazamientos < 1.5σ en < 20 muestras

### RF-012: SPC — Carta EWMA
- **Prioridad:** Media
- **Descripción:** Carta EWMA con λ y L configurables, límites dinámicos
- **Criterio:** Suavización visible, señales identificadas con color rojo

### RF-013: Generación de reportes
- **Prioridad:** Alta
- **Descripción:** Generar reportes por turno/diario/semanal/mensual con KPIs, alarmas y lotes
- **Criterio:** Reporte guardado en DB, visualización inmediata en frontend

### RF-014: Exportación Excel
- **Prioridad:** Media
- **Descripción:** Descargar reporte como archivo .xlsx con formato profesional
- **Criterio:** 3 hojas (KPIs, Lotes, Alarmas), encabezados con estilo, columnas autoajustadas

### RF-015: Log de auditoría
- **Prioridad:** Media
- **Descripción:** Registrar acciones de usuarios (login, cambios, reconocimientos de alarma)
- **Criterio:** Filtrable por usuario, acción y fecha

### RF-016: PWA y notificaciones push
- **Prioridad:** Baja
- **Descripción:** El sistema debe ser instalable como PWA y enviar notificaciones push para alarmas críticas
- **Criterio:** Manifest válido, Service Worker registrado, Web Push API

---

## 4. Requerimientos No Funcionales

### RNF-001: Rendimiento
- Tiempo de respuesta API: < 500ms (p95)
- Actualización WebSocket: < 3 segundos
- Carga inicial de frontend: < 5 segundos (LAN)

### RNF-002: Disponibilidad
- 99% uptime durante demo/evaluación
- Healthchecks Docker configurados para auto-restart

### RNF-003: Seguridad
- Autenticación JWT con bcrypt
- CORS restringido
- Validación de entrada con Pydantic
- Sin exposición de puertos internos (PostgreSQL, Redis)

### RNF-004: Escalabilidad
- Soportar ≥ 32 instrumentos simultáneos
- ≥ 5 usuarios concurrentes en WebSocket
- ≥ 10.000 puntos de datos por consulta SPC

### RNF-005: Usabilidad
- Interfaz conforme a ISA 101 (HMI industrial)
- Responsive: funcional en pantallas ≥ 375px
- Accesible: contraste de colores para indicadores de alarma

### RNF-006: Mantenibilidad
- Código TypeScript tipado (frontend)
- Type hints Python (backend)
- Documentación OpenAPI auto-generada
- Arquitectura modular por endpoints

### RNF-007: Portabilidad
- Docker Compose multiplataforma (Linux, macOS, Windows)
- Sin dependencias de sistema operativo específico
- Navegadores evergreen (Chrome, Firefox, Edge)

---

## 5. Interfaces Externas

### 5.1 Interfaces de usuario
- Login: formulario usuario/contraseña con feedback visual
- Dashboard: sidebar navegable + área de contenido principal
- Gráficos: Recharts con tooltips interactivos

### 5.2 Interfaces de hardware
- No aplica (datos simulados, sin PLCs/sensores físicos)

### 5.3 Interfaces de software
- PostgreSQL 16 (JDBC/SQLAlchemy)
- InfluxDB 2.7 (HTTP API / influxdb-client-python)
- Redis 7 (redis-py)

### 5.4 Interfaces de comunicación
- HTTP/HTTPS (REST API)
- WebSocket (datos en tiempo real)
- Web Push (notificaciones)

---

## Historial de revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial — 16 RF + 7 RNF |
