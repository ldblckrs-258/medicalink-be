# 🚀 Git Hooks Quick Start Guide

## ✅ Đã triển khai thành công

### 🔧 **Pre-commit Hook**

- ✅ ESLint & Prettier tự động format code
- ✅ TypeScript compilation check
- ✅ Prisma schema validation & formatting

### 📝 **Commit-msg Hook**

- ✅ Conventional Commits validation
- ✅ Branch name format validation

### 🔒 **Pre-push Hook**

- ✅ Master branch protection
- ✅ Full validation pipeline (lint + format + build + tests)

## 📋 **Cách sử dụng**

### ✅ Commit đúng format:

```bash
git commit -m "feat(auth): add user authentication"
git commit -m "fix(api): resolve validation error"
git commit -m "docs: update API documentation"
```

### ✅ Branch naming đúng format:

```bash
git checkout -b feature/user-management
git checkout -b bugfix/login-error
git checkout -b hotfix/security-patch
```

### ❌ Không được phép:

```bash
# Sai commit format
git commit -m "add new feature"

# Sai branch name
git checkout -b my-branch

# Push trực tiếp lên master
git push origin master  # ❌ Bị chặn!
```

## 🛠️ **Workflow đúng**

1. **Tạo feature branch**:

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Develop & commit**:

   ```bash
   git add .
   git commit -m "feat(module): add new feature"
   ```

3. **Push feature branch**:

   ```bash
   git push origin feature/your-feature
   ```

4. **Tạo Pull Request** để merge vào master

## 🚨 **Troubleshooting**

Nếu hooks fail, kiểm tra:

- Code style: `npm run lint:check`
- Format: `npm run format:check`
- Build: `npm run build`
- Tests: `npm run test`
- Prisma: `npx prisma validate`

## 📊 **Scripts có sẵn**

```bash
npm run validate     # Chạy tất cả validation
npm run pre-commit   # Test pre-commit checks
npm run pre-push     # Test pre-push checks
```

**🎉 Git hooks đã được cấu hình thành công!**
