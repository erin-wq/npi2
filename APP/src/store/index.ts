import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    apiUrl: process.env.NODE_ENV === 'production' ? 'https://npi.manobyte.com' : 'http://localhost:5000',
    routeLoaded: false,
    showErrorMsg: false,
    errorMsg: 'There was an error.',
    portalId: ''
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
