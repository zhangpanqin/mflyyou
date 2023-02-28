<template>
    <main class="page">
        <slot name="top" />
        <Content :name="$page.key" class="theme-default-content" />
        <div>
            <h1>1111122222</h1>
        </div>
        <PageEdit />
        <PageNav :sidebarItems="sidebarItems" :prev="prev" :next="next" />
        <slot name="bottom" />
    </main>
</template>

<script>
import PageEdit from '@parent-theme/components/PageEdit.vue'
import PageNav from '@theme/components/PageNav.vue'

export default {
    name: 'Page',
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
