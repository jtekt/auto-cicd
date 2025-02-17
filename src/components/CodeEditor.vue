<template>
  <v-card class="code-editor">
    <div class="editor-card-container">
      <div v-if="showLineNumbers" class="line-numbers pr-2">
        <div v-for="i in lineCount" :key="i" class="line-number">{{ i }}</div>
      </div>
      <div class="code-container">
        <div class="longest-line">{{ longestLine }}</div>
        <div class="code-input-container">
          <textarea
            v-model="code"
            :placeholder="placeholder"
            :readonly="readonly"
            class="code-input"
            spellcheck="false"
            @input="handleInput"
            @keydown="handleKeyDown"
            ref="textarea"
          ></textarea>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, nextTick } from "vue";

export default defineComponent({
  name: "CodeEditor",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "javascript",
    },
    showLineNumbers: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: "Enter your code here...",
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const code = ref(props.modelValue);
    const textarea = ref<HTMLTextAreaElement | null>(null);

    const lineCount = computed<number>(() => {
      return code.value ? code.value.split("\n").length : 0;
    });

    const longestLine = computed<string>(() => {
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
        textarea.value!.selectionStart = textarea.value!.selectionEnd =
          start + 2;
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

    return {
      longestLine,
      code,
      lineCount,
      handleInput,
      handleKeyDown,
      textarea,
    };
  },
});
</script>

<style scoped>
.code-editor {
  font-family: "Fira Code", monospace;
  width: 100%;
  height: 100%;
  max-width: 800px;
  max-height: 500px;
  margin: auto;
  padding: 10px;
  padding-bottom: 0;
  overflow: auto;
}

.editor-card-container {
  display: flex;
}

.code-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.longest-line {
  white-space: pre;
  height: 0;
  color: transparent;
}

.line-numbers {
  user-select: none;
  text-align: right;
  color: #999;
}

.line-number {
  padding: 0 5px;
}

.code-input-container {
  position: relative;
  flex: 1;
  overflow: auto;
}

.code-input {
  border: none;
  outline: none;
  background: transparent;
  caret-color: red;
  width: 100%;
  resize: none;
  white-space: pre;
  overflow: hidden;
}

/* For WebKit browsers (Chrome, Safari) */
.code-editor::-webkit-scrollbar {
  width: 6px; /* Adjust the width as needed */
  height: 6px;
}

.code-editor::-webkit-scrollbar-track {
  background: transparent; /* Scroll track color */
}

.code-editor::-webkit-scrollbar-thumb {
  background: rgb(156, 156, 156); /* Scrollbar thumb color */
  border-radius: 6px; /* Rounded corners for the thumb */
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: #555; /* Darker color on hover */
}
</style>
