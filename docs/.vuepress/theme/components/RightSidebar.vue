<template>
    <aside class="right-sidebar">
        <slot name="top" />
        <div class="right-sidebar-toc-container" ref="tocc" v-show="showTocContainer">
            <div class="pos-box">
                <div class="icon-arrow"></div>
                <div class="scroll-box" style="max-height:650px">
                    <div style="font-weight:bold;text-align:center;">{{ tocContent.title }}</div>
                    <hr />
                    <div class="toc-box">
                        <TocLinks :items="tocContent" :sidebarDepth="3" />
                    </div>
                </div>
            </div>
        </div>
        <div class="right-sidebar-toolbar">
            <div class="option-box" @click="toggleShowTocContainer">
                <img src="/images/system/toc.png" class="nozoom" />
                <span class="show-txt">目录</span>
            </div>

            <div class="option-box" @click="$emit('toggle-sidebar')">
                <img src="/images/system/toggle.png" width="30px" class="nozoom" />
                <span class="show-txt">左栏</span>
            </div>

            <div class="option-box" v-if="prev" style="padding-left:2px;text-align:center;" :title="prev.title">
                <RouterLink :to="prev.path">
                    <img src="/images/system/pre2.png" width="30px" class="nozoom" />
                    <span class="show-txt">上一篇</span>
                </RouterLink>
            </div>
            <div class="option-box" v-if="next" style="padding-left:2px;text-align:center;" :title="next.title">
                <RouterLink :to="next.path">
                    <img src="/images/system/next2.png" width="30px" class="nozoom" />
                    <span class="show-txt">下一篇</span>
                </RouterLink>
            </div>
        </div>
        <slot name="bottom" />
    </aside>
</template>

<script>
import TocLinks from '@theme/components/TocLinks.vue'
import { groupHeaders } from '@theme/util'
export default {
    name: 'RightSidebar',
    components: { TocLinks, },
    inject: ['prev', 'next'],
    data() {
        return {
            showTocContainer: true
        }
    },
    computed: {
        tocContent() {
            const page = this.$page
            const headers = groupHeaders(page.headers || [])
            console.log({
                type: 'group',
                collapsable: false,
                title: page.title,
                path: null,
                children: headers.map(h => ({
                    type: 'auto',
                    title: h.title,
                    basePath: page.path,
                    path: page.path + '#' + h.slug,
                    children: h.children || []
                }))
            })
            return {
                type: 'group',
                collapsable: false,
                title: page.title,
                path: null,
                children: headers.map(h => ({
                    type: 'auto',
                    title: h.title,
                    basePath: page.path,
                    path: page.path + '#' + h.slug,
                    children: h.children || []
                }))
            }
        },
    },
    methods: {
        toggleShowTocContainer() {
            this.showTocContainer = !this.showTocContainer
        }
    }

}
</script>

<style lang="stylus">
.right-sidebar
  font-size 12px
  width 3.8rem
  position fixed
  z-index 11
  margin 0
  top 3.6rem
  right 0
  bottom 0
  box-sizing border-box
  border-left 0px solid #eaecef
  ul
    margin 0
  a
    display inline-block
  .nav-links
    display none
    border-bottom 1px solid $borderColor
    padding 0.5rem 0 0.75rem 0
    a
      font-weight 600
    .nav-item, .repo-link
      display block
      line-height 1.25rem
      font-size 1.1em
      padding 0.5rem 0 0.5rem 1.5rem
  & > .sidebar-links
    padding 1.5rem 0
    & > li > a.sidebar-link
      font-size 1.1em
      line-height 1.4
      font-weight bold
    & > li:not(:first-child)
      margin-top .75rem

.right-sidebar-toc-container
  display: block;
  position: absolute;
  color $textColor
  left: 100%;
  top: 0px;
  margin-left: 16px;
  width: 240px;
  background: #fff;
  left: unset;
  right: 100%;
  margin-right: 10px;
  margin-left: 0;
  .on
    display: block;
  .pos-box
    position: relative;
    padding: 16px;
    .icon-arrow
      position: relative;
      margin-left: -20px;
    .scroll-box
      overflow-x: hidden;
      overflow-y: hidden;
      hr
        margin-top: 0.5rem
      .toc-box
        max-height:600px;
        overflow-y: auto;
        overflow-x: hidden;
        width: 238px;
        padding-right: 16px;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
      & > ol
        margin-top: -8px;
        li
          margin-top: 8px;
          line-height: 17px;
          text-align: left;
          overflow: auto;
          text-overflow: ellipsis;
          font-size: 12px;
          white-space: nowrap;
        .sub-box
          margin-top: 0;
        & > ol > li
          padding-left: 15px;

.right-sidebar-toolbar
  position fixed
  right 10px
  top 70px !important
  width 44px
  div.option-box:last-child
    border-top 0px solid #eee
  div.option-box
    font-size 12px
    position relative
    display -webkit-box
    display -ms-flexbox
    display flex
    -webkit-box-orient vertical
    -webkit-box-direction normal
    -ms-flex-direction column
    flex-direction column
    -webkit-box-align center
    -ms-flex-align center
    align-items center
    -webkit-box-pack center
    -ms-flex-pack center
    justify-content center
    border-bottom 1px solid #eee
    background-color #fff
    height 60px
    cursor pointer
    .img
      margin-top 2px
    .show-txt
      color gray
      margin-top 3px
      font-size 11px
  div.option-box:hover
    color white
    background #eee



@media (max-width: $MQNarrow)
  .right-sidebar-toolbar
    right 6px
    top 65px !important
    div:first-child
     display none
  .right-sidebar-toc-container
    display none

@media (max-width: $MQMobile)
  .right-sidebar
    display none
</style>
