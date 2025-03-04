import { ref, computed } from "vue";

export function useExcerpts(text, length = 50) {
    const isExpanded = ref(false)

    const excerpt = computed(() => {
        if(text.value.length > length && !isExpanded.value) {
            return text.value.substring(0, length) + '...'
        } else {
            return text.value
        }
    })

    const toggleExpand = () => {
        isExpanded.value = !isExpanded.value
        // console.log(isExpanded.value)
    }

    return {
        excerpt,
        isExpanded,
        toggleExpand
    }

}