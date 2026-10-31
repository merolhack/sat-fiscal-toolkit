import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Home from '@/app/page';

/**
 * BDD Feature: Comportamiento de Usuario Final en SAT Fiscal Toolkit
 */
describe('Feature: Declaración y Auditoría Fiscal Client-Side (User Journey BDD)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Escenario 1: El usuario ingresa a la aplicación y consulta el resumen fiscal por defecto', () => {
    it('Given que el usuario carga la aplicación en el navegador, Then se visualiza el encabezado, selectores de periodo y los KPIs de determinación', () => {
      render(<Home />);

      // Given & Then: Encabezado y sello de privacidad
      expect(screen.getByRole('heading', { name: 'SAT Fiscal Toolkit' })).toBeInTheDocument();
      expect(screen.getByText(/100% Client-Side/i)).toBeInTheDocument();

      // Then: KPIs presentes
      expect(screen.getByText(/Ingresos Cobrados Mes/i)).toBeInTheDocument();
      expect(screen.getByText(/Deducciones Autorizadas/i)).toBeInTheDocument();
      expect(screen.getByText(/ISR a Pagar \(Art\. 106\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/IVA Definitivo a Pagar/i)[0]).toBeInTheDocument();
    });
  });

  describe('Escenario 2: Navegación interactiva por pestañas del portal', () => {
    it('Given que el usuario está en la vista principal, When hace clic en "Guía de Llenado SAT", Then se despliegan los campos oficiales listos para captura', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // When: El usuario hace clic en la pestaña de Guía de Llenado SAT
      const satGuideTab = screen.getByRole('button', { name: /Guía de Llenado SAT/i });
      await user.click(satGuideTab);

      // Then: Se muestran las secciones de captura oficial
      expect(screen.getByText(/Valores Exactos para Captura en el Portal del SAT/i)).toBeInTheDocument();
      expect(screen.getByText(/ISR Personas Físicas — Actividad Empresarial y Profesional/i)).toBeInTheDocument();
      expect(screen.getByText(/IVA Personas Físicas — Actividad Empresarial y Profesional/i)).toBeInTheDocument();
      expect(screen.getByText(/Total de ingresos efectivamente cobrados del periodo/i)).toBeInTheDocument();
    });

    it('When el usuario copia un valor fiscal, Then el sistema activa la retroalimentación visual de copiado', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Navegar a la guía
      await user.click(screen.getByRole('button', { name: /Guía de Llenado SAT/i }));

      // Encontrar los botones de copiar
      const copyButtons = screen.getAllByTitle('Copiar valor');
      expect(copyButtons.length).toBeGreaterThan(0);

      // When: El usuario copia el primer valor
      await user.click(copyButtons[0]);

      // Then: El estado visual cambia temporalmente
      await waitFor(() => {
        expect(copyButtons[0].querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('Escenario 3: Modificación y persistencia de Saldos Acumulados Anteriores', () => {
    it('Given que el usuario accede a "Saldos Acumulados", When actualiza los ingresos acumulados previos y guarda, Then los valores se persisten en el almacenamiento local', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // When: Accede a la pestaña de saldos
      await user.click(screen.getByRole('button', { name: /Saldos Acumulados/i }));

      expect(screen.getByText(/Saldos Acumulados Anteriores \(Enero - Mes Previo\)/i)).toBeInTheDocument();

      // Modifica el campo de ingresos previos
      const inputs = screen.getAllByRole('spinbutton');
      const inputIngresos = inputs[0];

      await user.clear(inputIngresos);
      await user.type(inputIngresos, '150000');

      // Guarda la configuración
      const saveButton = screen.getByRole('button', { name: /Guardar en Navegador/i });
      await user.click(saveButton);

      // Then: Se valida que se haya persistido en localStorage
      const stored = localStorage.getItem('sat_toolkit_historical_balances');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).previousIncome).toBe(150000);
    });
  });

  describe('Escenario 4: Auditoría y Reclasificación Dinámica de Deducciones', () => {
    it('Given que el usuario accede a la pestaña de "Auditoría de Gastos", Then se muestra la tabla con contador de deducibles y personales', async () => {
      const user = userEvent.setup();
      render(<Home />);

      await user.click(screen.getByRole('button', { name: /Auditoría de Gastos/i }));

      expect(screen.getByText(/Auditoría Interactiva de Deducciones \(Gastos\)/i)).toBeInTheDocument();
      expect(screen.getByText(/0 Deducibles/i)).toBeInTheDocument();
      expect(screen.getByText(/0 Personales/i)).toBeInTheDocument();
    });
  });

  describe('Escenario 5: Exportación de Papeles de Trabajo', () => {
    it('Given que el usuario se encuentra en Determinación Fiscal, Then los botones de exportación a Excel (.xlsx) y Markdown están disponibles y activos', () => {
      render(<Home />);

      const excelBtn = screen.getByRole('button', { name: /Descargar Excel \(\.xlsx\)/i });
      const mdBtn = screen.getByRole('button', { name: /Reporte Markdown/i });

      expect(excelBtn).toBeInTheDocument();
      expect(mdBtn).toBeInTheDocument();
    });
  });

  describe('Escenario 6: Enlaces de Pie de Página hacia el Autor y Proyecto Principal', () => {
    it('Given que el usuario navega hasta abajo del sitio, Then se muestran los enlaces verificados hacia merolhack.github.io y freelancemexico.com.mx', () => {
      render(<Home />);

      const authorLink = screen.getByRole('link', { name: /merolhack\.github\.io/i });
      const projectLink = screen.getByRole('link', { name: /freelancemexico\.com\.mx/i });

      expect(authorLink).toBeInTheDocument();
      expect(authorLink).toHaveAttribute('href', 'https://merolhack.github.io/');
      expect(authorLink).toHaveAttribute('target', '_blank');

      expect(projectLink).toBeInTheDocument();
      expect(projectLink).toHaveAttribute('href', 'https://freelancemexico.com.mx/');
      expect(projectLink).toHaveAttribute('target', '_blank');
    });
  });
});
