# Documento de Arquitectura de Software (SAD)

> **PetroVision RTIC — Sistema de Control Industrial en Tiempo Real**
> **Versión:** 1.0 | **Fecha:** Febrero 2026

---

## 1. Vista General de la Arquitectura

### 1.1 Estilo arquitectónico

**Arquitectura de microservicios contenerizados** con las siguientes características:
- Frontend SPA (Single Page Application) desacoplado del backend
- Backend API RESTful + WebSocket
- Servicios de datos especializados (relacional, time-series, cache)
- Orquestación con Docker Compose

### 1.2 Diagrama de contenedores (C4 - Level 2)

```
┌─────────────────────────────────────────────────────────────┐
│                        DOCKER NETWORK                        │
│                                                              │
│  ┌──────────────┐     ┌────────────────┐     ┌───────────┐  │
│  │   Frontend    │────▶│   Backend API  │────▶│PostgreSQL │  │
│  │  React+Vite   │ WS  │  FastAPI+Uvi   │     │  16       │  │
│  │  :3000        │◀────│  :8000         │     │  :5432    │  │
│  └──────────────┘     └────────────────┘     └───────────┘  │
│                              │                               │
│                              ├──────▶ InfluxDB :8086         │
│                              │        (Time-series)          │
│                              ├──────▶ Redis :6379            │
│                              │        (Cache + Pub/Sub)      │
│                              └──────▶ Adminer :8080          │
│                                       (Admin DB)             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Componentes y responsabilidades

| Contenedor | Tecnología | Puerto | Responsabilidad |
|-----------|-----------|--------|-----------------|
| **frontend** | React 18 + TypeScript + Vite | 3000 | UI, gráficos, navegación, PWA |
| **api** | FastAPI + Python 3.11 + Uvicorn | 8000 | REST API, WebSocket, ML inference, simulación |
| **postgres** | PostgreSQL 16 | 5432 | Datos relacionales (usuarios, instrumentos, alarmas, lotes, reportes) |
| **influxdb** | InfluxDB 2.7 | 8086 | Series de tiempo (lecturas de sensores) |
| **redis** | Redis 7 | 6379 | Cache de sesiones, Pub/Sub para WebSocket |
| **adminer** | Adminer | 8080 | Administración visual de PostgreSQL |

---

## 2. Vista de Componentes — Backend

### 2.1 Estructura de paquetes

```
backend/app/
├── main.py              # Punto de entrada, lifespan, registro de routers
├── api/endpoints/       # 13 routers REST + 1 WebSocket
│   ├── auth.py          # POST /login, POST /register
│   ├── processes.py     # CRUD procesos químicos
│   ├── instruments.py   # CRUD instrumentos ISA
│   ├── alarms.py        # Alarmas ISA 18.2 (CRUD + acknowledge)
│   ├── batches.py       # Lotes de producción
│   ├── readings.py      # Lecturas de sensores (InfluxDB)
│   ├── ml.py            # Inferencia + reentrenamiento ML
│   ├── digital_twin.py  # Gemelo digital (layout + estado vivo)
│   ├── spc.py           # SPC: Shewhart, CUSUM, EWMA
│   ├── reports.py       # Reportes + exportación Excel
│   ├── audit.py         # Log de auditoría
│   ├── push.py          # Web Push notifications
│   └── websocket.py     # WebSocket /ws (datos en tiempo real)
├── core/
│   ├── config.py        # Settings (Pydantic BaseSettings, .env)
│   ├── database.py      # SQLAlchemy engine, sessionmaker
│   ├── influxdb.py      # Cliente InfluxDB, query_sensor_history()
│   ├── redis.py         # Cliente Redis
│   └── security.py      # JWT encode/decode, bcrypt, get_current_user
├── models/              # SQLAlchemy ORM models
│   ├── user.py          # User (username, role, hashed_password)
│   ├── process.py       # Process (code, name, instruments[])
│   ├── instrument.py    # Instrument (tag, sp, hi, lo, hihi, lolo, unit)
│   ├── alarm.py         # Alarm (priority, type, state ISA 18.2)
│   ├── batch.py         # Batch + ProductionReport
│   ├── audit.py         # AuditLog
│   ├── ml_model.py      # MLModel (metadata, métricas)
│   └── push_subscription.py  # PushSubscription (Web Push)
├── services/
│   ├── data_generator.py  # Simulador de datos en tiempo real
│   ├── ml_service.py      # 6 modelos ML: predict() + retrain()
│   ├── push_service.py    # Envío de notificaciones push
│   └── seed.py            # Seed de datos iniciales
└── schemas/               # Pydantic schemas (request/response)
```

### 2.2 Flujo de datos en tiempo real

```
data_generator.py                 WebSocket /ws
    │                                  ▲
    │ Cada 2 segundos                  │
    ▼                                  │
 InfluxDB ◀──write──  Genera valores ──┤── broadcast vía Redis Pub/Sub
                      para 32 tags     │
                                       │
 PostgreSQL ◀── Alarmas si valor       │
                fuera de límites       │
                                       ▼
                              Frontend (Recharts)
