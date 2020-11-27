<template>
    <div class="menu">
        <div class="menu-text">
            Work in progress
        </div>
    </div>
</template>

<script>
export default {
  name: 'Menu',
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.menu {
    z-index: 100;
    position: fixed;
    background: #5a5959;
    justify-content: center;
    top: 0;
    right: 0;
    width: 30%;
    height: 60%;
}

.menu-text{
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    color: #818181;
    width: 100%;
    height: 100%;
}
</style>
