NEXO FINANCE — PRIMERA VERSIÓN

Contenido:
- index.html: estructura de la app
- styles.css: diseño verde elegante, claro/oscuro
- app.js: cuentas, ingresos, gastos, movimientos, respaldos
- manifest.webmanifest: instalación como PWA
- sw.js: caché para funcionamiento sin conexión
- icons/: iconos de instalación

IMPORTANTE SOBRE PRIVACIDAD Y DATOS
Los datos se guardan en localStorage del navegador de este iPhone. No se envían a un servidor. No uses navegación privada. No borres los datos del sitio ni Safari sin exportar primero un respaldo.
La copia JSON NO está cifrada en esta versión. Guárdala en un lugar privado.
Esta primera versión es un prototipo funcional; todavía no incluye presupuestos editables, Face ID, cifrado de respaldos ni sincronización.

Para instalar:
1. Publica estos archivos en un sitio HTTPS estático (por ejemplo, GitHub Pages).
2. Abre la dirección publicada en Safari en el iPhone.
3. Pulsa Compartir > Añadir a pantalla de inicio.
4. Abre Nexo desde el icono.
5. En Ajustes, exporta un respaldo después de registrar información.

La aplicación necesita servirse por HTTPS para instalarse como PWA y activar el modo sin conexión.
