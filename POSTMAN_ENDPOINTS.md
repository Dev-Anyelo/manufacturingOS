# manufacturingOS - Guia de pruebas en Postman

Este documento lista todos los endpoints actuales del backend, que enviar, y que esperar.

## 1) Importante sobre autenticacion en Postman

Tu backend usa sesion de Supabase por cookies en servidor.

- Archivo clave: lib/supabase/server.ts
- La funcion requireAuth usa supabase.auth.getUser() y lee cookies de sesion.

Por eso, para probar endpoints protegidos en Postman, necesitas enviar cookie valida de Supabase en header Cookie.

### Variables recomendadas de Postman

- BASE_URL = http://localhost:3000
- AUTH_COOKIE = sb-<project-ref>-auth-token=<valor_cookie_completo>
- CRON_SECRET = <tu secreto>

### Como obtener AUTH_COOKIE rapido

1. Inicia sesion en la app web.
2. En DevTools, copia la cookie de Supabase (sb-...-auth-token).
3. En Postman, agrega header:
   Cookie: {{AUTH_COOKIE}}

Si no envias cookie valida, debes recibir:

- status 401
- body: {"success":false,"error":"Debes iniciar sesion para continuar."}

## 2) CRON_SECRET - por que no aparece en Supabase

CRON_SECRET no es una variable de Supabase.

Es una variable de entorno de tu aplicacion Next.js, definida por ti para proteger rutas /api/cron.

En tu codigo:

- lib/api/cron.ts

La validacion es:

- Si CRON_SECRET esta vacio: 500 con "CRON_SECRET no configurado."
- Si header x-cron-secret no coincide: 401 con "No autorizado."

### Solucion

1. Define un valor fuerte en .env
   - Ejemplo: CRON_SECRET=manuOS_local_2026_super_secret_01
2. Reinicia el servidor de Next.js.
3. En Postman, agrega header en rutas cron:
   - x-cron-secret: {{CRON_SECRET}}
4. En produccion (Vercel), agrega la misma variable en Project Settings > Environment Variables.

Nota:

- No necesitas crear CRON_SECRET en Supabase para que esto funcione.
- Supabase solo provee URL/keys de proyecto y secretos para Edge Functions, que es otro contexto.

## 3) Data de prueba sugerida

Usa estas variables en Postman (Environment):

- USER_ID
- INVENTORY_ID
- CUSTOMER_ID
- EMPLOYEE_ID
- PRODUCTION_ID
- ORDER_ID
- SALE_ID
- EXPENSE_ID
- PAYROLL_ID
- CATALOG_ID
- NOTIFICATION_ID

### Payloads base

Crear usuario admin/empleado:

{
"email": "qa.user.001@example.com",
"full_name": "QA User 001",
"role": "employee",
"password": "TempPass1234!"
}

Crear material inventario:

{
"name": "Tela Algodon QA Azul",
"category": "fabric",
"fabric_type": "algodon",
"color": "azul",
"quantity": 50,
"unit": "yd",
"unit_price": 7.5,
"minimum_stock": 10,
"supplier": "Proveedor QA",
"notes": "Material de prueba",
"image_url": null,
"is_active": true
}

Ajuste inventario:

{
"inventory_item_id": "{{INVENTORY_ID}}",
"adjustment_type": "add",
"quantity": 5,
"reason": "Ajuste de prueba en Postman"
}

Sesion de produccion:

{
"employee_id": "{{EMPLOYEE_ID}}",
"session_date": "2026-04-09",
"notes": "Sesion QA",
"items": [
{
"inventory_item_id": "{{INVENTORY_ID}}",
"garment_type": "shirt",
"size": "M",
"quantity": 3,
"yards_used": 4.5,
"notes": "Item QA"
}
]
}

Venta:

