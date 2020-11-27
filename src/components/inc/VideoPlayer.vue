<template>
    <div id="video-player">
        <video 
            ref="video"
            src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
            crossorigin="anonymous"
            muted
            autoplay
        >
        </video>

        <Tracking 
            :videoStream = "videoStream"
            :playing = "playing"
        >
        </Tracking>
    </div>
</template>

<script>
import Tracking from "./Tracking.vue"

export default {
    name: "VideoPlayer",
    components: {
        Tracking,
    },
    data: () => ({
        videoStream: null,
        playing: false,
    }),
    mounted() {
        this.videoStream = this.$refs.video
        this.videoStream.onloadeddata = () => {
            this.videoStream.currentTime = 40
            this.videoStream.onplay = this.startProcessing
            this.videoStream.onpause = this.stopProcessing
        }
    },
    methods: {
        startProcessing() {
            this.playing = true
        },
        stopProcessing() {
            this.playing = false
        }
    }

}
</script>

<style>
    #video-player{
        top: 0%;
        width: 70%;
        height: 100%;
        position: fixed;
    }

    video {
        z-index: 50;
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
    }
</style>