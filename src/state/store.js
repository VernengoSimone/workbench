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
    debugMeasures: null,
    debugMatches: null,
  },
  getters: {
    getFps: state => state.fps,
    getFpsAvg: state => state.fpsAvg,
    getIdentifiedObjects: state => state.identifiedObjects,
    getInferMode: state => state.inferMode,
    getInferTime: state => state.inferTime,
    getDebugMeasures: state => state.debugMeasures,
    getDebugMatches: state => state.debugMatches
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
    },

    setDebugMeasures (state, measures) {
      const keys = Object.keys(measures)
      // Expected shape: array [x, y, width, height]
      // x: coordinate along axis x of the left corner
      // y: coordinate along axis y of the left corner
      state.debugMeasures = keys.map(key => {
        const measure = [
          measures[key].x,
          measures[key].y,
          measures[key].width,
          measures[key].height
        ]
        return measure
      })
    },

    setDebugMatches (state, matches) {
      state.debugMatches = matches
    },
  }
})

export default store