{
"customer_id": "{{CUSTOMER_ID}}",
"sale_date": "2026-04-09",
"channel": "in_person",
"payment_method": "cash",
"discount": 2,
"amount_paid": 25,
"notes": "Venta QA",
"items": [
{
"catalog_item_id": null,
"description": "Camisa QA",
"size": "M",
"quantity": 2,
"unit_price": 12,
"discount": 0
}
]
}

Pedido:

{
"customer_id": "{{CUSTOMER_ID}}",
"delivery_date": "2026-04-10",
"channel": "in_person",
"advance_paid": 10,
"total": 30,
"notes": "Pedido QA",
"items": [
{
"catalog_item_id": null,
"description": "Uniforme QA",
"size": "L",
"measurements": {
"bust": 92,
"waist": 76,
"hips": 98,
"length": 110,
"sleeve": 58
},
"inventory_item_id": "{{INVENTORY_ID}}",
"color": "azul",
"design_notes": "Bordado frontal",
"quantity": 1,
"unit_price": 30
}
]
}

Gasto:

{
"expense_date": "2026-04-09",
"category": "supplies",
"concept": "Compra QA de hilos",
"supplier": "Proveedor QA",
"quantity": 10,
"unit_price": 2,
"total": 20,
"updates_inventory": false,
"inventory_item_id": null,
"inventory_quantity_added": null,
"receipt_url": null,
"notes": "Gasto QA"
}

Planilla:

{
"employee_id": "{{EMPLOYEE_ID}}",
"period_start": "2026-04-01",
"period_end": "2026-04-09",
"pieces_produced": 20,
"hours_worked": 40,
"base_amount": 100,
"bonuses": 20,
"deductions": 5,
"payment_method": "cash",
"notes": "Planilla QA"
}

Catalogo:

{
"name": "Camisa QA",
"description": "Prenda QA",
"garment_type": "shirt",
"market_price_unit": 15,
"market_price_dozen": 160,
"our_price_unit": 12,
"our_price_dozen": 130,
"estimated_cost": 8,
"image_url": null,
"notes": "Catalogo QA"
}

## 4) Formato general de respuesta

### Exito JSON

- Status 200 o 201
- Body:

{
"success": true,
"data": { ... }
}

### Error JSON

- Status 400/401/403/404/422/500
- Body:

{
"success": false,
"error": "mensaje en espanol"
}

## 5) Endpoints por modulo

## 5.1 Admin users

### POST /api/admin/users

- Auth: admin
- Body: payload de Crear usuario admin/empleado
- Esperado: 201
- Recibes: id, email, full_name, role

### PATCH /api/admin/users/{{USER_ID}}

- Auth: admin
- Body ejemplo:
  {
  "role": "manager",
  "is_active": true,
  "full_name": "QA User 001 Updated"
  }
- Esperado: 200
- Recibes: id, role, isActive, fullName

### DELETE /api/admin/users/{{USER_ID}}

- Auth: admin
- Body: none
- Esperado: 200
- Recibes: {"id":"...","desactivated":true}

## 5.2 Inventory

### GET /api/inventory?category=fabric&search=tela&stock_status=low

- Auth: cualquier usuario autenticado
- Body: none
- Esperado: 200
- Recibes: arreglo de materiales activos filtrados

### POST /api/inventory

- Auth: admin o manager
- Body: payload de Crear material inventario
- Esperado: 201
- Recibes: item creado

### GET /api/inventory/{{INVENTORY_ID}}

- Auth: autenticado
- Body: none
- Esperado: 200
- Recibes: item + inventoryMovements (ultimos 20)

### PATCH /api/inventory/{{INVENTORY_ID}}

- Auth: admin o manager
- Body: igual al create (campos actualizados)
- Esperado: 200
- Recibes: item actualizado

### DELETE /api/inventory/{{INVENTORY_ID}}

- Auth: admin
- Body: none
- Esperado: 200
- Recibes: {"id":"...","deleted":true}

### POST /api/inventory/{{INVENTORY_ID}}/adjust

