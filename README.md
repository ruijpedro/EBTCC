# Inspeções_RJP v1.6 — IP Corporate + Google

Versão com identidade visual Infraestruturas de Portugal e integração Google.

## Inclui

- Cores e ambiente IP.
- Logótipo IP no cabeçalho da app.
- Remoção de “RJP Manutenção”.
- Ícones PWA e Android.
- PDF com logótipo IP, checklist, observações e fotografias.
- Guardar/partilhar PDF por WhatsApp, email ou dispositivo.
- Google Drive na pasta EBTCC.
- Google Sheets para estatísticas NC.
- Hub comum para intercâmbio com EDF_Oeste, EBTCC, AMV, FenceRail_RJP e futuras apps.

## Atualizar no GitHub

Substitui/adiciona tudo:
- index.html
- manifest.json
- service-worker.js
- README.md
- package.json
- capacitor.config.json
- src/
- assets/
- .github/workflows/build-android.yml
- google-apps-script/Code.gs

## Configurar Google

Depois de criares a Web App no Apps Script, cola o URL em:

`src/google/config.js`

no campo:

`APPS_SCRIPT_URL`
