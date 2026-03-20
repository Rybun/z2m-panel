# ⬡ Z2M Panel

> **Vibe coded with Claude.** Este proyecto fue desarrollado íntegramente mediante vibe coding — describiéndole a una IA lo que se quería conseguir e iterando hasta llegar aquí. Ninguna línea fue escrita a mano.

Panel de gestión de Zigbee2MQTT para Home Assistant. Se integra como `panel_custom` en el menú lateral, con diseño estilo iOS, tema claro/oscuro y funcionalidad completa de gestión de dispositivos Zigbee.

![Version](https://img.shields.io/badge/version-2.4.0-blue)
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
- **Dispositivos sin nombre** — los dispositivos con dirección IEEE aparecen destacados arriba en amarillo con botón "Asignar nombre"
- **Asignar / Renombrar** — sheet desde abajo con validación de nombres duplicados, vía MQTT `zigbee2mqtt/bridge/request/device/rename`
- **Eliminar** — confirmación antes de eliminar, vía MQTT `zigbee2mqtt/bridge/request/device/remove`
- **Buscar dispositivos** — activa el `permit_join` con cuenta atrás visible de ~4 minutos

### Notificaciones en tiempo real
- **Alerta de nuevo dispositivo** — cuando un dispositivo se une a la red, aparece una notificación flotante con animación de spring, anillos pulsantes, brillo dorado y partículas. Toca para asignarle nombre directamente. Se descarta automáticamente a los 12 segundos
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

### v2.4.0
- Botón ‹ atrás solo visible en móvil/tablet — oculto en pantallas ≥ 870px donde HA muestra la sidebar

### v2.3.0
- Última vez visto en cada tarjeta con código de color por antigüedad
- Tooltip con fecha y hora exacta
- También visible en el popup de detalle

### v2.2.0
- Fix cobertura (LQ) — filtra correctamente entidades deshabilitadas en HA
- Popup de entidades interactivo con controles por tipo de dominio
- Estados del popup en tiempo real via WebSocket

### v2.1.0
- Cabecera con título, estado del bridge y versión
- Botón ‹ atrás

### v2.0.0
- Popup de entidades al pulsar cualquier tarjeta
- Botones ✏️ y 🗑️ siempre visibles
- Cache busting automático
- `BRIDGE_ID` auto-detectado — funciona en cualquier instancia de HA

### v1.8.0
- Notificaciones animadas en tiempo real al unirse un dispositivo nuevo
- WebSocket persistente para eventos Z2M

### v1.7.0
- Fix imágenes: prefijo `zigbee2mqtt_` en el mapa de model IDs

### v1.6.0
- Model IDs reales desde `zigbee2mqtt/bridge/devices`

### v1.5.0
- Migración a `panel_custom` Web Component — soluciona problema de autenticación con iframe
- Token obtenido del objeto `hass` nativo

### v1.1.0 — v1.4.0
- Diseño iOS, tema claro/oscuro
- Botón "Asignar nombre" con validación de duplicados
- Iteraciones de autenticación en iframe (abandonado)

---

## ⚠️ Notas

- Las imágenes se cargan desde `zigbee2mqtt.io` — dispositivos no soportados oficialmente muestran un emoji como fallback
- Las entidades deshabilitadas en HA no aparecen en los controles del popup
- Probado con Zigbee2MQTT 2.9.x y Home Assistant 2025.x

---

## 🤖 Vibe Coding

Este proyecto es un experimento de **vibe coding**: desarrollo de software describiendo intenciones a una IA (Claude) e iterando sobre el resultado:

1. *"Haz un dashboard para gestionar Z2M en Home Assistant"*
2. *"Que salgan las imágenes de los dispositivos"*
3. *"Que notifique cuando llegue un dispositivo nuevo con animaciones chulas"*
4. *"Monta un repo de esto para HACS"*
5. *"Añade un popup con las entidades y que sean interactivas"*
6. *"Muestra cuándo fue visto por última vez cada dispositivo"*
7. *"El botón atrás solo en móvil"*
8. *(y muchas iteraciones de bugs, fixes y ajustes en medio)*

Sin escribir una línea de código manualmente. El resultado está en producción en varios Home Assistant.

---

*MIT License*
