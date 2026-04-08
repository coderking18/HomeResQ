const applicationForm = document.getElementById("careerApplicationForm");
const selectedRoleInput = document.getElementById("selectedRoleInput");
const selectedRoleLabel = document.getElementById("selectedRoleLabel");
const applicationPopup = document.getElementById("applicationPopup");
const closePopupBtn = document.getElementById("closePopupBtn");
const popupOkBtn = document.getElementById("popupOkBtn");

function showPopup() {
  applicationPopup.classList.remove("hidden");
  applicationPopup.setAttribute("aria-hidden", "false");
}

function hidePopup() {
  applicationPopup.classList.add("hidden");
  applicationPopup.setAttribute("aria-hidden", "true");
}

function getSelectedRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get("role") || "Frontend Developer";
}

const selectedRole = getSelectedRole();
selectedRoleInput.value = selectedRole;
selectedRoleLabel.textContent = selectedRole;

closePopupBtn?.addEventListener("click", hidePopup);
popupOkBtn?.addEventListener("click", hidePopup);

applicationPopup?.addEventListener("click", (event) => {
  if (event.target.dataset.closePopup === "true") {
    hidePopup();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !applicationPopup.classList.contains("hidden")) {
    hidePopup();
  }
});

applicationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(applicationForm);
  const submitButton = applicationForm.querySelector('button[type="submit"]');

  const phone = String(formData.get("phone") || "").replace(/\D/g, "");
  if (phone.length !== 10) {
    alert("Enter a valid 10-digit phone number.");
    return;
  }

  const resumeFile = applicationForm.querySelector('input[name="resume_file"]')?.files?.[0];
  if (!resumeFile) {
    alert("Please upload your resume.");
    return;
  }

  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    phone,
    message: String(formData.get("message") || "").trim(),
    resume: resumeFile.name
  };

  submitButton.disabled = true;

  try {
    const res = await fetch("http://localhost:5000/api/careers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      applicationForm.reset();
      selectedRoleInput.value = selectedRole;
      showPopup();
    } else {
      alert(data.message || data.error || "Submission failed");
    }
  } catch (error) {
    console.error("Career submit error:", error);
    alert("Server error. Check backend and API URL.");
  } finally {
    submitButton.disabled = false;
  }
});
