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
if(window.visualViewport)visualViewport.addEventListener("resize",function(){r.classList.toggle("kbd",visualViewport.height<innerHeight*0.75)});
/* the bar steps aside while the contact form is on screen, so it never sits on a field */
var cf=document.getElementById("ask");if(cf&&"IntersectionObserver" in window)new IntersectionObserver(function(es){r.classList.toggle("nearform",es[0].isIntersecting)},{rootMargin:"0px 0px -15% 0px"}).observe(cf);
/* keyboard users never land on content that is still faded out by a scroll reveal */
document.addEventListener("focusin",function(e){var t=e.target.closest&&e.target.closest(".rv,.ed-rv");if(t)t.classList.add("in")});
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".pb-more button");if(!b)return;var u=b.closest("ul");u.classList.add("pb-open");[].forEach.call(u.querySelectorAll(".pb-x"),function(x){x.classList.add("in")});b.parentNode.parentNode.removeChild(b.parentNode);u.setAttribute("tabindex","-1");u.focus({preventScroll:true})})})();
`;
// Shared rule for the "+N more" proof badges (each look styles the chips themselves).
export const PROOF_MORE_CSS = `ul>li.pb-more{display:none}
@media (max-width:639px){.js ul:not(.pb-open)>li.pb-x{display:none}.js ul>li.pb-more{display:flex}.pb-more button{min-height:48px;padding:0 18px;border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}}
ul.pb-open:focus{outline:none}
.nearform .mbar,.nearform .ed-mbar{transform:translateY(110%);visibility:hidden}`;
