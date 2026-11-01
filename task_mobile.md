# Plan de Implementación: MaryClean Mobile

Este documento rastrea el progreso del desarrollo de la aplicación móvil de MaryClean.

## Fases del Desarrollo

- [x] **Configuración y Enrutamiento Base (Login y Navegador)**
  - [x] Crear el plan de implementación (`task_mobile.md`).
  - [x] Crear pantalla de `LoginScreen`.
  - [x] Crear `AppNavigator` y proteger rutas mediante `authStore`.
  - [x] Integrar `NavigationContainer` en `App.tsx`.
  - [x] Probar conexión de autenticación exitosa contra el backend de Render.

- [x] **Construcción del Tab Navigator (Barra inferior)**
  - [x] Implementar `@react-navigation/bottom-tabs`.
  - [x] Configurar pestañas (Inicio, Pedidos, Nuevo, Perfil).
  - [x] Asignar iconos nativos profesionales con `lucide-react-native`.

- [x] **Flujo del Dashboard**
  - [x] Crear interfaz de resumen financiero y estadísticas usando NativeWind.
  - [x] Consumir endpoint del backend para poblar métricas (react-query).

- [x] **Flujo de Pedidos**
  - [x] Listado principal de pedidos (Pull to Refresh, paginación/scroll infinito).
  - [x] Modal de detalles deslizable usando `@gorhom/bottom-sheet`.
  - [x] Integrar acciones para cambiar rápidamente el estado de un pedido.

- [ ] **Flujo de Registrar Pedido**
  - [ ] Pantalla multi-paso: Búsqueda de cliente (DNI/Nombre) -> Selección de Prendas -> Cobro.
  - [ ] Implementar la funcionalidad nativa de **abrir WhatsApp** (React Native Linking) para enviar el recibo digital al cliente.
