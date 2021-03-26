<template>
    <div class = "stat-win">
        <table>
            <tr>
                <th> FPS </th>
            </tr>
            <tr>
                <td v-if="fps===null" style="text-align: center"> - </td>
                <td v-else style="text-align: center"> {{ fps }} </td>
            </tr>
        </table>
        <table>
            <tr>
                <th> ID </th>
                <th> Class </th>
            </tr>
            <tr
                v-for="object in objects"
                :key="object.id"
            >
                <td> {{object.id}} </td>
                <td> {{object.class}} </td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    name: "StatWin",
    computed: {
        objects () {
            return this.$store.getters.getIdentifiedObjects
        },
        fps () {
            return this.$store.getters.getFps
        },
    }
    
}
</script>

<style scoped>
    table{
        width: 100%;
    }

    tr:nth-child(even) {
        background-color: #363333  
    }

    .stat-win {
        z-index: 100;
        position: fixed;
        overflow: auto;
        background-color: rgb(0, 0, 0);
        bottom: 0;
        right: 0;
        height: 40%;
        width: 30%;
    }
</style>