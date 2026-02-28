# Estudio de Factibilidad — PetroVision RTIC

> **Proyecto Final de Ingeniería en Sistemas de Información — UTN FRM**
> **Versión:** 1.0 | **Fecha:** Febrero 2026

---

## 1. Factibilidad Técnica

### 1.1 Tecnologías seleccionadas

| Componente | Tecnología | Justificación |
|-----------|-----------|---------------|
| Frontend | React 18 + TypeScript + Vite | Ecosistema maduro, tipado fuerte, HMR rápido |
| Backend | FastAPI + Python 3.11 | Async nativo, auto-documentación OpenAPI, ecosistema ML |
| DB relacional | PostgreSQL 16 | ACID, JSON nativo, extensiones estadísticas |
| DB time-series | InfluxDB 2.7 | Optimizada para datos de sensores a alta frecuencia |
| Cache/PubSub | Redis 7 | Sub-milisegundo, Pub/Sub para WebSocket |
| Gráficos | Recharts 2.x | Composable, performante con miles de puntos |
| ML/IA | scikit-learn, XGBoost | Modelos probados en producción industrial |
| Contenedores | Docker Compose v2 | Reproducibilidad total, 6 servicios orquestados |
| Tiempo real | WebSocket (FastAPI) | Baja latencia, bidireccional |

### 1.2 Requisitos de hardware (desarrollo)

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4 cores |
| Disco | 10 GB libres | 20 GB SSD |
| SO | Linux/macOS/Windows 10+ | Ubuntu 22.04+ |

### 1.3 Competencias del equipo

El desarrollador cuenta con conocimientos en:
- Python (FastAPI, SQLAlchemy, scikit-learn)
- TypeScript/React (componentes, hooks, estado)
- Docker y Docker Compose
- Bases de datos SQL y NoSQL
- Estándares ISA (5.1, 18.2, 88, 101)
- Control estadístico de procesos (SPC)

### 1.4 Conclusión: **FACTIBLE** ✅

Todas las tecnologías son open-source, multiplataforma y con amplia documentación. El entorno de desarrollo se levanta con un solo comando (`docker compose up --build`).

---

## 2. Factibilidad Económica

### 2.1 Costos directos

| Concepto | Costo |
|----------|-------|
| Licencias de software | $0 (100% open-source) |
| Infraestructura cloud (desarrollo) | $0 (local con Docker) |
| Hardware adicional | $0 (PC existente del tesista) |
| Dominio web (opcional) | ~$5 USD/año |
| VPS para demo (opcional) | ~$10 USD/mes |

### 2.2 Costos indirectos (horas de trabajo)

| Actividad | Horas estimadas |
|-----------|----------------|
| Análisis y diseño | 80 h |
| Desarrollo | 240 h |
| Testing | 40 h |
| Documentación | 40 h |
| Presentación y defensa | 20 h |
| **Total** | **420 h** |

### 2.3 Beneficios potenciales

- Reducción de tiempos de detección de fallas: **~60%** (detección automática de anomalías)
- Mejora en calidad de producto: **~15%** (SPC continuo + predicción de calidad)
- Ahorro energético estimado: **~8%** (optimización multi-objetivo)
- Reducción de paradas no planificadas: **~40%** (mantenimiento predictivo)

### 2.4 ROI estimado (si se implementara en planta real)

Con una planta que produce 50 toneladas/mes de Anhídrido Maleico:
- Ahorro anual estimado: **~$120.000 USD** (reducción de merma, energía, paradas)
- Inversión en sistema: **~$15.000 USD** (desarrollo + despliegue)
- **ROI = 700% en el primer año**

### 2.5 Conclusión: **FACTIBLE** ✅

El costo de desarrollo es nulo en licencias. El valor potencial del sistema supera ampliamente la inversión en horas de trabajo.

---

## 3. Factibilidad Operativa

### 3.1 Usuarios identificados

| Perfil | Cantidad | Capacitación necesaria |
|--------|----------|----------------------|
| Operador de planta | 3-6 por turno | Mínima (interfaz ISA 101) |
| Ingeniero de proceso | 1-2 | Media (SPC, ML, reportes) |
| Supervisor | 1 | Media (reportes, auditoría) |
| Data Scientist | 1 | Baja (ya conoce ML) |
| Administrador IT | 1 | Media (Docker, backups) |

### 3.2 Facilidad de adopción

- **Interfaz ISA 101:** Diseñada según estándares industriales que los operadores ya conocen
- **PWA:** Accesible desde cualquier dispositivo con navegador (PC, tablet, celular)
- **Documentación integrada:** El sistema incluye módulo de documentación técnica
- **Credenciales por rol:** 5 perfiles con permisos diferenciados
- **Un solo comando de despliegue:** `docker compose up --build`

### 3.3 Resistencia al cambio

