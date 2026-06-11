export async function printFicha(data, checklist){
  const blob = await buildPdfBlobForGoogle(data, checklist);
  const fileName = `${cleanFileName(data.number || "EBTCC")}_${cleanFileName(data.station || "Estacao")}_${cleanFileName(data.date || new Date().toISOString().slice(0,10))}.pdf`;
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({ title: "Ficha EBTCC", text: fileName, files: [file] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

export async function buildPdfBlobForGoogle(data, checklist){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  const m = 8;
  let y = 12;

  try{
    const logo = await loadImageAsDataUrl(assetUrl("assets/ip-logo.png"));
    pdf.addImage(logo, "PNG", m, 6, 50, 18);
  }catch(e){}

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(16);
  pdf.text("EBTCC", w/2, 13, {align:"center"});
  pdf.setFontSize(13);
  pdf.text("Ficha de Inspeção de Construção Civil", w/2, 22, {align:"center"});
  pdf.setFontSize(9);
  pdf.text("Infraestruturas de Portugal · Linha do Oeste", w/2, 29, {align:"center"});
  pdf.line(m, 33, w-m, 33);
  y = 40;

  field(pdf,m,y,"N.º:",data.number||""); field(pdf,75,y,"Estação:",data.station||""); field(pdf,145,y,"Data:",data.date||""); y+=7;
  field(pdf,m,y,"Descrição:",data.description||""); field(pdf,115,y,"Segmento:",data.segment||""); y+=7;
  field(pdf,m,y,"PK:",data.pk||""); field(pdf,75,y,"Inspetor:",data.inspector||""); y+=10;

  header(pdf,y,m,w); y+=7;
  const rows = checklist.flatMap(([num,title,items]) => [{code:num,text:title,section:true}, ...items.map(([code,text])=>({code,text}))]);
  for(const r of rows){
    const lines=pdf.splitTextToSize(r.text, 100);
    const rh=Math.max(7, lines.length*4+2);
    if(y+rh>h-20){ footer(pdf,data); pdf.addPage(); y=12; header(pdf,y,m,w); y+=7; }
    pdf.setFont("helvetica", r.section?"bold":"normal"); pdf.setFontSize(7.5);
    pdf.rect(m,y,18,rh); pdf.rect(m+18,y,100,rh); pdf.rect(m+118,y,12,rh); pdf.rect(m+130,y,12,rh); pdf.rect(m+142,y,12,rh); pdf.rect(m+154,y,w-m-(m+154),rh);
    pdf.text(String(r.code),m+2,y+4.8); pdf.text(lines,m+20,y+4.8);
    const v=(data.results||{})[r.code]||"";
    if(v==="C") pdf.text("X",m+123,y+4.8);
    if(v==="NC") pdf.text("X",m+134,y+4.8);
    if(v==="NA") pdf.text("X",m+146,y+4.8);
    y+=rh;
  }

  if(y+45>h-20){ footer(pdf,data); pdf.addPage(); y=12; }
  y+=6; pdf.setFont("helvetica","bold"); pdf.text("Observações",m,y); y+=3;
  pdf.rect(m,y,w-2*m,28); pdf.setFont("helvetica","normal"); pdf.text(pdf.splitTextToSize(data.observations||"", w-2*m-4),m+2,y+5); y+=34;
  field(pdf,m,y,"Responsável:",data.responsible||""); field(pdf,105,y,"Estado:",data.status||""); footer(pdf,data);

  if((data.photos||[]).length){
    pdf.addPage(); y=15; pdf.setFont("helvetica","bold"); pdf.setFontSize(15); pdf.text("Registo Fotográfico", w/2, y, {align:"center"}); y+=12;
    for(let i=0;i<data.photos.length;i++){
      const p=data.photos[i];
      if(y+70>h-15){ footer(pdf,data); pdf.addPage(); y=15; }
      pdf.setFontSize(10); pdf.text(`Foto ${i+1}${p.caption?" — "+p.caption:""}`,m,y); y+=4;
      pdf.addImage(p.data,"JPEG",m,y,86,58); y+=66;
    }
    footer(pdf,data);
  }

  return pdf.output("blob");
}

function header(pdf,y,m,w){ pdf.setFillColor(210,210,210); pdf.setFont("helvetica","bold"); pdf.setFontSize(8); [["Item",18],["Nome",100],["C",12],["NC",12],["NA",12],["Observações",w-m-(m+154)]].reduce((x,[t,wd])=>{pdf.rect(x,y,wd,7,"FD");pdf.text(t,x+1.5,y+4.7);return x+wd},m); }
function field(pdf,x,y,l,v){ pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5); pdf.text(l,x,y); pdf.setFont("helvetica","normal"); pdf.text(short(v,55),x+22,y); }
function footer(pdf,data){ const h=pdf.internal.pageSize.getHeight(), w=pdf.internal.pageSize.getWidth(); pdf.setFontSize(7.5); pdf.text(`EBTCC · ${data.number||""}`,8,h-6); pdf.text(new Date().toLocaleDateString("pt-PT"),w-8,h-6,{align:"right"}); }
function loadImageAsDataUrl(url){ return fetch(url).then(r=>r.blob()).then(b=>new Promise(res=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.readAsDataURL(b)})); }
function assetUrl(path){ return window.location.href.substring(0, window.location.href.lastIndexOf("/")+1)+path; }
function short(v,max=60){ const s=String(v||""); return s.length>max?s.slice(0,max-1)+"…":s; }
function cleanFileName(v){ return String(v||"ficheiro").replace(/[\\/:*?"<>|]+/g,"_").replace(/\s+/g,"_"); }
