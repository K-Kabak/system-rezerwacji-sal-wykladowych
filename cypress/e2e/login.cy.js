describe('Test logowania', () => {
  it('Powinno zalogować poprawnego użytkownika', () => {
    cy.request({
      method: 'POST',
      url: '/login', 
      body: {
        login: 'test1234',
        haslo: 'test1234'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('message', 'Zalogowano pomyślnie.')
      expect(response.body).to.have.property('user')
    })
  })
})