```

---

## 3. Vista de Componentes — Frontend

### 3.1 Estructura de módulos

```
frontend/src/
├── App.tsx                  # React Router (15 rutas)
├── main.tsx                 # Punto de entrada
├── index.css                # Estilos globales ISA-101
├── components/
│   ├── layouts/
│   │   └── MainLayout.tsx   # Sidebar + Header + Outlet
│   └── modules/             # 15 módulos funcionales
│       ├── Login.tsx
│       ├── Overview.tsx
│       ├── ProcessFlowDiagram.tsx
│       ├── EquipmentDetail3D.tsx
│       ├── TrendViewer.tsx
│       ├── AlarmConsole.tsx
│       ├── BatchTracker.tsx
│       ├── WhatIfSimulator.tsx
│       ├── MLDashboard.tsx
│       ├── DigitalTwin.tsx
│       ├── SPCDashboard.tsx
│       ├── ReportCenter.tsx
│       ├── PIDTuning.tsx
│       ├── InstrumentList.tsx
│       ├── ProcessView.tsx
│       ├── AuditLog.tsx
│       └── Documentation.tsx
├── hooks/
│   ├── useAuth.ts           # Zustand store (token, user, login/logout)
│   ├── useProcess.ts        # Zustand store (proceso activo, instrumentos)
│   ├── useWebSocket.ts      # Hook WebSocket (reconexión automática)
│   └── usePushNotifications.ts
├── services/
│   └── api.ts               # Axios instance + 15 API namespaces
└── types/
    └── index.ts             # Interfaces TypeScript
```

### 3.2 Flujo de navegación

```
Login ──▶ MainLayout
              │
              ├── Overview (/)
              ├── ProcessFlowDiagram (/proceso)
              ├── ProcessView (/process)
              ├── EquipmentDetail3D (/equipos)
              ├── TrendViewer (/tendencias)
              ├── AlarmConsole (/alarmas)
              ├── BatchTracker (/lotes)
              ├── WhatIfSimulator (/whatif)
              ├── MLDashboard (/ml)
              ├── DigitalTwin (/digital-twin)
              ├── SPCDashboard (/spc)
              ├── ReportCenter (/reports)
              ├── PIDTuning (/pid)
              ├── InstrumentList (/instrumentos)
              ├── AuditLog (/auditoria)
              └── Documentation (/documentacion)
```

---

## 4. Vista de Datos

### 4.1 PostgreSQL — Modelo Entidad-Relación

```
User ──────────── AuditLog
  │
  └── role (admin, operador, ingeniero, data_scientist, supervisor)

Process ──┬── Instrument ──── Alarm
          │       │
          │       └── tag (TI-101, PI-102, etc.)
          │
          ├── Batch ──── ProductionReport
          │
          └── MLModel

PushSubscription ── User
```

### 4.2 InfluxDB — Series de tiempo

```
Bucket: process_data
  └── Measurements: degC, bar, kg_h, pct, m3_h, pH, mS_cm, ...
        └── Tags: instrument (TI-101, PI-102, ...)
        └── Fields: value (float)
        └── Timestamp: nanosegundos UTC
```

### 4.3 Redis

```
Cache:
  └── sensor:{tag} → último valor (TTL 10s)
  └── session:{user_id} → datos de sesión

Pub/Sub:
  └── channel: process_data → broadcast a WebSocket
```

---

## 5. Decisiones arquitectónicas clave

| Decisión | Justificación | Alternativas descartadas |
|----------|--------------|-------------------------|
| FastAPI vs Django | Async nativo, OpenAPI auto, rendimiento | Django REST más pesado |
| InfluxDB vs TimescaleDB | Nativa time-series, downsampling built-in | TimescaleDB requiere PostgreSQL extension |
| React vs Vue | Ecosistema mayor, TypeScript first-class | Vue viable pero menos librerías ISA |
| Docker Compose vs K8s | Simplicidad para dev/demo, un solo comando | K8s excesivo para 6 servicios |
| Recharts vs D3.js | API declarativa React-friendly | D3 más flexible pero más código |
| Zustand vs Redux | API mínima, sin boilerplate | Redux Toolkit viable pero más complejo |
| JWT vs Sessions | Stateless, escalable, estándar | Sessions más simples pero stateful |

---

## 6. Patrones de diseño aplicados

| Patrón | Uso en PetroVision |
|--------|-------------------|
| Repository | SQLAlchemy models como repositorios de datos |
| Service Layer | `services/` (ml_service, data_generator, push_service) |
| Observer | Redis Pub/Sub para WebSocket broadcast |
| Strategy | 6 modelos ML intercambiables con interfaz `predict()` |
| Factory | `data_generator.py` genera datos según tipo de instrumento |
| Singleton | Conexiones DB/InfluxDB/Redis (módulos Python) |

---

## Historial de revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial — arquitectura completa |
