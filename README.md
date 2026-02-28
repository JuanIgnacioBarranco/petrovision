# PetroVision — Sistema RTIC de Control Industrial en Tiempo Real

> **Tesis 2026** — Monitoreo y control de procesos químicos: Producción de Anhídrido Maleico (MA-100) y Extracción de Ácido Tartárico (AT-200).

---

## Descripción

PetroVision es un sistema **RTIC** (Real-Time Industrial Control) web completo que incluye:

- **Diagramas P&ID interactivos** con simbología ISA 5.1 en tiempo real
- **Detalle 3D de equipos** con modelos CSS 3D rotables y datos en vivo
- **Dashboard de control** con KPIs animados, tendencias y distribución de alarmas
- **Simulación de procesos** con generación de datos en tiempo real (WebSocket)
- **Consola de alarmas** por prioridad ISA 18.2
- **Visor de tendencias** con gráficos históricos
- **Seguimiento de lotes** (batch tracking)
- **Simulador What-If** para escenarios hipotéticos
- **Módulo ML / IA** con 6 modelos productivos: predicción de temperatura (LSTM), optimizador de rendimiento (XGBoost), detector de anomalías ISA 18.2 (Isolation Forest), mantenimiento predictivo Weibull, predicción de calidad (Gaussian Process) y optimización energética multi-objetivo (Pareto)
- **Digital Twin** — Gemelo digital con diagrama P&ID SVG interactivo, nodos animados y detalle de instrumentos en tiempo real
- **Control Estadístico de Procesos (SPC)** — Cartas Shewhart X̄, CUSUM y EWMA con índices de capacidad (Cp/Cpk/Pp/Ppk) y detección automática de reglas Western Electric
- **Reportes Avanzados y Exportación** — Generación de reportes (turno/diario/semanal/mensual) con KPIs, estadísticas de alarmas, detalle de lotes y exportación a Excel (.xlsx)
- **Sintonización PID** visual
- **Documentación técnica** integrada (con descripción completa de cada módulo)
- **PWA** (Progressive Web App) con notificaciones push
- **Diseño mobile-responsive** con drawer sidebar y gestos táctiles
- **Auditoría** de acciones y cambios

### Procesos Simulados

| Código | Proceso | Reacción |
|--------|---------|----------|
| **MA-100** | Producción de Anhídrido Maleico | C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O |
| **AT-200** | Extracción de Ácido Tartárico | CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄ |

---

## Arquitectura

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend API  │────▶│  PostgreSQL   │
│  React+Vite  │ WS  │  FastAPI+Uvi   │     │  (Relacional) │
│  :3000       │◀────│  :8000         │────▶│  :5432        │
└──────────────┘     └────────────────┘     └──────────────┘
                            │
                            ├──────▶ InfluxDB :8086  (Series de tiempo)
                            ├──────▶ Redis    :6379  (Cache + Pub/Sub)
                            └──────▶ Adminer  :8080  (Admin DB - opcional)
```

**6 contenedores Docker** orquestados con Docker Compose.

---

## Requisitos Previos

Solo necesitás **2 cosas** instaladas en tu computadora:

### 1. Git
```bash
# Linux (Debian/Ubuntu)
sudo apt update && sudo apt install git -y

# macOS
brew install git

# Windows → Descargar de https://git-scm.com/downloads
```

### 2. Docker Desktop (incluye Docker Compose)

| Sistema | Instalación |
|---------|------------|
| **Linux (Ubuntu/Debian)** | Ver instrucciones abajo |
| **macOS** | Descargar [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) |
| **Windows 10/11** | Descargar [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) (requiere WSL2) |

#### Instalación Docker en Linux (Ubuntu/Debian):
```bash
# Instalar Docker Engine
curl -fsSL https://get.docker.com | sudo sh

# Agregar tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER

# Cerrar sesión y volver a abrir, o ejecutar:
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

> **Nota:** Docker Desktop en Windows/Mac ya incluye `docker compose`. En Linux se instala como plugin automáticamente con el script anterior.

