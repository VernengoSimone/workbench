import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    fps: null,
    frameTimes: [],
    frameCount: 0,
    identifiedObjects: [],
    inferMode: "auto",
    inferTime: 0.5,
    debugMeasures: null,
    debugMatches: {detections: {}, trackers: {}},
  },
  getters: {
    getFps: state => state.fps,
    getFrameTimes: state => state.frameTimes,
    getIdentifiedObjects: state => state.identifiedObjects,
    getInferMode: state => state.inferMode,
    getInferTime: state => state.inferTime,
    getDebugMeasures: state => state.debugMeasures,
    getDebugMatches: state => state.debugMatches,
  },
  mutations: {
    setFps (state, value) {
      state.fps = Math.round(value.fps * 10 / value.interval) / 10
      state.frameCount += 1
      state.frameTimes.push({interval: value.interval, fps: value.fps / state.fps})
    },

    setIdentifiedObjects (state, objects) {
      state.identifiedObjects = objects
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
        return measures[key]
      })
    },

    setDebugMatches (state, input) {
      // detections contains all the detection for each frame
      var frames = Object.keys(input.detections)
      var keys = []
      state.debugMatches.detections = frames.map(frame => {
        keys = Object.keys(input.detections[frame])
        const measures = keys.map(key => {
          const measure = {
            x: input.detections[frame][key].x,
            y: input.detections[frame][key].y,
            width: input.detections[frame][key].width,
            height: input.detections[frame][key].height
          }
          return measure
        })
        return measures
      })

      keys = Object.keys(input.trackers)
      state.debugMatches.trackers = keys.map(key => {
        return input.trackers[key]
      })
    },

  }
})

export default store