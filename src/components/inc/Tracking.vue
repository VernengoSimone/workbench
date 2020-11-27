<template>
    <div
      id="publisherCanvas"
      ref="publisherCanvas"
      class="publisherCanvas"
    >
      <canvas
        id="publisher_canvas"
        ref="publisher_canvas"
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

    scaleCoordinates (coordinates) {
      // we expect the coordinates to be in the form [x, y, widht, height]
      return {
        x: coordinates[0] * (this.canvas.getWidth() / this.videoStream.videoWidth),
        y: coordinates[1] * (this.canvas.getHeight() / this.videoStream.videoHeight),
        width: coordinates[1] * (this.canvas.getWidth() / this.videoStream.videoWidth),
        height: coordinates[2] * (this.canvas.getHeight() / this.videoStream.videoHeight)
      }
    },

    async drawBbox(){
      if (this.playing) {
        this.clearCanvas()
        
        const predictions = await this.identifyObjects()
        this.$store.commit("setIdentifiedObjects", predictions)

        predictions.forEach((element) => {
          // console.info(this.videoStream.height)
          // console.info(this.scaleCoordinates(element.bbox))
          this.drawPrediction(
            this.scaleCoordinates(element.bbox)
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
  },
}

</script>

<style>
.publisherCanvas{
  z-index: 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
