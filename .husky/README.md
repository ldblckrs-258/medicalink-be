# Git Hooks Configuration

Dự án này sử dụng Husky để tự động hóa các kiểm tra chất lượng code thông qua
Git hooks.

## 🚀 Cài đặt

Sau khi clone dự án, chạy lệnh sau để cài đặt dependencies và khởi tạo Git
hooks:

```bash
pnpm install
```

Git hooks sẽ được tự động kích hoạt nhờ script `prepare` trong package.json.

## 📋 Git Hooks Overview

### Pre-commit Hook

**Trigger**: Trước khi commit **Chức năng**:

- ✅ Chạy ESLint và Prettier cho các file đã staged
- ✅ Kiểm tra TypeScript compilation (`npm run build`)
- ✅ Validate và format Prisma schema (nếu có thay đổi)
- ✅ Tự động add lại các file đã được format

### Commit-msg Hook

**Trigger**: Khi tạo commit message **Chức năng**:

- ✅ Kiểm tra format commit message theo chuẩn Conventional Commits
- ✅ Kiểm tra branch name format

### Pre-push Hook

**Trigger**: Trước khi push code **Chức năng**:

- 🚫 Ngăn chặn push trực tiếp lên master branch
- ✅ Chạy full validation (lint, format, build, prisma validate)
- ✅ Chạy test suite

## 📝 Commit Message Format

Sử dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types được hỗ trợ:

- `feat`: Tính năng mới
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance
- `ci`: CI/CD
- `build`: Build system
- `revert`: Revert commit

### Ví dụ:

```bash
git commit -m "feat(auth): add JWT authentication middleware"
git commit -m "fix(api): resolve user registration validation error"
git commit -m "docs: update API documentation for user endpoints"
```

## 🌿 Branch Naming Convention

Branch names phải tuân theo pattern sau:

```
<type>/<description>
```

### Types được hỗ trợ:

- `feature/` - Tính năng mới
- `bugfix/` - Sửa lỗi
- `hotfix/` - Sửa lỗi khẩn cấp
- `release/` - Chuẩn bị release
- `chore/` - Công việc bảo trì
- `docs/` - Cập nhật tài liệu
- `test/` - Thêm/sửa tests
- `refactor/` - Refactor code

### Ví dụ:

```bash
git checkout -b feature/user-authentication
git checkout -b bugfix/login-validation-error
git checkout -b hotfix/security-vulnerability
git checkout -b docs/api-documentation-update
```

## 🔒 Master Branch Protection

- ❌ Không thể push trực tiếp lên master branch
- ✅ Phải tạo feature branch và tạo Pull Request
- ✅ All checks phải pass trước khi merge

## 🛠️ Development Workflow

1. **Tạo feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop và commit**:

   ```bash
   git add .
   git commit -m "feat(module): add new feature description"
   ```

3. **Push branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Tạo Pull Request** để merge vào master

## 🚨 Troubleshooting

### Hook execution failed

Nếu Git hooks fail, kiểm tra:

1. Tất cả dependencies đã được cài đặt: `pnpm install`
2. Code passes lint check: `npm run lint:check`
3. Code passes format check: `npm run format:check`
4. TypeScript compilation successful: `npm run build`
5. Tests pass: `npm run test`
6. Prisma schema valid: `npx prisma validate`

### Bypass hooks (emergency only)

Trong trường hợp khẩn cấp, có thể bypass hooks:

```bash
git commit --no-verify -m "emergency fix"
git push --no-verify
```

**⚠️ Chỉ sử dụng khi thật sự cần thiết!**

## 📊 Scripts Available

```bash
# Chạy tất cả validation
npm run validate

# Chạy pre-commit checks manually
npm run pre-commit

# Chạy pre-push checks manually
npm run pre-push
```

## 🔧 Configuration Files

- `commitlint.config.js` - Cấu hình commit message rules
- `package.json` - Cấu hình lint-staged
- `.husky/` - Git hooks scripts
