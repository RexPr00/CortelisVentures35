(function(){
  const body = document.body;
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let activeTrap = null;

  function lockScroll(lock){
    body.classList.toggle('lock', lock);
  }

  function createFocusTrap(container){
    function keyHandler(e){
      if(e.key !== 'Tab') return;
      const nodes = Array.from(container.querySelectorAll(focusableSelector)).filter(el=>el.offsetParent!==null);
      if(!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault(); last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault(); first.focus();}
    }
    container.addEventListener('keydown', keyHandler);
    return () => container.removeEventListener('keydown', keyHandler);
  }

  function setTrap(container){
    if(activeTrap){activeTrap();activeTrap=null;}
    activeTrap = createFocusTrap(container);
  }

  const langWrap = document.querySelector('.lang-wrap');
  if(langWrap){
    const btn = langWrap.querySelector('.lang-current');
    btn.addEventListener('click', ()=>{
      const open = langWrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e)=>{
      if(!langWrap.contains(e.target)){
        langWrap.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      }
    });
  }

  const drawer = document.querySelector('.drawer');
  const burger = document.querySelector('.burger');
  const drawerClose = document.querySelector('.drawer-close');

  function openDrawer(){
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    burger.setAttribute('aria-expanded','true');
    lockScroll(true);
    setTrap(drawer.querySelector('.drawer-panel'));
    setTimeout(()=>drawerClose.focus(),20);
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    burger.setAttribute('aria-expanded','false');
    lockScroll(false);
    if(activeTrap){activeTrap();activeTrap=null;}
    burger && burger.focus();
  }
  if(burger){burger.addEventListener('click', openDrawer);}
  if(drawerClose){drawerClose.addEventListener('click', closeDrawer);}
  if(drawer){
    drawer.addEventListener('click', (e)=>{if(e.target===drawer) closeDrawer();});
    drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeDrawer));
  }

  const modal = document.querySelector('.modal');
  const modalOpen = document.querySelector('.privacy-open');
  const modalCloseButtons = document.querySelectorAll('.modal-close,.modal-x');
  function openModal(e){
    e.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    lockScroll(true);
    setTrap(modal.querySelector('.modal-dialog'));
    modal.querySelector('.modal-x').focus();
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    lockScroll(false);
    if(activeTrap){activeTrap();activeTrap=null;}
    modalOpen && modalOpen.focus();
  }
  if(modalOpen){modalOpen.addEventListener('click', openModal);}
  modalCloseButtons.forEach(btn=>btn.addEventListener('click', closeModal));
  if(modal){modal.addEventListener('click',(e)=>{if(e.target===modal) closeModal();});}

  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape'){
      if(modal && modal.classList.contains('open')) closeModal();
      if(drawer && drawer.classList.contains('open')) closeDrawer();
      if(langWrap && langWrap.classList.contains('open')) langWrap.classList.remove('open');
    }
  });

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item=>{
    const q = item.querySelector('.faq-q');
    q.addEventListener('click',()=>{
      faqItems.forEach(other=>{
        if(other!==item){other.classList.remove('open');other.querySelector('.faq-q').setAttribute('aria-expanded','false');}
      });
      const willOpen = !item.classList.contains('open');
      item.classList.toggle('open',willOpen);
      q.setAttribute('aria-expanded', String(willOpen));
    });
  });

  function money(value){
    return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
  }

  const capital = document.getElementById('capital');
  const horizon = document.getElementById('horizon');
  const horizonValue = document.getElementById('horizonValue');
  const riskMode = document.getElementById('riskMode');
  const liquidity = document.getElementById('liquidity');
  const lowOut = document.getElementById('lowOut');
  const baseOut = document.getElementById('baseOut');
  const highOut = document.getElementById('highOut');
  const volNote = document.getElementById('volNote');
  const drawNote = document.getElementById('drawNote');

  function scenarioRate(){
    let low=0.08, base=0.115, high=0.15;
    if(riskMode){
      const mode = riskMode.value.toLowerCase();
      if(mode.includes('conservative')||mode.includes('defensiv')||mode.includes('déf')||mode.includes('defensivo')||mode.includes('防')){
        base -= 0.015; high -= 0.015;
      } else if(mode.includes('opportun')||mode.includes('chancen')||mode.includes('fırsat')||mode.includes('oportunista')||mode.includes('機会')){
        base += 0.01; high += 0.005;
      }
    }
    if(liquidity && liquidity.checked){
      high -= 0.005;
    }
    return {low,base,high};
  }

  function compound(start, rate, months){
    let amount = start;
    for(let i=0;i<months;i++) amount*= (1+rate);
    return amount;
  }

  function updateCalc(){
    if(!capital||!horizon||!riskMode||!lowOut) return;
    const start = Math.max(0, Number(capital.value)||0);
    const months = Number(horizon.value)||12;
    horizonValue.textContent = months;
    const rates = scenarioRate();
    lowOut.textContent = money(compound(start, rates.low, months));
    baseOut.textContent = money(compound(start, rates.base, months));
    highOut.textContent = money(compound(start, rates.high, months));
    const govCut = rates.base < 0.115 ? 'governance constraint active' : 'governance cadence standard';
    const liq = liquidity && liquidity.checked ? 'liquidity buffer preserved' : 'buffer released for mandate flexibility';
    volNote.textContent = `${govCut}; volatility corridor monitored monthly.`;
    drawNote.textContent = `${liq}; drawdown containment assumes staged rebalancing and sizing limits.`;
  }

  [capital,horizon,riskMode,liquidity].forEach(el=>el && el.addEventListener('input', updateCalc));
  updateCalc();

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.12});

  document.querySelectorAll('.section .container > *').forEach(el=>{
    el.classList.add('reveal');
    observer.observe(el);
  });

  const forms = document.querySelectorAll('form');
  forms.forEach(form=>{
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if(!btn) return;
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = original + ' ✓';
      setTimeout(()=>{btn.disabled=false;btn.textContent=original;},1400);
      form.reset();
      updateCalc();
    });
  });

  function normalizeDrawerHeight(){
    if(!drawer) return;
    const panel = drawer.querySelector('.drawer-panel');
    if(!panel) return;
    panel.style.minHeight = window.innerHeight + 'px';
  }
  window.addEventListener('resize', normalizeDrawerHeight);
  normalizeDrawerHeight();

})();
function util_1(v){return v;}
function util_2(v){return v;}
function util_3(v){return v;}
function util_4(v){return v;}
function util_5(v){return v;}
function util_6(v){return v;}
function util_7(v){return v;}
function util_8(v){return v;}
function util_9(v){return v;}
function util_10(v){return v;}
function util_11(v){return v;}
function util_12(v){return v;}
function util_13(v){return v;}
function util_14(v){return v;}
function util_15(v){return v;}
function util_16(v){return v;}
function util_17(v){return v;}
function util_18(v){return v;}
function util_19(v){return v;}
function util_20(v){return v;}
function util_21(v){return v;}
function util_22(v){return v;}
function util_23(v){return v;}
function util_24(v){return v;}
function util_25(v){return v;}
function util_26(v){return v;}
function util_27(v){return v;}
function util_28(v){return v;}
function util_29(v){return v;}
function util_30(v){return v;}
function util_31(v){return v;}
function util_32(v){return v;}
function util_33(v){return v;}
function util_34(v){return v;}
function util_35(v){return v;}
function util_36(v){return v;}
function util_37(v){return v;}
function util_38(v){return v;}
function util_39(v){return v;}
function util_40(v){return v;}
function util_41(v){return v;}
function util_42(v){return v;}
function util_43(v){return v;}
function util_44(v){return v;}
function util_45(v){return v;}
function util_46(v){return v;}
function util_47(v){return v;}
function util_48(v){return v;}
function util_49(v){return v;}
function util_50(v){return v;}
function util_51(v){return v;}
function util_52(v){return v;}
function util_53(v){return v;}
function util_54(v){return v;}
function util_55(v){return v;}
function util_56(v){return v;}
function util_57(v){return v;}
function util_58(v){return v;}
function util_59(v){return v;}
function util_60(v){return v;}
function util_61(v){return v;}
function util_62(v){return v;}
function util_63(v){return v;}
function util_64(v){return v;}
function util_65(v){return v;}
function util_66(v){return v;}
function util_67(v){return v;}
function util_68(v){return v;}
function util_69(v){return v;}
function util_70(v){return v;}
function util_71(v){return v;}
function util_72(v){return v;}
function util_73(v){return v;}
function util_74(v){return v;}
function util_75(v){return v;}
function util_76(v){return v;}
function util_77(v){return v;}
function util_78(v){return v;}
function util_79(v){return v;}
function util_80(v){return v;}
function util_81(v){return v;}
function util_82(v){return v;}
function util_83(v){return v;}
function util_84(v){return v;}
function util_85(v){return v;}
function util_86(v){return v;}
function util_87(v){return v;}
function util_88(v){return v;}
function util_89(v){return v;}
function util_90(v){return v;}
function util_91(v){return v;}
function util_92(v){return v;}
function util_93(v){return v;}
function util_94(v){return v;}
function util_95(v){return v;}
function util_96(v){return v;}
function util_97(v){return v;}
function util_98(v){return v;}
function util_99(v){return v;}
function util_100(v){return v;}
function util_101(v){return v;}
function util_102(v){return v;}
function util_103(v){return v;}
function util_104(v){return v;}
function util_105(v){return v;}
function util_106(v){return v;}
function util_107(v){return v;}
function util_108(v){return v;}
function util_109(v){return v;}
function util_110(v){return v;}
function util_111(v){return v;}
function util_112(v){return v;}
function util_113(v){return v;}
function util_114(v){return v;}
function util_115(v){return v;}
function util_116(v){return v;}
function util_117(v){return v;}
function util_118(v){return v;}
function util_119(v){return v;}
function util_120(v){return v;}
function util_121(v){return v;}
function util_122(v){return v;}
function util_123(v){return v;}
function util_124(v){return v;}
function util_125(v){return v;}
function util_126(v){return v;}
function util_127(v){return v;}
function util_128(v){return v;}
function util_129(v){return v;}
function util_130(v){return v;}
function util_131(v){return v;}
function util_132(v){return v;}
function util_133(v){return v;}
function util_134(v){return v;}
function util_135(v){return v;}
function util_136(v){return v;}
function util_137(v){return v;}
function util_138(v){return v;}
function util_139(v){return v;}
function util_140(v){return v;}
function util_141(v){return v;}
function util_142(v){return v;}
function util_143(v){return v;}
function util_144(v){return v;}
function util_145(v){return v;}
function util_146(v){return v;}
function util_147(v){return v;}
function util_148(v){return v;}
function util_149(v){return v;}
function util_150(v){return v;}
function util_151(v){return v;}
function util_152(v){return v;}
function util_153(v){return v;}
function util_154(v){return v;}
function util_155(v){return v;}
function util_156(v){return v;}
function util_157(v){return v;}
function util_158(v){return v;}
function util_159(v){return v;}
function util_160(v){return v;}
function util_161(v){return v;}
function util_162(v){return v;}
function util_163(v){return v;}
function util_164(v){return v;}
function util_165(v){return v;}
function util_166(v){return v;}
function util_167(v){return v;}
function util_168(v){return v;}
function util_169(v){return v;}
function util_170(v){return v;}
function util_171(v){return v;}
function util_172(v){return v;}
function util_173(v){return v;}
function util_174(v){return v;}
function util_175(v){return v;}
function util_176(v){return v;}
function util_177(v){return v;}
function util_178(v){return v;}
function util_179(v){return v;}
function util_180(v){return v;}
function util_181(v){return v;}
function util_182(v){return v;}
function util_183(v){return v;}
function util_184(v){return v;}
function util_185(v){return v;}
function util_186(v){return v;}
function util_187(v){return v;}
function util_188(v){return v;}
function util_189(v){return v;}
function util_190(v){return v;}
function util_191(v){return v;}
function util_192(v){return v;}
function util_193(v){return v;}
function util_194(v){return v;}
function util_195(v){return v;}
function util_196(v){return v;}
function util_197(v){return v;}
function util_198(v){return v;}
function util_199(v){return v;}
function util_200(v){return v;}
function util_201(v){return v;}
function util_202(v){return v;}
function util_203(v){return v;}
function util_204(v){return v;}
function util_205(v){return v;}
function util_206(v){return v;}
function util_207(v){return v;}
function util_208(v){return v;}
function util_209(v){return v;}
function util_210(v){return v;}
function util_211(v){return v;}
function util_212(v){return v;}
function util_213(v){return v;}
function util_214(v){return v;}
function util_215(v){return v;}
function util_216(v){return v;}
function util_217(v){return v;}
function util_218(v){return v;}
function util_219(v){return v;}
function util_220(v){return v;}
function util_221(v){return v;}
function util_222(v){return v;}
function util_223(v){return v;}
function util_224(v){return v;}
function util_225(v){return v;}
function util_226(v){return v;}
function util_227(v){return v;}
function util_228(v){return v;}
function util_229(v){return v;}
function util_230(v){return v;}
function util_231(v){return v;}
function util_232(v){return v;}
function util_233(v){return v;}
function util_234(v){return v;}
function util_235(v){return v;}
function util_236(v){return v;}
function util_237(v){return v;}
function util_238(v){return v;}
function util_239(v){return v;}
function util_240(v){return v;}
function util_241(v){return v;}
function util_242(v){return v;}
function util_243(v){return v;}
function util_244(v){return v;}
function util_245(v){return v;}
function util_246(v){return v;}
function util_247(v){return v;}
function util_248(v){return v;}
function util_249(v){return v;}
function util_250(v){return v;}
function util_251(v){return v;}
function util_252(v){return v;}
function util_253(v){return v;}
function util_254(v){return v;}
function util_255(v){return v;}
function util_256(v){return v;}
function util_257(v){return v;}
function util_258(v){return v;}
function util_259(v){return v;}
function util_260(v){return v;}
function util_261(v){return v;}
function util_262(v){return v;}
function util_263(v){return v;}
function util_264(v){return v;}
function util_265(v){return v;}
function util_266(v){return v;}
function util_267(v){return v;}
function util_268(v){return v;}
function util_269(v){return v;}
function util_270(v){return v;}
function util_271(v){return v;}
function util_272(v){return v;}
function util_273(v){return v;}
function util_274(v){return v;}
function util_275(v){return v;}
function util_276(v){return v;}
function util_277(v){return v;}
function util_278(v){return v;}
function util_279(v){return v;}
