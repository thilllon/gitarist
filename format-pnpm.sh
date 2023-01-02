pnpm add -D husky lint-staged prettier commitlint @commitlint/config-conventional @commitlint/cli commitizen git-cz release-it

# husky https://typicode.github.io/husky/#/
pnpm dlx husky-init
npx npm-add-script --force --key "prepare" --value "husky install && chmod +x .husky/*"
pnpm install

# lint-staged https://github.com/okonet/lint-staged#configuration
echo 'echo "##  .husky/$(basename "$0") (node $(node -v))"' >>.husky/pre-commit
echo "pnpm lint-staged" >>.husky/pre-commit
echo '{
  "./**/src/**/*": ["prettier -w -l", "eslint --fix"]
}' >.lintstagedrc.json

# commitizen https://github.com/commitizen/cz-cli
echo '{
  "path": "cz-conventional-changelog"
}' >.czrc

# commitlint https://github.com/conventional-changelog/commitlint
npx husky add .husky/commit-msg 'pnpm commitlint --edit $1'
echo 'echo "##  .husky/$(basename "$0") (node $(node -v))"' >>.husky/commit-msg
echo 'echo "##  .husky/$(basename "$0") (node $(node -v))"' >>.husky/prepare-commit-msg
echo "module.exports = {extends: ['@commitlint/config-conventional']}" >commitlint.config.js

# prettier
echo '{
  "printWidth": 100,
  "singleQuote": true
}' >.prettierrc.json
echo 'dist' >>.prettierignore
echo 'pnpm-lock.yaml' >>.prettierignore
npx npm-add-script --force --key "format" --value "prettier --write --list-different ."
pnpm format

# release-it https://github.com/release-it/release-it
npx npm-add-script --force --key "release" --value "pnpm format && pnpm lint && pnpm test && pnpm build && release-it"
echo '{
  "git": {
    "commitMessage": "chore: Release v${version}"
  },
  "github": {
    "release": true
  }
}
' >.release-it.json
