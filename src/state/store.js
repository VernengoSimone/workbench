import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    fps: null,
    fpsAvg: null,
    identifiedObjects: [],
    objCount: 0,
    inferMode: "auto",
    inferTime: 0.2,
  },
  getters: {
    getFps: state => state.fps,
    getFpsAvg: state => state.fpsAvg,
    getIdentifiedObjects: state => state.identifiedObjects,
    getInferMode: state => state.inferMode,
    getInferTime: state => state.inferTime,
  },
  mutations: {
    setFps (state, value) {
      state.fps = Math.round(value * 10) / 10
    },
    
    setFpsAvg (state, value) {
      console.info()
      state.fpsAvg = value
    },

    setIdentifiedObjects (state, objects) {
      state.objCount = 0
      state.identifiedObjects = objects
      state.identifiedObjects.forEach(
        (object) => {
          object.id = state.objCount
          state.objCount ++
          object.score = Math.round(object.score * 100) / 100
        }
      )
    },
    
    setInferMode (state, value) {
      if (["user", "auto"].includes(value)) {
        console.info("Inference mode set to " + value)
        state.inferMode = value
      }
      else console.error("The inference mode requested is not available: " + value)
    },

    setInferTime (state, value) {
      if (state.InferTime > 0) state.InferTime = value
      else console.error("The Inference time entered is negative.")
    }
  }
})

export default store