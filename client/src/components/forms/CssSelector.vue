<template>
  <div class="border border-gray-200 rounded-lg p-4">
    <div class="flex items-start justify-between gap-4 mb-4">
      <div class="flex-1 grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
          <input
            v-model="localSelector.name"
            type="text"
            placeholder="e.g., product-title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="updateSelector"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">CSS Selector <span class="text-red-500">*</span></label>
          <input
            v-model="localSelector.selector"
            type="text"
            placeholder="e.g., .product-title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="updateSelector"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type <span class="text-red-500">*</span></label>
          <select
            v-model="localSelector.type"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="updateSelector"
          >
            <option v-for="t in selectorTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div v-if="localSelector.type === 'link' || localSelector.type === 'image'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Attribute (e.g., href, src)</label>
          <input
            v-model="localSelector.attribute"
            type="text"
            placeholder="e.g., href"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="updateSelector"
          />
        </div>
      </div>
      <button
        v-if="showRemoveButton"
        @click="$emit('removeSelector', selector.id)"
        class="mt-6 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
        title="Remove selector"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <!-- Child Selectors Section -->
    <div v-if="localSelector.type === 'container'" class="mt-4 border-t border-gray-100 pt-4">
      <div class="flex items-center justify-between mb-3">
        <h6 class="text-sm font-semibold text-gray-700">Child Selectors</h6>
        <button
          @click="addChildSelector"
          class="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Add Child Selector</span>
        </button>
      </div>

      <div
        v-for="(childSelector, index) in localSelector.childSelectors"
        :key="index"
        class="ml-4 p-3 border border-gray-200 rounded-lg mb-2"
      >
        <div class="flex items-center justify-between mb-3">
          <h6 class="text-sm font-medium text-gray-600">Child {{ index + 1 }}</h6>
          <button
            @click="removeChildSelector(index)"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              v-model="childSelector.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="updateSelector"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">CSS Selector</label>
            <input
              v-model="childSelector.selector"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="updateSelector"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              v-model="childSelector.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="updateSelector"
            >
              <option v-for="t in childSelectorTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div v-if="childSelector.type === 'link' || childSelector.type === 'image'">
            <label class="block text-xs font-medium text-gray-600 mb-1">Attribute</label>
            <input
              v-model="childSelector.attribute"
              type="text"
              placeholder="e.g., href"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="updateSelector"
            />
          </div>
        </div>

        <div class="mt-3 flex items-center space-x-2">
          <input
            type="checkbox"
            :id="`comparison-${index}`"
            :value="childSelector.name"
            v-model="localComparisonChildSelectors"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label :for="`comparison-${index}`" class="text-sm text-gray-600">Use for Change Detection</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  selector: {
    type: Object,
    required: true,
  },
  showRemoveButton: {
    type: Boolean,
    default: true,
  },
  comparisonChildSelectors: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "updateSelector",
  "removeSelector",
  "updateComparisonChildren",
]);

const selectorTypes = [
  { value: "text", label: "Text" },
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
  { value: "table", label: "Table" },
  { value: "list", label: "List" },
  { value: "container", label: "Container" },
];

const childSelectorTypes = selectorTypes.filter(
  (type) => type.value !== "container"
);

const localSelector = ref({
  id: props.selector.id,
  name: props.selector.name || "",
  selector: props.selector.css || props.selector.selector || "",
  type: props.selector.type || "text",
  attribute: props.selector.attribute || null,
  childSelectors: (props.selector.childSelectors || []).map((child) => ({
    name: child.name || "",
    selector: child.selector || "",
    type: child.type || "text",
    attribute: child.attribute || null,
  })),
});

watch(
  () => props.selector,
  (newVal) => {
    localSelector.value = {
      id: newVal.id,
      name: newVal.name || "",
      selector: newVal.css || newVal.selector || "",
      type: newVal.type || "text",
      attribute: newVal.attribute || null,
      childSelectors: (newVal.childSelectors || []).map((child) => ({
        name: child.name || "",
        selector: child.selector || "",
        type: child.type || "text",
        attribute: child.attribute || null,
      })),
    };
  },
  { deep: true }
);

const updateSelector = () => {
  emit("updateSelector", {
    selector: {
      id: localSelector.value.id,
      name: localSelector.value.name,
      css: localSelector.value.selector,
      type: localSelector.value.type,
      attribute: localSelector.value.attribute,
      childSelectors: localSelector.value.childSelectors.map((child) => ({
        name: child.name,
        selector: child.selector,
        type: child.type,
        attribute: child.attribute,
      })),
    },
  });
};

const addChildSelector = () => {
  localSelector.value.childSelectors.push({
    name: "",
    selector: "",
    type: "text",
    attribute: null,
  });
  updateSelector();
};

const removeChildSelector = (index) => {
  localSelector.value.childSelectors.splice(index, 1);
  updateSelector();
};

const localComparisonChildSelectors = ref([...props.comparisonChildSelectors]);

watch(
  () => props.comparisonChildSelectors,
  (val) => {
    localComparisonChildSelectors.value = [...val];
  }
);

watch(localComparisonChildSelectors, (val) => {
  emit("updateComparisonChildren", {
    selectorId: localSelector.value.id,
    childNames: val,
  });
});

onMounted(() => {
  if (
    localSelector.value.childSelectors &&
    localSelector.value.childSelectors.length > 0 &&
    (!props.comparisonChildSelectors ||
      props.comparisonChildSelectors.length === 0)
  ) {
    localComparisonChildSelectors.value = [
      localSelector.value.childSelectors[0].name,
    ];
  }
});
</script>
