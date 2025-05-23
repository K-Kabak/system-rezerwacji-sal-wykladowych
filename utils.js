function toggleAuthView(showLogin) {
  const loginView = document.getElementById("login-view");
  const registerView = document.getElementById("register-view");
  const loginErrorElement = document.getElementById("login-error");
  const registerMessageElement = document.getElementById("register-message");

  loginView.style.display = showLogin ? "block" : "none";
  registerView.style.display = showLogin ? "none" : "block";
  if (loginErrorElement) loginErrorElement.textContent = "";
  if (registerMessageElement) registerMessageElement.textContent = "";
}

function validateLoginForm() {
  const login = document.querySelector('#login-form input[name="login"]')?.value.trim();
  const haslo = document.querySelector('#login-form input[name="haslo"]')?.value.trim();
  return login !== '' && haslo !== '';
}


module.exports = {
  toggleAuthView,
  validateLoginForm
};
