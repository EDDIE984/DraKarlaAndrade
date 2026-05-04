const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-form]");
const message = document.querySelector("[data-message]");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nombre = data.get("nombre")?.toString().trim();
  const fecha = data.get("fecha")?.toString();
  const hora = data.get("hora")?.toString();

  if (!nombre || !fecha || !hora) {
    message.textContent = "Completa fecha, hora y nombre para solicitar la cita.";
    return;
  }

  message.textContent = `Gracias, ${nombre}. Tu solicitud para el ${fecha} a las ${hora} quedo registrada en esta maqueta.`;
  form.reset();
});
