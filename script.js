const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-form]");
const message = document.querySelector("[data-message]");

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nombre = data.get("nombre")?.toString().trim();
  const fecha = data.get("fecha")?.toString();
  const hora = data.get("hora")?.toString();
  const correo = data.get("correo")?.toString().trim();

  if (!nombre || !fecha || !hora || !data.get("telefono")?.toString().trim()) {
    message.textContent = "Completa fecha, hora, nombre y telefono para solicitar la cita.";
    return;
  }

  if (correo && !isValidEmail(correo)) {
    message.textContent = "Ingresa un correo valido o deja ese campo vacio.";
    return;
  }

  const payload = Object.fromEntries(data.entries());
  const submitButton = form.querySelector("button[type='submit']");

  submitButton.disabled = true;
  message.textContent = "Enviando solicitud...";

  try {
    const response = await fetch("/api/enviar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "No se pudo enviar la solicitud.");
    }

    message.textContent = `Gracias, ${nombre}. Recibimos tu solicitud para el ${fecha} a las ${hora}.`;
    form.reset();
  } catch (error) {
    message.textContent = error.message || "No se pudo enviar la solicitud. Intentalo nuevamente.";
  } finally {
    submitButton.disabled = false;
  }
});

const videoModal = document.getElementById("video-modal");
const modalIframe = document.getElementById("modal-iframe");

document.querySelectorAll(".reel-thumb").forEach((btn) => {
  btn.addEventListener("click", () => {
    modalIframe.src = btn.dataset.src;
    videoModal.showModal();
  });
});

function closeVideoModal() {
  videoModal.close();
  modalIframe.src = "";
}

document.getElementById("modal-close").addEventListener("click", closeVideoModal);

videoModal.addEventListener("click", (e) => {
  if (e.target === videoModal) closeVideoModal();
});
