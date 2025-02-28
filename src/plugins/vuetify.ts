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
    components: {
      deployHandler: {
        actionBtn: "Deploy",
        cancelBtn: "Cancel",
        actionsNeededDialog: {
          title: "Actions needed to deploy the app",
          faqLink: "How to move a project to another group",
        },
        deployDialog: {
          deployingFromGitlab: "Deploying from GitLab",
          selectFramework: "Select Framework",
          selectPackageManager: "Select Package Manager",
          buildSettings: {
            title: "Build and Output Settings",
            description:
              "These are the default configurations for a {framework} project. If your project requires different settings, you can modify them as needed.",
            rootDir: "Root Directory",
            outputDir: "Output Directory",
            installCommand: "Install Command",
            buildCommand: "Build Command",
          },
          envSettings: {
            title: "Environment Variables",
            description: "Add environment variables for your project.",
            key: "Key",
            value: "Value",
            pasteHint:
              "You can paste the contents of a valid .env file directly into one of the key input fields, and it will automatically populate the corresponding values for you.",
            addMore: "Add More",
          },
        },
        confirmDialog: {
          title: "Confirm Deployment",
          message:
            "Are you sure you want to continue? The following changes will be made:",
          filesSection: "Files to be Deployed",
          update: "Update",
          create: "Create",
          envSection: "Included Environment Variables",
          envDescription:
            "These variables will be available in your deployment:",
          noChanges: "Your repository is up to date, no file change needed",
          continue: "Continue",
        },
        nextStepsDialog: {
          successTitle: "Deployment Completed",
          warningTitle: "Deployment Failed",
          updateTitle: "Deployment Update",
          filesCommitted: {
            title: "Files Committed",
            success:
              "These changes have been pushed to your GitLab repository. Please pull the latest updates.",
            empty: "No file was changed in your GitLab repository",
          },
          envAdded: {
            title: "Environment Variables added",
          },
          notes: {
            title: "Important Notes",
          },
          errors: {
            title: "Errors Encountered",
            message:
              "Please review the following issues and try again or contact support.",
          },
          closeReview: "Close and Review",
          close: "Close",
        },
        script: {
          errors: {
            unauthorized: "Error: Unauthorized",
            namespaceNotAllowed:
              "The project is not in an allowed group. Please transfer the project to an approved group:",
            invalidEnvs: "The environment variables {keys} are invalid",
            fetchFilesFailed: "Error fetching repository files: {error}",
            commitFailed: "Error: Failed to commit deployment files",
            envUpdateFailed: "Error: Failed to update environment variables",
            deployFailed:
              "Deployment failed. Please check the logs for more details",
          },
          success: {
            commitSuccess: "Deployment files committed successfully!",
            envUpdateSuccess: "Environment variables updated successfully!",
            deployMessages: {
              deploying: "Your project will be deployed within a few minutes.",
              firstDeploy:
                "If this is your first auto deployment, you will receive an email with the URL of your application.",
              trackProgress:
                "You can track the progress of your build by accessing the GitLab project under Build > Pipelines.",
            },
          },
          actions: {
            allowedGroup: "Allowed Group",
            moveInstruction: ", then move your project to the new group",
          },
        },
      },
    },
    views: {
      auth: {
        signInMessage:
          "Sign in to your account to access your projects and deploy them.",
        errors: {
          token: "Error creating GitLab access token.",
          profile: "rror retrieving user profile from GitLab.",
        },
      },
      index: {
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
            fetchProjects: "Failed to fetch projects. Please try again.",
          },
        },
        footerMessage:
          "If your project is not listed here, please ensure it in the auto-cicd group or one of it`s subgroup in GitLab.",
        transferProject: "Learn how to transfer your project",
      },
      faq: {
        moveProject: "How to Move a Repository to Another Namespace in GitLab",
        steps: {
          "1": "Log in to GitLab: Open your GitLab instance and log in to your account.",
          "2": "Navigate to the Project: Go to the project you want to move.",
          "3": "Go to Project Settings: In the left sidebar of your project, click on Settings, then General to open the general settings of the project.",
          "4": "Expand the 'Advanced' Section: Scroll down to find the Advanced section, and click on it to expand the options.",
          "5": "Change Namespace: In the Advanced section, you should see a field called 'Transfer project'. Click on the 'Transfer project' button.",
          "6": "Choose the New Namespace: A dialog will pop up asking you to select the target namespace. You can select either a Group or another user namespace. Select the appropriate namespace (auto-cicd or a subgroup) and click Transfer project.",
          "7": "Confirmation: GitLab will ask you to confirm the move. Once confirmed, the repository will be transferred to the new namespace.",
        },
      },
    },
  },
  ja: {
    $vuetify: {
      ...ja,
    },
    components: {
      deployHandler: {
        actionBtn: "デプロイ",
        cancelBtn: "キャンセル",
        actionsNeededDialog: {
          title: "アプリをデプロイするために必要なアクション",
          faqLink: "プロジェクトを別のグループに移動する方法",
        },
        deployDialog: {
          deployingFromGitlab: "GitLabからデプロイ中",
          selectFramework: "フレームワークを選択",
          selectPackageManager: "パッケージマネージャーを選択",
          buildSettings: {
            title: "ビルドと出力設定",
            description:
              "{framework} プロジェクトのデフォルト設定です。プロジェクトに異なる設定が必要な場合、必要に応じて変更できます。",
            rootDir: "ルートディレクトリ",
            outputDir: "出力ディレクトリ",
            installCommand: "インストールコマンド",
            buildCommand: "ビルドコマンド",
          },
          envSettings: {
            title: "環境変数",
            description: "プロジェクトの環境変数を追加してください。",
            key: "キー",
            value: "値",
            pasteHint:
              "有効な .env ファイルの内容をキー入力フィールドに直接貼り付けると、対応する値が自動的に入力されます。",
            addMore: "さらに追加",
          },
        },
        confirmDialog: {
          title: "デプロイの確認",
          message: "続行しますか？以下の変更が行われます：",
          filesSection: "デプロイされるファイル",
          update: "更新",
          create: "作成",
          envSection: "含まれる環境変数",
          envDescription: "これらの変数がデプロイで利用可能になります：",
          noChanges: "リポジトリは最新であり、ファイルの変更は必要ありません",
          continue: "続行",
        },
        nextStepsDialog: {
          successTitle: "デプロイが完了しました",
          warningTitle: "デプロイに失敗しました",
          updateTitle: "デプロイの更新",
          filesCommitted: {
            title: "コミットされたファイル",
            success:
              "これらの変更がGitLabリポジトリにプッシュされました。最新の更新をプルしてください。",
            empty: "GitLabリポジトリでファイルが変更されませんでした",
          },
          envAdded: {
            title: "追加された環境変数",
          },
          notes: {
            title: "重要な注意事項",
          },
          errors: {
            title: "発生したエラー",
            message:
              "以下の問題を確認し、再試行するかサポートに連絡してください。",
          },
          closeReview: "閉じて確認",
          close: "閉じる",
        },
        script: {
          errors: {
            unauthorized: "エラー：権限がありません",
            namespaceNotAllowed:
              "プロジェクトが許可されたグループにありません。プロジェクトを承認されたグループに移動してください：",
            invalidEnvs: "環境変数 {keys} が無効です",
            fetchFilesFailed: "リポジトリファイルの取得エラー：{error}",
            commitFailed: "エラー：デプロイファイルのコミットに失敗しました",
            envUpdateFailed: "エラー：環境変数の更新に失敗しました",
            deployFailed:
              "デプロイに失敗しました。詳細はログを確認してください",
          },
          success: {
            commitSuccess: "デプロイファイルが正常にコミットされました！",
            envUpdateSuccess: "環境変数が正常に更新されました！",
            deployMessages: {
              deploying: "プロジェクトは数分以内にデプロイされます。",
              firstDeploy:
                "これが最初の自動デプロイの場合、アプリケーションのURLが記載されたメールが届きます。",
              trackProgress:
                "GitLabプロジェクトの「ビルド > パイプライン」でビルドの進捗を確認できます。",
            },
          },
          actions: {
            allowedGroup: "許可されたグループ",
            moveInstruction:
              "、その後プロジェクトを新しいグループに移動してください",
          },
        },
      },
    },
    views: {
      auth: {
        signInMessage:
          "アカウントにサインインして、プロジェクトにアクセスし、デプロイしてください。",
        errors: {
          token: "GitLabアクセストークンの作成エラー。",
          profile: "GitLabからユーザープロフィールの取得エラー。",
        },
      },
      index: {
        searchLabel: "名前または名前空間で検索",
        sortLabel: "並べ替え",
        projects: {
          noFound: "プロジェクトが見つかりません",
          lastActivity: "最終アクティビティ：",
          noDescription: "説明なし",
          sort: {
            nameAscText: "名前 (A-Z)",
            nameDscText: "名前 (Z-A)",
            editedAscText: "最終編集 (最新)",
            editedDscText: "最終編集 (最古)",
          },
          errors: {
            fetchProjects:
              "プロジェクトの取得に失敗しました。再試行してください。",
          },
        },
        footerMessage:
          "プロジェクトがここに表示されない場合、GitLabのauto-cicdグループまたはそのサブグループにあることを確認してください。",
        transferProject: "プロジェクトの移動方法を学ぶ",
      },
      faq: {
        moveProject: "GitLabでリポジトリを別の名前空間に移動する方法",
        steps: {
          "1": "GitLabにログイン：GitLabインスタンスを開き、アカウントにログインします。",
          "2": "プロジェクトに移動：移動したいプロジェクトにアクセスします。",
          "3": "プロジェクト設定に移動：プロジェクトの左サイドバーで「設定」をクリックし、「一般」を選択して一般設定を開きます。",
          "4": "「詳細」セクションを展開：下にスクロールして「詳細」セクションを見つけ、クリックしてオプションを展開します。",
          "5": "名前空間を変更：「詳細」セクションに「プロジェクトの転送」というフィールドがあります。「プロジェクトの転送」ボタンをクリックします。",
          "6": "新しい名前空間を選択：ダイアログが表示され、移動先の名前空間を選択するように求められます。グループまたは別のユーザーの名前空間を選択できます。適切な名前空間（auto-cicdまたはサブグループ）を選択し、「プロジェクトの転送」をクリックします。",
          "7": "確認：GitLabは移動の確認を求めます。確認すると、リポジトリが新しい名前空間に転送されます。",
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
