<template>
  <!-- Modal Overlay -->
  <div v-if="dialog" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="closeModal"
      ></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900">
                {{ isEditing ? 'Edit Crawl' : 'Create New Crawl' }}
          </h2>
          <button
            @click="closeModal"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Stepper -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <!-- Step 1 -->
            <div class="flex items-center">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              ]">
                <svg v-if="currentStep > 1" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span v-else>1</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">Basic Info</p>
                <p class="text-xs text-gray-500">Crawl details</p>
              </div>
            </div>

            <!-- Connector -->
            <div class="flex-1 h-0.5 bg-gray-200 mx-4"></div>

            <!-- Step 2 -->
            <div class="flex items-center">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              ]">
                <svg v-if="currentStep > 2" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span v-else>2</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">URLs</p>
                <p class="text-xs text-gray-500">Target websites</p>
              </div>
            </div>

            <!-- Connector -->
            <div class="flex-1 h-0.5 bg-gray-200 mx-4"></div>

            <!-- Step 3 -->
            <div class="flex items-center">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              ]">
                <svg v-if="currentStep > 3" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span v-else>3</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">Selectors</p>
                <p class="text-xs text-gray-500">Data extraction</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 max-h-96 overflow-y-auto">
          <!-- Step 1: Basic Info -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Crawl Title *
              </label>
              <input
                                    v-model="title"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a descriptive title for your crawl"
                                    required
              />
              <p v-if="!title && showValidation" class="mt-1 text-sm text-red-600">
                Title is required
              </p>
            </div>

            <div v-if="isEditing" class="flex items-center">
              <input
                                    v-model="disabled"
                type="checkbox"
                id="disabled"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="disabled" class="ml-2 text-sm text-gray-700">
                Disable this crawl (will not run in global run)
              </label>
            </div>
          </div>

          <!-- Step 2: URLs -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URLs *
              </label>
              <textarea
                                    v-model="urlsText"
                rows="6"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter URLs separated by spaces or new lines"
              ></textarea>
              <p class="mt-1 text-sm text-gray-500">
                Enter URLs separated by spaces or new lines
              </p>
              <p v-if="urlValidationError" class="mt-1 text-sm text-red-600">
                {{ urlValidationError }}
              </p>
            </div>
          </div>

          <!-- Step 3: Selectors -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Selectors</h3>
              <div class="space-y-4">
                <CssSelector
                  v-for="selector in currentSelectors"
                  :key="selector.id"
                  :selector="selector"
                  @removeSelector="removeCurrentSelectorHandler"
                  @updateSelector="updateCurrentSelectorHandler"
                />
                <button
                  @click="addNewSelector"
                  class="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <svg class="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add New Selector
                </button>
              </div>
            </div>

            <div v-if="domainLoading" class="flex justify-center items-center py-4">
              <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <div v-else class="space-y-4">
              <div v-if="domainError" class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {{ domainError }}
              </div>
              <div
                v-if="domainInfo"
                :class="[
                  'p-4 rounded-lg border text-sm',
                  domainInfo.hasSelectors ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                ]"
              >
                <p class="font-semibold">Domain: {{ domainInfo.domain }}</p>
                <p v-if="domainInfo.hasSelectors">Default selectors found for this domain.</p>
                <p v-else>No default selectors found for this domain.</p>
              </div>

              <div v-if="domainInfo?.hasSelectors" class="mt-6">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Default Selectors for {{ domainInfo.domain }}</h4>
                <div class="space-y-4">
                  <div
                    v-for="selector in localSelectors"
                    :key="selector.id"
                    class="flex flex-wrap items-start gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div class="flex-1 min-w-0">
                      <CssSelector
                        :selector="selector"
                        :showRemoveButton="false"
                        @updateSelector="updateDomainSelectorHandler"
                      />
                    </div>
                    <button
                      type="button"
                      @click="addDomainSelectorToCurrent(selector)"
                      class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                    >
                      Add to Current
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <details class="mt-6 group">
              <summary class="cursor-pointer text-sm font-semibold text-gray-700 list-none flex items-center gap-2">
                <span class="group-open:rotate-90 transition-transform inline-block">▶</span>
                Advanced
              </summary>
              <div class="mt-3 pl-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Advanced CSS Selectors (one per line)</label>
                <textarea
                  v-model="advancedSelectorsText"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g. .captcha-container"
                />
                <p class="mt-1 text-xs text-gray-500">Used to scope captcha checks. If a captcha is inside any of these, it will be ignored.</p>
              </div>
            </details>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <div v-else></div>

          <div class="flex items-center space-x-3">
            <button
              @click="closeModal"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <!-- Update: visible on every step, only when editing -->
            <button
              v-if="isEditing"
              @click="saveCrawl"
              :disabled="isLoading"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>{{ isLoading ? 'Updating...' : 'Update Crawl' }}</span>
            </button>

            <!-- Next: steps 1–2, always visible for navigation -->
            <button
              v-if="currentStep < 3"
              @click="nextStep"
              class="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Next
            </button>

            <!-- Create: step 3 only, only when not editing -->
            <button
              v-if="currentStep === 3 && !isEditing"
              @click="saveCrawl"
              :disabled="isLoading || !!domainError"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>{{ isLoading ? 'Creating...' : 'Create Crawl' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useApiService } from '../../composables/useApiService'
import { useCrawlActions } from '../../composables/useCrawlActions'
import { isValidUrl } from '../../utils/urlUtils'
import CssSelector from '../forms/CssSelector.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    crawlData: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'crawl-created'])

const { post, put } = useApiService()
const { getDomainSelectors } = useCrawlActions()

// Modal state
const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.crawlData)
const isLoading = ref(false)
const showValidation = ref(false)

