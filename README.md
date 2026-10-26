# TecnoStock

Aplicación de demostración para consultar un catálogo local, filtrar productos y preparar pedidos sin frameworks.

## Ejecutar localmente

`fetch()` requiere servir los archivos por HTTP; abrir `index.html` directamente como archivo local no es suficiente. Desde la carpeta del proyecto, inicia un servidor sencillo:

```sh
python3 -m http.server 8000
```

Luego abre <http://localhost:8000> en el navegador.

También puedes iniciar el proyecto con la extensión Live Server de VS Code y abrir la URL local que genere.

## Organización

- `index.html`: estructura de la interfaz y accesibilidad.
- `css/style.css`: presentación adaptable a escritorio y móvil.
- `data/products.json`: catálogo cargado mediante `fetch()`.
- `js/api.js`: solicitud y validación de datos del catálogo.
- `js/cart.js`: reglas del carrito, inventario y cálculo de descuentos.
- `js/storage.js`: recuperación y persistencia validada con `localStorage`.
- `js/components/`: Web Components de tarjeta, listado y carrito.
- `js/app.js`: filtros, eventos de aplicación, renderizado y confirmación simulada.

## Comportamientos

- Búsqueda sin distinguir mayúsculas/minúsculas, categoría, disponibilidad y orden por precio.
- Una sola línea por producto y cantidades limitadas al inventario disponible.
- Descuento del 10 % para subtotales desde $300.000 COP.
- El carrito persistido solo guarda identificadores y cantidades; los precios siempre provienen del catálogo cargado.
- La confirmación genera un resumen e identificador locales. No procesa pagos ni actualiza el inventario del JSON.

## Pruebas manuales sugeridas

1. Agrega un producto varias veces y verifica que se mantenga una sola línea.
2. Combina búsqueda y categoría, luego limpia los filtros.
3. Ordena en ambos sentidos y activa «Solo disponibles».
4. Recarga para comprobar la recuperación del carrito y cambia el contenido de `localStorage` para probar la validación.
5. Alcanza $300.000 COP de subtotal y compara el descuento con un subtotal inferior.
6. Confirma un pedido, revisa el resumen y comprueba que el carrito quede vacío.
7. Modifica o sirve incorrectamente `data/products.json` para comprobar el mensaje de error y la opción de reintento.
