
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8090',

    setupNodeEvents(on, config) {
  
    },
    supportFile: false
  }
});
