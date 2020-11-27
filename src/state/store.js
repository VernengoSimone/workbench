import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    fps: null,
    fpsAvg: null,
    identifiedObjects: [],
    count: 0,
  },
  getters: {
    getFps: state => state.fps,
    getFpsAvg: state => state.fpsAvg,
    getIdentifiedObjects: state => {
      state.identifiedObjects.forEach(
        (object) => {
          object.id = state.count
          state.count ++
        }
      )
      return state.identifiedObjects
    },
  },
  mutations: {
    setFps (state, value) {
      state.fps = value
    },
    setFpsAvg (state, value) {
      state.fpsAvg = value
    },
    setIdentifiedObjects (state, objects) {
      state.count = 0
      state.identifiedObjects = objects
    }
  }
})

export default store