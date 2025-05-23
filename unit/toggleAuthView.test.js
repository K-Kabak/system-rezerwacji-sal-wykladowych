/**
 * @jest-environment jsdom
 */
const { toggleAuthView } = require('../utils');


 

describe('toggleAuthView', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="login-view"></div>
      <div id="register-view"></div>
      <div id="login-error"></div>
      <div id="register-message"></div>
    `;
  });

  it('should show login view and hide register view when true', () => {
    toggleAuthView(true);
    expect(document.getElementById('login-view').style.display).toBe('block');
    expect(document.getElementById('register-view').style.display).toBe('none');
  });

  it('should show register view and hide login view when false', () => {
    toggleAuthView(false);
    expect(document.getElementById('login-view').style.display).toBe('none');
    expect(document.getElementById('register-view').style.display).toBe('block');
  });
});
