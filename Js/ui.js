export function showToast(el, msg) {
  if (!el) return;

  el.textContent = msg;
  el.hidden = false;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.hidden = true), 200);
  }, 2000);
}