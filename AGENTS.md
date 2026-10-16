# 🤖 AGENTS.md — Protocolo Obligatorio de Agentes e Integración MCP (`sat-fiscal-toolkit`)

Este documento define las **reglas de interacción obligatorias**, arquitectura de memoria y uso de herramientas para agentes de Inteligencia Artificial y LLMs que colaboren en el desarrollo y mantenimiento del repositorio **`sat-fiscal-toolkit`**.

---

## 🚨 REGLAS OBLIGATORIAS E INVIOLABLES PARA TODO AGENTE

Todo agente o modelo que opere en este repositorio **DEBE CUMPLIR ESTRICTAMENTE** las siguientes directivas antes y durante cada intervención:

### 1. ⚙️ Uso Obligatorio de `ollama-local` y Alerta de Disponibilidad
- **Herramienta:** Servidor MCP `ollama-local` (`consultar_modelo_local`).
- **Delegación:** Para tareas mecánicas, redacción de docstrings, formateo o consultas locales, se debe delegar a `ollama-local`.
- **Protocolo de Fallo:** Si el servidor `ollama-local` o el modelo local no responde o no está disponible, el agente **DEBE avisar explícitamente al usuario de inmediato** en su respuesta antes de continuar:
  > ⚠️ **AVISO:** El servidor MCP `ollama-local` no se encuentra disponible o no respondió a la consulta. Se procede con el modelo principal pero se requiere verificar la conexión con Ollama (`http://localhost:11434`).

### 2. 🧠 Uso Obligatorio de `codebase-memory`
- **Herramienta:** Servidor MCP `codebase-memory` (`search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `get_architecture`, `index_repository`).
- **Prioridad de Descubrimiento:** Para explorar el código, encontrar funciones, clases o comprender dependencias, el agente **SIEMPRE DEBE priorizar las herramientas del grafo de `codebase-memory`** sobre búsquedas grep/glob.
- **Mantenimiento:** Tras cambios arquitectónicos sustanciales, verificar el estado del índice con `index_status` o actualizarlo con `index_repository`.

### 3. 📚 Lectura y Actualización Modular de LLM Wiki (`wiki/`)
- **Ubicación:** Toda la memoria conceptual, reglas fiscales y arquitectura del repositorio reside en el directorio **`wiki/`** (NUNCA en `.memory/` ni en un archivo monolítico).
- **Modularidad Estricta:** La wiki se organiza en archivos temáticos independientes. **Está estrictamente prohibido concentrar todo en un solo archivo**.
- **Estructura Modular Oficial:**
  ```text
  wiki/
  ├── 00_index.md               # Mapa del LLM Wiki y reglas de modularidad
  ├── 01_architecture.md        # Arquitectura del sistema, parsers y exportadores
  ├── 02_sat_rules_2026.md      # Reglas fiscales (LISR Art 106, IVA 16%, Flujo de Efectivo)
  ├── 03_cfdi_schema.md         # Estructura del Anexo 20 CFDI 4.0 (Nodos, Retenciones)
  ├── 04_data_dictionary.md     # Mapeo XML -> DataFrame -> Excel Papel de Trabajo
  ├── 05_changelog_insights.md  # Registro técnico y aprendizajes acumulados
  ├── 06_workflow_mensual_sat.md# Protocolo de descargas SAT, carpetas por mes y folios
  ├── 07_sat_portal_filing_guide.md # Guía práctica universal paso a paso en el portal SAT
  └── 08_tax_balance_tracker_2026.md # Control de saldos acumulados y arrastre mensual
  ```
- **Ciclo de Vida de Tareas (Protocolo de 3 Fases):**
  1. **FASE 1: LECTURA PREVIA (Read-First):** Consultar obligatoriamente los documentos pertinentes de `wiki/` antes de generar propuestas o código.
  2. **FASE 2: EJECUCIÓN:** Desarrollar código modular, tipado (`mypy`), documentado en español y testeable con fixtures sintéticos.
  3. **FASE 3: ACTUALIZACIÓN MODULAR (Write-Back):** Si se añade una regla fiscal, nuevo esquema CFDI o se toma una decisión técnica, actualizar el documento temático específico de `wiki/` correspondiente.

### 4. 🌐 Convención de Idioma y Nomenclatura en Inglés
- **Estructura, Código y Scripts en Inglés:** Todo el código fuente (`src/`), nombres de scripts (`scripts/process_month.py`), funciones, clases, nombres de directorios de datos (`data/{year}/{month}/issued/`, `data/{year}/{month}/received/`, `summary/`, `zips/`, `xml/`) y reportes finales (`data/outputs/{year}/{month}/monthly_tax_declaration_{year}_{month}.md`) deben estar redactados y nombrados en **Inglés**.
- **Términos Fiscales del SAT:** Se mantienen los acrónimos y conceptos fiscales clave de México con su significado normativo (CFDI 4.0, PUE, PPD, ISR, IVA, CRP, UUID).

### 5. 🧹 Pre-Commit: Eliminación Obligatoria de Archivos `Zone.Identifier`
- **Limpieza Previa Mandatoria:** Antes de ejecutar `git commit` o `git push` hacia cualquier repositorio remoto, se **DEBE buscar y eliminar indefectiblemente** cualquier archivo residual de flujo alternativo de Windows / WSL (`Zone.Identifier`):
  ```bash
  find . -name "*Zone.Identifier*" -type f -delete
  ```
- **Prohibición:** Ningún commit debe contener metadatos `Zone.Identifier`.

---

## 🛡️ Reglas de Negocio Fiscales Inviolables

1. **Flujo de Efectivo:** 
   - Facturas con método `PUE` se acumulan/deducen en la fecha de emisión del CFDI.
   - Facturas con método `PPD` **únicamente** se acumulan/deducen cuando exista su respectivo **Complemento de Recepción de Pagos (CRP)** con fecha de pago en el periodo correspondiente.
2. **Depuración de Gastos:**
   - Mantener separadas las *Deducciones Autorizadas* (gastos indispensables para la actividad profesional) de los *Gastos Personales* o *No Deducibles*.
3. **Cálculo de Retenciones:**
   - Retención de ISR por Personas Morales a Personas Físicas: **10%**.
   - Retención de IVA por Personas Morales a Personas Físicas: **10.6667% (2/3 partes del IVA trasladado)**.
4. **Control de Saldos a Favor de IVA:**
   - El IVA a favor acumulado de meses anteriores se acredita contra el IVA a cargo del periodo actual sin duplicar acreditamientos.
5. **Privacidad Absoluta de Comprobantes:**
   - Las facturas reales (XML, PDF, ZIP) y credenciales/llaves (.key, .cer, .pfx, .env) **NUNCA** entran al control de versiones de Git.

---

## 📋 Formato Obligatorio de Respuesta del Agente

Toda respuesta técnica o desarrollo de tareas en este repositorio debe responder respetando la siguiente estructura:

```markdown
### 1. Contexto y Lectura de Memoria (wiki/)
- Módulos de la Wiki consultados: [wiki/0X_...md]
- Reglas aplicables: [...]
- Archivos del repositorio afectados: [...]

### 2. Propuesta / Código Implementado
[Código Python limpio, tipado y documentado o acciones ejecutadas]

### 3. Actualización de Memoria (LLM Wiki)
- Módulo actualizado en `wiki/`: [wiki/0X_...md]
- Aprendizajes o decisiones registradas: [...]
```
