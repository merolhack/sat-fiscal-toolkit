# 07 — Guía Práctica de Llenado en el Portal del SAT (`sat-fiscal-toolkit`)

Esta guía estandariza el procedimiento universal paso a paso para presentar la declaración mensual provisional y definitiva de impuestos federales ante el SAT para personas físicas en el régimen de **Actividad Empresarial y Servicios Profesionales**.

Los valores cuantitativos específicos cambian mes con mes, por lo que esta guía documenta la lógica de mapeo entre los reportes generados por `sat-fiscal-toolkit` (`monthly_tax_declaration_YYYY_MM.md`) y las pantallas/ventanas emergentes del portal del SAT.

---

## 🖥️ Paso 1: Configuración Inicial del Formulario

1. Ingresar a **[sat.gob.mx](https://www.sat.gob.mx) ➔ Declaraciones ➔ Pagos provisionales o definitivos**.
2. Autenticarse con **RFC** y **Contraseña** o **e.firma**.
3. Seleccionar parámetros de la declaración:
   - **Ejercicio:** Año fiscal correspondiente (ej. `2026`).
   - **Periodicidad:** `1 - Mensual`.
   - **Periodo:** Mes a declarar (ej. `Septiembre`, `Octubre`).
   - **Tipo de declaración:** `Normal` (o `Complementaria` si aplica corrección).
4. Marcar las obligaciones del régimen:
   - ☑️ **ISR personas físicas. Actividad empresarial y profesional**.
   - ☑️ **Impuesto al Valor Agregado. Personas físicas**.
5. Dar clic en **Siguiente**.

---

## 📝 Paso 2: Llenado de ISR Personas Físicas (LISR Art. 106 Acumulativo)

### Pestaña 1: Ingresos
* **¿Tus ingresos fueron obtenidos en copropiedad o sociedad conyugal?:** Seleccionar **No** (salvo régimen especial).
* **Ingresos cobrados del mes:** Capturar el Subtotal de facturas `PUE` emitidas y cobradas en el mes (obtenido de la sección 1 del reporte generado).
* **¿Tienes ingresos a disminuir del mes?:** **No** (a menos que existan devoluciones o cancelaciones no reflejadas).
* **¿Tienes ingresos adicionales del mes?:** **No** (a menos que haya ganancia por venta de activo fijo).
* **Ingresos de meses anteriores:** Verificar que coincida con el acumulado histórico oficial reportado en el mes previo.
* **Total de ingresos del periodo:** El portal calcula la suma acumulativa automáticamente.

---

### Pestaña 2: Deducciones Autorizadas
El portal del SAT prellena un monto general de compras y gastos. **Es obligatorio depurar este monto mediante la ventana emergente:**

1. **Gastos de nómina del periodo no considerados en el prellenado:** `0` (si no se tienen empleados a cargo).
2. **Compras y gastos del periodo:**
   - Dar clic en el botón de **Detalle** (ícono de lupa o ventana emergente).
   - En la ventana emergente:
     - Identificar el campo **Compras y gastos no deducibles del mes**.
     - Capturar la diferencia correspondiente a gastos personales (despensa, supermercado, ropa personal, etc.) identificados en la Sección 2 ("Automatic Depuration of Non-Deductible & Personal Expenses") del reporte Markdown.
     - Al capturar este ajuste, el monto neto de gastos autorizados del mes cuadra exactamente con el papel de trabajo.
3. **Deducción de inversiones del periodo:** `0` (salvo que existan inversiones en activo fijo con depreciación).
4. **Deducción inmediata de inversiones (Relocalización):** `0`.
5. **¿Tienes facilidades administrativas y estímulos por aplicar?:** **No**.
6. **Total de deducciones autorizadas:** El sistema muestra la suma acumulada a la fecha.

---

### Pestaña 3: Determinación (ISR)
1. **Pérdidas fiscales de ejercicios anteriores aplicadas:** `0` (salvo que existan remanentes certificados de declaraciones anuales previas).
2. **Base gravable:** El sistema resta automáticamente `Ingresos acumulados - Deducciones acumuladas`.
3. **Impuesto causado:** El sistema aplica la tarifa oficial acumulada del Art. 106 LISR.
4. **¿Tienes estímulos por aplicar?:** **No**.
5. **Pagos provisionales efectuados con anterioridad:** El portal precarga los pagos efectuados en meses anteriores del mismo ejercicio.
6. **Total de ISR retenido:**
   - Abrir el **Detalle**.
   - Capturar el **ISR retenido del mes** (si personas morales retuvieron el 10% en el mes).
   - El portal suma las retenciones históricas precargadas de meses anteriores.
7. **Impuesto a cargo:**
   - Si los créditos (retenciones + pagos provisionales) superan el impuesto causado, el sistema determina **$0 MXN**.

---

### Pestaña 4: Pago (ISR)
* Verificar que la **Cantidad a pagar** sea **`$0 MXN`** (o el importe a pagar si existiera impuesto a cargo).
* Guardar la sección de ISR.

---

## 💶 Paso 3: Llenado de Impuesto al Valor Agregado (IVA)

### Pestaña 1: IVA a Cargo
* **Valor de los actos o actividades gravados a la tasa del 16%:**
  - Abrir el botón de **Detalle**.
  - En *Otros actos o actividades gravados al 16%*, ingresar la base de ingresos cobrados del mes a tasa 16%.
  - *Intereses:* `0`; *Regalías:* `0`.
* **Actividades gravadas a tasa 0% (Exportación / Otros):** `0`.
* **Total de IVA a cargo:** El sistema determina el 16% sobre los actos gravados (redondeado por el portal).

---

### Pestaña 2: IVA Acreditable
1. **Valor de los actos o actividades pagados a la tasa del 16%:**
   - Abrir el botón de **Detalle**.
   - En *Otros actos o actividades pagados al 16%*, capturar el subtotal de gastos autorizados deducibles a tasa 16% del mes.
2. **Valor de los demás actos pagados al 0%:**
   - Ajustar a `0` para excluir compras de alimentos no procesados o despensa personal.
3. **IVA trasladado al contribuyente (efectivamente pagado):**
   - Abrir el detalle de cálculo de proporción:
     * *IVA de actos no obligados:* `0`.
     * *Proporción:* Seleccionar **Art. 5 de la LIVA**.
     * *Proporción de IVA:* **`1.0000`** (100% acreditable para actividades profesionales gravadas).
4. **Total de IVA acreditable:** El sistema totaliza el IVA deducible pagado.

---

### Pestaña 3: Determinación (IVA)
* El portal calcula: `IVA a cargo - IVA retenido - IVA acreditable`.
* **Si el IVA acreditable supera al IVA a cargo:**
  - Se genera automáticamente **Saldo a Favor**.
  - **Impuesto a cargo:** **`$0 MXN`**.
* **Nota sobre Acreditamiento de Saldos Anteriores:** Si en algún mes futuro resulta impuesto a cargo, se utilizará el campo *Acreditamiento de saldos a favor de periodos anteriores* para cancelar el pago hasta el límite del saldo acumulado disponible.

---

### Pestaña 4: Pago (IVA)
* Verificar que la **Cantidad a pagar** sea **`$0 MXN`** (o el saldo neto a pagar si no se cubre con acreditamientos).
* Guardar la sección de IVA.

---

## 🚀 Paso 4: Envío, Firma y Respaldo del Acuse Oficial

1. Regresar a la pantalla de **Administración de la Declaración**.
2. Verificar que el total consolidado a pagar coincida con lo planeado.
3. Dar clic en **Enviar Declaración**.
4. Confirmar el diálogo bajo protesta de decir verdad.
5. Firmar con la **e.firma** (certificado `.cer`, llave `.key` y contraseña) o **Contraseña SAT**.
6. **Descarga y Archivo Inmediato del Acuse:**
   - Descargar el archivo PDF oficial emitido por el SAT.
   - Guardarlo en:
     `data/outputs/YYYY/MM/Acuse.<RFC>.<Periodo>.<Ejercicio>.pdf`
     *(Ejemplo: `data/outputs/2026/09/Acuse.MEZL860614DB0.38.2026.pdf`)*.
   - Generar la transcripción en Markdown con el número de operación y sello digital para control de versiones:
     `data/outputs/YYYY/MM/Acuse.<RFC>.<Periodo>.<Ejercicio>.md`.

---

## 📌 Paso 5: Actualización del Arrastre de Saldos (LLM Wiki)

Al concluir el envío, el agente o usuario **debe actualizar inmediatamente** el archivo [wiki/08_tax_balance_tracker_2026.md](file://wsl$/Ubuntu-20.04/home/merolhack/fl/sat-fiscal-toolkit/wiki/08_tax_balance_tracker_2026.md) con:
1. El número de operación oficial y fecha/hora de presentación.
2. Los nuevos saldos acumulados de ingresos y deducciones que servirán de punto de partida para el siguiente mes.
3. La bolsa actualizada de retenciones de ISR y saldo a favor de IVA acumulado disponible para futuros acreditamientos.
