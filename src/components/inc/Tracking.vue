<template>
    <div
      id="publisherCanvas"
      ref="publisherCanvas"
      class="publisherCanvas"
    >
      <canvas
        id="publisher_canvas"
        ref="publisher_canvas"
        @click="playPause"
      ></canvas>
    </div>
</template>

<script>

import { fabric } from 'fabric'
import { saveAs } from 'file-saver'
import * as cocoSsd from "../../sort/object_detection.js"
import * as sort from "../../sort/sort.js"

export default {
  name: 'Tracking',
  props: {
    videoStream: {
      type: HTMLVideoElement,
      required: false,
      default() {
        return {}
      }
    },
    playing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  data: () => ({
    canvas: null,
    model: null,
    predictions: [],
    videoRatio: null,
    canvasRatio: null,
    videoDimensions: {
      width: null,
      height: null,
    },
    videoOffset: {
      x: null,
      y: null,
    },
    time: 0,
    fpsCount: 0,
    interval: null,
    sort: null,
  }),
  computed: {
    inferMode() {
      return this.$store.getters.getInferMode
    },
    inferTime() {
      return this.$store.getters.getInferTime
    },
    debugMeasures() {
      return this.$store.getters.getDebugMeasures
    },
    debugMatches() {
      return this.$store.getters.getDebugMatches
    },
  },
  watch: {
    inferMode: function () {
      clearInterval(this.interval)
      this.interval = null
      this.startInference()
    },
    debugMatches: {
      deep: true,
      handler: "testIou"
    },
    debugMeasures: function () {
      this.testKalman()
    },
  },
  created() {
      window.addEventListener("resize", this.resizeCanvas);
  },
  mounted() {
    this.initCanvas()
    this.initCoco()
    },
  destroyed() {
    window.removeEventListener("resize", this.resizeCanvas);
  },
  methods: {
    initCanvas() {
      this.canvas = new fabric.StaticCanvas("publisher_canvas")
      this.resizeCanvas()
    },

    resizeCanvas() {
      this.canvas.setHeight(this.$refs.publisherCanvas.clientHeight)
      this.canvas.setWidth(this.$refs.publisherCanvas.clientWidth)
      if (this.videoStream){
        this.computeVideoDimension()
        this.computeOffset()
      }
    },

    async initCoco(){
      this.model = await cocoSsd.load({
        modelUrl: "http://localhost:8081/model.json"
      })  

      /*
      in order to draw the bboxes in the right place we need
      the actual space occupied by the video and dimensions (offset) of
      the black bars
      */
    
      this.computeVideoDimension()
      this.computeOffset()
      this.startInference()
    },

    startInference() {
      this.sort = new sort.Sort()

      switch (this.inferMode) {
        case "user":
          // use setInterval to obtain 5 detection sets per second
          console.info("The object tracking model evaluates one frame every " + this.inferTime + " seconds")
          this.interval = setInterval(() => {
            this.drawBbox()
          }, this.inferTime)
          break

        case "auto":
          // use requestAnimationFrame to draw every frame
          /* NOTE: checking the framerate it's obvious that there some sort of
          framerate limiter implemented into coco-ssd */
          console.info(`The object tracking model evaluates every frame`)
          requestAnimationFrame(this.drawBbox)
      }
    },

    computeVideoDimension() {
      this.videoRatio = this.videoStream.videoWidth / this.videoStream.videoHeight
      this.canvasRatio = this.canvas.getWidth() / this.canvas.getHeight()

      if(this.videoRatio > this.canvasRatio) {
        // in this case video fills the whole WIDTH of the canvas
        this.videoDimensions.width = this.canvas.getWidth()
        this.videoDimensions.height = this.videoDimensions.width / this.videoRatio
      }
      else {
        // in this case video fills the whole HEIGHT of the canvas
        this.videoDimensions.height = this.canvas.getHeight()
        this.videoDimensions.width = this.videoDimensions.height * this.videoRatio
      }
    },

    computeOffset() {
      if(this.videoRatio > this.canvasRatio) {
        // in this case we'll have black bars along y
        this.videoOffset.y = (this.canvas.getHeight() - this.videoDimensions.height) / 2
        this.videoOffset.x = 0
      }
      else {
        // in this case we'll have black bars along x
        this.videoOffset.y = 0
        this.videoOffset.x = Math.round((this.canvas.getWidth() - this.videoDimensions.width) / 2)
      }
    },

    sumOffset(coordinates) {
      return {
        x: coordinates.x + this.videoOffset.x,
        y: coordinates.y + this.videoOffset.y,
        width: coordinates.width,
        height: coordinates.height
      }
    },

    scaleCoordinates (coordinates) {
      // we expect the coordinates to be in the form [x, y, width, height]
      return {
        x: coordinates.x * (this.videoDimensions.width / this.videoStream.videoWidth),
        y: coordinates.y * (this.videoDimensions.height / this.videoStream.videoHeight),
        width: coordinates.width * (this.videoDimensions.width / this.videoStream.videoWidth),
        height: coordinates.height * (this.videoDimensions.height / this.videoStream.videoHeight)
      }
    },

    async identifyObjects() {      
      const output = await this.model.detect(this.videoStream)
      const boxes = output.map((element) => {
        return {
          x: element.bbox[0],
          y: element.bbox[1],
          width: element.bbox[2],
          height: element.bbox[3],
          score: element.score,
          class: element.class
        }
      })

      return boxes
    },

    async drawBbox(){
      if (this.playing) {
        let timeInterval = Date.now() - this.time
        // If the time was not initialized
        if (this.time === 0) this.time = Date.now()
        // Here we calculate the frame rate every second
        else if (timeInterval >= 1000) {
          this.$store.commit("setFps", { fps: 1000 * this.fpsCount, interval: timeInterval})
          this.time = Date.now()
          this.fpsCount = 0
        }

        this.predictions = await this.identifyObjects()
        
        this.canvas.clear()

        const out = this.sort.update(this.predictions)

        this.$store.commit("setIdentifiedObjects", out.map(trk => {
          return {
            id: trk.id,
            class: trk.class
            }
        }))

        out.forEach((element) => {
          this.drawPrediction(
            // translate and scale to fit video size in the window
            this.sumOffset(
              this.scaleCoordinates(element.tracker)
            )
          )
        })

        this.canvas.renderAll()
        this.fpsCount ++
      }

      if (this.inferMode === "auto") requestAnimationFrame(this.drawBbox)

    },

    drawPrediction(prediction) {
      this.createRect(
        prediction.x,
        prediction.y,
        prediction.width,
        prediction.height
      )
    },

    createRect(x = 50, y = 300, width = 50, height = 50) {
      const rect = new fabric.Rect({
        left: x,
        top: y,
        fill: "transparent",
        stroke: "yellow",
        strokeWidth: 3,
        width: width,
        height: height
      })
      this.canvas.add(rect)

      return(rect)
    },

    updateRect(x, y, rect) {
      rect.set( {
        left: x,
        top: y,
        }
      )
      this.canvas.renderAll()
    },

    playPause() {
          if(this.playing) {
              this.videoStream.pause()
          }
          else this.videoStream.play()
    },

    testKalman() {
      const z0 = this.debugMeasures[0]
      const tracker = new sort.SortTracker(z0)
      console.log(z0)
      this.debugMeasures.slice(1).forEach((element, index) => {
        tracker.predict()
        console.log(index)
        console.log(tracker.getState())
        console.log(element)
        tracker.update(element)
        console.log(tracker.getState())
      })
      
      // saving the result in order to compare with know estimations
      // we create the structure for the json to be easily readable in python
      const history = {}
      for (var i = 0; i < tracker.history.length; i++) {
        history[i] = tracker.history[i]
      }

      // and download the file
      var blob = new Blob([JSON.stringify(history)], {type: "application/json"});
      saveAs(blob, "estimations.txt");
    },
    
    testIou() {
      // we want to minimize cost => maximize IoU
      const test = new sort.Sort()
      this.debugMatches.detections.forEach((frame, index) => {
        const keys = Object.keys(frame)
        const detections = []
        keys.forEach(index => {
          detections.push(frame[index])
        })
        
        console.log("frame = " + (index + 1))
        // console.log(detections)
        console.log(test.update(detections))
        console.log(test.trackers.map(trk => trk.id))
      })
      console.log(test)  
    },

    async testSort() {
      console.log("debug SORT")
    }
  },
}

</script>

<style>
.publisherCanvas{
  z-index: 100;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
