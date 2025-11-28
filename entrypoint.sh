#!/bin/sh

ROOT_DIR=/app

# Replace env vars in files served by NGINX
echo "Replacing environment variables"
for file in $ROOT_DIR/assets/*.js* $ROOT_DIR/index.html;
do
  echo "Processing $file ...";

  sed -i 's|VITE_APP_GITLAB_URL_PLACEHOLDER|'${VITE_APP_GITLAB_URL}'|g' $file
  sed -i 's|VITE_APP_GITLAB_OAUTH_ID_PLACEHOLDER|'${VITE_APP_GITLAB_OAUTH_ID}'|g' $file
  sed -i 's|VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR_PLACEHOLDER|'${VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR}'|g' $file
  sed -i 's|VITE_APP_DEPLOYED_NAMESPACE_PLACEHOLDER|'${VITE_APP_DEPLOYED_NAMESPACE}'|g' $file
  sed -i 's|VITE_APP_IMAGE_PULL_SECRET_NAME_PLACEHOLDER|'${VITE_APP_IMAGE_PULL_SECRET_NAME}'|g' $file

  sed -i 's|VITE_APP_GITLAB_GROUP_MANAGER_URL_PLACEHOLDER|'${VITE_APP_GITLAB_GROUP_MANAGER_URL}'|g' $file
  sed -i 's|VITE_SUPPORT_CONTACTS_PLACEHOLDER|'${VITE_SUPPORT_CONTACTS}'|g' $file

done

echo "Starting Nginx"
nginx -g 'daemon off;'
