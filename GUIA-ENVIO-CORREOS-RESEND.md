# Guia para implementar el envio de correos con Resend

Esta guia permite replicar el sistema de envio de formularios utilizado en esta pagina. La implementacion utiliza:

- Resend como proveedor de correo.
- Una funcion serverless compatible con Vercel.
- Variables de entorno para proteger las credenciales.
- Un formulario que envia la informacion mediante `fetch`.

## Prompt para implementar el sistema

```text
Implementa el envio de correos del formulario de contacto usando Resend y una funcion serverless compatible con Vercel.

Requisitos:

1. Instala la dependencia `resend`.

2. Crea el endpoint `/api/enviar.js` usando Node.js CommonJS.

3. El endpoint debe:
- Aceptar unicamente solicitudes POST.
- Recibir JSON con:
  - nombre, obligatorio
  - apellido, obligatorio
  - telefono, obligatorio
  - correo, opcional
  - especialidad, opcional
  - mensaje, opcional
- Limpiar y limitar los textos recibidos.
- Validar el correo cuando haya sido proporcionado.
- Escapar todo contenido insertado en HTML para evitar inyeccion.
- Crear la fecha usando la zona horaria `America/Guayaquil`.
- Enviar una version HTML y otra de texto plano.
- Usar el correo del paciente como `replyTo`.
- No exponer la API key en el frontend.
- Devolver JSON con codigos HTTP adecuados:
  - 200 si se envio correctamente
  - 400 si faltan datos o son invalidos
  - 405 si el metodo no es POST
  - 500 si falla la configuracion o el envio
- Registrar el error real solamente en los logs del servidor.

4. Utiliza estas variables de entorno:

RESEND_API_KEY=
MAIL_FROM_NAME=Nombre de la empresa
MAIL_FROM=no-reply@midominio.com
MAIL_TO=correo-destino@empresa.com

5. En el frontend:
- Captura el evento submit.
- Crea el payload con FormData.
- Envia un POST JSON a `/api/enviar`.
- Deshabilita el boton durante el envio.
- Muestra los estados "Enviando", "Solicitud enviada" y error.
- Limpia el formulario unicamente cuando el envio tenga exito.

6. Configura todo para funcionar en Vercel.
7. No uses SMTP ni Nodemailer.
8. Manten las claves y direcciones configurables mediante variables de entorno.
9. Incluye instrucciones de instalacion, configuracion DNS, despliegue y prueba.
```

## Crear una cuenta en Resend

1. Ingresa a [resend.com](https://resend.com/).
2. Selecciona `Sign Up`.
3. Registrate con GitHub, Google o correo electronico.
4. Confirma tu direccion de correo si Resend lo solicita.
5. En el panel de Resend, entra a `Domains`.
6. Selecciona `Add Domain`.
7. Escribe el dominio desde el cual se enviaran los correos:

```text
midominio.com
```

8. Resend mostrara los registros DNS necesarios para verificar el dominio.
9. Agrega esos registros en el proveedor donde administras el dominio.
10. Regresa al panel de Resend y espera hasta que aparezca como `Verified`.

## Configurar los registros DNS

Resend normalmente solicita registros relacionados con:

- SPF, para autorizar el envio de correos.
- DKIM, para firmar y autenticar los mensajes.
- MX, para gestionar rebotes.

Los nombres y valores exactos deben copiarse desde el panel de Resend. No utilices los registros DNS de otro dominio.

La propagacion puede tardar desde algunos minutos hasta varias horas, dependiendo del proveedor DNS.

## Crear la API key

1. En el panel de Resend, entra a `API Keys`.
2. Selecciona `Create API Key`.
3. Asigna un nombre descriptivo, por ejemplo:

```text
Formulario sitio web
```

4. Selecciona permisos de envio.
5. Crea la clave.
6. Guarda la clave inmediatamente, ya que puede mostrarse una sola vez.

La clave no debe incluirse en el HTML, JavaScript del navegador, repositorio de GitHub ni archivos publicos.

## Instalar Resend

Desde la carpeta del proyecto, ejecuta:

```bash
npm install resend
```

## Variables de entorno

Crea un archivo `.env` para el entorno local:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
MAIL_FROM_NAME=Nombre de la empresa
MAIL_FROM=no-reply@midominio.com
MAIL_TO=destino@empresa.com
```

Descripcion:

- `RESEND_API_KEY`: clave privada creada en Resend.
- `MAIL_FROM_NAME`: nombre que vera el destinatario.
- `MAIL_FROM`: remitente perteneciente al dominio verificado.
- `MAIL_TO`: direccion que recibira los formularios.

Asegurate de incluir `.env` en `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

## Configurar las variables en Vercel

1. Abre el proyecto en Vercel.
2. Entra a `Settings`.
3. Selecciona `Environment Variables`.
4. Agrega:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
MAIL_FROM_NAME=Nombre de la empresa
MAIL_FROM=no-reply@midominio.com
MAIL_TO=destino@empresa.com
```

5. Selecciona los ambientes donde se utilizaran, como `Production`, `Preview` y `Development`.
6. Guarda las variables.
7. Realiza un nuevo deployment para aplicar la configuracion.

El archivo `.env` local no se carga automaticamente en Vercel.

## Consideraciones sobre el remitente

El valor de `MAIL_FROM` debe utilizar un dominio verificado en Resend:

```env
MAIL_FROM=no-reply@midominio.com
```

No es obligatorio crear un buzon real para `no-reply@midominio.com`. Sin embargo, el dominio debe estar correctamente verificado.

Durante las pruebas iniciales se puede utilizar:

```env
MAIL_FROM=onboarding@resend.dev
```

Este remitente de prueba tiene restricciones y normalmente solo permite enviar al correo asociado con la cuenta de Resend.

## Probar el formulario

1. Abre la pagina publicada.
2. Completa todos los campos obligatorios.
3. Envia el formulario.
4. Confirma que el boton muestra el estado de envio exitoso.
5. Revisa la bandeja configurada en `MAIL_TO`.
6. Revisa tambien las carpetas de spam o promociones.
7. Selecciona `Responder` en el mensaje recibido.
8. Confirma que la respuesta se dirige al correo ingresado en el formulario.

## Diagnosticar errores

Si el formulario no envia:

1. Revisa los logs de la funcion en Vercel.
2. Revisa la seccion de correos y logs en Resend.
3. Confirma que `RESEND_API_KEY` sea valida.
4. Confirma que el dominio aparezca como verificado.
5. Comprueba que `MAIL_FROM` pertenezca al dominio verificado.
6. Verifica que las variables se hayan agregado al ambiente correcto en Vercel.
7. Realiza un nuevo deployment despues de modificar variables.

## Implementacion de referencia

En este proyecto, el endpoint se encuentra en:

```text
api/enviar.js
```

El formulario y la solicitud `fetch` se encuentran en:

```text
index.html
```

La implementacion actual usa el correo del usuario como `replyTo`. De esta manera, cuando el destinatario selecciona `Responder`, la respuesta se dirige directamente a la persona que completo el formulario.

## Recomendacion de seguridad

Si una API key fue compartida por chat, correo, captura de pantalla o cualquier medio publico, debe eliminarse y regenerarse en Resend. Luego se debe actualizar en:

- El archivo `.env` local.
- Las variables de entorno de Vercel.
- Cualquier otro entorno donde se encuentre desplegada la aplicacion.
