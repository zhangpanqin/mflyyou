interface IMflyyouConfig {
    base?: `/${string}/`;
}

const VUEPRESS_MODE = process.env.VUEPRESS_MODE;

export const MflyyouConfig: IMflyyouConfig = getMflyyouConfig();

function getMflyyouConfig(): IMflyyouConfig {
    if (!VUEPRESS_MODE) {
        console.error("配置环境变量 VUEPRESS_MODE : 取值 github 或者 mflyyou ");
        process.exit();
    }
    if (VUEPRESS_MODE == 'github') {
        return {
            base: "/mflyyou/"
        };
    }
    return {
    };
}
