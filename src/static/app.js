document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <div class="avatar-row">
              ${renderAvatars(details.participants)}
            </div>
            <button type="button" class="toggle-participants" aria-expanded="false">Mostrar participantes</button>
            <ul class="participant-list hidden" aria-hidden="true" data-activity="${name}">
              ${details.participants.map(p => `<li><span class="participant-email">${p}</span><button type="button" class="remove-participant" data-email="${p}" aria-label="Eliminar ${p}">X</button></li>`).join("")}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Añade listeners al botón para expandir/colapsar la lista de participantes
      document.querySelectorAll(".toggle-participants").forEach(button => {
        button.addEventListener("click", () => {
          const container = button.closest(".participants");
          const listEl = container.querySelector(".participant-list");
          const expanded = button.getAttribute("aria-expanded") === "true";

          button.setAttribute("aria-expanded", String(!expanded));
          button.textContent = expanded ? "Mostrar participantes" : "Ocultar participantes";
          listEl.classList.toggle("hidden");
          listEl.setAttribute("aria-hidden", String(expanded));
        });
      });

      // Añade listeners a los botones "X" para eliminar participantes
      document.querySelectorAll(".remove-participant").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const email = btn.getAttribute("data-email");
          const activityName = btn.closest(".activity-card").querySelector("h4").textContent;
          try {
            const resp = await fetch(
              `/activities/${encodeURIComponent(activityName)}/remove?email=${encodeURIComponent(email)}`,
              { method: "POST" }
            );
            const result = await resp.json();
            if (resp.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "An error occurred";
              messageDiv.className = "error";
            }
            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          } catch (error) {
            messageDiv.textContent = "Failed to remove participant. Please try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            console.error("Error removing participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresca automáticamente la lista de actividades y expande la actividad registrada
        await fetchActivities();
        const cards = Array.from(document.querySelectorAll('.activity-card'));
        const card = cards.find(c => c.querySelector('h4').textContent === activity);
        if (card) {
          const toggle = card.querySelector('.toggle-participants');
          const listEl = card.querySelector('.participant-list');
          if (listEl && listEl.classList.contains('hidden')) {
            // abrir la lista para que se vea el nuevo participante
            toggle.click();
          }
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

// Helper: genera HTML de avatares (hasta 5) y contador "+N"
function renderAvatars(participants) {
  const maxVisible = 5;
  const visible = participants.slice(0, maxVisible);
  const more = participants.length - visible.length;

  const avatars = visible
    .map(p => `<span class="avatar" title="${p}">${initial(p)}</span>`)
    .join("");

  const moreBadge = more > 0 ? `<span class="avatar more" title="${more} más">+${more}</span>` : "";

  return avatars + moreBadge;
}

// Helper: extrae inicial a partir del email (before @)
function initial(email) {
  const name = email.split("@")[0] || "";
  const first = name.split(/[.\-_]/)[0] || "";
  return (first.charAt(0) || "").toUpperCase();
}
