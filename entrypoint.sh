#!/bin/sh

ROOT_DIR=/app

# Replace env vars in files served by NGINX
echo "Replacing environment variables"
for file in $ROOT_DIR/assets/*.js* $ROOT_DIR/index.html;
do
  echo "Processing $file ...";

  sed -i 's|VITE_APP_GITLAB_URL_PLACEHOLDER|'${VITE_APP_GITLAB_URL}'|g' $file
  sed -i 's|VITE_APP_GITLAB_OAUTH_ID_PLACEHOLDER|'${VITE_APP_GITLAB_OAUTH_ID}'|g' $file
  sed -i 's|VITE_APP_GITLAB_GROUP_PATH_PLACEHOLDER|'${VITE_APP_GITLAB_GROUP_PATH}'|g' $file

done

echo "Starting Nginx"
nginx -g 'daemon off;'
