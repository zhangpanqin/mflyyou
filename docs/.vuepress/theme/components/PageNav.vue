<template>
    <div v-if="prev || next" class="page-nav">
        <p class="inner">
            <span v-if="prev" class="prev">
                ←
                <a v-if="prev.type === 'external'" class="prev" :href="prev.path" target="_blank" rel="noopener noreferrer">
                    {{ prev.title || prev.path }}
                    <OutboundLink />
                </a>

                <RouterLink v-else class="prev" :to="prev.path">
                    {{ prev.title || prev.path }}
                </RouterLink>
            </span>

            <span v-if="next" class="next">
                <a v-if="next.type === 'external'" :href="next.path" target="_blank" rel="noopener noreferrer">
                    {{ next.title || next.path }}
                    <OutboundLink />
                </a>

                <RouterLink v-else :to="next.path">
                    {{ next.title || next.path }}
                </RouterLink>
                →
            </span>
        </p>
    </div>
</template>

<script>
export default {
    name: 'PageNav',

    props: ['sidebarItems',],

    inject: ['prev', 'next']
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'

.page-nav
  @extend $wrapper
  padding-top 1rem
  padding-bottom 0
  .inner
    min-height 2rem
    margin-top 0
    border-top 1px solid $borderColor
    padding-top 1rem
    overflow auto // clear float
  .next
    float right
</style>
