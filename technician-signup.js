const technicianSignupForm = document.getElementById("technicianSignupForm");
const technicianSignupStatus = document.getElementById("technicianSignupStatus");

function setTechnicianStatus(message, type = "") {
  technicianSignupStatus.textContent = message;
  technicianSignupStatus.className = `form-status ${type}`.trim();
}

// 🚀 SUBMIT
technicianSignupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(technicianSignupForm);
  const payload = Object.fromEntries(formData.entries());

  payload.phone = payload.phone.replace(/\D/g, "");

  if (payload.phone.length !== 10) {
    setTechnicianStatus("Enter valid 10-digit number", "error");
    return;
  }

  const submitButton = technicianSignupForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  setTechnicianStatus("Submitting...", "");

  try {
    const res = await fetch("http://localhost:5000/api/technicians", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      setTechnicianStatus("Registered successfully ✅", "success");
      technicianSignupForm.reset();
    } else {
      setTechnicianStatus(data.message || data.error || "Failed", "error");
    }

  } catch (error) {
    setTechnicianStatus("Server error", "error");
  } finally {
    submitButton.disabled = false;
  }
});
