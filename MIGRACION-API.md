# Migración de Willariq Mobile a la API actual

## Alcance

Adaptar la aplicación Expo para ciudadanos. Se conserva la navegación de inicio de sesión, registro, inicio, reporte, incidencias, notificaciones, perfil y chatbot. La API y el panel administrativo se mantienen como referencia del contrato y de la configuración municipal.

Este diagnóstico se basa en el código de ambos repositorios y las guías Postman de la API. Las rutas coincidentes todavía requieren pruebas con la app y una cuenta de prueba.

## Diferencias que bloquean el flujo

| Área | App móvil actual | API actual |
| --- | --- | --- |
| Sesión | Axios, SecureStore y refresh compartido entre peticiones. | Login móvil entrega `data.tokens`. Refresh recibe `{refreshToken}` y devuelve el par nuevo en `data`. Logout recibe el refresh. |
| Mis incidencias | La pantalla lista registros de Zustand persistidos en el dispositivo. | `GET /incidents` entrega la lista paginada del ciudadano autenticado. |
| Evidencia | Pide URL prefirmada, sube a MinIO y confirma con `uploadId`. El cliente reescribe hosts locales. | La app envía `multipart/form-data` con el campo `file` a `POST /incidents/:id/evidence`. La API guarda en RustFS y responde con los campos de la evidencia, `incidentVersion` y `reused`. |
| Envío | Llama a `POST /incidents/:id/submit` sin cuerpo. | Espera `{expectedVersion}` y responde 202 al aceptar el procesamiento. |
| Chat | El servicio normaliza `aiJobId` y `assistantMessage` del contrato antiguo. | El envío devuelve el trabajo en `data.job`. El resultado final se identifica mediante `data.finalOutput.messageId`. |
| Notificaciones | Hay rutas de consulta y lectura con adaptadores para varias formas de respuesta. | Las rutas coinciden en gran parte. Verificar filtros, forma paginada y estados antes de quitar la compatibilidad antigua. |
| Cuenta | Existe consulta del perfil por `GET /users/me`. | También hay edición de perfil, verificación de correo, recuperación, cambio de contraseña y revocación de sesiones. |

## Orden de implementación

### 1. Conexión y sesión

- Revisar el Expo SDK declarado y leer la documentación versionada indicada por `AGENTS.md` antes de escribir código. Conservar las dependencias existentes salvo que una prueba demuestre que falta alguna.
- Configurar `EXPO_PUBLIC_BASE_URL` con el origen accesible desde el dispositivo y el prefijo `/api`. Probar emulador y teléfono físico. Una API ligada a `127.0.0.1` en la PC no es accesible por su IP LAN hasta que escuche en la interfaz adecuada.
- Conservar `src/config/http/http-client.ts`, el cliente aislado para refresh y SecureStore. Verificar el envelope de login, los códigos `ACCESS_TOKEN_EXPIRED` y `ACCESS_TOKEN_INVALID`, y que las rutas públicas del ciclo de cuenta queden fuera del refresh automático.
- Ante varios 401 simultáneos, compartir un solo refresh y repetir cada solicitud como máximo una vez. Si llega tarde un 401 de un access token anterior, comprobar si ya existe un token nuevo antes de rotar otra vez. Comprobar que un refresh pendiente de una sesión antigua no reescriba los tokens ni cierre una sesión iniciada después.
- Si la API confirma que el refresh es inválido, revocado o vencido, cerrar sesión y limpiar caché. Si hay un fallo de red transitorio, mantener la sesión local y permitir reintentar. Asociar borradores y datos persistidos al usuario y al entorno. Al cambiar de cuenta, nunca mostrar registros o fotos de la anterior.

### 2. Crear, adjuntar y enviar una incidencia

- Mantener `POST /incidents` con `clientRequestId` estable por borrador, mensaje y coordenadas numéricas. Validar las coordenadas y límites del DTO antes del envío. Guardar el `id`, código y `version` que devuelve el servidor.
- Sustituir el flujo prefirmado de `incidents.service.ts`, `evidence-upload.service.ts` y `use-incidents.ts` por multipart autenticado. Conservar las evidencias ya confirmadas cuando falle una carga posterior. Usar el formato, tamaño y permisos de imagen que documenta la API.
- Subir imágenes secuencialmente por incidencia. Tras cada carga, guardar `incidentVersion` y el ID de la evidencia. Enviar `{expectedVersion}` con la última versión. En un 409, recargar detalle y evidencias para reconciliar cambios antes de repetir una operación.
- Mantener por separado el borrador local, la carga de fotos y el envío aceptado. Tras un corte de red, recuperar el estado del servidor antes de crear o enviar de nuevo. Mostrar que el análisis es asíncrono después del 202.
- Migrar el almacén local con cuidado. Conservar el texto y coordenadas recuperables. Una referencia a una incidencia o evidencia de la API antigua debe verificarse antes de reutilizarse. Si una foto local ya no existe, pedir seleccionarla de nuevo. Nunca reenviar borradores automáticamente al actualizar la app.