---

## Instalación y Ejecución (Paso a Paso)

### Paso 1 — Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO> petrovision
cd petrovision
```

> Si recibiste el proyecto como `.zip`, simplemente descomprimilo y navegá a la carpeta:
> ```bash
> unzip petrovision.zip
> cd petrovision
> ```

### Paso 2 — Levantar todo el sistema

```bash
docker compose up --build
```

**Eso es todo.** Este único comando:

1. Descarga las imágenes base (PostgreSQL, InfluxDB, Redis, Node.js, Python)
2. Construye el frontend (React + Vite)
3. Construye el backend (FastAPI + Python)
4. Crea las bases de datos
5. Ejecuta las migraciones automáticas
6. Siembra datos iniciales (usuarios, procesos, instrumentos)
7. Inicia el simulador de datos en tiempo real
8. Levanta todos los servicios

> **Primera vez:** La primera ejecución tarda ~3–5 minutos porque descarga imágenes Docker (~2 GB). Las siguientes ejecuciones levantan en ~15 segundos.

### Paso 3 — Abrir en el navegador

Una vez que veas en la terminal mensajes como:
```
petrovision-api       | INFO:     Uvicorn running on http://0.0.0.0:8000
petrovision-frontend  | VITE v5.x.x  ready in xxx ms
petrovision-frontend  |   ➜  Local:   http://localhost:3000/
```

Abrí tu navegador en:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Aplicación principal |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger / OpenAPI |
| **Adminer** | [http://localhost:8080](http://localhost:8080) | Admin de base de datos |

### Paso 4 — Iniciar sesión

Usá cualquiera de estas credenciales de demostración:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin2026` | Administrador |
| `operador1` | `operador2026` | Operador |
| `ing_quimico` | `ingeniero2026` | Ingeniero Químico |
| `data_scientist` | `datascience2026` | Data Scientist |
| `supervisor` | `supervisor2026` | Supervisor |

---

## Comandos Útiles

```bash
# Levantar en segundo plano (sin ver logs)
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f api
docker compose logs -f frontend

# Detener todo (conserva datos)
docker compose down

# Detener y eliminar datos (reset completo)
docker compose down -v

# Reiniciar solo un servicio
docker compose restart api

# Reconstruir un servicio tras cambiar código
docker compose up --build api
docker compose up --build frontend

# Ver estado de los contenedores
docker compose ps
```

---

## Acceso desde otro dispositivo en la misma red (LAN / WiFi)

Para acceder desde un celular u otra PC en la **misma red WiFi/LAN**:

### 1. Obtener tu IP local
```bash
# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1

# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows (PowerShell)
ipconfig | findstr "IPv4"
```

### 2. Abrir en el otro dispositivo
Reemplazá `TU_IP` con la IP obtenida:
```
http://TU_IP:3000
```

Ejemplo: `http://192.168.1.50:3000`

> **Si no carga:** Asegurate de que el firewall permita conexiones en los puertos 3000 y 8000.
> ```bash
> # Linux — abrir puertos
> sudo ufw allow 3000
> sudo ufw allow 8000
> ```

---

## Estructura del Proyecto

