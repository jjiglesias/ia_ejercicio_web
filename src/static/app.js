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
            <ul class="participant-list hidden" aria-hidden="true">
              ${details.participants.map(p => `<li>${p}</li>`).join("")}
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
