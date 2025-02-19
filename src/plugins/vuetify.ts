/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Translations provided by Vuetify
import { ja, en } from "vuetify/locale";

// Composables
import { createVuetify } from "vuetify";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { createI18n, useI18n } from "vue-i18n";

const messages = {
  en: {
    $vuetify: {
      ...en,
    },
    pages: {
      auth: {
        signInMessage:
          "Sign in to your account to access your projects and deploy them.",
        errors: {
          token: "Error creating GitLab access token.",
          profile: "rror retrieving user profile from GitLab.",
        },
      },
      home: {
        searchLabel: "Search by name or namespace",
        sortLabel: "Sort by",
        projects: {
          noFound: "No projects found",
          lastActivity: "Last Activity:",
          noDescription: "No description",
          sort: {
            nameAscText: "Name (A-Z)",
            nameDscText: "Name (Z-A)",
            editedAscText: "Last Edited (Most Recent)",
            editedDscText: "Last Edited (Least Recent)",
          },
          errors: {
            noSession: "No active session. Please log in.",
            fetchProjects: "Failed to fetch projects. Please try again.",
          },
        },
        deploy: {
          info: {
            "1": "1. Ensure your project has a valid .Dockerfile in the root directory. This file contains the instructions to build your Docker image.",
            "2": "2. The Docker container must expose the application via port 80.",
            "3": "3. On click deploy please review the files that will be changed before continuing.",
          },
          codeEditor: {
            placeholder: "Write your Dockerfile here...",
            originalChanged: "The original .Dockerfile has been modified",
          },
          deploy: "Deploy",
          cancel: "Cancel",
          confirmDeployTitle: "Confirm Deployment",
          confirmDeployMessage:
            "Are you sure you want to deploy? The following files will be modified:",
          continue: "Continue",
          nextStepsTitle: "Deployment Successful",
          nextStepsMessage1:
            "1. Go to the 'Pipelines' section to monitor the build process and check for any errors.",
          nextStepsMessage2:
            "2. Once the build finishes, if this is the first auto deploy then you will receive an email with the deployed URL.",
          close: "Close",
          update: "Update",
          insert: "Insert",
          noChangesMade:
            "No changes were made to the deployment files. There is nothing to deploy.",
          reset: "Reset",
          resetOriginal: "Reset to the original",
          template: "Template",
        },
      },
    },
  },
  ja: {
    $vuetify: {
      ...ja,
    },
    pages: {
      auth: {
        signInMessage:
          "アカウントにサインインして、プロジェクトにアクセスし、デプロイしてください。",
        errors: {
          token: "GitLabからアクセストークンの作成に失敗しました",
          profile: "GitLabからユーザープロフィールの取得に失敗しました",
        },
      },
      home: {
        searchLabel: "名前またはネームスペースで検索",
        sortLabel: "並べ替え",
        projects: {
          noFound: "プロジェクトが見つかりません",
          lastActivity: "最終活動:",
          noDescription: "説明なし",
          sort: {
            nameAscText: "名前 (A-Z)",
            nameDscText: "名前 (Z-A)",
            editedAscText: "最終編集 (新しい順)",
            editedDscText: "最終編集 (古い順)",
          },
          errors: {
            noSession:
              "アクティブなセッションがありません。ログインしてください。",
            fetchProjects:
              "プロジェクトの取得に失敗しました。もう一度試してください。",
          },
        },
        deploy: {
          info: {
            "1": "1. プロジェクトのルートディレクトリに有効な .Dockerfile があることを確認してください。このファイルには、Dockerイメージを構築するための指示が含まれています。",
            "2": "2. Dockerコンテナは、ポート80 を通じてアプリケーションを公開する必要があります。",
            "3": "3. デプロイをクリックすると、続行する前に変更されるファイルを確認してください。",
          },
          codeEditor: {
            placeholder: "ここにDockerfileを書いてください...",
            originalChanged: "元の .Dockerfile は変更されました",
          },
          deploy: "デプロイ",
          cancel: "キャンセル",
          confirmDeployTitle: "デプロイの確認",
          confirmDeployMessage:
            "本当にデプロイしますか？次のファイルが変更されます:",
          continue: "続行",
          nextStepsTitle: "デプロイが成功しました",
          nextStepsMessage1:
            "1. 'Pipelines' セクションに移動して、ビルドプロセスとエラーを確認してください。",
          nextStepsMessage2:
            "2. ビルドが完了すると、デプロイされたURLが記載されたメールが届きます。",
          close: "閉じる",
          update: "更新",
          insert: "挿入",
          noChangesMade:
            "デプロイファイルに変更はありませんでした。デプロイするものはありません。",
          reset: "リセット",
          resetOriginal: "元に戻す",
          template: "テンプレート",
        },
      },
    },
  },
};

// Get the saved language from localStorage, defaulting to 'en'
const savedLanguage = localStorage.getItem("preferred_language") || "ja";

const i18n = createI18n({
  legacy: false, // Vuetify does not support the legacy mode of vue-i18n
  locale: savedLanguage,
  fallbackLocale: "en",
  messages,
});

// Function to change the language
export const setLanguage = (lang: "ja" | "en") => {
  i18n.global.locale.value = lang; // Change the locale in i18n

  localStorage.setItem("preferred_language", lang); // Save the preferred language in localStorage
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: "light",
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
});
