:root{--green:#006b3f;--green2:#004b2c;--light:#f4f7f5;--line:#d9dedb;--red:#d92323;--amber:#f2a900}
*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--light);color:#1e2722}
#app{display:flex;min-height:100vh}.sidebar{width:260px;background:linear-gradient(180deg,var(--green),var(--green2));color:white;padding:20px;display:flex;flex-direction:column;gap:24px}
.brand{display:flex;gap:12px;align-items:center}.brand-mark{width:54px;height:54px;border-radius:16px;background:white;color:var(--green);display:grid;place-items:center;font-weight:900}
.brand h1{font-size:24px;margin:0}.brand p{margin:4px 0 0;opacity:.85}.nav{display:block;width:100%;background:transparent;color:white;border:0;text-align:left;padding:14px 16px;border-radius:12px;font-size:16px;margin:4px 0;cursor:pointer}
.nav.active,.nav:hover{background:rgba(255,255,255,.15)}.sync{margin-top:auto;font-size:14px;opacity:.9}
main{flex:1}.topbar{height:72px;background:white;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:18px;padding:0 24px;position:sticky;top:0;z-index:2}
#menuBtn{font-size:24px;background:transparent;border:0}.pill{margin-left:auto;background:#e7f1eb;color:var(--green);padding:8px 12px;border-radius:999px;font-weight:700}
.view{display:none;padding:24px}.view.active{display:block}.cards{display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:18px;margin-bottom:18px}
.card,.panel{background:white;border:1px solid var(--line);border-radius:18px;box-shadow:0 8px 22px rgba(0,0,0,.06);padding:20px}
.card small{display:block;text-transform:uppercase;color:#53645b}.card strong{font-size:42px;color:var(--green);display:block;margin:10px 0}.card span{color:#53645b}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{background:#eef6f1;border:1px solid #cfe4d8;border-radius:999px;padding:8px 12px}
.search,input,select,textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px;font-size:15px;background:white}
textarea{min-height:120px}.station-list{margin-top:14px}.station-row{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:14px 6px;cursor:pointer}.dot{width:12px;height:12px;background:#168c32;border-radius:50%;display:inline-block;margin-right:8px}
.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px}label{font-weight:700;font-size:13px}label input,label select,label textarea{margin-top:6px;font-weight:400}
.group{border:1px solid var(--line);border-radius:14px;margin:10px 0;overflow:hidden}.group-title{background:#e4f1ea;color:#075c38;padding:12px 14px;font-weight:800}
.item{display:grid;grid-template-columns:70px 1fr 190px;gap:10px;align-items:center;padding:10px 14px;border-top:1px solid var(--line)}
.state{display:flex;gap:4px}.state button{border:1px solid var(--line);background:white;border-radius:8px;padding:8px 12px;cursor:pointer}.state button.active.c{background:var(--green);color:white}.state button.active.nc{background:var(--red);color:white}.state button.active.na{background:#777;color:white}
.actions{display:flex;gap:12px;justify-content:flex-end;margin-top:18px}.btn{border:0;border-radius:14px;padding:14px 22px;font-weight:800;cursor:pointer}.btn.secondary{background:#e7f1eb;color:var(--green)}.btn.pdf{background:var(--green);color:white}
@media(max-width:900px){#app{display:block}.sidebar{width:100%;border-radius:0}.cards,.form-grid{grid-template-columns:1fr}.item{grid-template-columns:1fr}.state{margin-top:8px}.view{padding:14px}}
@media print{body{background:white}#app,.sidebar,.topbar,.view,.panel,.cards{display:block;padding:0;margin:0;box-shadow:none;border:0}.sidebar,.topbar,.actions{display:none!important}.view{display:none!important}#inspection{display:block!important}}
