<template>
  <div id="app">
    <div class="top-bar">
      <div class="top-bar-inner">
        <div class="nav-inner">
          <router-link to="/">Home</router-link>
          <!--<router-link to="/about">About</router-link>-->
          <a href="https://manobyte.com" target="_blank">About</a>
        </div>
        <a style="white-space:nowrap" href="/logout">
          Log out
        </a>
      </div>
    </div>

    <div v-if="!$store.state.routeLoaded" class="lds-wrapper"><div id="lds" class="lds-ring"><div></div><div></div><div></div><div></div></div></div>
    <router-view :key="$route.path" />

    <div v-if="$store.state.showErrorMsg" class="error-msg-wrap">
      <div class="error-msg">
        <div>{{$store.state.errorMsg}}</div>
        <button style="margin-top:0" @click="() => $store.state.showErrorMsg = false" class="btn">OK</button>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';

export default Vue.extend({
    name: 'App',
    components: {
        
    },
    data() {
        return {
            
        }
    },
    async created() {
      window.alert = (message) => {
        this.$store.state.errorMsg = message;
        this.$store.state.showErrorMsg = true;
      }
      await axios.get(`${this.$store.state.apiUrl}/session`)
        .then(resp => {
          console.log(resp.data);
          if(!resp.data.subscriptionActive) {
            this.$router.push('/payment')
          }
        })
        .catch(e => {
          console.log(e);
        })
    },
    methods: {
        
    },
    watch: {
      $route (){
        this.$store.state.routeLoaded = false;
      }
    }
})
</script>

<style lang="scss" src="./style.scss"></style>