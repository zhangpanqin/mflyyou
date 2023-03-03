module.exports = (options, ctx) => ({
    extendPageData($page) {
        const { frontmatter } = $page;

        $page.right_sidebar_active = true;

        if (!frontmatter.right_sidebar_active) {
            $page.right_sidebar_active = false;
        }
    },
});
