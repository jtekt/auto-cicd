<template>
  <v-container>
    <!-- Expansion Panels -->
    <v-expansion-panels>
      <!-- FAQ 1: How to Move a Repository -->
      <v-expansion-panel id="move-project">
        <v-expansion-panel-title
          >How to Move a Repository to Another Namespace in
          GitLab</v-expansion-panel-title
        >
        <v-expansion-panel-text>
          <ol>
            <li>
              <strong>Log in to GitLab:</strong> Open your GitLab instance and
              log in to your account.
            </li>
            <li>
              <strong>Navigate to the Project:</strong> Go to the project you
              want to move.
            </li>
            <li>
              <strong>Go to Project Settings:</strong> In the left sidebar of
              your project, click on <strong>Settings</strong>, then
              <strong>General</strong> to open the general settings of the
              project.
            </li>
            <li>
              <strong>Expand the "Advanced" Section:</strong> Scroll down to
              find the <strong>Advanced</strong> section, and click on it to
              expand the options.
            </li>
            <li>
              <strong>Change Namespace:</strong> In the
              <strong>Advanced</strong> section, you should see a field called
              <strong>"Transfer project"</strong>. Click on the
              <strong>"Transfer project"</strong> button.
            </li>
            <li>
              <strong>Choose the New Namespace:</strong> A dialog will pop up
              asking you to select the <strong>target namespace</strong>. You
              can select either a <strong>Group</strong> or another
              <strong>user namespace</strong>. Select the appropriate namespace
              and click <strong>Transfer project</strong>.
            </li>
            <li>
              <strong>Confirmation:</strong> GitLab will ask you to confirm the
              move. Once confirmed, the repository will be transferred to the
              new namespace.
            </li>
          </ol>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped>
/* Optional: You can style your buttons or the container here */
</style>