```
petrovision/
├── docker-compose.yml          # Orquestación de servicios
├── README.md                   # Este archivo
│
├── backend/                    # API Python (FastAPI)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                # Migraciones de DB
│   └── app/
│       ├── main.py             # Punto de entrada
│       ├── api/endpoints/      # Rutas REST + WebSocket
│       ├── core/               # Config, DB, Redis, Security
│       ├── models/             # Modelos SQLAlchemy
│       ├── schemas/            # Pydantic schemas
│       └── services/           # Simulador, ML, Push, Seed
│
├── frontend/                   # App React (TypeScript + Vite)
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/                 # PWA: manifest, service worker, iconos
│   └── src/
│       ├── App.tsx             # Router principal
│       ├── index.css           # Estilos globales ISA-101
│       ├── components/
│       │   ├── layouts/        # MainLayout (sidebar, header)
│       │   └── modules/        # Módulos funcionales:
│       │       ├── Overview.tsx              # Dashboard KPIs
│       │       ├── ProcessFlowDiagram.tsx    # P&ID ISA 5.1
│       │       ├── EquipmentDetail3D.tsx     # Detalle 3D equipos
│       │       ├── TrendViewer.tsx           # Visor de tendencias
│       │       ├── AlarmConsole.tsx          # Consola de alarmas
│       │       ├── BatchTracker.tsx          # Seguimiento de lotes
│       │       ├── WhatIfSimulator.tsx       # Simulador What-If
│       │       ├── MLDashboard.tsx           # Panel IA/ML
│       │       ├── DigitalTwin.tsx           # Gemelo digital P&ID
│       │       ├── SPCDashboard.tsx          # Control Estadístico SPC
│       │       ├── ReportCenter.tsx          # Reportes y exportación
│       │       ├── PIDTuning.tsx             # Sintonización PID
│       │       ├── InstrumentList.tsx        # Lista instrumentos
│       │       ├── ProcessView.tsx           # Vista de proceso
│       │       ├── AuditLog.tsx              # Log de auditoría
│       │       ├── Documentation.tsx         # Documentación
│       │       └── Login.tsx                 # Login industrial
│       ├── hooks/              # useProcess, useAuth, useWebSocket
│       ├── services/           # API client (Axios)
│       └── types/              # TypeScript interfaces
│
├── ml/                         # Modelos de Machine Learning
├── docs/                       # Documentación (SRS, UML, Manual)
├── scripts/                    # Scripts utilitarios
└── infra/                      # Configuración de infraestructura
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | 18.2 + 5.3 |
| Bundler | Vite | 5.4 |
| Charts | Recharts | 2.x |
| Icons | Lucide React | 0.323 |
| State | Zustand | 4.x |
| Backend | FastAPI + Uvicorn | 0.109 |
| ORM | SQLAlchemy | 2.x |
| DB Relacional | PostgreSQL | 16 |
| DB Time-Series | InfluxDB | 2.7 |
| Cache / PubSub | Redis | 7 |
| Contenedores | Docker Compose | v2 |
| PWA | Service Worker + Web Push | — |

---

## Módulo de Inteligencia Artificial & Machine Learning

6 modelos desplegados en producción, accesibles desde el panel **ML / IA** del sistema.

| Modelo | Algoritmo | Versión | Métricas clave |
|--------|-----------|---------|----------------|
| Predicción de Temperatura | LSTM 4 capas | 2.1.0 | RMSE=1.2°C · R²=0.963 |
| Optimizador de Rendimiento | XGBoost + Response Surface | 2.0.0 | RMSE=0.8pp · R²=0.941 |
| Detector de Anomalías | Isolation Forest | 2.0.0 | F1=90.6% · AUC-ROC=0.953 |
| Mantenimiento Predictivo | Random Forest + Weibull | 2.0.0 | Accuracy=92.1% · F1=89.5% |
| Predicción de Calidad | Gaussian Process (RBF) | 1.0.0 | RMSE=0.12pp · R²=0.978 |
| Optimización Energética | Multi-Objetivo Pareto | 1.0.0 | Ahorro prom.=8.3% · R²=0.934 |

### Usar el módulo ML

1. Iniciar sesión con cualquier usuario
2. Navegar a **ML / IA** en el sidebar
3. Seleccionar un modelo (tarjeta con borde resaltado)
4. Ajustar los parámetros con los sliders
5. Pulsar **Ejecutar Inferencia**
6. Los resultados incluyen: valor predicho, intervalo de confianza 95%, interpretación en texto, recomendaciones de operación, desglose de scores y factores de riesgo (según modelo)

### Endpoint de inferencia (API)

```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin2026"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Ejecutar predicción
curl -X POST http://localhost:8000/api/v1/ml/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "yield_optimizer",
    "features": {
      "temperature": 422,
      "pressure": 2.1,
      "flow": 340,
      "catalyst_age_hours": 2000,
      "o2_ratio": 3.5
    },
    "horizon_minutes": 30
  }'
