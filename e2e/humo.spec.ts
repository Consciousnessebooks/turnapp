import { test, expect, type Page } from '@playwright/test';

// Humo de la Fase 1a (docs/DIAGNOSTICO.md §2): la landing lleva al login por
// sus 4 botones y el ingreso sin cliente de Supabase termina en un error
// controlado, sin errores ni warnings de consola.

const MSG_SIN_CONEXION = 'El ingreso no está disponible en este momento';

const BOTONES_LOGIN = [
  { nombre: 'Ver demo', zona: 'encabezado', titulo: 'Panel Profesional' },
  { nombre: 'Admin', zona: 'encabezado', titulo: 'Super Admin' },
  { nombre: 'Demo profesional', zona: 'centro', titulo: 'Panel Profesional' },
  { nombre: 'Super Admin', zona: 'centro', titulo: 'Super Admin' },
] as const;

let problemas: string[];

test.beforeEach(async ({ page }) => {
  problemas = [];
  // Nunca le pegamos a un proyecto de Supabase real desde el humo.
  await page.route('**/*.supabase.co/**', (ruta) => ruta.abort());
  page.on('pageerror', (err) => problemas.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    const tipo = msg.type();
    // Incluye el console.warn propio 'Ingreso fallido:': sin cliente no debería aparecer.
    if (tipo === 'error' || tipo === 'warning') problemas.push(`console.${tipo}: ${msg.text()}`);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu agenda clínica');
});

test.afterEach(() => {
  expect(problemas, 'errores o warnings en la consola').toEqual([]);
});

async function abrirLogin(page: Page, nombre: string, titulo: string) {
  await page.getByRole('button', { name: nombre, exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: titulo })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
}

for (const { nombre, zona, titulo } of BOTONES_LOGIN) {
  test(`"${nombre}" (${zona}) lleva al login y el ingreso da error controlado`, async ({ page }) => {
    await abrirLogin(page, nombre, titulo);

    await page.getByLabel('Email').fill('prueba@example.com');
    await page.getByLabel('Contraseña').fill('clave-de-prueba');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();

    await expect(page.getByRole('status')).toContainText(MSG_SIN_CONEXION);
    // Sigue en el formulario.
    await expect(page.getByRole('heading', { level: 2, name: titulo })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('prueba@example.com');
    await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeEnabled();
  });
}

test('"Volver" desde el login regresa a la landing', async ({ page }) => {
  await abrirLogin(page, 'Ver demo', 'Panel Profesional');
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu agenda clínica');
  await expect(page.getByLabel('Email')).toHaveCount(0);
});
