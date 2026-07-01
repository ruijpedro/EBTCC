# EBTCC v2.2 — Correção botões, WebApp=APK e ícone

## O que foi corrigido

- `app.js` refeito para garantir que todos os botões funcionam.
- WebApp e APK usam exatamente o mesmo `index.html`, `src` e `assets`.
- Service worker com cache nova `ebtcc-v2-2`.
- Ícone Android reconstruído com símbolo IP grande.
- Removido `mipmap-anydpi-v26` no build para evitar adaptive icon genérico.
- Página Google/Drive como na RJP Study.
- Botões:
  - Guardar ligação
  - Testar ligação
  - Preparar Drive/Sheets
  - Sincronizar Drive
  - Guardar tudo na Cloud
  - Carregar da Cloud
  - Sincronizar tudo
  - Exportar Calendar
  - Guardar PDF no Drive
  - Gerar/partilhar PDF

## Depois de atualizar

1. No GitHub, substitui tudo por este ZIP.
2. Corre o workflow `Build WebApp`.
3. Corre o workflow `Build Android APK`.
4. No telemóvel, desinstala a APK antiga.
5. Reinicia o telemóvel.
6. Instala a nova APK.
7. Na WebApp, faz Ctrl+F5 para limpar cache.


## v3 — Opção de Linha

- Campo **Linha** adicionado antes da Estação.
- Permite escolher **Linha do Oeste** ou **Linha da Beira Alta**.
- A lista de estações muda automaticamente conforme a linha escolhida.
- Campos mantidos mas sem preenchimento automático.
- Observações em branco.


## v6 — Correção WebApp

Workflow `Build WebApp` corrigido para app estática:
- cria pasta `dist`;
- copia `index.html`, `src`, `assets`, `manifest.json` e `service-worker.js`;
- adiciona `.nojekyll`;
- publica no GitHub Pages com concurrency para evitar deployments em conflito.
