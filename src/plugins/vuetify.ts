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
          token: "Error creating access token from GitLab",
          profile: "Error getting user profile from GitLab",
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
            editedAscText: "Last Edited (Newest)",
            editedDscText: "Last Edited (Oldest)",
          },
          errors: {
            noSession: "No active session. Please log in.",
            fetchProjects: "Failed to fetch projects. Please try again.",
          },
        },
        deploy: {
          info: {
            "1": "<strong>Valid .Dockerfile:</strong> Ensure your project has a valid <strong>.Dockerfile</strong> in the root directory. This file contains the instructions to build your Docker image.",
            "2": "<strong>Expose Port 80:</strong> The Docker container must expose the application on <strong>port 80</strong>.",
            "3": "<strong>Deploy Button:</strong> Clicking “Deploy” will overwrite the <strong>.gitlab-ci.yml</strong> file in your repository.",
          },
          codeEditor: {
            placeholder: "Write your Dockerfile here...",
            originalChanged: "Original .Dockerfile is changed",
          },
          deploy: "Deploy",
          cancel: "Cancel",
          confirmDeployTitle: "Confirm Deployment",
          confirmDeployMessage:
            "Are you sure you want to deploy? The following files will be altered:",
          continue: "Continue",
          nextStepsTitle: "Deployment Successful",
          nextStepsMessage1:
            "1. Go to the 'Pipelines' section to view the build process and any errors.",
          nextStepsMessage2:
            "2. Once the build finishes, you will receive an email with the deployed URL.",
          close: "Close",
          update: "Update",
          insert: "Insert",
          noChangesMade:
            "No changes were made to the deployment files. Nothing to deploy.",
          reset: "Reset",
          resetOriginal: "Reset to original",
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
          "プロジェクトにアクセスしてデプロイするためにサインインしてください。",
        errors: {
          token: "GitLabからのアクセストークン作成エラー",
          profile: "GitLabからユーザープロフィールの取得エラー",
        },
      },
      home: {
        searchLabel: "名前または名前空間で検索",
        sortLabel: "並べ替え",
        projects: {
          noFound: "プロジェクトが見つかりません",
          lastActivity: "最終アクティビティ:",
          noDescription: "説明なし",
          sort: {
            nameAscText: "名前 (A-Z)",
            nameDscText: "名前 (Z-A)",
            editedAscText: "最終編集 (最新)",
            editedDscText: "最終編集 (古い順)",
          },
          errors: {
            noSession:
              "アクティブなセッションがありません。ログインしてください。",
            fetchProjects:
              "プロジェクトの取得に失敗しました。再試行してください。",
          },
        },
        deploy: {
          info: {
            "1": "<strong>有効な .Dockerfile:</strong> プロジェクトのルートディレクトリに有効な <strong>.Dockerfile</strong> があることを確認してください。このファイルにはDockerイメージをビルドするための指示が含まれています。",
            "2": "<strong>ポート80を公開:</strong> Dockerコンテナはアプリケーションを<strong>ポート80</strong>で公開する必要があります。",
            "3": "<strong>デプロイボタン:</strong> 「デプロイ」をクリックすると、リポジトリ内の <strong>.gitlab-ci.yml</strong> ファイルが上書きされます。",
          },
          codeEditor: {
            placeholder: "ここにDockerfileを書いてください...",
            originalChanged: "元の .Dockerfile が変更されました",
          },
          deploy: "デプロイ",
          cancel: "キャンセル",
          confirmDeployTitle: "デプロイの確認",
          confirmDeployMessage:
            "デプロイしてもよろしいですか？以下のファイルが変更されます:",
          continue: "続行",
          nextStepsTitle: "デプロイ成功",
          nextStepsMessage1:
            "1. 'Pipelines' セクションに移動してビルドプロセスやエラーを確認してください。",
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
