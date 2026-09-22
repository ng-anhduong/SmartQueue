<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="MainPage">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
}

body {
  min-height: 100vh;
}
</style>
