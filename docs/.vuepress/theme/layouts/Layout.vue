<template>
    <div class="theme-container" :class="pageClasses" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <Navbar v-if="shouldShowNavbar" @toggle-sidebar="toggleSidebar" />

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

        <RightSidebar v-if="shouldShowPageSidebar" :right-sidebar-items="rightSidebarItems" :sidebar-items="sidebarItems"
            @toggle-sidebar-force="toggleSidebarForce">
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
import Page from '@parent-theme/components/Page.vue'
import Sidebar from '@parent-theme/components/Sidebar.vue'
import { resolveSidebarItems, groupHeaders } from '@vuepress/theme-default/util'
import RightSidebar from '@theme/components/RightSidebar'

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
            isForeCloseSidebar: false,
        }
    },

    computed: {
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

        shouldShowPageSidebar() {
            const { frontmatter } = this.$page

            if (true) {
                return true;
            }

            return (
                !frontmatter.home
                && frontmatter.sidebar !== false
                && this.pageSidebarItems.length
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

        rightSidebarItems() {
            const page = this.$page
            const headers = groupHeaders(page.headers || [])
            return [{
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
            }]
        },

        pageClasses() {
            const userPageClass = this.$page.frontmatter.pageClass
            return [
                {
                    'no-navbar': !this.shouldShowNavbar,
                    'sidebar-open': this.isSidebarOpen && !this.isForeCloseSidebar,
                    'no-sidebar': !this.shouldShowSidebar || this.isForeCloseSidebar
                },
                userPageClass
            ]
        }
    },

    mounted() {
        this.$router.afterEach(() => {
            if (!this.isForeCloseSidebar) {
                this.isSidebarOpen = false
            }
        })
    },

    methods: {
        toggleSidebar(to, foreCloseSidebar) {
            this.isSidebarOpen = typeof to === 'boolean' ? to : !this.isSidebarOpen
            this.isForeCloseSidebar = typeof foreCloseSidebar === 'boolean' ? foreCloseSidebar : false;
            this.$emit('toggle-sidebar', this.isSidebarOpen)
        },

        toggleSidebarForce() {
            this.isSidebarOpen = !this.isSidebarOpen
            this.isForeCloseSidebar = !this.isForeCloseSidebar
            this.$emit('toggle-sidebar-force', this.isSidebarOpen)
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
