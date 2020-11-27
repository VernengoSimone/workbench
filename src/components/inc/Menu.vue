<template>
    <div class="menu">
        <div class="menu-item">
            <div class="menu-text">
            Test
            </div>
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
    align-items: center;
    justify-content: center;
    top: 0;
    right: 0;
    width: 30%;
    height: 60%;
}

.menu-item {
    flex: 1;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
}

.menu-text{
    font-size: 20px;
    color: #818181;
    cursor: pointer;
    padding: 10px;
    border-bottom: 2px solid #2e2d2d;
    width: fit-content;
}

.menu-text:hover {
    border-bottom: 2px solid #ffffff;
}
</style>
