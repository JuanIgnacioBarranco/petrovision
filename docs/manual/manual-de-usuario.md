# Manual de Usuario — PetroVision RTIC

> **Versión:** 1.0 | **Fecha:** Febrero 2026

---

## 1. Acceso al Sistema

### 1.1 Requisitos
- Navegador moderno (Chrome 90+, Firefox 88+, Edge 90+)
- Conexión a la red donde está el servidor

### 1.2 URL de acceso
- **Aplicación:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs

### 1.3 Credenciales de demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin2026 | Administrador |
| operador1 | operador2026 | Operador |
| ing_quimico | ingeniero2026 | Ingeniero Químico |
| data_scientist | datascience2026 | Data Scientist |
| supervisor | supervisor2026 | Supervisor |

---

## 2. Navegación Principal

Al iniciar sesión, se muestra el **MainLayout** con:
- **Sidebar izquierdo:** 15 módulos accesibles por iconos + texto
- **Header:** Nombre del proceso activo + selector de proceso
- **Área principal:** Contenido del módulo seleccionado

### 2.1 Módulos disponibles

| Icono | Módulo | Descripción |
|-------|--------|-------------|
| 📊 | Overview | Dashboard de KPIs en tiempo real |
| 🔧 | Proceso | Diagrama P&ID interactivo |
| ⚙️ | Vista Proceso | Detalle del proceso químico |
| 🏭 | Equipos 3D | Modelos 3D rotables de equipos |
| 📈 | Tendencias | Gráficos históricos de variables |
| 🔔 | Alarmas | Consola ISA 18.2 |
| 📦 | Lotes | Seguimiento de producción |
| 🧪 | What-If | Simulador de escenarios |
| 🤖 | ML / IA | 6 modelos de inteligencia artificial |
| 🔮 | Digital Twin | Gemelo digital del proceso |
| 📉 | SPC | Control estadístico de procesos |
| 📋 | Reportes | Generación y exportación de informes |
| 🎛️ | PID | Sintonización de controladores |
| 📄 | Instrumentos | Lista completa de instrumentos |
| 📝 | Auditoría | Log de acciones del sistema |
| 📖 | Documentación | Referencia técnica integrada |

---

## 3. Módulos Principales

### 3.1 SPC — Control Estadístico de Procesos

1. Seleccionar un instrumento del dropdown
2. Elegir rango de tiempo (1h, 6h, 24h, 7d)
3. **Tab Shewhart:** Carta X̄ con zonas coloreadas y reglas Western Electric
4. **Tab CUSUM:** Suma acumulativa con parámetros k y h ajustables
5. **Tab EWMA:** Media móvil ponderada con λ y L ajustables
6. Los gauges de capacidad (Cp, Cpk, Pp, Ppk) se muestran automáticamente

### 3.2 Reportes

1. Seleccionar tipo de reporte (turno/diario/semanal/mensual)
2. Elegir cantidad de períodos hacia atrás (1-12)
3. Click **Generar Reporte** → Muestra KPIs, gráficos y tabla de lotes
4. Click **Descargar Excel** → Descarga archivo .xlsx con 3 hojas
5. **Tab Historial:** Ver reportes generados anteriormente

### 3.3 ML / IA

1. Seleccionar un modelo de la lista (6 disponibles)
2. Ajustar parámetros con los sliders
3. Click **Ejecutar Inferencia**
4. Ver: predicción, intervalo de confianza, recomendaciones

---

## 4. Alarmas

Las alarmas siguen el estándar ISA 18.2:

| Color | Prioridad | Acción requerida |
|-------|----------|-----------------|
| 🔴 Rojo | CRÍTICA | Acción inmediata |
| 🟠 Naranja | ALTA | Acción en < 5 min |
| 🟡 Amarillo | MEDIA | Acción en < 15 min |
| 🔵 Azul | BAJA | Informativa |

Para reconocer una alarma, click en el botón **ACK** de la fila correspondiente.

---

## 5. Acceso desde dispositivos móviles

El sistema es una PWA. Desde el celular:
1. Abrir `http://[IP_SERVIDOR]:3000` en Chrome
2. Menú ⋮ → **Agregar a pantalla de inicio**
3. Se instala como app nativa con icono

---

## 6. Solución de problemas

| Problema | Solución |
|----------|---------|
| No carga la página | Verificar que Docker esté corriendo: `docker compose ps` |
| Login rechazado | Verificar credenciales (admin/admin2026) |
| Datos no se actualizan | Verificar WebSocket en DevTools → Network → WS |
| Excel no descarga | Verificar que openpyxl esté instalado en el contenedor API |
