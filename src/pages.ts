// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V12.1 Pages
// 账户设置 + 通知中心 + 主体认证
// ═══════════════════════════════════════════════════════

import { T, LOGO, navBrand, shell, footerHTML, demoNotifications, demoSecurityLogs } from './core'

// ═══════════════════════════════════════════
// PAGE: 账户设置 (/settings)
// ═══════════════════════════════════════════
export function settingsPage(lang: string): string {
  const t = T(lang)
  const zh = t.zh

  const body = `
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <div style="display:flex;align-items:center;gap:12px;">
        ${navBrand('/dashboard' + (lang === 'en' ? '?lang=en' : ''), 'light', zh)}
        <span class="badge badge-brand" style="font-size:10px;margin-left:4px;"><i class="fas fa-cog" style="font-size:9px;"></i>${t.cmd.settings}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost" style="padding:7px 12px;font-size:12px;"><i class="fas fa-arrow-left" style="font-size:10px;margin-right:4px;"></i>${zh ? '返回操作台' : 'Dashboard'}</a>
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost" style="padding:7px 12px;font-size:12px;">${t.nav.langLabel}</a>
        <button onclick="doLogout()" class="btn-ghost" style="padding:7px 12px;font-size:12px;color:var(--error);border-color:rgba(255,55,95,0.12);"><i class="fas fa-sign-out-alt" style="font-size:11px;"></i></button>
      </div>
    </div>
  </nav>

  <main style="max-width:900px;margin:0 auto;padding:32px 20px;">
    <div class="reveal" style="margin-bottom:28px;">
      <h1 style="font-size:24px;font-weight:800;color:var(--text-primary);">${t.settings.title}</h1>
      <p style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">${zh ? '管理你的账户信息、安全设置和通知偏好' : 'Manage account info, security and notifications'}</p>
    </div>

    <div class="settings-layout">
      <!-- Sidebar Nav -->
      <div class="settings-sidebar">
        <div class="settings-nav">
          <button class="settings-nav-item active" onclick="showSection('profile',this)"><i class="fas fa-user"></i>${t.settings.profile}</button>
          <button class="settings-nav-item" onclick="showSection('security',this)"><i class="fas fa-shield-alt"></i>${t.settings.security}</button>
          <button class="settings-nav-item" onclick="showSection('notif-pref',this)"><i class="fas fa-bell"></i>${t.settings.notifications}</button>
          <button class="settings-nav-item" onclick="showSection('sec-log',this)"><i class="fas fa-history"></i>${t.settings.securityLog}</button>
        </div>
      </div>

      <!-- Content -->
      <div>
        <!-- Profile Section -->
        <div id="sec-profile" class="settings-section reveal stagger-1">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-card-title">${t.settings.profile}</div>
              <div class="settings-card-desc">${zh ? '你的基本信息和账户详情' : 'Your basic info and account details'}</div>
            </div>
            <div class="settings-row">
              <div><div class="settings-row-label">${zh ? '姓名' : 'Name'}</div></div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="settings-row-value" id="s-name">—</span>
                <button class="settings-row-action" onclick="showToast('${zh ? 'Demo模式暂不支持修改' : 'Demo mode'}','info')">${zh ? '修改' : 'Edit'}</button>
              </div>
            </div>
            <div class="settings-row">
              <div><div class="settings-row-label">${zh ? '手机号' : 'Phone'}</div></div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="settings-row-value" id="s-phone">—</span>
                <button class="settings-row-action" onclick="showToast('${zh ? 'Demo模式暂不支持修改' : 'Demo mode'}','info')">${zh ? '更换' : 'Change'}</button>
              </div>
            </div>
            <div class="settings-row">
              <div><div class="settings-row-label">${zh ? '邮箱' : 'Email'}</div></div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="settings-row-value" id="s-email">—</span>
                <button class="settings-row-action" onclick="showToast('${zh ? 'Demo模式暂不支持修改' : 'Demo mode'}','info')">${zh ? '绑定' : 'Bind'}</button>
              </div>
            </div>
            <div class="settings-row">
              <div><div class="settings-row-label">${zh ? '注册时间' : 'Joined'}</div></div>
              <span class="settings-row-value" id="s-created">—</span>
            </div>
            <div class="settings-row">
              <div><div class="settings-row-label">${zh ? '已解锁角色' : 'Roles'}</div></div>
              <div id="s-roles" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
            </div>
            <div class="settings-row">
              <div><div class="settings-row-label">${zh ? '已认证主体' : 'Entities'}</div></div>
              <span class="settings-row-value" id="s-entities">—</span>
            </div>
          </div>
        </div>

        <!-- Security Section -->
        <div id="sec-security" class="settings-section" style="display:none;">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-card-title">${t.settings.security}</div>
              <div class="settings-card-desc">${zh ? '保护你的账户安全' : 'Protect your account'}</div>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">${t.settings.changePwd}</div>
                <div style="font-size:11px;color:var(--text-quaternary);margin-top:2px;">${zh ? '定期更换密码，提升安全性' : 'Change regularly for security'}</div>
              </div>
              <button class="settings-row-action" onclick="showToast('${zh ? 'Demo模式：密码修改成功（模拟）' : 'Demo: password changed (simulated)'}','success')">${zh ? '修改' : 'Change'}</button>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">${t.settings.twoFactor}</div>
                <div style="font-size:11px;color:var(--text-quaternary);margin-top:2px;">${zh ? '使用验证器App增强安全' : 'Use authenticator app'}</div>
              </div>
              <button class="toggle-switch" id="toggle-2fa" onclick="toggle2FA()"></button>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">${t.settings.loginAlert}</div>
                <div style="font-size:11px;color:var(--text-quaternary);margin-top:2px;">${zh ? '新设备登录时发送通知' : 'Alert on new device login'}</div>
              </div>
              <button class="toggle-switch on" id="toggle-login-alert" onclick="toggleSwitch('toggle-login-alert')"></button>
            </div>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div id="sec-notif-pref" class="settings-section" style="display:none;">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-card-title">${t.settings.notifications}</div>
              <div class="settings-card-desc">${zh ? '选择你想接收的通知类型' : 'Choose notification types'}</div>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">${t.settings.dealNotif}</div>
                <div style="font-size:11px;color:var(--text-quaternary);margin-top:2px;">${zh ? '项目状态变更、Pipeline进展' : 'Deal status changes, pipeline progress'}</div>
              </div>
              <button class="toggle-switch on" onclick="toggleSwitch(this.id)" id="toggle-deal"></button>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">${t.settings.systemNotif}</div>
                <div style="font-size:11px;color:var(--text-quaternary);margin-top:2px;">${zh ? '系统更新、功能上线通知' : 'System updates, new features'}</div>
              </div>
              <button class="toggle-switch on" onclick="toggleSwitch(this.id)" id="toggle-system"></button>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">${t.settings.emailNotif}</div>
                <div style="font-size:11px;color:var(--text-quaternary);margin-top:2px;">${zh ? '将重要通知同步到邮箱' : 'Send important updates to email'}</div>
              </div>
              <button class="toggle-switch" onclick="toggleSwitch(this.id)" id="toggle-email"></button>
            </div>
          </div>
        </div>

        <!-- Security Log -->
        <div id="sec-sec-log" class="settings-section" style="display:none;">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-card-title">${t.settings.securityLog}</div>
              <div class="settings-card-desc">${zh ? '你的账户安全操作记录' : 'Your account security activity'}</div>
            </div>
            ${demoSecurityLogs.map(log => `
              <div class="security-log-item">
                <div class="security-icon" style="background:${log.color}10;color:${log.color};"><i class="fas ${log.icon}"></i></div>
                <div class="security-info">
                  <div class="security-title">${log.action}</div>
                  <div class="security-meta">${log.detail} · ${log.time} · IP: ${log.ip}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </main>

  ${footerHTML(t)}

  <script>
  (function(){if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return;}
    var u=getUser();
    document.getElementById('s-name').textContent=u.name||'—';
    document.getElementById('s-phone').textContent=u.phone||'${zh ? '未绑定' : 'Not bound'}';
    document.getElementById('s-email').textContent=u.email||'${zh ? '未绑定' : 'Not bound'}';
    document.getElementById('s-created').textContent=u.createdAt||'—';
    var ROLES={initiator:{name:'${zh ? '发起' : 'Originator'}',color:'#3D8F83'},participant:{name:'${zh ? '参与' : 'Participant'}',color:'#32ade6'},organization:{name:'${zh ? '机构' : 'Institution'}',color:'#6366F1'}};
    document.getElementById('s-roles').innerHTML=u.identities.map(function(i){var m=ROLES[i.role]||{name:i.role,color:'#999'};return '<span class="micro-badge" style="background:'+m.color+'12;color:'+m.color+';border:1px solid '+m.color+'20;">'+m.name+'</span>'}).join('')||('"${zh ? '暂无' : 'None'}"');
    document.getElementById('s-entities').textContent=u.entities.length>0?u.entities.map(function(e){return e.entityName}).join(', '):'${zh ? '暂无' : 'None'}';
  })();
  function showSection(id,btn){
    ['profile','security','notif-pref','sec-log'].forEach(function(s){
      var el=document.getElementById('sec-'+s);if(el)el.style.display=s===id?'block':'none';
    });
    document.querySelectorAll('.settings-nav-item').forEach(function(n){n.classList.remove('active')});
    if(btn)btn.classList.add('active');
  }
  function toggleSwitch(id){
    var el=typeof id==='string'?document.getElementById(id):id;
    if(el)el.classList.toggle('on');
  }
  function toggle2FA(){
    var el=document.getElementById('toggle-2fa');el.classList.toggle('on');
    showToast(el.classList.contains('on')?'${zh ? '两步验证已开启（模拟）' : '2FA enabled (simulated)'}':'${zh ? '两步验证已关闭' : '2FA disabled'}',el.classList.contains('on')?'success':'info');
  }
  </script>`

  return shell((zh ? '账户设置 | 身份通' : 'Settings | Identity Connect'), body, lang)
}


// ═══════════════════════════════════════════
// PAGE: 通知中心 (/notifications)
// ═══════════════════════════════════════════
export function notificationsPage(lang: string): string {
  const t = T(lang)
  const zh = t.zh

  const notifsHTML = demoNotifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      ${!n.read ? '<div class="notif-dot"></div>' : '<div style="width:8px;flex-shrink:0;"></div>'}
      <div class="notif-icon" style="background:${n.color}10;"><i class="fas ${n.icon}" style="font-size:14px;color:${n.color};"></i></div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time"><i class="fas fa-clock" style="font-size:8px;margin-right:3px;"></i>${n.time}</div>
      </div>
    </div>
  `).join('')

  const body = `
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <div style="display:flex;align-items:center;gap:12px;">
        ${navBrand('/dashboard' + (lang === 'en' ? '?lang=en' : ''), 'light', zh)}
        <span class="badge badge-brand" style="font-size:10px;margin-left:4px;"><i class="fas fa-bell" style="font-size:9px;"></i>${t.cmd.notifications}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost" style="padding:7px 12px;font-size:12px;"><i class="fas fa-arrow-left" style="font-size:10px;margin-right:4px;"></i>${zh ? '返回操作台' : 'Dashboard'}</a>
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost" style="padding:7px 12px;font-size:12px;">${t.nav.langLabel}</a>
      </div>
    </div>
  </nav>

  <main style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <div class="reveal" style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h1 style="font-size:24px;font-weight:800;color:var(--text-primary);">${t.cmd.notifications}</h1>
          <p style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">${zh ? '你的项目动态和系统消息' : 'Deal updates and system messages'}</p>
        </div>
        <button class="btn-ghost" style="padding:8px 14px;font-size:11px;" onclick="markAllRead()">
          <i class="fas fa-check-double" style="font-size:10px;"></i>${zh ? '全部已读' : 'Read All'}
        </button>
      </div>
    </div>

    <div class="reveal stagger-1">
      <div style="display:flex;gap:6px;margin-bottom:16px;">
        <button class="section-tab active" onclick="filterNotif('all',this)" style="padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid rgba(0,0,0,0.06);background:#fff;color:var(--text-primary);cursor:pointer;">${zh ? '全部' : 'All'} <span style="font-size:10px;color:var(--text-quaternary);">${demoNotifications.length}</span></button>
        <button class="section-tab" onclick="filterNotif('unread',this)" style="padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid rgba(0,0,0,0.06);background:transparent;color:var(--text-tertiary);cursor:pointer;">${zh ? '未读' : 'Unread'} <span style="font-size:10px;color:var(--brand);">${demoNotifications.filter(n => !n.read).length}</span></button>
      </div>
      <div class="notif-list" id="notif-list">
        ${notifsHTML}
      </div>
    </div>
  </main>

  ${footerHTML(t)}

  <script>
  (function(){if(!getToken()||!getUser()){window.location.href='/'+window.location.search}})();
  function markAllRead(){
    document.querySelectorAll('.notif-item.unread').forEach(function(el){el.classList.remove('unread')});
    document.querySelectorAll('.notif-dot').forEach(function(el){el.style.display='none'});
    showToast('${zh ? '全部标记为已读' : 'All marked as read'}','success');
  }
  function filterNotif(type,btn){
    document.querySelectorAll('.notif-list .notif-item').forEach(function(el){
      if(type==='all')el.style.display='flex';
      else el.style.display=el.classList.contains('unread')?'flex':'none';
    });
    btn.parentElement.querySelectorAll('button').forEach(function(b){b.style.background='transparent';b.style.color='var(--text-tertiary)'});
    btn.style.background='#fff';btn.style.color='var(--text-primary)';
  }
  </script>`

  return shell((zh ? '通知中心 | 身份通' : 'Notifications | Identity Connect'), body, lang)
}


