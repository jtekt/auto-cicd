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
            outputFileName: "Output File Name",
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
            "Please review the changes below before proceeding with deployment.",
          noChangesTitle: "No Changes to Deploy",
          noChangesMessage: "There are no changes to deploy at this time.",
          missingFiles:
            "The following files are required in the repository for auto-deployment",
          missingOutputFile:
            "The default filename {defaultFilename} for a {framework} deployment was not found. If your project uses a different file, please update it in the Build and Output Settings below.",
          filesSection: "Files",
          noFileChanges: "No file changes detected",
          envSection: "Environment Variables",
          envDescription:
            "The following environment variable changes will be applied:",
          addedVars: "Added Variables",
          modifiedVars: "Modified Variables",
          removedVars: "Removed Variables",
          noEnvChanges: "No environment variable changes detected",
          update: "Update",
          create: "Create",
          continue: "Continue",
          cancelBtn: "Cancel",
        },
        nextStepsDialog: {
          successTitle: "Deployment Successful",
          successMessage:
            "Your changes have been successfully deployed. Here’s what happened and what to do next:",
          partialSuccessTitle: "Deployment Partially Successful",
          partialSuccessMessage:
            "Some parts of your deployment succeeded, but there were issues. Review the details below:",
          errorTitle: "Deployment Failed",
          errorMessage:
            "There were issues during deployment. Please review the errors below:",
          noChangesTitle: "No Changes Deployed",
          noChangesMessage: "No changes were detected or deployed this time.",
          filesCommitted: {
            title: "Files Committed",
          },
          envAdded: {
            title: "Environment Variables Updated",
          },
          nextSteps: {
            title: "Next Steps",
          },
          errors: {
            title: "Errors Encountered",
          },
          close: "Close",
          closeReview: "Close and Review",
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
          profile: "Error retrieving user profile from GitLab.",
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
      noGroup: {
        title: "Group Membership Required",
        alert:
          "You need to be a member of an Auto CI/CD subgroup to use this application.",
        instructions: "To gain access, please follow these steps:",
        step1: "Visit our group management app to create your subgroup",
        step2: "Return here and log in again after creating your subgroup",
        createButton: "Create Subgroup in GitLab",
        backButton: "Back to Login",
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
            outputFileName: "Output File Name",
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
          message: "デプロイを進める前に、以下の変更を確認してください。",
          noChangesTitle: "デプロイする変更なし",
          noChangesMessage: "現在、デプロイする変更はありません。",
          missingFiles:
            "自動デプロイに必要な以下のファイルがリポジトリに必要です",
          missingOutputFile:
            "{framework} のデプロイに必要なデフォルトファイル {defaultFilename} が見つかりませんでした。プロジェクトで異なるファイルを使用している場合は、下のビルドおよび出力設定で変更してください。",
          filesSection: "ファイル",
          noFileChanges: "ファイルの変更が検出されませんでした",
          envSection: "環境変数",
          envDescription: "以下の環境変数の変更が適用されます：",
          addedVars: "追加された変数",
          modifiedVars: "変更された変数",
          removedVars: "削除された変数",
          noEnvChanges: "環境変数の変更が検出されませんでした",
          update: "更新",
          create: "作成",
          continue: "続行",
          cancelBtn: "キャンセル",
        },
        nextStepsDialog: {
          successTitle: "デプロイ成功",
          successMessage:
            "変更が正常にデプロイされました。以下に何が起こったか、次に何をすべきかを示します：",
          partialSuccessTitle: "デプロイ部分成功",
          partialSuccessMessage:
            "デプロイの一部は成功しましたが、いくつかの問題が発生しました。詳細を確認してください：",
          errorTitle: "デプロイ失敗",
          errorMessage:
            "デプロイ中に問題が発生しました。以下のエラーを確認してください：",
          noChangesTitle: "変更なし",
          noChangesMessage:
            "今回は変更が検出されず、デプロイされませんでした。",
          filesCommitted: {
            title: "コミットされたファイル",
          },
          envAdded: {
            title: "更新された環境変数",
          },
          nextSteps: {
            title: "次のステップ",
          },
          errors: {
            title: "発生したエラー",
          },
          close: "閉じる",
          closeReview: "閉じて確認",
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
      noGroup: {
        title: "グループメンバーシップが必要です",
        alert:
          "このアプリケーションを使用するには、Auto CI/CD サブグループのメンバーである必要があります。",
        instructions: "アクセスするには、以下の手順に従ってください：",
        step1: "グループ管理アプリにアクセスしてサブグループを作成します",
        step2: "サブグループ作成後、ここに戻って再度ログインしてください",
        createButton: "GitLabでサブグループを作成",
        backButton: "ログインに戻る",
      },
    },
  },
};

// Get the saved language from localStorage, defaulting to 'en'
const savedLanguage = localStorage.getItem("preferred_language") || "ja";
const prefersDarkMode = window.matchMedia(
  "(prefers-color-scheme: dark)"
).matches;
const defaultTheme =
  localStorage.getItem("theme") || prefersDarkMode ? "dark" : "light";

export const i18n = createI18n({
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
    defaultTheme,
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
});
