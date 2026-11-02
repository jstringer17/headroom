// The phone action bar (Call, Text, Free estimate) and the script that hides it while the keyboard is open.
// Each look styles it itself: .mbar (classic and cinematic) or .ed-mbar (editorial).
export function mobileBarHtml(d, esc, cls, askLabel) {
  const tel = d.phone && d.phone.tel ? esc(d.phone.tel) : "";
  const short = /price/i.test(askLabel) ? "Get a price" : "Free estimate";
  return `<nav class="${cls}" aria-label="Quick actions">${tel ? `<a class="${cls}-a call" href="tel:${tel}">Call</a><a class="${cls}-a text" href="sms:${tel}">Text</a>` : ""}<a class="${cls}-a go" href="#contact" data-bar-ask>${short}</a></nav>`;
}
// Hide the bar while a text field has focus or the on-screen keyboard shrinks the page.
export const ACTIONS_JS = `(function(){var r=document.documentElement,fld=function(t){return t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)&&!/^(range|checkbox|radio|button|submit)$/.test(t.type||"")};
function f(e){if(fld(e.target))r.classList.toggle("kbd",e.type==="focusin")}
document.addEventListener("focusin",f);document.addEventListener("focusout",f);
if(window.visualViewport)visualViewport.addEventListener("resize",function(){r.classList.toggle("kbd",visualViewport.height<innerHeight*0.75)})})();`;
