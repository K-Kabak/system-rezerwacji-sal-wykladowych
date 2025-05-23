/**
 * @jest-environment jsdom
 */
const { validateLoginForm } = require('../utils');

test('Zwraca true dla poprawnych danych', () => {
  document.body.innerHTML = `
    <form id="login-form">
      <input name="login" value="testuser" />
      <input name="haslo" value="test123" />
    </form>
  `;
  expect(validateLoginForm()).toBe(true);
});

test('Zwraca false przy pustym loginie', () => {
  document.body.innerHTML = `
    <form id="login-form">
      <input name="login" value="" />
      <input name="haslo" value="test123" />
    </form>
  `;
  expect(validateLoginForm()).toBe(false);
});
