<template>
    <table class = "stat-win">
        <tr
            v-for="object in objects"
            :key="object.id"
        >
        prova
        </tr>
    </table>
</template>

<script>
export default {
    name: "StatWin",
    computed: {
        objects () {
            return this.$store.getters.getIdentifiedObjects
        }
    }
    
}
</script>

<style scoped>
    .stat-win {
        z-index: 100;
        position: fixed;
        background-color: rgb(0, 0, 0);
        bottom: 0;
        right: 0;
        height: 40%;
        width: 30%
    }
</style>