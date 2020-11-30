<template>
    <div class="menu">
        <div class="menu-text">
            Work in progress
        </div>
        <button
            class="switch-mode"
            @click="changeInferMode"
        >
        Change Inference Mode
        </button>
    </div>
</template>

<script>
export default {
  name: 'Menu',
  computed: {
        inferMode() {
            return this.$store.getters.getInferMode
        }
  },
  methods: {
      changeInferMode() {
        switch (this.inferMode) {
            case "auto":
                this.$store.commit("setInferMode", "user")
                break
            case "user":
                this.$store.commit("setInferMode", "auto")
                break
        }
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.menu {
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 100;
    background: #5a5959;
    justify-content: center;
    align-items: center;
    top: 0;
    right: 0;
    width: 30%;
    height: 60%;
}

.menu-text {
    font-size: 20px;
    color: #818181;
    flex-grow: 1;
}

.switch-mode {
    margin-top: auto;
    border: none;
    outline:none;
    color: white;
    font-size: 20px;
    background: rgb(71, 71, 71);
    text-align: center;
    text-decoration: none;
    width: 100%;
}

.switch-mode:hover {
    background: rgb(209, 14, 14);
}
</style>