// ═══════════════════════════════════════════
// PAGE: 主体认证 (/entity-verify)
// ═══════════════════════════════════════════
export function entityVerifyPage(lang: string): string {
  const t = T(lang)
  const zh = t.zh

  const roleOpts = [
    { value: '法人代表', label: t.entity.roles.legal },
    { value: '财务', label: t.entity.roles.finance },
    { value: '管理员', label: t.entity.roles.admin },
    { value: '其他', label: t.entity.roles.other },
  ]

  const body = `
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <div style="display:flex;align-items:center;gap:12px;">
        ${navBrand('/dashboard' + (lang === 'en' ? '?lang=en' : ''), 'light', zh)}
        <span class="badge badge-brand" style="font-size:10px;margin-left:4px;"><i class="fas fa-id-card" style="font-size:9px;"></i>${zh ? '主体认证' : 'Verify'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost" style="padding:7px 12px;font-size:12px;">${t.nav.langLabel}</a>
        <button onclick="doLogout()" class="btn-ghost" style="padding:7px 12px;font-size:12px;color:var(--error);border-color:rgba(255,55,95,0.12);"><i class="fas fa-sign-out-alt" style="font-size:11px;"></i></button>
      </div>
    </div>
  </nav>

  <main style="max-width:520px;margin:0 auto;padding:32px 20px 0;">
    <div class="reveal" style="margin-bottom:24px;">
      <a href="/dashboard${lang === 'en' ? '?lang=en' : ''}" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--brand-dark);text-decoration:none;font-weight:500;">
        <i class="fas fa-arrow-left" style="font-size:11px;"></i>${t.entity.backToDash}
      </a>
    </div>

    <div class="card reveal stagger-1" style="padding:36px 28px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#e0e7ff,#6366F1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 16px rgba(99,102,241,0.15);">
          <i class="fas fa-building" style="font-size:22px;color:#fff;"></i>
        </div>
        <h1 style="font-size:20px;font-weight:800;color:var(--text-primary);">${t.entity.title}</h1>
        <p style="font-size:13px;color:var(--text-tertiary);margin-top:6px;">${t.entity.subtitle}</p>
      </div>

      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.companyName} <span style="color:var(--error);">*</span></label>
        <input id="ent-name" class="input-field" placeholder="${zh ? '例如: ABC 餐饮连锁' : 'e.g. ABC Restaurant Chain'}">
      </div>
      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.creditCode}</label>
        <input id="ent-code" class="input-field" placeholder="${zh ? '选填' : 'Optional'}">
      </div>
      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${t.entity.yourRole} <span style="color:var(--error);">*</span></label>
        <select id="ent-role" class="input-field" style="appearance:auto;cursor:pointer;">
          ${roleOpts.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:28px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:7px;">${zh ? '上传证明材料' : 'Upload Proof'}</label>
        <div class="upload-zone">
          <i class="fas fa-cloud-upload-alt" style="font-size:24px;color:var(--text-quaternary);margin-bottom:8px;display:block;"></i>
          <p style="font-size:12px;color:var(--text-tertiary);">${zh ? '营业执照 / 授权书等' : 'Business license'}</p>
          <p style="font-size:11px;color:var(--text-quaternary);margin-top:4px;">${zh ? 'Demo 阶段可跳过' : 'Skip for Demo'}</p>
        </div>
      </div>
      <button class="btn-primary" style="width:100%;" onclick="submitEntity()">
        <i class="fas fa-paper-plane" style="font-size:13px;"></i>${t.entity.submit}
      </button>
    </div>

    <div class="reveal stagger-2" style="margin-top:16px;padding:12px 16px;background:rgba(93,196,179,0.03);border:1px solid rgba(93,196,179,0.08);border-radius:12px;">
      <p style="font-size:11px;color:var(--text-tertiary);display:flex;align-items:center;gap:6px;">
        <i class="fas fa-flask" style="color:var(--brand);font-size:10px;"></i>
        ${zh ? 'Demo 阶段提交即通过。' : 'Demo: auto-approve.'}
      </p>
    </div>
  </main>

  ${footerHTML(t)}

  <script>
  (function(){if(!getToken()||!getUser()){window.location.href='/'+window.location.search}})();
  async function submitEntity(){
    var n=document.getElementById('ent-name').value.trim();
    var c=document.getElementById('ent-code').value.trim();
    var r=document.getElementById('ent-role').value;
    if(!n){showToast('${zh ? '请填写公司名称' : 'Enter entity name'}','error');return}
    var res=await api('/api/entity/verify',{method:'POST',body:JSON.stringify({entityName:n,creditCode:c,role:r})});
    if(res.success){
      if(res.user)localStorage.setItem('ic_user',JSON.stringify(res.user));
      showToast('${zh ? '认证成功' : 'Verified!'}','success');
      setTimeout(function(){window.location.href='/dashboard'+window.location.search},800);
    } else showToast(res.message||'${zh ? '提交失败' : 'Failed'}','error');
  }
  </script>`

  return shell((zh ? '主体认证 | 身份通' : 'Entity Verify | Identity Connect'), body, lang)
}
