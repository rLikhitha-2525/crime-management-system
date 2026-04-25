(function () {
  function queryParams() {
    return new URLSearchParams(window.location.search);
  }

  function setTopMessage(message, isError) {
    if (!message) {
      return;
    }
    const main = document.querySelector("main");
    if (!main) {
      return;
    }
    const alert = document.createElement("div");
    alert.className = isError ? "alert alert-danger mb-3 py-2" : "alert alert-success mb-3 py-2";
    alert.innerText = message;
    main.insertBefore(alert, main.firstChild);
  }

  async function readCurrentUser() {
    try {
      return await window.CrimeAPI.getCurrentUser();
    } catch (error) {
      return null;
    }
  }

  function toggleLink(selector, visible) {
    const link = document.querySelector(selector);
    if (!link) {
      return;
    }
    const item = link.closest(".nav-item") || link;
    item.classList.toggle("d-none", !visible);
  }

  function configureNavbar(user) {
    const authLink = document.querySelector(".nav-auth");
    const badge = document.getElementById("navUserBadge");

    toggleLink(".nav-admin", Boolean(user && user.is_admin));
    toggleLink(".nav-register", !user);

    if (badge) {
      if (user) {
        badge.classList.remove("d-none");
        badge.innerText = user.username + (user.is_admin ? " (Admin)" : "");
      } else {
        badge.classList.add("d-none");
        badge.innerText = "";
      }
    }

    if (!authLink) {
      return;
    }

    if (user) {
      authLink.innerText = "Logout";
      authLink.href = "#";
      authLink.addEventListener("click", async function (event) {
        event.preventDefault();
        try {
          await window.CrimeAPI.logoutUser();
        } catch (error) {
          // ignore and still navigate to login
        }
        window.location.href = "login.html?msg=You%20have%20been%20logged%20out";
      });
    } else {
      authLink.innerText = "Login";
      authLink.href = "login.html";
    }
  }

  async function boot() {
    const params = queryParams();
    const msg = params.get("msg");
    const error = params.get("error");
    if (msg) {
      setTopMessage(decodeURIComponent(msg), false);
    }
    if (error) {
      setTopMessage(decodeURIComponent(error), true);
    }

    const user = await readCurrentUser();
    configureNavbar(user);

    window.AppAuth = {
      user: user,
      isLoggedIn: Boolean(user),
      isAdmin: Boolean(user && user.is_admin)
    };

    return window.AppAuth;
  }

  window.AppAuthReady = boot();
})();
