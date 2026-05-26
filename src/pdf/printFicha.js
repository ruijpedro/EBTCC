export function printFicha(data, checklist){
  const rows = checklist.flatMap(([num,title,items]) => [
    { type:"section", code:num, text:title },
    ...items.map(([code,text]) => ({ type:"item", code, text }))
  ]);

  const rowHtml = rows.map(r => {
    if(r.type === "section"){
      return `<tr class="section"><td>${r.code}</td><td>${escapeHtml(r.text)}</td><td></td><td></td><td></td><td></td></tr>`;
    }
    const v = data.results?.[r.code] || "";
    return `<tr>
      <td>${r.code}</td>
      <td>${escapeHtml(r.text)}</td>
      <td>${v === "C" ? "X" : ""}</td>
      <td>${v === "NC" ? "X" : ""}</td>
      <td>${v === "NA" ? "X" : ""}</td>
      <td></td>
    </tr>`;
  }).join("");

  const html = `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<title>Ficha de Inspeção</title>
<style>
  @page{size:A4 landscape;margin:9mm}
  body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111;font-size:9px}
  .page{position:relative;min-height:188mm;padding-left:20mm}
  .vertical-title{position:absolute;left:0;top:42mm;writing-mode:vertical-rl;transform:rotate(180deg);font-size:18px;font-weight:700;letter-spacing:.5px}
  .vertical-sub{position:absolute;left:10mm;top:62mm;writing-mode:vertical-rl;transform:rotate(180deg);font-size:16px;font-weight:700}
  .left-meta{position:absolute;left:2mm;top:128mm;writing-mode:vertical-rl;transform:rotate(180deg);line-height:1.7}
  .head{display:grid;grid-template-columns:1.1fr 1.3fr 1.1fr;gap:8mm;margin-bottom:4mm}
  .head div{line-height:1.55}
  .head b{font-weight:700}
  table{border-collapse:collapse;width:100%;table-layout:fixed}
  th,td{border:1px solid #cfcfcf;padding:2px 4px;vertical-align:middle}
  th{background:#d0d0d0;font-weight:700}
  .col-item{width:8mm}.col-name{width:88mm}.col-check{width:8mm}.col-obs{width:auto}
  td:nth-child(3),td:nth-child(4),td:nth-child(5){text-align:center;font-size:11px}
  .section td{font-weight:700;background:#fff}
  .obs-block{margin-top:4mm;border:1px solid #222;min-height:18mm;padding:3mm;white-space:pre-wrap}
  .signature-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10mm;margin-top:4mm}
  .box{border:1px solid #222;height:14mm;padding:2mm}
  .small-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6mm;margin-top:3mm}
  .footer{position:fixed;bottom:4mm;left:10mm;right:10mm;display:flex;justify-content:space-between;font-size:8px}
</style>
</head>
<body>
  <div class="page">
    <div class="vertical-title">FICHA DE INSPEÇÃO</div>
    <div class="vertical-sub">Construção Civil</div>

    <div class="head">
      <div>
        <b>AM SIGMA:</b> 543528659<br>
        <b>CNTV:</b> 0010600<br>
        <b>Linha:</b> Linha do Oeste<br>
        <b>C. Manut.:</b> Centro Operacional de Manutenção Centro<br>
        <b>Data Inicial:</b> 2022/10/03
      </div>
      <div>
        <b>Descrição:</b> ${escapeHtml(data.description || "")}<br>
        <b>Subdescrição:</b> ${escapeHtml(data.subDescription || "")}<br>
        <b>Segmento:</b> ${escapeHtml(data.segment || "")}<br>
        <b>Equipa:</b> BT - Equipa Caldas da Rainha<br>
        <b>Data Final:</b> 2022/10/09
      </div>
      <div>
        <b>PKI:</b> ${escapeHtml((data.pk || "").split("/")[0] || "")}<br>
        <b>PKF:</b> ${escapeHtml((data.pk || "").split("/")[1] || "")}<br>
        <b>Data Inspeção:</b> ${escapeHtml(data.date || "")}
      </div>
    </div>

    <table>
      <thead><tr><th class="col-item">Item</th><th class="col-name">Nome</th><th class="col-check">C</th><th class="col-check">NC</th><th class="col-check">NA</th><th class="col-obs">Observações</th></tr></thead>
      <tbody>${rowHtml}</tbody>
    </table>

    <b>Observações</b>
    <div class="obs-block">${escapeHtml(data.observations || "")}</div>

    <div class="small-row">
      <div class="box"><b>Executou:</b><br>${escapeHtml(data.executedBy || "")}</div>
      <div class="box"><b>Status da Inspeção:</b><br>${escapeHtml(data.status || "")}</div>
      <div class="box"><b>Responsável Equipa Inspeção:</b><br>${escapeHtml(data.responsible || "")}</div>
    </div>
  </div>
  <div class="footer">
    <span>Ficha de Inspeção: 69526 - Inspeções</span>
    <span>Utilizador de Rede: ${escapeHtml(data.networkUser || "")}</span>
    <span>Data de Impressão: ${new Date().toLocaleDateString("pt-PT")}</span>
    <span>Página 1</span>
  </div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
