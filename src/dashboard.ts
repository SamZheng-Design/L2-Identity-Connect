// ═══════════════════════════════════════════════════════
// 身份通 Identity Connect — V12.1 Dashboard (Command Center)
// 可交互Pipeline + Activity Timeline + Deal弹窗 + 数据可视化
// ═══════════════════════════════════════════════════════

import { T, getConnects, LOGO, navBrand, shell, footerHTML, connectSVG, STAGE_META } from './core'

export function dashboardPage(lang: string): string {
  const t = T(lang)
  const zh = t.zh
  const connects = getConnects(zh)

  const roleLabels: Record<string, string> = { shared: zh ? '共用' : 'Shared', borrower: zh ? '融资方' : 'Borrower', investor: zh ? '投资方' : 'Investor', collaborative: zh ? '协同' : 'Collaborative' }
  const roleColors: Record<string, string> = { shared: '#5DC4B3', borrower: '#F59E0B', investor: '#6366F1', collaborative: '#8B5CF6' }

  // 9-connect grid HTML
  const connectsHTML = connects.map(cn => {
    const sl = cn.status === 'live' ? (zh ? '上线' : 'Live') : cn.status === 'beta' ? 'Beta' : (zh ? '即将' : 'Soon')
    const rl = roleLabels[cn.role] || ''
    const rc = roleColors[cn.role] || '#5DC4B3'
    const isCurrent = cn.id === 'identity'
    return `
    <div class="connect-card-v3 ${isCurrent ? 'connect-current' : ''}" data-req='${JSON.stringify(cn.requires)}' data-id="${cn.id}" data-url="${cn.externalUrl}" onclick="clickConnect('${cn.id}','${cn.name}','${cn.externalUrl}')" title="${cn.desc}">
      <div class="connect-card-top">
        <div class="connect-icon-v2">${connectSVG(cn, 48)}</div>
        <div class="connect-card-badges">
          <span class="connect-role-badge" style="background:${rc}14;color:${rc};border:1px solid ${rc}20;">${rl}</span>
          <span class="connect-status status-${cn.status}">${sl}</span>
        </div>
      </div>
      <div class="connect-card-body">
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:3px;">${cn.name}<span class="connect-deal-count" id="cnt-${cn.id}"></span></div>
        <div style="font-size:11px;color:var(--text-tertiary);line-height:1.5;">${cn.desc}</div>
      </div>
      <div class="connect-card-footer">
        ${isCurrent
          ? `<span style="font-size:10px;color:var(--brand-dark);font-weight:600;"><i class="fas fa-check-circle" style="margin-right:3px;font-size:9px;"></i>${zh ? '当前位置' : 'You are here'}</span>`
          : `<span style="font-size:10px;color:var(--text-quaternary);"><i class="fas fa-arrow-right" style="margin-right:3px;font-size:8px;"></i>${zh ? '进入' : 'Enter'}</span>`
        }
      </div>
    </div>`
  }).join('')

  const stagesJSON = JSON.stringify(Object.entries(STAGE_META).map(([k, v]) => ({
    key: k, icon: v.icon, color: v.color, label: (t.stages as any)[k]
  })))

  const body = `
  <nav class="navbar-dark" id="navbar" style="position:sticky;top:0;z-index:100;">
    <div class="nav-inner">
      ${navBrand('/dashboard' + (lang === 'en' ? '?lang=en' : ''), 'dark', zh)}
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="cmd-badge"><i class="fas fa-terminal" style="font-size:9px;"></i>${t.cmd.title}</div>
        <a href="/notifications${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost-dark" style="padding:6px 12px;font-size:11px;position:relative;">
          <i class="fas fa-bell" style="font-size:11px;"></i>
          <span id="notif-dot" style="position:absolute;top:3px;right:8px;width:6px;height:6px;border-radius:50%;background:#ff375f;display:none;"></span>
        </a>
        <a href="/settings${lang === 'en' ? '?lang=en' : ''}" class="btn-ghost-dark" style="padding:6px 12px;font-size:11px;"><i class="fas fa-cog" style="font-size:11px;"></i></a>
        <a href="?lang=${t.nav.langToggle}" class="btn-ghost-dark" style="padding:6px 12px;font-size:11px;">${t.nav.langLabel}</a>
        <button onclick="doLogout()" class="btn-ghost-dark" style="padding:6px 12px;font-size:11px;border-color:rgba(255,55,95,0.20);color:rgba(255,100,130,0.7);">
          <i class="fas fa-sign-out-alt" style="font-size:10px;"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- ===== PROFILE HERO ===== -->
  <div class="profile-hero">
    <div class="orb orb-1" style="width:400px;height:400px;top:-30%;left:-10%;"></div>
    <div class="orb orb-2" style="width:350px;height:350px;bottom:-20%;right:-5%;"></div>
    <div class="profile-hero-inner">
      <div class="profile-top-row">
        <div class="profile-avatar-section">
          <div class="profile-avatar">
            <span class="profile-avatar-letter" id="avatar-letter">?</span>
            <div class="profile-avatar-ring"></div>
          </div>
          <div class="profile-info">
            <h1 class="profile-name" id="greeting">${t.cmd.greeting}</h1>
            <p class="profile-meta" id="sub-greeting">${t.cmd.subtitle}</p>
            <div class="profile-role-tags" id="profile-role-tags"></div>
          </div>
        </div>
        <div class="hero-nav-actions">
          <a href="/entity-verify${lang === 'en' ? '?lang=en' : ''}" class="hero-nav-btn"><i class="fas fa-plus-circle"></i>${t.cmd.addEntity}</a>
          <a href="/settings${lang === 'en' ? '?lang=en' : ''}" class="hero-nav-btn"><i class="fas fa-cog"></i>${t.cmd.settings}</a>
          <a href="/notifications${lang === 'en' ? '?lang=en' : ''}" class="hero-nav-btn"><i class="fas fa-bell"></i>${t.cmd.notifications}</a>
        </div>
      </div>
      <div class="profile-stats-grid" id="stats-row"></div>
    </div>
  </div>

  <!-- ===== DEAL DETAIL MODAL ===== -->
  <div class="modal-overlay" id="deal-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);" id="modal-title"></div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:3px;" id="modal-subtitle"></div>
        </div>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times" style="font-size:14px;"></i></button>
      </div>
      <div class="modal-body">
        <div class="modal-section">
          <div class="modal-section-title">${zh ? '项目信息' : 'Deal Info'}</div>
          <div class="modal-info-grid" id="modal-info"></div>
        </div>
        <div class="modal-section">
          <div class="modal-section-title">${zh ? '跨通进度' : 'Pipeline Progress'}</div>
          <div id="modal-pipeline"></div>
          <div class="pipeline-progress-bar" style="margin-top:12px;"><div class="pipeline-progress-fill" id="modal-progress"></div></div>
        </div>
        <div class="modal-section" id="modal-next-section" style="display:none;">
          <div class="modal-section-title">${zh ? '下一步操作' : 'Next Action'}</div>
          <div class="pipeline-next-action" id="modal-next"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" id="modal-action-btn" onclick="modalAction()">
          <i class="fas fa-external-link-alt" style="font-size:12px;"></i>
          <span id="modal-action-text">${zh ? '前往对应通' : 'Go to Connect'}</span>
        </button>
        <button class="btn-ghost" onclick="closeModal()" style="padding:12px 24px;">${zh ? '关闭' : 'Close'}</button>
      </div>
    </div>
  </div>

  <main class="cmd-main">

    <!-- ===== Quick Actions ===== -->
    <div class="reveal stagger-1">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#b2e8de,#5DC4B3);"><i class="fas fa-bolt" style="font-size:13px;color:#fff;"></i></div>
        <h2 class="section-title">${t.cmd.quickActions}</h2>
      </div>
      <div class="quick-actions-grid" id="quick-actions"></div>
    </div>

    <!-- ===== Pipeline ===== -->
    <div class="reveal stagger-2">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#7DD4C7,#3D8F83);"><i class="fas fa-project-diagram" style="font-size:13px;color:#fff;"></i></div>
        <h2 class="section-title">${t.cmd.pipelineTitle}</h2>
        <div class="section-tabs">
          <button class="section-tab active" onclick="filterPipeline('all',this)">${t.cmd.allDeals}</button>
          <button class="section-tab" onclick="filterPipeline('active',this)">${t.cmd.activeDeals}</button>
          <button class="section-tab" onclick="filterPipeline('completed',this)">${t.cmd.completedDeals}</button>
        </div>
      </div>
      <div id="pipeline-list"></div>
    </div>

    <!-- ===== Activity Timeline V12.1 ===== -->
    <div class="reveal stagger-3">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#c7d2fe,#6366F1);"><i class="fas fa-stream" style="font-size:13px;color:#fff;"></i></div>
        <h2 class="section-title">${t.cmd.activity}</h2>
      </div>
      <div class="timeline-list" id="timeline-list"></div>
    </div>

    <!-- ===== Identity Roles ===== -->
    <div class="reveal stagger-4">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#c7d2fe,#6366F1);"><i class="fas fa-fingerprint" style="font-size:13px;color:#fff;"></i></div>
        <h2 class="section-title">${t.cmd.roleSection}</h2>
        <span style="font-size:11px;color:var(--text-quaternary);margin-left:auto;">${zh ? '角色 = 门票' : 'Role = Ticket'}</span>
      </div>
      <div class="roles-grid" id="role-cards"></div>
    </div>

    <!-- ===== Entities ===== -->
    <div class="reveal stagger-5">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#e0e7ff,#6366F1);"><i class="fas fa-building" style="font-size:13px;color:#fff;"></i></div>
        <h2 class="section-title">${t.cmd.entitySection}</h2>
      </div>
      <div id="entity-list"></div>
    </div>

    <div class="divider"></div>

    <!-- ===== 9 Connect Grid ===== -->
    <div class="reveal stagger-6">
      <div class="section-heading">
        <div class="section-icon" style="background:linear-gradient(135deg,#5DC4B3,#3D8F83);"><i class="fas fa-th" style="font-size:13px;color:#fff;"></i></div>
        <h2 class="section-title">${t.cmd.connectHub}</h2>
        <span style="font-size:11px;color:var(--text-quaternary);margin-left:auto;">${t.cmd.connectHubDesc}</span>
      </div>
      <div class="connects-grid-v3">${connectsHTML}</div>
    </div>
  </main>

  ${footerHTML(t)}

  <script>
  var LANG=getLang();
  var tt=function(z,e){return LANG==='en'?e:z};
  var STAGES=${stagesJSON};
  var STATUS_MAP={draft:tt('草稿','Draft'),pending:tt('审核中','Pending'),live:tt('招募中','Live'),closed:tt('已关闭','Closed'),matched:tt('已匹配','Matched')};
  var STATUS_COLOR={draft:'#86868b',pending:'#3D8F83',live:'#34c759',closed:'#86868b',matched:'#6366F1'};
  var ROLES={
    initiator:{name:tt('发起角色','Originator'),icon:'fa-rocket',desc:tt('发起投资机会，上传经营数据','Originate deals'),tagColor:'#3D8F83',tagBg:'rgba(61,143,131,0.08)'},
    participant:{name:tt('参与角色','Participant'),icon:'fa-search-dollar',desc:tt('浏览、筛选和参与投资机会','Browse deals'),tagColor:'#32ade6',tagBg:'rgba(50,173,230,0.08)'},
    organization:{name:tt('机构身份','Institution'),icon:'fa-building',desc:tt('以机构身份管理投融资','Manage as institution'),tagColor:'#6366F1',tagBg:'rgba(99,102,241,0.08)'}
  };
  // Stage-to-connect mapping for SSO jump
  var STAGE_CONNECT={originate:'application',assess:'assess',risk:'risk',deal:'opportunity',terms:'terms',contract:'contract',settlement:'settlement',performance:'performance'};
  var CONNECT_URLS=${JSON.stringify(Object.fromEntries(connects.map(c => [c.id, c.externalUrl])))};

  var allDeals=[], initCount=0, partCount=0, currentFilter='all', currentModalDeal=null;

  (async function init(){
    if(!getToken()||!getUser()){window.location.href='/'+window.location.search;return}
    var u=getUser();
    document.getElementById('greeting').textContent=tt('你好，','Hello, ')+u.name;
    document.getElementById('sub-greeting').textContent=tt('注册于 ','Since ')+u.createdAt+' · '+tt('管理你的全部投融资流程','Manage all investment flows');
    var al=document.getElementById('avatar-letter');if(al)al.textContent=u.name.charAt(0).toUpperCase();

    // Show notification dot
    document.getElementById('notif-dot').style.display='block';

    try{var r=await api('/api/deals/all');if(r.success){allDeals=r.deals;initCount=r.initiatedCount;partCount=r.participatedCount;}}catch(e){}

    renderProfileTags(u);renderStats(u);renderQuickActions(u);renderPipeline();renderTimeline();renderRoles(u);renderEntities(u);updateConnects(u);updateConnectCounts();
  })();

  function renderProfileTags(user){
    var c=document.getElementById('profile-role-tags');if(!c)return;
    var tags=user.identities.map(function(i){var m=ROLES[i.role];return '<span class="profile-tag" style="background:'+m.tagBg+';color:'+m.tagColor+';border:1px solid '+m.tagColor+'22;"><i class="fas '+m.icon+'" style="font-size:9px;"></i>'+m.name+'</span>';});
    if(!tags.length)tags=['<span class="profile-tag" style="background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"><i class="fas fa-lock" style="font-size:9px;"></i>'+tt('暂无角色','No roles')+'</span>'];
    c.innerHTML=tags.join('');
  }

  function renderStats(user){
    var c=document.getElementById('stats-row');
    var liveDeals=allDeals.filter(function(d){return d.status==='live'}).length;
    var activeStages=0;allDeals.forEach(function(d){if(d.pipeline)d.pipeline.forEach(function(s){if(s.status==='active')activeStages++})});
    var totalAmt=0;allDeals.forEach(function(d){var m=d.amount.replace(/[^0-9.]/g,'');if(m)totalAmt+=parseFloat(m)});
    var items=[
      {label:tt('项目总数','Deals'),value:allDeals.length,icon:'fa-briefcase',color:'#5DC4B3',bg:'rgba(93,196,179,0.12)'},
      {label:tt('招募中','Live'),value:liveDeals,icon:'fa-signal',color:'#34c759',bg:'rgba(52,199,89,0.12)'},
      {label:tt('活跃通道','Active'),value:activeStages,icon:'fa-project-diagram',color:'#6366F1',bg:'rgba(99,102,241,0.12)'},
      {label:tt('总金额(万)','Amount(W)'),value:totalAmt?totalAmt.toLocaleString():'0',icon:'fa-coins',color:'#F59E0B',bg:'rgba(245,158,11,0.12)'},
    ];
    c.innerHTML=items.map(function(s,idx){
      var pct=typeof s.value==='number'?Math.min(100,Math.round((s.value/Math.max(s.value,5))*100)):80;
      return '<div class="stat-ring-card" style="animation:count-up 0.5s '+(idx*0.1)+'s var(--ease-out-expo) both;">'+
        '<div class="stat-ring-visual"><svg viewBox="0 0 60 60" class="stat-ring-svg"><circle class="stat-ring-bg" cx="30" cy="30" r="24"/><circle class="stat-ring-fill" cx="30" cy="30" r="24" style="stroke:'+s.color+';stroke-dashoffset:calc(150.8 - 150.8 * '+pct+' / 100);"/></svg>'+
        '<div class="stat-ring-icon" style="background:'+s.bg+';"><i class="fas '+s.icon+'" style="font-size:14px;color:'+s.color+';"></i></div></div>'+
        '<div class="stat-ring-value" style="color:'+s.color+';">'+s.value+'</div>'+
        '<div class="stat-ring-label">'+s.label+'</div></div>';
    }).join('');
  }

  function renderQuickActions(user){
    var c=document.getElementById('quick-actions');
    var roles=user.identities.map(function(i){return i.role});
    var hasInit=roles.includes('initiator'),hasPart=roles.includes('participant');
    var actions=[];
    if(hasInit)actions.push({icon:'fa-rocket',color:'#F59E0B',bg:'rgba(245,158,11,0.08)',title:tt('发起新机会','Originate Deal'),desc:tt('去发起通上传数据','Upload in Originate'),click:"clickConnect('application','发起通','"+CONNECT_URLS.application+"')"});
    if(hasPart){
      actions.push({icon:'fa-search-dollar',color:'#10B981',bg:'rgba(16,185,129,0.08)',title:tt('浏览投资机会','Browse Deals'),desc:tt('去参与通筛选机会','Filter in Deal Connect'),click:"clickConnect('opportunity','参与通','"+CONNECT_URLS.opportunity+"')"});
      actions.push({icon:'fa-filter',color:'#6366F1',bg:'rgba(99,102,241,0.08)',title:tt('搭建AI筛子','Build AI Sieve'),desc:tt('去评估通自定义标准','Custom criteria'),click:"clickConnect('assess','评估通','"+CONNECT_URLS.assess+"')"});
    }
    if(!hasInit&&!hasPart){
      actions.push({icon:'fa-lock-open',color:'#5DC4B3',bg:'rgba(93,196,179,0.08)',title:tt('解锁发起角色','Unlock Originator'),desc:tt('解锁后可发起融资','Unlock to originate'),click:"unlockRole('initiator')"});
      actions.push({icon:'fa-lock-open',color:'#32ade6',bg:'rgba(50,173,230,0.08)',title:tt('解锁参与角色','Unlock Participant'),desc:tt('解锁后可浏览机会','Unlock to browse'),click:"unlockRole('participant')"});
    }
    actions.push({icon:'fa-plus-circle',color:'#6366F1',bg:'rgba(99,102,241,0.08)',title:tt('认证机构身份','Verify Org'),desc:tt('以机构名义管理机会','Manage as institution'),click:"window.location.href='/entity-verify'+(LANG==='en'?'?lang=en':'')"});
    c.innerHTML=actions.map(function(a){return '<div class="quick-action-card" onclick="'+a.click+'"><div class="qa-icon" style="background:'+a.bg+';"><i class="fas '+a.icon+'" style="font-size:18px;color:'+a.color+';"></i></div><div class="qa-text"><div class="qa-title">'+a.title+'</div><div class="qa-desc">'+a.desc+'</div></div><i class="fas fa-chevron-right qa-arrow"></i></div>';}).join('');
  }

  function filterPipeline(filter,btn){
    currentFilter=filter;
    document.querySelectorAll('.section-tab').forEach(function(t){t.classList.remove('active')});
    if(btn)btn.classList.add('active');
    renderPipeline();
  }

  function renderPipeline(){
    var c=document.getElementById('pipeline-list');
    var filtered=allDeals;
    if(currentFilter==='active')filtered=allDeals.filter(function(d){return d.status!=='closed'&&d.status!=='matched'&&d.status!=='draft'});
    if(currentFilter==='completed')filtered=allDeals.filter(function(d){return d.status==='matched'||d.status==='closed'});
    if(!filtered.length){c.innerHTML='<div class="card" style="padding:48px;text-align:center;"><i class="fas fa-project-diagram" style="font-size:28px;color:var(--text-quaternary);margin-bottom:14px;display:block;"></i><p style="font-size:14px;color:var(--text-secondary);font-weight:600;">'+tt('暂无项目','No deals')+'</p></div>';return}
    c.innerHTML=filtered.map(function(d){
      var sc=STATUS_COLOR[d.status]||'#86868b';var sl=STATUS_MAP[d.status]||d.status;
      var comp=d.pipeline?d.pipeline.filter(function(s){return s.status==='completed'}).length:0;
      var total=d.pipeline?d.pipeline.length:8;var pct=Math.round(comp/total*100);
      var pipeHTML='<div class="pipeline-stages">';
      if(d.pipeline){d.pipeline.forEach(function(stg,idx){
        var si=STAGES.find(function(s){return s.key===stg.stage});if(!si)return;
        var connectId=STAGE_CONNECT[stg.stage]||'';
        pipeHTML+='<div class="pipeline-node stage-'+stg.status+'" title="'+si.label+(stg.updatedAt?' · '+stg.updatedAt:'')+'" onclick="event.stopPropagation();jumpToStage(&quot;'+stg.stage+'&quot;,&quot;'+stg.status+'&quot;,&quot;'+d.id+'&quot;)"><div class="pipeline-dot" style="--dot-color:'+si.color+';"><i class="fas '+si.icon+'" style="font-size:9px;"></i></div><span class="pipeline-label">'+si.label+'</span></div>';
        if(idx<d.pipeline.length-1)pipeHTML+='<div class="pipeline-line stage-'+stg.status+'"></div>';
      })}
      pipeHTML+='</div>';
      return '<div class="pipeline-card" onclick="openDealModal(&quot;'+d.id+'&quot;)">'+
        '<div class="pipeline-card-header"><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;"><span style="font-size:14px;font-weight:700;color:var(--text-primary);">'+d.title+'</span><span class="deal-status-pill" style="background:'+sc+'14;color:'+sc+';border:1px solid '+sc+'22;"><span class="deal-status-dot" style="background:'+sc+';'+(d.status==='live'?'animation:pulse-dot 2s infinite;':'')+'"></span>'+sl+'</span></div>'+
        '<div style="display:flex;align-items:center;gap:12px;font-size:11px;color:var(--text-tertiary);"><span><i class="fas fa-store" style="margin-right:3px;font-size:9px;"></i>'+d.entityName+'</span><span><i class="fas fa-coins" style="margin-right:3px;font-size:9px;"></i>'+d.amount+'</span><span><i class="fas fa-clock" style="margin-right:3px;font-size:9px;"></i>'+d.period+'</span></div></div>'+
        '<div style="text-align:right;flex-shrink:0;"><div style="font-size:20px;font-weight:800;color:var(--brand-dark);">'+pct+'%</div><div style="font-size:10px;color:var(--text-quaternary);">'+comp+'/'+total+' '+tt('阶段','stages')+'</div></div></div>'+
        pipeHTML+
        '<div class="pipeline-progress-bar"><div class="pipeline-progress-fill" style="width:'+pct+'%;"></div></div>'+
        (d.nextAction?'<div class="pipeline-next-action"><i class="fas fa-arrow-circle-right" style="font-size:11px;color:var(--brand);"></i><span>'+d.nextAction+'</span></div>':'')+
      '</div>';
    }).join('');
  }

  // V12.1 Activity Timeline
  function renderTimeline(){
    var c=document.getElementById('timeline-list');
    var events=[];
    allDeals.forEach(function(d){
      if(d.pipeline)d.pipeline.forEach(function(stg){
        if(stg.updatedAt&&stg.status!=='pending'){
          events.push({deal:d.title,stage:stg.stage,status:stg.status,date:stg.updatedAt,dealId:d.id});
        }
      });
    });
    events.sort(function(a,b){return b.date.localeCompare(a.date)});
    events=events.slice(0,8);
    if(!events.length){c.innerHTML='<div class="card" style="padding:32px;text-align:center;"><p style="font-size:13px;color:var(--text-tertiary);">'+tt('暂无动态','No activity')+'</p></div>';return}
    c.innerHTML=events.map(function(ev){
      var si=STAGES.find(function(s){return s.key===ev.stage});
      var stgLabel=si?si.label:ev.stage;
      var dotClass=ev.status==='completed'?'timeline-dot-completed':ev.status==='active'?'timeline-dot-active':'timeline-dot-pending';
      var statusText=ev.status==='completed'?tt('已完成','Completed'):ev.status==='active'?tt('进行中','In Progress'):tt('待处理','Pending');
      var tagBg=ev.status==='completed'?'rgba(52,199,89,0.06)':ev.status==='active'?'rgba(93,196,179,0.06)':'rgba(0,0,0,0.03)';
      var tagColor=ev.status==='completed'?'#16a34a':ev.status==='active'?'var(--brand-dark)':'var(--text-quaternary)';
      return '<div class="timeline-item" onclick="openDealModal(&quot;'+ev.dealId+'&quot;)" style="cursor:pointer;">'+
        '<div class="timeline-dot '+dotClass+'"></div>'+
        '<div class="timeline-header"><span class="timeline-title">'+ev.deal+'</span><span class="timeline-time">'+ev.date+'</span></div>'+
        '<div class="timeline-desc"><i class="fas '+(si?si.icon:'fa-circle')+'" style="margin-right:4px;font-size:9px;color:'+(si?si.color:'#999')+';"></i>'+stgLabel+'</div>'+
        '<div class="timeline-tags"><span class="timeline-tag" style="background:'+tagBg+';color:'+tagColor+';border:1px solid '+tagColor+'15;">'+statusText+'</span></div>'+
      '</div>';
    }).join('');
  }

  // Deal modal
  function openDealModal(dealId){
    var d=allDeals.find(function(x){return x.id===dealId});if(!d)return;
    currentModalDeal=d;
    document.getElementById('modal-title').textContent=d.title;
    document.getElementById('modal-subtitle').textContent=d.entityName+' · '+d.industry;
    var sc=STATUS_COLOR[d.status]||'#86868b';var sl=STATUS_MAP[d.status]||d.status;
    document.getElementById('modal-info').innerHTML=[
      {l:tt('金额','Amount'),v:d.amount},{l:tt('周期','Period'),v:d.period},
      {l:tt('状态','Status'),v:'<span style="color:'+sc+';font-weight:700;">'+sl+'</span>'},{l:tt('创建时间','Created'),v:d.createdAt},
    ].map(function(it){return '<div class="modal-info-item"><div class="modal-info-label">'+it.l+'</div><div class="modal-info-value">'+it.v+'</div></div>'}).join('');
    // Pipeline in modal
    var comp=0,activeStage='';
    var ph='<div class="pipeline-stages" style="justify-content:center;">';
    if(d.pipeline)d.pipeline.forEach(function(stg,idx){
      var si=STAGES.find(function(s){return s.key===stg.stage});if(!si)return;
      if(stg.status==='completed')comp++;if(stg.status==='active')activeStage=stg.stage;
      ph+='<div class="pipeline-node stage-'+stg.status+'"><div class="pipeline-dot"><i class="fas '+si.icon+'" style="font-size:9px;"></i></div><span class="pipeline-label">'+si.label+'</span></div>';
      if(idx<d.pipeline.length-1)ph+='<div class="pipeline-line stage-'+stg.status+'"></div>';
    });
    ph+='</div>';
    document.getElementById('modal-pipeline').innerHTML=ph;
    var pct=Math.round(comp/(d.pipeline?d.pipeline.length:8)*100);
    document.getElementById('modal-progress').style.width=pct+'%';
    if(d.nextAction){document.getElementById('modal-next-section').style.display='block';document.getElementById('modal-next').innerHTML='<i class="fas fa-arrow-circle-right" style="font-size:11px;color:var(--brand);"></i><span>'+d.nextAction+'</span>';}
    else{document.getElementById('modal-next-section').style.display='none';}
    // Action button targets active stage connect
    if(activeStage&&STAGE_CONNECT[activeStage]){
      var cId=STAGE_CONNECT[activeStage];var cUrl=CONNECT_URLS[cId]||'';
      var cName=STAGES.find(function(s){return s.key===activeStage});
      document.getElementById('modal-action-text').textContent=tt('前往','Go to ')+(cName?cName.label+'通':activeStage);
      document.getElementById('modal-action-btn').onclick=function(){clickConnect(cId,cName?cName.label:'',cUrl)};
    }
    document.getElementById('deal-modal').classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeModal(){document.getElementById('deal-modal').classList.remove('show');document.body.style.overflow='';currentModalDeal=null;}
  function modalAction(){if(currentModalDeal)closeModal();}
  document.getElementById('deal-modal').addEventListener('click',function(e){if(e.target===this)closeModal()});

  // Jump to stage connect
  function jumpToStage(stage,status,dealId){
    if(status==='pending'){showToast(tt('该阶段尚未开始','Stage not started yet'),'info');return;}
    var cId=STAGE_CONNECT[stage];if(!cId)return;
    var cUrl=CONNECT_URLS[cId]||'';
    var si=STAGES.find(function(s){return s.key===stage});
    clickConnect(cId,si?si.label+'通':stage,cUrl);
  }

  function renderRoles(user){
    var c=document.getElementById('role-cards');
    var allRoles=['initiator','participant','organization'];
    c.innerHTML=allRoles.map(function(role){
      var m=ROLES[role];var id=user.identities.find(function(i){return i.role===role});var ok=!!id;
      return '<div class="role-card-v3 '+(ok?'role-active':'role-locked')+'"><div class="role-card-icon" style="background:'+(ok?m.tagBg:'rgba(0,0,0,0.03)')+';"><i class="fas '+m.icon+'" style="font-size:18px;color:'+(ok?m.tagColor:'var(--text-quaternary)')+';"></i></div>'+
        '<div class="role-card-info"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="font-size:14px;font-weight:700;color:var(--text-primary);">'+m.name+'</span>'+(ok?'<span class="micro-badge" style="background:rgba(52,199,89,0.08);color:#22c55e;"><i class="fas fa-check-circle" style="font-size:8px;"></i>'+tt('已解锁','Active')+'</span>':'<span class="micro-badge" style="background:rgba(0,0,0,0.03);color:var(--text-quaternary);"><i class="fas fa-lock" style="font-size:8px;"></i>'+tt('未解锁','Locked')+'</span>')+'</div><div style="font-size:12px;color:var(--text-tertiary);">'+m.desc+'</div></div>'+
        (!ok?'<button class="role-unlock-btn" onclick="event.stopPropagation();unlockRole(&quot;'+role+'&quot;)"><i class="fas fa-lock-open" style="font-size:10px;"></i></button>':'')+
      '</div>';
    }).join('');
  }

  function renderEntities(user){
    var c=document.getElementById('entity-list');var lq=LANG==='en'?'?lang=en':'';
    if(!user.entities||!user.entities.length){c.innerHTML='<div class="card" style="padding:40px;text-align:center;"><i class="fas fa-building" style="font-size:24px;color:var(--text-quaternary);margin-bottom:12px;display:block;"></i><p style="font-size:13px;color:var(--text-secondary);font-weight:600;">'+tt('暂无已认证主体','No verified entities')+'</p><p style="font-size:11px;color:var(--text-quaternary);margin-top:4px;margin-bottom:16px;">'+tt('认证主体后可发起融资','Verify to originate')+'</p><a href="/entity-verify'+lq+'" class="btn-primary" style="padding:10px 20px;font-size:13px;display:inline-flex;"><i class="fas fa-plus-circle" style="font-size:11px;"></i>'+tt('认证新主体','Verify Entity')+'</a></div>';return}
    c.innerHTML=user.entities.map(function(e){
      var rd=allDeals.filter(function(d){return d.entityName===e.entityName});var lc=rd.filter(function(d){return d.status==='live'}).length;
      return '<div class="entity-card-v2"><div class="entity-card-left"><div class="entity-card-icon"><i class="fas fa-store" style="font-size:16px;color:#6366f1;"></i><span class="entity-verified-badge"><i class="fas fa-check" style="font-size:7px;color:#fff;"></i></span></div><div class="entity-card-info"><div class="entity-card-name">'+e.entityName+'</div><div class="entity-card-meta"><span><i class="fas fa-user-tag" style="margin-right:3px;font-size:9px;"></i>'+e.role+'</span><span class="entity-meta-dot"></span><span>'+e.verifiedAt+'</span></div><div class="entity-card-tags">'+(rd.length>0?'<span class="entity-mini-tag"><i class="fas fa-briefcase" style="font-size:8px;"></i>'+rd.length+tt(' 个机会',' deals')+'</span>':'')+(lc>0?'<span class="entity-mini-tag entity-mini-tag-live"><i class="fas fa-signal" style="font-size:8px;"></i>'+lc+tt(' 招募中',' live')+'</span>':'')+'<span class="entity-mini-tag entity-mini-tag-verified"><i class="fas fa-shield-alt" style="font-size:8px;"></i>'+tt('已认证','Verified')+'</span></div></div></div><button class="entity-enter-btn" onclick="showToast(&quot;'+tt('协作空间开发中','Workspace coming soon')+'&quot;,&quot;info&quot;)"><i class="fas fa-arrow-right" style="font-size:11px;"></i></button></div>';
    }).join('');
  }

  function updateConnects(user){
    var roles=user.identities.map(function(i){return i.role});var isOrg=roles.includes('organization');
    document.querySelectorAll('.connect-card-v3').forEach(function(el){
      var req=JSON.parse(el.getAttribute('data-req'));var id=el.getAttribute('data-id');
      var ok=id==='identity'||isOrg||req.length===0||req.some(function(r){return roles.includes(r)});
      el.classList.toggle('disabled',!ok);
    });
  }

  function updateConnectCounts(){
    // Count active pipeline stages per connect
    var counts={};
    allDeals.forEach(function(d){if(d.pipeline)d.pipeline.forEach(function(stg){
      if(stg.status==='active'||stg.status==='completed'){var cId=STAGE_CONNECT[stg.stage];if(cId){counts[cId]=(counts[cId]||0)+1;}}
    })});
    Object.keys(counts).forEach(function(cId){
      var el=document.getElementById('cnt-'+cId);if(el)el.textContent=counts[cId];
    });
  }

  async function unlockRole(role){
    var r=await api('/api/user/unlock',{method:'POST',body:JSON.stringify({role:role})});
    if(r.success){var u=getUser();u.identities.push(r.identity);localStorage.setItem('ic_user',JSON.stringify(u));showToast(tt('角色解锁成功','Role unlocked!'),'success');renderProfileTags(u);renderStats(u);renderQuickActions(u);renderRoles(u);updateConnects(u);}
    else showToast(r.message,'error');
  }

  function clickConnect(id,name,url){
    if(id==='identity'){showToast(tt('你已在身份通','You are in Identity Connect'),'info');return}
    var el=document.querySelector('[data-id="'+id+'"]');
    if(el&&el.classList.contains('disabled')){showToast(tt('需先解锁对应角色','Unlock required role first'),'error');return}
    // V12.1 真正的SSO跳转
    if(url){
      showToast(tt('正在通过 SSO 跳转到'+name+'...','SSO redirect to '+name+'...'),'info');
      api('/api/auth/sso-token',{method:'POST'}).then(function(r){
        if(r.success){
          var sep=url.indexOf('?')>=0?'&':'?';
          setTimeout(function(){window.open(url+sep+'sso='+r.ssoToken,'_blank')},600);
        }
      }).catch(function(){window.open(url,'_blank')});
    } else {
      showToast(tt('正在跳转到'+name+'...','Redirecting to '+name+'...'),'info');
    }
  }
  </script>`

  return shell((zh ? '主操作台 | 身份通' : 'Command Center | Identity Connect'), body, lang)
}
