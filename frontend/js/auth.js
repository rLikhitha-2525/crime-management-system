async function getCurrentUser() {
  try {
    return await window.CrimeAPI.getCurrentUser();
  } catch (error) {
    return null;
  }
}

async function login(username, password) {
  return window.CrimeAPI.loginUser(username, password);
}

async function logout() {
  return window.CrimeAPI.logoutUser();
}

function setMessage(message, isError) {
  const messageEl = document.getElementById("authMessage");
  if (!messageEl) {
    return;
  }
  messageEl.innerText = message;
  messageEl.className = isError ? "alert alert-danger mt-3 mb-0 py-2" : "alert alert-success mt-3 mb-0 py-2";
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    setMessage("Username and password are required.", true);
    return;
  }

  try {
    const data = await login(username, password);
    setMessage("Login successful. Welcome " + data.username + ".", false);
    const next = new URLSearchParams(window.location.search).get("next");
    setTimeout(function () {
      window.location.href = next || "index.html";
    }, 600);
  } catch (error) {
    setMessage(error.message || "Login failed.", true);
  }
}

async function handleLogoutClick() {
  try {
    await logout();
    window.location.href = "login.html?msg=You%20have%20been%20logged%20out";
  } catch (error) {
    setMessage(error.message || "Logout failed.", true);
  }
}

function setupAuthPage() {
  const form = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!form || !logoutBtn) {
    return;
  }

  form.addEventListener("submit", handleLoginSubmit);
  logoutBtn.addEventListener("click", handleLogoutClick);
  logoutBtn.style.display = "none";

  getCurrentUser().then(function (user) {
    if (user) {
      setMessage("Already logged in as " + user.username + ". Use navbar Logout to switch accounts.", false);
      logoutBtn.style.display = "inline-block";
    }
  });
}

setupAuthPage();
