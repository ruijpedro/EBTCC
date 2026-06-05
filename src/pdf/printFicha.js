export async function printFicha(data, checklist){
  try {
    if (window.jspdf?.jsPDF) {
      const blob = await buildPdfBlob(data, checklist);
      const fileName = `${cleanFileName(data.number || "Inspecao")}_${cleanFileName(data.station || "Estacao")}_${cleanFileName(data.date || new Date().toISOString().slice(0,10))}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: "Ficha de Inspeção",
          text: `Ficha de inspeção ${data.number || ""} - ${data.station || ""}`,
          files: [file]
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      return;
    }
  } catch (err) {
    console.error(err);
  }

  alert("O PDF foi gerado em modo de impressão. Escolhe Guardar como PDF ou Partilhar no menu do dispositivo.");
  window.print();
}

async function buildPdfBlob(data, checklist){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 7;
  let y = 10;

  let logo = null;
  try { logo = await loadImageAsDataUrl(assetUrl("assets/ip-logo.png")); } catch(e) {}

  if (logo) pdf.addImage(logo, "PNG", margin, 6, 52, 18);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("FICHA DE INSPEÇÃO", pageW/2, 13, { align: "center" });
  pdf.setFontSize(13);
  pdf.text("Construção Civil", pageW/2, 22, { align: "center" });
  pdf.setLineWidth(0.6);
  pdf.line(margin, 30, pageW - margin, 30);

  y = 36;
  pdf.setFontSize(8.5);
  field(pdf, margin, y, "AM SIGMA:", "543528659");
  field(pdf, 75, y, "Descrição:", data.description || "");
  field(pdf, 150, y, "PKI:", (data.pk || "").split("/")[0] || "");
  y += 7;
  field(pdf, margin, y, "ACTIVO:", "400000016899");
  field(pdf, 75, y, "Subdescrição:", short(data.subDescription || "", 48));
  field(pdf, 150, y, "PKF:", (data.pk || "").split("/")[1] || "");
  y += 7;
  field(pdf, margin, y, "Linha:", "Linha do Oeste");
  field(pdf, 75, y, "Segmento:", data.segment || "");
  field(pdf, 150, y, "Data Inspeção:", data.date || "");
  y += 7;
  field(pdf, margin, y, "C. Manut.:", "Centro Operacional de Manutenção - Centro");
  field(pdf, 75, y, "Equipa:", "B.T. - Equipa Caldas da Rainha");
  y += 7;
  field(pdf, margin, y, "Data Inicial:", "2022/10/03");
  field(pdf, 75, y, "Data Final:", "2022/10/09");
  field(pdf, 150, y, "Inspeção:", data.number || "");
  y += 8;

  const cols = [
    { label:"Item", x:margin, w:18 },
    { label:"Nome", x:margin+18, w:78 },
    { label:"C", x:margin+96, w:8 },
    { label:"NC", x:margin+104, w:10 },
    { label:"NA", x:margin+114, w:10 },
    { label:"Observações", x:margin+124, w:pageW-margin-(margin+124) }
  ];

  drawHeader(pdf, cols, y);
  y += 7;

  const rows = checklist.flatMap(([num,title,items]) => [
    { type:"section", code:num, text:title },
    ...items.map(([code,text]) => ({ type:"item", code, text }))
  ]);

  for (const r of rows) {
    const lines = pdf.splitTextToSize(r.text, cols[1].w - 2);
    const h = Math.max(7, lines.length * 4.2 + 2);
    if (y + h > pageH - 16) {
      addFooter(pdf, data);
      pdf.addPage();
      y = 12;
      drawHeader(pdf, cols, y);
      y += 7;
    }
    drawRow(pdf, cols, y, h, r, data.results || {}, lines);
    y += h;
  }

  if (y + 60 > pageH - 16) {
    addFooter(pdf, data);
    pdf.addPage();
    y = 14;
  }

  y += 5;
  pdf.setFont("helvetica","bold");
  pdf.text("Observações", margin, y);
  y += 3;
  pdf.rect(margin, y, pageW - 2*margin, 22);
  pdf.setFont("helvetica","normal");
  pdf.text(pdf.splitTextToSize(data.observations || "", pageW - 2*margin - 4), margin + 2, y + 5);
  y += 27;

  boxLine(pdf, margin, y, "Executou:", data.executedBy || data.networkUser || "");
  y += 9;
  boxLine(pdf, margin, y, "Status da Inspeção:", data.status || "");
  y += 14;
  pdf.setFont("helvetica","bold");
  pdf.text("Necessidade de acção complementar e/ou proposta de intervenção", margin, y);
  y += 7;
  drawCheckBox(pdf, margin, y, "MPC");
  drawCheckBox(pdf, margin + 30, y, "MC");
  drawCheckBox(pdf, margin + 60, y, "Não Aplicável");
  y += 12;
  pdf.rect(margin, y, pageW - 2*margin, 22);
  y += 28;
  boxLine(pdf, margin, y, "Responsável Equipa Inspeção:", data.responsible || "");
  addFooter(pdf, data);

  if ((data.photos || []).length) {
    pdf.addPage();
    y = 12;
    if (logo) pdf.addImage(logo, "PNG", margin, 8, 45, 16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("REGISTO FOTOGRÁFICO", pageW / 2, 18, { align: "center" });
    y = 32;
    for (let i=0; i<data.photos.length; i++) {
      const p = data.photos[i];
      if (y + 70 > pageH - 16) {
        addFooter(pdf, data);
        pdf.addPage();
        y = 14;
      }
      pdf.setFont("helvetica","bold");
      pdf.setFontSize(10);
      pdf.text(`Foto ${i+1}${p.caption ? " — " + p.caption : ""}`, margin, y);
      y += 4;
      pdf.addImage(p.data, "JPEG", margin, y, 86, 58);
      y += 66;
    }
    addFooter(pdf, data);
  }

  return pdf.output("blob");
}

function field(pdf, x, y, label, value){
  pdf.setFont("helvetica", "bold");
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(short(value, 52), x + 20, y);
}

function drawHeader(pdf, cols, y){
  pdf.setFillColor(210,210,210);
  pdf.setDrawColor(170,170,170);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(8);
  for (const c of cols) {
    pdf.rect(c.x, y, c.w, 7, "FD");
    pdf.text(c.label, c.x + 1.5, y + 4.7);
  }
}

function drawRow(pdf, cols, y, h, r, results, lines){
  pdf.setDrawColor(205,205,205);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", r.type === "section" ? "bold" : "normal");
  for (const c of cols) pdf.rect(c.x, y, c.w, h);
  pdf.text(String(r.code), cols[0].x + 1.3, y + 4.5);
  pdf.text(lines, cols[1].x + 1.3, y + 4.5);
  const v = results[r.code] || "";
  pdf.setFont("helvetica","normal");
  if (v === "C") pdf.text("X", cols[2].x + 3, y + 4.7);
  if (v === "NC") pdf.text("X", cols[3].x + 4, y + 4.7);
  if (v === "NA") pdf.text("X", cols[4].x + 4, y + 4.7);
}

function boxLine(pdf, x, y, label, value){
  const pageW = pdf.internal.pageSize.getWidth();
  pdf.rect(x, y, 72, 8);
  pdf.rect(x+72, y, pageW - x*2 - 72, 8);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(8.5);
  pdf.text(label, x+1.5, y+5);
  pdf.setFont("helvetica","normal");
  pdf.text(String(value || ""), pageW - x - 2, y+5, { align:"right" });
}

function drawCheckBox(pdf, x, y, label){
  pdf.rect(x, y-4, 7, 7);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(8);
  pdf.text(label, x+9, y+1);
}

function addFooter(pdf, data){
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.setFont("helvetica","normal");
  pdf.setFontSize(7.5);
  pdf.text(`Ficha de Inspeção: ${data.number || ""} - eInspeções`, 7, pageH-6);
  pdf.text(`Utilizador de Rede: ${data.networkUser || ""}`, 72, pageH-6);
  pdf.text(`Data de Impressão: ${new Date().toLocaleDateString("pt-PT")}`, 128, pageH-6);
  pdf.text(`Página ${pdf.internal.getNumberOfPages()}`, pageW-8, pageH-6, { align:"right" });
}

function loadImageAsDataUrl(url){
  return fetch(url).then(r => r.blob()).then(blob => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  }));
}

function assetUrl(path){
  const base = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
  return base + path;
}

function short(value, max=60){
  const s = String(value || "");
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function cleanFileName(value){
  return String(value || "ficheiro").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");
}