- Auth: admin
- Body: payload de Ajuste inventario
- Esperado: 200
- Recibes: item actualizado

### GET /api/inventory/movements?inventory_item_id={{INVENTORY_ID}}&movement_type=in&date_from=2026-04-01&date_to=2026-04-09

- Auth: autenticado
- Body: none
- Esperado: 200
- Recibes: historial de movimientos

### GET /api/inventory/low-stock

- Auth: autenticado
- Body: none
- Esperado: 200
- Recibes: items con quantity <= minimumStock

## 5.3 Production

### GET /api/production?employee_id={{EMPLOYEE_ID}}&date_from=2026-04-01&date_to=2026-04-09&garment_type=shirt

- Auth: autenticado
- Esperado: 200
- Recibes: sesiones de produccion

### POST /api/production

- Auth: employee, manager, admin
- Body: payload de Sesion de produccion
- Esperado: 201
- Recibes: sesion creada con items

### GET /api/production/{{PRODUCTION_ID}}

- Auth: autenticado
- Esperado: 200
- Recibes: sesion + employee + items + inventoryItem

### PATCH /api/production/{{PRODUCTION_ID}}

- Auth: creador o admin (segun reglas internas)
- Body: payload de Sesion de produccion
- Esperado: 200
- Recibes: sesion actualizada

### DELETE /api/production/{{PRODUCTION_ID}}

- Auth: admin
- Esperado: 200
- Recibes: {"id":"...","cancelled":true}

## 5.4 Sales

### GET /api/sales?date_from=2026-04-01&date_to=2026-04-09&status=paid&customer_id={{CUSTOMER_ID}}&channel=in_person

- Auth: autenticado
- Esperado: 200
- Recibes: listado de ventas

### POST /api/sales

- Auth: autenticado
- Body: payload de Venta
- Esperado: 201
- Recibes: venta creada con items

### GET /api/sales/{{SALE_ID}}

- Auth: autenticado
- Esperado: 200
- Recibes: venta + customer + items

### PATCH /api/sales/{{SALE_ID}}/status

- Auth: admin o manager
- Body ejemplo:
  {
  "status": "paid"
  }
- Esperado: 200
- Recibes: venta actualizada

### GET /api/sales/summary

- Auth: autenticado
- Esperado: 200
- Recibes: total_sales, total_amount, by_channel, by_payment_method

## 5.5 Orders

### GET /api/orders?status=received&customer_id={{CUSTOMER_ID}}&date_from=2026-04-01&date_to=2026-04-09&overdue=false

- Auth: autenticado
- Esperado: 200
- Recibes: listado de pedidos

### POST /api/orders

- Auth: admin o manager
- Body: payload de Pedido
- Esperado: 201
- Recibes: pedido creado con items

### GET /api/orders/{{ORDER_ID}}

- Auth: autenticado
- Esperado: 200
- Recibes: { order, status_history }

### PATCH /api/orders/{{ORDER_ID}}

- Auth: admin o manager
- Body: payload de Pedido
- Esperado: 200
- Recibes: pedido actualizado

### DELETE /api/orders/{{ORDER_ID}}

- Auth: admin
- Esperado: 200
- Recibes: {"id":"...","deleted":true}

### PATCH /api/orders/{{ORDER_ID}}/status

- Auth: admin o manager
- Body ejemplo:
  {
  "status": "confirmed"
  }
- Esperado: 200
- Recibes: pedido con nuevo status

Transiciones validas:

- received -> confirmed|cancelled
- confirmed -> in_production|cancelled
- in_production -> ready|cancelled
- ready -> delivered

### GET /api/orders/kanban

- Auth: autenticado
- Esperado: 200
- Recibes: objeto agrupado por status

## 5.6 Expenses

### GET /api/expenses?date_from=2026-04-01&date_to=2026-04-09&category=supplies

- Auth: admin o manager
- Esperado: 200
- Recibes: listado de gastos

### POST /api/expenses

