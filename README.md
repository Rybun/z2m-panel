# ⬡ Z2M Panel

> **Vibe coded with Claude.** Este proyecto fue desarrollado íntegramente mediante vibe coding — describiéndole a una IA lo que se quería conseguir e iterando hasta llegar aquí. Ninguna línea fue escrita a mano.

Panel de gestión de Zigbee2MQTT para Home Assistant. Se integra como `panel_custom` en el menú lateral, con diseño estilo iOS, tema claro/oscuro y funcionalidad completa de gestión de dispositivos Zigbee.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![HACS](https://img.shields.io/badge/HACS-Custom-orange)
![HA](https://img.shields.io/badge/Home%20Assistant-panel_custom-41BDF5)

---

## ✨ Características

### Panel principal
- **Grid de dispositivos Zigbee** — todos los dispositivos de tu red Z2M con imagen, fabricante, modelo, tipo y área
- **Imágenes reales de Z2M** — obtiene las imágenes desde `zigbee2mqtt.io` usando el model ID real, con fallback a emoji por tipo de dispositivo
- **Cobertura de señal (LQ)** — indicador de barras con porcentaje
- **Batería** — nivel con icono y código de color
- **Última vez visto** — código de color: verde (<1 día), gris (<1 semana), amarillo (<1 mes), rojo (>1 mes)
- **Filtros por tipo** — interruptores, sensores, luces, estores, botones, otros. Scrollables en móvil
- **Búsqueda** — filtrado instantáneo por nombre
- **Botones de acción siempre visibles** — ✏️ renombrar y 🗑️ eliminar en cada tarjeta

### Gestión de dispositivos
- **Dispositivos sin nombre** — los dispositivos con dirección IEEE aparecen destacados arriba con botón "Asignar nombre"
- **Asignar / Renombrar** — sheet desde abajo con validación de nombres duplicados, vía MQTT
- **Eliminar** — confirmación antes de eliminar
- **Buscar dispositivos** — activa el `permit_join` con cuenta atrás visible de ~4 minutos. Confetti al detectar un dispositivo nuevo
- **Convertir switch → luz** — usa el ayudante nativo `switch_as_x` de HA (equivalente a "Crear ayudante > Cambiar tipo de dispositivo")
- **Revertir luz → switch** — elimina el ayudante `switch_as_x` y recupera el interruptor original

### Notificaciones en tiempo real
- **Alerta de nuevo dispositivo** — notificación flotante al unirse un dispositivo, con animación. Se descarta a los 12 segundos
- **WebSocket persistente** — suscrito a `zigbee2mqtt/bridge/events`, detecta `device_joined` en tiempo real sin polling

### Popup de detalle (al pulsar una tarjeta)
- **Entidades agrupadas por dominio** — todas las entidades del dispositivo organizadas por tipo
- **Controles interactivos** según el dominio:
  - `switch` / `light` → toggle estilo iOS
  - `cover` → botones ▲ ■ ▼
  - `button` → botón "Pulsar"
  - `select` → dropdown con opciones disponibles
  - `number` → slider con rango min/max/step
  - `sensor` / `binary_sensor` / resto → solo lectura
- **Estados en tiempo real** — WebSocket `subscribe_entities`

### UX y navegación
- **Diseño iOS** — sheets desde abajo, pills scrollables, toggles nativos, animaciones con spring
- **Tema claro/oscuro** — toggle en la navbar, guarda preferencia, detecta la del sistema
- **Botón ☰** — abre la sidebar de HA (visible en móvil/tablet)

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
| Convertir switch → luz | REST `POST /api/config/config_entries/flow` con `handler: switch_as_x` |
| Revertir luz → switch | REST `DELETE /api/config/config_entries/entry/{id}` |

---

## 📝 TODO

- [ ] La cuenta atrás de buscando dispositivos no se muestra al recargar durante el escaneo
- [ ] Añadir un botón para limpiar búsqueda

---

## ⚠️ Notas

- Las imágenes se cargan desde `zigbee2mqtt.io` — dispositivos no soportados oficialmente muestran un emoji como fallback
- Las entidades deshabilitadas en HA no aparecen en los controles del popup
- Probado con Zigbee2MQTT 2.x y Home Assistant 2026.x

---

## 🤖 Vibe Coding

Este proyecto es un experimento de **vibe coding**: desarrollo de software describiendo intenciones a una IA (Claude) e iterando sobre el resultado — sin escribir una línea de código manualmente. El resultado está en producción en varios Home Assistant.

---

*MIT License*
