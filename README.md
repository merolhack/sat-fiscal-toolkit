# 🇲🇽 SAT Fiscal Toolkit (`sat-fiscal-toolkit`)

[![Python 3.10+]([suspicious link removed])]([suspicious link removed])
[![License: MIT]([suspicious link removed])](LICENSE)
[![Status: Active]([suspicious link removed])]()

**`sat-fiscal-toolkit`** es un conjunto de herramientas de código abierto desarrolladas en Python para simplificar, automatizar y auditar la contabilidad mensual y anual de personas físicas (Actividad Empresarial, Servicios Profesionales / Honorarios, RESICO) en México.

El proyecto permite extraer metadatos de comprobantes fiscales (CFDI 4.0 en XML y PDF), aplicar el criterio de **flujo de efectivo**, clasificar deducciones autorizadas y generar reportes analíticos en **Markdown** listos para ser consumidos por IA (como Gemini Notebook) o exportados a papel de trabajo en Excel.

---

## 🚀 Características Principales

- 📑 **Parseo de CFDI 4.0:** Extracción automática de folios (UUID), fechas, emisor/receptor, método de pago (PUE/PPD), impuestos trasladados (IVA 16%) y retenciones (ISR/IVA).
- 💸 **Flujo de Efectivo:** Filtrado automático de ingresos efectivamente cobrados y gastos efectivamente pagados en el mes.
- 🧹 **Depuración de Gastos:** Separación inteligente entre deducciones autorizadas operativas y gastos no deducibles/personales.
- 🤖 **Integración con IA:** Generación de resúmenes sintéticos en Markdown optimizados como fuentes de contexto para **Gemini Notebook**.
- 📊 **Generación de Papel de Trabajo:** Exportación a `.xlsx` estructurado para control de pagos provisionales de ISR y acreditamientos de saldos a favor de IVA.
- 🏦 **Extensible:** Diseñado para incorporar en futuras versiones parsers de estados de cuenta bancarios (PDF), retenciones Infonavit y constancias de retención.

---

## 📂 Estructura del Proyecto

```text
sat-fiscal-toolkit/
├── AGENTS.md                       # Protocolo y directivas obligatorias para agentes
├── wiki/                           # Base de conocimiento modular (LLM Wiki)
├── data/
│   ├── 2026/
│   │   ├── 09/                     # Periodo mensual (Septiembre)
│   │   │   ├── issued/             # Facturas emitidas (Ingresos)
│   │   │   │   ├── summary/        # Resultados.pdf
│   │   │   │   ├── zips/           # Archivos .zip descargados del SAT
│   │   │   │   └── xml/            # XMLs extraídos
│   │   │   └── received/           # Facturas recibidas (Gastos / Deducciones)
│   │   │       ├── summary/
│   │   │       ├── zips/
│   │   │       └── xml/
│   │   └── 10/                     # Periodo mensual (Octubre)
│   └── outputs/
│       └── 2026/
│           └── 09/                 # Papeles de trabajo y reportes Markdown
├── src/
│   ├── __init__.py
│   ├── extractor.py                # Descompresión de paquetes ZIP
│   ├── pdf_parser.py               # Extracción de metadatos de Resultados.pdf
│   ├── cfdi_parser.py              # Parser de CFDI 4.0/3.3 (Anexo 20)
│   ├── tax_calculator.py           # Cálculo de flujo de efectivo, ISR e IVA
│   └── report_generator.py         # Generador de papeles de trabajo en Markdown
├── scripts/
│   └── process_month.py            # Script ejecutable principal por mes
├── .gitignore
├── README.md
└── requirements.txt
```

---

## 🛠️ Requisitos Previos e Instalación

### 1. Clonar el repositorio
```bash
git clone [suspicious link removed]
cd sat-fiscal-toolkit
```

### 2. Crear un entorno virtual e instalar dependencias
```bash
python -m venv venv
# En Linux/macOS:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

---

## ⚙️ Configuración en Antigravity IDE

1. **Abrir el proyecto:** Abre la carpeta `sat-fiscal-toolkit/` desde **Antigravity IDE**.
2. **Configurar el intérprete de Python:** Selecciona el entorno virtual creado (`./venv/bin/python`).
3. **Flujo de trabajo mensual:**
   - Descarga el reporte `Resultados.pdf` y el paquete masivo `.zip` de facturas emitidas y recibidas desde el portal del SAT.
   - Coloca los archivos en `data/YYYY/MM/issued/` y `data/YYYY/MM/received/`.
   - Ejecuta el script de procesamiento:
     ```bash
     python scripts/process_month.py --year 2026 --month 09
     ```
   - El script extraerá los XMLs, conciliará con los PDFs y generará el papel de trabajo listo en `data/outputs/2026/09/monthly_tax_declaration_2026_09.md`.

---

## 📝 Ejemplo de Uso Rápido en Python

```python
from scripts.process_month import process_month

# Procesar mes completo (emisiones, recepciones y determinación de impuestos)
output_path = process_month(year="2026", month="09")
print(f"✅ Reporte generado en: {output_path}")
```

---

## 🤝 Contribución

¡Las contribuciones de desarrolladores, contadores y fiscalistas son bienvenidas! Si deseas agregar nuevas funciones o reglas de clasificación:

1. Haz un *Fork* del proyecto.
2. Crea una rama para tu función (`git checkout -b feature/nueva-regla`).
3. Envía tus cambios (*Commit*) (`git commit -m 'Añade regla de clasificación para RESICO'`).
4. Realiza un *Push* a la rama (`git push origin feature/nueva-regla`).
5. Abre un *Pull Request*.

---

## 📜 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