// Form data
const currentStep = ref(1)
const title = ref('')
const disabled = ref(false)
const urlsText = ref('')
const currentSelectors = ref([])
const urlValidationError = ref('')

// Domain selectors state
const domainLoading = ref(false)
const domainError = ref('')
const domainInfo = ref(null)
const localSelectors = ref([])
const advancedSelectorsText = ref('')

const uniqueId = () => `selector-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// Initialize form when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeForm()
  }
})

const initializeForm = () => {
  currentStep.value = 1
  showValidation.value = false
  urlValidationError.value = ''
  domainError.value = ''
  domainInfo.value = null
  localSelectors.value = []

  if (props.crawlData) {
    title.value = props.crawlData.title || ''
    disabled.value = props.crawlData.disabled || false
    urlsText.value = (props.crawlData.urls || []).join('\n')
    currentSelectors.value = (props.crawlData.selectors || []).map((selector, index) => {
      const childSelectors = (selector.childSelectors || []).map((child, i) => ({
        id: `child-${index}-${i}`,
        name: child.target_element || child.name || '',
        selector: child.selector_value || child.selector || '',
        type: child.type || 'text',
        attribute: child.attribute ?? null
      }))
      const hasChildren = childSelectors.length > 0
      return {
        id: `selector-${index}`,
        name: selector.target_element || '',
        selector: selector.selector_value || '',
        type: hasChildren ? 'container' : (selector.type || 'text'),
        attribute: selector.attribute ?? null,
        childSelectors
      }
    })
    advancedSelectorsText.value = (props.crawlData.advancedSelectors || []).join('\n')
  } else {
    title.value = ''
    disabled.value = false
    urlsText.value = ''
    currentSelectors.value = []
    advancedSelectorsText.value = ''
  }
}

const parseUrls = (text) => {
  return text.split(/[\s\n]+/).map(u => u.trim()).filter(url => url.length > 0)
}

const extractDomain = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

const checkDomainConsistency = (urls) => {
  const domains = urls.map(url => extractDomain(url)).filter(Boolean)
  if (domains.length === 0) return null
  const first = domains[0]
  return domains.every(d => d === first) ? first : null
}

const validateUrls = () => {
  const urls = parseUrls(urlsText.value)
  if (urls.length === 0) {
    urlValidationError.value = 'Please enter at least one URL'
    return false
  }
  const invalidUrls = urls.filter(url => !isValidUrl(url))
  if (invalidUrls.length > 0) {
    urlValidationError.value = `Invalid URL(s): ${invalidUrls.join(', ')}`
    return false
  }
  urlValidationError.value = ''
  return true
}

const fetchDomainSelectors = async (domain) => {
  const result = await getDomainSelectors(domain)
  const transformed = (result.selectors || []).map(s => ({
    id: uniqueId(),
    name: s.name || '',
    selector: s.selector || '',
    type: s.type || 'text',
    attribute: s.attribute ?? null,
    childSelectors: (s.childSelectors || []).map(c => ({
      name: c.name || '',
      selector: c.selector || '',
      type: c.type || 'text',
      attribute: c.attribute ?? null
    }))
  }))
  localSelectors.value = transformed
  return { domain: result.domain, hasSelectors: result.hasSelectors }
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!title.value.trim()) {
      showValidation.value = true
      return
    }
    currentStep.value++
    return
  }
  if (currentStep.value === 2) {
    if (!validateUrls()) return
    const urls = parseUrls(urlsText.value)
    const domain = checkDomainConsistency(urls)
    if (!domain) {
      domainError.value = 'All URLs must be from the same domain'
      return
    }
    domainLoading.value = true
    domainError.value = ''
    domainInfo.value = null
    try {
      domainInfo.value = await fetchDomainSelectors(domain)
    } catch {
      domainError.value = 'Error checking domain selectors'
      domainInfo.value = { domain, hasSelectors: false }
    } finally {
      domainLoading.value = false
      currentStep.value++
    }
    return
  }
  currentStep.value++
}

const previousStep = () => {
  currentStep.value--
  if (currentStep.value === 2) {
    domainError.value = ''
    domainInfo.value = null
    localSelectors.value = []
  }
}

const updateCurrentSelectorHandler = ({ selector: s }) => {
  const idx = currentSelectors.value.findIndex(x => x.id === s.id)
  if (idx === -1) return
  currentSelectors.value[idx] = {
    ...currentSelectors.value[idx],
    name: s.name,
    selector: s.css ?? s.selector,
    type: s.type,
    attribute: s.attribute,
    childSelectors: s.childSelectors || []
  }
}

const updateDomainSelectorHandler = ({ selector: s }) => {
  const idx = localSelectors.value.findIndex(x => x.id === s.id)
  if (idx === -1) return
  localSelectors.value[idx] = {
    ...localSelectors.value[idx],
    name: s.name,
    selector: s.css ?? s.selector,
    type: s.type,
    attribute: s.attribute,
    childSelectors: s.childSelectors || []
  }
}

const removeCurrentSelectorHandler = (id) => {
  currentSelectors.value = currentSelectors.value.filter(s => s.id !== id)
}

const addDomainSelectorToCurrent = (selector) => {
  const css = selector.selector || selector.css || ''
  const exists = currentSelectors.value.some(
    s => s.name === selector.name && (s.selector === css || s.css === css)
  )
  if (exists) return
  currentSelectors.value.push({
    id: uniqueId(),
    name: selector.name || '',
    selector: selector.selector || selector.css || '',
    type: selector.type || 'text',
    attribute: selector.attribute ?? null,
    childSelectors: (selector.childSelectors || []).map(c => ({
      name: c.name || '',
      selector: c.selector || '',
      type: c.type || 'text',
      attribute: c.attribute ?? null
    }))
  })
}

const addNewSelector = () => {
  currentSelectors.value.push({
    id: uniqueId(),
    name: '',
    selector: '',
    type: 'text',
    attribute: null,
    childSelectors: []
  })
}

const validateSelectors = () => {
  if (currentSelectors.value.length === 0) return false
  const empty = currentSelectors.value.some(s => !(s.name || '').trim() || !(s.selector || s.css || '').trim())
  return !empty
}

const closeModal = () => {
  dialog.value = false
}

const saveCrawl = async () => {
  if (!title.value.trim()) {
    showValidation.value = true
    return
  }
  if (!validateUrls()) {
    currentStep.value = 2
    return
  }
  if (!validateSelectors()) {
    return
  }

  isLoading.value = true
  try {
    const urls = parseUrls(urlsText.value)
    const selectors = currentSelectors.value
      .filter(s => (s.name || '').trim() && (s.selector || s.css || '').trim())
      .map(s => ({
        target_element: s.name,
        selector_value: s.selector || s.css,
        type: s.type || 'text',
        attribute: s.attribute || null,
        childSelectors: (s.childSelectors || []).map(c => ({
          target_element: c.name,
          selector_value: c.selector,
          type: c.type || 'text',
          attribute: c.attribute || null
        }))
      }))
    const advancedSelectors = advancedSelectorsText.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const crawlData = {
      title: title.value.trim(),
      urls,
      selectors,
      advancedSelectors,
      disabled: disabled.value
    }

    const response = isEditing
      ? await put(`/api/updatecrawl/${props.crawlData._id}`, crawlData)
      : await post('/api/createcrawler', crawlData)

    emit('crawl-created', response?.crawl ?? response?.data ?? response)
    closeModal()
  } catch (error) {
    console.error('Error saving crawl:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