- Auth: admin o manager
- Body: payload de Gasto
- Esperado: 201
- Recibes: gasto creado

### GET /api/expenses/{{EXPENSE_ID}}

- Auth: admin o manager
- Esperado: 200
- Recibes: gasto + inventoryItem + payrollPayment

### PATCH /api/expenses/{{EXPENSE_ID}}

- Auth: admin
- Body: payload de Gasto
- Esperado: 200
- Recibes: gasto actualizado

### DELETE /api/expenses/{{EXPENSE_ID}}

- Auth: admin
- Esperado: 200
- Recibes: {"id":"...","deleted":true}

### POST /api/expenses/{{EXPENSE_ID}}/receipt

- Auth: admin
- Body: form-data
  - key: file (tipo File)
- Esperado: 200
- Recibes: gasto con receiptUrl

### GET /api/expenses/summary

- Auth: admin o manager
- Esperado: 200
- Recibes: by_category, monthly_total, top_concepts

## 5.7 Payroll

### GET /api/payroll?employee_id={{EMPLOYEE_ID}}&status=pending&date_from=2026-04-01

- Auth: admin
- Esperado: 200
- Recibes: listado de pagos

### POST /api/payroll

- Auth: admin
- Body: payload de Planilla
- Esperado: 201
- Recibes: pago creado + employee

### GET /api/payroll/{{PAYROLL_ID}}

- Auth: admin
- Esperado: 200
- Recibes: pago + employee + expenses

### PATCH /api/payroll/{{PAYROLL_ID}}

- Auth: admin
- Body: payload de Planilla
- Esperado: 200
- Recibes: pago actualizado (solo si pending)

### DELETE /api/payroll/{{PAYROLL_ID}}

- Auth: admin
- Esperado: 200
- Recibes: {"id":"...","deleted":true}

### PATCH /api/payroll/{{PAYROLL_ID}}/mark-paid

- Auth: admin
- Body ejemplo:
  {
  "payment_date": "2026-04-09",
  "payment_method": "cash",
  "notes": "Pago QA"
  }
- Esperado: 200
- Recibes: pago actualizado + receipt_url

### GET /api/payroll/{{PAYROLL_ID}}/pdf

- Auth: admin
- Esperado: 200
- Recibes: binario PDF
- Content-Type esperado: application/pdf

### POST /api/payroll/{{PAYROLL_ID}}/send-email

- Auth: admin
- Body: none
- Esperado: 200
- Recibes: {"sent": true|false}

### GET /api/payroll/summary?date_from=2026-04-01&date_to=2026-04-30

- Auth: admin
- Esperado: 200
- Recibes: totales agrupados por empleado

## 5.8 Catalog

### GET /api/catalog?search=camisa&garment_type=shirt

- Auth: autenticado
- Esperado: 200
- Recibes: listado de catalogo activo

### POST /api/catalog

- Auth: admin o manager
- Body: payload de Catalogo
- Esperado: 201
- Recibes: item creado

### GET /api/catalog/{{CATALOG_ID}}

- Auth: autenticado
- Esperado: 200
- Recibes: item catalogo

### PATCH /api/catalog/{{CATALOG_ID}}

- Auth: admin o manager
- Body: payload de Catalogo
- Esperado: 200
- Recibes: item actualizado

### DELETE /api/catalog/{{CATALOG_ID}}

- Auth: admin
- Esperado: 200
- Recibes: item con isActive=false

### POST /api/catalog/{{CATALOG_ID}}/image

- Auth: admin o manager
- Body: form-data
  - key: file (tipo File)
- Esperado: 200
- Recibes: item con imageUrl

### PATCH /api/catalog/bulk-price

- Auth: admin
- Body ejemplo:
  {
  "percentage": 10,
  "target": "all"
  }
- Esperado: 200
- Recibes: updated_count, percentage, target

## 5.9 Settings

### GET /api/settings

- Auth: admin
- Esperado: 200
- Recibes: configuracion del sistema

