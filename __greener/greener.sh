#!/bin/sh

# greener: gitarist 의 shell script 버전

# Reference
# - [Linux crontab](https://jdm.kr/blog/2)
# - [Bash 스크립트에 expect 스크립트 넣기](https://zetawiki.com/wiki/Bash_스크립트에_expect_스크립트_넣기)

# Usage
# 00 08 * * * "./greener.sh $GITHUB_USER $GITHUB_PASSWORD $SLACK_WEBHOOK"

# Install `expect` in linux
sudo yum -y install expect

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
# 	-X 'POST' \
# 	-H 'Content-Type: application/json' \
# 	-d "{\"text\": \"$text\"}"
