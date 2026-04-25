function setRegisterMessage(message, isError) {
  const messageEl = document.getElementById("registerMessage");
  if (!messageEl) {
    return;
  }
  messageEl.innerText = message;
  messageEl.className = isError ? "alert alert-danger mt-3 mb-0 py-2" : "alert alert-success mt-3 mb-0 py-2";
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    setRegisterMessage("Username and password are required.", true);
    return;
  }

  try {
    const data = await window.CrimeAPI.registerUser(username, password);
    setRegisterMessage(data.message + ". Redirecting to login...", false);
    setTimeout(function () {
      window.location.href = "login.html?msg=Registration%20successful.%20Please%20log%20in";
    }, 900);
  } catch (error) {
    setRegisterMessage(error.message || "Registration failed.", true);
  }
}

function initRegisterPage() {
  const form = document.getElementById("registerForm");
  if (!form) {
    return;
  }
  form.addEventListener("submit", handleRegisterSubmit);
}

initRegisterPage();