```

> Re-entrenamiento disponible para roles `data_scientist` y `admin` vía `POST /api/v1/ml/retrain/{model_name}`.

---

## Módulo Digital Twin (Gemelo Digital)

Diagrama P&ID SVG interactivo generado en tiempo real con simbología ISA 5.1:

- **Nodos de proceso:** Reactores, intercambiadores, separadores, tanques, compresores, bombas
- **Instrumentos en vivo:** Temperatura, presión, flujo, nivel, composición — coloreados según estado (normal/alarma)
- **Conexiones:** Líneas de flujo animadas entre equipos
- **Panel de detalle:** Click en un instrumento para ver valor actual, setpoint, límites HIHI/HI/LO/LOLO y estado
- **Auto-actualización:** Datos refrescados cada 2 segundos vía polling

Accesible desde **Digital Twin** en el sidebar.

---

## Módulo SPC — Control Estadístico de Procesos

Implementa 3 tipos de cartas de control complementarias para monitorear la estabilidad del proceso:

### Cartas disponibles

| Carta | Detecta | Parámetros |
|-------|---------|------------|
| **Shewhart X̄** | Desplazamientos grandes (>1.5σ) en una muestra | — |
| **CUSUM** | Desplazamientos pequeños sostenidos (0.5-1.5σ) | k (slack), h (decisión) |
| **EWMA** | Desplazamientos medianos con suavización | λ (smoothing), L (límites) |

### Índices de capacidad

| Índice | Interpretación | Umbral deseable |
|--------|---------------|----------------|
| **Cp** | Capacidad potencial (centrado perfecto) | ≥ 1.33 |
| **Cpk** | Capacidad real (considerando centrado) | ≥ 1.33 |
| **Pp / Ppk** | Rendimiento a largo plazo | ≥ 1.33 |

### Reglas Western Electric

Detección automática de patrones no aleatorios:
- **Regla 1:** 1 punto fuera de ±3σ (CRÍTICA)
- **Regla 2:** 9 puntos consecutivos del mismo lado de la media (ALTA)
- **Regla 3:** 6 puntos consecutivos con tendencia monótona (MEDIA)
- **Regla 4:** 2 de 3 puntos consecutivos fuera de ±2σ (ALTA)

### Endpoints SPC

```bash
# Listar instrumentos disponibles
curl http://localhost:8000/api/v1/spc/instruments \
  -H "Authorization: Bearer $TOKEN"

# Carta Shewhart
curl "http://localhost:8000/api/v1/spc/shewhart/TI-101?time_range=-6h" \
  -H "Authorization: Bearer $TOKEN"

# Carta CUSUM (k=0.5, h=5)
curl "http://localhost:8000/api/v1/spc/cusum/TI-101?time_range=-6h&k=0.5&h=5" \
  -H "Authorization: Bearer $TOKEN"

# Carta EWMA (λ=0.2, L=3)
curl "http://localhost:8000/api/v1/spc/ewma/TI-101?time_range=-6h&lam=0.2&L=3" \
  -H "Authorization: Bearer $TOKEN"
```

Accesible desde **SPC** en el sidebar.

---

## Módulo de Reportes Avanzados

Generación de reportes de producción con KPIs, alarmas y detalle de lotes, con exportación a Excel.

### Tipos de reporte

| Tipo | Período | Uso |
|------|---------|-----|
| **Turno** | 8 horas | Entrega al cambio de turno |
| **Diario** | 24 horas | Resumen de operaciones |
| **Semanal** | 7 días | Tendencia semanal |
| **Mensual** | 30 días | Análisis de rendimiento |

### KPIs incluidos

- **Producción:** Total producido (kg), alimentación total
- **Rendimiento:** Yield promedio (%), pureza promedio (%)
- **OEE:** Overall Equipment Effectiveness (%)
- **Económicos:** Costo, ingreso, margen ($)
- **Calidad:** Distribución por grado (A/B/C)
- **Alarmas:** Total, por prioridad, tiempo de respuesta promedio

### Exportación Excel (.xlsx)

Archivo con 3 hojas formateadas profesionalmente:
1. **KPIs** — Indicadores clave del período
2. **Lotes** — Tabla con estado, rendimiento, pureza, costos
3. **Alarmas** — Estadísticas y top instrumentos problemáticos

### Endpoints de Reportes

```bash
# Generar reporte diario
curl "http://localhost:8000/api/v1/reports/generate?process_id=1&report_type=daily&periods_back=1" \
  -H "Authorization: Bearer $TOKEN"

