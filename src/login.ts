// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V12.1 Login Page
// 9通环形轨道动画 + 信任徽章 + 品牌升级
// ═══════════════════════════════════════════════════════

import { T, getConnects, LOGO_LG, navBrand, shell } from './core'

export function loginPage(lang: string): string {
  const t = T(lang)
  const zh = t.zh
  const connects = getConnects(zh)

  // 计算9个节点在圆上的位置 (radius=119, center=140,140)
  const orbitNodes = connects.map((cn, i) => {
    const angle = (i * 40 - 90) * (Math.PI / 180) // 从顶部开始，每40度一个
    const r = 119
    const cx = 140 + r * Math.cos(angle) - 21 // 21 = node width/2
    const cy = 140 + r * Math.sin(angle) - 21
    return `<div class="orbit-node" style="left:${cx}px;top:${cy}px;" title="${cn.name} — ${cn.desc}">
      <span class="orbit-node-char" style="color:${cn.color};">${cn.char}</span>
      <span class="orbit-node-label">${cn.name}</span>
    </div>`
  }).join('')

  const body = `
  <div class="hero-dark">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <nav class="navbar-dark" id="navbar">
      <div class="nav-inner">
        ${navBrand('/', 'dark', zh)}
        <div style="display:flex;align-items:center;gap:6px;">
          <a href="?lang=${t.nav.langToggle}" class="btn-ghost-dark">${t.nav.langLabel}</a>
          <a href="https://microconnect.com" class="btn-ghost-dark"><i class="fas fa-external-link-alt" style="font-size:10px;margin-right:4px;"></i>${t.nav.backToMain}</a>
        </div>
      </div>
    </nav>

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px 20px;position:relative;z-index:2;">
      <div style="width:100%;max-width:460px;">

        <!-- V12.1 Orbit Ring — 9通环形轨道 -->
        <div style="animation:slide-up .7s var(--ease-out-expo) forwards;">
          <div class="orbit-container">
            <div class="orbit-ring">${orbitNodes}</div>
            <div class="orbit-ring-2"></div>
            <div class="orbit-center">
              ${LOGO_LG}
              <div style="margin-top:10px;">
                <div style="font-size:20px;font-weight:800;color:rgba(255,255,255,0.95);letter-spacing:-0.03em;font-family:'Noto Sans SC',sans-serif;">${zh ? '身份通' : 'Identity'}</div>
                <div class="font-brand" style="font-size:9px;color:rgba(255,255,255,0.30);letter-spacing:3px;margin-top:2px;">CONNECT</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Brand message -->
        <div style="text-align:center;margin-bottom:28px;animation:fade-in .8s .2s both;">
          <div style="display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);margin-bottom:20px;">
            <div style="width:6px;height:6px;border-radius:50%;background:#34c759;animation:pulse-dot 2s infinite;"></div>
            <span style="font-size:11px;color:rgba(255,255,255,0.40);font-weight:500;letter-spacing:0.3px;">${zh ? '9通产品 · 统一登录入口' : '9 Products · Unified Gateway'}</span>
          </div>
          <h1 style="font-size:28px;font-weight:800;color:rgba(255,255,255,0.95);letter-spacing:-0.5px;line-height:1.25;margin-bottom:10px;">
            ${t.auth.welcome}
          </h1>
          <p style="font-size:13px;color:rgba(255,255,255,0.30);font-weight:400;line-height:1.7;max-width:340px;margin:0 auto;">
            ${t.auth.desc}
          </p>
        </div>

        <!-- Trust Badges V12.1 -->
        <div class="trust-badges" style="margin-bottom:24px;">
          <div class="trust-badge">
            <div class="trust-badge-icon"><i class="fas fa-link" style="font-size:11px;color:rgba(93,196,179,0.6);"></i></div>
            <span class="trust-badge-label">${t.auth.trustSSO}</span>
          </div>
          <div class="trust-badge">
            <div class="trust-badge-icon"><i class="fas fa-lock" style="font-size:11px;color:rgba(99,102,241,0.6);"></i></div>
            <span class="trust-badge-label">${t.auth.trustEncrypt}</span>
          </div>
          <div class="trust-badge">
            <div class="trust-badge-icon"><i class="fas fa-user-shield" style="font-size:11px;color:rgba(245,158,11,0.6);"></i></div>
            <span class="trust-badge-label">${t.auth.trustRBAC}</span>
          </div>
          <div class="trust-badge">
            <div class="trust-badge-icon"><i class="fas fa-clipboard-check" style="font-size:11px;color:rgba(52,199,89,0.6);"></i></div>
            <span class="trust-badge-label">${t.auth.trustCompliance}</span>
          </div>
        </div>

        <!-- Login Card -->
        <div class="card-glass" style="padding:32px 28px;animation:scale-in .6s var(--ease-out-expo) .15s both;">
          <div style="display:flex;gap:0;margin-bottom:28px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <button class="tab-btn active" onclick="switchTab('phone')" id="tab-phone">
              <i class="fas fa-mobile-alt" style="margin-right:6px;font-size:12px;opacity:0.6;"></i>${t.auth.phoneTab}
            </button>
            <button class="tab-btn" onclick="switchTab('email')" id="tab-email">
              <i class="fas fa-envelope" style="margin-right:6px;font-size:12px;opacity:0.6;"></i>${t.auth.emailTab}
            </button>
          </div>

          <div id="form-phone">
            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <input type="tel" id="inp-phone" class="input-glass" placeholder="${t.auth.phonePlaceholder}" style="flex:1;">
              <button class="btn-code" onclick="sendCode()" id="btn-code">${t.auth.getCode}</button>
            </div>
            <input type="text" id="inp-code" class="input-glass" placeholder="${t.auth.codePlaceholder}" style="margin-bottom:14px;" maxlength="6">
          </div>

          <div id="form-email" style="display:none;">
            <input type="email" id="inp-email" class="input-glass" placeholder="${t.auth.emailPlaceholder}" style="margin-bottom:14px;">
            <input type="password" id="inp-password" class="input-glass" placeholder="${t.auth.passwordPlaceholder}" style="margin-bottom:14px;">
          </div>

          <div id="name-row" style="display:none;">
            <input type="text" id="inp-name" class="input-glass" placeholder="${t.auth.namePlaceholder}" style="margin-bottom:14px;">
          </div>

          <button class="btn-primary" style="width:100%;padding:15px;margin-top:4px;" onclick="doSubmit()" id="btn-submit">
            <i class="fas fa-arrow-right" style="font-size:13px;"></i>${t.auth.loginBtn}
          </button>

          <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.20);margin-top:16px;">${t.auth.noAccount}</p>
        </div>

        <!-- Demo hint -->
        <div style="margin-top:20px;padding:14px 18px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:14px;animation:fade-in 1s .4s both;">
          <p style="font-size:11px;color:rgba(255,255,255,0.22);line-height:1.8;">
            <i class="fas fa-flask" style="color:rgba(93,196,179,0.5);margin-right:5px;"></i>
            <strong style="color:rgba(255,255,255,0.35);">Demo</strong>&nbsp;
            ${zh ? '融资方: 13800001234 / 验证码 123456' : 'Borrower: 13800001234 / Code 123456'}
            <br><span style="margin-left:22px;">${zh ? '投资方: investor@fund.com / 密码 demo123' : 'Investor: investor@fund.com / Pass demo123'}</span>
          </p>
        </div>

        <!-- Terms -->
        <div style="text-align:center;margin-top:24px;animation:fade-in 1s .6s both;">
          <p style="font-size:10px;color:rgba(255,255,255,0.15);line-height:1.8;">
            ${zh ? '登录即表示同意' : 'By logging in you agree to'} <a href="#" style="color:rgba(93,196,179,0.5);text-decoration:none;">${zh ? '服务条款' : 'Terms'}</a> ${zh ? '和' : '&'} <a href="#" style="color:rgba(93,196,179,0.5);text-decoration:none;">${zh ? '隐私政策' : 'Privacy'}</a>
          </p>
        </div>
      </div>
    </div>
  </div>

  <script>
  (function(){
    var params=new URLSearchParams(window.location.search);
    if(params.get('logout')==='1'){clearAuth();params.delete('logout');var newUrl=window.location.pathname;if(params.toString())newUrl+='?'+params.toString();window.history.replaceState(null,'',newUrl);return;}
    var tk=getToken();var usr=getUser();
    if(!tk||!usr||!usr.id){clearAuth();return;}
    fetch('/api/user/profile',{headers:{'Authorization':'Bearer '+tk,'Content-Type':'application/json'}})
    .then(function(resp){if(!resp.ok){clearAuth();return null;} return resp.json()})
    .then(function(r){
      if(r&&r.success&&r.user&&r.user.id){
        localStorage.setItem('ic_user',JSON.stringify(r.user));
        window.location.href='/dashboard'+window.location.search;
      } else {clearAuth();}
    }).catch(function(){clearAuth();});
  })();
  var currentTab='phone',showName=false;
  function switchTab(tab){
    currentTab=tab;
    document.getElementById('tab-phone').classList.toggle('active',tab==='phone');
    document.getElementById('tab-email').classList.toggle('active',tab==='email');
    document.getElementById('form-phone').style.display=tab==='phone'?'block':'none';
    document.getElementById('form-email').style.display=tab==='email'?'block':'none';
  }
  function sendCode(){
    var p=document.getElementById('inp-phone').value.trim();
    if(!p){showToast('${zh ? '请输入手机号' : 'Enter phone number'}','error');return}
    api('/api/auth/verify-code',{method:'POST',body:JSON.stringify({phone:p})}).then(function(r){
      if(r.success){showToast('${zh ? '验证码已发送 (123456)' : 'Code sent (123456)'}','success');startCD()}
    });
  }
  function startCD(){var s=60,b=document.getElementById('btn-code');b.disabled=true;var iv=setInterval(function(){s--;b.textContent=s+'s';if(s<=0){clearInterval(iv);b.disabled=false;b.textContent='${t.auth.getCode}'}},1000);}
  async function doSubmit(){
    var btn=document.getElementById('btn-submit');btn.disabled=true;btn.innerHTML='<span class="spinner"></span>';
    try{
      var body={};
      if(currentTab==='phone'){body.phone=document.getElementById('inp-phone').value.trim();body.verifyCode=document.getElementById('inp-code').value.trim();}
      else{body.email=document.getElementById('inp-email').value.trim();body.password=document.getElementById('inp-password').value.trim();}
      var r=await api('/api/auth/login',{method:'POST',body:JSON.stringify(body)});
      if(r.success){setAuth(r.token,r.user);showToast('${zh ? '登录成功，进入操作台' : 'Welcome to Command Center'}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},500);return;}
      if(r.message&&r.message.indexOf('${zh ? '不存在' : 'not exist'}')!==-1){
        if(!showName){showName=true;document.getElementById('name-row').style.display='block';showToast('${zh ? '新用户，请输入姓名完成注册' : 'Enter name to register'}','info');return;}
        body.name=document.getElementById('inp-name').value.trim();
        if(!body.name){showToast('${zh ? '请输入姓名' : 'Enter name'}','error');return}
        var r2=await api('/api/auth/register',{method:'POST',body:JSON.stringify(body)});
        if(r2.success){setAuth(r2.token,r2.user);showToast('${zh ? '注册成功' : 'Registered'}','success');setTimeout(function(){window.location.href='/dashboard'+window.location.search},500);return;}
        showToast(r2.message,'error');
      } else {showToast(r.message||'${zh ? '操作失败' : 'Failed'}','error');}
    }catch(e){showToast('${zh ? '网络错误' : 'Network error'}','error')}
    finally{btn.disabled=false;btn.textContent='${t.auth.loginBtn}'}
  }
  </script>`

  return shell(t.nav.title + ' | ' + (zh ? '滴灌通' : 'Micro Connect'), body, lang)
}
