<template>
    <pre>
        {{ data }}
    </pre>
</template>
<script setup>
    const { data } = defineProps(['data'])
</script>