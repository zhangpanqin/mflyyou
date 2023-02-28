<template>
    <main class="page">
        <slot name="top" />

        <!-- <Content class="theme-default-content" /> -->
        <PageEdit />

        <PageNav :sidebarItems="sidebarItems" :prev="prev" :next="next" />

        <slot name="bottom" />
    </main>
</template>

<script>
import PageEdit from '@parent-theme/components/PageEdit.vue'
import PageNav from '@theme/components/PageNav.vue'

export default {
    components: { PageEdit, PageNav },
    props: ['sidebarItems', 'prev', 'next']
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'

.page
  padding-bottom 2rem
  display block

</style>