### PATCH /api/settings

- Auth: admin
- Body ejemplo:
  {
  "company_name": "Manufacturing QA",
  "company_phone": "555-0000",
  "company_email": "qa@company.com",
  "company_address": "Zona Industrial",
  "low_stock_threshold": 5,
  "currency": "USD",
  "timezone": "America/Tegucigalpa"
  }
- Esperado: 200
- Recibes: settings actualizados

### GET /api/settings/users

- Auth: admin
- Esperado: 200
- Recibes: lista de perfiles

### POST /api/settings/users

- Auth: admin
- Body: payload de Crear usuario admin/empleado
- Esperado: 201
- Recibes: perfil creado/actualizado

### PATCH /api/settings/users/{{USER_ID}}

- Auth: admin
- Body ejemplo:
  {
  "role": "manager",
  "is_active": true,
  "full_name": "Nombre QA"
  }
- Esperado: 200
- Recibes: perfil actualizado

## 5.10 Reports

### GET /api/reports/daily

- Auth: autenticado
- Esperado: 200
- Recibes: resumen diario de sales/production/expenses

### GET /api/reports/inventory

- Auth: autenticado
- Esperado: 200
- Recibes: estado de inventario con status normal/bajo/critico

### GET /api/reports/sales?date_from=2026-04-01&date_to=2026-04-09

- Auth: autenticado
- Esperado: 200
- Recibes: ventas por periodo

### GET /api/reports/production?date_from=2026-04-01&date_to=2026-04-09

- Auth: autenticado
- Esperado: 200
- Recibes: produccion por periodo

### GET /api/reports/orders

- Auth: autenticado
- Esperado: 200
- Recibes: total, overdue, by_status

### GET /api/reports/export/pdf

- Auth: autenticado
- Esperado: 200
- Recibes: binario PDF
- Content-Type esperado: application/pdf

### GET /api/reports/export/excel

- Auth: autenticado
- Esperado: 200
- Recibes: binario XLSX
- Content-Type esperado: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

## 5.11 Notifications

### GET /api/notifications?unread_only=true

- Auth: autenticado
- Esperado: 200
- Recibes: lista de notificaciones del usuario

### PATCH /api/notifications/{{NOTIFICATION_ID}}/read

- Auth: autenticado
- Body: none
- Esperado: 200
- Recibes: {"updated": n}

### PATCH /api/notifications/read-all

- Auth: autenticado
- Body: none
- Esperado: 200
- Recibes: {"updated": n}

### DELETE /api/notifications/{{NOTIFICATION_ID}}

- Auth: autenticado
- Body: none
- Esperado: 200
- Recibes: {"deleted": n}

## 5.12 Cron (protegidos con x-cron-secret)

En todos estos endpoints:

- Header obligatorio: x-cron-secret: {{CRON_SECRET}}

### POST /api/cron/daily-report

- Body: none
- Esperado: 200
- Recibes: sent_to, total_sales, total_expenses

### POST /api/cron/check-overdue-orders

- Body: none
- Esperado: 200
- Recibes: overdue_orders, notifications_created

### POST /api/cron/check-low-stock

- Body: none
- Esperado: 200
- Recibes: critical_items, notifications_created, emails_sent

### POST /api/cron/check-payroll-due

- Body: none
- Esperado: 200
- Recibes: notified, days_until_payroll

## 6) Flujo recomendado de prueba en Postman

1. POST /api/admin/users
2. POST /api/inventory
3. POST /api/inventory/{id}/adjust
4. POST /api/production
5. POST /api/orders
6. PATCH /api/orders/{id}/status (confirmed -> in_production -> ready -> delivered)
7. POST /api/payroll
8. PATCH /api/payroll/{id}/mark-paid
9. GET reportes
10. POST cron endpoints con x-cron-secret

Con esto validas autenticacion, roles, flujos de negocio, reportes y tareas programadas.
