<template>
    <div id="video-player">
        <video 
            ref="video"
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
    async mounted() {
        // send and empty video to tracking in order to avoid vuejs error
        this.videoStream = this.$refs.video
        // substitute when test video is ready
        this.videoStream = await new Promise(resolve => {
            this.$refs.video.onloadeddata = () => {
                this.$refs.video.onplay = this.startProcessing
                this.$refs.video.onpause = this.stopProcessing
                this.$refs.video.play()
                resolve(this.$refs.video)
            }
            this.$refs.video.crossOrigin = "anonymous"
            this.$refs.video.muted = true
            this.$refs.video.loop = false
            this.$refs.video.type = "video/mp4"
            this.$refs.video.src = "http://localhost:8081/test.mp4"
        })

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