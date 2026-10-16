# 📚 LLM Wiki — Índice General (`sat-fiscal-toolkit`)

Bienvenido a la base de conocimiento modular de **`sat-fiscal-toolkit`**. Este directorio almacena las especificaciones de arquitectura, normativas fiscales mexicanas, diccionario de datos y bitácora técnica para los agentes de IA y desarrolladores.

## 🧭 Mapa Modular de Conocimiento

| Documento | Título | Descripción |
| :--- | :--- | :--- |
| [00_index.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/00_index.md) | **Índice General** | Mapa del LLM Wiki y reglas de modularidad. |
| [01_architecture.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/01_architecture.md) | **Arquitectura del Sistema** | Módulos de ingesta, parsers CFDI, motor fiscal y exportación. |
| [02_sat_rules_2026.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/02_sat_rules_2026.md) | **Reglas Fiscales SAT 2026** | Criterio de flujo de efectivo, retenciones ISR/IVA y deducciones autorizadas. |
| [03_cfdi_schema.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/03_cfdi_schema.md) | **Esquema Anexo 20 CFDI 4.0** | Estructura de nodos XML, impuestos y Complemento de Pagos 2.0. |
| [04_data_dictionary.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/04_data_dictionary.md) | **Diccionario de Datos** | Mapeo de atributos XML a DataFrames y columnas del Papel de Trabajo. |
| [05_changelog_insights.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/05_changelog_insights.md) | **Bitácora y Aprendizajes** | Historial de decisiones técnicas y problemas resueltos entre sesiones. |
| [06_workflow_mensual_sat.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/06_workflow_mensual_sat.md) | **Workflow Mensual SAT** | Guía de descargas del portal SAT, folios de descarga, carpetas y procesamiento. |

---

## 📌 Reglas de Mantenimiento Modular

1. **Cero Monolitos:** Cada tema específico debe contar con su propio archivo markdown.
2. **Actualización Bidireccional:** Todo cambio que introduzca una regla o estructura nueva debe reflejarse en el archivo temático correspondiente y referenciarse en `05_changelog_insights.md`.
3. **Persistencia en Git:** La carpeta `wiki/` sí se commitea en el repositorio para preservar la memoria del proyecto entre sesiones.
