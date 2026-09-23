# Racha Limpia

Competencia privada de 3 personas contra su Pecado, del 1 al 31 de octubre de 2026. Marca tu día de noche (18:00–04:00), desde la web o desde el bot de Telegram; el que llega con más días limpios gana.

## Stack

- Frontend: Vue 3 + Vite, PWA instalable (`vite-plugin-pwa`), sin router (una sola pantalla con tabs).
- Backend: funciones serverless de Vercel bajo `/api`.
- Datos: Vercel Blob — un JSON por `checkins/{usuario}/{fecha}.json` y `users/{usuario}.json`.
- Bot: webhook de Telegram (`/api/telegram/webhook`) que comparte toda la lógica de honestidad con el check-in web.
- Cron: `/api/cron/tick`, cada hora — recordatorios + barrido de días no reportados.

## Desarrollo local

```bash
npm install
npm run dev      # solo el frontend (Vite) — /api no responde sin `vercel dev`
npm test         # Vitest: reglas de ventana horaria + cálculo de rachas
npm run build
```

## Variables de entorno

Ver `.env.example`. En Vercel, `BLOB_READ_WRITE_TOKEN` se crea sola al conectar un Blob store al proyecto; las demás (`AUTH_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`) se generan a mano y se cargan como variables de entorno del proyecto.

## Poner el bot de Telegram a andar

1. Habla con [@BotFather](https://t.me/BotFather), `/newbot`, te da un `TELEGRAM_BOT_TOKEN`.
2. Define tu propio `TELEGRAM_WEBHOOK_SECRET` (cualquier cadena larga al azar).
3. Ya desplegado, registra el webhook una vez:
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://<tu-dominio>/api/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
   ```
4. Cada uno de los 3 le escribe `/start` al bot una vez para vincular su cuenta.

## Pendiente de diseño

Los íconos PWA (`public/icon.svg`) son un placeholder — un ícono final en PNG/maskable es un paso de diseño aparte, no de código.