| Factor | Riesgo | Mitigación |
|--------|--------|------------|
| Operadores habituados a paneles físicos | Medio | Diseño HMI conforme ISA 101 (familiar) |
| Desconfianza en ML/IA | Medio | Intervalos de confianza + explicabilidad |
| TI limitado en PyMEs | Alto | Despliegue Docker simple, sin cloud |

### 3.4 Conclusión: **FACTIBLE** ✅

El sistema está diseñado para minimizar la curva de aprendizaje. La conformidad con estándares ISA garantiza familiaridad para operadores industriales.

---

## 4. Análisis de Riesgos

### 4.1 Matriz de riesgos

| ID | Riesgo | Prob. | Impacto | Nivel | Plan de contingencia |
|----|--------|-------|---------|-------|---------------------|
| R1 | Datos de proceso insuficientes para ML | Media | Alto | **ALTO** | Generador de datos configurable con distribuciones realistas |
| R2 | Falsa alarma por anomalía detectada | Media | Medio | **MEDIO** | Umbral configurable + confirmación operador |
| R3 | Latencia alta en WebSocket | Baja | Alto | **MEDIO** | Redis Pub/Sub + downsampling configurable |
| R4 | Pérdida de datos InfluxDB | Baja | Crítico | **ALTO** | Volúmenes Docker persistentes + backup periódico |
| R5 | Vulnerabilidad en endpoints API | Media | Alto | **ALTO** | JWT + validación Pydantic + CORS + rate limiting |
| R6 | Incompatibilidad navegador | Baja | Medio | **BAJO** | Chrome/Firefox/Edge modernos (ES2020+) |

### 4.2 Plan de mitigación general

- Commits frecuentes con mensajes descriptivos
- Docker volumes para persistencia de datos
- Healthchecks en todos los contenedores
- Logging estructurado en backend
- Validación de entrada en todos los endpoints

---

## 5. Seguridad Informática

### 5.1 Autenticación y autorización

| Mecanismo | Implementación |
|-----------|---------------|
| Autenticación | JWT (JSON Web Tokens) con bcrypt |
| Autorización | Roles: admin, operador, ingeniero, data_scientist, supervisor |
| Sesión | Token con expiración configurable |
| Passwords | Hash bcrypt con salt |

### 5.2 Seguridad de la API

| Control | Estado |
|---------|--------|
| CORS configurado | ✅ |
| Validación de entrada (Pydantic) | ✅ |
| Inyección SQL prevenida (SQLAlchemy ORM) | ✅ |
| HTTPS (en producción) | Configurable |
| Rate limiting | Configurable vía middleware |

### 5.3 Seguridad de infraestructura

- Contenedores Docker aislados en red interna
- PostgreSQL no expuesto externamente (solo red Docker)
- Redis sin acceso externo (solo red Docker)
- Variables de entorno para credenciales (.env)

### 5.4 OWASP Top 10 — Análisis

| # | Vulnerabilidad | Mitigación |
|---|---------------|------------|
| A01 | Broken Access Control | JWT + roles por endpoint |
| A02 | Cryptographic Failures | bcrypt + HTTPS recomendado |
| A03 | Injection | SQLAlchemy ORM, Pydantic schemas |
| A05 | Security Misconfiguration | Docker hardening, .env para secretos |
| A07 | Auth Failures | Login con rate limit, bcrypt |
| A09 | Logging & Monitoring | Módulo de auditoría completo |

---

## 6. Impacto Ambiental y Ético

### 6.1 Impacto ambiental positivo

- **Optimización energética:** Modelo multi-objetivo reduce consumo ~8%
- **Reducción de mermas:** Detección temprana de anomalías evita pérdida de producto
- **Menos residuos:** Mejor control de calidad reduce lotes rechazados
- **Eficiencia computacional:** Contenedores Docker minimizan overhead de recursos

### 6.2 Consideraciones éticas

- **Transparencia en ML:** Todos los modelos incluyen intervalos de confianza y explicabilidad
- **No reemplaza al operador:** Sistema de soporte a la decisión, no de control autónomo
- **Datos simulados:** No se utilizan datos personales ni confidenciales
- **Open-source:** Código abierto para revisión y auditoría

### 6.3 Responsabilidad profesional

El sistema cumple con el perfil del Ingeniero en Sistemas de Información (Plan 2008-2023 UTN):
- Diseño y gestión de sistemas de información
- Aplicación de estándares internacionales
- Integración de tecnologías emergentes (IA/ML)
- Resolución de problemas industriales reales

---

## 7. Conclusión General

| Dimensión | Resultado |
|-----------|----------|
| Técnica | ✅ FACTIBLE |
| Económica | ✅ FACTIBLE |
| Operativa | ✅ FACTIBLE |
| Seguridad | ✅ ACEPTABLE |
| Ambiental/Ético | ✅ POSITIVO |

**El proyecto es viable en todas las dimensiones evaluadas.**

---

## Historial de revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial |
