# Greener

Push a commit everyday

## Instruction

```sh
# Install `expect`
sudo yum -y install expect
00 08 * * * "./commit.sh $GITHUB_USER $GITHUB_PASSWORD $SLACK_TOKEN"
```

## References

- [Linux crontab](https://jdm.kr/blog/2)
- [Bash 스크립트에 expect 스크립트 넣기](https://zetawiki.com/wiki/Bash_스크립트에_expect_스크립트_넣기)
