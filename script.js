import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithRedirect
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const firebaseReady = !Object.values(firebaseConfig).some((value) => value.startsWith("YOUR_"));

let auth;
let googleProvider;
let facebookProvider;

if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  facebookProvider = new FacebookAuthProvider();
}

const serviceCards = document.querySelectorAll(".service-card");
const serviceSelect = document.getElementById("serviceType");
const dispatchForm = document.getElementById("dispatchForm");
const dispatchResult = document.getElementById("dispatchResult");
const availabilityBadge = document.getElementById("availabilityBadge");

const authModal = document.getElementById("authModal");
const openAuthBtn = document.getElementById("openAuthBtn");
const heroDemoBtn = document.getElementById("heroDemoBtn");
const closeAuthBtn = document.getElementById("closeAuthBtn");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authEmail = document.getElementById("authEmail");
const nameField = document.getElementById("nameField");
const authName = document.getElementById("authName");
const authPassword = document.getElementById("authPassword");
const authPhone = document.getElementById("authPhone");
const fillDemoBtn = document.getElementById("fillDemoBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const phoneCallBtn = document.getElementById("phoneCallBtn");
const toggleButtons = document.querySelectorAll(".toggle-btn");

const technicians = {
  "560": { city: "Bengaluru", expert: "Arjun Rao", eta: 14, team: "South Zone Unit" },
  "110": { city: "Delhi", expert: "Meera Sharma", eta: 11, team: "Capital Rapid Response" },
  "500": { city: "Hyderabad", expert: "Kiran Reddy", eta: 16, team: "Metro Field Crew" },
  "600": { city: "Chennai", expert: "Vikram Iyer", eta: 13, team: "Coastal Support Cell" },
  "700": { city: "Kolkata", expert: "Sanjana Dey", eta: 18, team: "East Emergency Desk" }
};

let authMode = "login";

function showAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#b42318" : "";
}

function requireFirebase(actionLabel) {
  if (firebaseReady) {
    return true;
  }

  showAuthMessage(
    `Add your Firebase config in script.js before using ${actionLabel}. The redirect flow is wired but cannot start without real project keys.`,
    true
  );
  return false;
}

function openModal() {
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  authModal.classList.add("hidden");
  authModal.setAttribute("aria-hidden", "true");
}

function setAuthMode(mode) {
  authMode = mode;

  toggleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  const signupMode = mode === "signup";
  nameField.classList.toggle("hidden-field", !signupMode);
  authName.required = signupMode;
  authTitle.textContent = signupMode ? "Create your HomeResQ account" : "Login to HomeResQ";
  authSubtitle.textContent = signupMode
    ? "Create an account and verify your email before accessing emergency requests."
    : "Use email login or redirect with Google to access the portal.";
  authSubmitBtn.textContent = signupMode ? "Create Account" : "Login";
  showAuthMessage("");
}

function setService(serviceName) {
  serviceSelect.value = serviceName;
  serviceCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.service === serviceName);
  });
}

function renderDispatch(data) {
  const location = technicians[data.pincode.slice(0, 3)];
  const isPriority = data.urgency === "Critical" || data.serviceType === "Plumber" || data.serviceType === "Electrician";

  if (!location) {
    availabilityBadge.className = "availability neutral";
    availabilityBadge.textContent = "Coverage expanding";
    dispatchResult.innerHTML = `
      We are not yet operating in pincode <strong>${data.pincode}</strong>.
      Your request for <strong>${data.serviceType}</strong> has been marked for callback support.
      Our team will contact <strong>${data.name}</strong> at <strong>${data.phone}</strong> to arrange manual assistance.
    `;
    return;
  }

  availabilityBadge.className = isPriority ? "availability priority" : "availability available";
  availabilityBadge.textContent = isPriority ? "Priority dispatch ready" : "Technician available";

  const eta = isPriority ? Math.max(location.eta - 4, 7) : location.eta;
  dispatchResult.innerHTML = `
    <strong>${location.expert}</strong> from <strong>${location.team}</strong> has been assigned for
    <strong>${data.serviceType}</strong> in <strong>${location.city}</strong>.<br /><br />
    Arrival estimate: <strong>${eta} minutes</strong><br />
    Priority level: <strong>${data.urgency}</strong><br />
    Address: <strong>${data.address}</strong><br /><br />
    Issue logged: ${data.issue}
  `;
}