# Historial de reportes
curl "http://localhost:8000/api/v1/reports/history?process_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Descargar Excel
curl -o reporte.xlsx "http://localhost:8000/api/v1/reports/export/excel?process_id=1&report_type=daily" \
  -H "Authorization: Bearer $TOKEN"

# Resumen rápido (24h, 7d, 30d)
curl "http://localhost:8000/api/v1/reports/summary?process_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

Accesible desde **Reportes** en el sidebar.

---

## Resolución de Problemas

### "Port already in use" (Puerto ya en uso)
```bash
# Ver qué usa el puerto 3000
sudo lsof -i :3000
# o
sudo ss -tlnp | grep 3000

# Matar el proceso
sudo kill -9 <PID>

# O cambiar el puerto en docker-compose.yml:
# ports: "3001:3000"  ← cambiar el de la izquierda
```

### "Cannot connect to Docker daemon"
```bash
# Verificar que Docker esté corriendo
sudo systemctl start docker       # Linux
# En Windows/Mac: abrir Docker Desktop
```

### Ver errores del backend
```bash
docker compose logs api --tail 50
```

### Reset completo (borrar todo y empezar de cero)
```bash
docker compose down -v   # Elimina contenedores + volúmenes de datos
docker compose up --build
```

### "docker compose" no se reconoce
```bash
# Si tenés Docker Compose V1 (standalone):
docker-compose up --build    # Con guión

# Si no funciona, instalá el plugin:
sudo apt install docker-compose-plugin
```

### Problemas de memoria en Docker Desktop
> Si los contenedores se caen o no levantan, aumentá la memoria asignada a Docker:
> - **Docker Desktop → Settings → Resources → Memory → 4 GB mínimo**

---

## Puertos Utilizados

| Puerto | Servicio | Protocolo |
|--------|----------|-----------|
| 3000 | Frontend (Vite) | HTTP |
| 8000 | Backend API | HTTP + WebSocket |
| 5432 | PostgreSQL | TCP |
| 8086 | InfluxDB | HTTP |
| 6379 | Redis | TCP |
| 8080 | Adminer | HTTP |

> Si alguno de estos puertos está ocupado, podés cambiar el mapeo en `docker-compose.yml` editando la parte izquierda del campo `ports`: `"NUEVO_PUERTO:PUERTO_INTERNO"`.

---

## Datos del Proyecto

- **Proyecto:** Sistema RTIC para Procesos Industriales Químicos
- **Tesis:** 2026
- **Estándares:** ISA 5.1 (simbología), ISA 101 (HMI), ISA 18.2 (alarmas), ISA 88 (batch)
- **Última actualización:** Febrero 2026 — Módulos SPC (Shewhart/CUSUM/EWMA), Reportes Avanzados con exportación Excel, Digital Twin P&ID interactivo, ML/IA v2 con 6 modelos productivos

---

## TL;DR — Resumen Rápido

```bash
# 1. Instalar Docker Desktop → https://docker.com/products/docker-desktop
# 2. Clonar o descomprimir el proyecto
# 3. Ejecutar:
docker compose up --build
# 4. Abrir http://localhost:3000
# 5. Login: admin / admin2026
```

---

**Creado para:** Proyecto de Tesis — Sistemas de Producción Química
**Fecha:** 2026
