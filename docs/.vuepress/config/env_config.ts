interface IMflyyouConfig {
    base?: `/${string}/`;
}

export function getMflyyouConfig(): IMflyyouConfig {
    const  vuepressMode = process.env.VUEPRESS_MODE;
    if (!vuepressMode) {
        console.error("配置环境变量 VUEPRESS_MODE : 取值 github 或者 mflyyou ");
        process.exit();
    }
    console.log(vuepressMode)
    console.log(111111111)
    if ("github"==vuepressMode) {
        console.log(1111)
        return {
            base: "/mflyyou/"
        };
    }
    return {
    };
}