# 📖 Diccionario Completo de la API MaryClean (Backend -> Frontend)

🛑 **REGLA DE ORO (El Envoltorio)**
El Backend NUNCA devuelve un array directamente. Siempre devuelve un objeto JSON con este molde:
```json
{
  "success": true,               
  "status": 200,                 
  "message": "Mensaje legible",  
  "data": { ... }, // O un [] array. AQUI VIENE LA CARGA UTIL
  "errors": null                 
}
```
Tus `axios.get` o `axios.post` deben leer SIEMPRE `response.data.data`.

---

## 1. 🔐 Módulo de Autenticación (`/api/v1/auth`)
### 1.1 Iniciar Sesión
- **Ruta:** `POST /api/v1/auth/login`
- **Body:** `{ "username": "admin001", "password": "mipassword" }`
- **Respuesta (data):**
  ```json
  {
    "token": "eyJ0eXA...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "empleado": { "id": 1, "rol": "admin", "nombres": "María" }
  }
  ```

---

## 2. 👕 Módulo de Catálogo (/api/v1/servicios)
### 2.1 Obtener Catálogo Agrupado (CASO 1 - Recomendado para UI)
- **Ruta:** `GET /api/v1/servicios`
- **Respuesta (data):** Array de servicios con prendas anidadas
  ```json
  [
    {
      "idServicio": "1",
      "nombre": "Lavado Simple",
      "tiempoEstimado": "2",
      "prendas": [
        { "idPrenda": "7", "nombrePrenda": "Camisa", "precio": "5.00", "estado": "1" }
      ]
    }
  ]
  ```

### 2.2 Obtener Catálogo Plano (CASO 2)
- **Ruta:** `GET /api/v1/servicios/prendas`
- **Respuesta (data):** Array plano de prendas
  ```json
  [
    {
      "idPrenda": "1",
      "nombrePrenda": "Camisa",
      "precio": "5.00",
      "estado": "1",
      "servicio": "Lavado Simple"
    }
  ]
  ```

---

## 3. 👥 Módulo de Clientes (`/api/v1/clientes`)
### 3.1 Listar / Buscar Clientes
- **Ruta:** `GET /api/v1/clientes`
- **Query Params:** `?page=1&per_page=10&q=juan` (Todos son opcionales)
- **Respuesta (data):**
  ```json
  {
    "clientes": [
      {
        "idCliente": "1",
        "documento": "12345678",
        "nombres": "Juan Pablo",
        "telefono": "987654321",
        "direccion": "Calle Falsa 123"
      }
    ],
    "paginacion": { "total": 1, "page": 1, "per_page": 10, "total_pages": 1 }
  }
  ```

---

## 4. 📦 Módulo de Pedidos (`/api/v1/pedidos`)
### 4.1 Listar / Buscar Pedidos
- **Ruta:** `GET /api/v1/pedidos`
- **Query Params:** `?page=1&per_page=10&q=TICKET123`
- **Respuesta (data):**
  ```json
  {
    "pedidos": [
      {
        "idPedido": "1",
        "codigoTicket": "TK-0001",
        "fechaRecepcion": "2026-09-24 10:00:00",
        "estado": "Recibido",
        "total": "25.00",
        "cliente": "Juan Pablo",
        "empleado": "María Torres"
      }
    ],
    "paginacion": { ... }
  }
  ```

### 4.2 Ver Detalle de un Pedido Específico
- **Ruta:** `GET /api/v1/pedidos/{idPedido}`
- **Respuesta (data):**
  ```json
  {
    "pedido": {
       "idPedido": "1",
       "codigoTicket": "TK-0001",
       "estado": "Recibido",
       "total": "25.00",
       "fechaRecepcion": "...",
       "cliente": { "idCliente": "1", "nombres": "Juan", "documento": "123" },
       "empleado": { "idEmpleado": "1", "nombres": "María" }
    },
    "detalles": [
       { "idDetalle": "1", "idPrenda": "1", "nombrePrenda": "Camisa", "cantidad": "2", "precioUnitario": "5.00", "importe": "10.00" }
    ],
    "pagos": [
       { "idPago": "1", "monto": "10.00", "metodo": "Efectivo", "fechaPago": "..." }
    ]
  }
  ```

### 4.3 Crear un Nuevo Pedido
- **Ruta:** `POST /api/v1/pedidos`
- **Body (JSON):**
  ```json
  {
    "idCliente": 1,
    "prendas": [
      { "idPrenda": 1, "cantidad": 2, "precioUnitario": 5.00 },
      { "idPrenda": 3, "cantidad": 1, "precioUnitario": 15.00 }
    ]
  }
  ```
- **Respuesta (data):** Devuelve `{ "idPedidoGenerado": 2 }`

### 4.4 Cambiar Estado del Pedido
- **Ruta:** `PUT /api/v1/pedidos/{idPedido}/estado`
- **Body (JSON):** `{ "estado": "Lavado" }`

### 4.5 Registrar Pago
- **Ruta:** `PUT /api/v1/pedidos/{idPedido}/pagar`
- **Body (JSON):** `{ "monto": 15.00, "metodo": "Yape" }`

---

## 5. 📊 Módulo de Reportes (`/api/v1/reportes`)
### 5.1 Dashboard (Tarjetas resumen)
- **Ruta:** `GET /api/v1/reportes/dashboard`
- **Respuesta (data):**
  ```json
  {
    "pedidos_activos": "15",
    "ingresos_hoy": "250.50",
    "nuevos_clientes_mes": "8",
    "servicios_mes": "45"
  }
  ```

### 5.2 Gráfica de Evolución Diaria
- **Ruta:** `GET /api/v1/reportes/ingresos`

### 5.3 Gráfica de Distribución de Servicios
- **Ruta:** `GET /api/v1/reportes/servicios`
