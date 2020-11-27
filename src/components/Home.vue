<template>
  <div>
    <VideoPlayer/>

    <Menu/>
    
    <StatWin/>
  </div>
</template>

<script>
import Menu from "./inc/Menu.vue"
import StatWin from "./inc/StatWin.vue"
import VideoPlayer from "./inc/VideoPlayer.vue"

export default {
  name: 'Home',
  components: {
    Menu,
    StatWin,
    VideoPlayer,
  }
}
</script>

<style>
</style>
