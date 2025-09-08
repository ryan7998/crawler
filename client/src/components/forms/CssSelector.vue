<template>
  <div class="border rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex-1 grid grid-cols-2 gap-4">
        <v-text-field
          v-model="localSelector.name"
          label="Name"
          required
          @update:model-value="updateSelector"
        />
        <v-text-field
          v-model="localSelector.selector"
          label="CSS Selector"
          required
          @update:model-value="updateSelector"
        />
        <v-select
          v-model="localSelector.type"
          :items="selectorTypes"
          item-title="label"
          item-value="value"
          label="Type"
          required
          @update:model-value="updateSelector"
        />
        <v-text-field
          v-if="localSelector.type === 'link' || localSelector.type === 'image'"
          v-model="localSelector.attribute"
          label="Attribute (e.g., href, src)"
          @update:model-value="updateSelector"
        />
      </div>
      <v-btn
        v-if="showRemoveButton"
        variant="text"
        color="error"
        size="small"
        @click="$emit('removeSelector', selector.id)"
        class="ml-2"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </div>

    <!-- Child Selectors Section -->
    <div v-if="localSelector.type === 'container'" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <h6 class="font-medium">Child Selectors</h6>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          @click="addChildSelector"
        >
          <v-icon>mdi-plus</v-icon>
          Add Child Selector
        </v-btn>
      </div>

      <div
        v-for="(childSelector, index) in localSelector.childSelectors"
        :key="index"
        class="ml-4 p-3 border rounded-lg mb-2"
      >
        <div class="flex items-center justify-between mb-2">
          <h6 class="font-medium">Child {{ index + 1 }}</h6>
          <v-btn
            variant="text"
            color="error"
            size="small"
            @click="removeChildSelector(index)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <v-text-field
            v-model="childSelector.name"
            label="Name"
            required
            @update:model-value="updateSelector"
          />
          <v-text-field
            v-model="childSelector.selector"
            label="CSS Selector"
            required
            @update:model-value="updateSelector"
          />
          <v-select
            v-model="childSelector.type"
            :items="childSelectorTypes"
            item-title="label"
            item-value="value"
            label="Type"
            required
            @update:model-value="updateSelector"
          />
          <v-text-field
            v-if="
              childSelector.type === 'link' || childSelector.type === 'image'
            "
            v-model="childSelector.attribute"
            label="Attribute (e.g., href, src)"
            @update:model-value="updateSelector"
          />
        </div>
        <!-- Checkbox for comparison selector -->
        <div class="mt-2">
          <v-checkbox
            :label="'Use for Change Detection'"
            :value="childSelector.name"
            v-model="localComparisonChildSelectors"
          />
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

// On mount, if no comparisonChildSelectors are set, select the first child by default
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
