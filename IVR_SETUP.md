# CivicPulse IVR System - Vapi Setup & Provisioning Guide

This guide details how to set up, configure, and provision the production AI IVR System using **Vapi.ai** integrated directly into CivicPulse.

---

## 1. Prerequisites

1. **Vapi Account**: Active account on [vapi.ai](https://vapi.ai).
2. **Phone Number**: An active phone number purchased or imported into Vapi (or Twilio/Vonage connected to Vapi).
3. **Public Server URL**: Webhook endpoint accessible over HTTPS (e.g. `https://your-domain.vercel.app` or via `ngrok` for local development).

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` (or set these variables in your deployment dashboard on Vercel / Railway):

```env
# Vapi AI Integration
VAPI_API_KEY=vapi_live_your_actual_api_key_here
VAPI_ASSISTANT_ID=ast_your_vapi_assistant_id_here
VAPI_PHONE_NUMBER_ID=phone_your_vapi_phone_number_id_here
VAPI_WEBHOOK_SECRET=your_secure_webhook_shared_secret
```

---

## 3. Provisioning the Vapi Assistant

CivicPulse includes a pre-configured Vapi Assistant schema at `src/config/vapiAssistantConfig.json`. You can provision it automatically via the API or manually via the Vapi Dashboard.

### Option A: Automatic Provisioning (Via Backend Endpoint)

1. Start the CivicPulse server:
   ```bash
   npm run dev
   ```
2. Retrieve the generated assistant schema from CivicPulse:
   ```bash
   curl http://localhost:5000/api/ivr/assistant-config
   ```
3. Import the returned JSON into Vapi via their API:
   ```bash
   curl -X POST "https://api.vapi.ai/assistant" \
     -H "Authorization: Bearer $VAPI_API_KEY" \
     -H "Content-Type: application/json" \
     -d @src/config/vapiAssistantConfig.json
   ```

### Option B: Manual Vapi Web Dashboard Configuration

1. Log into [dashboard.vapi.ai](https://dashboard.vapi.ai).
2. Create a new Assistant:
   - **Name**: `CivicPulse AI Voice Assistant`
   - **Transcriber**: Deepgram (`nova-2` model, supporting `en` & `hi`)
   - **Model**: OpenAI `gpt-4o` or `gpt-4o-mini` with `temperature: 0.2`
   - **Voice**: ElevenLabs or Azure Neural Voice (`en-IN` / `hi-IN` compatible accent)
3. Copy the System Prompt from `src/config/vapiAssistantConfig.json`:
   - Set tone: Polite, civic-minded, clear, concise.
   - Set bilingual rules: Automatically detect English or Hindi.
4. Set Server Webhook URL:
   - **URL**: `https://<YOUR-DOMAIN>/api/ivr/vapi-tool`
   - **Secret Header**: `x-vapi-secret: <VAPI_WEBHOOK_SECRET>`
5. Register Tools:
   - `create_civic_report`
   - `get_civic_report_status`
   - `update_civic_report`
   - `escalate_civic_report`

---

## 4. Phone Number Assignment

1. Navigate to **Phone Numbers** in Vapi Dashboard.
2. Select your phone number.
3. Assign `CivicPulse AI Voice Assistant` as the inbound assistant.
4. Save configuration.

---

## 5. Local Webhook Testing with Ngrok

To test inbound calls locally before deploying to production:

```bash
# 1. Start CivicPulse local dev server
npm run dev

# 2. Expose port 5000 via ngrok in another terminal
ngrok http 5000

# 3. Update Vapi Assistant Webhook URL in dashboard to:
# https://<your-ngrok-subdomain>.ngrok-free.app/api/ivr/vapi-tool
```

Now dial your Vapi phone number from any mobile device!

---

## 6. Security Checklist

- [x] Enforce `VAPI_WEBHOOK_SECRET` header validation in express middleware (`verifyVapiSecret`).
- [x] Restrict API rate limits (`apiLimiter`).
- [x] Protect user metadata and validate phone number inputs.
