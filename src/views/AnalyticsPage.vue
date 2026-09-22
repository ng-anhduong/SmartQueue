<template>
    <div>
    
        <NavBar/>
        <BranchDetails/>
        <Analytics/>
        <TheFooter/>

    </div>
</template>

<script setup>
import NavBar from "@/components/TheNavBar.vue"
import BranchDetails from "@/components/analytics-page/BranchDetails.vue"
import Analytics from "@/components/analytics-page/Analytics.vue"
import TheFooter from "@/components/TheFooter.vue"
</script>