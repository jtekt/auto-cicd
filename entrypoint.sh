#!/bin/sh

ROOT_DIR=/app

# Replace env vars in files served by NGINX
echo "Replacing environment variables"
for file in $ROOT_DIR/js/*.js* $ROOT_DIR/index.html $ROOT_DIR/precache-manifest*.js;
do
  echo "Processing $file ...";

  sed -i 's|VITE_APP_GITLAB_URL_PLACEHOLDER|'${VITE_APP_GITLAB_URL}'|g' $file
  sed -i 's|VITE_APP_GITLAB_OAUTH_ID_PLACEHOLDER|'${VITE_APP_GITLAB_OAUTH_ID}'|g' $file
  sed -i 's|VITE_APP_GITLAB_OAUTH_REDIRECT_URI_PATH_PLACEHOLDER|'${VITE_APP_GITLAB_OAUTH_REDIRECT_URI_PATH}'|g' $file
  sed -i 's|VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR_PLACEHOLDER|'${VITE_APP_GITLAB_OAUTH_STATE_VALIDATOR}'|g' $file
  sed -i 's|VITE_APP_DEPLOYED_NAMESPACE_PLACEHOLDER|'${VITE_APP_DEPLOYED_NAMESPACE}'|g' $file

  sed -i 's|VITE_APP_POD_VIEWER_URL_PLACEHOLDER|'${VITE_APP_POD_VIEWER_URL}'|g' $file



done

echo "Starting Nginx"
nginx -g 'daemon off;'
