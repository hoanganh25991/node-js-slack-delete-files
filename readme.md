#Delete files from slack
Base on slack api for [files.delete](https://api.slack.com/methods/files.delete)

Simple setup node js run each day
###Use pm2 to run node as cronjob on server

	pm2 start index.js --name slack_delete_files
[pm2 quickstart](http://pm2.keymetrics.io/docs/usage/quick-start/)