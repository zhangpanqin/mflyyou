<template>
    <div class="theme-container" :class="pageClasses" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <Navbar v-show="shouldShowNavbar" @toggle-sidebar="toggleSidebar" />

        <div class="sidebar-mask" @click="toggleSidebar(false)" />

        <Sidebar :items="sidebarItems" @toggle-sidebar="toggleSidebar">
            <template #top>
                <slot name="sidebar-top" />
            </template>
            <template #bottom>
                <slot name="sidebar-bottom" />
            </template>
        </Sidebar>

        <Home v-if="$page.frontmatter.home" />

        <Page v-else :sidebar-items="sidebarItems">
            <template #top>
                <slot name="page-top" />
            </template>
            <template #bottom>
                <slot name="page-bottom" />
            </template>
        </Page>

        <RightSidebar @toggle-sidebar-force="toggleSidebarForce">
            <template #top>
                <slot name="right-sidebar-top" />
            </template>
            <template #bottom>
                <slot name="right-sidebar-bottom" />
            </template>
        </RightSidebar>
    </div>
</template>

<script>
import Home from '@parent-theme/components/Home.vue'
import Navbar from '@parent-theme/components/Navbar.vue'
import Sidebar from '@parent-theme/components/Sidebar.vue'
import Page from '@parent-theme/components/Page.vue'
import RightSidebar from '@theme/components/RightSidebar'
import { LINK_TYPES, resolvePageLink, resolveSidebarItems } from '@theme/util'
import { computed } from 'vue'

export default {
    name: 'Layout',

    components: {
        Home,
        Page,
        Sidebar,
        Navbar,
        RightSidebar
    },
    data() {
        return {
            isSidebarOpen: false,
            forceSidebarClose: false,
        }
    },
    provide() {
        return {
            prev: computed(() => this.prev_),
            next: computed(() => this.next_),
        }
    },
    computed: {
        prev_() {
            return resolvePageLink(LINK_TYPES.PREV, this)
        },
        next_() {
            return resolvePageLink(LINK_TYPES.NEXT, this)
        },
        shouldShowNavbar() {
            const { themeConfig } = this.$site
            const { frontmatter } = this.$page
            if (
                frontmatter.navbar === false
                || themeConfig.navbar === false) {
                return false
            }
            return (
                this.$title
                || themeConfig.logo
                || themeConfig.repo
                || themeConfig.nav
                || this.$themeLocaleConfig.nav
            )
        },

        shouldShowSidebar() {
            const { frontmatter } = this.$page
            return (
                !frontmatter.home
                && frontmatter.sidebar !== false
                && this.sidebarItems.length
            )
        },

        sidebarItems() {
            return resolveSidebarItems(
                this.$page,
                this.$page.regularPath,
                this.$site,
                this.$localePath
            )
        },

        pageClasses() {
            const userPageClass = this.$page.frontmatter.pageClass
            return [
                {
                    'no-navbar': !this.shouldShowNavbar,
                    'sidebar-open': this.isSidebarOpen,
                    'no-sidebar': !this.shouldShowSidebar || this.forceSidebarClose
                },
                userPageClass
            ]
        }
    },

    mounted() {
        this.$router.afterEach(() => {
            this.isSidebarOpen = false
        })
    },

    methods: {
        toggleSidebarForce() {
            this.forceSidebarClose = !this.forceSidebarClose
        },
        toggleSidebar(to) {
            this.isSidebarOpen = typeof to === 'boolean' ? to : !this.isSidebarOpen
            this.$emit('toggle-sidebar', this.isSidebarOpen)
        },

        onTouchStart(e) {
            this.touchStart = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            }
        },

        onTouchEnd(e) {
            const dx = e.changedTouches[0].clientX - this.touchStart.x
            const dy = e.changedTouches[0].clientY - this.touchStart.y
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
                if (dx > 0 && this.touchStart.x <= 80) {
                    this.toggleSidebar(true)
                } else {
                    this.toggleSidebar(false)
                }
            }
        }
    }
}
</script>