async function handleRedirectResult() {
  if (!firebaseReady) {
    return;
  }

  try {
    const result = await getRedirectResult(auth);

    if (!result || !result.user) {
      return;
    }

    const providerId = result.providerId || result.user.providerData[0]?.providerId;

    if (providerId === "google.com") {
      showAuthMessage(`Google login successful for ${result.user.email}. This Google account is already verified.`);
      closeModal();
      return;
    }

    if (providerId === "facebook.com") {
      showAuthMessage(`Facebook login successful for ${result.user.email || "your account"}.`);
      closeModal();
    }
  } catch (error) {
    showAuthMessage(error.message, true);
  }
}

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    setService(card.dataset.service);
  });
});

dispatchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(dispatchForm);
  const payload = Object.fromEntries(formData.entries());
  payload.pincode = payload.pincode.replace(/\D/g, "");
  payload.phone = payload.phone.replace(/\D/g, "");

  if (payload.pincode.length !== 6) {
    availabilityBadge.className = "availability neutral";
    availabilityBadge.textContent = "Invalid pincode";
    dispatchResult.textContent = "Enter a valid 6-digit postal pincode to continue.";
    return;
  }

  if (payload.phone.length !== 10) {
    availabilityBadge.className = "availability neutral";
    availabilityBadge.textContent = "Invalid phone";
    dispatchResult.textContent = "Enter a valid 10-digit phone number.";
    return;
  }

  renderDispatch(payload);
});

dispatchForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    availabilityBadge.className = "availability neutral";
    availabilityBadge.textContent = "Status: Waiting for technician assignment";
    dispatchResult.innerHTML = "Estimated response: <strong>10-15 minutes</strong>";
    setService("AC Service And Repair");
  }, 0);
});

openAuthBtn.addEventListener("click", openModal);
heroDemoBtn.addEventListener("click", () => {
  openModal();
  setAuthMode("login");
  authEmail.value = "demo@homeresq.com";
  authPassword.value = "HomeResQ@123";
  showAuthMessage("Demo credentials filled. Replace them with real Firebase users if you need live authentication.");
});
closeAuthBtn.addEventListener("click", closeModal);

authModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authModal.classList.contains("hidden")) {
    closeModal();
  }
});

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.mode));
});

fillDemoBtn.addEventListener("click", () => {
  setAuthMode("login");
  authEmail.value = "demo@homeresq.com";
  authPassword.value = "HomeResQ@123";
  showAuthMessage("Demo credentials loaded.");
});

googleLoginBtn.addEventListener("click", async () => {
  if (!requireFirebase("Google login")) {
    return;
  }

  try {
    showAuthMessage("Redirecting to Google account selection...");
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    showAuthMessage(error.message, true);
  }
});

facebookLoginBtn.addEventListener("click", async () => {
  if (!requireFirebase("Facebook login")) {
    return;
  }

  try {
    showAuthMessage("Redirecting to Facebook login...");
    await signInWithRedirect(auth, facebookProvider);
  } catch (error) {
    showAuthMessage(error.message, true);
  }
});

phoneCallBtn.addEventListener("click", () => {
  const phoneValue = authPhone.value.replace(/\D/g, "");

  if (phoneValue.length !== 10) {
    showAuthMessage("Enter a valid 10-digit phone number to simulate a verification call.", true);
    return;
  }

  showAuthMessage(
    `Phone verification for ${phoneValue} needs Firebase phone auth or a calling API such as Twilio. The UI is ready, but backend/provider setup is still required.`,
    true
  );
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value;
  const fullName = authName.value.trim();

  if (!email || !password) {
    showAuthMessage("Enter both email and password.", true);
    return;
  }

  if (!firebaseReady) {
    if (authMode === "signup") {
      if (!fullName) {
        showAuthMessage("Enter your full name to create an account.", true);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName, email, password })
        });
        const data = await response.json();

        if (!response.ok) {
          showAuthMessage(data.message || "Registration failed.", true);
          return;
        }

        showAuthMessage("Account created successfully. You can now login.");
        setAuthMode("login");
        return;
      } catch (error) {
        showAuthMessage("Backend not reachable. Start server on http://localhost:5000.", true);
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        showAuthMessage(data.message || "Login failed.", true);
        return;
      }

      showAuthMessage(`Login successful for ${data.user?.email || email}.`);
      closeModal();
      return;
    } catch (error) {
      showAuthMessage("Backend not reachable. Start server on http://localhost:5000.", true);
      return;
    }
  }

  try {
    if (authMode === "signup") {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      showAuthMessage(`Verification email sent to ${email}. After verification, the account can be used for login.`);
      return;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      showAuthMessage(`Login blocked. Verify ${email} first using the email already sent to this account.`, true);
      return;
    }

    showAuthMessage(`Login successful for ${email}. Your account is verified and ready to use.`);
    closeModal();
  } catch (error) {
    showAuthMessage(error.message, true);
  }
});

setService("AC Service And Repair");
setAuthMode("login");
handleRedirectResult();
