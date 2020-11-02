<template>
  <section class="about">
    <h2>我是关于页面</h2>
    <h2>{{ data }}</h2>
  </section>
</template>

<script>
export default {
  name: 'about',
  data() {
    return {
      data: '',
    }
  },
  components: {},
  watch: {},
  mounted() {
    setTimeout(() => {
      // if (window['__PRERENDER_INJECTED']) {
      //   return
      // }
      this.data = '我是异步渲染出来的数据'
      // this.$nextTick(() => {
      //   document.dispatchEvent(new Event('render-event'))
      // })
    }, 3000)
  },
  methods: {},
}
</script>