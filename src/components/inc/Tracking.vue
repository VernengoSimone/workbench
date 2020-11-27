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
import '@tensorflow/tfjs'
import * as cocoSsd from "@tensorflow-models/coco-ssd"

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
    rect: null,
    model: null,
    videoRatio: null,
    canvasRatio: null,
    videoDimensions: {
      width: null,
      height: null,
    },
    videoOffset: {
      x: null,
      y: null,
    }
  }),
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
      this.canvas.setHeight(this.$refs.publisherCanvas.clientHeight);
      this.canvas.setWidth(this.$refs.publisherCanvas.clientWidth);
    },

    async initCoco(){
      this.model = await cocoSsd.load()

      /*
      in order to draw the bboxes in the right place we need
      the actual space occupied by the video and dimensions (offset) of
      the black bars
      */
      this.computeVideoDimension()
      this.computeOffset()

      // use setInterval to obtain 5 detection sets per second
      /* setInterval(() => {
        this.drawBbox()
      }, 200) */

      // use requestAnimationFrame to draw every frame
      requestAnimationFrame(this.drawBbox)
    },

    async identifyObjects() {
      return this.model.detect(this.videoStream)
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
        this.videoOffset.y = Math.round((this.canvas.getHeight() - this.videoDimensions.height) / 2)
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
        x: coordinates[0] * (this.videoDimensions.width / this.videoStream.videoWidth),
        y: coordinates[1] * (this.videoDimensions.height / this.videoStream.videoHeight),
        // TODO: this is not what's expected, find why
        width: coordinates[3] * (this.videoDimensions.width / this.videoStream.videoWidth),
        height: coordinates[2] * (this.videoDimensions.height / this.videoStream.videoHeight)
      }
    },

    async drawBbox(){
      if (this.playing) {
        this.clearCanvas()
        
        const predictions = await this.identifyObjects()
        this.$store.commit("setIdentifiedObjects", predictions)

        predictions.forEach((element) => {
          this.drawPrediction(
            this.sumOffset(
              this.scaleCoordinates(element.bbox)
            )
          )
        })
      }
      requestAnimationFrame(this.drawBbox)

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
        width: height,
        height: width
      })
      this.canvas.add(rect)
      this.canvas.renderAll()

      return(rect)
    },

    updateRect(x, y, rect=this.rect) {
      rect.set( {
        left: x,
        top: y,
        }
      )
      this.canvas.renderAll()
    },

    clearCanvas() {
      this.canvas.clear()
    },

    playPause() {
          if(this.playing) {
              this.videoStream.pause()
          }
          else this.videoStream.play()
    },
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
