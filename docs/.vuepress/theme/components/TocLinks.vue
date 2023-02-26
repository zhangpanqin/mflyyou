<template>
    <DropdownTransition>
        <ul class="toc-sidebar-links" v-if="items[0].children.length">
            <li v-for="(item, i) in items[0].children" :key="i">
                <TocLink :sidebarDepth="sidebarDepth" :item="item" />
            </li>
        </ul>
    </DropdownTransition>
</template>

<script>
import TocLink from '@theme/components/TocLink.vue'
import DropdownTransition from '@parent-theme/components/DropdownTransition.vue'
import { isActive } from '@parent-theme/util'

export default {
    name: 'TocLinks',

    components: { TocLink, DropdownTransition },

    props: [
        'items',
        'depth',  // depth of current sidebar links
        'sidebarDepth' // depth of headers to be extracted
    ],

    data() {
        return {
            openGroupIndex: 0
        }
    },

    created() {
        this.refreshIndex()
    },

    watch: {
        '$route'() {
            this.refreshIndex()
        }
    },

    methods: {
        refreshIndex() {
            const index = resolveOpenGroupIndex(
                this.$route,
                this.items[0].children
            )
            if (index > -1) {
                this.openGroupIndex = index
            }
        },

        toggleGroup(index) {
            this.openGroupIndex = index === this.openGroupIndex ? -1 : index
        },

        isActive(page) {
            return isActive(this.$route, page.regularPath)
        }
    }
}

function resolveOpenGroupIndex(route, items) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (descendantIsActive(route, item)) {
            return i
        }
    }
    return -1
}

function descendantIsActive(route, item) {
    if (item.type === 'group') {
        return item.children.some(child => {
            if (child.type === 'group') {
                return descendantIsActive(route, child)
            } else {
                return child.type === 'page' && isActive(route, child.path)
            }
        })
    }
    return false
}
</script>
