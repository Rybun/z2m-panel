# ⬡ Z2M Panel

> **Vibe coded with Claude.** Este proyecto fue desarrollado íntegramente mediante vibe coding — describiéndole a una IA lo que se quería conseguir e iterando hasta llegar aquí. Ninguna línea fue escrita a mano.

Panel de gestión de Zigbee2MQTT para Home Assistant, instalable como `panel_custom`. Diseño estilo iOS, tema claro/oscuro, notificaciones en tiempo real cuando se une un dispositivo nuevo.

![Version](https://img.shields.io/badge/version-1.8.0-blue)
![HACS](https://img.shields.io/badge/HACS-Custom-orange)
![HA](https://img.shields.io/badge/Home%20Assistant-panel_custom-41BDF5)

---

## ✨ Características

- **Vista completa de dispositivos Zigbee** — todos los dispositivos de tu red Z2M en un grid con imagen, calidad de señal y batería
- **Imágenes reales de Z2M** — obtiene las imágenes directamente desde zigbee2mqtt.io usando el model ID real del dispositivo
- **Dispositivos sin nombre destacados** — los dispositivos con dirección IEEE aparecen arriba en amarillo con botón para asignarles nombre
- **Notificación en tiempo real** — cuando un dispositivo nuevo se une a la red, aparece una alerta animada con anillos pulsantes, brillo y partículas. Toca para asignarle nombre directamente
- **Buscar dispositivos** — activa el permit_join con cuenta atrás visible
- **Renombrar y eliminar** — acciones rápidas en cada tarjeta con validación de nombres duplicados
- **Filtros por tipo** — interruptores, sensores, luces, estores, botones
- **Búsqueda** — filtrado instantáneo por nombre
- **Tema claro/oscuro** — toggle en la navbar, recuerda la preferencia
- **Diseño iOS** — sheets que suben desde abajo, pills scrollables, animaciones fluidas

---

## 📋 Requisitos

- Home Assistant con integración Zigbee2MQTT activa
- HACS instalado (para instalación automática)

---

## 🚀 Instalación

### Opción A — HACS (recomendado)

1. HACS → Frontend → ⋮ → **Repositorios personalizados**
2. URL: `https://github.com/TU_USUARIO/z2m-panel` — Categoría: **Dashboard**
3. Instala **Z2M Panel** desde HACS
4. Añade a `configuration.yaml`:

```yaml
panel_custom:
  - name: z2m-panel
    sidebar_title: Zigbee2MQTT
    sidebar_icon: mdi:zigbee
    url_path: zigbee2mqtt
    js_url: /local/z2m-panel.js
```

5. Reinicia Home Assistant

### Opción B — Manual

1. Copia `z2m-panel.js` a `/config/www/z2m-panel.js`
2. Añade lo mismo al `configuration.yaml` de arriba
3. Reinicia Home Assistant

---

## 🔧 Cómo funciona

El panel usa exclusivamente APIs nativas de Home Assistant, sin dependencias externas:

- **Token de autenticación** — lo obtiene del objeto `hass` que HA inyecta en los `panel_custom`, sin hardcodear nada
- **Lista de dispositivos** — device registry de HA filtrado por `via_device_id` del bridge Z2M
- **Model IDs reales** — suscripción al topic MQTT `zigbee2mqtt/bridge/devices` via WebSocket de HA
- **Eventos en tiempo real** — suscripción a `zigbee2mqtt/bridge/events` para detectar `device_joined`
- **Acciones** — rename y remove via `mqtt/publish` al bridge Z2M

---

## 📸 Capturas

*Próximamente*

---

## 🗂 Changelog

### v1.8.0
- Notificaciones en tiempo real al unirse un dispositivo nuevo (WebSocket)
- Animaciones: anillos pulsantes, glow, partículas, spring entrance
- Auto-dismiss a los 12 segundos

### v1.7.0
- Fix imágenes: prefijo `zigbee2mqtt_` en el mapa de model IDs

### v1.6.0
- Obtención de model IDs reales desde `zigbee2mqtt/bridge/devices`
- Imágenes correctas para todos los dispositivos

### v1.5.0
- Migración a `panel_custom` Web Component (soluciona problema de auth con iframe)
- Token obtenido del objeto `hass` nativo

### v1.1.0 — v1.4.0
- Diseño iOS, tema claro/oscuro, versión en navbar
- Botón "Asignar nombre" con validación de duplicados
- Múltiples intentos de solucionar auth en iframe (abandonado en favor de panel_custom)

---

## ⚠️ Notas

- Requiere que el bridge Z2M esté conectado y funcionando
- Las imágenes se cargan desde `zigbee2mqtt.io` — dispositivos no soportados oficialmente mostrarán un emoji como fallback
- Probado con Zigbee2MQTT 2.x

---

## 🤖 Vibe Coding

Este proyecto es un experimento de **vibe coding**: desarrollo de software describiendo intenciones a una IA (Claude) e iterando sobre el resultado. El proceso fue aproximadamente:

1. "Haz un dashboard para gestionar Z2M"
2. "Que las imágenes salgan bien"
3. "Que notifique cuando llegue un dispositivo nuevo con animaciones chulas"
4. "Monta un repo de esto para HACS"

Sin escribir una línea de código manualmente. El resultado es funcional, está en producción y hace exactamente lo que se pidió.

---

*MIT License*
