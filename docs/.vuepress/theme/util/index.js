export {
    resolveSidebarItems,
    groupHeaders,
    resolvePage,
    isActive,
    hashRE,
} from "@parent-theme/util";
import isString from "lodash/isString";
import isNil from "lodash/isNil";

function resolvePrev(page, items) {
    return find(page, items, -1);
}

function resolveNext(page, items) {
    return find(page, items, 1);
}

export const LINK_TYPES = {
    NEXT: {
        resolveLink: resolveNext,
        getThemeLinkConfig: ({ nextLinks }) => nextLinks,
        getPageLinkConfig: ({ frontmatter }) => frontmatter.next,
    },
    PREV: {
        resolveLink: resolvePrev,
        getThemeLinkConfig: ({ prevLinks }) => prevLinks,
        getPageLinkConfig: ({ frontmatter }) => frontmatter.prev,
    },
};

export function resolvePageLink(
    linkType,
    { $themeConfig, $page, $route, $site, sidebarItems }
) {
    const { resolveLink, getThemeLinkConfig, getPageLinkConfig } = linkType;
    // Get link config from theme
    const themeLinkConfig = getThemeLinkConfig($themeConfig);

    // Get link config from current page
    const pageLinkConfig = getPageLinkConfig($page);

    // Page link config will overwrite global theme link config if defined
    const link = isNil(pageLinkConfig) ? themeLinkConfig : pageLinkConfig;

    if (link === false) {
        return;
    } else if (isString(link)) {
        return resolvePage($site.pages, link, $route.path);
    } else {
        return resolveLink($page, sidebarItems);
    }
}

function find(page, items, offset) {
    const res = [];
    flatten(items, res);
    for (let i = 0; i < res.length; i++) {
        const cur = res[i];
        if (cur.type === "page" && cur.path === decodeURIComponent(page.path)) {
            return res[i + offset];
        }
    }
}

function flatten(items, res) {
    for (let i = 0, l = items.length; i < l; i++) {
        if (items[i].type === "group") {
            flatten(items[i].children || [], res);
        } else {
            res.push(items[i]);
        }
    }
}
