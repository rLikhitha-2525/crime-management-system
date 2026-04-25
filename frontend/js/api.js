(function () {
  /**
   * API host must match the page hostname for session cookies.
   * Browsers treat http://localhost and http://127.0.0.1 as different sites;
   * with SameSite=Lax, a session set on 127.0.0.1 is not sent from a page on localhost.
   */
  function apiHost() {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return h;
    }
    if (!h) {
      return "127.0.0.1";
    }
    return h;
  }

  const BASE_URL = "http://" + apiHost() + ":8000/api/";

  async function request(endpoint, options = {}) {
    const mergedOptions = {
      credentials: "include",
      ...options
    };

    const response = await fetch(BASE_URL + endpoint, mergedOptions);
    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      const message = payload && payload.error ? payload.error : "API request failed: " + endpoint;
      throw new Error(message);
    }
    return payload;
  }

  async function getCrimes() {
    return request("crimes/");
  }

  async function getAlerts() {
    return request("alerts/");
  }

  async function getPredictions() {
    return request("predict/");
  }

  async function submitCrime(data) {
    return request("report/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  }

  async function loginUser(username, password) {
    return request("login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
  }

  async function registerUser(username, password) {
    return request("register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
  }

  async function logoutUser() {
    return request("logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
  }

  async function getCurrentUser() {
    return request("me/");
  }

  async function getPendingReports() {
    return request("admin/pending/");
  }

  async function approveReport(reportId) {
    return request("admin/approve/" + reportId + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
  }

  async function rejectReport(reportId) {
    return request("admin/reject/" + reportId + "/", {
      method: "DELETE"
    });
  }

  window.CrimeAPI = {
    BASE_URL,
    getCrimes,
    getAlerts,
    getPredictions,
    submitCrime,
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getPendingReports,
    approveReport,
    rejectReport
  };
})();
