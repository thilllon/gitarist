#!/bin/sh

echo "$(date)" >>log
GITHUB_USER=$1
GITHUB_PASSWORD=$2

git add -A
git commit -m "updated"

expect <<EOF
set timeout 10
spawn git push
expect "Username for 'https://github.com':"
	send "$GITHUB_USER\r"
expect "Password for 'https://($GITHUB_USER)@github.com':"
	send "$GITHUB_PASSWORD\r"
expect eof
EOF

mj_hostname=$(hostname)
mj_whoami=$(whoami)

text="[Greener] Pushed 1 commit from $mj_whoami@$mj_hostname , Return: $?"

# curl $SLACK_WEBHOOK \
#   -X 'POST' \
#   -H 'Content-Type: application/json' \
#   -d "{\"text\": \"$text\"}"
