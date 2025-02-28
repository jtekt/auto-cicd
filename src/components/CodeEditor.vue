<template>
  <v-card class="code-editor" elevation="2">
    <div class="editor-card-container">
      <div v-if="showLineNumbers" class="line-numbers">
        <div v-for="i in lineCount" :key="i" class="line-number">
          <span v-if="highlightedLines.includes(i)" class="highlight-dot" />
          {{ i }}
        </div>
      </div>
      <div class="code-container">
        <div class="longest-line">
          {{ longestLine }}
        </div>
        <div class="code-input-container">
          <textarea
            ref="textarea"
            v-model="code"
            :placeholder="placeholder"
            :readonly="readonly"
            class="code-input"
            spellcheck="false"
            @input="handleInput"
            @keydown="handleKeyDown"
          />
        </div>
      </div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useTheme } from "vuetify";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  defaultValue: {
    type: String,
    default: "",
  },
  showLineNumbers: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: "Enter your code...",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  highlightedLines: {
    type: Array,
    default: () => [],
  },
});

const textarea = ref<HTMLTextAreaElement | null>(null);
const code = ref(props.modelValue || props.defaultValue);

// Vuetify theme
const theme = useTheme();
const isDark = computed(() => theme.current.value.dark);

watch(
  () => props.modelValue || props.defaultValue,
  (newValue) => {
    // Sync the parent prop with the internal code
    if (newValue !== code.value) {
      code.value = newValue;
      if (textarea.value) {
        textarea.value.value = newValue;
      }

      adjustTextareaHeight();
    }
  }
);

const lineCount = computed(() => {
  return code.value ? code.value.split("\n").length : 0;
});

const longestLine = computed(() => {
  return code.value
    ? code.value.split("\n").sort((a, b) => b.length - a.length)[0]
    : "";
});

const handleInput = () => {
  emit("update:modelValue", code.value);
  adjustTextareaHeight();
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = textarea.value!.selectionStart;
    const end = textarea.value!.selectionEnd;
    code.value =
      code.value.substring(0, start) + "  " + code.value.substring(end);
    textarea.value!.selectionStart = textarea.value!.selectionEnd = start + 2;
  }
};

const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = "auto";
    textarea.value.style.height = `${textarea.value.scrollHeight}px`;
  }
};

onMounted(() => {
  nextTick(() => {
    adjustTextareaHeight();
  });
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();
</script>

<style scoped>
.code-editor {
  font-family: "Roboto Mono", monospace;
  width: 100%;
  max-width: 900px;
  max-height: 500px;
  border-radius: 8px;
  margin: 16px auto;
  overflow: auto;
  background-color: v-bind('isDark ? "#1e1e1e" : "#ffffff"');
}

.editor-card-container {
  display: flex;
  min-height: 0;
  background-color: v-bind('isDark ? "#252526" : "#f5f5f5"');
}

.line-numbers {
  user-select: none;
  text-align: right;
  padding: 12px 8px;
  border-right: 1px solid v-bind('isDark ? "#3e3e3e" : "#e0e0e0"');
  min-width: 48px;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: v-bind('isDark ? "#2d2d2d" : "#fafafa"');
  color: v-bind('isDark ? "#858585" : "#666666"');
}

.line-number {
  font-size: 13px;
  line-height: 1.5;
  position: relative;
}

.highlight-dot {
  position: absolute;
  left: 4px;
  top: 50%;
  width: 6px;
  height: 6px;
  background: #ff9800;
  border-radius: 50%;
  transform: translateY(-50%);
}

.code-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.longest-line {
  white-space: pre;
  height: 0;
  color: transparent;
  padding: 0 12px;
}

.code-input-container {
  flex: 1;
  padding: 12px;
  overflow: auto;
  background-color: v-bind('isDark ? "#252526" : "#f5f5f5"');
}

.code-input {
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  white-space: pre;
  padding: 0;
  color: v-bind('isDark ? "#d4d4d4" : "#333333"');
  caret-color: v-bind('isDark ? "#569cd6" : "#0066cc"');
}

/* Placeholder styling */
.code-input::placeholder {
  color: v-bind('isDark ? "#858585" : "#999999"');
  opacity: 0.6;
}

/* Scrollbar styling */
.code-editor::-webkit-scrollbar,
.code-input-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-editor::-webkit-scrollbar-track,
.code-input-container::-webkit-scrollbar-track {
  background: v-bind('isDark ? "#252526" : "#f5f5f5"');
}

.code-editor::-webkit-scrollbar-thumb,
.code-input-container::-webkit-scrollbar-thumb {
  background: v-bind('isDark ? "#4e4e4e" : "#cccccc"');
  border-radius: 4px;
}

.code-editor::-webkit-scrollbar-thumb:hover,
.code-input-container::-webkit-scrollbar-thumb:hover {
  background: v-bind('isDark ? "#666" : "#aaaaaa"');
}

/* Hover effects */
.code-input:focus {
  outline: none;
}

/* Smooth transitions */
.line-number,
.code-input {
  transition: all 0.2s ease;
}

/* Selection styling */
.code-input::selection {
  background: v-bind('isDark ? "#264f78" : "#b3d7ff"');
  color: v-bind('isDark ? "#ffffff" : "#000000"');
}

/* Disabled state */
.code-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
