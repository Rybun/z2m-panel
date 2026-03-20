# ⬡ Z2M Panel

> **Vibe coded with Claude.** Este proyecto fue desarrollado íntegramente mediante vibe coding — describiéndole a una IA lo que se quería conseguir e iterando hasta llegar aquí. Ninguna línea fue escrita a mano.

Panel de gestión de Zigbee2MQTT para Home Assistant. Se integra como `panel_custom` en el menú lateral, con diseño estilo iOS, tema claro/oscuro y funcionalidad completa de gestión de dispositivos Zigbee.

![Version](https://img.shields.io/badge/version-1.0-blue)
![HACS](https://img.shields.io/badge/HACS-Custom-orange)
![HA](https://img.shields.io/badge/Home%20Assistant-panel_custom-41BDF5)

---

## ✨ Características

### Panel principal
- **Grid de dispositivos Zigbee** — todos los dispositivos de tu red Z2M con imagen, fabricante, modelo, tipo y área
- **Imágenes reales de Z2M** — obtiene las imágenes desde `zigbee2mqtt.io` usando el model ID real (no el nombre descriptivo de HA), con fallback a emoji por tipo de dispositivo
- **Cobertura de señal (LQ)** — indicador de barras con porcentaje, calculado desde la entidad `linkquality`. Ignora entidades deshabilitadas en HA
- **Batería** — nivel con icono y código de color
- **Última vez visto** — calculado del `last_changed` más reciente entre todas las entidades activas del dispositivo. Código de color: verde (<1 día), gris (<1 semana), amarillo (<1 mes), rojo (>1 mes). Útil para identificar dispositivos sin usar
- **Filtros por tipo** — interruptores, sensores, luces, estores, botones, otros. Scrollables en móvil
- **Búsqueda** — filtrado instantáneo por nombre
- **Botones de acción siempre visibles** — ✏️ renombrar y 🗑️ eliminar en cada tarjeta, sin hover

### Gestión de dispositivos
- **Dispositivos sin nombre** — los dispositivos con dirección IEEE aparecen destacados arriba en amarillo con botón "Asignar nombre". Son clicables para ver sus datos y gestionarlos
- **Última conexión desconocida** — si no se sabe cuándo fue la última vez que se conectó un dispositivo, se muestra en rojo
- **Asignar / Renombrar** — sheet desde abajo con validación de nombres duplicados, vía MQTT `zigbee2mqtt/bridge/request/device/rename`
- **Eliminar** — confirmación antes de eliminar, vía MQTT `zigbee2mqtt/bridge/request/device/remove`
- **Buscar dispositivos** — activa el `permit_join` con cuenta atrás visible de ~4 minutos. Confetti al detectar un dispositivo nuevo

### Notificaciones en tiempo real
- **Alerta de nuevo dispositivo** — cuando un dispositivo se une a la red, aparece una notificación flotante con animación de spring, anillos pulsantes, brillo dorado y partículas. Toca para asignarle nombre directamente. Se descarta automáticamente a los 12 segundos
- **Notificaciones de acción** — confirmación en la parte superior al renombrar o eliminar dispositivos
- **WebSocket persistente** — suscrito a `zigbee2mqtt/bridge/events`, detecta `device_joined` en tiempo real sin polling. Se reconecta automáticamente

### Popup de detalle (al pulsar una tarjeta)
- **Entidades agrupadas por dominio** — todas las entidades del dispositivo organizadas por tipo
- **Controles interactivos** según el dominio:
  - `switch` / `light` → toggle estilo iOS
  - `cover` → botones ▲ ■ ▼
  - `button` → botón "Pulsar"
  - `select` → dropdown con opciones disponibles
  - `number` → slider con rango min/max/step
  - `sensor` / `binary_sensor` / resto → solo lectura
- **Estados en tiempo real** — WebSocket `subscribe_entities`. Cualquier cambio (automatización, otro usuario) actualiza los controles instantáneamente
- **Acciones de renombrar y eliminar** también disponibles en el popup

### UX y navegación
- **Diseño iOS** — sheets desde abajo, pills scrollables, toggles nativos, animaciones con spring
- **Tema claro/oscuro** — toggle en la navbar, guarda preferencia, detecta la del sistema automáticamente
- **Cabecera** con título, estado del bridge y versión actual
- **Botón ‹ atrás** — solo visible en móvil/tablet (pantallas < 870px, sin sidebar de HA)
- **Cache busting automático** — detecta versión desactualizada y recarga

---

## 📋 Requisitos

- Home Assistant con integración Zigbee2MQTT activa
- HACS instalado
- Zigbee2MQTT 2.x

---

## 🚀 Instalación

### Opción A — HACS (recomendado)

1. HACS → Frontend → ⋮ → **Repositorios personalizados**
2. URL: `https://github.com/Rybun/z2m-panel` — Categoría: **Dashboard**
3. Instala **Z2M Panel** desde HACS
4. Añade a `configuration.yaml`:

```yaml
panel_custom:
  - name: z2m-panel
    sidebar_title: Zigbee2MQTT
    sidebar_icon: mdi:zigbee
    url_path: zigbee2mqtt
    js_url: /local/community/z2m-panel/z2m-panel.js
```

5. Reinicia Home Assistant

### Opción B — Manual

1. Copia `z2m-panel.js` a `/config/www/z2m-panel.js`
2. Añade a `configuration.yaml`:

```yaml
panel_custom:
  - name: z2m-panel
    sidebar_title: Zigbee2MQTT
    sidebar_icon: mdi:zigbee
    url_path: zigbee2mqtt
    js_url: /local/z2m-panel.js
```

3. Reinicia Home Assistant

---

## 🔧 Cómo funciona

El panel es un Web Component (`panel_custom`) que HA carga como módulo nativo, con acceso directo al objeto `hass` y su token de autenticación. Sin iframes, sin tokens hardcodeados.

### Fuentes de datos

| Dato | Fuente |
|------|--------|
| Lista de dispositivos | WebSocket `config/device_registry/list` |
| Bridge ID | Auto-detectado buscando `manufacturer=Zigbee2MQTT, model=Bridge` |
| Model IDs reales para imágenes | MQTT `zigbee2mqtt/bridge/devices` via WebSocket |
| Imágenes | `https://www.zigbee2mqtt.io/images/devices/{modelId}.png` |
| Estados (LQ, batería, última vez visto) | REST `/api/states` |
| Eventos en tiempo real | MQTT `zigbee2mqtt/bridge/events` via WebSocket |
| Estados del popup en tiempo real | WebSocket `subscribe_entities` |

### Acciones

| Acción | Mecanismo |
|--------|-----------|
| Renombrar | MQTT `zigbee2mqtt/bridge/request/device/rename` |
| Eliminar | MQTT `zigbee2mqtt/bridge/request/device/remove` |
| Permit join | `switch.turn_on` sobre `switch.zigbee2mqtt_bridge_permit_join` |
| Control de entidades | REST `/api/services/{domain}/{service}` |

---

## 🗂 Changelog

### v1.0
- Versión pública inicial

---

## 📝 TODO

- [ ] La cuenta atrás de buscando dispositivos no se muestra al recargar durante el escaneo
- [ ] Añadir un botón para limpiar búsqueda
- [ ] Quitar el botón de recargar

---

## ⚠️ Notas

- Las imágenes se cargan desde `zigbee2mqtt.io` — dispositivos no soportados oficialmente muestran un emoji como fallback
- Las entidades deshabilitadas en HA no aparecen en los controles del popup
- Probado con Zigbee2MQTT 2.9.x y Home Assistant 2025.x

---

## 🤖 Vibe Coding

Este proyecto es un experimento de **vibe coding**: desarrollo de software describiendo intenciones a una IA (Claude) e iterando sobre el resultado — sin escribir una línea de código manualmente. El resultado está en producción en varios Home Assistant.

---

*MIT License*
