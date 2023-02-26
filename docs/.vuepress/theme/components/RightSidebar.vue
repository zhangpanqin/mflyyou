<template>
    <aside class="page-sidebar">
        <slot name="top" />
        <div class="toc-container-sidebar" ref="tocc">
            <div class="pos-box">
                <div class="icon-arrow"></div>
                <div class="scroll-box" style="max-height:650px">
                    <div style="font-weight:bold;text-align:center;">{{ pageSidebarItems[0].title }}</div>
                    <hr />
                    <div class="toc-box">
                        <TocLinks :depth="0" :items="pageSidebarItems" :sidebarDepth="3" />
                    </div>
                </div>
            </div>
        </div>
        <div class="page-side-toolbar">
            <div class="option-box-toc-over" v-on:mouseover="showTocOver($event)" v-on:mouseout="hideTocOver($event)">
                <img src="/images/system/toc.png" class="nozoom" />
                <span class="show-txt">目录</span>
            </div>

            <div class="option-box" @click="$emit('toggle-sidebar-force')">
                <img src="/images/system/toggle.png" width="30px" class="nozoom" />
                <span class="show-txt">左栏</span>
            </div>

            <div class="option-box" v-if="prev" style="padding-left:2px;text-align:center;" v-bind:title="prev.title">
                <router-link v-if="prev" :to="prev.path">
                    <img src="/images/system/pre2.png" width="30px" class="nozoom" />
                    <span class="show-txt">上一篇</span>
                </router-link>
            </div>
            <div class="option-box" v-if="next" style="padding-left:2px;text-align:center;" v-bind:title="next.title">
                <router-link v-if="next" :to="next.path">
                    <img src="/images/system/next2.png" width="30px" class="nozoom" />
                    <span class="show-txt">下一篇</span>
                </router-link>
            </div>
        </div>
        <slot name="middle" />

        <slot name="bottom" />
    </aside>
</template>

<script>
import TocLinks from '@theme/components/TocLinks.vue'
import { resolvePage } from '@vuepress/theme-default/util'

export default {
    name: 'PageSidebar',

    components: { TocLinks, },

    props: ['pageSidebarItems', 'sidebarItems'],

    computed: {
        showPageToc() {
            return true;
        },
        prev() {
            const prev = this.$page.frontmatter.prev
            if (prev === false) {
                return
            } else if (prev) {
                return resolvePage(this.$site.pages, prev, this.$route.path)
            } else {
                return resolvePrev(this.$page, this.sidebarItems)
            }
        },

        next() {
            const next = this.$page.frontmatter.next
            if (next === false) {
                return
            } else if (next) {
                return resolvePage(this.$site.pages, next, this.$route.path)
            } else {
                return resolveNext(this.$page, this.sidebarItems)
            }
        }
    },

    methods: {
        showToc($event) {
            $event.currentTarget.className = "option-box on";
        },
        hideToc($event) {
            $event.currentTarget.className = "option-box";
        },
        showTocOver($event) {
            $event.currentTarget.className = "option-box-toc-over on";
        },
        hideTocOver($event) {
            $event.currentTarget.className = "option-box-toc-over";
        }
    }

}

function resolvePrev(page, items) {
    return find(page, items, -1)
}

function resolveNext(page, items) {
    return find(page, items, 1)
}

function find(page, items, offset) {
    const res = []
    flatten(items, res)
    for (let i = 0; i < res.length; i++) {
        const cur = res[i]
        if (cur.type === 'page' && cur.path === decodeURIComponent(page.path)) {
            return res[i + offset]
        }
    }
}

function flatten(items, res) {
    for (let i = 0, l = items.length; i < l; i++) {
        if (items[i].type === 'group') {
            flatten(items[i].children || [], res)
        } else {
            res.push(items[i])
        }
    }
}
</script>

<style lang="stylus">
.page-sidebar
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

.toc-container-sidebar
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

.toc-container
  display: none;
  position: absolute;
  color $textColor
  left: 100%;
  top: -1px;
  margin-left: 16px;
  width: 240px;
  background: #fff;
  border: 1px solid #eee;
  // -webkit-box-shadow: 0 1px 1px 0 rgba(0,0,0,0.1);
  // box-shadow: 0 1px 1px 0 rgba(0,0,0,0.1);
  // border-radius: 4px;
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
        max-height: 500px;
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

.page-side-toolbar
  position fixed
  right 10px
  top 70px !important
  width 44px
  div.option-box:last-child
    border-top 0px solid #eee
  div.option-box.on
    .toc-container
      display block
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
  div.option-box-toc-over
    font-size 12px
    position relative
    display none
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
    .toc-container
      margin-right 0
  div.option-box-toc
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
  div.option-box-toc-over:hover
    color white
    background #eee
  div.option-box-toc-over.on
    .toc-container
      display block
  div.option-box-toc
    display none


@media (max-width: $MQNarrow)
  .toc-container-sidebar
    display none
  .option-box-toc
    display none
  .page-side-toolbar
    right 6px
    top 65px !important
    div.option-box-toc-over
      display flex
  .page-side-sitemap
    right 6px

@media (max-width: $MQMobile)
  .toc-container-sidebar
    display none
  .page-sidebar
    display none
  .sidebar
    .nav-links
      display block
      .dropdown-wrapper .nav-dropdown .dropdown-item a.router-link-active::after
        top calc(1rem - 2px)
    & > .sidebar-links
      padding 1rem 0
</style>
