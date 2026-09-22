import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import VueChartkick from "vue-chartkick";
import "chartkick/chart.js";

import { getAuth, onAuthStateChanged } from "firebase/auth";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueChartkick);

const auth = getAuth();

let appInitialized = false;

onAuthStateChanged(auth, () => {
  if (!appInitialized) {
    app.mount("#app");
    appInitialized = true;
  }
});
