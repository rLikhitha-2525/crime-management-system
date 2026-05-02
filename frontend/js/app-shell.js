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

    toggleLink(".nav-mycases", Boolean(user));
    toggleLink(".nav-admin", Boolean(user && user.is_admin));
    toggleLink(".nav-rejected", Boolean(user && user.is_admin));
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

  function escapeHtml(text) {
    if (text === null || text === undefined) {
      return "";
    }
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  function formatNotifDate(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }

  async function refreshNotifications() {
    const wrap = document.getElementById("navNotifWrap");
    const badge = document.getElementById("notifBadge");
    const menu = document.getElementById("notifMenu");
    if (!wrap || !menu || !window.CrimeAPI || !window.CrimeAPI.getNotifications) {
      return;
    }
    try {
      const data = await window.CrimeAPI.getNotifications();
      const unread = typeof data.unread_count === "number" ? data.unread_count : 0;
      if (badge) {
        badge.classList.toggle("d-none", unread === 0);
        badge.innerText = String(unread);
      }
      const list = data.notifications || [];
      if (!list.length) {
        menu.innerHTML =
          '<li><span class="dropdown-item-text text-secondary small px-3 py-2">No notifications yet.</span></li>';
        return;
      }
      menu.innerHTML = list
        .map(function (n) {
          const strong = n.read ? "" : " fw-semibold";
          return (
            '<li><button type="button" class="dropdown-item text-start' +
            strong +
            '" data-notif-id="' +
            n.id +
            '">' +
            escapeHtml(n.message) +
            '<br><small class="text-secondary">' +
            escapeHtml(formatNotifDate(n.created_at)) +
            "</small></button></li>"
          );
        })
        .join("");
      menu.querySelectorAll("[data-notif-id]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          try {
            await window.CrimeAPI.markNotificationRead(btn.getAttribute("data-notif-id"));
          } catch (e) {
            // ignore
          }
          await refreshNotifications();
        });
      });
    } catch (e) {
      menu.innerHTML =
        '<li><span class="dropdown-item-text text-secondary small px-3 py-2">Could not load alerts.</span></li>';
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

    const notifWrap = document.getElementById("navNotifWrap");
    if (user && notifWrap) {
      notifWrap.classList.remove("d-none");
      await refreshNotifications();
      window.setInterval(refreshNotifications, 60000);
    }

    return window.AppAuth;
  }

  window.AppAuthReady = boot();
})();
