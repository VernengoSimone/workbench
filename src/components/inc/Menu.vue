<template>
    <div class="menu">
        <div class="menu-text">
            Work in progress
        </div>
        <label
            for="inputKalman"
            class="label"
        >
        Upload measure (JSON)
        </label>
        <input
            type="file"
            id="inputKalman"
            ref="inputKalman"
            class="load-file"
            accept=".json"
            @change="jsonToMeasure"
        />
        <label
            for="inputMatching"
            class="label"
        >
        Upload matches (JSON)
        </label>
        <input
            type="file"
            id="inputMatching"
            ref="inputMatching"
            class="load-file"
            accept=".json"
            @change="jsonToMatches"
        />
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
        async jsonToMatches() {
            const data = await this.readInputFile(this.$refs.inputMatching)
            this.$store.commit("setDebugMatches", data)
        },
        
        async jsonToMeasure() {
            const data = await this.readInputFile(this.$refs.inputKalman)
            this.$store.commit("setDebugMeasures", data)
        },

        // this function read the input file as a string in order to parse it
        async readInputFile(file) {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader()
                fileReader.onload = event => resolve(JSON.parse(event.target.result))
                fileReader.onerror = error => reject(error)
                fileReader.readAsText(file.files[0])
            })
        },

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

.label {
    text-align: center;
}

.load-file {
    width: 80%;
    padding-top: 5px;
    padding-bottom: 10px;
    text-align: center;
    margin: auto;
}
</style>
