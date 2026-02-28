# Plan de Testing y Aseguramiento de Calidad

> **PetroVision RTIC — Sistema de Control Industrial en Tiempo Real**
> **Versión:** 1.0 | **Fecha:** Febrero 2026

---

## 1. Estrategia de Testing

### 1.1 Niveles de prueba

| Nivel | Alcance | Herramienta | Responsable |
|-------|---------|-------------|-------------|
| Unitario | Funciones individuales | pytest | Desarrollador |
| Integración | Endpoints API completos | pytest + httpx | Desarrollador |
| Sistema | Flujos end-to-end | Navegador manual + curl | Desarrollador |
| Aceptación | Cumplimiento de RF/RNF | Checklist manual | Director/Tribunal |

### 1.2 Cobertura objetivo

| Componente | Cobertura objetivo |
|-----------|-------------------|
| Backend API endpoints | ≥ 80% |
| Servicios (ML, generador, seed) | ≥ 70% |
| Modelos (SQLAlchemy) | ≥ 60% |
| Frontend (componentes críticos) | Manual (navegador) |

---

## 2. Casos de Prueba — Backend

### 2.1 Autenticación (auth.py)

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| T-AUTH-01 | Login válido | admin/admin2026 | 200 + JWT token |
| T-AUTH-02 | Login inválido | admin/wrong | 401 Unauthorized |
| T-AUTH-03 | Token expirado | JWT vencido | 401 Unauthorized |
| T-AUTH-04 | Sin token | Header vacío | 401 Unauthorized |
| T-AUTH-05 | Registro nuevo usuario | datos válidos | 201 Created |

### 2.2 SPC (spc.py)

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| T-SPC-01 | Shewhart con datos | TI-101, -6h | 200 + points[], CL, UCL, LCL |
| T-SPC-02 | Shewhart instrumento inexistente | XX-999 | 404 Not Found |
| T-SPC-03 | CUSUM parámetros default | TI-101, k=0.5, h=5 | 200 + cusum_pos[], cusum_neg[] |
| T-SPC-04 | EWMA λ extremo | TI-101, λ=0.01 | 200 + ewma[] (muy suave) |
| T-SPC-05 | Capability indices | TI-101 | Cp, Cpk, Pp, Ppk > 0 |
| T-SPC-06 | Western Electric reglas | TI-101 | violations[] con rule_name y severity |
| T-SPC-07 | Listar instrumentos | process_id=1 | 200 + array de instrumentos |

### 2.3 Reportes (reports.py)

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| T-REP-01 | Generar reporte diario | process_id=1, daily, 1 | 200 + report_id + kpis |
| T-REP-02 | Historial de reportes | process_id=1 | 200 + array de reportes |
| T-REP-03 | Exportar Excel | process_id=1, daily | 200 + .xlsx binario |
| T-REP-04 | Excel tiene 3 hojas | Abrir .xlsx | Hojas: KPIs, Lotes, Alarmas |
| T-REP-05 | Summary 24h/7d/30d | process_id=1 | 200 + 3 objetos con KPIs |
| T-REP-06 | Reporte inexistente | id=99999 | 404 Not Found |

### 2.4 ML/IA (ml.py)

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| T-ML-01 | Predicción temperatura | LSTM features | 200 + predicted_value + confidence_interval |
| T-ML-02 | Optimizar rendimiento | XGBoost features | 200 + optimal_yield + recomendaciones |
| T-ML-03 | Detectar anomalía | Isolation Forest features | 200 + is_anomaly boolean + score |
| T-ML-04 | Modelo inexistente | model_name="foo" | 404 Not Found |
| T-ML-05 | Retrain sin permisos | role=operador | 403 Forbidden |

### 2.5 Alarmas ISA 18.2 (alarms.py)

| ID | Caso | Entrada | Resultado esperado |
|----|------|---------|-------------------|
| T-ALM-01 | Listar alarmas activas | state=ACTIVE | 200 + array filtrado |
| T-ALM-02 | Reconocer alarma | alarm_id=1 | 200 + state=ACKNOWLEDGED |
| T-ALM-03 | Filtrar por prioridad | priority=CRITICA | 200 + solo críticas |

---

## 3. Casos de Prueba — Frontend

### 3.1 Pruebas funcionales (manuales)

| ID | Módulo | Acción | Resultado esperado |
|----|--------|--------|--------------------|
| T-UI-01 | Login | Ingresar admin/admin2026 | Redirige a dashboard |
| T-UI-02 | Sidebar | Click en cada ítem | Navega al módulo correcto |
| T-UI-03 | SPC | Seleccionar instrumento | Carga carta Shewhart |
| T-UI-04 | SPC | Cambiar a tab CUSUM | Muestra carta CUSUM |
| T-UI-05 | Reportes | Generar reporte diario | Muestra KPIs y gráficos |
| T-UI-06 | Reportes | Descargar Excel | Descarga archivo .xlsx |
| T-UI-07 | Alarmas | Reconocer alarma | Cambia estado a ACKNOWLEDGED |
| T-UI-08 | Responsive | Viewport 375px | Sidebar colapsa a drawer |
| T-UI-09 | Digital Twin | Click instrumento | Muestra panel de detalle |
| T-UI-10 | ML | Ejecutar inferencia LSTM | Muestra predicción + confianza |

### 3.2 Pruebas de rendimiento

| ID | Escenario | Métrica | Umbral |
|----|-----------|---------|--------|
| T-PERF-01 | Carga inicial (LAN) | First Contentful Paint | < 3s |
| T-PERF-02 | API Shewhart 10k puntos | Response time | < 2s |
| T-PERF-03 | WebSocket 32 instrumentos | Latencia broadcast | < 3s |
| T-PERF-04 | Excel export | Generación + descarga | < 5s |

---

## 4. Pruebas de Seguridad

| ID | Prueba | Método | Resultado esperado |
|----|--------|--------|-------------------|
| T-SEC-01 | SQL Injection | Enviar `' OR 1=1 --` en login | Rechazado por Pydantic |
| T-SEC-02 | XSS | `<script>alert(1)</script>` en inputs | Sanitizado por React |
| T-SEC-03 | JWT tampering | Modificar payload del token | 401 Unauthorized |
| T-SEC-04 | CORS | Request desde otro dominio | Blocked by CORS policy |
| T-SEC-05 | Endpoint sin auth | GET /api/v1/spc/instruments sin Bearer | 401 |

---

## 5. Criterios de aceptación global

| Criterio | Umbral | Medición |
|----------|--------|----------|
| Todos los RF implementados | 16/16 | Checklist |
| Tests backend pasan | 100% | pytest exit code 0 |
| Sin errores de compilación frontend | 0 errors | Vite build |
| Tiempo de respuesta p95 | < 500ms | curl timing |
| Sin vulnerabilidades críticas | 0 | Análisis manual OWASP |
| Docker compose up funciona | 6/6 healthy | docker compose ps |

---

## 6. Herramientas

| Herramienta | Propósito |
|-------------|----------|
| pytest | Tests unitarios e integración backend |
| httpx | Cliente HTTP async para tests de API |
| pytest-cov | Cobertura de código |
| curl | Tests manuales de endpoints |
| Chrome DevTools | Performance, Network, Console |
| Docker healthcheck | Verificación de servicios |

---

## 7. Evidencia de testing

Toda evidencia se almacena en `docs/07-testing/evidencia/`:
- Screenshots de módulos funcionando
- Output de pytest (terminal)
- Curl responses de endpoints críticos
- Capturas de DevTools (performance)

---

## Historial de revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Feb 2026 | Versión inicial — 35 casos de prueba |
