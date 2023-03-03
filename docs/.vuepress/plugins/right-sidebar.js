module.exports = (options, ctx) => ({
    extendPageData($page) {
        const { frontmatter } = $page;

        $page.right_sidebar_active = true;

        if (
            frontmatter.right_sidebar_active == "false" ||
            frontmatter.right_sidebar_active == false
        ) {
            $page.right_sidebar_active = false;
        }
    },
});