### 3. Consultar, seguir y cancelar

- Implementar lista paginada con `GET /incidents`, detalle con `GET /incidents/:id` e historial con `GET /incidents/:id/history`. Usar el listado del servidor como fuente de verdad. Los borradores locales pueden vivir en una sección aparte.
- Usar el código de seguimiento y etiquetas en español para los estados. Consultar asignaciones por incidencia solo si la pantalla necesita mostrarlas y limitarse a los campos visibles para ciudadanos. Cargar imágenes privadas desde `GET /incidents/:id/evidence/:evidenceId/content` con autenticación.
- Usar `POST /incidents/:id/cancel` con el motivo y la versión actual según el DTO. Actualizar el detalle y la bandeja tras cancelar. Ajustar el polling al estado y al foco de la pantalla para evitar peticiones permanentes.

### 4. Chatbot y notificaciones

- Enviar `{clientRequestId, content}` a `POST /chat/sessions/:id/messages`. Generar un UUID por pregunta y conservarlo si se pierde la respuesta HTTP. Leer `data.job.id` y consultar `GET /chat/jobs/:id` hasta un estado terminal. En completado, refrescar el historial y localizar el mensaje con `finalOutput.messageId`.
- Respetar el orden de mensajes de la API y deduplicar por ID. Mostrar citas con título y sección, y conservar las referencias estructuradas. Distinguir trabajo en cola, fallo, sesión cerrada y respuesta sin fuentes. El 429 debe mostrarse como una condición de reintento controlado. Las consultas de seguimiento deben respetar la propiedad de la incidencia.
- Alinear notificaciones con `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read` y `POST /notifications/read-all`. Invalidar lista y contador después de marcar. Si una notificación lleva a una incidencia, comprobar que el detalle siga accesible.

### 5. Perfil y ciclo de cuenta

- Incorporar edición con `PATCH /users/me`, solicitud y confirmación de correo, recuperación y cambio de contraseña según la guía de cuenta. Definir cómo llegan los enlaces al móvil y probar el flujo de apertura o ingreso del token antes de habilitarlo.
- Añadir cierre de todas las sesiones mediante `POST /auth/logout-all`. Verificar que los tokens revocados lleven al login y que se limpien las consultas privadas de la sesión anterior.

## Pruebas de aceptación

| Prueba | Resultado esperado |
| --- | --- |
| Login, reinicio, expiración y varias peticiones concurrentes | Sesión recuperada. Una sola rotación para el mismo access token vencido. |
| Logout durante refresh y cambio de cuenta | Sin restaurar la sesión anterior ni mostrar sus datos. |
| Crear reporte con dos fotos y pérdida de conexión a mitad | Se retoma sin duplicar el reporte ni las fotos confirmadas. El submit usa la versión más reciente. |
| Abrir «Mis incidencias» en otro dispositivo | Aparecen las incidencias del mismo ciudadano, incluido su estado actualizado. |
| Consultar o cancelar una incidencia ajena | La API rechaza el acceso y la app no muestra datos privados. |
| Chat con pregunta cubierta, pregunta sin fuentes y fallo de proveedor | La respuesta se vincula al job correcto, muestra citas cuando existen y presenta un fallo recuperable cuando corresponda. |
| Leer notificaciones y cerrar todas las sesiones | El contador se actualiza y los tokens revocados dejan de dar acceso. |

## Referencias locales

- App móvil: `src/config/http/http-client.ts`, `src/infrastructure/auth/auth-session.ts`, `src/infrastructure/services`, `src/infrastructure/hooks` y `src/app`.
- API: `docs/incidencias-postman.md`, `docs/evidencias-postman.md`, `docs/postman-incidencias-ia.md`, `docs/chat-municipal-postman.md`, `docs/notificaciones-auditoria-postman.md` y `docs/correo-ciclo-cuenta-postman.md`.

## Primera prueba en el dispositivo

1. Reinicia Metro y verifica que la URL pública de la API sea accesible desde el teléfono. Inicia sesión como ciudadano y abre «Mi perfil».
2. Crea una incidencia con una foto JPG, PNG o WebP. La app aplica los límites predeterminados de la API de 5 MiB por foto, cinco fotos y 25 MiB en total. Comprueba que aparezca en «Incidencias» y abre el detalle.
3. Prueba cancelar un reporte que todavía esté «Recibido». La API solo permite al ciudadano cancelar en ese estado.
4. Haz una pregunta cubierta por un Markdown publicado. Comprueba que el chat muestre el estado del trabajo y la cita. Abre notificaciones y verifica el contador tras marcar una como leída.
5. Prueba la recuperación de contraseña y la verificación de correo copiando el código del enlace recibido al formulario de la app. Al cambiar contraseña o cerrar todas las sesiones, vuelve a iniciar sesión.

Los borradores locales se conservan al cerrar la app y se descartan al cerrar o perder la sesión. La bandeja sincroniza los reportes que ya existen en la API. La vista de incidencias muestra el conteo de evidencias.
