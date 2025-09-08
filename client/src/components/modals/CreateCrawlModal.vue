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
                <div
                                            v-for="selector in currentSelectors"
                                            :key="selector.id"
                  class="p-4 border border-gray-200 rounded-lg"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-900">Selector {{ currentSelectors.indexOf(selector) + 1 }}</h4>
                    <button
                      @click="removeCurrentSelector(selector.id)"
                      class="text-red-600 hover:text-red-800 p-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                                    </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Element Name</label>
                      <input
                        v-model="selector.name"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., product-title"
                      />
                                </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">CSS Selector</label>
                      <input
                        v-model="selector.selector"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., .product-title"
                      />
                            </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        v-model="selector.type"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">Text</option>
                        <option value="link">Link</option>
                        <option value="image">Image</option>
                        <option value="table">Table</option>
                        <option value="list">List</option>
                      </select>
                    </div>
                                        <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Attribute (optional)</label>
                      <input
                        v-model="selector.attribute"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., href, src"
                      />
                                            </div>
                                        </div>
                                    </div>
                
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
          
          <div class="flex space-x-3">
            <button
              @click="closeModal"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
            </button>
            <button
                    v-if="currentStep < 3"
              @click="nextStep"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Next
            </button>
            <button
                    v-else
              @click="saveCrawl"
              :disabled="isLoading"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>{{ isLoading ? 'Saving...' : (isEditing ? 'Update Crawl' : 'Create Crawl') }}</span>
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

const { post, put, loading: apiLoading } = useApiService()

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
  
    if (props.crawlData) {
    title.value = props.crawlData.title || ''
    disabled.value = props.crawlData.disabled || false
    urlsText.value = (props.crawlData.urls || []).join('\n')
    currentSelectors.value = (props.crawlData.selectors || []).map((selector, index) => ({
      id: `selector-${index}`,
      name: selector.target_element || '',
      selector: selector.selector_value || '',
            type: selector.type || 'text',
      attribute: selector.attribute || ''
    }))
    } else {
        title.value = ''
    disabled.value = false
        urlsText.value = ''
        currentSelectors.value = []
  }
}

const parseUrls = (text) => {
  return text.split(/[\s\n]+/).filter(url => url.trim().length > 0)
}

const isValidUrl = (url) => {
    try {
    new URL(url)
    return true
    } catch {
    return false
  }
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

const nextStep = () => {
  if (currentStep.value === 1) {
    if (!title.value.trim()) {
      showValidation.value = true
      return
    }
  } else if (currentStep.value === 2) {
    if (!validateUrls()) {
      return
    }
  }
  
  currentStep.value++
}

const previousStep = () => {
  currentStep.value--
}

const addNewSelector = () => {
        currentSelectors.value.push({
    id: `selector-${Date.now()}`,
    name: '',
    selector: '',
    type: 'text',
    attribute: ''
  })
}

const removeCurrentSelector = (id) => {
  const index = currentSelectors.value.findIndex(s => s.id === id)
  if (index > -1) {
    currentSelectors.value.splice(index, 1)
  }
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

  isLoading.value = true
  
  try {
    const urls = parseUrls(urlsText.value)
    const selectors = currentSelectors.value
      .filter(s => s.name.trim() && s.selector.trim())
      .map(s => ({
        target_element: s.name,
        selector_value: s.selector,
        type: s.type,
        attribute: s.attribute || null
      }))
    
    const crawlData = {
      title: title.value.trim(),
      urls,
      selectors,
      disabled
    }
    
    let response
    if (isEditing.value) {
      response = await put(`/api/updatecrawler/${props.crawlData._id}`, crawlData)
    } else {
      response = await post('/api/createcrawler', crawlData)
    }
    
    emit('crawl-created', response.data)
    closeModal()
  } catch (error) {
    console.error('Error saving crawl:', error)
    // Handle error - you might want to show a notification here
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Custom animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>