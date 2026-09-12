(function(){(()=>{if(window.__nightModeInjected)return;window.__nightModeInjected=!0;const i={enabled:!1,mode:"invert",brightness:90,temperature:50},r="night-mode-style",d="night-mode-overlay";let o={...i};function c(){return location.hostname}function l(){const t=o.temperature;let e="invert(1) hue-rotate(180deg)";if(t>50){const n=(t-50)/50*.35;e+=` sepia(${n.toFixed(3)})`}else if(t<50){const n=(50-t)/50;e+=` hue-rotate(${(-n*15).toFixed(2)}deg)`,e+=` saturate(${(1+n*.2).toFixed(3)})`}return e+=` brightness(${(o.brightness/100).toFixed(3)})`,e}function h(){const t=o.temperature,e=Math.max(0,t-50)/50,n=Math.max(0,50-t)/50,v=Math.round(8+e*24),g=Math.round(8+e*8+n*4),f=Math.round(10+n*26),p=Math.min(.88,(100-o.brightness)/100*.95+.08);return`rgba(${v}, ${g}, ${f}, ${p.toFixed(3)})`}function s(){var t,e;(t=document.getElementById(r))==null||t.remove(),(e=document.getElementById(d))==null||e.remove(),document.documentElement.classList.remove("night-mode-invert"),document.documentElement.classList.remove("night-mode-dim")}function a(){const t=document.createElement("style");t.id=r,t.textContent=`
      html.night-mode-invert {
        filter: ${l()} !important;
        background: #ffffff !important;
      }

      /*
       * Compensate media elements because the parent
       * html element is inverted.
       */
      html.night-mode-invert img,
      html.night-mode-invert video,
      html.night-mode-invert canvas,
      html.night-mode-invert iframe,
      html.night-mode-invert svg,
      html.night-mode-invert picture {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      /*
       * Don't destroy common browser-like UI elements.
       */
      html.night-mode-invert input,
      html.night-mode-invert textarea,
      html.night-mode-invert select,
      html.night-mode-invert button {
        color-scheme: dark;
      }
    `,(document.head||document.documentElement).appendChild(t),document.documentElement.classList.add("night-mode-invert")}function u(){const t=document.createElement("div");t.id=d,Object.assign(t.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",zIndex:"2147483647",pointerEvents:"none",background:h()}),(document.body||document.documentElement).appendChild(t),document.documentElement.classList.add("night-mode-dim")}function m(){s(),o.enabled&&(o.mode==="invert"?a():o.mode==="dim"&&u())}try{chrome.storage.local.get("sites",t=>{var n;const e=(n=t==null?void 0:t.sites)==null?void 0:n[c()];e&&(o={...i,...e},m())})}catch(t){console.error("[NightMode] Storage error:",t)}chrome.runtime.onMessage.addListener((t,e,n)=>(t==null?void 0:t.type)==="nm:ping"?(n({ok:!0}),!1):((t==null?void 0:t.type)==="nm:update"&&(o={...i,...t.state||{}},m(),n({ok:!0})),!1))})();
})()
