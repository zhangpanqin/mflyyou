<template>
    <div>
        <span id="icp">
            Copyright © 2020 - {{ this.year }} 张攀钦 <img src="/mflyyou/beian/icp.png" style="vertical-align: text-bottom;">
            <a href="https://beian.miit.gov.cn" target="_blank">京 ICP 备 18046333 号-1</a>
        </span>
    </div>
</template>
<script>
export default {
    name: 'Beian',
    data() {
        return {
            year: new Date().getFullYear()
        }
    },
}
</script>
