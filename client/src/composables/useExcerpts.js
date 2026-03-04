import { ref, computed } from "vue";

/**
 * Composable for creating expandable text excerpts
 * @param {Ref<string>} textRef - Reactive reference to the text
 * @param {number} length - Maximum length before truncation (default: 50)
 * @returns {Object} Object containing excerpt, isExpanded, and toggleExpand
 */
export function useExcerpts(textRef, length = 50) {
    const isExpanded = ref(false)

    const excerpt = computed(() => {
        if (!textRef.value || typeof textRef.value !== 'string') {
            return ''
        }
        
        if (textRef.value.length > length && !isExpanded.value) {
            return textRef.value.substring(0, length) + '...'
        }
        
        return textRef.value
    })

    const toggleExpand = () => {
        isExpanded.value = !isExpanded.value
    }

    const reset = () => {
        isExpanded.value = false
    }

    return {
        excerpt,
        isExpanded,
        toggleExpand,
        reset
    }
}